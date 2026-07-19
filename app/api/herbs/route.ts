import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { herbCreateSchema } from '@/lib/validation';
import { parseJsonArray } from '@/lib/helpers';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symptom = searchParams.get('symptom');
    const search = searchParams.get('q');
    const dosha = searchParams.get('dosha');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const skip = Math.max(parseInt(searchParams.get('skip') || '0', 10), 0);

    const where: any = {};

    if (symptom) {
      const allSymptoms = await prisma.symptom.findMany();
      const matchedSymptom = allSymptoms.find(
        (s) => s.name.toLowerCase() === symptom.toLowerCase()
      );
      if (matchedSymptom) {
        where.symptoms = { some: { symptomId: matchedSymptom.id } };
      } else {
        where.symptoms = { some: { symptomId: 'non-existent-id' } };
      }
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { scientificName: { contains: search } },
        { description: { contains: search } },
      ];
    }
    if (dosha) {
      // SQLite stores doshas as a JSON string e.g. '["Vata","Kapha"]'.
      // Use `contains` to search within the serialized string.
      const normalized = dosha.charAt(0).toUpperCase() + dosha.slice(1).toLowerCase();
      where.doshas = { contains: normalized };
    }

    const [herbs, total] = await Promise.all([
      prisma.herb.findMany({
        where,
        include: {
          symptoms: { include: { symptom: true } },
          researchLogs: { orderBy: { fetchedAt: 'desc' }, take: 3 },
        },
        orderBy: { name: 'asc' },
        take: limit,
        skip,
      }),
      prisma.herb.count({ where }),
    ]);

    // Parse JSON-encoded array fields before returning
    const herbsWithParsed = herbs.map((herb) => ({
      ...herb,
      ayurvedicProperties: parseJsonArray(herb.ayurvedicProperties),
      taste: parseJsonArray(herb.taste),
      doshas: parseJsonArray(herb.doshas),
      organs: parseJsonArray(herb.organs),
      contraindications: parseJsonArray(herb.contraindications),
      knownCompounds: parseJsonArray(herb.knownCompounds),
      compounds: herb.compounds ? JSON.parse(herb.compounds) : null,
    }));

    return NextResponse.json({
      data: herbsWithParsed,
      meta: { total, limit, skip, hasMore: skip + herbs.length < total },
    });
  } catch (error) {
    console.error('GET /api/herbs error:', error);
    return NextResponse.json({ error: 'Failed to fetch herbs' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = herbCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid herb payload', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Serialize array fields to JSON strings for SQLite
    const data = {
      ...parsed.data,
      ayurvedicProperties: JSON.stringify(parsed.data.ayurvedicProperties ?? []),
      taste: JSON.stringify(parsed.data.taste ?? []),
      doshas: JSON.stringify(parsed.data.doshas ?? []),
      organs: JSON.stringify(parsed.data.organs ?? []),
      contraindications: JSON.stringify(parsed.data.contraindications ?? []),
      knownCompounds: JSON.stringify(parsed.data.knownCompounds ?? []),
    };

    const herb = await prisma.herb.create({ data });
    return NextResponse.json(herb, { status: 201 });
  } catch (error) {
    console.error('POST /api/herbs error:', error);
    return NextResponse.json({ error: 'Failed to create herb' }, { status: 500 });
  }
}
