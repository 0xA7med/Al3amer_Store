import { pgTable, uuid, text, numeric, integer, boolean, timestamp, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============= USERS TABLE =============
export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    phone: text('phone'),
    phone2: text('phone2'),
    avatar: text('avatar'),
    password: text('password').notNull(),
    address: text('address'),
    city: text('city'),
    governorate: text('governorate'),
    role: text('role').default('customer'), // 'admin', 'customer', 'trader'
    loyaltyPoints: integer('loyalty_points').default(0),
    status: text('status').default('active'), // 'active', 'blocked'
    
    // Trader Configuration
    traderBranding: jsonb('trader_branding').$type<{
        logoUrl?: string;
        phone1?: string;
        phone2?: string;
        storeName?: string;
    }>(),
    discountConfig: jsonb('discount_config').$type<{
        type: 'percentage' | 'fixed';
        value: number;
        productExclusions?: string[]; // IDs of products excluded
        specificProductDiscounts?: Record<string, number>; // ProductID -> DiscountAmount
    }>(),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
    orders: many(orders),
    addresses: many(addresses),
    wishlist: many(wishlist),
    reviews: many(reviews),
    traderOrders: many(orders),
}));

// ============= ADDRESSES TABLE =============
export const addresses = pgTable('addresses', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(), // e.g., "Home", "Work", "Office"
    fullName: text('full_name').notNull(),
    phone: text('phone').notNull(),
    phone2: text('phone2'),
    governorate: text('governorate').notNull(),
    city: text('city'),
    address: text('address').notNull(),
    isDefault: boolean('is_default').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
    userIdIdx: index('idx_addresses_user_id').on(table.userId),
}));

export const addressesRelations = relations(addresses, ({ one }) => ({
    user: one(users, {
        fields: [addresses.userId],
        references: [users.id],
    }),
}));

// ============= WISHLIST TABLE =============
export const wishlist = pgTable('wishlist', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
    // Unique constraint to prevent duplicate entries
    uniqueUserProduct: {
        columns: [table.userId, table.productId],
    },
}));

export const wishlistRelations = relations(wishlist, ({ one }) => ({
    user: one(users, {
        fields: [wishlist.userId],
        references: [users.id],
    }),
    product: one(products, {
        fields: [wishlist.productId],
        references: [products.id],
    }),
}));

// ============= CATEGORIES TABLE =============
export const categories = pgTable('categories', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    parentId: uuid('parent_id'),
    image: text('image'),
    icon: text('icon'),
    isActive: boolean('is_active').default(true),
    isFeatured: boolean('is_featured').default(false),
    attributesSchema: jsonb('attributes_schema').$type<Array<{ name: string; type: 'single-select' | 'multi-select'; options: string[] }>>().default([]),
}, (table) => ({
    parentIdIdx: index('idx_categories_parent_id').on(table.parentId),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
    parent: one(categories, {
        fields: [categories.parentId],
        references: [categories.id],
    }),
    products: many(products),
}));

// ============= BRANDS TABLE =============
export const brands = pgTable('brands', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull().unique(),
    logo: text('logo'),
});

export const brandsRelations = relations(brands, ({ many }) => ({
    products: many(products),
}));

// ============= PRODUCTS TABLE =============
export const products = pgTable('products', {
    id: uuid('id').defaultRandom().primaryKey(),
    externalId: text('external_id').unique(), // Maps to Pro_ID from accounting software
    name: text('name').notNull(),
    description: text('description'),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    discountPrice: numeric('discount_price', { precision: 10, scale: 2 }),
    cost: numeric('cost', { precision: 10, scale: 2 }),
    sku: text('sku').unique(),
    stock: integer('stock').default(0),
    barcode: text('barcode'),
    categoryId: uuid('category_id').references(() => categories.id),
    brandId: uuid('brand_id').references(() => brands.id),
    slug: text('slug').notNull().unique(),
    status: text('status').default('active'), // active | draft | archived
    videos: jsonb('videos').$type<Array<{ url: string; title: string; is_featured: boolean }>>().default([]),
    metaTitle: text('meta_title'),
    metaDescription: text('meta_description'),
    isFeatured: boolean('is_featured').default(false),
    specifications: jsonb('specifications').$type<Array<{ key: string; value: string }>>(),
    dynamicAttributes: jsonb('dynamic_attributes').$type<Record<string, string | string[]>>().default({}),
    shortNameAwb: text('short_name_awb'), // الاسم المختصر للبوليسة (عالمي)
    tags: text('tags').array(),

    // --- Variation & Bulk Pricing Fields ---
    parentId: uuid('parent_id').references((): any => products.id), // Link child variants to a parent product
    variantOptions: jsonb('variant_options').$type<Record<string, string>>(), // e.g. { "Size": "38x50", "Length": "80m" }
    accountingMultiplier: numeric('accounting_multiplier', { precision: 10, scale: 2 }), // e.g. 100 for a box of 100
    salesTiers: jsonb('sales_tiers').$type<Array<{
        quantity: number;
        label: string; // e.g. "1 قطعة"
        adjustmentType: 'percentage' | 'fixed' | 'multiplier';
        adjustmentValue: number; // e.g. 1.5 if multiplier
    }>>(),

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
    categoryIdIdx: index('idx_products_category_id').on(table.categoryId),
    brandIdIdx: index('idx_products_brand_id').on(table.brandId),
    parentIdIdx: index('idx_products_parent_id').on(table.parentId),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
    category: one(categories, {
        fields: [products.categoryId],
        references: [categories.id],
    }),
    brand: one(brands, {
        fields: [products.brandId],
        references: [brands.id],
    }),
    images: many(productImages),
    orderItems: many(orderItems),
    reviews: many(reviews),
}));

// ============= PRODUCT IMAGES TABLE =============
export const productImages = pgTable('product_images', {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    isPrimary: boolean('is_primary').default(false),
    sortOrder: integer('sort_order').default(0),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
    productIdIdx: index('idx_product_images_product_id').on(table.productId),
}));

export const productImagesRelations = relations(productImages, ({ one }) => ({
    product: one(products, {
        fields: [productImages.productId],
        references: [products.id],
    }),
}));

// ============= ORDERS TABLE =============
export const orders = pgTable('orders', {
    id: uuid('id').defaultRandom().primaryKey(),
    orderNumber: text('order_number').notNull().unique(),
    userId: uuid('user_id').references(() => users.id),
    fullName: text('full_name').notNull(),
    phone: text('phone').notNull(),
    phone2: text('phone2'),
    email: text('email'),
    governorate: text('governorate').notNull(),
    city: text('city'),
    address: text('address').notNull(),
    notes: text('notes'),
    paymentMethod: text('payment_method').notNull(), // cod | paymob
    paymobOrderId: text('paymob_order_id'), // Store Paymob Order ID for verification
    status: text('status').default('pending'), // pending | processing | shipping | delivered
    subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
    shippingCost: numeric('shipping_cost', { precision: 10, scale: 2 }).default('0'),
    codAdvancePayment: numeric('cod_advance_payment', { precision: 10, scale: 2 }).default('0'),
    codReturnShipping: numeric('cod_return_shipping', { precision: 10, scale: 2 }).default('0'),
    totalAtDelivery: numeric('total_at_delivery', { precision: 10, scale: 2 }).default('0'),
    taxAmount: numeric('tax_amount', { precision: 10, scale: 2 }).default('0'),
    extraFee: numeric('extra_fee', { precision: 10, scale: 2 }).default('0'),
    total: numeric('total', { precision: 10, scale: 2 }).notNull(),

    // Trader Fields
    traderId: uuid('trader_id').references(() => users.id),
    traderCommission: numeric('trader_commission', { precision: 10, scale: 2 }).default('0'),
    finalCodAmount: numeric('final_cod_amount', { precision: 10, scale: 2 }), // المبلغ المطلوب تحصيله من العميل النهائي

    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
    userIdIdx: index('idx_orders_user_id').on(table.userId),
    traderIdIdx: index('idx_orders_trader_id').on(table.traderId),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
    user: one(users, {
        fields: [orders.userId],
        references: [users.id],
    }),
    trader: one(users, {
        fields: [orders.traderId],
        references: [users.id],
        relationName: 'traderOrders'
    }),
    items: many(orderItems),
}));

// ============= ORDER ITEMS TABLE =============
export const orderItems = pgTable('order_items', {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    quantity: integer('quantity').notNull(),
    selectedTierId: text('selected_tier_id'),
    multiplier: integer('multiplier').default(1),
}, (table) => ({
    orderIdIdx: index('idx_order_items_order_id').on(table.orderId),
    productIdIdx: index('idx_order_items_product_id').on(table.productId),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
    order: one(orders, {
        fields: [orderItems.orderId],
        references: [orders.id],
    }),
    product: one(products, {
        fields: [orderItems.productId],
        references: [products.id],
    }),
}));

// ============= AI BUNDLE LOGS TABLE =============
export const aiBundleLogs = pgTable('ai_bundle_logs', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id),
    businessType: text('business_type').notNull(),
    budget: integer('budget').notNull(),
    selectedFeatures: text('selected_features').array().notNull(),
    resultBundle: jsonb('result_bundle'),
    matchScore: integer('match_score'),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
    userIdIdx: index('idx_ai_bundle_logs_user_id').on(table.userId),
}));

export const aiBundleLogsRelations = relations(aiBundleLogs, ({ one }) => ({
    user: one(users, {
        fields: [aiBundleLogs.userId],
        references: [users.id],
    }),
}));

// ============= SETTINGS TABLE (core general settings) =============
export const settings = pgTable('settings', {
    id: uuid('id').defaultRandom().primaryKey(),
    // General
    storeNameAr: text('store_name_ar'),
    storeNameEn: text('store_name_en'),
    supportPhone: text('support_phone'),
    supportEmail: text('support_email'),
    address: text('address'),
    logoUrl: text('logo_url'),
    faviconUrl: text('favicon_url'),
    // Social Media
    facebook: text('facebook'),
    instagram: text('instagram'),
    whatsapp: text('whatsapp'),
    twitterX: text('twitter_x'),
    // Taxes
    vatEnabled: boolean('vat_enabled').default(true),
    taxPercentage: numeric('tax_percentage', { precision: 5, scale: 2 }).default('14'),
    taxRegistrationNumber: text('tax_registration_number'),
    pricesIncludeTax: boolean('prices_include_tax').default(true),
    // Integration
    facebookPixelId: text('facebook_pixel_id'),
    facebookPixelEnabled: boolean('facebook_pixel_enabled').default(false),
    ga4MeasurementId: text('ga4_measurement_id'),
    ga4Enabled: boolean('ga4_enabled').default(false),
    // SEO
    metaTitle: text('meta_title'),
    metaDescription: text('meta_description'),
    metaKeywords: text('meta_keywords'),
    // Interactive Bill Settings
    billLayoutConfig: jsonb('bill_layout_config').$type<{
        logo?: {
            x: number;
            y: number;
            height: number;
            width?: number;
            marginRight?: number;
            marginTop?: number;
            marginBottom?: number;
            marginLeft?: number;
        };
        title?: {
            x: number;
            y: number;
            fontSize: number;
            text?: string;
            color?: string;
            xOffset?: number;
            yOffset?: number;
        };
    }>(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

export const settingsRelations = relations(settings, ({ one }) => ({
    payment: one(paymentSettings),
    notification: one(notificationSettings),
    ai: one(aiSettings),
    shipping: one(shippingSettings),
}));

// ============= PAYMENT SETTINGS TABLE =============
export const paymentSettings = pgTable('payment_settings', {
    id: uuid('id').defaultRandom().primaryKey(),
    settingsId: uuid('settings_id').notNull().references(() => settings.id, { onDelete: 'cascade' }),
    paymobEnabled: boolean('paymob_enabled').default(false),
    paymobApiKey: text('paymob_api_key'),
    paymobIntegrationCard: text('paymob_integration_card'),
    paymobIntegrationWallet: text('paymob_integration_wallet'),
    paymobIframeId: text('paymob_iframe_id'),
    codEnabled: boolean('cod_enabled').default(true),
    codExtraFee: numeric('cod_extra_fee', { precision: 10, scale: 2 }).default('0'),
    codAdvancePayment: numeric('cod_advance_payment', { precision: 10, scale: 2 }).default('100'),
    codReturnShippingBaseFee: numeric('cod_return_shipping_base_fee', { precision: 10, scale: 2 }).default('30'),
    codReturnShippingBaseAmount: numeric('cod_return_shipping_base_amount', { precision: 10, scale: 2 }).default('1000'),
    codReturnShippingExtraFee: numeric('cod_return_shipping_extra_fee', { precision: 10, scale: 2 }).default('5'),
    codReturnShippingExtraAmount: numeric('cod_return_shipping_extra_amount', { precision: 10, scale: 2 }).default('1000'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
    settingsIdIdx: index('idx_payment_settings_settings_id').on(table.settingsId),
}));

export const paymentSettingsRelations = relations(paymentSettings, ({ one }) => ({
    settings: one(settings, {
        fields: [paymentSettings.settingsId],
        references: [settings.id],
    }),
}));

// ============= NOTIFICATION SETTINGS TABLE =============
export const notificationSettings = pgTable('notification_settings', {
    id: uuid('id').defaultRandom().primaryKey(),
    settingsId: uuid('settings_id').notNull().references(() => settings.id, { onDelete: 'cascade' }),
    telegramEnabled: boolean('telegram_enabled').default(false),
    telegramBotToken: text('telegram_bot_token'),
    telegramChatId: text('telegram_chat_id'),
    whatsappEnabled: boolean('whatsapp_enabled').default(false),
    whatsappApiKey: text('whatsapp_api_key'),
    whatsappRecipientPhone: text('whatsapp_recipient_phone'),
    emailEnabled: boolean('email_enabled').default(false),
    smtpHost: text('smtp_host'),
    smtpPort: integer('smtp_port').default(587),
    smtpUser: text('smtp_user'),
    smtpPass: text('smtp_pass'),
    emailFrom: text('email_from'),
    emailReceiver: text('email_receiver'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
    settingsIdIdx: index('idx_notification_settings_settings_id').on(table.settingsId),
}));

export const notificationSettingsRelations = relations(notificationSettings, ({ one }) => ({
    settings: one(settings, {
        fields: [notificationSettings.settingsId],
        references: [settings.id],
    }),
}));

// ============= AI SETTINGS TABLE =============
export const aiSettings = pgTable('ai_settings', {
    id: uuid('id').defaultRandom().primaryKey(),
    settingsId: uuid('settings_id').notNull().references(() => settings.id, { onDelete: 'cascade' }),
    aiEnabled: boolean('ai_enabled').default(true),
    googleApiKey: text('google_api_key'),
    aiApiKey: text('ai_api_key'),
    aiTone: text('ai_tone').default('Marketing'),
    aiLanguage: text('ai_language').default('ar'),
    aiDescriptionLength: text('ai_description_length').default('medium'),
    aiFields: jsonb('ai_fields').$type<{
        name: boolean;
        description: boolean;
        seo: boolean;
        specs: boolean;
        price: boolean;
    }>(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
    settingsIdIdx: index('idx_ai_settings_settings_id').on(table.settingsId),
}));

export const aiSettingsRelations = relations(aiSettings, ({ one }) => ({
    settings: one(settings, {
        fields: [aiSettings.settingsId],
        references: [settings.id],
    }),
}));

// ============= SHIPPING SETTINGS TABLE =============
export const shippingSettings = pgTable('shipping_settings', {
    id: uuid('id').defaultRandom().primaryKey(),
    settingsId: uuid('settings_id').notNull().references(() => settings.id, { onDelete: 'cascade' }),
    shippingFlatRate: numeric('shipping_flat_rate', { precision: 10, scale: 2 }).default('50'),
    freeShippingThreshold: numeric('free_shipping_threshold', { precision: 10, scale: 2 }).default('2000'),
    customCityRatesEnabled: boolean('custom_city_rates_enabled').default(false),
    cityShippingRates: jsonb('city_shipping_rates').$type<{ city: string; rate: number }[]>().default([]),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
    settingsIdIdx: index('idx_shipping_settings_settings_id').on(table.settingsId),
}));

export const shippingSettingsRelations = relations(shippingSettings, ({ one }) => ({
    settings: one(settings, {
        fields: [shippingSettings.settingsId],
        references: [settings.id],
    }),
}));

// ============= BANNERS TABLE =============
export const banners = pgTable('banners', {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    imageUrl: text('image_url').notNull(),
    link: text('link'),
    isActive: boolean('is_active').default(true),
    sortOrder: integer('sort_order').default(0),
    createdAt: timestamp('created_at').defaultNow(),
});

// ============= COUPONS TABLE =============
export const coupons = pgTable('coupons', {
    id: uuid('id').defaultRandom().primaryKey(),
    code: text('code').notNull().unique(),
    discount: numeric('discount', { precision: 10, scale: 2 }).notNull(),
    type: text('type').notNull(), // 'percentage' | 'fixed'
    usageCount: integer('usage_count').default(0),
    usageLimit: integer('usage_limit').notNull(),
    minOrder: numeric('min_order', { precision: 10, scale: 2 }),
    startDate: timestamp('start_date'),
    expiryDate: timestamp('expiry_date').notNull(),
    status: text('status').default('active'), // active | expired | scheduled
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});

// ============= REVIEWS TABLE =============
export const reviews = pgTable('reviews', {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id),
    customerName: text('customer_name'), // For guest reviews
    rating: integer('rating').notNull(),
    text: text('text'),
    status: text('status').default('pending'), // pending | approved | rejected
    isApproved: boolean('is_approved').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
    productIdIdx: index('idx_reviews_product_id').on(table.productId),
    userIdIdx: index('idx_reviews_user_id').on(table.userId),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
    product: one(products, {
        fields: [reviews.productId],
        references: [products.id],
    }),
    user: one(users, {
        fields: [reviews.userId],
        references: [users.id],
    }),
}));
