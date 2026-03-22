import { db } from './monorepo/apps/api/src/db/index.js';
import { brands } from './monorepo/apps/api/src/db/schema.js';

async function listBrands() {
    try {
        const allBrands = await db.select().from(brands);
        console.log(JSON.stringify(allBrands, null, 2));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

listBrands();
