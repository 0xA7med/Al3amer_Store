import { db } from '../db/index.js';
import { aiBundleLogs, products, categories, productImages } from '../db/schema.js';
import { eq, and, inArray } from 'drizzle-orm';
// Business type to category mapping (Force core items)
const BUSINESS_TYPE_CATEGORIES = {
    supermarket: ['pos-systems', 'scanners', 'scales', 'printers'],
    restaurant: ['pos-systems', 'printers', 'scanners'],
    clothing: ['pos-systems', 'scanners', 'printers'],
    pharmacy: ['pos-systems', 'scanners', 'printers'],
    custom: ['pos-systems', 'printers'],
};
// Feature to category mapping
const FEATURE_CATEGORIES = {
    scanner: 'scanners',
    printer: 'printers',
    scale: 'scales',
    drawer: 'drawers',
    touch: 'pos-systems',
};
export class AIBundleController {
    // POST /api/ai-bundle/generate - Generate AI bundle
    static async generate(req, res) {
        try {
            const { businessType, budget, selectedFeatures } = req.body;
            if (!businessType || !budget || !selectedFeatures) {
                return res.status(400).json({
                    error: 'Missing required fields: businessType, budget, selectedFeatures'
                });
            }
            // 1. Identify Required Categories
            const requiredCategorySlugs = new Set();
            // Always start with POS if not explicitly excluded (though in this UI touch/pos is usually selected)
            requiredCategorySlugs.add('pos-systems');
            // Add categories based on selected features
            if (Array.isArray(selectedFeatures)) {
                selectedFeatures.forEach((featureId) => {
                    const slug = FEATURE_CATEGORIES[featureId];
                    if (slug)
                        requiredCategorySlugs.add(slug);
                });
            }
            console.log(`[AI Bundle] Generating for Type: ${businessType}, Budget: ${budget}, Required Cats:`, Array.from(requiredCategorySlugs));
            // 2. Fetch Categories
            const categoryRecords = await db.query.categories.findMany({
                where: inArray(categories.slug, Array.from(requiredCategorySlugs)),
            });
            const slugToId = Object.fromEntries(categoryRecords.map(c => [c.slug, c.id]));
            const categoryIds = categoryRecords.map(c => c.id);
            // 3. Fetch Products for these categories
            const budgetNum = parseInt(budget);
            const availableProducts = await db.query.products.findMany({
                where: and(eq(products.status, 'active'), inArray(products.categoryId, categoryIds)),
                with: {
                    category: true,
                    images: {
                        where: eq(productImages.isPrimary, true),
                        limit: 1,
                    },
                },
            });
            // Group products by category slug
            const productsByCat = {};
            availableProducts.forEach(p => {
                const slug = p.category?.slug;
                if (!slug)
                    return;
                if (!productsByCat[slug])
                    productsByCat[slug] = [];
                productsByCat[slug].push(p);
            });
            // 4. Build Bundle (Strict selection)
            const bundleProducts = [];
            let totalPrice = 0;
            // Iterate through required categories
            for (const slug of Array.from(requiredCategorySlugs)) {
                const catProducts = productsByCat[slug] || [];
                if (catProducts.length === 0)
                    continue;
                // Sort by price helper (cheapest first)
                const sorted = catProducts.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
                // Find a product that fits (or the cheapest one if it's the first/core item)
                let selected = sorted[0]; // Default to cheapest
                // If we have budget flexibility, we could try to find a better one,
                // but for now, let's just pick one per category to ensure coverage.
                // If it's the core system, we take the one that fits best.
                if (selected) {
                    const price = parseFloat(selected.price);
                    bundleProducts.push({
                        productId: selected.id,
                        name: selected.name,
                        desc: selected.description?.substring(0, 100) || '',
                        price: price,
                        imageUrl: selected.images[0]?.url || '',
                        category: slug
                    });
                    totalPrice += price;
                }
            }
            // Metrics
            const exceedsBudget = totalPrice > budgetNum;
            const matchScore = Math.round((bundleProducts.length / requiredCategorySlugs.size) * 100);
            const result = {
                name: exceedsBudget ? 'حزمة مخصصة (تحتاج ميزانية أعلى)' : `حزمة كاشير ${businessType} الاحترافية`,
                description: exceedsBudget
                    ? 'تم اختيار أفضل المكونات المطلوبة، ولكن التكلفة تتجاوز الميزانية قليلاً لضمان الجودة.'
                    : 'حزمة كاملة تلبي جميع متطلباتك وضمن ميزانيتك المقترحة.',
                originalPrice: Math.round(totalPrice * 1.15),
                price: Math.round(totalPrice),
                savings: Math.round(totalPrice * 0.15),
                savingsPercentage: 15,
                matchScore,
                products: bundleProducts,
                exceedsBudget
            };
            // Auto-save to ai_bundle_logs
            try {
                await db.insert(aiBundleLogs).values({
                    userId: req.user?.id || null,
                    businessType,
                    budget: budgetNum,
                    selectedFeatures: Array.isArray(selectedFeatures) ? selectedFeatures : [],
                    resultBundle: result,
                    matchScore,
                });
            }
            catch (logError) {
                console.error('[AI Bundle] Failed to save log:', logError);
                // Don't fail the request if logging fails
            }
            console.log(`[AI Bundle] Finished. Match: ${matchScore}%, Total: ${totalPrice}, Exceeds: ${exceedsBudget}`);
            res.json(result);
        }
        catch (error) {
            console.error('Error generating bundle:', error);
            res.status(500).json({ error: 'Failed to generate bundle' });
        }
    }
    // POST /api/ai-bundle/log - Save bundle generation log
    static async log(req, res) {
        try {
            const { userId, businessType, budget, selectedFeatures, resultBundle, matchScore } = req.body;
            const [log] = await db.insert(aiBundleLogs).values({
                userId: userId || null,
                businessType,
                budget: parseInt(budget),
                selectedFeatures,
                resultBundle,
                matchScore,
            }).returning();
            res.status(201).json(log);
        }
        catch (error) {
            console.error('Error saving bundle log:', error);
            res.status(500).json({ error: 'Failed to save bundle log' });
        }
    }
}
//# sourceMappingURL=ai-bundle.controller.js.map