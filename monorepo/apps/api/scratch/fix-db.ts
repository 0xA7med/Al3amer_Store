import { db } from '../src/db/index.js';
import { sql } from 'drizzle-orm';

async function fix() {
    console.log('Checking and fixing products table columns...');
    try {
        await db.execute(sql`
            ALTER TABLE products ADD COLUMN IF NOT EXISTS llm_description TEXT;
            ALTER TABLE products ADD COLUMN IF NOT EXISTS faq JSONB DEFAULT '[]'::jsonb;
        `);
        console.log('✅ Columns added or already exist.');
    } catch (error) {
        console.error('❌ Failed to update table:', error);
    }
    process.exit(0);
}

fix();
