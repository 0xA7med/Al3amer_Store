/**
 * Model Discovery Service
 * 
 * Dynamically discovers available Google AI models for a given API key
 * by querying the ListModels endpoint. This eliminates issues with
 * hardcoded model lists that may be unavailable or restricted.
 */

interface DiscoveredModel {
    name: string;
    displayName: string;
    supportedGenerationMethods: string[]; // Fixed: was 'supportedMethods'
}

interface ModelDiscoveryCache {
    models: string[];
    timestamp: number;
}

export class ModelDiscoveryService {
    private static cache: Map<string, ModelDiscoveryCache> = new Map();
    private static CACHE_TTL = 60 * 60 * 1000; // 1 hour

    /**
     * Discovers available models for the given API key
     * @param apiKey Google API key
     * @param apiVersion API version (default: 'v1')
     * @returns Array of model names that support generateContent
     */
    static async discoverModels(apiKey: string, apiVersion: string = 'v1'): Promise<string[]> {
        // Check cache first
        const cached = this.cache.get(apiKey);
        if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
            console.log('✅ Using cached model list');
            return cached.models;
        }

        try {
            console.log('🔍 Discovering available models from Google API...');

            const url = `https://generativelanguage.googleapis.com/${apiVersion}/models?key=${apiKey}`;
            const response = await fetch(url);

            console.log(`📡 ListModels response status: ${response.status}`);

            if (!response.ok) {
                const errorText = await response.text();
                console.error(`❌ ListModels API error: ${response.status}`, errorText);
                throw new Error(`ListModels failed: ${response.status} ${response.statusText}`);
            }

            const data = (await response.json()) as { models?: DiscoveredModel[] };
            console.log(`📦 Raw API response:`, JSON.stringify(data, null, 2));

            const models: DiscoveredModel[] = data.models || [];
            console.log(`📋 Total models in response: ${models.length}`);

            // Filter for models that support generateContent
            const generateModels = models
                .filter(model => {
                    const supports = model.supportedGenerationMethods?.includes('generateContent') &&
                        model.name.includes('gemini');
                    console.log(`  - ${model.name}: supports=${supports}, methods=${model.supportedGenerationMethods?.join(',')}`);
                    return supports;
                })
                .map(model => model.name.replace('models/', ''));

            console.log(`✅ Filtered to ${generateModels.length} generateContent models`);

            // Prioritize models (flash > pro > others)
            const prioritized = this.prioritizeModels(generateModels);

            console.log(`✅ Discovered ${prioritized.length} models:`, prioritized);

            // Cache the results
            this.cache.set(apiKey, {
                models: prioritized,
                timestamp: Date.now()
            });

            return prioritized;
        } catch (error: any) {
            console.error('❌ Model discovery failed:', error.message);
            console.error('❌ Full error:', error);
            // Return safe fallback models
            return this.getFallbackModels();
        }
    }

    /**
     * Prioritizes models based on preference
     * Priority: flash-1.5 > pro-1.5 > flash > pro > others
     */
    private static prioritizeModels(models: string[]): string[] {
        const priority = ['1.5-flash', '1.5-pro', 'flash', 'pro'];

        return models.sort((a, b) => {
            const aIndex = priority.findIndex(p => a.includes(p));
            const bIndex = priority.findIndex(p => b.includes(p));

            if (aIndex === -1 && bIndex === -1) return 0;
            if (aIndex === -1) return 1;
            if (bIndex === -1) return -1;

            return aIndex - bIndex;
        });
    }

    /**
     * Returns fallback models to use if discovery fails
     */
    private static getFallbackModels(): string[] {
        console.log('⚠️ Using fallback model list');
        return [
            'gemini-2.5-flash',
            'gemini-2.0-flash',
            'gemini-1.5-flash',
            'gemini-1.5-pro'
        ];
    }

    /**
     * Clears the cache for a specific API key or all keys
     */
    static clearCache(apiKey?: string): void {
        if (apiKey) {
            this.cache.delete(apiKey);
        } else {
            this.cache.clear();
        }
    }
}
