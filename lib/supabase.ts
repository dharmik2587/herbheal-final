import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xyzcompany.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummy';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getCurrentUser() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.warn('Supabase auth check skipped:', error);
    return null;
  }
}

export async function saveScanEvent(payload: Record<string, unknown>) {
  try {
    const { data, error } = await supabase.from('scan_events').insert([{ ...payload, created_at: new Date().toISOString() }]);
    if (error) {
      console.warn('Supabase scan event insert note:', error.message);
    }
    return data;
  } catch (error) {
    console.warn('Supabase scan event skipped:', error);
    return null;
  }
}

export async function saveChatMessage(payload: { role: 'user' | 'assistant'; content: string; sessionId?: string }) {
  try {
    const { data, error } = await supabase.from('chat_messages').insert([{ ...payload, created_at: new Date().toISOString() }]);
    if (error) {
      console.warn('Supabase chat insert note:', error.message);
    }
    return data;
  } catch (error) {
    console.warn('Supabase chat save skipped:', error);
    return null;
  }
}
