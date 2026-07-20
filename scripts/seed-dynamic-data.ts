/**
 * One-time migration: moves the two remaining hardcoded data sources
 * (public/data/interactions.json and public/data/market-prices-fallback.csv)
 * into real Prisma tables (DrugInteraction, MarketPrice), so
 * app/api/interactions and app/api/market-prices can read from the database
 * like everything else instead of reading static files on every request.
 *
 * Run with: npx tsx scripts/seed-dynamic-data.ts
 * (after `npx prisma db push` has created the new tables)
 *
 * Safe to re-run — uses upsert throughout.
 */
import fs from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface RawInteraction {
  herb: string; // scientific name, matches Herb.scientificName
  herbCommon: string;
  drug: string;
  drugClass: string;
  severity: "mild" | "moderate" | "severe";
  risk: string;
  mechanism: string;
  recommendation: string;
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n");
  const headers = lines[0].split(",").map(h => h.trim());
  return lines.slice(1).filter(Boolean).map(line => {
    const values = line.split(",").map(v => v.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

async function findHerbByScientific(scientific: string) {
  // Prisma's `contains` (not `equals`) because a few entries in the JSON use
  // a slightly different string than what's in Herb.scientificName (case,
  // trailing text). Exact match first, then fall back to contains.
  const exact = await prisma.herb.findFirst({ where: { scientificName: scientific } });
  if (exact) return exact;
  return prisma.herb.findFirst({ where: { scientificName: { contains: scientific } } });
}

async function seedInteractions() {
  const filePath = path.join(process.cwd(), "public", "data", "interactions.json");
  const raw: RawInteraction[] = JSON.parse(await fs.readFile(filePath, "utf-8"));

  let matched = 0;
  let unmatched: string[] = [];

  for (const i of raw) {
    const herb = await findHerbByScientific(i.herb);
    if (!herb) {
      unmatched.push(i.herb);
      continue;
    }
    await prisma.drugInteraction.upsert({
      where: { herbId_drug: { herbId: herb.id, drug: i.drug } },
      update: {
        herbCommon: i.herbCommon,
        drugClass: i.drugClass,
        severity: i.severity,
        risk: i.risk,
        mechanism: i.mechanism,
        recommendation: i.recommendation
      },
      create: {
        herbId: herb.id,
        herbCommon: i.herbCommon,
        drug: i.drug,
        drugClass: i.drugClass,
        severity: i.severity,
        risk: i.risk,
        mechanism: i.mechanism,
        recommendation: i.recommendation
      }
    });
    matched++;
  }

  console.log(`✅ Interactions migrated: ${matched}/${raw.length}`);
  if (unmatched.length) {
    console.warn(
      `⚠️  ${unmatched.length} interaction(s) reference herbs not found in the DB ` +
      `(check spelling against Herb.scientificName): ${unmatched.join(", ")}`
    );
  }
}

async function seedMarketPrices() {
  const filePath = path.join(process.cwd(), "public", "data", "market-prices-fallback.csv");
  const rows = parseCsv(await fs.readFile(filePath, "utf-8"));

  let matched = 0;
  const unmatched: string[] = [];

  for (const row of rows) {
    const herb = await findHerbByScientific(row.scientific_name);
    if (!herb) {
      unmatched.push(row.scientific_name);
      continue;
    }
    await prisma.marketPrice.upsert({
      where: { herbId: herb.id },
      update: {
        scientificName: row.scientific_name,
        commonName: row.common_name,
        pricePerKg: parseFloat(row.price_per_kg) || 0,
        currency: row.currency || "INR",
        buyerLocation: row.buyer_location,
        source: "seed"
      },
      create: {
        herbId: herb.id,
        scientificName: row.scientific_name,
        commonName: row.common_name,
        pricePerKg: parseFloat(row.price_per_kg) || 0,
        currency: row.currency || "INR",
        buyerLocation: row.buyer_location,
        source: "seed"
      }
    });
    matched++;
  }

  console.log(`✅ Market prices migrated: ${matched}/${rows.length}`);
  if (unmatched.length) {
    console.warn(`⚠️  ${unmatched.length} price row(s) had no matching herb: ${unmatched.join(", ")}`);
  }
}

async function main() {
  await seedInteractions();
  await seedMarketPrices();
  console.log(
    "🎉 Done. app/api/interactions and app/api/market-prices have been " +
    "updated to read from these tables — the old JSON/CSV files are now " +
    "only used by this migration script and can eventually be deleted."
  );
}

main()
  .catch(e => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
