'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { addDoc, collection, getFirestore, serverTimestamp, getDocs, query, orderBy, limit } from 'firebase/firestore';

// Client-side Firebase config using NEXT_PUBLIC_ vars (required for browser access in Next.js)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDoPPif0_BO8SkI0KOp0N1mDH_drXo0R0M',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'herbheal.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'herbheal',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'herbheal.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '164989073404',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:164989073404:web:ef4a2de51f1ebfcc946479',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-B5XR8ZF9XW',
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
