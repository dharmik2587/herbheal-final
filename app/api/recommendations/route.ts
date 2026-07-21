import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { recommendationRequestSchema } from '@/lib/validation';
import { parseJsonArray } from '@/lib/helpers';

export const dynamic = 'force-dynamic';

const KNOWN_KEYWORDS = [
  'headache', 'nausea', 'acidity', 'constipation', 'diarrhea', 'joint pain', 'skin irritation',
  'acne', 'sore throat', 'allergies', 'low immunity', 'high blood pressure', 'diabetes',
  'weight loss', 'hair fall', 'dandruff', 'menstrual cramps', 'depression', 'memory loss',
  'eye strain', 'wound healing', 'arthritis', 'liver detox', 'respiratory issues', 'migraine',
  'stress', 'anxiety', 'fatigue', 'inflammation', 'pain', 'digestive issues', 'insomnia',
  'cold', 'cough', 'fever'
];

function fisherYatesShuffle<T>(arr: T[]): T[] {
  const array = [...arr];
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

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

    // Check if input symptoms match any known keywords
    const hasKnownMatch = symptoms.some((input) => {
      const lower = input.trim().toLowerCase();
      return KNOWN_KEYWORDS.some((kw) => lower.includes(kw) || kw.includes(lower));
    });

    let allHerbs: any[] = [];
    try {
      allHerbs = await prisma.herb.findMany({
        include: { symptoms: { include: { symptom: true } } },
      });
    } catch {
      allHerbs = [];
    }

    // If NO match against any known symptom keyword, return 5 random herbs freshly picked using Math.random()
    if (!hasKnownMatch || allHerbs.length === 0) {
      const shuffled = fisherYatesShuffle(allHerbs);
      const randomFive = shuffled.slice(0, 5).map((herb) => ({
        id: herb.id,
        name: herb.name,
        scientificName: herb.scientificName,
        description: herb.description,
        imageUrl: herb.imageUrl,
        doshas: parseJsonArray(herb.doshas),
        score: Math.floor(Math.random() * 5) + 5,
        matchedSymptoms: symptoms.map((s) => ({ name: s, strength: 5 })),
        doshaMatch: false,
        isRandomFallback: true,
      }));

      return NextResponse.json({
        data: randomFive,
        meta: { requested: symptoms, dosha, fallback: 'random_shuffle' },
      });
    }

    // Standard matching logic
    const matchedSymptomNames = symptoms.map((s) => s.toLowerCase());

    const DOSHA_BONUS = 5;

    const ranked = allHerbs
      .map((herb) => {
        const matchedSymptoms = herb.symptoms.filter((hs: any) =>
          matchedSymptomNames.some((s) =>
            hs.symptom.name.toLowerCase().includes(s) || s.includes(hs.symptom.name.toLowerCase())
          )
        );

        const symptomScore = matchedSymptoms.reduce((sum: number, hs: any) => sum + hs.strength, 0);
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
          matchedSymptoms: matchedSymptoms.map((hs: any) => ({
            name: hs.symptom.name,
            strength: hs.strength,
          })),
          doshaMatch,
        };
      })
      .filter((h) => h.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // If no ranked matches found despite keyword check, fallback to 5 random herbs
    if (ranked.length === 0) {
      const shuffled = fisherYatesShuffle(allHerbs);
      const randomFive = shuffled.slice(0, 5).map((herb) => ({
        id: herb.id,
        name: herb.name,
        scientificName: herb.scientificName,
        description: herb.description,
        imageUrl: herb.imageUrl,
        doshas: parseJsonArray(herb.doshas),
        score: Math.floor(Math.random() * 5) + 5,
        matchedSymptoms: symptoms.map((s) => ({ name: s, strength: 5 })),
        doshaMatch: false,
        isRandomFallback: true,
      }));

      return NextResponse.json({
        data: randomFive,
        meta: { requested: symptoms, dosha, fallback: 'random_shuffle' },
      });
    }

    return NextResponse.json({ data: ranked, meta: { requested: symptoms, dosha } });
  } catch (error) {
    console.error('POST /api/recommendations error:', error);
    return NextResponse.json({ error: 'Failed to compute recommendations' }, { status: 500 });
  }
}
