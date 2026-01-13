import { db } from '../db/index.js';
import { products } from '../db/schema.js';
import { eq, or } from 'drizzle-orm';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const SLUG_TO_TEST = 'sunmi-v2-pro-جهاز-كاشير-ذكي';

const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

async function testSlugLookup() {
    console.log('🧪 Testing Safe Slug Lookup...');

    // 1. Test Match by Slug ONLY
    console.log(`\n1️⃣ Querying by slug ONLY: "${SLUG_TO_TEST}"`);
    try {
        const product = await db.query.products.findFirst({
            where: eq(products.slug, SLUG_TO_TEST),
        });
        console.log(product ? `✅ Found: ${product.name}` : `❌ Not Found`);
    } catch (e) {
        console.error('💥 Error query slug only:', e.message);
    }

    // 2. Test the problematic OR query
    console.log(`\n2️⃣ Querying by ID OR Slug (simulating Controller bug): "${SLUG_TO_TEST}"`);
    try {
        const product = await db.query.products.findFirst({
            where: or(eq(products.id, SLUG_TO_TEST), eq(products.slug, SLUG_TO_TEST)),
        });
        console.log(product ? `✅ Found: ${product.name}` : `❌ Not Found`);
    } catch (e: any) {
        console.log('💥 CAUGHT EXPECTED ERROR:', e.message);
        console.log('   (This confirms why the API fails)');
    }

    // 3. Test the fix logic
    console.log(`\n3️⃣ Querying with FIX logic (check isUuid): "${SLUG_TO_TEST}"`);
    try {
        const isId = isUuid(SLUG_TO_TEST);
        const condition = isId
            ? or(eq(products.id, SLUG_TO_TEST), eq(products.slug, SLUG_TO_TEST))
            : eq(products.slug, SLUG_TO_TEST);

        const product = await db.query.products.findFirst({
            where: condition
        });
        console.log(product ? `✅ Found with FIX: ${product.name}` : `❌ Not Found with fix`);
    } catch (e) {
        console.error('💥 Error query with fix:', e.message);
    }

    process.exit(0);
}

testSlugLookup();
