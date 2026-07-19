import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const symptoms = await prisma.symptom.findMany({
      include: { _count: { select: { herbs: true } } },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(symptoms);
  } catch (error) {
    console.error('GET /api/symptoms error:', error);
    return NextResponse.json({ error: 'Failed to fetch symptoms' }, { status: 500 });
  }
}
