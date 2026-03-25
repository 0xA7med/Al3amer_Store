import { db } from '../src/db/index.js';
import { categories, products } from '../src/db/schema.js';
import { eq } from 'drizzle-orm';

async function check() {
    try {
        const cat = await db.query.categories.findFirst({
            where: eq(categories.slug, 'printers') // or whatever the slug for طابعات is
        });
        
        console.log('Category:', cat?.name);
        console.log('Schema:', JSON.stringify(cat?.attributesSchema, null, 2));

        const prods = await db.query.products.findMany({
            where: eq(products.categoryId, Object(cat).id)
        });
        
        console.log(`Found ${prods.length} products.`);
        if (prods.length > 0) {
            console.log('Sample Product Dynamic Attrs:', JSON.stringify(prods[0].dynamicAttributes, null, 2));
            console.log('Sample Product Specs:', JSON.stringify(prods[0].specifications, null, 2));
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}
check();
