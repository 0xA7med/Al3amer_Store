import { GoogleGenAI } from "@google/genai";

interface GeniusAIProductDetails {
    title?: string;
    description?: string;
    slug?: string;
    specs?: Array<{ key: string; value: string }>;
    tags?: string[];
    // Legacy fields (backward compat)
    specifications?: Array<{ key: string; value: string }>;
    seoKeywords?: string[];
    metaTitle?: string;
    metaDescription?: string;
    llmDescription?: string;
    faq?: Array<{ question: string; answer: string }>;
}

export type AISection = 'all' | 'title' | 'description' | 'specs' | 'seo' | 'llm' | 'faq';

export class AIService {
    private client: GoogleGenAI;
    private apiKey: string;
    private availableModels: string[] = [];

    // Fallback models if discovery fails
    private static FALLBACK_MODELS = [
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-pro"
    ];

    constructor(apiKey: string) {
        this.apiKey = apiKey;
        this.client = new GoogleGenAI({
            apiKey: apiKey,
            // We omit apiVersion to let the SDK use the best default (usually v1beta for newer models)
            // or we can explicitly set it to v1beta to ensure compatibility with 2.0-flash
            apiVersion: 'v1beta',
        });
    }

    /**
     * Discovers and caches available models for this API key
     */
    private async ensureModelsDiscovered(): Promise<void> {
        if (this.availableModels.length > 0) {
            return;
        }

        try {
            const { ModelDiscoveryService } = await import('./model-discovery.service.js');
            this.availableModels = await ModelDiscoveryService.discoverModels(this.apiKey, 'v1beta');
            console.log(`✅ AI Service using ${this.availableModels.length} discovered models:`, this.availableModels);
        } catch (error: any) {
            console.warn(`⚠️ Model discovery failed: ${error.message}, using fallback models`);
            this.availableModels = AIService.FALLBACK_MODELS;
        }
    }

    /**
     * Builds a section-specific prompt
     */
    private buildPrompt(productName: string, section: AISection, langInst: string, lengthGuide: string): string {
        const baseContext = `You are an expert B2B e-commerce product copywriter for an Egyptian POS and retail electronics store called "العامر ستور".
Product Name: "${productName}"
Language: ${langInst}
Tone: Professional, direct, informative, and technical.

**CRITICAL RULES:**
1. ABSOLUTELY NO EMOJIS anywhere.
2. Maintain a professional B2B tone. No cheap marketing slogans like "هل سئمت من..." or "اطلبها الآن".
3. Output MUST be ONLY valid JSON wrapped in \`\`\`json block.
4. FACTUAL ACCURACY IS MANDATORY. Act as a technical researcher. 
5. Research the specific product model name and brand. If you are not 100% sure about a spec, DO NOT invent it.
6. Ensure specifications are actual, real-world technical data (e.g., Processor model, RAM type, Print speed in PPM, IP rating, etc.). No "hallucinated" or filler info.
7. If Category or Brand is provided, ensure specs align with that specific industry/standards.`;

        switch (section) {
            case 'title':
                return `${baseContext}

Generate ONLY a professional product title for this product.

\`\`\`json
{
  "title": "عنوان احترافي ودقيق للمنتج - max 80 chars"
}
\`\`\``;

            case 'description':
                return `${baseContext}

Write ONLY a professional product description (${lengthGuide}).
Structure: Start with a professional overview paragraph, then a bulleted list of key features using dashes (-).
NO HTML tags. Plain text only.

\`\`\`json
{
  "description": "وصف احترافي للمنتج يبدأ بنظرة عامة ثم قائمة مميزات.\\n\\n- ميزة 1\\n- ميزة 2\\n- ميزة 3"
}
\`\`\``;

            case 'specs':
                return `${baseContext}

Generate ONLY realistic technical specifications for this product.
Research what this product actually is and provide accurate specs.
Provide 3-6 key-value specification pairs in ${langInst}.

\`\`\`json
{
  "specs": [
    {"key": "اسم المواصفة", "value": "القيمة الحقيقية"},
    {"key": "...", "value": "..."}
  ]
}
\`\`\``;

            case 'seo':
                return `${baseContext}

Generate ONLY SEO metadata for this product:
- slug: English, lowercase, hyphens, max 60 chars
- metaTitle: ${langInst}, professional SEO title, max 60 chars
- metaDescription: ${langInst}, professional SEO description, max 160 chars
- tags: 3-6 relevant search keywords in ${langInst}

\`\`\`json
{
  "slug": "english-seo-slug",
  "metaTitle": "عنوان ميتا احترافي",
  "metaDescription": "وصف ميتا احترافي ومحسّن للسيو",
  "tags": ["وسم1", "وسم2", "وسم3"]
}
\`\`\``;

            case 'llm':
                return `${baseContext}

Generate ONLY a highly technical LLM-optimized summary of the product.
This description will be read by AI crawlers and bots (like ChatGPT, Gemini). It should clearly outline the product's category, technical specifications, use-cases, and compatibility in a structured format. NO marketing fluff. Provide it in ${langInst}.

\`\`\`json
{
  "llmDescription": "Technical summary formatted for LLMs without marketing fluff."
}
\`\`\``;

            case 'faq':
                return `${baseContext}

Generate 5-10 Frequently Asked Questions (FAQ) for this product, highly relevant to B2B electronics/POS buyers. Provide it in ${langInst}.

\`\`\`json
{
  "faq": [
    {"question": "سؤال متكرر 1", "answer": "إجابة دقيقة وتقنية 1"},
    {"question": "سؤال متكرر 2", "answer": "إجابة دقيقة وتقنية 2"}
  ]
}
\`\`\``;

            case 'all':
            default:
                return `${baseContext}

Write a complete product listing with ALL fields.
Description length: ${lengthGuide}
Structure the description with a professional overview paragraph, then a bulleted list of key features using dashes (-).

\`\`\`json
{
  "title": "عنوان احترافي ودقيق للمنتج",
  "description": "وصف احترافي يبدأ بنظرة عامة ثم قائمة مميزات.\\n\\n- ميزة 1\\n- ميزة 2\\n- ميزة 3",
  "slug": "english-seo-friendly-slug",
  "metaTitle": "عنوان ميتا احترافي",
  "metaDescription": "وصف ميتا احترافي ومحسّن للسيو",
  "llmDescription": "Technical summary in ${langInst} formatted for LLMs without marketing fluff.",
  "specs": [
    {"key": "اسم المواصفة", "value": "القيمة"}
  ],
  "faq": [
    {"question": "سؤال تقني 1", "answer": "إجابة شاملة 1"},
    {"question": "سؤال تقني 2", "answer": "إجابة شاملة 2"}
  ], // Please generate 5-10 high quality FAQs total
  "tags": ["وسم1", "وسم2", "وسم3"]
}
\`\`\``;
        }
    }

    async generateProductDetails(
        productName: string,
        language: string = 'ar',
        tone: string = 'Marketing',
        length: string = 'medium',
        section: AISection = 'all',
        category?: string,
        brand?: string
    ): Promise<GeniusAIProductDetails> {
        // Discover models if not already done
        await this.ensureModelsDiscovered();
 
        // Use discovered models or fallback
        const modelsToTry = this.availableModels.length > 0
            ? this.availableModels
            : AIService.FALLBACK_MODELS;
 
        const langInst = language === 'ar' ? 'Arabic' : 'English';
        const lengthGuide = length === 'short' ? '2-3 sentences' : length === 'long' ? '6-8 sentences' : '4-5 sentences';
        
        // Add more context to product name if provided
        let enhancedProductName = productName;
        if (brand) enhancedProductName = `${brand} ${enhancedProductName}`;
        if (category) enhancedProductName = `${enhancedProductName} (Category: ${category})`;
 
        const prompt = this.buildPrompt(enhancedProductName, section, langInst, lengthGuide);

        const sanitizeJsonText = (rawText: string) => {
            return rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        };

        let errors: string[] = [];
        const forcedModel = modelsToTry[0];

        console.log(`🤖 AI: Using model: ${forcedModel} | Section: ${section}`);

        try {
            const response = await this.client.models.generateContent({
                model: forcedModel,
                contents: [{ role: 'user', parts: [{ text: prompt }] }]
            });

            const text = response.text;
            if (!text) {
                console.warn(`Empty response from model: ${forcedModel}`, JSON.stringify(response, null, 2));
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
                        contents: [{ role: 'user', parts: [{ text: prompt }] }]
                    });

                    if (response.text) {
                        try {
                            return JSON.parse(sanitizeJsonText(response.text));
                        } catch (parseError) {
                            throw new Error(`Invalid JSON returned from ${modelName}`);
                        }
                    } else {
                        console.warn(`Empty response from fallback model: ${modelName}`, JSON.stringify(response, null, 2));
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

    async generateRelationships(
        productName: string,
        category: string,
        availableProducts: { id: string; name: string; brand?: string }[]
    ): Promise<{ related: string[]; accessories: string[]; alternatives: string[] }> {
        await this.ensureModelsDiscovered();
        const modelsToTry = this.availableModels.length > 0 ? this.availableModels : AIService.FALLBACK_MODELS;

        const prompt = `You are an expert e-commerce merchandiser for an Egyptian POS and retail electronics store.
We are configuring relationships for this product: "${productName}" (Category: ${category || 'Unknown'}).

Below is a JSON list of available products in our store:
${JSON.stringify(availableProducts.slice(0, 80))}

Your task is to select the BEST product IDs from the list above for the following relationships:
1. related: Products that are frequently bought together or highly relevant.
2. accessories: Products that complement or are accessories for the main product.
3. alternatives: Products that are direct substitutes or alternatives (similar specs/price/category).

Rules:
1. Output MUST be ONLY valid JSON wrapped in \`\`\`json block.
2. Return an array of valid IDs from the list provided for each category (max 5 IDs per category).
3. Do NOT invent or hallucinate IDs. Only use IDs from the provided list.
4. If there are no good matches for a category, return an empty array [].

\`\`\`json
{
  "related": ["id1", "id2"],
  "accessories": ["id3"],
  "alternatives": ["id4", "id5"]
}
\`\`\``;

        const sanitizeJsonText = (rawText: string) => {
            return rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        };

        let errors: string[] = [];

        for (const modelName of modelsToTry) {
            try {
                const response = await this.client.models.generateContent({
                    model: modelName,
                    contents: [{ role: 'user', parts: [{ text: prompt }] }]
                });
                const text = response.text;
                if (!text) throw new Error(`Empty response`);
                return JSON.parse(sanitizeJsonText(text));
            } catch (error: any) {
                console.warn(`⚠️ Model ${modelName} failed relationship generation: ${error.message}`);
                errors.push(`${modelName}: ${error.message}`);
            }
        }

        throw new Error(`AI Relationship Generation Failed. Errors: ${errors.join(' | ')}`);
    }
}
