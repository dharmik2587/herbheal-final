import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { parseCSVToMarketPrices } from "@/lib/market-prices";

/**
 * Pulls the latest prices (Google Sheet if configured, else the bundled
 * fallback CSV) and writes them into the MarketPrice table, matched to a
 * Herb by scientificName. This replaces re-fetching + re-parsing a CSV on
 * every single request to /api/market-prices — the API route now just
 * reads from Postgres/SQLite, and this function is what keeps that table
 * fresh (call it from a cron, same pattern as lib/daily-sync.ts).
 */
export async function syncMarketPrices(): Promise<{ updated: number; source: string }> {
  const sheetUrl = process.env.GOOGLE_SHEET_CSV_URL;
  let csvText: string | null = null;
  let source = "fallback";

  if (sheetUrl) {
    try {
      const res = await fetch(sheetUrl, { headers: { "User-Agent": "HerbHealCompass/1.0" } });
      if (res.ok) {
        csvText = await res.text();
        source = "google_sheets";
      }
    } catch (err) {
      console.warn("Google Sheets price fetch failed, using fallback CSV:", err);
    }
  }

  if (!csvText) {
    const fallbackPath = path.join(process.cwd(), "public", "data", "market-prices-fallback.csv");
    csvText = await fs.readFile(fallbackPath, "utf8");
  }

  const rows = parseCSVToMarketPrices(csvText);
  let updated = 0;

  for (const row of rows) {
    const herb = await prisma.herb.findFirst({
      where: { scientificName: { contains: row.scientificName } }
    });
    if (!herb) continue;

    await prisma.marketPrice.upsert({
      where: { herbId: herb.id },
      update: {
        scientificName: row.scientificName,
        commonName: row.commonName,
        pricePerKg: row.pricePerKg,
        currency: row.currency,
        buyerLocation: row.buyerLocation,
        source
      },
      create: {
        herbId: herb.id,
        scientificName: row.scientificName,
        commonName: row.commonName,
        pricePerKg: row.pricePerKg,
        currency: row.currency,
        buyerLocation: row.buyerLocation,
        source
      }
    });
    updated++;
  }

  return { updated, source };
}
