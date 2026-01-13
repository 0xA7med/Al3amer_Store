import dotenv from 'dotenv';
dotenv.config();

import { db, migrationClient } from '../db/index.js';
import { products } from '../db/schema.js';
import { eq, isNull } from 'drizzle-orm';

// Helper to generate SEO friendly slugs (Arabic & English)
// Replicating logic from ProductsController to avoid complex imports in script
function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')     // Replace spaces with -
        .replace(/[^\w\u0621-\u064A-]+/g, '') // Remove all non-word chars (support Arabic)
        .replace(/--+/g, '-')     // Replace multiple - with single -
        .replace(/^-+/, '')       // Trim - from start of text
        .replace(/-+$/, '');      // Trim - from end of text
}

async function backfillSlugs() {
    try {
        console.log('🔄 Starting product slug backfill...');

        // Find products with missing slugs
        const productsToUpdate = await db.query.products.findMany({
            where: isNull(products.slug)
        });

        console.log(`Found ${productsToUpdate.length} products with missing slugs.`);

        if (productsToUpdate.length === 0) {
            console.log('✅ No products need updates. Exiting.');
            process.exit(0);
        }

        let updatedCount = 0;
        let errorCount = 0;

        for (const product of productsToUpdate) {
            try {
                const slug = slugify(product.name);

                // Ensure unique slug if needed (simple append for now if collision happens, though unique constraint will catch it)
                // ideally we'd check existence but for a backfill let's try direct update first

                await db.update(products)
                    .set({ slug: slug })
                    .where(eq(products.id, product.id));

                console.log(`✅ Updated: "${product.name}" -> "${slug}"`);
                updatedCount++;
            } catch (err) {
                console.error(`❌ Failed to update "${product.name}":`, err);
                errorCount++;
            }
        }

        console.log(`\n🎉 Backfill completed!`);
        console.log(`✅ Success: ${updatedCount}`);
        console.log(`❌ Errors: ${errorCount}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Fatal error during backfill:', error);
        process.exit(1);
    } finally {
        await migrationClient.end();
    }
}

backfillSlugs();
