import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export type MarketPriceItem = {
  scientificName: string;
  commonName: string;
  pricePerKg: number;
  currency: string;
  buyerLocation: string;
};

function parseMarketCsv(csvText: string): MarketPriceItem[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const scientificIdx = headers.indexOf('scientific_name');
  const commonIdx = headers.indexOf('common_name');
  const priceIdx = headers.indexOf('price_per_kg');
  const currencyIdx = headers.indexOf('currency');
  const locationIdx = headers.indexOf('buyer_location');

  const results: MarketPriceItem[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Split by comma ignoring potential whitespace
    const cols = line.split(',').map((c) => c.trim());
    
    // Extract values safely
    const scientificName = cols[scientificIdx] || cols[0] || 'Unknown Species';
    const commonName = cols[commonIdx] || cols[1] || scientificName;
    const rawPrice = parseFloat(cols[priceIdx] || cols[2] || '0');
    const pricePerKg = isNaN(rawPrice) ? 0 : rawPrice;
    const currency = cols[currencyIdx] || cols[3] || 'INR';
    const buyerLocation = cols[locationIdx] || cols[4] || 'India';

    results.push({
      scientificName,
      commonName,
      pricePerKg,
      currency,
      buyerLocation,
    });
  }

  return results;
}

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'market-prices-fallback.csv');
    const csvContent = await fs.readFile(filePath, 'utf-8');
    const prices = parseMarketCsv(csvContent);

    return NextResponse.json({
      data: prices,
      meta: {
        source: 'csv_fallback',
        fetchedAt: new Date().toISOString(),
        total: prices.length,
      },
    });
  } catch (error) {
    console.error('Failed to parse market CSV:', error);
    return NextResponse.json(
      { error: 'Failed to load market prices from CSV' },
      { status: 500 }
    );
  }
}
