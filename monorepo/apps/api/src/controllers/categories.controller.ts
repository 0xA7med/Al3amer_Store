import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { categories } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export class CategoriesController {
    async list(req: Request, res: Response) {
        try {
            const result = await db.query.categories.findMany({
                with: {
                    parent: true,
                }
            });
            res.json(result);
        } catch (error) {
            console.error('Error fetching categories:', error);
            res.status(500).json({ error: 'Failed to fetch categories' });
        }
    }

    async get(req: Request, res: Response) {
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
        } catch (error) {
            console.error('Error fetching category:', error);
            res.status(500).json({ error: 'Failed to fetch category' });
        }
    }

    async create(req: Request, res: Response) {
        try {
            const { name, parentId, image, icon, isActive, isFeatured, slug: customSlug } = req.body;

            // Use custom slug if provided, otherwise generate one
            let slug = customSlug;
            if (!slug) {
                slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\u0600-\u06FF\-]+/g, '') + '-' + Date.now();
            }

            const [newCategory] = await db.insert(categories).values({
                name,
                slug,
                parentId: parentId || null,
                image,
                icon,
                isActive: isActive ?? true,
                isFeatured: isFeatured ?? false,
            }).returning();

            res.status(201).json(newCategory);
        } catch (error) {
            console.error('Error creating category:', error);
            res.status(500).json({ error: 'Failed to create category' });
        }
    }

    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name, parentId, image, icon, isActive, isFeatured, slug } = req.body;

            const [updatedCategory] = await db.update(categories)
                .set({
                    name,
                    slug, // Allow updating slug
                    parentId: parentId || null,
                    image,
                    icon,
                    isActive,
                    isFeatured,
                })
                .where(eq(categories.id, id))
                .returning();

            if (!updatedCategory) {
                return res.status(404).json({ error: 'Category not found' });
            }

            res.json(updatedCategory);
        } catch (error) {
            console.error('Error updating category:', error);
            res.status(500).json({ error: 'Failed to update category' });
        }
    }

    async delete(req: Request, res: Response) {
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
        } catch (error) {
            console.error('Error deleting category:', error);
            res.status(500).json({ error: 'Failed to delete category' });
        }
    }
}
