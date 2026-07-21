import { NextResponse } from 'next/server';
import { identifyPlantWithStrategy, mapToLocalHerb, PlantIdResponse } from '@/lib/plant-id';
import {
  generatePlantInsight,
  saveScanEvent,
  identifyPlantWithGeminiVision,
  GeminiVisionIdentification,
} from '@/lib/external-services';
import fs from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export const dynamic = 'force-dynamic';

function syntheticPlantIdEnvelope(scientific: string, commonNames: string[], confidence: number, sourceName = 'herbheal-custom-ml'): PlantIdResponse {
  return {
    access_token: '',
    model_version: sourceName,
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

async function runPythonInfer(base64Image: string): Promise<{ species: string; confidence: number; commonNames: string[] } | null> {
  try {
    const scratchDir = path.join(process.cwd(), 'scratch');
    await fs.mkdir(scratchDir, { recursive: true });
    const tempFilePath = path.join(scratchDir, `temp_infer_${Date.now()}.jpg`);

    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    await fs.writeFile(tempFilePath, buffer);

    const inferScriptPath = path.join(process.cwd(), 'ml', 'infer.py');
    const { stdout } = await execFileAsync('python', [inferScriptPath, tempFilePath], { timeout: 8000 });

    // Clean up temp file
    fs.unlink(tempFilePath).catch(() => {});

    // Parse stdout for top prediction e.g.: "- Aloe Vera: 95.42%"
    const match = stdout.match(/-\s*([^:]+):\s*([\d.]+)%/);
    if (match) {
      const label = match[1].trim();
      const pct = parseFloat(match[2]);
      const confidence = pct > 1 ? pct / 100 : pct;
      return {
        species: label,
        confidence,
        commonNames: [label],
      };
    }
  } catch (error) {
    console.warn('Python infer.py execution skipped/failed:', error);
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { image, sampleName } = body;

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    let primaryResult: PlantIdResponse | null = null;
    let primaryScientific = '';
    let primaryCommonNames: string[] = [];
    let primaryConfidence = 0;
    let identificationSource = 'none';

    // -----------------------------------------------------------------------
    // Step 1: Attempt python ml/infer.py first
    // -----------------------------------------------------------------------
    const pyResult = await runPythonInfer(image);
    if (pyResult && pyResult.confidence >= 0.4) {
      primaryScientific = pyResult.species;
      primaryCommonNames = pyResult.commonNames;
      primaryConfidence = pyResult.confidence;
      identificationSource = 'ml_infer_py';
      primaryResult = syntheticPlantIdEnvelope(primaryScientific, primaryCommonNames, primaryConfidence, 'infer.py (MobileNet)');
    }

    // -----------------------------------------------------------------------
    // Step 2: Fallback to Plant.id v3 / Gemini Vision if infer.py didn't answer
    // -----------------------------------------------------------------------
    let geminiResult: GeminiVisionIdentification | null = null;

    if (!primaryResult) {
      const hasPlantId = Boolean(process.env.PLANT_ID_API_KEY);
      const hasGemini = Boolean(process.env.GEMINI_API_KEY);

      const [strategyResultRaw, geminiVision] = await Promise.allSettled([
        hasPlantId ? identifyPlantWithStrategy(image) : Promise.reject(new Error('Plant.id not configured')),
        hasGemini ? identifyPlantWithGeminiVision(image) : Promise.resolve(null),
      ]);

      const strategyResult = strategyResultRaw.status === 'fulfilled' ? strategyResultRaw.value : null;
      geminiResult = geminiVision.status === 'fulfilled' ? geminiVision.value : null;

      const plantIdOk = strategyResult && strategyResult.scientific && strategyResult.confidence >= 0.3;

      if (plantIdOk) {
        primaryScientific = strategyResult!.scientific;
        primaryCommonNames = strategyResult!.commonNames;
        primaryConfidence = strategyResult!.confidence;
        identificationSource = strategyResult!.source === 'plantid' ? 'plantid' : 'custom-model';
        primaryResult = strategyResult!.source === 'plantid'
          ? strategyResult!.plantIdRaw!
          : syntheticPlantIdEnvelope(primaryScientific, primaryCommonNames, primaryConfidence);
      } else if (geminiResult && geminiResult.isPlant && geminiResult.confidence >= 0.2) {
        primaryScientific = geminiResult.scientificName;
        primaryCommonNames = geminiResult.commonNames;
        primaryConfidence = geminiResult.confidence;
        identificationSource = 'gemini-vision';
        primaryResult = geminiVisionToPlantIdEnvelope(geminiResult);
      } else if (sampleName) {
        // Fallback for sample demo images if offline
        primaryScientific = sampleName;
        primaryCommonNames = [sampleName];
        primaryConfidence = 0.94;
        identificationSource = 'demo_sample_pipeline';
        primaryResult = syntheticPlantIdEnvelope(primaryScientific, primaryCommonNames, primaryConfidence, 'demo-pipeline');
      } else {
        primaryScientific = strategyResult?.scientific || geminiResult?.scientificName || 'Unknown Plant';
        primaryCommonNames = strategyResult?.commonNames || geminiResult?.commonNames || ['Botanical Specimen'];
        primaryConfidence = strategyResult?.confidence || geminiResult?.confidence || 0.5;
        identificationSource = 'fallback';
        primaryResult = syntheticPlantIdEnvelope(primaryScientific, primaryCommonNames, primaryConfidence, 'fallback-model');
      }
    }

    // -----------------------------------------------------------------------
    // Step 3: Local DB match + Gemini text insight
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

    saveScanEvent({
      source: identificationSource,
      scientificName: primaryScientific || null,
      confidence: primaryConfidence || null,
      hasLocalMatch: Boolean(localMatch),
      commonNames: primaryCommonNames.slice(0, 3),
      geminiVisionUsed: Boolean(geminiResult),
    }).catch(() => {});

    return NextResponse.json({
      result: primaryResult,
      localMatch,
      insight,
      identificationSource,
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
