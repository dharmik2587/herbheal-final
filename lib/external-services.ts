// Server-side external services: Gemini AI, Firebase Admin operations
// This file runs ONLY on the server (Next.js API routes / RSC).

import { initializeApp, getApps, getApp } from 'firebase/app';
import { addDoc, collection, getFirestore, serverTimestamp } from 'firebase/firestore';

// Server-side Firebase config
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDoPPif0_BO8SkI0KOp0N1mDH_drXo0R0M',
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'herbheal.firebaseapp.com',
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'herbheal',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'herbheal.firebasestorage.app',
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '164989073404',
  appId: process.env.FIREBASE_APP_ID || process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:164989073404:web:ef4a2de51f1ebfcc946479',
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-B5XR8ZF9XW',
};

let firebaseApp: ReturnType<typeof initializeApp> | null = null;

function getFirebaseApp() {
  if (!firebaseApp) {
    firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
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

// List of supported working models in priority order
const GEMINI_MODELS = [
  process.env.GEMINI_MODEL || 'gemini-flash-latest',
  'gemini-flash-latest',
  'gemini-flash-lite-latest',
  'gemini-3.1-flash-lite',
  'gemini-3-flash-preview',
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
  const prompt = `Analyze the potential interaction between the herb "${herbName}" and the drug "${drugName}". Include:
1. Known interaction mechanisms
2. Severity level
3. Clinical recommendations
4. Whether concurrent use is safe, cautioned, or contraindicated`;

  return generateGeminiInsight(prompt);
}
