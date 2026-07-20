import { prisma } from '@/lib/prisma';
import { identifyWithCustomModel, CustomModelPrediction } from '@/lib/custom-model';

export interface PlantIdResponse {
  access_token: string;
  model_version: string;
  custom_id: string | null;
  input: {
    latitude: number | null;
    longitude: number | null;
    similar_images: boolean;
    health: string;
    images: string[];
    datetime: string;
  };
  result: {
    is_plant: {
      probability: number;
      binary: boolean;
      threshold: number;
    };
    classification: {
      suggestions: Array<{
        id: string;
        name: string;
        probability: number;
        similar_images: Array<{
          id: string;
          url: string;
          similarity: number;
          url_small: string;
        }>;
        details?: {
          common_names: string[] | null;
          taxonomy?: { class?: string; family?: string; genus?: string; order?: string; phylum?: string };
          url?: string;
          description?: { value: string; citation: string; license_name: string; license_url: string };
          synonyms?: string[];
          image?: { value: string; citation: string; license_name: string; license_url: string };
          rank?: string;
        };
      }>;
    };
    disease?: {
      suggestions: Array<{
        id: string;
        name: string;
        probability: number;
        similar_images: Array<{
          id: string;
          url: string;
          similarity: number;
          url_small: string;
        }>;
        details?: {
          description?: string;
          treatment?: any;
        };
      }>;
    };
  };
  status: string;
  sla_compliant_client: boolean;
  sla_compliant_system: boolean;
  created: number;
  completed: number;
}

export async function identifyPlant(imageBase64: string): Promise<PlantIdResponse> {
  const apiKey = process.env.PLANT_ID_API_KEY;
  if (!apiKey) {
    throw new Error('Plant.id API key is not configured');
  }

  // Plant.id v3 expects valid modifiers in payload body (classification_level, similar_images, health)
  // and details field selection in URL query parameter `?details=...`
  const payload = {
    images: [imageBase64],
    similar_images: true,
    classification_level: 'species',
    health: 'all'
  };

  const detailsQuery = encodeURIComponent('common_names,url,description,taxonomy,synonyms,image');
  const endpoint = `https://plant.id/api/v3/identification?details=${detailsQuery}`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Api-Key': apiKey
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Plant.id API error (${response.status}): ${errText}`);
  }

  return await response.json();
}

export async function mapToLocalHerb(scientificName: string) {
  if (!scientificName) return null;

  const herbs = await prisma.herb.findMany({
    where: {
      scientificName: {
        contains: scientificName,
      }
    }
  });

  if (herbs.length > 0) {
    return herbs[0];
  }
  return null;
}

const MIN_CUSTOM_MODEL_CONFIDENCE = 0.4;

export interface StrategyResult {
  source: 'custom-model' | 'plantid';
  scientific: string;
  commonNames: string[];
  confidence: number;
  plantIdRaw?: PlantIdResponse;
  customModelRaw?: CustomModelPrediction;
}

/**
 * IDENTIFY_STRATEGY env var controls this:
 *  - "api" (default)     -> Plant.id only. Production-ready today.
 *  - "custom-first"      -> try your trained model; if it errors or its
 *                           confidence is below MIN_CUSTOM_MODEL_CONFIDENCE,
 *                           fall back to Plant.id. Flip this on once you've
 *                           trained + validated a model (see /ml).
 *  - "custom-only"       -> your model only, no fallback. Only use after
 *                           checking real accuracy with ml/evaluate.py.
 */
export async function identifyPlantWithStrategy(imageBase64: string): Promise<StrategyResult> {
  const strategy = process.env.IDENTIFY_STRATEGY ?? 'api';

  if (strategy !== 'api') {
    const prediction = await identifyWithCustomModel(imageBase64);
    if (prediction && prediction.confidence >= MIN_CUSTOM_MODEL_CONFIDENCE) {
      return {
        source: 'custom-model',
        scientific: prediction.scientific,
        commonNames: [prediction.label],
        confidence: prediction.confidence,
        customModelRaw: prediction,
      };
    }
    if (strategy === 'custom-only') {
      throw new Error(
        prediction
          ? `Custom model confidence too low (${prediction.confidence.toFixed(2)}) and IDENTIFY_STRATEGY=custom-only has no fallback configured`
          : 'Custom model unavailable and IDENTIFY_STRATEGY=custom-only has no fallback configured'
      );
    }
    // custom-first falls through to Plant.id below
  }

  const plantIdResult = await identifyPlant(imageBase64);
  const top = plantIdResult.result?.classification?.suggestions?.[0];
  return {
    source: 'plantid',
    scientific: top?.name ?? '',
    commonNames: top?.details?.common_names ?? [],
    confidence: top?.probability ?? 0,
    plantIdRaw: plantIdResult,
  };
}
