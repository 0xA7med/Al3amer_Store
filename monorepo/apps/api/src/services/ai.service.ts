import { GoogleGenerativeAI } from '@google/generative-ai';

interface AIProductDetails {
    description: string;
    metaTitle: string;
    metaDescription: string;
    features: string[];
}

export class AIService {
    private genAI: GoogleGenerativeAI;

    // Prioritized list of models to try
    private static MODELS = [
        "gemini-pro",           // Priority 1: The stable alias (Safest)
        "gemini-1.5-flash",     // Priority 2: Fast model
        "gemini-1.5-flash-001", // Priority 3: Specific version
        "gemini-1.0-pro"        // Priority 4: Legacy
    ];

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
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

        let lastError: any = null;

        // Loop through models with fallback strategy
        for (const modelName of AIService.MODELS) {
            try {
                console.log("Attempting to connect using model:", modelName);

                // Initialize model instance for the current iteration
                const model = this.genAI.getGenerativeModel({ model: modelName });

                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = response.text();

                // Clean up potentially md formatted text
                const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();

                return JSON.parse(cleanText);
            } catch (error: any) {
                console.warn(`Model ${modelName} failed. Error:`, error.message || error);

                // Check if it's a 400 or Not Found error to give a hint
                if (error.toString().includes('400') || error.toString().toLowerCase().includes('not found')) {
                    console.error("Gemini Error. If 'Not Found', please ensure SDK is latest version.");
                }
                lastError = error;
                // Continue to next model
            }
        }

        console.error('All AI models failed. Last error:', lastError);
        throw new Error('All AI models are currently unavailable.');
    }
}
