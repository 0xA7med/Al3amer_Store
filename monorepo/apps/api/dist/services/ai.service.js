import { GoogleGenAI } from "@google/genai";
export class AIService {
    client;
    static MODEL_NAME = "gemini-1.5-flash";
    constructor(apiKey) {
        this.client = new GoogleGenAI({
            apiKey: apiKey,
        });
    }
    async generateProductDetails(productName, language = 'ar', tone = 'Marketing', length = 'medium') {
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
            // ✅ Correct usage of @google/genai SDK (API v1)
            const response = await this.client.models.generateContent({
                model: AIService.MODEL_NAME,
                contents: prompt
            });
            const text = response.text;
            if (!text) {
                throw new Error('Empty response from AI model');
            }
            // Clean up potentially md formatted text
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            try {
                return JSON.parse(cleanText);
            }
            catch (parseError) {
                console.error('Failed to parse AI response as JSON:', cleanText);
                throw new Error('AI returned invalid JSON format');
            }
        }
        catch (error) {
            console.error('AI Generation Critical Failure:', error);
            throw new Error(`Failed to generate content: ${error.message}`);
        }
    }
}
//# sourceMappingURL=ai.service.js.map