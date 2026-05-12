import { pgTable, text, timestamp, uuid, numeric, boolean, integer, jsonb, index, uniqueIndex } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
// ============= USERS TABLE =============
export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    phone: text('phone').unique(),
    phone2: text('phone2'),
    password: text('password').notNull(),
    role: text('role').default('customer'), // admin | user | trader
    image: text('image'),
    avatar: text('avatar'),
    address: text('address'),
    isTrader: boolean('is_trader').default(false),
    traderStatus: text('trader_status').default('pending'), // pending | approved | rejected
    storeName: text('store_name'),
    idCardNumber: text('id_card_number'),
    idCardImage: text('id_card_image'),
    loyaltyPoints: integer('loyalty_points').default(0),
    status: text('status').default('active'),
    city: text('city'),
    governorate: text('governorate'),
    traderBranding: jsonb('trader_branding'),
    discountConfig: jsonb('discount_config'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});
export const usersRelations = relations(users, ({ many }) => ({
    addresses: many(addresses),
    wishlist: many(wishlist),
    reviews: many(reviews),
    orders: many(orders),
    traderOrders: many(orders, { relationName: 'trader' }),
}));
// ============= ADDRESSES TABLE =============
export const addresses = pgTable('addresses', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    fullName: text('full_name').notNull(),
    phone: text('phone').notNull(),
    phone2: text('phone2'),
    governorate: text('governorate').notNull(),
    city: text('city'), // Made optional to match controller
    address: text('address').notNull(),
    isDefault: boolean('is_default').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
    userIdIdx: index('idx_addresses_user_id').on(table.userId),
}));
export const addressesRelations = relations(addresses, ({ one }) => ({
    user: one(users, { fields: [addresses.userId], references: [users.id] }),
}));
// ============= CATEGORIES TABLE =============
export const categories = pgTable('categories', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    image: text('image'),
    iconName: text('icon_name'), // For Material Symbols
    parentId: uuid('parent_id'),
    isActive: boolean('is_active').default(true),
    isFeatured: boolean('is_featured').default(false),
    attributesSchema: jsonb('attributes_schema').default([]),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
    parentIdIdx: index('idx_categories_parent_id').on(table.parentId),
}));
export const categoriesRelations = relations(categories, ({ one, many }) => ({
    parent: one(categories, {
        fields: [categories.parentId],
        references: [categories.id],
        relationName: 'parent_child',
    }),
    children: many(categories, {
        relationName: 'parent_child',
    }),
    products: many(products),
}));
// ============= BRANDS TABLE =============
export const brands = pgTable('brands', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    image: text('image'),
    logo: text('logo'),
    description: text('description'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});
export const brandsRelations = relations(brands, ({ many }) => ({
    products: many(products),
}));
// ============= PRODUCTS TABLE =============
export const products = pgTable('products', {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').notNull().unique(),
    description: text('description'),
    shortNameAwb: text('short_name_awb'),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    discountPrice: numeric('discount_price', { precision: 10, scale: 2 }),
    cost: numeric('cost', { precision: 10, scale: 2 }),
    sku: text('sku').unique(),
    barcode: text('barcode'),
    externalId: text('external_id'),
    stock: integer('stock').default(0),
    status: text('status').default('active'),
    isFeatured: boolean('is_featured').default(false),
    categoryId: uuid('category_id').references(() => categories.id),
    brandId: uuid('brand_id').references(() => brands.id),
    parentId: uuid('parent_id').references(() => products.id),
    variantOptions: jsonb('variant_options'),
    specifications: jsonb('specifications').$type().default([]),
    dynamicAttributes: jsonb('dynamic_attributes').$type().default({}),
    tags: jsonb('tags').default([]),
    videos: jsonb('videos').default([]),
    metaTitle: text('meta_title'),
    metaDescription: text('meta_description'),
    accountingMultiplier: numeric('accounting_multiplier', { precision: 10, scale: 2 }),
    salesTiers: jsonb('sales_tiers').default([]),
    llmDescription: text('llm_description'),
    faq: jsonb('faq').$type().default([]),
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
    parent: one(products, {
        fields: [products.parentId],
        references: [products.id],
        relationName: 'variants',
    }),
    variants: many(products, {
        relationName: 'variants',
    }),
    images: many(productImages),
    orderItems: many(orderItems),
    reviews: many(reviews),
    productRelations: many(productRelations, { relationName: 'product' }),
    relatedFrom: many(productRelations, { relationName: 'relatedProduct' }),
}));
// ============= PRODUCT RELATIONS TABLE =============
export const productRelations = pgTable('product_relations', {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    relatedId: uuid('related_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    relationType: text('relation_type').notNull(), // 'related' | 'accessory' | 'alternative'
    sortOrder: integer('sort_order').default(0),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
    productIdIdx: index('idx_product_relations_product_id').on(table.productId),
    uniqueRelation: uniqueIndex('idx_product_unique_relation').on(table.productId, table.relatedId, table.relationType),
}));
export const productRelationsTableRelations = relations(productRelations, ({ one }) => ({
    product: one(products, {
        fields: [productRelations.productId],
        references: [products.id],
        relationName: 'product'
    }),
    relatedProduct: one(products, {
        fields: [productRelations.relatedId],
        references: [products.id],
        relationName: 'relatedProduct'
    }),
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
    paymentMethod: text('payment_method').notNull(),
    paymobOrderId: text('paymob_order_id'),
    status: text('status').default('pending'),
    subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
    shippingCost: numeric('shipping_cost', { precision: 10, scale: 2 }).default('0'),
    codAdvancePayment: numeric('cod_advance_payment', { precision: 10, scale: 2 }).default('0'),
    codReturnShipping: numeric('cod_return_shipping', { precision: 10, scale: 2 }).default('0'),
    totalAtDelivery: numeric('total_at_delivery', { precision: 10, scale: 2 }).default('0'),
    taxAmount: numeric('tax_amount', { precision: 10, scale: 2 }).default('0'),
    extraFee: numeric('extra_fee', { precision: 10, scale: 2 }).default('0'),
    total: numeric('total', { precision: 10, scale: 2 }).notNull(),
    traderId: uuid('trader_id').references(() => users.id),
    traderCommission: numeric('trader_commission', { precision: 10, scale: 2 }).default('0'),
    finalCodAmount: numeric('final_cod_amount', { precision: 10, scale: 2 }),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
    userIdIdx: index('idx_orders_user_id').on(table.userId),
    traderIdIdx: index('idx_orders_trader_id').on(table.traderId),
}));
export const ordersRelations = relations(orders, ({ one, many }) => ({
    user: one(users, { fields: [orders.userId], references: [users.id] }),
    items: many(orderItems),
    trader: one(users, { fields: [orders.traderId], references: [users.id], relationName: 'trader' }),
}));
// ============= ORDER ITEMS TABLE =============
export const orderItems = pgTable('order_items', {
    id: uuid('id').defaultRandom().primaryKey(),
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
    quantity: integer('quantity').notNull(),
    price: numeric('price', { precision: 10, scale: 2 }).notNull(),
    name: text('name').notNull(),
    sku: text('sku'),
    variantOptions: jsonb('variant_options'),
    createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
    orderIdIdx: index('idx_order_items_order_id').on(table.orderId),
    productIdIdx: index('idx_order_items_product_id').on(table.productId),
}));
export const orderItemsRelations = relations(orderItems, ({ one }) => ({
    order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
    product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));
// ============= REVIEWS TABLE =============
export const reviews = pgTable('reviews', {
    id: uuid('id').defaultRandom().primaryKey(),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    customerName: text('customer_name'),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    text: text('text'), // Alias for comment in some parts
    status: text('status').default('pending'),
    isApproved: boolean('is_approved').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
    productIdIdx: index('idx_reviews_product_id').on(table.productId),
    userIdIdx: index('idx_reviews_user_id').on(table.userId),
}));
export const reviewsRelations = relations(reviews, ({ one }) => ({
    product: one(products, { fields: [reviews.productId], references: [products.id] }),
    user: one(users, { fields: [reviews.userId], references: [users.id] }),
}));
// ============= WISHLIST TABLE =============
export const wishlist = pgTable('wishlist', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow(),
});
export const wishlistRelations = relations(wishlist, ({ one }) => ({
    user: one(users, { fields: [wishlist.userId], references: [users.id] }),
    product: one(products, { fields: [wishlist.productId], references: [products.id] }),
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
// ============= SETTINGS TABLE =============
export const settings = pgTable('settings', {
    id: uuid('id').defaultRandom().primaryKey(),
    storeName: text('store_name').notNull().default('Al3amer Store'),
    storeNameAr: text('store_name_ar'),
    storeNameEn: text('store_name_en'),
    supportPhone: text('support_phone').notNull().default('201012345678'),
    supportEmail: text('support_email'),
    address: text('address'),
    logoUrl: text('logo_url'),
    faviconUrl: text('favicon_url'),
    facebook: text('facebook'),
    instagram: text('instagram'),
    whatsapp: text('whatsapp'),
    twitterX: text('twitter_x'),
    // Legacy Payment & AI Fields (Keep for compatibility)
    googleApiKey: text('google_api_key'),
    aiApiKey: text('ai_api_key'),
    aiModel: text('ai_model').default('gemini-2.0-flash'),
    aiLanguage: text('ai_language').default('ar'),
    aiTone: text('ai_tone').default('Professional'),
    aiDescriptionLength: text('ai_description_length').default('medium'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});
export const settingsRelations = relations(settings, ({ many }) => ({
    paymentSettings: many(paymentSettings),
    notificationSettings: many(notificationSettings),
    aiSettings: many(aiSettings),
    shippingSettings: many(shippingSettings),
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
    settings: one(settings, { fields: [paymentSettings.settingsId], references: [settings.id] }),
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
    settings: one(settings, { fields: [notificationSettings.settingsId], references: [settings.id] }),
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
    aiFields: jsonb('ai_fields'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
    settingsIdIdx: index('idx_ai_settings_settings_id').on(table.settingsId),
}));
export const aiSettingsRelations = relations(aiSettings, ({ one }) => ({
    settings: one(settings, { fields: [aiSettings.settingsId], references: [settings.id] }),
}));
// ============= SHIPPING SETTINGS TABLE =============
export const shippingSettings = pgTable('shipping_settings', {
    id: uuid('id').defaultRandom().primaryKey(),
    settingsId: uuid('settings_id').notNull().references(() => settings.id, { onDelete: 'cascade' }),
    shippingFlatRate: numeric('shipping_flat_rate', { precision: 10, scale: 2 }).default('50'),
    freeShippingThreshold: numeric('free_shipping_threshold', { precision: 10, scale: 2 }).default('2000'),
    customCityRatesEnabled: boolean('custom_city_rates_enabled').default(false),
    cityShippingRates: jsonb('city_shipping_rates').default([]),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
    settingsIdIdx: index('idx_shipping_settings_settings_id').on(table.settingsId),
}));
export const shippingSettingsRelations = relations(shippingSettings, ({ one }) => ({
    settings: one(settings, { fields: [shippingSettings.settingsId], references: [settings.id] }),
}));
// ============= COUPONS TABLE =============
export const coupons = pgTable('coupons', {
    id: uuid('id').defaultRandom().primaryKey(),
    code: text('code').notNull().unique(),
    discount: numeric('discount', { precision: 10, scale: 2 }), // legacy field name
    type: text('type').notNull(), // percentage | fixed
    value: numeric('value', { precision: 10, scale: 2 }),
    minOrderAmount: numeric('min_order_amount', { precision: 10, scale: 2 }).default('0'),
    minOrder: numeric('min_order', { precision: 10, scale: 2 }), // legacy field name
    maxDiscount: numeric('max_discount', { precision: 10, scale: 2 }),
    startDate: timestamp('start_date').defaultNow(),
    endDate: timestamp('end_date'),
    expiryDate: timestamp('expiry_date'), // legacy field name
    usageLimit: integer('usage_limit'),
    usageCount: integer('usage_count').default(0),
    isActive: boolean('is_active').default(true),
    status: text('status').default('active'),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});
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
// ============= METADATA TABLE =============
export const metadata = pgTable('metadata', {
    id: uuid('id').defaultRandom().primaryKey(),
    key: text('key').notNull().unique(),
    value: jsonb('value').notNull(),
    createdAt: timestamp('created_at').defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow(),
});
//# sourceMappingURL=schema.js.map