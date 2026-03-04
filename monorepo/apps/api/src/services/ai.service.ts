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
You are a top-tier Egyptian e-commerce copywriter who writes highly converting product listings for the Egyptian market.
You specialize in POS systems, retail technology, and electronics sold in Egypt.

Product Name: "${productName}"
Language: ${langInst}
Tone: ${tone}
Description Length: ${lengthGuide}

Your task: Write a catchy, highly-converting product title and a compelling product description for this product.

**STRICT RULES:**
1. **ABSOLUTELY NO HTML TAGS.** No <h3>, <p>, <ul>, <li>, <br>, or any HTML. Use ONLY plain text.
2. Use newlines (\\n) to separate paragraphs and sections.
3. Use e-commerce emojis to make the description pop: ✅, 🚀, 🛡️, 💡, ⭐, 🔥, 💰, 📦, ✨
4. Write in a persuasive, benefit-driven style that appeals to Egyptian business owners and shoppers.
5. The title should be catchy, include the brand/model if apparent, and be optimized for search.
6. Tags should be relevant Arabic search keywords that Egyptian customers would use.

Output ONLY a valid JSON object — no markdown, no code fences, no extra text:
{
  "title": "عنوان جذاب ومحسّن للسيو بالعربي",
  "description": "وصف تسويقي مقنع بدون HTML... استخدم \\n للأسطر الجديدة و إيموجي للتنسيق",
  "slug": "english-seo-friendly-slug",
  "specs": [
    {"key": "اسم المواصفة", "value": "القيمة"},
    {"key": "...", "value": "..."}
  ],
  "tags": ["وسم1", "وسم2", "وسم3"]
}

Rules:
- title: ${langInst}, catchy and SEO-optimized, max 80 chars.
- description: ${langInst}, plain text only, ${lengthGuide}, use emojis and newlines for formatting.
- slug: lowercase English, hyphens only, no trailing hyphens, max 60 chars.
- specs: exactly 3-5 realistic technical key-value pairs in ${langInst}.
- tags: 3-6 relevant search keywords/phrases in ${langInst}.
- Return ONLY the raw JSON object. No markdown fences, no extra text.
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
