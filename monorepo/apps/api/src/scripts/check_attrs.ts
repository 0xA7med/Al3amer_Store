import { db } from '../db/index.js';
import { categories } from '../db/schema.js';
import { inArray } from 'drizzle-orm';

async function main() {
    const slugs = ['pos-systems', 'barcode-scanners', 'printers', 'handheld-pos', 'pos-software'];
    const cats = await db.query.categories.findMany({
        where: inArray(categories.slug, slugs)
    });

    for (const cat of cats) {
        console.log(`\n=== Category: ${cat.name} (${cat.slug}) ===`);
        if (cat.attributesSchema && cat.attributesSchema.length > 0) {
            cat.attributesSchema.forEach(attr => {
                console.log(`- ${attr.name} [${attr.type}]: ${attr.options.join(' | ')}`);
            });
        } else {
            console.log('- No dynamic attributes found.');
        }
    }
    process.exit(0);
}

main().catch(console.error);
