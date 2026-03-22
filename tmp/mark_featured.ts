import { db } from '../monorepo/apps/api/src/db/index.js';
import { products } from '../monorepo/apps/api/src/db/schema.js';
import { sql } from 'drizzle-orm';

async function markFeatured() {
    try {
        console.log('Marking random products as featured AND active...');
        await db.update(products)
            .set({ isFeatured: true, status: 'active' })
            .where(sql`id IN (SELECT id FROM products LIMIT 10)`);
        console.log('Success! Products marked as featured and active.');
        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

markFeatured();
