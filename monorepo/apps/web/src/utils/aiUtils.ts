export interface AiScoreInput {
    metaTitle?: string | null;
    metaDescription?: string | null;
    llmDescription?: string | null;
    faq?: any[] | null;
    relatedProducts?: any[] | null;
    accessories?: any[] | null;
    alternatives?: any[] | null;
    specifications?: any | null;
    videoUrl?: string | null;
    videos?: any[] | null; // Support for the format used in Product type
}

/**
 * Calculates the AI Readiness Score (GEO Score) for a product.
 * Total Score: 100%
 * - SEO (Meta Title & Description): 25%
 * - GEO / LLM Description: 25%
 * - Technical FAQ (5+ questions): 20%
 * - Smart Linkage (Related, Accessories, Alternatives): 15%
 * - Technical Specs: 15%
 */
export const calculateAiScore = (data: any): number => {
    let score = 0;

    // Normalize data
    const metaTitle = data.metaTitle;
    const metaDescription = data.metaDescription;
    const llmDescription = data.llmDescription;
    
    // Filter out empty FAQs
    const faq = (data.faq || []).filter((f: any) => f.question?.trim() && f.answer?.trim());
    
    // Relationships mapping
    let hasLinkage = false;
    if ((data.relatedProducts?.length || 0) > 0 || (data.accessories?.length || 0) > 0 || (data.alternatives?.length || 0) > 0) {
        hasLinkage = true;
    } else if (data.relationships && Array.isArray(data.relationships) && data.relationships.length > 0) {
        hasLinkage = true;
    }

    // Specifications mapping
    let hasSpecs = false;
    if (data.specifications) {
        if (Array.isArray(data.specifications)) {
            hasSpecs = data.specifications.filter((s: any) => s.key?.trim() && s.value?.trim()).length > 0;
        } else {
            // It's an object from DB or mapped from state
            hasSpecs = Object.entries(data.specifications).filter(([k, v]: [any, any]) => 
                k?.toString().trim() && v?.toString().trim()
            ).length > 0;
        }
    }

    // 1. SEO (Meta Title & Description) - 25%
    if (metaTitle?.trim() && metaDescription?.trim()) {
        score += 25;
    }

    // 2. GEO / LLM Description - 25%
    if (llmDescription && llmDescription.trim().length > 50) {
        score += 25;
    }

    // 3. Technical FAQ (5+ questions) - 20%
    if (faq.length >= 5) {
        score += 20;
    }

    // 4. Smart Linkage - 15%
    if (hasLinkage) {
        score += 15;
    }

    // 5. Technical Specs - 15%
    if (hasSpecs) {
        score += 15;
    }

    return score;
};
