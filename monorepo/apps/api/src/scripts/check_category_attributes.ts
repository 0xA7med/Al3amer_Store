import { db } from '../db/index.js';
import { categories } from '../db/schema.js';
import { inArray } from 'drizzle-orm';

async function main() {
    const slugs = ['pos-systems', 'barcode-scanners', 'printers', 'handheld-pos'];
    const cats = await db.query.categories.findMany({
        where: inArray(categories.slug, slugs)
    });

    for (const cat of cats) {
        console.log(`\nCategory: ${cat.name} (${cat.slug})`);
        console.log('Attributes:');
        if (cat.attributesSchema && cat.attributesSchema.length > 0) {
            cat.attributesSchema.forEach(attr => {
                console.log(`  - ${attr.name} [${attr.type}]: ${attr.options.join(', ')}`);
            });
        } else {
            console.log('  No attributes defined');
        }
    }
    process.exit(0);
}

main().catch(console.error);
