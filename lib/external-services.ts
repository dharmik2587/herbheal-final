// Server-side external services: Gemini AI, Firebase Admin operations
// This file runs ONLY on the server (Next.js API routes / RSC).

import { initializeApp, getApps, getApp } from 'firebase/app';
import { addDoc, collection, getFirestore, serverTimestamp } from 'firebase/firestore';

// Server-side Firebase config. No hardcoded fallback literals — see the note
// in lib/firebase.ts about why (a leaked key was previously baked in here).
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

function assertFirebaseEnv() {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error(
      'Firebase server config missing (FIREBASE_API_KEY / FIREBASE_PROJECT_ID). Set them in .env — see .env.example.'
    );
  }
}

let firebaseApp: ReturnType<typeof initializeApp> | null = null;

function getFirebaseApp() {
  if (!firebaseApp) {
    assertFirebaseEnv();
    firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig as Record<string, string>);
  }
  return firebaseApp;
}

export function getFirebaseDb() {
  return getFirestore(getFirebaseApp());
}

export async function saveScanEvent(payload: Record<string, unknown>) {
  try {
    const db = getFirebaseDb();
    const ref = await addDoc(collection(db, 'scan_events'), {
      ...payload,
      createdAt: serverTimestamp(),
    });
    return { id: ref.id };
  } catch (error) {
    console.warn('Firebase sync skipped:', error);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Gemini AI — Server-side multi-model fallback chain
// ---------------------------------------------------------------------------

const HERBHEAL_SYSTEM_PROMPT = `You are HerbHeal Compass AI — an expert Ayurvedic medicine and botanical assistant embedded in the HerbHeal Compass platform.

ROLE:
• Provide accurate, evidence-based guidance on medicinal herbs, Ayurvedic practices, plant identification, and herbal safety.
• Ground every response in traditional Ayurvedic knowledge AND modern pharmacological evidence where available.
• Always prioritize user safety — remind users to consult qualified healthcare practitioners for medical decisions.

RESPONSE STYLE:
• Be concise but thorough. Use bullet points for clarity.
• Include botanical names (scientific nomenclature) alongside common names.
• Mention relevant doshas (Vata/Pitta/Kapha) when discussing Ayurvedic properties.
• If asked about drug interactions, flag severity levels (mild/moderate/severe) and recommend professional guidance.

SAFETY RULES:
• Never diagnose conditions or replace medical advice.
• Always include a safety disclaimer for therapeutic recommendations.
• Flag known severe herb-drug interactions explicitly.
• For endangered species, mention conservation status and legal restrictions.

FORMAT:
• Keep responses under 300 words unless the user requests detail.
• Use markdown formatting for readability.`;

// List of supported working models in priority order (verified against this API key)
const GEMINI_MODELS = [
  process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  'gemini-2.5-flash',
  'gemini-3.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
];

export async function generateGeminiInsight(prompt: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('Gemini API key missing');
    return null;
  }

  // Deduplicate models list
  const modelsToTry = Array.from(new Set(GEMINI_MODELS));

  for (const model of modelsToTry) {
    try {
      const body = {
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${HERBHEAL_SYSTEM_PROMPT}\n\n---\nUser Query: ${prompt}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          maxOutputTokens: 1024,
        },
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) {
          return { text, provider: 'gemini' as const, model };
        }
      } else {
        const errText = await response.text();
        console.warn(`Gemini model ${model} returned ${response.status}:`, errText.slice(0, 150));
      }
    } catch (error) {
      console.warn(`Gemini model ${model} call failed:`, error);
    }
  }

  return null;
}

export async function generatePlantInsight(
  scientificName: string,
  commonNames: string[] = [],
  localName?: string | null
) {
  const herbLabel = scientificName || localName || 'this plant';
  const names = commonNames.length > 0 ? commonNames.join(', ') : 'local names unavailable';
  const prompt = `I just identified a plant as ${herbLabel} (common names: ${names}). Please provide:
1. A brief botanical overview (family, habitat, appearance)
2. Traditional Ayurvedic uses and properties (dosha effects, rasa, virya, vipaka)
3. Key active compounds and their benefits
4. Any safety considerations or contraindications

Keep it concise and practical for someone exploring herbal remedies.`;

  return generateGeminiInsight(prompt);
}

export async function generateInteractionInsight(herbName: string, drugName: string) {
  const prompt = `Analyze the potential interaction between the herb "${herbName}" and the drug "${drugName}". Include:\n1. Known interaction mechanisms\n2. Severity level\n3. Clinical recommendations\n4. Whether concurrent use is safe, cautioned, or contraindicated`;

  return generateGeminiInsight(prompt);
}

// ---------------------------------------------------------------------------
// Gemini Vision — Direct image-based plant identification
// ---------------------------------------------------------------------------

export interface GeminiVisionIdentification {
  scientificName: string;
  commonNames: string[];
  confidence: number;        // 0-1
  family?: string;
  ayurvedicUses?: string[];
  safetyNotes?: string;
  description?: string;
  isPlant: boolean;
  model: string;
}

const VISION_IDENTIFY_PROMPT = `You are an expert botanist and Ayurvedic herbalist. Analyze this plant image and respond ONLY with valid JSON — no markdown, no prose, no code fences.

JSON schema (all fields required):
{
  "isPlant": true,
  "scientificName": "Genus species",
  "commonNames": ["name1", "name2"],
  "confidence": 0.92,
  "family": "Lamiaceae",
  "ayurvedicUses": ["digestive support", "anti-inflammatory"],
  "safetyNotes": "Generally safe; avoid in pregnancy.",
  "description": "2-3 sentence botanical description."
}

If the image does NOT show a plant, return:
{"isPlant": false, "scientificName": "", "commonNames": [], "confidence": 0, "family": "", "ayurvedicUses": [], "safetyNotes": "", "description": ""}

Be precise. confidence must be a number between 0 and 1.`;

export async function identifyPlantWithGeminiVision(
  imageBase64: string
): Promise<GeminiVisionIdentification | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('Gemini API key missing — vision identification skipped');
    return null;
  }

  // Strip data-URL prefix if present (e.g. "data:image/jpeg;base64,...")
  const base64Data = imageBase64.includes(',')
    ? imageBase64.split(',')[1]
    : imageBase64;

  // Detect MIME type from prefix or default to jpeg
  const mimeType = imageBase64.startsWith('data:image/png') ? 'image/png'
    : imageBase64.startsWith('data:image/webp') ? 'image/webp'
    : 'image/jpeg';

  const modelsToTry = Array.from(new Set([
    process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    'gemini-2.5-flash',
    'gemini-3.5-flash',
    'gemini-2.0-flash-lite',
    'gemini-2.0-flash',
  ]));

  for (const model of modelsToTry) {
    try {
      const body = {
        contents: [
          {
            role: 'user',
            parts: [
              {
                inline_data: {
                  mime_type: mimeType,
                  data: base64Data,
                },
              },
              { text: VISION_IDENTIFY_PROMPT },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          maxOutputTokens: 512,
        },
      };

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`Gemini vision model ${model} returned ${response.status}:`, errText.slice(0, 200));
        continue;
      }

      const data = await response.json();
      let raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';

      // Strip markdown code fences if Gemini wraps in ```json ... ```
      raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

      const parsed = JSON.parse(raw) as GeminiVisionIdentification;
      parsed.model = model;

      // Clamp confidence to [0, 1]
      parsed.confidence = Math.min(1, Math.max(0, Number(parsed.confidence) || 0));

      return parsed;
    } catch (err) {
      console.warn(`Gemini vision model ${model} failed:`, err);
    }
  }

  return null;
}
