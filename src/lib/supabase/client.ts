import { createClient } from '@supabase/supabase-js';

const envUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
export const isSupabaseConfigured = Boolean(envUrl && envKey);

if (!envUrl || !envKey) {
  console.warn('[Supabase] Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Using fallback values; API calls will fail gracefully.');
}

// التحقق من صحة عنوان URL أو استخدام قيمة افتراضية غير صالحة لمنع التعطل
let validatedUrl: string = 'https://invalid.supabase.local';
if (envUrl) {
  try {
    validatedUrl = new URL(envUrl).toString();
  } catch (error) {
    console.error(`[Supabase] Invalid URL provided: ${envUrl}. Falling back to a placeholder URL.`);
  }
}

const anonKey = envKey || 'invalid-anon-key';

export const supabase = createClient(validatedUrl, anonKey);
