import { GoogleGenAI } from "@google/genai";
export class AIService {
    client;
    apiKey;
    availableModels = [];
    // Fallback models if discovery fails
    static FALLBACK_MODELS = [
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-pro"
    ];
    constructor(apiKey) {
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
    async ensureModelsDiscovered() {
        if (this.availableModels.length > 0) {
            return;
        }
        try {
            const { ModelDiscoveryService } = await import('./model-discovery.service.js');
            this.availableModels = await ModelDiscoveryService.discoverModels(this.apiKey, 'v1beta');
            console.log(`✅ AI Service using ${this.availableModels.length} discovered models:`, this.availableModels);
        }
        catch (error) {
            console.warn(`⚠️ Model discovery failed: ${error.message}, using fallback models`);
            this.availableModels = AIService.FALLBACK_MODELS;
        }
    }
    /**
     * Builds a section-specific prompt
     */
    buildPrompt(productName, section, langInst, lengthGuide) {
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
            case 'llm_geo':
                return `${baseContext}

Generate content optimized for Generative Engine Optimization (GEO):
1. llmDescription: A rich, technical, and semantic description (150-200 words) in ${langInst}. Focus on explaining "why" this product is the best choice for specific use cases. Use high-value industry terminology.
2. faq: A list of 5-10 frequently asked questions and their detailed answers in ${langInst}. Focus on common pain points, technical compatibility, and maintenance.

\`\`\`json
{
  "llmDescription": "وصف سيمانتك غني للمنتج يركز على حالات الاستخدام والقيمة التقنية...",
  "faq": [
    {"question": "سؤال شائع 1؟", "answer": "إجابة تفصيلية 1..."},
    {"question": "...", "answer": "..."}
  ]
}
\`\`\``;
            case 'all':
            default:
                return `${baseContext}

Write a complete product listing with ALL fields including GEO content.
Description length: ${lengthGuide}

\`\`\`json
{
  "title": "عنوان احترافي",
  "description": "وصف المنتج...",
  "llmDescription": "وصف GEO محسن للذكاء الاصطناعي...",
  "faq": [
    {"question": "سؤال؟", "answer": "إجابة"}
  ],
  "slug": "slug",
  "specs": [{"key": "K", "value": "V"}],
  "tags": ["tag1"]
}
\`\`\``;
        }
    }
    async generateProductDetails(productName, language = 'ar', tone = 'Marketing', length = 'medium', section = 'all', category, brand) {
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
        if (brand)
            enhancedProductName = `${brand} ${enhancedProductName}`;
        if (category)
            enhancedProductName = `${enhancedProductName} (Category: ${category})`;
        const prompt = this.buildPrompt(enhancedProductName, section, langInst, lengthGuide);
        const sanitizeJsonText = (rawText) => {
            return rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        };
        let errors = [];
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
            }
            catch (parseError) {
                console.error(`AI JSON Parse Error with model ${forcedModel}:`, text);
                throw new Error(`AI returned invalid JSON format when using ${forcedModel}`);
            }
        }
        catch (error) {
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
                        }
                        catch (parseError) {
                            throw new Error(`Invalid JSON returned from ${modelName}`);
                        }
                    }
                    else {
                        console.warn(`Empty response from fallback model: ${modelName}`, JSON.stringify(response, null, 2));
                        throw new Error("Empty response");
                    }
                }
                catch (fallbackError) {
                    console.warn(`⚠️ Fallback ${modelName} failed: ${fallbackError.message}`);
                    errors.push(`${modelName}: ${fallbackError.message}`);
                    continue;
                }
            }
            throw new Error(`All AI models failed. Errors: ${errors.join(' | ')}`);
        }
    }
}
//# sourceMappingURL=ai.service.js.map