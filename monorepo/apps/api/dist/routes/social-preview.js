import { Router } from 'express';
import { db } from '../db/index.js';
import { products, categories } from '../db/schema.js';
import { eq } from 'drizzle-orm';
const router = Router();
// Catch all paths that are routed here from web frontend
router.get('/*', async (req, res) => {
    // req.params[0] will be the part matched by `/*` e.g., 'product/my-item-slug'
    const path = req.params[0] || '';
    // Default meta tags (fallback to homepage info)
    let title = 'Al3amer Store - مركز العامر';
    let description = 'المركز الرائد لتجهيزات المحلات التجارية والكاشير وأنظمة المراقبة في مصر';
    let image = 'https://i.ibb.co/KkCv1LF/Logo-Al3amer.png';
    try {
        // 1. Check if it's a product
        if (path.startsWith('product/')) {
            const slug = path.split('/')[1];
            if (slug) {
                const product = await db.query.products.findFirst({
                    where: eq(products.slug, slug),
                    with: {
                        images: true
                    }
                });
                if (product) {
                    title = `${product.name} | Al3amer Store`;
                    // Strip HTML tags from description and truncate
                    const strippedDesc = product.description?.replace(/<[^>]*>?/gm, '') || '';
                    description = strippedDesc.length > 200 ? strippedDesc.substring(0, 200) + '...' : (strippedDesc || description);
                    const primaryImage = product.images?.find((img) => img.isPrimary);
                    const firstImage = product.images?.[0];
                    if (primaryImage?.url)
                        image = primaryImage.url;
                    else if (firstImage?.url)
                        image = firstImage.url;
                }
            }
        }
        // 2. Check if it's a category filtering
        else if (path.startsWith('shop') || path === 'shop') {
            title = 'تسوق الآن | Al3amer Store';
            description = 'تصفح جميع المنتجات والأنظمة الخاصة بالكاشير والتجهيزات';
            if (req.query.categories) {
                const catSlug = req.query.categories;
                const cat = await db.query.categories.findFirst({
                    where: eq(categories.slug, catSlug),
                    with: {
                        products: {
                            limit: 3,
                            with: { images: true }
                        }
                    }
                });
                if (cat) {
                    title = `${cat.name} | Al3amer Store`;
                    // 1. Better Dynamic Image (Fallback to first product image if category has no image)
                    if (cat.image) {
                        image = cat.image;
                    }
                    else if (cat.products && cat.products.length > 0) {
                        const productWithImg = cat.products.find(p => p.images && p.images.length > 0);
                        if (productWithImg) {
                            const primaryImg = productWithImg.images.find(img => img.isPrimary);
                            image = primaryImg?.url || productWithImg.images[0].url;
                        }
                    }
                    // 2. Dynamic Description based on content
                    if (cat.products && cat.products.length > 0) {
                        const sampleNames = cat.products.map(p => p.name).join('، ');
                        description = `اكتشف أفضل الخيارات في قسم ${cat.name} مثل: ${sampleNames} وغيرها الكثير بمتجر العامر.`;
                    }
                    else {
                        description = `تصفح أحدث وأفضل منتجات ${cat.name} لتجهيزات مؤسستك التقنية بأسعار ضمان استثنائية من متجر العامر.`;
                    }
                }
            }
        }
    }
    catch (err) {
        console.error('Bot Preview Error:', err);
        // Fail silently by returning defaults
    }
    // HTML Payload strictly for Bots
    const htmlResponse = `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="utf-8">
            <title>${title}</title>
            <meta name="description" content="${description}">
            
            <!-- Open Graph / Facebook / WhatsApp -->
            <meta property="og:type" content="website">
            <meta property="og:url" content="https://al3amer.store/${path}">
            <meta property="og:title" content="${title}">
            <meta property="og:description" content="${description}">
            <meta property="og:image" content="${image}">
            
            <!-- Twitter -->
            <meta property="twitter:card" content="summary_large_image">
            <meta property="twitter:url" content="https://al3amer.store/${path}">
            <meta property="twitter:title" content="${title}">
            <meta property="twitter:description" content="${description}">
            <meta property="twitter:image" content="${image}">
        </head>
        <body>
            <h1>${title}</h1>
            <p>${description}</p>
            <img src="${image}" alt="${title}" />
        </body>
        </html>
    `;
    return res.status(200).send(htmlResponse);
});
export default router;
//# sourceMappingURL=social-preview.js.map