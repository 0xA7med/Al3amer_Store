import { clsx, ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getSiteSettings } from './supabase';

// دالة مساعدة للحصول على إعدادات العملة
async function getCurrencySettings() {
  try {
    const settings = await getSiteSettings();
    const currencySetting = settings.find(s => s.setting_key === 'currency')?.setting_value || 'ج.م';
    
    // تحديد رمز العملة واسمها
    const currencyMap: Record<string, { symbol: string; code: string }> = {
      'ج.م': { symbol: 'ج.م', code: 'EGP' },
      '$': { symbol: '$', code: 'USD' },
      '€': { symbol: '€', code: 'EUR' }
    };
    
    return currencyMap[currencySetting] || { symbol: 'ج.م', code: 'EGP' };
  } catch (error) {
    console.error('Error fetching currency settings:', error);
    return { symbol: 'ج.م', code: 'EGP' };
  }
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * تنسيق القيم النقدية بناءً على إعدادات الموقع
 * @param amount المبلغ المالي
 * @param decimals عدد الأرقام العشرية (افتراضي: 0 للجنيه المصري، 2 للعملات الأخرى)
 * @returns نص منسق بالعملة المحددة في الإعدادات
 */
export async function formatCurrency(amount: number, decimals?: number): Promise<string> {
  const { symbol, code } = await getCurrencySettings();
  
  // تحديد عدد المنازل العشرية الافتراضية
  const defaultDecimals = code === 'EGP' ? 0 : 2;
  const fractionDigits = decimals !== undefined ? decimals : defaultDecimals;
  
  // تنسيق الرقم بناءً على العملة
  const formatter = new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: code,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
    currencyDisplay: 'symbol',
    useGrouping: true
  });
  
  // استبدال رمز العملة بالرمز المخصص إذا لزم الأمر
  let formatted = formatter.format(amount);
  
  // إذا كان رمز العملة غير معروض بالشكل الصحيح، نستبدله يدوياً
  if (!formatted.includes(symbol)) {
    formatted = formatted.replace(/[^\d.,\s-]/g, '').trim();
    formatted = `${formatted} ${symbol}`.trim();
  }
  
  return formatted;
}

/**
 * دالة مساعدة للتنسيق المتزامن (للاستخدام في المكونات غير غير المتزامنة)
 */
export function formatCurrencySync(amount: number, currencySymbol: string = 'ج.م', decimals: number = 0): string {
  // إزالة أي أحرف غير رقمية من المبلغ
  const numericValue = Number(amount);
  
  // تنسيق الرقم مع الفواصل
  const formattedNumber = new Intl.NumberFormat('ar-EG').format(numericValue);
  
  // إضافة رمز العملة
  return `${formattedNumber} ${currencySymbol}`.trim();
}
