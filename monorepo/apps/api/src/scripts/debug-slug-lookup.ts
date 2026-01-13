import { db } from '../db/index.js';
import { products } from '../db/schema.js';
import { eq, or } from 'drizzle-orm';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SLUGS_TO_TEST = [
    'sunmi-v2-pro-جهاز-كاشير-ذكي',
    'epson-tm-t20iii-طابعة-إيصالات-حرارية-80مم', // Example from logs
    encodeURIComponent('sunmi-v2-pro-جهاز-كاشير-ذكي')
];

async function testSlugLookup() {
    console.log('🧪 Testing Slug Lookup...');

    for (const slug of SLUGS_TO_TEST) {
        console.log(`\n🔎 Looking up: "${slug}"`);

        try {
            const product = await db.query.products.findFirst({
                where: or(eq(products.id, slug), eq(products.slug, slug)),
            });

            if (product) {
                console.log(`✅ FOUND: ${product.name} (ID: ${product.id})`);
            } else {
                console.log(`❌ NOT FOUND`);
            }
        } catch (error) {
            console.error('💥 Error:', error);
        }
    }

    process.exit(0);
}

testSlugLookup();
