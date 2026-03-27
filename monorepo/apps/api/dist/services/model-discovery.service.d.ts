/**
 * Model Discovery Service
 *
 * Dynamically discovers available Google AI models for a given API key
 * by querying the ListModels endpoint. This eliminates issues with
 * hardcoded model lists that may be unavailable or restricted.
 */
export declare class ModelDiscoveryService {
    private static cache;
    private static CACHE_TTL;
    /**
     * Discovers available models for the given API key
     * @param apiKey Google API key
     * @param apiVersion API version (default: 'v1beta')
     * @returns Array of model names that support generateContent
     */
    static discoverModels(apiKey: string, apiVersion?: string): Promise<string[]>;
    /**
     * Prioritizes models based on preference
     * Priority: flash-1.5 > pro-1.5 > flash > pro > others
     */
    private static prioritizeModels;
    /**
     * Returns fallback models to use if discovery fails
     */
    private static getFallbackModels;
    /**
     * Clears the cache for a specific API key or all keys
     */
    static clearCache(apiKey?: string): void;
}
//# sourceMappingURL=model-discovery.service.d.ts.map