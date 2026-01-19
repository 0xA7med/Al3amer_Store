import { db } from '../db/index.js';
import { categories } from '../db/schema.js';
import { eq } from 'drizzle-orm';
export class CategoriesController {
    async list(req, res) {
        try {
            const result = await db.query.categories.findMany({
                with: {
                    parent: true,
                }
            });
            res.json(result);
        }
        catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({ error: 'Failed to fetch categories' });
        }
    }
    async get(req, res) {
        try {
            const { id } = req.params;
            const category = await db.query.categories.findFirst({
                where: eq(categories.id, id),
                with: {
                    parent: true,
                    products: true,
                }
            });
            if (!category) {
                return res.status(404).json({ error: 'Category not found' });
            }
            res.json(category);
        }
        catch (error) {
            console.error('Error fetching category:', error);
            res.status(500).json({ error: 'Failed to fetch category' });
        }
    }
    async create(req, res) {
        try {
            const { name, parentId, image, icon, isActive } = req.body;
            // simple slug generation
            const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u0600-\u06FF\-]+/g, '') + '-' + Date.now();
            const [newCategory] = await db.insert(categories).values({
                name,
                slug,
                parentId: parentId || null,
                image,
                icon,
                isActive: isActive ?? true,
            }).returning();
            res.status(201).json(newCategory);
        }
        catch (error) {
            console.error('Error creating category:', error);
            res.status(500).json({ error: 'Failed to create category' });
        }
    }
    async update(req, res) {
        try {
            const { id } = req.params;
            const { name, parentId, image, icon, isActive } = req.body;
            const [updatedCategory] = await db.update(categories)
                .set({
                name,
                parentId: parentId || null,
                image,
                icon,
                isActive,
                // optionally update slug if name changes, but usually slugs are permanent. Let's keep slug stable.
            })
                .where(eq(categories.id, id))
                .returning();
            if (!updatedCategory) {
                return res.status(404).json({ error: 'Category not found' });
            }
            res.json(updatedCategory);
        }
        catch (error) {
            console.error('Error updating category:', error);
            res.status(500).json({ error: 'Failed to update category' });
        }
    }
    async delete(req, res) {
        try {
            const { id } = req.params;
            // Check if has children? The DB might restrict if FK constraint? 
            // Drizzle doesn't enforce FK in app unless defined in DB.
            // If checking for children/products safety is needed, do it here.
            // For now, straightforward delete.
            const [deletedCategory] = await db.delete(categories)
                .where(eq(categories.id, id))
                .returning();
            if (!deletedCategory) {
                return res.status(404).json({ error: 'Category not found' });
            }
            res.json({ message: 'Category deleted successfully' });
        }
        catch (error) {
            console.error('Error deleting category:', error);
            res.status(500).json({ error: 'Failed to delete category' });
        }
    }
}
//# sourceMappingURL=categories.controller.js.map