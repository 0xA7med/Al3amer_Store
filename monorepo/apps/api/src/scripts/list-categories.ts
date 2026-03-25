/**
 * list-categories.ts
 */
import dotenv from 'dotenv';
dotenv.config();

import { db, migrationClient } from '../db/index.js';
import { categories } from '../db/schema.js';

async function listCategories() {
    const cats = await db.select({ id: categories.id, name: categories.name, slug: categories.slug }).from(categories);
    console.table(cats);
    await migrationClient.end();
}

listCategories().catch(console.error);
