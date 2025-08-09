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

// متغير لتخزين إعدادات العملة
let currencySettings: { symbol: string; code: string } | null = null;

// دالة للحصول على إعدادات العملة بشكل متزامن (تستخدم القيم المخزنة)
function getCurrencySettingsSync() {
  // إذا كانت الإعدادات محملة بالفعل، نعيدها
  if (currencySettings) return currencySettings;
  
  // جلب إعدادات العملة من localStorage إذا كانت موجودة
  if (typeof window !== 'undefined') {
    try {
      const savedSettings = localStorage.getItem('currencySettings');
      if (savedSettings) {
        currencySettings = JSON.parse(savedSettings);
        return currencySettings;
      }
    } catch (error) {
      console.error('Error loading currency settings from localStorage:', error);
    }
  }
  
  // القيم الافتراضية
  return { symbol: 'ج.م', code: 'EGP' };
}

// تحميل إعدادات العملة عند بدء التطبيق
if (typeof window !== 'undefined') {
  // جلب إعدادات العملة من السيرفر وتخزينها
  getSiteSettings().then(settings => {
    const currencySetting = settings.find(s => s.setting_key === 'currency')?.setting_value || 'ج.م';
    
    // تحديد رمز العملة واسمها
    const currencyMap: Record<string, { symbol: string; code: string }> = {
      'ج.م': { symbol: 'ج.م', code: 'EGP' },
      '$': { symbol: '$', code: 'USD' },
      '€': { symbol: '€', code: 'EUR' }
    };
    
    currencySettings = currencyMap[currencySetting] || { symbol: 'ج.م', code: 'EGP' };
    
    // حفظ الإعدادات في localStorage للاستخدام اللاحق
    try {
      localStorage.setItem('currencySettings', JSON.stringify(currencySettings));
    } catch (error) {
      console.error('Error saving currency settings to localStorage:', error);
    }
  }).catch(error => {
    console.error('Error loading currency settings:', error);
  });
}

/**
 * دالة مساعدة للتنسيق المتزامن (للاستخدام في المكونات غير غير المتزامنة)
 */
export function formatCurrencySync(amount: number, customSymbol?: string, customDecimals?: number): string {
  const { symbol, code } = getCurrencySettingsSync();
  const numericValue = Number(amount) || 0;
  
  // تحديد عدد المنازل العشرية
  const decimals = customDecimals !== undefined ? customDecimals : (code === 'EGP' ? 0 : 2);
  
  // تنسيق الرقم مع الفواصل
  const formatter = new Intl.NumberFormat('ar-EG', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: true
  });
  
  const formattedNumber = formatter.format(numericValue);
  
  // استخدام الرمز المخصص إذا تم توفيره، وإلا نستخدم الرمز من الإعدادات
  const displaySymbol = customSymbol || symbol;
  
  return `${formattedNumber} ${displaySymbol}`.trim();
}
