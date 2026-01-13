import dotenv from 'dotenv';
dotenv.config();

import { db, migrationClient } from '../db/index.js';
import { productImages } from '../db/schema.js';
import { like, or } from 'drizzle-orm';

async function fixImages() {
    try {
        console.log('🔍 Searching for broken "i.ibb.co" images in database...');
        const brokenUrl = 'i.ibb.co/7YFxyzW/printer.png';
        const placeholder = 'https://placehold.co/600x400/png?text=Printer';

        // 1. Check product_images table for broken URLs
        const piMatches = await db.select().from(productImages).where(
            or(
                like(productImages.url, `%${brokenUrl}%`),
                like(productImages.url, 'blob:%')
            )
        );

        if (piMatches.length > 0) {
            console.log(`🛠️ Updating ${piMatches.length} references in product_images...`);
            // Update i.ibb.co to placeholder
            await db.update(productImages)
                .set({ url: placeholder })
                .where(like(productImages.url, `%${brokenUrl}%`));

            // Delete blob URLs
            await db.delete(productImages)
                .where(like(productImages.url, 'blob:%'));

            console.log('✅ Updated broken URLs and deleted blob references.');
        }

        // 2. Check products table (metadata/other fields if they exist)
        // Some schemas store a primary 'image' or use a 'metadata' JSON
        // Based on the error stack, it seems to be reading from product.images[0].url
        // which usually maps to the product_images table in our Drizzle schema.

        console.log('✅ Search and update completed.');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error fixing images:', error);
        process.exit(1);
    } finally {
        await migrationClient.end();
    }
}

fixImages();
