import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { syncMarketPrices } from '@/lib/market-sync';

export const dynamic = 'force-dynamic';

/**
 * GET /api/market-prices
 * Reads from the MarketPrice table (kept fresh by syncMarketPrices(), which
 * runs on a schedule — see app/api/sync/daily/route.ts and vercel.json).
 * No more parsing a CSV on every request.
 */
export async function GET() {
  try {
    const prices = await prisma.marketPrice.findMany({
      include: { herb: { select: { name: true, scientificName: true } } },
      orderBy: { commonName: 'asc' },
    });

    if (prices && prices.length > 0) {
      return NextResponse.json({
        data: prices.map(p => ({
          scientificName: p.scientificName,
          commonName: p.commonName,
          pricePerKg: p.pricePerKg,
          currency: p.currency,
          buyerLocation: p.buyerLocation,
        })),
        meta: {
          source: prices[0]?.source ?? 'database',
          fetchedAt: prices[0]?.lastUpdated?.toISOString() || new Date().toISOString(),
        },
      });
    }
  } catch (error) {
    console.warn('Prisma market read skipped, falling back to CSV:', error);
  }

  // Fallback to /api/market CSV endpoint logic
  try {
    const fs = await import('fs/promises');
    const path = await import('path');
    const filePath = path.join(process.cwd(), 'public', 'data', 'market-prices-fallback.csv');
    const csvContent = await fs.readFile(filePath, 'utf-8');
    const lines = csvContent.trim().split(/\r?\n/);
    const data = lines.slice(1).filter(Boolean).map(line => {
      const parts = line.split(',').map(s => s.trim());
      return {
        scientificName: parts[0] || 'Unknown',
        commonName: parts[1] || parts[0] || 'Herb',
        pricePerKg: parseFloat(parts[2]) || 0,
        currency: parts[3] || 'INR',
        buyerLocation: parts[4] || 'India',
      };
    });

    return NextResponse.json({
      data,
      meta: {
        source: 'csv_fallback',
        fetchedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error('Failed to read market prices CSV:', err);
    return NextResponse.json({ error: 'Failed to fetch market prices' }, { status: 500 });
  }
}

/**
 * POST /api/market-prices — triggers an on-demand sync (also runs on the
 * daily cron). Protect with CRON_SECRET the same way /api/sync/daily does
 * if you expose this publicly.
 */
export async function POST(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const result = await syncMarketPrices();
  return NextResponse.json({ ok: true, ...result });
}
