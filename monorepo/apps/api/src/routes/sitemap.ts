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

        const staticPages = [
            { loc: '/', priority: '1.0', changefreq: 'daily' },
            { loc: '/shop', priority: '0.9', changefreq: 'daily' },
            { loc: '/offers', priority: '0.8', changefreq: 'daily' },
            { loc: '/about', priority: '0.7', changefreq: 'weekly' },
            { loc: '/ai-builder', priority: '0.6', changefreq: 'weekly' },
            { loc: '/login', priority: '0.3', changefreq: 'monthly' },
        ];

        const urls = [
            ...staticPages.map(p => `
    <url>
      <loc>${baseUrl}${p.loc}</loc>
      <changefreq>${p.changefreq}</changefreq>
      <priority>${p.priority}</priority>
    </url>`),
            ...allCategories.map(c => `
    <url>
      <loc>${baseUrl}/shop?category=${c.slug}</loc>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>`),
            ...allProducts.map(p => `
    <url>
      <loc>${baseUrl}/product/${p.slug}</loc>
      <lastmod>${new Date(p.updatedAt ?? new Date()).toISOString()}</lastmod>
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
      ${p.llmDescription ? `<llm:description><![CDATA[${p.llmDescription}]]></llm:description>` : ''}
      ${p.faq && Array.isArray(p.faq) && p.faq.length > 0 ? `<llm:faq><![CDATA[${JSON.stringify(p.faq)}]]></llm:faq>` : ''}
    </url>`).join('');

        res.header('Content-Type', 'application/xml; charset=utf-8');
        res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:llm="http://al3amer.store/llm">\n  ${urls}\n</urlset>`);
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
            columns: { name: true, slug: true, description: true, llmDescription: true, faq: true },
        });

        let markdown = `# Al3amer Store - Product Catalog (LLM Optimized)\n\n`;
        
        allProducts.forEach(p => {
            markdown += `## [${p.name}](${baseUrl}/product/${p.slug})\n\n`;
            if (p.llmDescription) markdown += `**Technical Summary:**\n${p.llmDescription}\n\n`;
            else markdown += `${p.description?.slice(0, 500) || ''}...\n\n`;
            
            if (p.faq && Array.isArray(p.faq) && p.faq.length > 0) {
                markdown += `### Frequently Asked Questions\n`;
                p.faq.forEach((f: any) => {
                    markdown += `**Q: ${f.question}**\nA: ${f.answer}\n\n`;
                });
            }
            markdown += `---\n\n`;
        });

        res.header('Content-Type', 'text/markdown; charset=utf-8');
        res.send(markdown);
    } catch (error) {
        console.error('Error generating LLM catalog:', error);
        res.status(500).json({ error: 'Failed to generate LLM catalog' });
    }
});

export default router;
