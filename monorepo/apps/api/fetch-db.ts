import { db } from './src/db/index.js';
import fs from 'fs';

async function run() {
    const cats = await db.query.categories.findMany();
    const prods = await db.query.products.findMany({
        with: { category: true }
    });
    
    const output = {
        categories: cats.map(c => ({ name: c.name, slug: c.slug })),
        products: prods.filter(p => p.dynamicAttributes && Object.keys(p.dynamicAttributes).length > 0).map(p => ({
            name: p.name,
            category: p.category?.slug,
            dynamicAttributes: p.dynamicAttributes
        }))
    };

    fs.writeFileSync('C:\\Users\\zeero\\.gemini\\antigravity\\tmp-db.json', JSON.stringify(output, null, 2), 'utf-8');
    process.exit(0);
}
run().catch(console.error);
