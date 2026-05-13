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
export const calculateAiScore = (data: AiScoreInput): number => {
    let score = 0;

    // 1. SEO (Meta Title & Description) - 25%
    if (data.metaTitle && data.metaDescription) {
        score += 25;
    }

    // 2. GEO / LLM Description - 25%
    if (data.llmDescription && data.llmDescription.length > 50) {
        score += 25;
    }

    // 3. Technical FAQ (5+ questions) - 20%
    if (data.faq && data.faq.length >= 5) {
        score += 20;
    } else if (data.faq && data.faq.length > 0) {
        // Partial credit for some FAQs
        score += 10;
    }

    // 4. Smart Linkage (Related, Accessories, Alternatives) - 15%
    const hasLinkage = (data.relatedProducts?.length || 0) > 0 || 
                      (data.accessories?.length || 0) > 0 || 
                      (data.alternatives?.length || 0) > 0;
    if (hasLinkage) {
        score += 15;
    }

    // 5. Technical Specs - 15%
    if (data.specifications && Object.keys(data.specifications).length > 0) {
        score += 15;
    }

    return score;
};
