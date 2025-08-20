import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getSiteSettings } from '@/lib/supabase';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

interface SiteSettings {
  [key: string]: any;
  currency_symbol: string;
}

interface SettingsContextType {
  settings: SiteSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>({ currency_symbol: 'ج.م' });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getSiteSettings();
      const mappedSettings: SiteSettings = data.reduce((acc: any, setting: any) => {
        acc[setting.setting_key] = setting.setting_value;
        return acc;
      }, { currency_symbol: 'ج.م' }); // Default currency

      if (!mappedSettings.currency) {
          mappedSettings.currency = 'ج.م';
      }
      // For simplicity, let's just use a single currency key
      mappedSettings.currency_symbol = mappedSettings.currency;

      setSettings(mappedSettings);
    } catch (error) {
      console.error("Failed to fetch site settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
