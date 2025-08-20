import { clsx, ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getSiteSettings } from '@/lib/supabase';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * An async utility function to format a number as a currency string,
 * fetching the currency symbol from site settings.
 * @param amount The number to format.
 * @param decimals The number of decimal places.
 * @returns A promise that resolves to the formatted currency string.
 */
export async function formatCurrency(amount: number, decimals?: number): Promise<string> {
  const settings = await getSiteSettings();
  const currencySetting = settings.find(s => s.setting_key === 'currency');
  const currencySymbol = currencySetting?.setting_value || 'ج.م';
  
  return formatCurrencySync(amount, currencySymbol, decimals);
}

/**
 * A pure utility function to format a number as a currency string.
 * It now requires the currency symbol to be passed explicitly.
 * @param amount The number to format.
 * @param currencySymbol The currency symbol to use (e.g., 'ج.م', '$').
 * @param decimals The number of decimal places. Defaults to 0 for EGP, 2 otherwise.
 * @returns A formatted currency string.
 */
export function formatCurrencySync(amount: number, currencySymbol: string, decimals?: number): string {
  const numericValue = Number(amount) || 0;
  
  // Default decimals depend on the currency. EGP usually doesn't have decimals.
  const finalDecimals = decimals !== undefined ? decimals : (currencySymbol === 'ج.م' ? 0 : 2);
  
  const formatter = new Intl.NumberFormat('ar-EG', {
    minimumFractionDigits: finalDecimals,
    maximumFractionDigits: finalDecimals,
    useGrouping: true
  });
  
  const formattedNumber = formatter.format(numericValue);
  
  return `${formattedNumber} ${currencySymbol}`.trim();
}
