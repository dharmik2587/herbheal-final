import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const herbQuery = searchParams.get('herb')?.toLowerCase() || '';
    const drugQuery = searchParams.get('drug')?.toLowerCase() || '';
    const listQuery = searchParams.get('list');

    if (listQuery === 'drugs') {
      const rows = await prisma.drugInteraction.findMany({
        distinct: ['drug'],
        select: { drug: true },
        orderBy: { drug: 'asc' },
      });
      return NextResponse.json({ data: rows.map(r => r.drug) });
    }

    if (listQuery === 'herbs') {
      const rows = await prisma.drugInteraction.findMany({
        distinct: ['herbCommon'],
        select: { herbCommon: true },
        orderBy: { herbCommon: 'asc' },
      });
      return NextResponse.json({ data: rows.map(r => r.herbCommon) });
    }

    const where =
      herbQuery || drugQuery
        ? {
            AND: [
              herbQuery
                ? {
                    OR: [
                      { herbCommon: { contains: herbQuery } },
                      { herb: { scientificName: { contains: herbQuery } } },
                    ],
                  }
                : {},
              drugQuery ? { drug: { contains: drugQuery } } : {},
            ],
          }
        : undefined;

    const interactions = await prisma.drugInteraction.findMany({
      where,
      take: where ? undefined : 12,
      orderBy: { herbCommon: 'asc' },
    });

    const [herbs, drugs] = await Promise.all([
      prisma.drugInteraction.findMany({ distinct: ['herbCommon'], select: { herbCommon: true } }),
      prisma.drugInteraction.findMany({ distinct: ['drug'], select: { drug: true } }),
    ]);

    return NextResponse.json({
      data: interactions,
      meta: {
        total: interactions.length,
        herbs: herbs.map(h => h.herbCommon),
        drugs: drugs.map(d => d.drug),
      },
    });
  } catch (error) {
    console.error('Failed to fetch interactions:', error);
    return NextResponse.json({ error: 'Failed to fetch interactions' }, { status: 500 });
  }
}
