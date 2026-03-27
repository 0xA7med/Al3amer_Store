import { db } from '../db/index.js';
import { categories, products } from '../db/schema.js';
import { eq, sql } from 'drizzle-orm';
export class CategoriesController {
    async list(req, res) {
        try {
            // Get all categories with their parent info
            const allCategories = await db.query.categories.findMany({
                with: {
                    parent: true,
                }
            });
            // Get total product counts (including drafts)
            const totalCounts = await db.select({
                categoryId: products.categoryId,
                count: sql `count(*)`
            })
                .from(products)
                .groupBy(products.categoryId);
            // Get active product counts only
            const activeCounts = await db.select({
                categoryId: products.categoryId,
                count: sql `count(*)`
            })
                .from(products)
                .where(eq(products.status, 'active'))
                .groupBy(products.categoryId);
            // Create maps for easy lookup
            const totalCountMap = {};
            totalCounts.forEach(c => {
                if (c.categoryId)
                    totalCountMap[c.categoryId] = Number(c.count);
            });
            const activeCountMap = {};
            activeCounts.forEach(c => {
                if (c.categoryId)
                    activeCountMap[c.categoryId] = Number(c.count);
            });
            // Attach counts to categories
            const result = allCategories.map(cat => ({
                ...cat,
                productCount: totalCountMap[cat.id] || 0,
                activeProductCount: activeCountMap[cat.id] || 0
            }));
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
            const { name, parentId, image, icon, isActive, isFeatured, slug: customSlug, attributesSchema } = req.body;
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
                attributesSchema,
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
            const { name, parentId, image, icon, isActive, isFeatured, slug, attributesSchema } = req.body;
            const updateData = {};
            if (name !== undefined)
                updateData.name = name;
            if (slug !== undefined)
                updateData.slug = slug;
            if (parentId !== undefined)
                updateData.parentId = parentId; // Can be null to remove parent
            if (image !== undefined)
                updateData.image = image;
            if (icon !== undefined)
                updateData.icon = icon;
            if (isActive !== undefined)
                updateData.isActive = isActive;
            if (isFeatured !== undefined)
                updateData.isFeatured = isFeatured;
            if (attributesSchema !== undefined)
                updateData.attributesSchema = attributesSchema;
            if (Object.keys(updateData).length === 0) {
                return res.json({ message: 'No fields to update' });
            }
            const [updatedCategory] = await db.update(categories)
                .set(updateData)
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
            // Check if category has subcategories
            const subCategoriesCount = await db.select({ count: sql `count(*)` })
                .from(categories)
                .where(eq(categories.parentId, id));
            if (Number(subCategoriesCount[0].count) > 0) {
                return res.status(400).json({ error: 'لا يمكن حذف القسم لأنه يحتوي على أقسام فرعية. يرجى حذفها أولاً.' });
            }
            // Check if category has products
            const productsCount = await db.select({ count: sql `count(*)` })
                .from(products)
                .where(eq(products.categoryId, id));
            if (Number(productsCount[0].count) > 0) {
                return res.status(400).json({ error: 'لا يمكن حذف القسم لأنه مرتبط بمنتجات. يرجى نقل أو حذف المنتجات أولاً.' });
            }
            const [deletedCategory] = await db.delete(categories)
                .where(eq(categories.id, id))
                .returning();
            if (!deletedCategory) {
                return res.status(404).json({ error: 'القسم غير موجود' });
            }
            res.json({ message: 'Category deleted successfully' });
        }
        catch (error) {
            console.error('Error deleting category:', error);
            res.status(500).json({ error: 'حدث خطأ أثناء حذف القسم' });
        }
    }
}
//# sourceMappingURL=categories.controller.js.map