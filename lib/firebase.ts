'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { addDoc, collection, getFirestore, serverTimestamp, getDocs, query, orderBy, limit } from 'firebase/firestore';

// Client-side Firebase config using NEXT_PUBLIC_ vars (required for browser access in Next.js).
// NOTE: there used to be hardcoded fallback values here. That key was committed to a public
// repo and must be treated as burned — rotate it in the Firebase console, then only ever
// supply config via env vars. No fallback literals, on purpose.
const requiredEnv = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
] as const;

function assertFirebaseEnv() {
  const missing = requiredEnv.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(
      `Missing Firebase env vars: ${missing.join(', ')}. Set them in .env.local — see .env.example.`
    );
  }
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

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

// ---------------------------------------------------------------------------
// Firestore Persistence: Save scan events, chat history, and analytics
// ---------------------------------------------------------------------------

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

export async function saveChatMessage(payload: {
  role: 'user' | 'assistant';
  content: string;
  sessionId?: string;
}) {
  try {
    const db = getFirebaseDb();
    const ref = await addDoc(collection(db, 'chat_messages'), {
      ...payload,
      createdAt: serverTimestamp(),
    });
    return { id: ref.id };
  } catch (error) {
    console.warn('Firebase chat save skipped:', error);
    return null;
  }
}

export async function saveMarketView(payload: {
  herb: string;
  price: number;
  source: string;
}) {
  try {
    const db = getFirebaseDb();
    await addDoc(collection(db, 'market_views'), {
      ...payload,
      viewedAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn('Firebase market view save skipped:', error);
  }
}

export async function getRecentScans(maxResults = 10) {
  try {
    const db = getFirebaseDb();
    const q = query(
      collection(db, 'scan_events'),
      orderBy('createdAt', 'desc'),
      limit(maxResults)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.warn('Firebase fetch skipped:', error);
    return [];
  }
}
