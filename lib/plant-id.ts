import { prisma } from '@/lib/prisma';

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
