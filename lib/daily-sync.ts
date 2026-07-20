import { prisma } from './prisma';
import { fetchWikipediaSummary } from './wikipedia';
import { fetchAllCompounds } from './pubchem';
import { fetchPubMedResearch } from './pubmed';
import { parseJsonArray } from './helpers';

const DELAY_MS = 800; // spacing between herbs, on top of per-source delays

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface SyncSummary {
  herbsProcessed: number;
  fieldsUpdated: number;
  researchLogsAdded: number;
  errors: { herb: string; message: string }[];
  marketPrices?: { updated: number; source: string };
}

export async function runDailySync(): Promise<SyncSummary> {
  const startedAt = new Date();
  console.log(`🔄 Daily sync started at ${startedAt.toISOString()}`);

  const herbs = await prisma.herb.findMany();
  const summary: SyncSummary = {
    herbsProcessed: 0,
    fieldsUpdated: 0,
    researchLogsAdded: 0,
    errors: [],
  };

  for (const herb of herbs) {
    try {
      // 1. Wikipedia: description + image
      const wiki = await fetchWikipediaSummary(herb.name);
      const dataToUpdate: Record<string, unknown> = { lastSyncedAt: new Date() };

      if (wiki.extract) {
        dataToUpdate.description = wiki.extract;
        summary.fieldsUpdated++;
      }
      if (wiki.imageUrl && !herb.imageUrl) {
        dataToUpdate.imageUrl = wiki.imageUrl;
        summary.fieldsUpdated++;
      }

      // 2. PubChem: only the herb's curated compound names, never the herb name itself
      // Parse the JSON-encoded knownCompounds string for SQLite
      const compoundsList = parseJsonArray(herb.knownCompounds);
      if (compoundsList.length > 0) {
        const compounds = await fetchAllCompounds(compoundsList);
        if (compounds.length > 0) {
          dataToUpdate.compounds = JSON.stringify(compounds);
          summary.fieldsUpdated++;
        }
      }

      await prisma.herb.update({ where: { id: herb.id }, data: dataToUpdate });

      // 3. PubMed: append new research citations (never overwrite old ones)
      const papers = await fetchPubMedResearch(herb.name, process.env.NCBI_API_KEY);
      for (const paper of papers) {
        const created = await prisma.researchLog.upsert({
          where: {
            herbId_source_url: { herbId: herb.id, source: 'PubMed', url: paper.url },
          },
          update: {}, // already logged — don't touch fetchedAt
          create: {
            herbId: herb.id,
            source: 'PubMed',
            title: paper.title,
            url: paper.url,
          },
        });
        if (created.fetchedAt.getTime() >= startedAt.getTime()) {
          summary.researchLogsAdded++;
        }
      }

      summary.herbsProcessed++;
      console.log(`✅ Synced: ${herb.name}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`⚠️ Sync failed for ${herb.name}:`, message);
      summary.errors.push({ herb: herb.name, message });
    }

    await sleep(DELAY_MS);
  }

  console.log(
    `🎉 Daily sync finished: ${summary.herbsProcessed} herbs, ` +
      `${summary.researchLogsAdded} new research logs, ${summary.errors.length} errors`
  );

  // Runs on the same cron as the herb enrichment above, instead of needing
  // a second scheduled trigger — one vercel.json cron entry covers both.
  try {
    const { syncMarketPrices } = await import('./market-sync');
    summary.marketPrices = await syncMarketPrices();
    console.log(
      `💰 Market prices synced: ${summary.marketPrices.updated} updated (source: ${summary.marketPrices.source})`
    );
  } catch (err) {
    console.error('⚠️ Market price sync failed:', err);
  }

  return summary;
}
