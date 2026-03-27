interface GeniusAIProductDetails {
    title?: string;
    description?: string;
    slug?: string;
    specs?: Array<{
        key: string;
        value: string;
    }>;
    tags?: string[];
    specifications?: Array<{
        key: string;
        value: string;
    }>;
    seoKeywords?: string[];
    metaTitle?: string;
    metaDescription?: string;
}
export type AISection = 'all' | 'title' | 'description' | 'specs' | 'seo';
export declare class AIService {
    private client;
    private apiKey;
    private availableModels;
    private static FALLBACK_MODELS;
    constructor(apiKey: string);
    /**
     * Discovers and caches available models for this API key
     */
    private ensureModelsDiscovered;
    /**
     * Builds a section-specific prompt
     */
    private buildPrompt;
    generateProductDetails(productName: string, language?: string, tone?: string, length?: string, section?: AISection, category?: string, brand?: string): Promise<GeniusAIProductDetails>;
}
export {};
//# sourceMappingURL=ai.service.d.ts.map