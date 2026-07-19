import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { herbUpdateSchema } from '@/lib/validation';
import { parseJsonArray } from '@/lib/helpers';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const herb = await prisma.herb.findUnique({
      where: { id: params.id },
      include: {
        symptoms: { include: { symptom: true } },
        researchLogs: { orderBy: { fetchedAt: 'desc' }, take: 10 },
      },
    });

    if (!herb) {
      return NextResponse.json({ error: 'Herb not found' }, { status: 404 });
    }

    // Parse JSON-encoded array fields before returning
    const herbWithParsed = {
      ...herb,
      ayurvedicProperties: parseJsonArray(herb.ayurvedicProperties),
      taste: parseJsonArray(herb.taste),
      doshas: parseJsonArray(herb.doshas),
      organs: parseJsonArray(herb.organs),
      contraindications: parseJsonArray(herb.contraindications),
      knownCompounds: parseJsonArray(herb.knownCompounds),
      compounds: herb.compounds ? JSON.parse(herb.compounds) : null,
    };

    return NextResponse.json(herbWithParsed);
  } catch (error) {
    console.error('GET /api/herbs/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch herb' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const parsed = herbUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid herb payload', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Serialize incoming array fields to JSON strings for SQLite storage
    const data: Record<string, unknown> = { ...parsed.data };
    const arrayFields = [
      'ayurvedicProperties',
      'taste',
      'doshas',
      'organs',
      'contraindications',
      'knownCompounds',
    ] as const;

    for (const field of arrayFields) {
      if (data[field] !== undefined) {
        data[field] = JSON.stringify(data[field]);
      }
    }

    const herb = await prisma.herb.update({ where: { id: params.id }, data });
    return NextResponse.json(herb);
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Herb not found' }, { status: 404 });
    }
    console.error('PUT /api/herbs/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update herb' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.herb.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === 'P2025') {
      return NextResponse.json({ error: 'Herb not found' }, { status: 404 });
    }
    console.error('DELETE /api/herbs/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete herb' }, { status: 500 });
  }
}
