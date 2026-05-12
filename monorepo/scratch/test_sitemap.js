
import { XMLParser } from 'fast-xml-parser';

const urls = `
    <url>
      <loc>https://al3amer.store/product/test</loc>
      <lastmod>2026-05-13T00:00:00.000Z</lastmod>
      <changefreq>weekly</changefreq>
      <priority>1.0</priority>
      <llm:description><![CDATA[Test description]]></llm:description>
      <llm:faq><![CDATA[[]]]></llm:faq>
    </url>`;

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:llm="http://al3amer.store/llm">
  ${urls}
</urlset>`;

try {
    const parser = new XMLParser();
    parser.parse(xml);
    console.log('XML is valid');
} catch (e) {
    console.error('XML is invalid:', e);
}
