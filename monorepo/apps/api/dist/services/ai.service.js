import { GoogleGenerativeAI } from '@google/generative-ai';
export class AIService {
    genAI;
    model;
    constructor(apiKey) {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
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
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            // Clean up potentially md formatted text
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(cleanText);
        }
        catch (error) {
            console.error('AI Generation Error:', error);
            throw new Error('Failed to generate content from AI');
        }
    }
}
//# sourceMappingURL=ai.service.js.map