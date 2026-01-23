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
        "gemini-1.5-flash",      // Try first (Fastest)
        "gemini-1.5-pro",        // Try second
        "gemini-pro",            // Try third (The classic stable alias - MOST LIKELY TO WORK)
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

        for (const modelName of AIService.MODELS_TO_TRY) {
            try {
                console.log(`🤖 AI: Attempting content generation with model: ${modelName}`);

                const response = await this.client.models.generateContent({
                    model: modelName,
                    contents: prompt
                });

                const text = response.text;
                if (!text) {
                    throw new Error(`Empty response from model: ${modelName}`);
                }

                // Clean up potentially md formatted text
                const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

                try {
                    return JSON.parse(cleanText);
                } catch (parseError) {
                    console.error(`AI JSON Parse Error with model ${modelName}:`, cleanText);
                    throw new Error('AI returned invalid JSON format');
                }
            } catch (error: any) {
                lastError = error;
                console.warn(`⚠️ Model ${modelName} failed: ${error.message}. Trying next...`);
                continue;
            }
        }

        console.error('❌ AI Generation Critical Failure: All models failed.');
        throw new Error(`All AI models are unavailable. Last error: ${lastError?.message}`);
    }
}
