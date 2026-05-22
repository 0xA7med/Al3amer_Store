import { Router } from 'express';
import { db } from '../db/index.js';
import { products, categories } from '../db/schema.js';
import { eq } from 'drizzle-orm';

const router: Router = Router();

router.get('/sitemap.xml', async (_req, res) => {
    try {
        const baseUrl = process.env.SITE_URL || 'https://al3amer.store';

        const allProducts = await db.query.products.findMany({
            where: eq(products.status, 'active'),
            columns: { slug: true, updatedAt: true },
        });

        const allCategories = await db.query.categories.findMany({
            where: eq(categories.isActive, true),
            columns: { slug: true },
        });

        const now = new Date().toISOString();

        const staticPages = [
            { loc: '/', priority: '1.0', changefreq: 'daily' },
            { loc: '/shop', priority: '0.9', changefreq: 'daily' },
            { loc: '/offers', priority: '0.8', changefreq: 'daily' },
            { loc: '/llm-catalog.md', priority: '0.5', changefreq: 'weekly' },
            { loc: '/about', priority: '0.7', changefreq: 'weekly' },
            { loc: '/ai-builder', priority: '0.6', changefreq: 'weekly' },
        ];

        const urls = [
            ...staticPages.map(p => `
    <url>
      <loc>${baseUrl}${p.loc}</loc>
      <lastmod>${now}</lastmod>
      <changefreq>${p.changefreq}</changefreq>
      <priority>${p.priority}</priority>
    </url>`),
            ...allCategories.map(c => `
    <url>
      <loc>${baseUrl}/shop?categories=${c.slug}</loc>
      <lastmod>${now}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>`),
            ...allProducts.map(p => `
    <url>
      <loc>${baseUrl}/product/${p.slug}</loc>
      <lastmod>${new Date(p.updatedAt ?? now).toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.9</priority>
    </url>`),
        ].join('');

        res.header('Content-Type', 'application/xml; charset=utf-8');
        res.send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls}
</urlset>`);
    } catch (error) {
        console.error('Error generating sitemap:', error);
        res.status(500).json({ error: 'Failed to generate sitemap' });
    }
});

router.get('/sitemap_llm.xml', async (_req, res) => {
    try {
        const baseUrl = process.env.SITE_URL || 'https://al3amer.store';
        const allProducts = await db.query.products.findMany({
            where: eq(products.status, 'active'),
            columns: { slug: true, updatedAt: true, llmDescription: true, faq: true },
        });

        const urls = allProducts.map(p => `
    <url>
      <loc>${baseUrl}/product/${p.slug}</loc>
      <lastmod>${new Date(p.updatedAt ?? new Date()).toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>1.0</priority>
    </url>`).join('');

        res.header('Content-Type', 'application/xml; charset=utf-8');
        res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  ${urls}\n</urlset>`);
    } catch (error) {
        console.error('Error generating LLM sitemap:', error);
        res.status(500).json({ error: 'Failed to generate LLM sitemap' });
    }
});

router.get('/llm-catalog.md', async (_req, res) => {
    try {
        const baseUrl = process.env.SITE_URL || 'https://al3amer.store';
        const allProducts = await db.query.products.findMany({
            where: eq(products.status, 'active'),
            columns: { name: true, slug: true, description: true, llmDescription: true, faq: true, price: true, discountPrice: true, specifications: true },
            with: { brand: true },
        });

        let markdown = `# Al3amer Store - AI-Ready Product Catalog\n`;
        markdown += `*Generated: ${new Date().toLocaleDateString('ar-EG')}*\n\n`;
        markdown += `This catalog is optimized for Large Language Models (LLMs) and AI search engines. It provides technical summaries, specifications, and FAQs for our POS and electronics inventory.\n\n`;
        
        allProducts.forEach(p => {
            const currentPrice = p.discountPrice ? parseFloat(p.discountPrice) : parseFloat(p.price);
            
            markdown += `## ${p.name}\n`;
            markdown += `**URL:** ${baseUrl}/product/${p.slug}\n`;
            markdown += `**Price:** ${currentPrice.toLocaleString()} EGP\n`;
            if (p.brand) markdown += `**Brand:** ${(p.brand as any).name}\n`;
            markdown += `\n`;

            if (p.llmDescription) {
                markdown += `### Technical Summary\n${p.llmDescription}\n\n`;
            } else {
                markdown += `### Description\n${p.description?.slice(0, 500) || ''}...\n\n`;
            }

            if (p.specifications && Array.isArray(p.specifications) && p.specifications.length > 0) {
                markdown += `### Technical Specifications\n`;
                p.specifications.forEach((s: any) => {
                    markdown += `- **${s.key}:** ${s.value}\n`;
                });
                markdown += `\n`;
            }
            
            if (p.faq && Array.isArray(p.faq) && p.faq.length > 0) {
                markdown += `### Frequently Asked Questions\n`;
                p.faq.forEach((f: any) => {
                    markdown += `**Q: ${f.question}**\nA: ${f.answer}\n\n`;
                });
            }
            markdown += `\n---\n\n`;
        });

        res.header('Content-Type', 'text/markdown; charset=utf-8');
        res.send(markdown);
    } catch (error) {
        console.error('Error generating LLM catalog:', error);
        res.status(500).json({ error: 'Failed to generate LLM catalog' });
    }
});

export default router;
