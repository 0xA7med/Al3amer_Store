
import dotenv from 'dotenv';
dotenv.config();
import { db } from '../db/index.ts';
import { products, categories } from '../db/schema.ts';
import { eq, inArray } from 'drizzle-orm';

async function checkPrices() {
    try {
        const relevantCats = ['pos-systems', 'printers', 'scanners', 'drawers', 'scales'];
        const catRecords = await db.query.categories.findMany({
            where: inArray(categories.slug, relevantCats)
        });
        
        const catIds = catRecords.map(c => c.id);
        const prodRecords = await db.query.products.findMany({
            where: eq(products.status, 'active'),
            with: { category: true }
        });
        
        const filteredProds = prodRecords.filter(p => p.categoryId && catIds.includes(p.categoryId));
        
        console.log('Category,Min Price,Max Price,Avg Price,Count');
        relevantCats.forEach(slug => {
            const catProds = filteredProds.filter(p => p.category?.slug === slug);
            if (catProds.length > 0) {
                const prices = catProds.map(p => parseFloat(p.price));
                const min = Math.min(...prices);
                const max = Math.max(...prices);
                const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
                console.log(`${slug},${min},${max},${avg.toFixed(2)},${catProds.length}`);
            } else {
                console.log(`${slug},N/A,N/A,N/A,0`);
            }
        });
        
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkPrices();
