import { GoogleGenAI } from "@google/genai";

interface GeniusAIProductDetails {
    title: string;
    description: string;
    slug: string;
    specs: Array<{ key: string; value: string }>;
    tags: string[];
    // Legacy fields (backward compat)
    specifications?: Array<{ key: string; value: string }>;
    seoKeywords?: string[];
    metaTitle?: string;
    metaDescription?: string;
}

export class AIService {
    private client: GoogleGenAI;
    private apiKey: string;
    private availableModels: string[] = [];

    // Fallback models if discovery fails
    private static FALLBACK_MODELS = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-pro"
    ];

    constructor(apiKey: string) {
        this.apiKey = apiKey;
        this.client = new GoogleGenAI({
            apiKey: apiKey,
            apiVersion: 'v1beta',
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
            this.availableModels = await ModelDiscoveryService.discoverModels(this.apiKey, 'v1beta');
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
    ): Promise<GeniusAIProductDetails> {
        // Discover models if not already done
        await this.ensureModelsDiscovered();

        // Use discovered models or fallback
        const modelsToTry = this.availableModels.length > 0
            ? this.availableModels
            : AIService.FALLBACK_MODELS;

        const langInst = language === 'ar' ? 'Arabic' : 'English';
        const lengthGuide = length === 'short' ? '2-3 sentences' : length === 'long' ? '6-8 sentences' : '4-5 sentences';

        const prompt = `
You are an expert e-commerce copywriter.

Write a product listing for: "${productName}"
Language: ${langInst}
Tone: Professional, direct, informative, and technical.
Length: ${lengthGuide}

**CRITICAL RULES:**
1. ABSOLUTELY NO EMOJIS anywhere.
2. Maintain a highly professional B2B tone. No cheap marketing slogans.
3. Structure the description with a solid overview paragraph, followed by a bulleted list of key features.
4. Output MUST be ONLY valid JSON wrapped in \`\`\`json block.

JSON Structure:
\`\`\`json
{
  "title": "Clean professional title",
  "description": "Professional overview paragraph.\\n\\n- Key feature 1\\n- Key feature 2\\n- Key feature 3",
  "slug": "english-seo-friendly-slug",
  "metaTitle": "SEO title",
  "metaDescription": "SEO description",
  "specs": [
    {"key": "Spec Name", "value": "Value"}
  ],
  "tags": ["tag1", "tag2"]
}
\`\`\`
`;

        const sanitizeJsonText = (rawText: string) => {
            return rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        };

        let errors: string[] = [];
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

            try {
                return JSON.parse(sanitizeJsonText(text));
            } catch (parseError) {
                console.error(`AI JSON Parse Error with model ${forcedModel}:`, text);
                throw new Error(`AI returned invalid JSON format when using ${forcedModel}`);
            }
        } catch (error: any) {
            console.warn(`⚠️ Primary model ${forcedModel} failed: ${error.message}. Entering waterfall...`);
            errors.push(`${forcedModel}: ${error.message}`);

            // Waterfall through remaining models
            for (const modelName of modelsToTry.slice(1)) {
                try {
                    console.log(`🤖 AI: Attempting fallback with model: ${modelName}`);

                    const response = await this.client.models.generateContent({
                        model: modelName,
                        contents: prompt
                    });

                    if (response.text) {
                        try {
                            return JSON.parse(sanitizeJsonText(response.text));
                        } catch (parseError) {
                            throw new Error(`Invalid JSON returned from ${modelName}`);
                        }
                    } else {
                        throw new Error("Empty response");
                    }
                } catch (fallbackError: any) {
                    console.warn(`⚠️ Fallback ${modelName} failed: ${fallbackError.message}`);
                    errors.push(`${modelName}: ${fallbackError.message}`);
                    continue;
                }
            }
            throw new Error(`All AI models failed. Errors: ${errors.join(' | ')}`);
        }
    }
}
