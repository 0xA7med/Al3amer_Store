import { Router, Request, Response } from 'express';
import { db } from '../db/index.js';
import { products, productImages, brands } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

const router: Router = Router();

const SITE_URL = 'https://al3amer.store';
const CURRENCY = 'EGP';

function escapeXml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

router.get('/merchant-feed.xml', async (_req: Request, res: Response) => {
    try {
        const allProducts = await db.query.products.findMany({
            where: and(
                eq(products.status, 'active'),
            ),
            with: {
                images: {
                    orderBy: (productImages, { asc }) => [asc(productImages.sortOrder)],
                    limit: 5,
                },
                brand: true,
            },
        });

        const items = allProducts.map(p => {
            const title = escapeXml(p.name || '');
            const description = escapeXml(
                (p.llmDescription || p.description || '').slice(0, 5000)
            );
            const link = `${SITE_URL}/product/${p.slug}`;
            const imageLink = p.images.length > 0 ? escapeXml(p.images[0].url) : '';
            const price = parseFloat(p.price.toString()).toFixed(2);
            const salePrice = p.discountPrice
                ? parseFloat(p.discountPrice.toString()).toFixed(2)
                : null;
            const availability = (p.stock ?? 0) > 0 ? 'in_stock' : 'out_of_stock';
            const brandName = p.brand?.name ? escapeXml(p.brand.name) : 'مركز العامر';
            const gtin = p.barcode ? escapeXml(p.barcode) : '';
            const mpn = p.sku ? escapeXml(p.sku) : p.externalId ? escapeXml(p.externalId) : '';
            const itemGroupId = p.parentId || '';

            let additionalImages = '';
            if (p.images.length > 1) {
                additionalImages = p.images.slice(1).map(img =>
                    `      <g:additional_image_link>${escapeXml(img.url)}</g:additional_image_link>`
                ).join('\n') + '\n';
            }

            return `
    <item>
      <g:id>${mpn || p.id}</g:id>
      <g:title>${title}</g:title>
      <g:description>${description}</g:description>
      <g:link>${link}</g:link>
      <g:image_link>${imageLink}</g:image_link>
${additionalImages}      <g:availability>${availability}</g:availability>
      <g:price>${price} ${CURRENCY}</g:price>
      ${salePrice ? `<g:sale_price>${salePrice} ${CURRENCY}</g:sale_price>\n` : ''}      <g:condition>new</g:condition>
      <g:brand>${brandName}</g:brand>
      ${gtin ? `      <g:gtin>${gtin}</g:gtin>\n` : ''}      <g:mpn>${mpn}</g:mpn>
      ${itemGroupId ? `      <g:item_group_id>${itemGroupId}</g:item_group_id>\n` : ''}    </item>`;
        });

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Al3amer Store - مركز العامر</title>
    <link>${SITE_URL}</link>
    <description>منتجات مركز العامر لأنظمة المحاسبة وأجهزة الكاشير</description>
${items.join('')}
  </channel>
</rss>`;

        res.set('Content-Type', 'application/xml; charset=utf-8');
        res.send(xml);
    } catch (error) {
        console.error('Error generating merchant feed:', error);
        res.status(500).type('text/plain').send('Failed to generate feed');
    }
});

export default router;
