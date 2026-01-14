import { db } from '../db/index.js';
import { products } from '../db/schema.js';
import { eq, isNull } from 'drizzle-orm';
import { ProductsController } from '../controllers/products.controller.js';

async function backfillSlugs() {
    console.log('🚀 Starting slug backfill...');

    try {
        const allProducts = await db.query.products.findMany({
            where: isNull(products.slug)
        });

        console.log(`Found ${allProducts.length} products without slugs.`);

        for (const product of allProducts) {
            const slug = ProductsController.slugify(product.name);
            console.log(`Updating "${product.name}" -> ${slug}`);

            await db.update(products)
                .set({ slug })
                .where(eq(products.id, product.id));
        }

        console.log('✅ Backfill completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Backfill failed:', error);
        process.exit(1);
    }
}

backfillSlugs();
