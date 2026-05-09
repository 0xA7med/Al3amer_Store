import { z } from 'zod';

// ── Common ──
export const objectIdParam = z.object({ id: z.string().min(1) });
export const paginationQuery = z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10'),
});

// ── Auth ──
export const registerSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
    phone: z.string().min(1, 'Phone is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    address: z.string().optional(),
});

export const loginSchema = z.object({
    email: z.string().email('Invalid email'),
    password: z.string().min(1, 'Password is required'),
});

export const socialLoginSchema = z.object({
    uid: z.string().min(1, 'UID is required'),
    providerId: z.string().optional(),
    name: z.string().optional(),
    email: z.string().optional(),
    phone: z.string().optional(),
});

// ── Products ──
export const createProductSchema = z.object({
    name: z.string().min(1, 'Product name is required'),
    description: z.string().optional().default(''),
    price: z.string().or(z.number()).optional(),
    discountPrice: z.string().optional().nullable(),
    cost: z.string().optional().nullable(),
    sku: z.string().optional().nullable(),
    external_id: z.string().optional().nullable(),
    stock: z.number().int().optional().default(0),
    barcode: z.string().optional().nullable(),
    categoryId: z.string().optional().nullable(),
    brandId: z.string().optional().nullable(),
    status: z.string().optional(),
    videos: z.array(z.any()).optional(),
    metaTitle: z.string().optional().nullable(),
    metaDescription: z.string().optional().nullable(),
    isFeatured: z.boolean().optional(),
    specifications: z.any().optional(),
    dynamicAttributes: z.record(z.union([z.string(), z.array(z.string())])).optional(),
    tags: z.array(z.string()).optional(),
    images: z.array(z.string()).optional(),
    slug: z.string().optional().nullable(),
    brand: z.string().optional().nullable(),
});

export const updateProductSchema = createProductSchema.partial();

export const bulkUpdateSchema = z.object({
    updates: z.array(z.object({
        id: z.string().min(1),
        price: z.string().optional(),
        stock: z.number().optional(),
    })).min(1, 'Updates must be a non-empty array'),
});

export const bulkActionSchema = z.object({
    ids: z.array(z.string()).min(1, 'No product IDs provided'),
    action: z.string().min(1, 'Action is required'),
    payload: z.object({
        priceMode: z.string().optional(),
        priceValue: z.number().optional(),
        stockMode: z.string().optional(),
        stockValue: z.number().optional(),
        categoryId: z.string().optional(),
        groupName: z.string().optional(),
        variants: z.any().optional(),
        accountingMultiplier: z.number().optional(),
        salesTiers: z.any().optional(),
    }),
});

export const validateCartSchema = z.object({
    items: z.array(z.object({
        id: z.string(),
        quantity: z.number().min(1).optional().default(1),
    })).min(1, 'items must be a non-empty array'),
});

export const aiGenerateSchema = z.object({
    name: z.string().min(1, 'Product name is required'),
    section: z.string().optional().default('all'),
    category: z.string().optional(),
    brand: z.string().optional(),
});

export const listProductsQuery = z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10'),
    categories: z.string().optional(),
    search: z.string().optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    status: z.string().optional().default('active'),
    featured: z.string().optional(),
    hasDiscount: z.string().optional(),
    sort: z.string().optional(),
    exclude: z.string().optional(),
    dynamicFilters: z.string().optional(),
});

export const getProductParams = z.object({
    id: z.string().min(1),
});

export const updateShortNameSchema = z.object({
    shortNameAwb: z.string().optional(),
});

// ── Orders ──
export const orderItemSchema = z.object({
    id: z.string().min(1),
    name: z.string().optional().default(''),
    price: z.number().optional().default(0),
    quantity: z.number().optional().default(1),
    image: z.string().optional(),
    sku: z.string().optional(),
    selectedTierId: z.string().optional(),
    multiplier: z.number().optional(),
});

export const createOrderSchema = z.object({
    userId: z.string().optional().nullable(),
    fullName: z.string().min(1, 'Full name is required'),
    phone: z.string().optional().default(''),
    phone2: z.string().optional(),
    email: z.string().optional(),
    governorate: z.string().min(1, 'Governorate is required'),
    city: z.string().min(1, 'City is required'),
    address: z.string().min(1, 'Address is required'),
    notes: z.string().optional(),
    paymentMethod: z.string().optional(),
    items: z.array(orderItemSchema).min(1, 'At least one product is required'),
    shippingCost: z.number().optional().default(0),
    taxAmount: z.number().optional().default(0),
    extraFee: z.number().optional().default(0),
    codAdvancePayment: z.number().optional().default(0),
    codReturnShipping: z.number().optional().default(0),
    totalAtDelivery: z.number().optional().default(0),
    couponCode: z.string().optional(),
    walletNumber: z.string().optional(),
    paymobOrderId: z.string().optional(),
    traderId: z.string().optional(),
    finalCodAmount: z.number().optional(),
});

export const updatePendingOrderSchema = z.object({
    fullName: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    governorate: z.string().optional(),
    city: z.string().optional(),
    address: z.string().optional(),
    notes: z.string().optional(),
    paymentMethod: z.string().optional(),
    items: z.array(orderItemSchema).optional(),
    shippingCost: z.number().optional(),
    taxAmount: z.number().optional(),
    extraFee: z.number().optional(),
    couponCode: z.string().optional(),
    traderId: z.string().optional(),
    finalCodAmount: z.number().optional(),
});

export const updateOrderStatusSchema = z.object({
    status: z.string().min(1, 'Status is required'),
});

export const bulkDeleteOrdersSchema = z.object({
    orderIds: z.array(z.string()).min(1, 'orderIds array is required'),
});

export const bulkUpdateOrdersStatusSchema = z.object({
    orderIds: z.array(z.string()).min(1, 'orderIds array is required'),
    status: z.string().min(1, 'Status is required'),
});

export const listOrdersQuery = z.object({
    userId: z.string().optional(),
    status: z.string().optional(),
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('10'),
});

export const retryPaymentSchema = z.object({
    walletNumber: z.string().optional(),
});

// ── Checkout ──
export const initiatePaymentSchema = z.object({
    orderId: z.string().min(1, 'Order ID is required'),
    amount: z.number().min(0, 'Amount is required'),
    paymentMethod: z.string().min(1, 'Payment method is required'),
    walletNumber: z.string().optional(),
    fullName: z.string().min(1, 'Full name is required'),
    phone: z.string().optional(),
    email: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    governorate: z.string().optional(),
});

export const verifyPaymentSchema = z.object({
    paymobOrderId: z.string().min(1, 'paymobOrderId is required'),
});

// ── Users ──
export const createUserSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email'),
    phone: z.string().optional(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    address: z.string().optional(),
    status: z.string().optional(),
});

export const updateProfileSchema = z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    phone2: z.string().optional(),
}).refine(data => data.name || data.phone || data.phone2, {
    message: 'No fields to update',
});

export const updateUserStatusSchema = z.object({
    status: z.enum(['active', 'inactive', 'blocked'], { errorMap: () => ({ message: 'Invalid status' }) }),
});

export const updateCustomerSchema = z.object({
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    phone2: z.string().optional(),
    address: z.string().optional(),
    governorate: z.string().optional(),
    city: z.string().optional(),
});

export const listUsersQuery = z.object({
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('50'),
    search: z.string().optional(),
});

// ── Addresses ──
export const createAddressSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    fullName: z.string().min(1, 'Full name is required'),
    phone: z.string().min(1, 'Phone is required'),
    phone2: z.string().optional(),
    governorate: z.string().min(1, 'Governorate is required'),
    city: z.string().min(1, 'City is required'),
    address: z.string().min(1, 'Address is required'),
    isDefault: z.boolean().optional(),
});

export const updateAddressSchema = createAddressSchema.partial();

// ── Categories ──
export const createCategorySchema = z.object({
    name: z.string().min(1, 'Category name is required'),
    parentId: z.string().optional().nullable(),
    image: z.string().optional().nullable(),
    icon: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    slug: z.string().optional().nullable(),
    attributesSchema: z.any().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// ── Coupons ──
export const createCouponSchema = z.object({
    code: z.string().min(1, 'Code is required'),
    discount: z.number().min(0, 'Discount is required'),
    type: z.string().min(1, 'Type is required'),
    usageLimit: z.number().int().min(1, 'Usage limit is required'),
    minOrder: z.number().optional().default(0),
    startDate: z.string().optional(),
    expiryDate: z.string().min(1, 'Expiry date is required'),
});

export const updateCouponSchema = createCouponSchema.partial();

export const validateCouponSchema = z.object({
    code: z.string().min(1, 'Coupon code is required'),
    orderTotal: z.number().optional(),
});

// ── Reviews ──
export const createReviewSchema = z.object({
    productId: z.string().min(1, 'Product ID is required'),
    userId: z.string().optional().nullable(),
    customerName: z.string().optional(),
    rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
    text: z.string().optional().default(''),
});

export const approveReviewSchema = z.object({
    status: z.enum(['approved', 'rejected', 'pending'], { errorMap: () => ({ message: 'Valid status is required' }) }),
});

export const listReviewsQuery = z.object({
    status: z.string().optional(),
    productId: z.string().optional(),
});

// ── Wishlist ──
export const addWishlistSchema = z.object({
    productId: z.string().min(1, 'Product ID is required'),
});

// ── Settings ──
export const testGeminiSchema = z.object({
    apiKey: z.string().min(1, 'API key is required'),
});

export const testNotificationSchema = z.object({
    type: z.string().min(1, 'Type is required'),
    config: z.any().refine(v => v != null, 'Config is required'),
});

// ── AI Bundle ──
export const generateBundleSchema = z.object({
    businessType: z.string().min(1, 'Business type is required'),
    budget: z.string().or(z.number()).refine(v => v != null && v !== '', 'Budget is required'),
    selectedFeatures: z.array(z.string()).min(1, 'At least one feature is required'),
    osPreference: z.string().optional(),
});

export const logBundleSchema = z.object({
    userId: z.string().optional().nullable(),
    businessType: z.string().optional(),
    budget: z.string().optional(),
    selectedFeatures: z.array(z.string()).optional(),
    resultBundle: z.any().optional(),
    matchScore: z.number().optional(),
});

// ── Admin ──
export const getReportsQuery = z.object({
    range: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
});

// ── Metadata ──
export const deleteSpecValueSchema = z.object({
    key: z.string().min(1, 'Key is required'),
    value: z.string().min(1, 'Value is required'),
});

// ── Inventory Sync ──
export const executeSyncSchema = z.object({
    items: z.array(z.any()).min(1, 'No items to process'),
});
