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

    return NextResponse.json({
      data: prices.map(p => ({
        scientificName: p.scientificName,
        commonName: p.commonName,
        pricePerKg: p.pricePerKg,
        currency: p.currency,
        buyerLocation: p.buyerLocation,
      })),
      meta: {
        source: prices[0]?.source ?? 'none',
        lastUpdated: prices[0]?.lastUpdated ?? null,
      },
    });
  } catch (error) {
    console.error('Failed to read market prices:', error);
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
