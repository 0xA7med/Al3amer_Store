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
You are a highly professional B2B e-commerce product manager writing product listings for an Egyptian POS and retail electronics store.

Product Name: "${productName}"
Language: ${langInst}
Tone: Professional, direct, informative, and technical.
Description Length: ${lengthGuide}

Your task is to write a highly professional, well-structured product description.

**STRICT RULES:**
1. **ABSOLUTELY NO EMOJIS.** Do not use emojis anywhere in the response.
2. **NO CHEAP MARKETING SLOGANS.** Avoid phrases like "هل سئمت من..." or "اطلبها الآن...". Stay objective, professional, and focus on value and technical capabilities.
3. **ABSOLUTELY NO HTML TAGS.** No <h3>, <p>, <ul>, <li>, <br>, or any HTML.
4. **STRUCTURED FORMATTING:**
   - Start with a clear, direct, and professional 1-2 sentence overview of the product.
   - Follow it with a bulleted list of 3-5 key features. Use standard dashes (-) for bullets.
   - Use the literal characters "\\n" (backslash followed by n) to separate the overview from the bullet points. Do NOT output an actual unescaped line break inside the JSON string.
5. The title should be clean, professional, and optimized for search.
6. Tags should be relevant Arabic search keywords (e.g. كاشير, طابعة فواتير).

Output ONLY a valid JSON object — no markdown, no code fences, no extra text:
{
  "title": "عنوان احترافي للمنتج",
  "description": "نظرة عامة احترافية على المنتج...\\\\n\\\\n- الميزة الأولى...\\\\n- الميزة الثانية...\\\\n- الميزة الثالثة...",
  "slug": "english-seo-friendly-slug",
  "metaTitle": "عنوان الميتا محسّن للسيو",
  "metaDescription": "وصف الميتا المكون من 150 حرف كحد أقصى",
  "specs": [
    {"key": "اسم المواصفة", "value": "القيمة"},
    {"key": "...", "value": "..."}
  ],
  "tags": ["وسم1", "وسم2", "وسم3"]
}

Rules:
- title: ${langInst}, clean and professional, max 80 chars.
- description: ${langInst}, plain text only, must include an overview paragraph followed by a bulleted list (using dashes -) of key features. Use literal "\\n" for line breaks. NO EMOJIS.
- slug: lowercase English, hyphens only, no trailing hyphens, max 60 chars.
- metaTitle: ${langInst}, professional SEO title, max 60 chars.
- metaDescription: ${langInst}, professional SEO description, max 160 chars.
- specs: exactly 3-5 realistic technical key-value pairs in ${langInst}.
- tags: 3-6 relevant search keywords/phrases in ${langInst}.
- Return ONLY the raw JSON object. No markdown fences, no extra text.
        `;

        const sanitizeJsonText = (rawText: string) => {
            let clean = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
            // In case it literally returns unescaped newlines within strings
            clean = clean.replace(/\n/g, '\\n').replace(/\r/g, '');
            // However, replacing ALL \n with \\n might break legitimate formatting outside strings if any, 
            // but since we asked for JSON, it's mostly safe or it'll just parse as \n in values.
            // A safer JSON parse wrapper:
            return clean;
        };

        let lastError: any = null;
        const forcedModel = modelsToTry[0];

        console.log(`🤖 AI: Using discovered model: ${forcedModel}`);

        const genConfig = {
            responseMimeType: 'application/json',
        };

        try {
            const response = await this.client.models.generateContent({
                model: forcedModel,
                contents: prompt,
                config: genConfig
            });

            const text = response.text;
            if (!text) {
                throw new Error(`Empty response from model: ${forcedModel}`);
            }

            try {
                return JSON.parse(sanitizeJsonText(text));
            } catch (parseError) {
                console.error(`AI JSON Parse Error with model ${forcedModel}:`, text);
                throw new Error('AI returned invalid JSON format');
            }
        } catch (error: any) {
            console.warn(`⚠️ Primary model ${forcedModel} failed: ${error.message}. Entering waterfall...`);
            lastError = error;

            // Waterfall through remaining models
            for (const modelName of modelsToTry.slice(1)) {
                try {
                    console.log(`🤖 AI: Attempting fallback with model: ${modelName}`);

                    const response = await this.client.models.generateContent({
                        model: modelName,
                        contents: prompt,
                        config: genConfig
                    });

                    if (response.text) {
                        return JSON.parse(sanitizeJsonText(response.text));
                    }
                } catch (fallbackError: any) {
                    lastError = fallbackError;
                    console.warn(`⚠️ Fallback ${modelName} failed: ${fallbackError.message}`);
                    continue;
                }
            }
            throw new Error(`All AI models failed. Last error: ${lastError?.message || 'Unknown error'}`);
        }
    }
}
