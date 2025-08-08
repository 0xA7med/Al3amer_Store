import { supabase } from './client';

/**
 * استرجاع إعدادات الموقع من قاعدة البيانات
 * @returns مصفوفة من إعدادات الموقع
 */
export async function getSiteSettings() {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('setting_key, setting_value');
    
    if (error) {
      console.error('Error fetching site settings:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error in getSiteSettings:', error);
    return [];
  }
}

// تصدير الدوال المشتركة
export * from './client';
export * from './reports';
// يمكن إضافة المزيد من التصديرات هنا عند الحاجة
