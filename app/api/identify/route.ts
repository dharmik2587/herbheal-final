import { NextResponse } from 'next/server';
import { identifyPlant, mapToLocalHerb } from '@/lib/plant-id';
import { generatePlantInsight, saveScanEvent } from '@/lib/external-services';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    if (!process.env.PLANT_ID_API_KEY) {
      return NextResponse.json({ error: 'Plant.id API key is not configured' }, { status: 500 });
    }

    // Step 1: Call Plant.id API for real-time identification
    const plantIdResult = await identifyPlant(image);

    const suggestions = plantIdResult.result?.classification?.suggestions || [];
    let localMatch = null;
    let insight = null;

    if (suggestions.length > 0) {
      const topMatch = suggestions[0];
      const scientificName = topMatch.name;

      if (scientificName) {
        // Step 2: Check if identified plant exists in our local Ayurvedic database
        localMatch = await mapToLocalHerb(scientificName);

        // Step 3: Generate AI insight using Gemini with the comprehensive system prompt
        try {
          insight = await generatePlantInsight(
            scientificName,
            topMatch.details?.common_names || [],
            localMatch?.name || null
          );
        } catch (error) {
          console.warn('AI insight generation failed:', error);
        }
      }
    }

    // Step 4: Log the scan event to Firebase for analytics
    try {
      await saveScanEvent({
        source: 'plant_id',
        scientificName: suggestions[0]?.name || null,
        confidence: suggestions[0]?.probability || null,
        hasLocalMatch: Boolean(localMatch),
        commonNames: suggestions[0]?.details?.common_names?.slice(0, 3) || [],
        taxonomy: suggestions[0]?.details?.taxonomy || null,
        diseaseDetected: plantIdResult.result?.disease?.suggestions?.[0]?.name || null,
      });
    } catch {
      // Firebase persistence is optional; do not block the user experience.
    }

    return NextResponse.json({
      result: plantIdResult,
      localMatch,
      insight,
    });
  } catch (error: any) {
    console.error('Identification API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to identify plant' },
      { status: 500 }
    );
  }
}
