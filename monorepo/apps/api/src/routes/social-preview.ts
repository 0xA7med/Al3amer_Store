import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { products, categories } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

const router: Router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// CRAWLER PREVIEW ENDPOINT
//
// This endpoint serves TWO audiences:
//   1. Social bots (WhatsApp, Facebook, Telegram) → read Open Graph meta tags
//   2. Search engines & AI crawlers (Googlebot, GPTBot, ClaudeBot, Gemini-AI,
//      Bingbot, Applebot, Perplexity) → read full semantic HTML body content
//
// Strategy: Return a fully-rendered semantic HTML page with real data from DB.
// This is called "Dynamic Rendering" and is explicitly approved by Google.
//
// Key rule: The HTML returned here must MATCH the final React-rendered content
// (same product name, description, price, specs). Never show different content
// to bots than what users see (that's cloaking and will get the site penalized).
// ─────────────────────────────────────────────────────────────────────────────

const SITE_URL = process.env.SITE_URL || 'https://al3amer.store';
const DEFAULT_IMAGE = 'https://i.ibb.co/KkCv1LF/Logo-Al3amer.png';

/** Safely escape HTML special characters to prevent XSS in server-rendered HTML */
function escHtml(str: string | null | undefined): string {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/** Strip HTML tags from description strings */
function stripHtml(str: string | null | undefined): string {
    if (!str) return '';
    return str.replace(/<[^>]*>?/gm, '').trim();
}

/** Format price in Egyptian Pounds */
function formatPrice(price: string | number | null | undefined): string {
    if (!price) return '';
    const num = parseFloat(String(price));
    return isNaN(num) ? '' : num.toLocaleString('ar-EG') + ' ج.م';
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT PAGE RENDERER
// ─────────────────────────────────────────────────────────────────────────────
async function renderProductPage(slug: string, path: string): Promise<string | null> {
    const product = await db.query.products.findFirst({
        where: and(eq(products.slug, slug), eq(products.status, 'active')),
        with: {
            images: true,
            category: true,
            brand: true,
        }
    });

    if (!product) return null;

    const primaryImage = product.images?.find((img: any) => img.isPrimary);
    const firstImage = product.images?.[0];
    const imageUrl = primaryImage?.url || firstImage?.url || DEFAULT_IMAGE;

    const currentPrice = product.discountPrice
        ? parseFloat(product.discountPrice as string)
        : parseFloat(product.price as string);
    const originalPrice = product.discountPrice ? parseFloat(product.price as string) : null;
    const hasDiscount = originalPrice !== null && originalPrice > currentPrice;

    const cleanDescription = stripHtml(product.description);
    const metaDescription = product.metaDescription
        || (cleanDescription.length > 200 ? cleanDescription.substring(0, 200) + '...' : cleanDescription)
        || `اشترِ ${product.name} بأفضل سعر في مصر من متجر العامر`;

    const title = product.metaTitle || `${product.name} | مركز العامر`;

    // Build specifications HTML
    const specs: Array<{ key: string; value: string }> = [];
    if (product.specifications && Array.isArray(product.specifications)) {
        product.specifications.forEach((s: any) => {
            if (s.key && s.value) specs.push({ key: s.key, value: s.value });
        });
    }
    if (product.dynamicAttributes && typeof product.dynamicAttributes === 'object') {
        Object.entries(product.dynamicAttributes as Record<string, any>).forEach(([key, value]) => {
            if (key && value) {
                const valStr = Array.isArray(value) ? value.join('، ') : String(value);
                specs.push({ key, value: valStr });
            }
        });
    }

    const specsHtml = specs.length > 0 ? `
        <section aria-label="المواصفات التقنية">
            <h2>المواصفات التقنية</h2>
            <table>
                <tbody>
                    ${specs.map(s => `
                    <tr>
                        <th scope="row">${escHtml(s.key)}</th>
                        <td>${escHtml(s.value)}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </section>` : '';

    // Build FAQ HTML
    const faqs: Array<{ question: string; answer: string }> = Array.isArray(product.faq) ? product.faq as any[] : [];
    const faqHtml = faqs.length > 0 ? `
        <section aria-label="الأسئلة الشائعة">
            <h2>الأسئلة الشائعة</h2>
            ${faqs.map(f => `
            <details>
                <summary>${escHtml(f.question)}</summary>
                <p>${escHtml(f.answer)}</p>
            </details>`).join('')}
        </section>` : '';

    // LLM Description
    const llmHtml = product.llmDescription ? `
        <section aria-label="نبذة تقنية">
            <h2>نبذة تقنية</h2>
            <p>${escHtml(product.llmDescription)}</p>
        </section>` : '';

    // JSON-LD structured data for Google Rich Results
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: cleanDescription || metaDescription,
        image: imageUrl,
        sku: product.sku || product.slug,
        url: `${SITE_URL}/product/${product.slug}`,
        brand: product.brand ? {
            '@type': 'Brand',
            name: (product.brand as any).name,
        } : undefined,
        offers: {
            '@type': 'Offer',
            price: currentPrice.toFixed(2),
            priceCurrency: 'EGP',
            availability: (product.stock ?? 0) > 0
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            url: `${SITE_URL}/product/${product.slug}`,
            seller: {
                '@type': 'Organization',
                name: 'مركز العامر',
            }
        },
        ...(faqs.length > 0 ? {
            mainEntity: faqs.map(f => ({
                '@type': 'Question',
                name: f.question,
                acceptedAnswer: {
                    '@type': 'Answer',
                    text: f.answer,
                }
            }))
        } : {})
    };

    // Breadcrumb JSON-LD
    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'المتجر', item: `${SITE_URL}/shop` },
            ...(product.category ? [{ '@type': 'ListItem', position: 3, name: (product.category as any).name, item: `${SITE_URL}/shop?categories=${(product.category as any).slug}` }] : []),
            { '@type': 'ListItem', position: product.category ? 4 : 3, name: product.name, item: `${SITE_URL}/product/${product.slug}` },
        ]
    };

    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escHtml(title)}</title>
    <meta name="description" content="${escHtml(metaDescription)}">
    <link rel="canonical" href="${SITE_URL}/product/${escHtml(slug)}">

    <!-- Open Graph -->
    <meta property="og:type" content="product">
    <meta property="og:url" content="${SITE_URL}/product/${escHtml(slug)}">
    <meta property="og:title" content="${escHtml(title)}">
    <meta property="og:description" content="${escHtml(metaDescription)}">
    <meta property="og:image" content="${escHtml(imageUrl)}">
    <meta property="og:site_name" content="مركز العامر">
    <meta property="og:locale" content="ar_EG">
    <meta property="product:price:amount" content="${currentPrice.toFixed(2)}">
    <meta property="product:price:currency" content="EGP">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escHtml(title)}">
    <meta name="twitter:description" content="${escHtml(metaDescription)}">
    <meta name="twitter:image" content="${escHtml(imageUrl)}">

    <!-- JSON-LD Structured Data -->
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
    <script type="application/ld+json">${JSON.stringify(breadcrumbJsonLd)}</script>

    <style>
        body { font-family: Arial, sans-serif; direction: rtl; max-width: 900px; margin: 0 auto; padding: 20px; color: #1a1a1a; }
        h1 { font-size: 1.8rem; margin-bottom: 0.5rem; }
        h2 { font-size: 1.2rem; margin-top: 2rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; }
        .breadcrumb { font-size: 0.85rem; color: #666; margin-bottom: 1rem; }
        .breadcrumb a { color: #0066cc; text-decoration: none; }
        .price-block { margin: 1rem 0; }
        .price { font-size: 1.6rem; font-weight: bold; color: #c0392b; }
        .original-price { font-size: 1rem; color: #888; text-decoration: line-through; margin-right: 0.5rem; }
        .badge { display: inline-block; background: #e74c3c; color: #fff; font-size: 0.75rem; padding: 2px 8px; border-radius: 12px; margin-right: 0.5rem; }
        .in-stock { color: #27ae60; font-weight: bold; }
        .out-of-stock { color: #e74c3c; font-weight: bold; }
        img { max-width: 100%; height: auto; border-radius: 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
        th, td { padding: 8px 12px; border: 1px solid #ddd; text-align: right; }
        th { background: #f5f5f5; font-weight: 600; width: 35%; }
        details { margin-bottom: 0.75rem; border: 1px solid #eee; border-radius: 6px; padding: 0.5rem 1rem; }
        summary { cursor: pointer; font-weight: 600; padding: 0.25rem 0; }
        details p { margin: 0.5rem 0 0; color: #444; }
    </style>
</head>
<body>
    <nav class="breadcrumb" aria-label="breadcrumb">
        <a href="${SITE_URL}">الرئيسية</a> &gt;
        <a href="${SITE_URL}/shop">المتجر</a>
        ${product.category ? ` &gt; <a href="${SITE_URL}/shop?categories=${escHtml((product.category as any).slug)}">${escHtml((product.category as any).name)}</a>` : ''}
        &gt; <span>${escHtml(product.name)}</span>
    </nav>

    <article itemscope itemtype="https://schema.org/Product">
        <h1 itemprop="name">${escHtml(product.name)}</h1>

        ${product.brand ? `<p><strong>العلامة التجارية:</strong> <span itemprop="brand">${escHtml((product.brand as any).name)}</span></p>` : ''}
        ${product.sku ? `<p><strong>الكود / SKU:</strong> <code>${escHtml(product.sku)}</code></p>` : ''}

        <div class="price-block" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
            <meta itemprop="priceCurrency" content="EGP">
            <meta itemprop="price" content="${currentPrice.toFixed(2)}">
            ${hasDiscount ? `<span class="badge">خصم</span>` : ''}
            <span class="price">${formatPrice(currentPrice)}</span>
            ${hasDiscount && originalPrice ? `<span class="original-price">${formatPrice(originalPrice)}</span>` : ''}
            <br>
            <span class="${(product.stock ?? 0) > 0 ? 'in-stock' : 'out-of-stock'}" itemprop="availability"
                  content="${(product.stock ?? 0) > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock'}">
                ${(product.stock ?? 0) > 0 ? '✓ متوفر في المخزون' : '✗ غير متوفر حالياً'}
            </span>
        </div>

        ${imageUrl !== DEFAULT_IMAGE ? `<img src="${escHtml(imageUrl)}" alt="${escHtml(product.name)}" itemprop="image" width="600" height="400" loading="eager">` : ''}

        ${cleanDescription ? `
        <section aria-label="وصف المنتج">
            <h2>وصف المنتج</h2>
            <p itemprop="description">${escHtml(cleanDescription)}</p>
        </section>` : ''}

        ${llmHtml}
        ${specsHtml}
        ${faqHtml}
    </article>

    <!-- Internal links to help crawlers discover more pages -->
    <nav aria-label="تنقل">
        <p><a href="${SITE_URL}/shop">← تصفح جميع المنتجات</a></p>
        ${product.category ? `<p><a href="${SITE_URL}/shop?categories=${escHtml((product.category as any).slug)}">← تصفح ${escHtml((product.category as any).name)}</a></p>` : ''}
    </nav>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY / SHOP PAGE RENDERER
// ─────────────────────────────────────────────────────────────────────────────
async function renderShopPage(req: Request): Promise<string> {
    const catSlug = (req.query.categories || req.query.category) as string | undefined;

    let pageTitle = 'تسوق جميع المنتجات | مركز العامر';
    let pageDesc = 'تصفح أحدث أجهزة الكاشير وأنظمة المحاسبة والمراقبة من مركز العامر';
    let imageUrl = DEFAULT_IMAGE;
    let canonicalUrl = `${SITE_URL}/shop`;
    let catName = '';
    let productListHtml = '';

    if (catSlug) {
        const cat = await db.query.categories.findFirst({
            where: and(eq(categories.slug, catSlug), eq(categories.isActive, true)),
            with: {
                products: {
                    where: eq(products.status, 'active'),
                    limit: 30,
                    with: { images: true }
                }
            }
        });

        if (cat) {
            catName = (cat as any).name;
            pageTitle = `${catName} | مركز العامر`;
            canonicalUrl = `${SITE_URL}/shop?categories=${catSlug}`;

            if ((cat as any).image) {
                imageUrl = (cat as any).image;
            }

            const catProducts: any[] = (cat as any).products || [];

            if (catProducts.length > 0) {
                const sampleNames = catProducts.slice(0, 5).map((p: any) => p.name).join('، ');
                pageDesc = `اكتشف أفضل خيارات ${catName} مثل: ${sampleNames} وغيرها من مركز العامر. أفضل أسعار وضمان معتمد.`;

                productListHtml = `
                <section aria-label="منتجات ${escHtml(catName)}">
                    <h2>منتجات ${escHtml(catName)}</h2>
                    <ul style="list-style:none; padding:0; display:grid; grid-template-columns: repeat(auto-fill, minmax(200px,1fr)); gap:16px;">
                        ${catProducts.map((p: any) => {
                            const img = p.images?.find((i: any) => i.isPrimary) || p.images?.[0];
                            const price = p.discountPrice || p.price;
                            return `
                            <li itemscope itemtype="https://schema.org/Product" style="border:1px solid #eee; border-radius:8px; padding:12px;">
                                ${img ? `<img src="${escHtml(img.url)}" alt="${escHtml(p.name)}" width="180" height="180" loading="lazy" style="width:100%; height:160px; object-fit:contain;">` : ''}
                                <h3 itemprop="name" style="font-size:0.9rem; margin:8px 0 4px;">
                                    <a href="${SITE_URL}/product/${escHtml(p.slug)}" itemprop="url">${escHtml(p.name)}</a>
                                </h3>
                                <p style="color:#c0392b; font-weight:bold; margin:0;" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
                                    <meta itemprop="priceCurrency" content="EGP">
                                    <span itemprop="price" content="${parseFloat(price).toFixed(2)}">${formatPrice(price)}</span>
                                </p>
                            </li>`;
                        }).join('')}
                    </ul>
                </section>`;
            } else {
                pageDesc = `تصفح أفضل منتجات ${catName} من مركز العامر بأفضل الأسعار وضمان معتمد.`;
            }
        }
    }

    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'الرئيسية', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'المتجر', item: `${SITE_URL}/shop` },
            ...(catName ? [{ '@type': 'ListItem', position: 3, name: catName, item: canonicalUrl }] : [])
        ]
    };

    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escHtml(pageTitle)}</title>
    <meta name="description" content="${escHtml(pageDesc)}">
    <link rel="canonical" href="${escHtml(canonicalUrl)}">

    <!-- Open Graph -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${escHtml(canonicalUrl)}">
    <meta property="og:title" content="${escHtml(pageTitle)}">
    <meta property="og:description" content="${escHtml(pageDesc)}">
    <meta property="og:image" content="${escHtml(imageUrl)}">
    <meta property="og:site_name" content="مركز العامر">
    <meta property="og:locale" content="ar_EG">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escHtml(pageTitle)}">
    <meta name="twitter:description" content="${escHtml(pageDesc)}">
    <meta name="twitter:image" content="${escHtml(imageUrl)}">

    <script type="application/ld+json">${JSON.stringify(breadcrumbJsonLd)}</script>

    <style>
        body { font-family: Arial, sans-serif; direction: rtl; max-width: 1100px; margin: 0 auto; padding: 20px; color: #1a1a1a; }
        h1 { font-size: 1.8rem; margin-bottom: 0.5rem; }
        h2 { font-size: 1.2rem; margin-top: 2rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; }
        .breadcrumb { font-size: 0.85rem; color: #666; margin-bottom: 1rem; }
        .breadcrumb a { color: #0066cc; text-decoration: none; }
        a { color: #0066cc; }
    </style>
</head>
<body>
    <nav class="breadcrumb" aria-label="breadcrumb">
        <a href="${SITE_URL}">الرئيسية</a> &gt;
        <a href="${SITE_URL}/shop">المتجر</a>
        ${catName ? ` &gt; <span>${escHtml(catName)}</span>` : ''}
    </nav>

    <h1>${escHtml(pageTitle)}</h1>
    <p>${escHtml(pageDesc)}</p>

    ${productListHtml}
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// HOMEPAGE RENDERER
// ─────────────────────────────────────────────────────────────────────────────
async function renderHomePage(): Promise<string> {
    const allCategories = await db.query.categories.findMany({
        where: eq(categories.isActive, true),
        columns: { name: true, slug: true, description: true }
    });

    const title = 'مركز العامر - أجهزة الكاشير وأنظمة المحاسبة والمراقبة في مصر';
    const desc = 'المركز الرائد في مصر لتوريد وتركيب أجهزة الكاشير، أنظمة نقاط البيع، كاميرات المراقبة، والحلول التقنية للمحلات التجارية والمطاعم.';

    const categoryLinksHtml = allCategories.map((c: any) =>
        `<li><a href="${SITE_URL}/shop?categories=${escHtml(c.slug)}">${escHtml(c.name)}</a></li>`
    ).join('');

    const orgJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Store',
        name: 'مركز العامر',
        url: SITE_URL,
        logo: DEFAULT_IMAGE,
        description: desc,
        areaServed: 'EG',
        currenciesAccepted: 'EGP',
        paymentAccepted: 'Cash, Credit Card',
    };

    return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escHtml(title)}</title>
    <meta name="description" content="${escHtml(desc)}">
    <link rel="canonical" href="${SITE_URL}/">
    <meta property="og:type" content="website">
    <meta property="og:url" content="${SITE_URL}/">
    <meta property="og:title" content="${escHtml(title)}">
    <meta property="og:description" content="${escHtml(desc)}">
    <meta property="og:image" content="${DEFAULT_IMAGE}">
    <meta property="og:site_name" content="مركز العامر">
    <meta property="og:locale" content="ar_EG">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escHtml(title)}">
    <meta name="twitter:description" content="${escHtml(desc)}">
    <meta name="twitter:image" content="${DEFAULT_IMAGE}">
    <script type="application/ld+json">${JSON.stringify(orgJsonLd)}</script>
    <style>
        body { font-family: Arial, sans-serif; direction: rtl; max-width: 900px; margin: 0 auto; padding: 20px; color: #1a1a1a; }
        h1 { font-size: 1.8rem; } h2 { font-size: 1.2rem; margin-top: 2rem; }
        ul { list-style: none; padding: 0; display: flex; flex-wrap: wrap; gap: 8px; }
        li a { display: block; background: #f0f4f8; padding: 8px 16px; border-radius: 20px; text-decoration: none; color: #0066cc; }
    </style>
</head>
<body>
    <h1>${escHtml(title)}</h1>
    <p>${escHtml(desc)}</p>
    <section aria-label="تصنيفات المنتجات">
        <h2>تصنيفات المنتجات</h2>
        <ul>${categoryLinksHtml}</ul>
    </section>
    <section>
        <h2>لماذا مركز العامر؟</h2>
        <ul style="display:block;">
            <li>✓ ضمان معتمد على جميع المنتجات</li>
            <li>✓ تركيب وصيانة محترفة</li>
            <li>✓ دعم فني متخصص</li>
            <li>✓ أفضل الأسعار في السوق المصري</li>
            <li>✓ شحن لجميع محافظات مصر</li>
        </ul>
    </section>
    <nav>
        <a href="${SITE_URL}/shop">تصفح جميع المنتجات</a> |
        <a href="${SITE_URL}/about">من نحن</a> |
        <a href="${SITE_URL}/offers">العروض</a>
    </nav>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN ROUTE HANDLER — catches all paths forwarded by Vercel
// ─────────────────────────────────────────────────────────────────────────────
router.get('/*', async (req: Request, res: Response) => {
    const path = (req.params as any)[0] || '';

    try {
        let html: string | null = null;

        if (path.startsWith('product/')) {
            const slug = path.split('/')[1];
            if (slug) {
                html = await renderProductPage(slug, path);
            }
        } else if (path.startsWith('shop') || path === 'shop') {
            html = await renderShopPage(req);
        } else if (path === '' || path === '/') {
            html = await renderHomePage();
        }

        // Fallback for unrecognised paths (about, offers, etc.)
        if (!html) {
            const title = 'مركز العامر - أجهزة الكاشير وأنظمة المحاسبة';
            const desc = 'المركز الرائد لتجهيزات المحلات التجارية والكاشير وأنظمة المراقبة في مصر';
            html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="utf-8">
    <title>${escHtml(title)}</title>
    <meta name="description" content="${escHtml(desc)}">
    <link rel="canonical" href="${SITE_URL}/${escHtml(path)}">
    <meta property="og:title" content="${escHtml(title)}">
    <meta property="og:description" content="${escHtml(desc)}">
    <meta property="og:image" content="${DEFAULT_IMAGE}">
    <meta property="og:url" content="${SITE_URL}/${escHtml(path)}">
</head>
<body>
    <h1>${escHtml(title)}</h1>
    <p>${escHtml(desc)}</p>
    <nav>
        <a href="${SITE_URL}">الرئيسية</a> |
        <a href="${SITE_URL}/shop">المتجر</a>
    </nav>
</body>
</html>`;
        }

        res.header('Content-Type', 'text/html; charset=utf-8');
        res.header('X-Robots-Tag', 'index, follow');
        res.header('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
        return res.status(200).send(html);

    } catch (err) {
        console.error('Crawler Preview Error:', err);
        // Fallback: return minimal but valid HTML even on error
        res.header('Content-Type', 'text/html; charset=utf-8');
        return res.status(200).send(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="utf-8"><title>مركز العامر</title></head>
<body><h1>مركز العامر</h1><a href="${SITE_URL}/shop">تصفح المنتجات</a></body>
</html>`);
    }
});

export default router;
