import { db } from '../db/index.js';
import { products, productImages, categories, brands, reviews, orderItems, productRelations } from '../db/schema.js';
import { eq, and, or, sql, inArray, desc, count, gte, ilike } from 'drizzle-orm';
import { AIService } from '../services/ai.service.js';
import { decryptText } from '../lib/crypto.utils.js';
import { getMergedSettings } from '../lib/settings-helper.js';
import { uploadToCloudinary } from '../lib/cloudinary.js';
// In-memory tracker for popular/trending searches globally
const searchHistoryTracker = {};
export class ProductsController {
    // Helper to generate SEO friendly slugs (Arabic & English)
    static slugify(text) {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-') // Replace spaces with -
            .replace(/[^\w\u0621-\u064A-]+/g, '') // Remove all non-word chars (support Arabic)
            .replace(/--+/g, '-') // Replace multiple - with single -
            .replace(/^-+/, '') // Trim - from start of text
            .replace(/-+$/, ''); // Trim - from end of text
    }
    // Helper to calculate AI Readiness Score
    static calculateAIReadinessScore(product) {
        let score = 0;
        if (product.llmDescription)
            score += 30;
        if (product.faq && Array.isArray(product.faq) && product.faq.length >= 5)
            score += 20;
        if (product.description && product.description.length >= 100)
            score += 10;
        if (product.specifications && Array.isArray(product.specifications) && product.specifications.length >= 3)
            score += 10;
        if (product.metaDescription)
            score += 10;
        if (product.tags && Array.isArray(product.tags) && product.tags.length >= 3)
            score += 10;
        if (product.images && Array.isArray(product.images) && product.images.length >= 2)
            score += 10;
        return score;
    }
    // Generate AI Content
    static async aiGenerate(req, res) {
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
            const result = await aiService.generateProductDetails(name, appSettings?.aiLanguage || 'ar', appSettings?.aiTone || 'Marketing', appSettings?.aiDescriptionLength || 'medium', section, category, brand, section === 'llm_geo' ? 'Generate a detailed marketing description optimized for LLM search (GEO) and 5-10 frequently asked questions about the product in Arabic.' : undefined);
            return res.json(result);
        }
        catch (error) {
            console.error('❌ AI Generate Critical Error:', error);
            // Check for specific error types to provide better user feedback
            const message = error?.message || '';
            let userMessage = 'فشل توليد المحتوى. يرجى التأكد من مفتاح API وصلاحيته.';
            if (message.includes('API_KEY_INVALID') || message.includes('invalid api key')) {
                userMessage = 'مفتاح Google API غير صالح. يرجى التأكد من المفتاح في الإعدادات.';
            }
            else if (message.includes('quota') || message.includes('429')) {
                userMessage = 'تم تجاوز حصة الاستخدام (Quota) لمفتاح API الخاص بك.';
            }
            else if (message.includes('All AI models failed')) {
                userMessage = `فشل الاتصال بنماذج الذكاء الاصطناعي: ${message}`;
            }
            return res.status(500).json({
                error: userMessage,
                details: process.env.NODE_ENV === 'development' ? error?.message : undefined
            });
        }
    }
    // GET /api/products - List products with pagination and filtering
    static async list(req, res) {
        try {
            const { page = '1', limit = '10', categories: categoriesParam, search, minPrice, status = 'active', featured, hasDiscount, sort, exclude, dynamicFilters, } = req.query;
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const offset = (pageNum - 1) * limitNum;
            const conditions = [];
            if (status) {
                conditions.push(eq(products.status, status));
            }
            if (featured === 'true') {
                conditions.push(eq(products.isFeatured, true));
            }
            if (hasDiscount === 'true') {
                conditions.push(sql `${products.discountPrice} IS NOT NULL`);
            }
            if (exclude) {
                conditions.push(sql `${products.id} != ${exclude}`);
            }
            if (categoriesParam) {
                const categorySlugs = categoriesParam.split(',');
                const cats = await db.query.categories.findMany({
                    where: inArray(categories.slug, categorySlugs),
                });
                if (cats.length > 0) {
                    conditions.push(inArray(products.categoryId, cats.map(c => c.id)));
                }
            }
            if (search) {
                const searchPattern = `%${search}%`;
                conditions.push(or(ilike(products.name, searchPattern), ilike(products.description, searchPattern)));
            }
            if (minPrice) {
                conditions.push(gte(products.price, minPrice));
            }
            if (dynamicFilters) {
                try {
                    const filtersObj = JSON.parse(dynamicFilters);
                    for (const [key, values] of Object.entries(filtersObj)) {
                        if (Array.isArray(values) && values.length > 0) {
                            const valueList = values.map(v => sql `${v}`);
                            conditions.push(sql `${products.dynamicAttributes}->${key} ?| array[${sql.join(valueList, sql `, `)}]`);
                        }
                    }
                }
                catch (e) {
                    console.error('Failed to parse dynamicFilters query param:', e);
                }
            }
            const where = conditions.length > 0 ? and(...conditions) : undefined;
            const totalResult = await db.select({ count: count() }).from(products).where(where);
            const total = Number(totalResult[0]?.count ?? 0);
            const totalPages = Math.ceil(total / limitNum);
            let productsList = [];
            if (sort === 'bestselling') {
                const totalSalesExpr = sql `COALESCE(SUM(CAST(${orderItems.quantity} AS INTEGER)), 0)`;
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
                }
                else {
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
            }
            else {
                productsList = await db.query.products.findMany({
                    where,
                    limit: limitNum,
                    offset,
                    orderBy: (products, { desc, asc }) => {
                        if (sort === 'newest')
                            return [desc(products.createdAt)];
                        if (sort === 'price_asc')
                            return [asc(products.price)];
                        if (sort === 'price_desc')
                            return [desc(products.price)];
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
                data: productsList.map(p => ({ ...p, aiReadinessScore: ProductsController.calculateAIReadinessScore(p) })),
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages,
                },
            });
        }
        catch (error) {
            console.error('Error fetching products:', error);
            res.status(500).json({ error: 'Failed to fetch products' });
        }
    }
    // GET /api/products/search-suggestions?q=...
    static async searchSuggestions(req, res) {
        try {
            const { q = '' } = req.query;
            const queryTerm = q.toLowerCase().trim();
            if (!queryTerm || queryTerm.length < 2) {
                return res.json([]);
            }
            // Track trending searches (only if it's a valid meaningful word)
            if (queryTerm.length >= 3) {
                searchHistoryTracker[queryTerm] = (searchHistoryTracker[queryTerm] || 0) + 1;
            }
            const searchPattern = `%${queryTerm}%`;
            const results = await db.query.products.findMany({
                where: and(eq(products.status, 'active'), ilike(products.name, searchPattern)),
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
        }
        catch (error) {
            console.error('Error fetching search suggestions:', error);
            res.status(500).json({ error: 'Failed to fetch suggestions' });
        }
    }
    // GET /api/products/popular-searches
    static async popularSearches(req, res) {
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
        }
        catch (error) {
            console.error('Error fetching popular searches:', error);
            res.status(500).json({ error: 'Failed' });
        }
    }
    // GET /api/products/:id - Get single product
    static async getOne(req, res) {
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
            // Handle Variants (Multi-Variant Product System)
            let variants = [];
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
            }
            else {
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
                supportPhone: storeSettings?.supportPhone || '201012345678',
                aiReadinessScore: ProductsController.calculateAIReadinessScore(product)
            });
        }
        catch (error) {
            console.error('Error fetching product:', error);
            res.status(500).json({ error: 'Failed to fetch product' });
        }
    }
    // POST /api/products - Create new product
    static async create(req, res) {
        try {
            const { name, description, price, discountPrice, cost, sku, external_id, stock, barcode, categoryId, brandId, status, videos, metaTitle, metaDescription, isFeatured, specifications, dynamicAttributes, tags, images: imageUrls, slug: manualSlug, brand: brandName, llmDescription, faq, } = req.body;
            // Resolve brand name to ID if brandName is provided
            let resolvedBrandId = brandId;
            if (brandName && !brandId) {
                const existingBrand = await db.query.brands.findFirst({
                    where: ilike(brands.name, brandName)
                });
                if (existingBrand) {
                    resolvedBrandId = existingBrand.id;
                }
                else {
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
                llmDescription,
                faq: faq || [],
            }).returning();
            // Insert product images if provided
            if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
                const hasExplicitPrimary = imageUrls.some((u) => typeof u === 'object' && u.isPrimary);
                const imagesData = await Promise.all(imageUrls.map(async (img, index) => {
                    let url = typeof img === 'string' ? img : img.url;
                    if (url.startsWith('data:image/')) {
                        try {
                            url = await uploadToCloudinary(url);
                        }
                        catch (err) {
                            console.error('❌ Failed to upload image to cloudinary:', err);
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
            res.status(201).json(newProduct);
        }
        catch (error) {
            console.error('Error creating product:', error);
            res.status(500).json({ error: 'Failed to create product' });
        }
    }
    // PUT /api/products/:id - Update product
    static async update(req, res) {
        try {
            const { id } = req.params;
            const { name, description, price, discountPrice, cost, sku, external_id, stock, barcode, categoryId, brandId, status, videos, metaTitle, metaDescription, isFeatured, specifications, dynamicAttributes, tags, images, slug: manualSlug, brand: brandName, llmDescription, faq, } = req.body;
            let resolvedBrandId = brandId;
            if (brandName && !brandId) {
                const existingBrand = await db.query.brands.findFirst({
                    where: ilike(brands.name, brandName)
                });
                if (existingBrand) {
                    resolvedBrandId = existingBrand.id;
                }
                else {
                    const [newBrand] = await db.insert(brands).values({ name: brandName }).returning();
                    resolvedBrandId = newBrand.id;
                }
            }
            const updateData = {
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
                llmDescription,
                faq: faq || [],
                updatedAt: new Date(),
            };
            if (manualSlug) {
                updateData.slug = manualSlug;
            }
            else if (name) {
                updateData.slug = ProductsController.slugify(name);
            }
            Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
            await db.update(products)
                .set(updateData)
                .where(eq(products.id, id));
            if (images && Array.isArray(images)) {
                await db.delete(productImages).where(eq(productImages.productId, id));
                const hasExplicitPrimary = images.some((u) => typeof u === 'object' && u.isPrimary);
                const imagesData = await Promise.all(images.map(async (img, index) => {
                    let url = typeof img === 'string' ? img : img.url;
                    if (url.startsWith('data:image/')) {
                        try {
                            url = await uploadToCloudinary(url);
                        }
                        catch (err) {
                            console.error('❌ Failed to upload update image:', err);
                        }
                    }
                    return {
                        productId: id,
                        url: url,
                        isPrimary: typeof img === 'object' ? !!img.isPrimary : (!hasExplicitPrimary && index === 0),
                        sortOrder: index,
                    };
                }));
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
        }
        catch (error) {
            console.error('Error updating product:', error);
            res.status(500).json({ error: 'Failed to update product' });
        }
    }
    // PATCH /api/products/:id/short-name
    static async updateShortName(req, res) {
        try {
            const { id } = req.params;
            const { shortNameAwb } = req.body;
            const [updatedProduct] = await db.update(products)
                .set({ shortNameAwb, updatedAt: new Date() })
                .where(eq(products.id, id))
                .returning();
            res.json(updatedProduct);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed' });
        }
    }
    // PATCH /api/products/bulk
    static async bulkUpdate(req, res) {
        try {
            const { updates } = req.body;
            if (!updates || !Array.isArray(updates))
                return res.status(400).json({ error: 'Invalid updates' });
            await db.transaction(async (tx) => {
                for (const update of updates) {
                    const { id, ...data } = update;
                    await tx.update(products).set({ ...data, updatedAt: new Date() }).where(eq(products.id, id));
                }
            });
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed' });
        }
    }
    // POST /api/products/bulk-action
    static async bulkAction(req, res) {
        try {
            const { ids, action, payload } = req.body;
            if (!ids || !Array.isArray(ids) || ids.length === 0)
                return res.status(400).json({ error: 'No IDs' });
            let affected = 0;
            if (action === 'delete') {
                await db.delete(products).where(inArray(products.id, ids));
                affected = ids.length;
            }
            else if (action === 'show') {
                await db.update(products).set({ status: 'active', updatedAt: new Date() }).where(inArray(products.id, ids));
                affected = ids.length;
            }
            else if (action === 'hide') {
                await db.update(products).set({ status: 'draft', updatedAt: new Date() }).where(inArray(products.id, ids));
                affected = ids.length;
            }
            else if (action === 'category') {
                await db.update(products).set({ categoryId: payload.categoryId, updatedAt: new Date() }).where(inArray(products.id, ids));
                affected = ids.length;
            }
            else if (action === 'price') {
                const val = payload.priceValue;
                const mode = payload.priceMode;
                let priceExpr;
                if (mode === 'add_fixed')
                    priceExpr = sql `GREATEST(0, CAST(${products.price} AS NUMERIC) + ${val})::TEXT`;
                else if (mode === 'subtract_fixed')
                    priceExpr = sql `GREATEST(0, CAST(${products.price} AS NUMERIC) - ${val})::TEXT`;
                else if (mode === 'add_percent')
                    priceExpr = sql `GREATEST(0, CAST(${products.price} AS NUMERIC) * (1 + ${val} / 100.0))::TEXT`;
                else if (mode === 'subtract_percent')
                    priceExpr = sql `GREATEST(0, CAST(${products.price} AS NUMERIC) * (1 - ${val} / 100.0))::TEXT`;
                else if (mode === 'set_fixed')
                    priceExpr = sql `${val.toString()}`;
                await db.update(products).set({ price: priceExpr, updatedAt: new Date() }).where(inArray(products.id, ids));
                affected = ids.length;
            }
            else if (action === 'stock') {
                const val = payload.stockValue;
                const mode = payload.stockMode;
                let stockExpr;
                if (mode === 'add')
                    stockExpr = sql `GREATEST(0, COALESCE(${products.stock}, 0) + ${val})`;
                else if (mode === 'subtract')
                    stockExpr = sql `GREATEST(0, COALESCE(${products.stock}, 0) - ${val})`;
                else if (mode === 'set')
                    stockExpr = sql `${val}`;
                await db.update(products).set({ stock: stockExpr, updatedAt: new Date() }).where(inArray(products.id, ids));
                affected = ids.length;
            }
            else if (action === 'group') {
                const firstChild = await db.query.products.findFirst({ where: eq(products.id, payload.variants[0].id) });
                const [parentProduct] = await db.insert(products).values({
                    name: payload.groupName,
                    slug: ProductsController.slugify(payload.groupName) + '-' + Math.floor(Math.random() * 10000),
                    price: '0', status: 'active',
                    categoryId: firstChild?.categoryId,
                    brandId: firstChild?.brandId,
                    accountingMultiplier: payload.accountingMultiplier ? String(payload.accountingMultiplier) : null,
                    salesTiers: payload.salesTiers || null,
                }).returning();
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
            }
            res.json({ success: true, affected });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed' });
        }
    }
    // POST /api/products/validate-cart
    static async validateCart(req, res) {
        try {
            const { items } = req.body;
            if (!items || !Array.isArray(items))
                return res.status(400).json({ error: 'Invalid items' });
            const productIds = items.map((i) => i.id).filter((id) => typeof id === 'string');
            if (productIds.length === 0)
                return res.json({ validProducts: [], invalidIds: [], capped: [] });
            const foundProducts = await db.query.products.findMany({
                where: inArray(products.id, productIds),
                with: { images: { where: eq(productImages.isPrimary, true), limit: 1 } },
                columns: { id: true, name: true, price: true, discountPrice: true, stock: true, status: true }
            });
            const productMap = new Map(foundProducts.map(p => [p.id, p]));
            const validProducts = [];
            const invalidIds = [];
            const capped = [];
            for (const item of items) {
                const dbProduct = productMap.get(item.id);
                if (!dbProduct || dbProduct.status !== 'active') {
                    invalidIds.push(item.id);
                    continue;
                }
                const stock = dbProduct.stock ?? 0;
                const requested = item.quantity || 1;
                const finalQuantity = Math.min(requested, stock);
                validProducts.push({
                    id: dbProduct.id, name: dbProduct.name, price: dbProduct.price,
                    discountPrice: dbProduct.discountPrice, image: dbProduct.images[0]?.url || null, stock
                });
                if (finalQuantity < requested)
                    capped.push({ id: dbProduct.id, requested, max: finalQuantity });
            }
            res.json({ validProducts, invalidIds, capped });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed' });
        }
    }
    // DELETE /api/products/:id
    static async delete(req, res) {
        try {
            const { id } = req.params;
            await db.delete(products).where(eq(products.id, id));
            res.json({ message: 'Deleted' });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed' });
        }
    }
    // POST /api/products/:id/relations
    static async updateRelations(req, res) {
        try {
            const { id } = req.params;
            const { relations: newRelations } = req.body; // Array of { relatedId, type, sortOrder }
            if (!Array.isArray(newRelations))
                return res.status(400).json({ error: 'Invalid relations format' });
            await db.transaction(async (tx) => {
                // Delete existing relations
                await tx.delete(productRelations).where(eq(productRelations.productId, id));
                // Insert new ones if any
                if (newRelations.length > 0) {
                    await tx.insert(productRelations).values(newRelations.map((r) => ({
                        productId: id,
                        relatedId: r.relatedId,
                        relationType: r.type || 'related',
                        sortOrder: r.sortOrder || 0
                    })));
                }
            });
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to update relations' });
        }
    }
}
//# sourceMappingURL=products.controller.js.map