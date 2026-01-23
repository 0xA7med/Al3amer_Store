import { GoogleGenAI } from "@google/genai";

interface AIProductDetails {
    description: string;
    metaTitle: string;
    metaDescription: string;
    features: string[];
}

export class AIService {
    private client: GoogleGenAI;
    private static MODELS_TO_TRY = [
        "gemini-pro",            // Try first (The classic stable alias - MOST LIKELY TO WORK)
        "gemini-1.5-flash",      // Try second (Fastest if available)
        "gemini-1.5-pro",        // Try third
        "gemini-1.0-pro"         // Fallback
    ];

    constructor(apiKey: string) {
        this.client = new GoogleGenAI({
            apiKey: apiKey,
            apiVersion: 'v1',
        });
    }

    async generateProductDetails(
        productName: string,
        language: string = 'ar',
        tone: string = 'Marketing',
        length: string = 'medium'
    ): Promise<AIProductDetails> {
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
        const forcedModel = "gemini-pro";

        console.log(`🤖 AI: Using forced stable model: ${forcedModel}`);

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
            console.warn(`⚠️ Forced model ${forcedModel} failed: ${error.message}.`);

            // Fallback to the retry loop as a safety measure if forced fails
            for (const modelName of AIService.MODELS_TO_TRY) {
                if (modelName === forcedModel) continue;
                try {
                    console.log(`🤖 AI: Attempting safety fallback with model: ${modelName}`);

                    const response = await this.client.models.generateContent({
                        model: modelName,
                        contents: prompt
                    });

                    const text = response.text;
                    if (!text) {
                        throw new Error(`Empty response from model: ${modelName}`);
                    }

                    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
                    return JSON.parse(cleanText);
                } catch (fallbackError: any) {
                    lastError = fallbackError;
                    console.warn(`⚠️ Fallback ${modelName} failed: ${fallbackError.message}`);
                    continue;
                }
            }
            throw new Error(`All AI models are unavailable. Last error: ${error.message}`);
        }
    }
}
