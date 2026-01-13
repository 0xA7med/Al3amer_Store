import dotenv from 'dotenv';
dotenv.config();

import { db, migrationClient } from '../db/index.js';
import { products } from '../db/schema.js';
import { eq } from 'drizzle-orm';

async function checkProduct() {
    try {
        const id = 'a879fa0b-cecb-4bb9-86e1-e35ea38652b8';
        console.log(`🔍 Checking product ${id}...`);

        const product = await db.query.products.findFirst({
            where: eq(products.id, id)
        });

        if (!product) {
            console.log('❌ Product not found!');
        } else {
            console.log('✅ Product found:');
            console.log(`   Name: ${product.name}`);
            console.log(`   Slug: '${product.slug}'`);
            console.log(`   Type of slug: ${typeof product.slug}`);
        }

        // Also list first 5 products to see general state
        console.log('\n📋 First 5 products:');
        const all = await db.query.products.findMany({ limit: 5 });
        all.forEach(p => console.log(`   ${p.name} -> '${p.slug}'`));

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    } finally {
        await migrationClient.end();
    }
}

checkProduct();
