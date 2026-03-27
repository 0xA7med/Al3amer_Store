import { db } from '../db/index.js';
import { brands } from '../db/schema.js';
import { asc } from 'drizzle-orm';
export class BrandsController {
    // GET /api/brands - List all brands
    static async list(_req, res) {
        try {
            const brandsList = await db.query.brands.findMany({
                orderBy: [asc(brands.name)],
            });
            res.json(brandsList);
        }
        catch (error) {
            console.error('Error fetching brands:', error);
            res.status(500).json({ error: 'Failed to fetch brands' });
        }
    }
}
//# sourceMappingURL=brands.controller.js.map