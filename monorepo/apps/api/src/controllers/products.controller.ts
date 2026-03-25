import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { products, productImages, categories, brands, reviews, orderItems, settings } from '../db/schema.js';
import { eq, like, and, gte, ilike, or, inArray, sql, desc } from 'drizzle-orm';
import { uploadToCloudinary } from '../lib/cloudinary.js';
import { AIService } from '../services/ai.service.js';

export class ProductsController {
    // Helper to generate SEO friendly slugs (Arabic & English)
    static slugify(text: string): string {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')     // Replace spaces with -
            .replace(/[^\w\u0621-\u064A-]+/g, '') // Remove all non-word chars (support Arabic)
            .replace(/--+/g, '-')     // Replace multiple - with single -
            .replace(/^-+/, '')       // Trim - from start of text
            .replace(/-+$/, '');      // Trim - from end of text
    }

    // Generate AI Content
    static async aiGenerate(req: Request, res: Response) {
        try {
            const { name, section = 'all', category, brand } = req.body;
            if (!name) {
                return res.status(400).json({ error: 'Product name is required' });
            }

            // Get Settings
            const appSettings = await db.query.settings.findFirst();
            const apiKey = appSettings?.googleApiKey || process.env.GOOGLE_API_KEY;

            if (!apiKey) {
                return res.status(400).json({ error: 'Google API Key is not configured' });
            }

            const aiService = new AIService(apiKey);
            const result = await aiService.generateProductDetails(
                name,
                appSettings?.aiLanguage || 'ar',
                appSettings?.aiTone || 'Marketing',
                appSettings?.aiDescriptionLength || 'medium',
                section,
                category,
                brand
            );

            return res.json(result);
        } catch (error: any) {
            console.error('AI Generate Error:', error);
            return res.status(500).json({ error: error?.message || 'Failed to generate content' });
        }
    }

    // GET /api/products - List products with pagination and filtering
    static async list(req: Request, res: Response) {
        try {
            const {
                page = '1',
                limit = '10',
                categories: categoriesParam,
                search,
                minPrice,
                status = 'active',
                featured,
                hasDiscount,
                sort,
                exclude,
                dynamicFilters,
            } = req.query;

            const pageNum = parseInt(page as string);
            const limitNum = parseInt(limit as string);
            const offset = (pageNum - 1) * limitNum;

            const conditions = [];

            if (status) {
                conditions.push(eq(products.status, status as string));
            }

            if (featured === 'true') {
                conditions.push(eq(products.isFeatured, true));
            }

            if (hasDiscount === 'true') {
                conditions.push(sql`${products.discountPrice} IS NOT NULL`);
            }

            if (exclude) {
                conditions.push(sql`${products.id} != ${exclude}`);
            }

            if (categoriesParam) {
                const categorySlugs = (categoriesParam as string).split(',');
                const cats = await db.query.categories.findMany({
                    where: inArray(categories.slug, categorySlugs),
                });
                if (cats.length > 0) {
                    conditions.push(inArray(products.categoryId, cats.map(c => c.id)));
                }
            }

            if (search) {
                const searchPattern = `%${search}%`;
                conditions.push(or(
                    ilike(products.name, searchPattern),
                    ilike(products.description, searchPattern)
                ));
            }

            if (minPrice) {
                conditions.push(gte(products.price, minPrice as string));
            }

            if (dynamicFilters) {
                try {
                    const filtersObj = JSON.parse(dynamicFilters as string);
                    for (const [key, values] of Object.entries(filtersObj)) {
                        if (Array.isArray(values) && values.length > 0) {
                            const valueList = values.map(v => sql`${v}`);
                            conditions.push(sql`${products.dynamicAttributes}->${key} ?| array[${sql.join(valueList, sql`, `)}]`);
                        }
                    }
                } catch (e) {
                    console.error('Failed to parse dynamicFilters query param:', e);
                }
            }

            const where = conditions.length > 0 ? and(...conditions) : undefined;

            let productsList: any[] = [];
            if (sort === 'bestselling') {
                const results = await db.select({
                    id: products.id,
                    totalSales: sql<number>`COALESCE(SUM(CAST(${orderItems.quantity} AS INTEGER)), 0)`,
                })
                    .from(products)
                    .leftJoin(orderItems, eq(products.id, orderItems.productId))
                    .where(where)
                    .groupBy(products.id)
                    .orderBy(desc(sql`totalSales`), desc(products.createdAt))
                    .limit(limitNum)
                    .offset(offset);

                const ids = results.map(r => r.id);
                if (ids.length === 0) {
                    productsList = [];
                } else {
                    const detailedProducts = await db.query.products.findMany({
                        where: inArray(products.id, ids),
                        with: {
                            category: {
                                with: {
                                    parent: {
                                        with: { parent: true }
                                    }
                                }
                            },
                            brand: true,
                            images: {
                                orderBy: (images, { asc }) => [asc(images.sortOrder)],
                            },
                        },
                    });
                    // Reorder because findMany where inArray doesn't preserve incoming array order
                    productsList = ids.map(id => detailedProducts.find(p => p.id === id)).filter(Boolean);
                }
            } else {
                productsList = await db.query.products.findMany({
                    where,
                    limit: limitNum,
                    offset,
                    orderBy: (products, { desc, asc }) => {
                        if (sort === 'newest') return [desc(products.createdAt)];
                        if (sort === 'price_asc') return [asc(products.price)];
                        if (sort === 'price_desc') return [desc(products.price)];
                        return [desc(products.createdAt)]; // Default to newest
                    },
                    with: {
                        category: {
                            with: {
                                parent: {
                                    with: { parent: true }
                                }
                            }
                        },
                        brand: true,
                        images: {
                            orderBy: (images, { asc }) => [asc(images.sortOrder)],
                        },
                    },
                });
            }


            res.json({
                data: productsList,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                },
            });
        } catch (error) {
            console.error('Error fetching products:', error);
            res.status(500).json({ error: 'Failed to fetch products' });
        }
    }

    // GET /api/products/search-suggestions?q=...
    static async searchSuggestions(req: Request, res: Response) {
        try {
            const { q = '' } = req.query;

            if (!q || (q as string).length < 2) {
                return res.json([]);
            }

            const searchPattern = `%${q}%`;

            const results = await db.query.products.findMany({
                where: and(
                    eq(products.status, 'active'),
                    ilike(products.name, searchPattern)
                ),
                limit: 10,
                with: {
                    images: {
                        where: eq(productImages.isPrimary, true),
                        limit: 1,
                    },
                },
                columns: {
                    id: true,
                    name: true,
                    price: true,
                    slug: true,
                    sku: true,
                }
            });

            // Map results to be lightweight
            const suggestions = results.map(p => ({
                id: p.id,
                name: p.name,
                price: p.price,
                slug: p.slug,
                image: p.images[0]?.url || null,
            }));

            res.json(suggestions);
        } catch (error) {
            console.error('Error fetching search suggestions:', error);
            res.status(500).json({ error: 'Failed to fetch suggestions' });
        }
    }


    // GET /api/products/:id - Get single product
    static async getOne(req: Request, res: Response) {
        try {
            const { id } = req.params;

            // Smart Lookup: If UUID format, search by ID. Otherwise, search by SLUG.
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
            const condition = isUuid ? eq(products.id, id) : eq(products.slug, id);

            const product = await db.query.products.findFirst({
                where: condition,
                with: {
                    category: {
                        with: {
                            parent: {
                                with: { parent: true }
                            }
                        }
                    },
                    brand: true,
                    images: {
                        orderBy: (images, { asc }) => [asc(images.sortOrder)],
                    },
                    reviews: {
                        where: eq(reviews.isApproved, true),
                        with: {
                            user: {
                                columns: {
                                    id: true,
                                    name: true,
                                }
                            }
                        }
                    },
                    orderItems: {
                        columns: {
                            quantity: true
                        }
                    }
                },
            });

            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }

            // Calculate metrics
            const salesCount = product.orderItems.reduce((acc, item) => acc + item.quantity, 0);
            const reviewCount = product.reviews.length;
            const averageRating = reviewCount > 0
                ? product.reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviewCount
                : 0;

            // Get store settings for WhatsApp
            const storeSettings = await db.query.settings.findFirst();

            res.json({
                ...product,
                salesCount,
                reviewCount,
                averageRating: Number(averageRating.toFixed(1)),
                supportPhone: storeSettings?.supportPhone || '201012345678'
            });
        } catch (error) {
            console.error('Error fetching product:', error);
            res.status(500).json({ error: 'Failed to fetch product' });
        }
    }

    // POST /api/products - Create new product
    static async create(req: Request, res: Response) {
        try {
            const {
                name,
                description,
                price,
                discountPrice,
                cost,
                sku,
                external_id,
                stock,
                barcode,
                categoryId,
                brandId,
                status,
                videos,
                metaTitle,
                metaDescription,
                isFeatured,
                specifications,
                dynamicAttributes,
                tags,
                images: imageUrls,
                slug: manualSlug,
                brand: brandName, // Allow name for auto-resolution
            } = req.body;
 
            // Resolve brand name to ID if brandName is provided
            let resolvedBrandId = brandId;
            if (brandName && !brandId) {
                const existingBrand = await db.query.brands.findFirst({
                    where: ilike(brands.name, brandName)
                });
                if (existingBrand) {
                    resolvedBrandId = existingBrand.id;
                } else {
                    const [newBrand] = await db.insert(brands).values({ name: brandName }).returning();
                    resolvedBrandId = newBrand.id;
                }
            }

            // Insert the product
            const [newProduct] = await db.insert(products).values({
                name,
                description,
                price,
                discountPrice,
                cost,
                sku,
                externalId: external_id || null,
                stock: stock || 0,
                barcode,
                categoryId,
                brandId: resolvedBrandId || null,
                slug: manualSlug || ProductsController.slugify(name), // Manual slug or auto-generate
                status: status || 'active',
                videos: videos || [],
                metaTitle,
                metaDescription,
                isFeatured: isFeatured || false,
                specifications,
                dynamicAttributes: dynamicAttributes || null,
                tags,
            }).returning();

            // Insert product images if provided
            if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
                const hasExplicitPrimary = imageUrls.some((u: any) => typeof u === 'object' && u.isPrimary);
                const imagesData = await Promise.all(imageUrls.map(async (img: any, index: number) => {
                    let url = typeof img === 'string' ? img : img.url;

                    // If url is base64, try to upload to cloudinary, but fallback gracefully
                    if (url.startsWith('data:image/')) {
                        try {
                            if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
                                console.warn('⚠️ Cloudinary is not properly configured. Falling back to storing Base64 string directly.');
                            } else {
                                url = await uploadToCloudinary(url);
                            }
                        } catch (err) {
                            console.error('❌ Failed to upload image to cloudinary, falling back to base64 string:', err);
                        }
                    }

                    return {
                        productId: newProduct.id,
                        url: url,
                        isPrimary: typeof img === 'object' ? !!img.isPrimary : (!hasExplicitPrimary && index === 0),
                        sortOrder: index,
                    };
                }));

                await db.insert(productImages).values(imagesData);
            }

            // Fetch the created product with relations
            const createdProduct = await db.query.products.findFirst({
                where: eq(products.id, newProduct.id),
                with: {
                    category: true,
                    brand: true,
                    images: true,
                },
            });

            res.status(201).json(createdProduct);
        } catch (error) {
            console.error('Error creating product:', error);
            res.status(500).json({ error: 'Failed to create product' });
        }
    }

    // PUT /api/products/:id - Update product
    static async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const {
                name,
                description,
                price,
                discountPrice,
                cost,
                sku,
                external_id,
                stock,
                barcode,
                categoryId,
                brandId,
                status,
                videos,
                metaTitle,
                metaDescription,
                isFeatured,
                specifications,
                dynamicAttributes,
                tags,
                images,
                slug: manualSlug,
                brand: brandName, // Allow name for auto-resolution
            } = req.body;
 
            // Resolve brand name to ID if brandName is provided
            let resolvedBrandId = brandId;
            if (brandName && !brandId) {
                const existingBrand = await db.query.brands.findFirst({
                    where: ilike(brands.name, brandName)
                });
                if (existingBrand) {
                    resolvedBrandId = existingBrand.id;
                } else {
                    const [newBrand] = await db.insert(brands).values({ name: brandName }).returning();
                    resolvedBrandId = newBrand.id;
                }
            }

            const updateData: any = {
                name,
                description,
                price,
                discountPrice: discountPrice || null,
                cost: cost || null,
                sku,
                externalId: external_id !== undefined ? (external_id || null) : undefined,
                stock: stock !== undefined ? Number(stock) : undefined,
                barcode,
                categoryId: categoryId || null,
                brandId: resolvedBrandId || brandId || null,
                status,
                videos,
                metaTitle,
                metaDescription,
                isFeatured,
                specifications,
                dynamicAttributes: dynamicAttributes !== undefined ? dynamicAttributes : undefined,
                tags,
                updatedAt: new Date(),
            };

            // Update slug if provided or name changed
            if (manualSlug) {
                updateData.slug = manualSlug;
            } else if (name) {
                updateData.slug = ProductsController.slugify(name);
            }

            // Remove undefined fields to avoid overwriting with null if they weren't in payload
            Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

            await db.update(products)
                .set(updateData)
                .where(eq(products.id, id));
            // Handle images update if provided
            if (req.body.images && Array.isArray(req.body.images)) {
                // Delete existing images
                await db.delete(productImages).where(eq(productImages.productId, id));

                // Insert new images
                const hasExplicitPrimary = req.body.images.some((u: any) => typeof u === 'object' && u.isPrimary);
                const imagesData = await Promise.all(req.body.images.map(async (img: any, index: number) => {
                    let url = typeof img === 'string' ? img : img.url;

                    // If url is base64, try to upload to cloudinary, but fallback gracefully
                    if (url.startsWith('data:image/')) {
                        try {
                            if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
                                console.warn('⚠️ Cloudinary is not properly configured. Falling back to storing Base64 string directly.');
                            } else {
                                url = await uploadToCloudinary(url);
                            }
                        } catch (err) {
                            console.error('❌ Failed to upload update image to cloudinary, falling back to base64 string:', err);
                        }
                    }

                    return {
                        productId: id,
                        url: url,
                        isPrimary: typeof img === 'object' ? !!img.isPrimary : (!hasExplicitPrimary && index === 0),
                        sortOrder: index,
                    };
                }));

                // Insert new images only if we have some
                if (imagesData.length > 0) {
                    await db.insert(productImages).values(imagesData);
                }
            }

            const updatedProduct = await db.query.products.findFirst({
                where: eq(products.id, id),
                with: {
                    images: true,
                    category: true,
                    brand: true,
                }
            });

            res.json(updatedProduct);
        } catch (error) {
            console.error('Error updating product:', error);
            res.status(500).json({
                message: 'Error updating product',
                error: error instanceof Error ? error.message : 'Unknown error',
                details: error
            });
        }
    }

    // PATCH /api/products/bulk - Bulk update products (inline price/stock edits)
    static async bulkUpdate(req: Request, res: Response) {
        try {
            const { updates } = req.body; // Array of { id, price, stock }

            if (!updates || !Array.isArray(updates)) {
                return res.status(400).json({ error: 'Updates must be an array' });
            }

            await db.transaction(async (tx) => {
                for (const update of updates) {
                    const { id, ...data } = update;
                    await tx.update(products)
                        .set({ ...data, updatedAt: new Date() })
                        .where(eq(products.id, id));
                }
            });

            res.json({ message: 'Products updated successfully' });
        } catch (error) {
            console.error('Error in bulk update:', error);
            res.status(500).json({ error: 'Failed to perform bulk update' });
        }
    }

    // POST /api/products/bulk-action - Comprehensive bulk actions
    static async bulkAction(req: Request, res: Response) {
        try {
            const { ids, action, payload } = req.body as {
                ids: string[];
                action: 'show' | 'hide' | 'delete' | 'price' | 'stock' | 'category';
                payload?: {
                    // price action
                    priceMode?: 'add_fixed' | 'subtract_fixed' | 'add_percent' | 'subtract_percent' | 'set_fixed';
                    priceValue?: number;
                    // stock action
                    stockMode?: 'add' | 'subtract' | 'set';
                    stockValue?: number;
                    // category action
                    categoryId?: string;
                };
            };

            if (!ids || !Array.isArray(ids) || ids.length === 0) {
                return res.status(400).json({ error: 'No product IDs provided' });
            }
            if (!action) {
                return res.status(400).json({ error: 'Action is required' });
            }

            let affected = 0;

            if (action === 'delete') {
                await db.delete(products).where(inArray(products.id, ids));
                affected = ids.length;
            } else if (action === 'show') {
                await db.update(products)
                    .set({ status: 'active', updatedAt: new Date() })
                    .where(inArray(products.id, ids));
                affected = ids.length;
            } else if (action === 'hide') {
                await db.update(products)
                    .set({ status: 'draft', updatedAt: new Date() })
                    .where(inArray(products.id, ids));
                affected = ids.length;
            } else if (action === 'category') {
                if (!payload?.categoryId) return res.status(400).json({ error: 'categoryId is required' });
                await db.update(products)
                    .set({ categoryId: payload.categoryId, updatedAt: new Date() })
                    .where(inArray(products.id, ids));
                affected = ids.length;
            } else if (action === 'price') {
                if (!payload?.priceMode || payload.priceValue === undefined) {
                    return res.status(400).json({ error: 'priceMode and priceValue are required' });
                }
                const val = payload.priceValue;
                const mode = payload.priceMode;

                // Build a single SQL expression based on the mode — no row-by-row loop
                let priceExpr: any;
                if (mode === 'add_fixed') {
                    priceExpr = sql`GREATEST(0, CAST(${products.price} AS NUMERIC) + ${val})::TEXT`;
                } else if (mode === 'subtract_fixed') {
                    priceExpr = sql`GREATEST(0, CAST(${products.price} AS NUMERIC) - ${val})::TEXT`;
                } else if (mode === 'add_percent') {
                    priceExpr = sql`GREATEST(0, CAST(${products.price} AS NUMERIC) * (1 + ${val} / 100.0))::TEXT`;
                } else if (mode === 'subtract_percent') {
                    priceExpr = sql`GREATEST(0, CAST(${products.price} AS NUMERIC) * (1 - ${val} / 100.0))::TEXT`;
                } else if (mode === 'set_fixed') {
                    priceExpr = sql`${val.toString()}`;
                } else {
                    return res.status(400).json({ error: 'Invalid priceMode' });
                }

                await db.update(products)
                    .set({ price: priceExpr, updatedAt: new Date() })
                    .where(inArray(products.id, ids));
                affected = ids.length;

            } else if (action === 'stock') {
                if (!payload?.stockMode || payload.stockValue === undefined) {
                    return res.status(400).json({ error: 'stockMode and stockValue are required' });
                }
                const val = payload.stockValue;
                const mode = payload.stockMode;

                let stockExpr: any;
                if (mode === 'add') {
                    stockExpr = sql`GREATEST(0, COALESCE(${products.stock}, 0) + ${val})`;
                } else if (mode === 'subtract') {
                    stockExpr = sql`GREATEST(0, COALESCE(${products.stock}, 0) - ${val})`;
                } else if (mode === 'set') {
                    stockExpr = sql`${val}`;
                } else {
                    return res.status(400).json({ error: 'Invalid stockMode' });
                }

                await db.update(products)
                    .set({ stock: stockExpr, updatedAt: new Date() })
                    .where(inArray(products.id, ids));
                affected = ids.length;

            } else {
                return res.status(400).json({ error: `Unknown action: ${action}` });
            }

            res.json({ success: true, affected, message: `تم تطبيق الإجراء على ${affected} منتج` });
        } catch (error) {
            console.error('Error in bulk action:', error);
            res.status(500).json({ error: 'Failed to perform bulk action' });
        }
    }

    // POST /api/products/validate-cart - Validate cart items still exist and return fresh data
    static async validateCart(req: Request, res: Response) {
        try {
            const { productIds } = req.body;

            if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
                return res.status(400).json({ error: 'productIds must be a non-empty array' });
            }

            // Fetch all matching products in a single DB query
            const foundProducts = await db.query.products.findMany({
                where: inArray(products.id, productIds),
                with: {
                    images: {
                        where: eq(productImages.isPrimary, true),
                        limit: 1,
                    },
                },
                columns: {
                    id: true,
                    name: true,
                    price: true,
                    discountPrice: true,
                    stock: true,
                    status: true,
                },
            });

            // Build a Set of found IDs for fast lookup
            const foundIdSet = new Set(foundProducts.map(p => p.id));

            // Determine which requested IDs are missing or inactive
            const invalidIds = productIds.filter(id => !foundIdSet.has(id));

            // Map to a clean response shape
            const validProducts = foundProducts
                .filter(p => p.status === 'active')
                .map(p => ({
                    id: p.id,
                    name: p.name,
                    price: p.price,
                    discountPrice: p.discountPrice,
                    stock: p.stock,
                    image: p.images[0]?.url || null,
                }));

            // Products that exist but are inactive (draft/hidden) are also "invalid" from cart perspective
            const inactiveIds = foundProducts
                .filter(p => p.status !== 'active')
                .map(p => p.id);

            return res.json({
                validProducts,
                invalidIds: [...invalidIds, ...inactiveIds],
            });
        } catch (error) {
            console.error('Error validating cart:', error);
            res.status(500).json({ error: 'Failed to validate cart' });
        }
    }

    // DELETE /api/products/:id - Delete product
    static async delete(req: Request, res: Response) {
        try {
            const { id } = req.params;

            await db.delete(products).where(eq(products.id, id));

            res.json({ message: 'Product deleted successfully' });
        } catch (error) {
            console.error('Error deleting product:', error);
            res.status(500).json({ error: 'Failed to delete product' });
        }
    }
}
