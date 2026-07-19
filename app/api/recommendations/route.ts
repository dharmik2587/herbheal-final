import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recommendationRequestSchema } from '@/lib/validation';
import { parseJsonArray } from '@/lib/helpers';

// This endpoint is the actual "Compass" in HerbHeal Compass: given a set of
// symptoms (and optionally a dosha), rank herbs by relevance. Scores are
// weighted by HerbSymptom.strength with a modest dosha-match bonus, and the
// response includes a breakdown so the UI is explainable rather than a black box.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = recommendationRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', issues: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { symptoms, dosha, limit } = parsed.data;

    const allSymptoms = await prisma.symptom.findMany();
    const matchedSymptomIds = allSymptoms
      .filter((s) => symptoms.some((input) => input.toLowerCase() === s.name.toLowerCase()))
      .map((s) => s.id);

    const herbs = await prisma.herb.findMany({
      where: {
        symptoms: {
          some: {
            symptomId: { in: matchedSymptomIds },
          },
        },
      },
      include: { symptoms: { include: { symptom: true } } },
    });

    const DOSHA_BONUS = 5;

    const ranked = herbs
      .map((herb) => {
        const matchedSymptoms = herb.symptoms.filter((hs) =>
          symptoms.some((s) => s.toLowerCase() === hs.symptom.name.toLowerCase())
        );

        const symptomScore = matchedSymptoms.reduce((sum, hs) => sum + hs.strength, 0);
        // Parse the JSON-encoded doshas string before checking includes
        const doshaMatch = dosha ? parseJsonArray(herb.doshas).includes(dosha) : false;
        const score = symptomScore + (doshaMatch ? DOSHA_BONUS : 0);

        return {
          id: herb.id,
          name: herb.name,
          scientificName: herb.scientificName,
          description: herb.description,
          imageUrl: herb.imageUrl,
          doshas: parseJsonArray(herb.doshas),
          score,
          matchedSymptoms: matchedSymptoms.map((hs) => ({
            name: hs.symptom.name,
            strength: hs.strength,
          })),
          doshaMatch,
        };
      })
      .filter((h) => h.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return NextResponse.json({ data: ranked, meta: { requested: symptoms, dosha } });
  } catch (error) {
    console.error('POST /api/recommendations error:', error);
    return NextResponse.json({ error: 'Failed to compute recommendations' }, { status: 500 });
  }
}
