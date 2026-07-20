import { NextResponse } from 'next/server';
import { identifyPlantWithStrategy, mapToLocalHerb, PlantIdResponse } from '@/lib/plant-id';
import {
  generatePlantInsight,
  saveScanEvent,
  identifyPlantWithGeminiVision,
  GeminiVisionIdentification,
} from '@/lib/external-services';

export const dynamic = 'force-dynamic';

/**
 * Wraps a custom-model prediction in the same envelope shape Plant.id
 * returns, so the existing frontend (components/IdentificationResult.tsx,
 * which reads result.result.classification.suggestions[...]) keeps working
 * unmodified regardless of which provider actually answered.
 */
function syntheticPlantIdEnvelope(scientific: string, commonNames: string[], confidence: number): PlantIdResponse {
  return {
    access_token: '',
    model_version: 'herbheal-custom-model',
    custom_id: null,
    input: { latitude: null, longitude: null, similar_images: false, health: 'none', images: [], datetime: new Date().toISOString() },
    result: {
      is_plant: { probability: confidence, binary: true, threshold: 0.5 },
      classification: {
        suggestions: [
          {
            id: 'custom-model-0',
            name: scientific,
            probability: confidence,
            similar_images: [],
            details: { common_names: commonNames },
          },
        ],
      },
    },
    status: 'COMPLETED',
    sla_compliant_client: true,
    sla_compliant_system: true,
    created: Date.now(),
    completed: Date.now(),
  };
}

/**
 * Wraps a Gemini Vision result in the Plant.id envelope, enriched with
 * Ayurvedic fields that the existing UI can render.
 */
function geminiVisionToPlantIdEnvelope(vision: GeminiVisionIdentification): PlantIdResponse {
  return {
    access_token: '',
    model_version: `gemini-vision/${vision.model}`,
    custom_id: null,
    input: { latitude: null, longitude: null, similar_images: false, health: 'none', images: [], datetime: new Date().toISOString() },
    result: {
      is_plant: { probability: vision.confidence, binary: vision.isPlant, threshold: 0.5 },
      classification: {
        suggestions: [
          {
            id: 'gemini-vision-0',
            name: vision.scientificName,
            probability: vision.confidence,
            similar_images: [],
            details: {
              common_names: vision.commonNames,
              description: vision.description
                ? { value: vision.description, citation: 'Gemini Vision AI', license_name: 'AI Generated', license_url: '' }
                : undefined,
              taxonomy: vision.family ? { family: vision.family } : undefined,
            },
          },
        ],
      },
    },
    status: 'COMPLETED',
    sla_compliant_client: true,
    sla_compliant_system: true,
    created: Date.now(),
    completed: Date.now(),
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    const strategy = process.env.IDENTIFY_STRATEGY ?? 'api';
    const hasPlantId = Boolean(process.env.PLANT_ID_API_KEY);
    const hasGemini  = Boolean(process.env.GEMINI_API_KEY);

    if (strategy === 'api' && !hasPlantId && !hasGemini) {
      return NextResponse.json(
        { error: 'No identification service configured. Set PLANT_ID_API_KEY or GEMINI_API_KEY.' },
        { status: 500 }
      );
    }

    // -----------------------------------------------------------------------
    // Step 1: Run Plant.id + Gemini Vision in parallel for speed
    // -----------------------------------------------------------------------
    const [strategyResultRaw, geminiVision] = await Promise.allSettled([
      hasPlantId ? identifyPlantWithStrategy(image) : Promise.reject(new Error('Plant.id not configured')),
      hasGemini  ? identifyPlantWithGeminiVision(image) : Promise.resolve(null),
    ]);

    const strategyResult = strategyResultRaw.status === 'fulfilled' ? strategyResultRaw.value : null;
    const geminiResult   = geminiVision.status === 'fulfilled' ? geminiVision.value : null;

    // -----------------------------------------------------------------------
    // Step 2: Pick the best source
    //   - If Plant.id succeeded and confidence >= 0.5 → use Plant.id (primary)
    //   - If Plant.id failed or confidence < 0.5 → fall back to Gemini Vision
    //   - Always surface Gemini Vision separately in the response for the UI
    // -----------------------------------------------------------------------
    let primaryResult: PlantIdResponse;
    let primaryScientific: string;
    let primaryCommonNames: string[];
    let primaryConfidence: number;
    let identificationSource: string;

    const plantIdOk =
      strategyResult &&
      strategyResult.scientific &&
      strategyResult.confidence >= 0.3;

    if (plantIdOk) {
      primaryScientific  = strategyResult!.scientific;
      primaryCommonNames = strategyResult!.commonNames;
      primaryConfidence  = strategyResult!.confidence;
      identificationSource = strategyResult!.source === 'plantid' ? 'plantid' : 'custom-model';
      primaryResult =
        strategyResult!.source === 'plantid'
          ? strategyResult!.plantIdRaw!
          : syntheticPlantIdEnvelope(primaryScientific, primaryCommonNames, primaryConfidence);
    } else if (geminiResult && geminiResult.isPlant && geminiResult.confidence >= 0.2) {
      // Gemini Vision is the primary result
      primaryScientific    = geminiResult.scientificName;
      primaryCommonNames   = geminiResult.commonNames;
      primaryConfidence    = geminiResult.confidence;
      identificationSource = 'gemini-vision';
      primaryResult        = geminiVisionToPlantIdEnvelope(geminiResult);
    } else {
      // Neither service identified a plant confidently
      primaryScientific    = strategyResult?.scientific || geminiResult?.scientificName || '';
      primaryCommonNames   = strategyResult?.commonNames || geminiResult?.commonNames || [];
      primaryConfidence    = strategyResult?.confidence || geminiResult?.confidence || 0;
      identificationSource = 'none';
      primaryResult = strategyResult?.plantIdRaw
        ?? (strategyResult ? syntheticPlantIdEnvelope(primaryScientific, primaryCommonNames, primaryConfidence) : geminiVisionToPlantIdEnvelope({
          scientificName: primaryScientific,
          commonNames: primaryCommonNames,
          confidence: primaryConfidence,
          isPlant: false,
          model: 'none',
        }));
    }

    // -----------------------------------------------------------------------
    // Step 3: Local DB match + Gemini text insight (run in parallel)
    // -----------------------------------------------------------------------
    let localMatch = null;
    let insight: { text: string; provider: string; model?: string } | null = null;

    if (primaryScientific) {
      const [localMatchResult, insightResult] = await Promise.allSettled([
        mapToLocalHerb(primaryScientific),
        generatePlantInsight(primaryScientific, primaryCommonNames, null),
      ]);

      localMatch = localMatchResult.status === 'fulfilled' ? localMatchResult.value : null;

      if (insightResult.status === 'fulfilled' && insightResult.value) {
        insight = insightResult.value;
      } else if (geminiResult?.description) {
        // If text insight failed but Gemini Vision gave a description, use that
        const extra = geminiResult.ayurvedicUses?.length
          ? `\n\n**Ayurvedic Uses:** ${geminiResult.ayurvedicUses.join(', ')}`
          : '';
        const safety = geminiResult.safetyNotes
          ? `\n\n⚠️ **Safety:** ${geminiResult.safetyNotes}`
          : '';
        insight = {
          text: `${geminiResult.description}${extra}${safety}`,
          provider: 'gemini',
          model: geminiResult.model,
        };
      }
    }

    // -----------------------------------------------------------------------
    // Step 4: Firebase analytics (fire-and-forget)
    // -----------------------------------------------------------------------
    saveScanEvent({
      source: identificationSource,
      scientificName: primaryScientific || null,
      confidence: primaryConfidence || null,
      hasLocalMatch: Boolean(localMatch),
      commonNames: primaryCommonNames.slice(0, 3),
      diseaseDetected: primaryResult.result?.disease?.suggestions?.[0]?.name || null,
      geminiVisionUsed: Boolean(geminiResult),
    }).catch(() => {/* optional */});

    return NextResponse.json({
      result: primaryResult,
      localMatch,
      insight,
      identificationSource,
      // Surface Gemini Vision data separately so the UI can show it
      geminiVision: geminiResult
        ? {
            scientificName: geminiResult.scientificName,
            commonNames: geminiResult.commonNames,
            confidence: geminiResult.confidence,
            family: geminiResult.family,
            ayurvedicUses: geminiResult.ayurvedicUses,
            safetyNotes: geminiResult.safetyNotes,
            description: geminiResult.description,
            isPlant: geminiResult.isPlant,
            model: geminiResult.model,
          }
        : null,
    });
  } catch (error: any) {
    console.error('Identification API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to identify plant' },
      { status: 500 }
    );
  }
}
