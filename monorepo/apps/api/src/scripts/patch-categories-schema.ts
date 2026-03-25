/**
 * patch-categories-schema.ts
 * 
 * One-time script to update existing categories in the database
 * with their proper attributesSchema based on slug.
 * 
 * Run: npx ts-node -r tsconfig-paths/register src/scripts/patch-categories-schema.ts
 * OR:  npx tsx src/scripts/patch-categories-schema.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { db, migrationClient } from '../db/index.js';
import { categories } from '../db/schema.js';
import { eq } from 'drizzle-orm';

// ─── Schema definitions per slug ────────────────────────────────────────────

const SCHEMAS: Record<string, { name: string; type: 'single-select' | 'multi-select'; options: string[] }[]> = {
    'pos-systems': [
        { name: 'OS', type: 'single-select', options: ['Windows', 'Android'] },
        { name: 'Screen Size', type: 'single-select', options: ['15"', '11"'] },
        { name: 'RAM', type: 'single-select', options: ['4GB', '8GB'] },
    ],
    'printers': [
        { name: 'Print Width', type: 'single-select', options: ['58mm', '80mm'] },
        { name: 'Connectivity', type: 'multi-select', options: ['USB', 'LAN', 'Bluetooth', 'Wi-Fi'] },
        { name: 'Type', type: 'single-select', options: ['Receipt', 'Barcode'] },
    ],
    'barcode-scanners': [
        { name: 'Scanner Type', type: 'single-select', options: ['1D', '2D'] },
        { name: 'Connection', type: 'single-select', options: ['Wired', 'Wireless'] },
        { name: 'Stand', type: 'single-select', options: ['Included', 'None'] },
    ],
    'electronic-scales': [
        { name: 'Max Weight', type: 'single-select', options: ['15kg', '30kg'] },
        { name: 'Type', type: 'single-select', options: ['Barcode', 'Standard'] },
    ],
};

// ─── Main ────────────────────────────────────────────────────────────────────

async function patchCategoriesSchema() {
    console.log('🔧 Patching categories with attributesSchema...\n');

    let updatedCount = 0;
    let skippedCount = 0;

    for (const [slug, schema] of Object.entries(SCHEMAS)) {
        const [cat] = await db
            .select({ id: categories.id, name: categories.name, schema: categories.attributesSchema })
            .from(categories)
            .where(eq(categories.slug, slug))
            .limit(1);

        if (!cat) {
            console.log(`  ⚠️  Category not found: "${slug}" — skipping`);
            skippedCount++;
            continue;
        }

        // Update main category
        await db
            .update(categories)
            .set({ attributesSchema: schema as any })
            .where(eq(categories.id, cat.id));

        console.log(`  ✅ Updated Main: "${cat.name}" — added ${schema.length} filter blocks`);
        updatedCount++;

        // Also update sub-categories (where parentId = cat.id)
        const subs = await db
            .select({ id: categories.id, name: categories.name })
            .from(categories)
            .where(eq(categories.parentId, cat.id));

        for (const sub of subs) {
            await db
                .update(categories)
                .set({ attributesSchema: schema as any })
                .where(eq(categories.id, sub.id));
            console.log(`     └─ Updated Sub: "${sub.name}"`);
            updatedCount++;
        }
    }

    console.log(`\n✨ Done! Total records updated (Main + Subs): ${updatedCount}, Main Categories Skipped: ${skippedCount}`);
    await migrationClient.end();
}

patchCategoriesSchema().catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
});
