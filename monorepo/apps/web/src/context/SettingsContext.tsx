import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import api from '../lib/api';

interface Settings {
    // General
    storeNameAr?: string;
    storeNameEn?: string;
    supportPhone?: string;
    supportEmail?: string;
    address?: string;
    logoUrl?: string;
    faviconUrl?: string;
    // Social Media
    facebook?: string;
    instagram?: string;
    whatsapp?: string;
    twitterX?: string;
    // Shipping
    shippingFlatRate?: string;
    freeShippingThreshold?: string;
    cityShippingRates?: { city: string; rate: number }[];
    // Tax
    vatEnabled?: boolean;
    taxPercentage?: string;
    pricesIncludeTax?: boolean;
    // Payment
    codEnabled?: boolean;
    codExtraFee?: string;
    codAdvancePayment?: string;
    codReturnShippingBaseAmount?: string;
    codReturnShippingBaseFee?: string;
    codReturnShippingExtraAmount?: string;
    codReturnShippingExtraFee?: string;
    paymobEnabled?: boolean;
    paymobIntegrationCard?: string;
    paymobIntegrationWallet?: string;
    // SEO
    metaTitle?: string;
    metaDescription?: string;
    metaKeywords?: string;
}

interface SettingsContextType {
    settings: Settings;
    isLoading: boolean;
    error: Error | null;
    refetchSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Default fallback settings — يتم استبدالها من قاعدة البيانات
const DEFAULT_SETTINGS: Settings = {
    storeNameAr: '',
    storeNameEn: '',
    supportPhone: '',
    supportEmail: '',
    address: '',
    shippingFlatRate: '50',
    freeShippingThreshold: '2000',
    vatEnabled: true,
    taxPercentage: '14',
    pricesIncludeTax: true,
    codEnabled: true,
};

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchSettings = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const { data } = await api.get('/settings/public');
            setSettings({ ...DEFAULT_SETTINGS, ...data });
        } catch (err) {
            console.error('Failed to fetch settings:', err);
            setError(err as Error);
            // Keep using default settings on error
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    return (
        <SettingsContext.Provider value={{ settings, isLoading, error, refetchSettings: fetchSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
