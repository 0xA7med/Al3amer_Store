interface AIProductDetails {
    description: string;
    metaTitle: string;
    metaDescription: string;
    features: string[];
}
export declare class AIService {
    private genAI;
    private model;
    constructor(apiKey: string);
    generateProductDetails(productName: string, language?: string, tone?: string, length?: string): Promise<AIProductDetails>;
}
export {};
//# sourceMappingURL=ai.service.d.ts.map