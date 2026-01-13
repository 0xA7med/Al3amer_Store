import dotenv from 'dotenv';
dotenv.config();

import { db, migrationClient } from '../db/index.js';
import { productImages, products, categories, settings, banners } from '../db/schema.js';

async function listAllImages() {
    try {
        console.log('--- Product Images ---');
        const images = await db.select().from(productImages);
        images.forEach(img => console.log(`PI [${img.productId}]: ${img.url}`));

        console.log('\n--- Categories ---');
        const cats = await db.select().from(categories);
        cats.forEach(c => console.log(`Cat [${c.name}]: ${c.image}`));

        console.log('\n--- Settings ---');
        const setts = await db.select().from(settings);
        setts.forEach(s => console.log(`Settings: logo=${s.logoUrl}, fav=${s.faviconUrl}`));

        console.log('\n--- Banners ---');
        const bans = await db.select().from(banners);
        bans.forEach(b => console.log(`Banner: ${b.imageUrl}`));

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    } finally {
        await migrationClient.end();
    }
}

listAllImages();
