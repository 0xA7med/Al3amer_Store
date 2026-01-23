import { GoogleGenerativeAI } from '@google/generative-ai';

interface AIProductDetails {
    description: string;
    metaTitle: string;
    metaDescription: string;
    features: string[];
}

export class AIService {
    private genAI: GoogleGenerativeAI;

    // Comprehensive list of candidates for auto-discovery
    private static CANDIDATES = [
        "gemini-1.5-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro",
        "gemini-1.5-pro-latest",
        "gemini-1.0-pro",
        "gemini-pro",
        "gemini-flash"
    ];

    private static workingModelName: string | null = null;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    // specific method to find a working model
    private async getWorkingModel(): Promise<any> {
        // Return cached model if available
        if (AIService.workingModelName) {
            return this.genAI.getGenerativeModel({ model: AIService.workingModelName });
        }

        console.log("Starting AI Model Auto-Discovery...");

        for (const modelName of AIService.CANDIDATES) {
            try {
                console.log(`Testing model candidate: ${modelName}`);
                const model = this.genAI.getGenerativeModel({ model: modelName });

                // Test generation with a minimal prompt
                await model.generateContent("Hello");

                // If successful, cache and return
                console.log(`✅ Selected Working Model: ${modelName}`);
                AIService.workingModelName = modelName;
                return model;
            } catch (error: any) {
                console.warn(`❌ Model ${modelName} failed. Error: ${error.message || error}`);
                // Continue to next candidate
            }
        }

        throw new Error("No compatible Gemini model found for this API Key after checking all candidates.");
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

        try {
            // Get the best available model
            const model = await this.getWorkingModel();

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Clean up potentially md formatted text
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

            return JSON.parse(cleanText);
        } catch (error: any) {
            console.error('AI Generation Critical Failure:', error);
            throw new Error(`Failed to generate content: ${error.message}`);
        }
    }
}
