import { GoogleGenAI } from "@google/genai";

interface AIProductDetails {
    description: string;
    metaTitle: string;
    metaDescription: string;
    features: string[];
}

export class AIService {
    private client: GoogleGenAI;
    private apiKey: string;
    private availableModels: string[] = [];

    // Fallback models if discovery fails
    private static FALLBACK_MODELS = [
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-pro"
    ];

    constructor(apiKey: string) {
        this.apiKey = apiKey;
        this.client = new GoogleGenAI({
            apiKey: apiKey,
            apiVersion: 'v1',
        });
    }

    /**
     * Discovers and caches available models for this API key
     */
    private async ensureModelsDiscovered(): Promise<void> {
        if (this.availableModels.length > 0) {
            return; // Already discovered
        }

        try {
            const { ModelDiscoveryService } = await import('./model-discovery.service');
            this.availableModels = await ModelDiscoveryService.discoverModels(this.apiKey, 'v1');
            console.log(`✅ AI Service using ${this.availableModels.length} discovered models:`, this.availableModels);
        } catch (error) {
            console.warn('⚠️ Model discovery failed, using fallback models');
            this.availableModels = AIService.FALLBACK_MODELS;
        }
    }

    async generateProductDetails(
        productName: string,
        language: string = 'ar',
        tone: string = 'Marketing',
        length: string = 'medium'
    ): Promise<AIProductDetails> {
        // Discover models if not already done
        await this.ensureModelsDiscovered();

        // Use discovered models or fallback
        const modelsToTry = this.availableModels.length > 0
            ? this.availableModels
            : AIService.FALLBACK_MODELS;

        const prompt = `
        Act as an expert E-commerce Copywriter.
        Product Name: "${productName}"
        
        Requirements:
        1. Language: ${language === 'ar' ? 'Arabic (Professional & Persuasive)' : 'English (Professional & Persuasive)'}
        2. Tone: ${tone}
        3. Description Length: ${length} (Short: ~50 words, Medium: ~100 words, Long: ~200 words)
        
        Generate the following in strict JSON format:
        {
            "description": "Compelling product description highlighting benefits",
            "metaTitle": "SEO optimized title (max 60 chars)",
            "metaDescription": "SEO optimized meta description (max 160 chars)",
            "features": ["Feature 1", "Feature 2", "Feature 3", "Feature 4", "Feature 5"]
        }
        
        Do not include markdown formatting like \`\`\`json. Return only the raw JSON string.
        `;

        let lastError = null;
        const forcedModel = modelsToTry[0];

        console.log(`🤖 AI: Using discovered model: ${forcedModel}`);

        try {
            const response = await this.client.models.generateContent({
                model: forcedModel,
                contents: prompt
            });

            const text = response.text;
            if (!text) {
                throw new Error(`Empty response from model: ${forcedModel}`);
            }

            // Clean up potentially md formatted text
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

            try {
                return JSON.parse(cleanText);
            } catch (parseError) {
                console.error(`AI JSON Parse Error with model ${forcedModel}:`, cleanText);
                throw new Error('AI returned invalid JSON format');
            }
        } catch (error: any) {
            console.warn(`⚠️ Primary model ${forcedModel} failed: ${error.message}. Entering waterfall...`);

            // Waterfall through remaining models
            for (const modelName of modelsToTry.slice(1)) {
                try {
                    console.log(`🤖 AI: Attempting fallback with model: ${modelName}`);

                    const response = await this.client.models.generateContent({
                        model: modelName,
                        contents: prompt
                    });

                    if (response.text) {
                        const cleanText = response.text.replace(/```json/g, '').replace(/```/g, '').trim();
                        return JSON.parse(cleanText);
                    }
                } catch (fallbackError: any) {
                    lastError = fallbackError;
                    console.warn(`⚠️ Fallback ${modelName} failed: ${fallbackError.message}`);
                    continue;
                }
            }
            throw new Error(`All AI models are unavailable (Waterfall fail). Last error: ${error.message}`);
        }
    }
}
