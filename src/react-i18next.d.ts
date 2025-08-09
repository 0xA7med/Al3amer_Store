import 'react-i18next';

declare module 'react-i18next' {
  interface CustomTypeOptions {
    returnNull: false;
  }
  
  // Ensure t function returns string instead of Promise<string>
  type TFunction = (key: string, options?: any) => string;
  
  interface UseTranslationResponse {
    t: TFunction;
    i18n: any;
    ready: boolean;
  }
  
  function useTranslation(ns?: string, options?: any): UseTranslationResponse;
}
