import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { products, productImages, categories, brands, reviews, wishlist, orderItems, productRelationships } from '../db/schema.js';
import { eq, and, or, like, sql, inArray, desc, asc, count, gte, lte, ne, not, isNull, ilike } from 'drizzle-orm';
import path from 'path';
import { AIService } from '../services/ai.service.js';
import { decryptText } from '../lib/crypto.utils.js';
import { getMergedSettings } from '../lib/settings-helper.js';
import { uploadToCloudinary } from '../lib/cloudinary.js';

// In-memory tracker for popular/trending searches globally
const searchHistoryTracker: Record<string, number> = {};

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
            const appSettings = await getMergedSettings();

            // Prefer the dedicated AI key, fall back to google key, then env var
            const rawKey = appSettings?.aiApiKey || appSettings?.googleApiKey || process.env.GOOGLE_API_KEY;
            
            // If the key is encrypted (has ':') but decryptText returns the same raw string or undefined, it failed
            const apiKey = rawKey ? decryptText(rawKey) : undefined;

            if (!apiKey) {
                const isProbablyEncrypted = rawKey?.includes(':');
                const errorMessage = isProbablyEncrypted 
                    ? 'فشل فك تشفير مفتاح API. يرجى إعادة إدخال مفتاح Google API في الإعدادات.'
                    : 'مفتاح Google API غير مهيأ في الإعدادات';
                return res.status(400).json({ error: errorMessage });
            }

            const aiService = new AIService(apiKey.trim());
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
            console.error('❌ AI Generate Critical Error:', error);
            
            // Check for specific error types to provide better user feedback
            const message = error?.message || '';
            let userMessage = 'فشل توليد المحتوى. يرجى التأكد من مفتاح API وصلاحيته.';
            
            if (message.includes('API_KEY_INVALID') || message.includes('invalid api key')) {
                userMessage = 'مفتاح Google API غير صالح. يرجى التأكد من المفتاح في الإعدادات.';
            } else if (message.includes('quota') || message.includes('429')) {
                userMessage = 'تم تجاوز حصة الاستخدام (Quota) لمفتاح API الخاص بك.';
            } else if (message.includes('All AI models failed')) {
                userMessage = `فشل الاتصال بنماذج الذكاء الاصطناعي: ${message}`;
            }

            return res.status(500).json({ 
                error: userMessage,
                details: process.env.NODE_ENV === 'development' ? error?.message : undefined 
            });
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

            const totalResult = await db.select({ count: count() }).from(products).where(where);
            const total = Number(totalResult[0]?.count ?? 0);
            const totalPages = Math.ceil(total / limitNum);

            let productsList: any[] = [];
            if (sort === 'bestselling') {
                const totalSalesExpr = sql<number>`COALESCE(SUM(CAST(${orderItems.quantity} AS INTEGER)), 0)`;
                const results = await db.select({
                    id: products.id,
                    total_sales: totalSalesExpr,
                })
                    .from(products)
                    .leftJoin(orderItems, eq(products.id, orderItems.productId))
                    .where(where)
                    .groupBy(products.id)
                    .orderBy(desc(totalSalesExpr), desc(products.createdAt))
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
                            relationships: true,
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
                        relationships: true,
                    },
                });
            }


            res.json({
                data: productsList,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages,
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

            const queryTerm = (q as string).toLowerCase().trim();
            if (!queryTerm || queryTerm.length < 2) {
                return res.json([]);
            }

            // Track trending searches (only if it's a valid meaningful word)
            if (queryTerm.length >= 3) {
                searchHistoryTracker[queryTerm] = (searchHistoryTracker[queryTerm] || 0) + 1;
            }

            const searchPattern = `%${queryTerm}%`;

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

    // GET /api/products/popular-searches
    static async popularSearches(req: Request, res: Response) {
        try {
            // Sort recorded searches by hit count
            const sortedCounts = Object.entries(searchHistoryTracker)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(entry => entry[0]);

            // Default safe keywords if there aren't enough tracked queries yet
            const defaults = ['كاشير', 'طابعة', 'درج نقدية', 'باركود', 'سكانر'];
            
            // Merge actual tracked top searches with defaults to always yield ~4 words
            const combined = [...new Set([...sortedCounts, ...defaults])].slice(0, 4);

            return res.json(combined);
        } catch (error) {
            console.error('Error fetching popular searches:', error);
            res.status(500).json({ error: 'Failed' });
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
                    },
                    relationships: {
                        with: {
                            relatedProduct: {
                                with: {
                                    images: {
                                        where: eq(productImages.isPrimary, true),
                                        limit: 1,
                                    },
                                },
                            },
                        },
                    },
                },
            });

            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }

            // Handle Variants (Multi-Variant Product System)
            let variants: any[] = [];
            let parentProduct = null;

            if (product.parentId) {
                // This is a child variant. Fetch the parent and all siblings.
                parentProduct = await db.query.products.findFirst({
                    where: eq(products.id, product.parentId),
                });
                variants = await db.query.products.findMany({
                    where: and(eq(products.parentId, product.parentId), eq(products.status, 'active')),
                    with: { images: true }
                });
            } else {
                // Check if this is a parent product (has children)
                variants = await db.query.products.findMany({
                    where: and(eq(products.parentId, product.id), eq(products.status, 'active')),
                    with: { images: true }
                });
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
                parent: parentProduct,
                variants,
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
                llmDescription,
                faq,
                relationships,
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

            // Ensure unique slug
            let productSlug = manualSlug || ProductsController.slugify(name);
            if (!manualSlug) {
                const existingSlug = await db.query.products.findFirst({
                    where: eq(products.slug, productSlug),
                    columns: { id: true },
                });
                if (existingSlug) {
                    productSlug = `${productSlug}-${Date.now()}`;
                }
            }

            // Insert the product
            const [newProduct] = await db.insert(products).values({
                name,
                description,
                price,
                discountPrice: discountPrice || null,
                cost: cost || null,
                sku,
                externalId: external_id || null,
                stock: stock || 0,
                barcode,
                categoryId,
                brandId: resolvedBrandId || null,
                slug: productSlug,
                status: status || 'active',
                videos: videos || [],
                metaTitle,
                metaDescription,
                isFeatured: isFeatured || false,
                specifications,
                dynamicAttributes: dynamicAttributes || null,
                tags,
                llmDescription: llmDescription || null,
                faq: faq || [],
            }).returning();

            // Insert product relationships if provided
            if (relationships && Array.isArray(relationships) && relationships.length > 0) {
                const relationsData = relationships.map((rel: any) => ({
                    productId: newProduct.id,
                    relatedProductId: rel.relatedProductId,
                    type: rel.type
                }));
                await db.insert(productRelationships).values(relationsData);
            }

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
                        isPrimary: index === 0, // Always make the first image primary
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
        } catch (error: any) {
            console.error('Error creating product:', error);

            // Handle unique constraint violations (Postgres error 23505)
            const pgCode = error?.code || error?.cause?.code || error?.original?.code;
            if (pgCode === '23505') {
                let message = 'هذا الرقم التعريفي أو الكود مستخدم بالفعل مسبقاً';
                if (error.detail?.includes('slug')) {
                    message = 'هذا الرابط (Slug) مستخدم بالفعل لمنتج آخر، يرجى تغيير اسم المنتج';
                } else if (error.detail?.includes('external_id')) {
                    message = 'هذا الرقم التعريفي الخارجي (External ID) مستخدم بالفعل لمنتج آخر';
                } else if (error.detail?.includes('sku')) {
                    message = 'هذا الكود (SKU) مستخدم بالفعل لمنتج آخر';
                }
                return res.status(400).json({
                    message,
                    error: 'DUPLICATE_ENTRY',
                    detail: error.detail,
                });
            }

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
                llmDescription,
                faq,
                relationships,
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
                llmDescription: llmDescription !== undefined ? llmDescription : undefined,
                faq: faq !== undefined ? faq : undefined,
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

            // Handle relationships update if provided
            if (relationships && Array.isArray(relationships)) {
                await db.delete(productRelationships).where(eq(productRelationships.productId, id));
                if (relationships.length > 0) {
                    const relationsData = relationships.map((rel: any) => ({
                        productId: id,
                        relatedProductId: rel.relatedProductId,
                        type: rel.type
                    }));
                    await db.insert(productRelationships).values(relationsData);
                }
            }

            // Handle images update if provided
            if (req.body.images && Array.isArray(req.body.images)) {
                // Delete existing images
                await db.delete(productImages).where(eq(productImages.productId, id));

                // Insert new images
                console.log('DEBUG: Updating images with body:', JSON.stringify(req.body.images));
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
                        isPrimary: index === 0, // Always make the first image primary
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
        } catch (error: any) {
            console.error('Error updating product:', error);
            
            // Handle unique constraint violations (Postgres error 23505)
            const pgCode = error?.code || error?.cause?.code || error?.original?.code;
            if (pgCode === '23505') {
                let message = 'هذا الرقم التعريفي أو الكود مستخدم بالفعل مسبقاً';
                if (error.detail?.includes('external_id')) {
                    message = 'هذا الرقم التعريفي الخارجي (External ID) مستخدم بالفعل لمنتج آخر';
                } else if (error.detail?.includes('sku')) {
                    message = 'هذا الكود (SKU) مستخدم بالفعل لمنتج آخر';
                } else if (error.detail?.includes('slug')) {
                    message = 'هذا الرابط (Slug) مستخدم بالفعل لمنتج آخر، يرجى تغيير اسم المنتج';
                }
                
                return res.status(400).json({ 
                    message,
                    error: 'DUPLICATE_ENTRY',
                    detail: error.detail 
                });
            }

            res.status(500).json({
                message: 'حدث خطأ أثناء تحديث المنتج',
                error: error instanceof Error ? error.message : 'Unknown error',
                details: error
            });
        }
    }

    // PATCH /api/products/:id/short-name - Update product's AWB short name
    static async updateShortName(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { shortNameAwb } = req.body;

            const [updatedProduct] = await db.update(products)
                .set({ 
                    shortNameAwb,
                    updatedAt: new Date() 
                })
                .where(eq(products.id, id))
                .returning();

            if (!updatedProduct) {
                return res.status(404).json({ error: 'Product not found' });
            }

            res.json(updatedProduct);
        } catch (error) {
            console.error('Error updating product short name:', error);
            res.status(500).json({ error: 'Failed to update short name' });
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
                    
                    // Sanitize nullable numeric strings: convert empty string to null
                    if (data.discountPrice === '') data.discountPrice = null;
                    if (data.cost === '') data.cost = null;

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
                action: 'show' | 'hide' | 'delete' | 'price' | 'stock' | 'category' | 'group';
                payload?: {
                    // price action
                    priceMode?: 'add_fixed' | 'subtract_fixed' | 'add_percent' | 'subtract_percent' | 'set_fixed';
                    priceValue?: number;
                    // stock action
                    stockMode?: 'add' | 'subtract' | 'set';
                    stockValue?: number;
                    // category action
                    categoryId?: string;
                    // group action
                    groupName?: string;
                    variants?: Array<{ id: string; options: Record<string, string> }>;
                    accountingMultiplier?: number;
                    salesTiers?: any;
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

            } else if (action === 'group') {
                if (!payload?.groupName || !payload?.variants) {
                    return res.status(400).json({ error: 'groupName and variants mapping are required' });
                }

                // Get first child to inherit category and brand
                const firstChild = await db.query.products.findFirst({
                    where: eq(products.id, payload.variants[0].id)
                });
                
                // Create Parent Product
                const [parentProduct] = await db.insert(products).values({
                    name: payload.groupName,
                    slug: ProductsController.slugify(payload.groupName) + '-' + Math.floor(Math.random() * 10000),
                    price: '0', 
                    status: 'active',
                    categoryId: firstChild?.categoryId,
                    brandId: firstChild?.brandId,
                    accountingMultiplier: payload.accountingMultiplier ? String(payload.accountingMultiplier) : null,
                    salesTiers: payload.salesTiers || null,
                }).returning();

                // Link children variants and update their multipliers/tiers if needed
                for (const variant of payload.variants) {
                    await db.update(products).set({
                        parentId: parentProduct.id,
                        variantOptions: variant.options,
                        accountingMultiplier: payload.accountingMultiplier ? String(payload.accountingMultiplier) : null,
                        salesTiers: payload.salesTiers || null,
                        updatedAt: new Date()
                    }).where(eq(products.id, variant.id));
                }
                affected = payload.variants.length;

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
            const { items } = req.body;

            if (!items || !Array.isArray(items) || items.length === 0) {
                return res.status(400).json({ error: 'items must be a non-empty array' });
            }

            const productIds = items
                .map((i: any) => i.id)
                .filter((id: any) => typeof id === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));

            if (productIds.length === 0) {
                return res.json({ validProducts: [], invalidIds: items.map((i: any) => i.id), capped: [] });
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

            // Build lookup map
            const productMap = new Map(foundProducts.map(p => [p.id, p]));

            const invalidIds: string[] = [];
            const validProducts: any[] = [];
            const capped: { id: string; requested: number; max: number }[] = [];

            for (const item of items) {
                const dbProduct = productMap.get(item.id);
                if (!dbProduct || dbProduct.status !== 'active') {
                    invalidIds.push(item.id);
                    continue;
                }

                const stock = dbProduct.stock ?? 0;
                const multiplier = Number(item.multiplier) || 1;
                const maxQuantity = stock > 0 ? Math.floor(stock / multiplier) : 0;
                const requested = Math.max(1, item.quantity || 1);
                const finalQuantity = Math.min(requested, maxQuantity);

                validProducts.push({
                    id: dbProduct.id,
                    name: dbProduct.name,
                    price: dbProduct.price,
                    discountPrice: dbProduct.discountPrice,
                    stock: dbProduct.stock,
                    maxQuantity,
                    image: dbProduct.images[0]?.url || null,
                });

                if (finalQuantity < requested) {
                    capped.push({ id: dbProduct.id, requested, max: finalQuantity });
                }
            }

            return res.json({ validProducts, invalidIds, capped });
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

    // POST /api/products/:id/suggest-related
    static async suggestRelatedProducts(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { name: bodyName, categoryId: bodyCategoryId } = req.body;

            let productName = bodyName;
            let categoryName = 'Unknown';
            let categoryId = bodyCategoryId;

            if (id !== 'new') {
                const product = await db.query.products.findFirst({
                    where: eq(products.id, id),
                    with: { category: true, brand: true }
                });

                if (!product) {
                    return res.status(404).json({ error: 'Product not found' });
                }
                productName = product.name;
                categoryName = product.category?.name || 'Unknown';
                categoryId = product.categoryId;
            } else {
                // If it's a new product, we at least need a name
                if (!productName) {
                    return res.status(400).json({ error: 'Product name is required for suggestions' });
                }
                // Resolve category name if categoryId provided in body
                if (categoryId) {
                    const cat = await db.query.categories.findFirst({
                        where: eq(categories.id, categoryId)
                    });
                    if (cat) categoryName = cat.name;
                }
            }

            let candidateProducts;
            if (categoryId) {
                // Try to find products in same category first
                candidateProducts = await db.query.products.findMany({
                    where: and(
                        eq(products.status, 'active'), 
                        eq(products.categoryId, categoryId),
                        id !== 'new' ? ne(products.id, id) : undefined
                    ),
                    limit: 150,
                    with: { brand: true }
                });
            }

            // If no candidates in same category, or we need more variety, get latest active products
            if (!candidateProducts || candidateProducts.length < 20) {
                const globalCandidates = await db.query.products.findMany({
                    where: and(
                        eq(products.status, 'active'),
                        id !== 'new' ? ne(products.id, id) : undefined
                    ),
                    limit: 300,
                    orderBy: (products, { desc }) => [desc(products.createdAt)],
                    with: { brand: true }
                });
                
                // Merge if needed, or replace
                if (candidateProducts && candidateProducts.length > 0) {
                    const existingIds = new Set(candidateProducts.map(p => p.id));
                    const newCandidates = globalCandidates.filter(p => !existingIds.has(p.id));
                    candidateProducts = [...candidateProducts, ...newCandidates.slice(0, 150)];
                } else {
                    candidateProducts = globalCandidates;
                }
            }

            const mappedCandidates = candidateProducts.map((p: any) => ({
                id: p.id,
                name: p.name,
                brand: p.brand?.name
            }));

            if (mappedCandidates.length === 0) {
                return res.json({ related: [], accessories: [], alternatives: [] });
            }

            const appSettings = await getMergedSettings();
            const rawKey = appSettings?.aiApiKey || appSettings?.googleApiKey || process.env.GOOGLE_API_KEY;
            const apiKey = rawKey ? decryptText(rawKey) : undefined;

            if (!apiKey) {
                return res.status(400).json({ error: 'مفتاح Google API غير مهيأ في الإعدادات' });
            }

            const aiService = new AIService(apiKey.trim());
            const relationships = await aiService.generateRelationships(
                productName,
                categoryName,
                mappedCandidates
            );

            res.json(relationships);
        } catch (error: any) {
            console.error('Error suggesting related products:', error);
            res.status(500).json({ error: 'Failed to suggest related products: ' + error.message });
        }
    }
}
