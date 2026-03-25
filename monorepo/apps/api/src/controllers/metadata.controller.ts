import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { products } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export class MetadataController {
    async listUniqueSpecs(req: Request, res: Response) {
        try {
            const allProducts = await db.query.products.findMany({
                columns: {
                    id: true,
                    specifications: true,
                    dynamicAttributes: true,
                }
            });

            const specMap = new Map<string, Set<string>>();

            allProducts.forEach(p => {
                // 1. From specifications (legacy)
                if (p.specifications && Array.isArray(p.specifications)) {
                    p.specifications.forEach(s => {
                        if (!s.key || !s.value) return;
                        if (!specMap.has(s.key)) specMap.set(s.key, new Set());
                        specMap.get(s.key)!.add(String(s.value).trim());
                    });
                }

                // 2. From dynamicAttributes
                if (p.dynamicAttributes && typeof p.dynamicAttributes === 'object') {
                    Object.entries(p.dynamicAttributes).forEach(([key, val]) => {
                        if (!specMap.has(key)) specMap.set(key, new Set());
                        const vals = Array.isArray(val) ? val : [val];
                        vals.forEach(v => specMap.get(key)!.add(String(v).trim()));
                    });
                }
            });

            const result = Array.from(specMap.entries()).map(([key, values]) => ({
                key,
                values: Array.from(values).sort(),
            })).sort((a, b) => a.key.localeCompare(b.key));

            res.json(result);
        } catch (error) {
            console.error('Error listing unique specs:', error);
            res.status(500).json({ error: 'Failed to list unique specifications' });
        }
    }

    async deleteSpecValue(req: Request, res: Response) {
        try {
            const { key, value } = req.body;
            if (!key || value === undefined) {
                return res.status(400).json({ error: 'Key and value are required' });
            }

            const allProducts = await db.query.products.findMany();
            let updatedCount = 0;

            for (const p of allProducts) {
                let changed = false;

                // Clean dynamicAttributes
                const attrs = { ...p.dynamicAttributes };
                if (attrs[key]) {
                    if (Array.isArray(attrs[key])) {
                        const newVals = (attrs[key] as string[]).filter(v => String(v).trim() !== String(value).trim());
                        if (newVals.length !== (attrs[key] as string[]).length) {
                            if (newVals.length === 0) delete attrs[key];
                            else attrs[key] = newVals;
                            changed = true;
                        }
                    } else if (String(attrs[key]).trim() === String(value).trim()) {
                        delete attrs[key];
                        changed = true;
                    }
                }

                // Clean specifications
                let specs = p.specifications ? [...p.specifications] : null;
                if (specs) {
                    const initialLen = specs.length;
                    specs = specs.filter(s => !(s.key === key && String(s.value).trim() === String(value).trim()));
                    if (specs.length !== initialLen) {
                        changed = true;
                    }
                }

                if (changed) {
                    await db.update(products)
                        .set({ 
                            dynamicAttributes: attrs,
                            specifications: specs
                        })
                        .where(eq(products.id, p.id));
                    updatedCount++;
                }
            }

            res.json({ message: `Successfully removed value from ${updatedCount} products`, updatedCount });
        } catch (error) {
            console.error('Error deleting spec value:', error);
            res.status(500).json({ error: 'Failed to delete specification value' });
        }
    }
}
