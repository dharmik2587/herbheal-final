'use client';

// Firebase has been deprecated and replaced with Supabase.
// Re-exporting Supabase operations for complete migration & compatibility.

import { saveScanEvent as supabaseSaveScan, saveChatMessage as supabaseSaveChat } from './supabase';

export async function saveScanEvent(payload: Record<string, unknown>) {
  return supabaseSaveScan(payload);
}

export async function saveChatMessage(payload: { role: 'user' | 'assistant'; content: string; sessionId?: string }) {
  return supabaseSaveChat(payload);
}

export async function saveMarketView(payload: { herb: string; price: number; source: string }) {
  // Optional log
  return null;
}

export async function getRecentScans(maxResults = 10) {
  return [];
}
