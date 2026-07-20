import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

interface Interaction {
  herb: string;
  herbCommon: string;
  drug: string;
  drugClass: string;
  severity: 'mild' | 'moderate' | 'severe';
  risk: string;
  mechanism: string;
  recommendation: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const herbQuery = searchParams.get('herb')?.toLowerCase() || '';
    const drugQuery = searchParams.get('drug')?.toLowerCase() || '';
    const listQuery = searchParams.get('list');

    const filePath = path.join(process.cwd(), 'public', 'data', 'interactions.json');
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const interactions: Interaction[] = JSON.parse(fileContent);

    // Handle list queries first (e.g. ?list=drugs for the drug dropdown)
    if (listQuery === 'drugs') {
      const distinctDrugs = Array.from(new Set(interactions.map((i) => i.drug))).sort();
      return NextResponse.json({ data: distinctDrugs });
    }

    if (listQuery === 'herbs') {
      const distinctHerbs = Array.from(new Set(interactions.map((i) => i.herbCommon))).sort();
      return NextResponse.json({ data: distinctHerbs });
    }

    if (!herbQuery && !drugQuery) {
      return NextResponse.json({
        data: interactions.slice(0, 12),
        meta: {
          total: interactions.length,
          herbs: Array.from(new Set(interactions.map((i) => i.herbCommon))),
          drugs: Array.from(new Set(interactions.map((i) => i.drug))),
        },
      });
    }

    const filtered = interactions.filter((interaction) => {
      const matchHerb = herbQuery
        ? interaction.herb.toLowerCase().includes(herbQuery) ||
          interaction.herbCommon.toLowerCase().includes(herbQuery)
        : true;
      const matchDrug = drugQuery ? interaction.drug.toLowerCase().includes(drugQuery) : true;
      return matchHerb && matchDrug;
    });

    const uniqueHerbs = Array.from(new Set(filtered.map(i => i.herbCommon)));
    const uniqueDrugs = Array.from(new Set(filtered.map(i => i.drug)));

    return NextResponse.json({
      data: filtered,
      meta: {
        total: filtered.length,
        herbs: uniqueHerbs,
        drugs: uniqueDrugs,
      },
    });
  } catch (error) {
    console.error('Failed to fetch interactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interactions' },
      { status: 500 }
    );
  }
}
