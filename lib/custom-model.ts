export interface CustomModelPrediction {
  label: string;
  scientific: string;
  confidence: number;
}

/**
 * Calls your own trained classifier, once you've trained it (see /ml in
 * this repo) and deployed ml/serve.py somewhere reachable (Cloud Run is a
 * natural fit next to Firebase). Set CUSTOM_MODEL_URL to enable it.
 *
 * Kept as a separate, minimal function (not wedged into plant-id.ts's
 * PlantIdResponse shape) so identifyPlantWithStrategy() can swap providers
 * without either implementation needing to know about the other's payload.
 */
export async function identifyWithCustomModel(
  imageBase64: string
): Promise<CustomModelPrediction | null> {
  const url = process.env.CUSTOM_MODEL_URL;
  if (!url) return null;

  try {
    const res = await fetch(`${url}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_base64: imageBase64 })
    });
    if (!res.ok) {
      console.warn(`Custom model returned ${res.status}`);
      return null;
    }
    const data = await res.json();
    return data.predictions?.[0] ?? null;
  } catch (err) {
    console.warn("Custom model call failed:", err);
    return null;
  }
}
