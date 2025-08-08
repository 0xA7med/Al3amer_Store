import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'لم يتم تعيين متغيرات البيئة المطلوبة. الرجاء التأكد من وجود ملف .env يحتوي على VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY'
  );
}

// التحقق من صحة عنوان URL
let validatedUrl: string;
try {
  validatedUrl = new URL(supabaseUrl).toString();
} catch (error) {
  throw new Error(`عنوان URL الخاص بـ Supabase غير صالح: ${supabaseUrl}`);
}

export const supabase = createClient(validatedUrl, supabaseAnonKey);
