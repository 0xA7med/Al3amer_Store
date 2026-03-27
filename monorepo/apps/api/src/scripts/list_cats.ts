
import dotenv from 'dotenv';
dotenv.config();
import { db } from '../db/index.ts';
import { categories } from '../db/schema.ts';

async function listCats() {
    try {
        const cats = await db.query.categories.findMany();
        console.log('ID,Name,Slug');
        cats.forEach(c => console.log(`${c.id},${c.name},${c.slug}`));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}
listCats();
