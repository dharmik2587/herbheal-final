import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { parseCSVToMarketPrices, MarketPrice } from '../../../lib/market-prices';

export const dynamic = 'force-dynamic';

type CachedData = {
  data: MarketPrice[];
  meta: {
    source: 'google_sheets' | 'fallback';
    fetchedAt: string;
  };
};

let cache: CachedData | null = null;
let lastFetchTime = 0;
const CACHE_DURATION_MS = 5000;

export async function GET() {
  const now = Date.now();

  if (cache && now - lastFetchTime < CACHE_DURATION_MS) {
    return NextResponse.json(cache);
  }

  let data: MarketPrice[] = [];
  let source: 'google_sheets' | 'fallback' = 'fallback';

  const sheetUrl = process.env.GOOGLE_SHEET_CSV_URL;

  if (sheetUrl) {
    try {
      const res = await fetch(sheetUrl, { next: { revalidate: 5 }, headers: { 'User-Agent': 'HerbHealCompass/1.0' } });
      if (res.ok) {
        const csvText = await res.text();
        data = parseCSVToMarketPrices(csvText);
        if (data.length > 0) {
          source = 'google_sheets';
        }
      }
    } catch (error) {
      console.error('Failed to fetch from Google Sheets:', error);
    }
  }

  if (data.length === 0 || source === 'fallback') {
    try {
      const fallbackPath = path.join(process.cwd(), 'public', 'data', 'market-prices-fallback.csv');
      const csvText = await fs.readFile(fallbackPath, 'utf8');
      data = parseCSVToMarketPrices(csvText);
      source = 'fallback';
    } catch (error) {
      console.error('Failed to read fallback CSV:', error);
    }
  }

  cache = {
    data,
    meta: {
      source,
      fetchedAt: new Date().toISOString()
    }
  };
  lastFetchTime = now;

  return NextResponse.json(cache);
}
