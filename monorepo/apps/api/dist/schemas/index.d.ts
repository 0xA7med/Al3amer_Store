import { z } from 'zod';
export declare const objectIdParam: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const paginationQuery: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    limit: string;
    page: string;
}, {
    limit?: string | undefined;
    page?: string | undefined;
}>;
export declare const registerSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodString;
    password: z.ZodString;
    address: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    phone: string;
    password: string;
    address?: string | undefined;
}, {
    name: string;
    email: string;
    phone: string;
    password: string;
    address?: string | undefined;
}>;
export declare const loginSchema: z.ZodObject<{
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    email: string;
    password: string;
}, {
    email: string;
    password: string;
}>;
export declare const socialLoginSchema: z.ZodObject<{
    uid: z.ZodString;
    providerId: z.ZodOptional<z.ZodString>;
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    uid: string;
    name?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    providerId?: string | undefined;
}, {
    uid: string;
    name?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    providerId?: string | undefined;
}>;
export declare const createProductSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    price: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>;
    discountPrice: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    cost: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    sku: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    external_id: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    stock: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    barcode: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    categoryId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    brandId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    status: z.ZodOptional<z.ZodString>;
    videos: z.ZodOptional<z.ZodArray<z.ZodAny, "many">>;
    metaTitle: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    metaDescription: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    isFeatured: z.ZodOptional<z.ZodBoolean>;
    specifications: z.ZodOptional<z.ZodAny>;
    dynamicAttributes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>>;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    images: z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodString;
        isPrimary: z.ZodOptional<z.ZodBoolean>;
        sortOrder: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        isPrimary?: boolean | undefined;
        sortOrder?: number | undefined;
    }, {
        url: string;
        isPrimary?: boolean | undefined;
        sortOrder?: number | undefined;
    }>]>, "many">>;
    slug: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    brand: z.ZodNullable<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    name: string;
    description: string;
    stock: number;
    brand?: string | null | undefined;
    status?: string | undefined;
    external_id?: string | null | undefined;
    price?: string | number | undefined;
    discountPrice?: string | null | undefined;
    cost?: string | null | undefined;
    sku?: string | null | undefined;
    barcode?: string | null | undefined;
    slug?: string | null | undefined;
    isFeatured?: boolean | undefined;
    categoryId?: string | null | undefined;
    brandId?: string | null | undefined;
    videos?: any[] | undefined;
    metaTitle?: string | null | undefined;
    metaDescription?: string | null | undefined;
    specifications?: any;
    dynamicAttributes?: Record<string, string | string[]> | undefined;
    tags?: string[] | undefined;
    images?: (string | {
        url: string;
        isPrimary?: boolean | undefined;
        sortOrder?: number | undefined;
    })[] | undefined;
}, {
    name: string;
    brand?: string | null | undefined;
    status?: string | undefined;
    description?: string | undefined;
    external_id?: string | null | undefined;
    price?: string | number | undefined;
    discountPrice?: string | null | undefined;
    cost?: string | null | undefined;
    sku?: string | null | undefined;
    stock?: number | undefined;
    barcode?: string | null | undefined;
    slug?: string | null | undefined;
    isFeatured?: boolean | undefined;
    categoryId?: string | null | undefined;
    brandId?: string | null | undefined;
    videos?: any[] | undefined;
    metaTitle?: string | null | undefined;
    metaDescription?: string | null | undefined;
    specifications?: any;
    dynamicAttributes?: Record<string, string | string[]> | undefined;
    tags?: string[] | undefined;
    images?: (string | {
        url: string;
        isPrimary?: boolean | undefined;
        sortOrder?: number | undefined;
    })[] | undefined;
}>;
export declare const updateProductSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodString>>>;
    price: z.ZodOptional<z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodNumber]>>>;
    discountPrice: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    cost: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    sku: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    external_id: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    stock: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodNumber>>>;
    barcode: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    categoryId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    brandId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    status: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    videos: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodAny, "many">>>;
    metaTitle: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    metaDescription: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    isFeatured: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    specifications: z.ZodOptional<z.ZodOptional<z.ZodAny>>;
    dynamicAttributes: z.ZodOptional<z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnion<[z.ZodString, z.ZodArray<z.ZodString, "many">]>>>>;
    tags: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodString, "many">>>;
    images: z.ZodOptional<z.ZodOptional<z.ZodArray<z.ZodUnion<[z.ZodString, z.ZodObject<{
        url: z.ZodString;
        isPrimary: z.ZodOptional<z.ZodBoolean>;
        sortOrder: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        url: string;
        isPrimary?: boolean | undefined;
        sortOrder?: number | undefined;
    }, {
        url: string;
        isPrimary?: boolean | undefined;
        sortOrder?: number | undefined;
    }>]>, "many">>>;
    slug: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    brand: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
}, "strip", z.ZodTypeAny, {
    brand?: string | null | undefined;
    name?: string | undefined;
    status?: string | undefined;
    description?: string | undefined;
    external_id?: string | null | undefined;
    price?: string | number | undefined;
    discountPrice?: string | null | undefined;
    cost?: string | null | undefined;
    sku?: string | null | undefined;
    stock?: number | undefined;
    barcode?: string | null | undefined;
    slug?: string | null | undefined;
    isFeatured?: boolean | undefined;
    categoryId?: string | null | undefined;
    brandId?: string | null | undefined;
    videos?: any[] | undefined;
    metaTitle?: string | null | undefined;
    metaDescription?: string | null | undefined;
    specifications?: any;
    dynamicAttributes?: Record<string, string | string[]> | undefined;
    tags?: string[] | undefined;
    images?: (string | {
        url: string;
        isPrimary?: boolean | undefined;
        sortOrder?: number | undefined;
    })[] | undefined;
}, {
    brand?: string | null | undefined;
    name?: string | undefined;
    status?: string | undefined;
    description?: string | undefined;
    external_id?: string | null | undefined;
    price?: string | number | undefined;
    discountPrice?: string | null | undefined;
    cost?: string | null | undefined;
    sku?: string | null | undefined;
    stock?: number | undefined;
    barcode?: string | null | undefined;
    slug?: string | null | undefined;
    isFeatured?: boolean | undefined;
    categoryId?: string | null | undefined;
    brandId?: string | null | undefined;
    videos?: any[] | undefined;
    metaTitle?: string | null | undefined;
    metaDescription?: string | null | undefined;
    specifications?: any;
    dynamicAttributes?: Record<string, string | string[]> | undefined;
    tags?: string[] | undefined;
    images?: (string | {
        url: string;
        isPrimary?: boolean | undefined;
        sortOrder?: number | undefined;
    })[] | undefined;
}>;
export declare const bulkUpdateSchema: z.ZodObject<{
    updates: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        price: z.ZodOptional<z.ZodString>;
        stock: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        price?: string | undefined;
        stock?: number | undefined;
    }, {
        id: string;
        price?: string | undefined;
        stock?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    updates: {
        id: string;
        price?: string | undefined;
        stock?: number | undefined;
    }[];
}, {
    updates: {
        id: string;
        price?: string | undefined;
        stock?: number | undefined;
    }[];
}>;
export declare const bulkActionSchema: z.ZodObject<{
    ids: z.ZodArray<z.ZodString, "many">;
    action: z.ZodString;
    payload: z.ZodOptional<z.ZodObject<{
        priceMode: z.ZodOptional<z.ZodString>;
        priceValue: z.ZodOptional<z.ZodNumber>;
        stockMode: z.ZodOptional<z.ZodString>;
        stockValue: z.ZodOptional<z.ZodNumber>;
        categoryId: z.ZodOptional<z.ZodString>;
        groupName: z.ZodOptional<z.ZodString>;
        variants: z.ZodOptional<z.ZodAny>;
        accountingMultiplier: z.ZodOptional<z.ZodNumber>;
        salesTiers: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        categoryId?: string | undefined;
        accountingMultiplier?: number | undefined;
        salesTiers?: any;
        priceMode?: string | undefined;
        priceValue?: number | undefined;
        stockMode?: string | undefined;
        stockValue?: number | undefined;
        groupName?: string | undefined;
        variants?: any;
    }, {
        categoryId?: string | undefined;
        accountingMultiplier?: number | undefined;
        salesTiers?: any;
        priceMode?: string | undefined;
        priceValue?: number | undefined;
        stockMode?: string | undefined;
        stockValue?: number | undefined;
        groupName?: string | undefined;
        variants?: any;
    }>>;
}, "strip", z.ZodTypeAny, {
    ids: string[];
    action: string;
    payload?: {
        categoryId?: string | undefined;
        accountingMultiplier?: number | undefined;
        salesTiers?: any;
        priceMode?: string | undefined;
        priceValue?: number | undefined;
        stockMode?: string | undefined;
        stockValue?: number | undefined;
        groupName?: string | undefined;
        variants?: any;
    } | undefined;
}, {
    ids: string[];
    action: string;
    payload?: {
        categoryId?: string | undefined;
        accountingMultiplier?: number | undefined;
        salesTiers?: any;
        priceMode?: string | undefined;
        priceValue?: number | undefined;
        stockMode?: string | undefined;
        stockValue?: number | undefined;
        groupName?: string | undefined;
        variants?: any;
    } | undefined;
}>;
export declare const validateCartSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        quantity: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        quantity: number;
    }, {
        id: string;
        quantity?: number | undefined;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    items: {
        id: string;
        quantity: number;
    }[];
}, {
    items: {
        id: string;
        quantity?: number | undefined;
    }[];
}>;
export declare const aiGenerateSchema: z.ZodObject<{
    name: z.ZodString;
    section: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    category: z.ZodOptional<z.ZodString>;
    brand: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    section: string;
    brand?: string | undefined;
    category?: string | undefined;
}, {
    name: string;
    brand?: string | undefined;
    category?: string | undefined;
    section?: string | undefined;
}>;
export declare const listProductsQuery: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    categories: z.ZodOptional<z.ZodString>;
    search: z.ZodOptional<z.ZodString>;
    minPrice: z.ZodOptional<z.ZodString>;
    maxPrice: z.ZodOptional<z.ZodString>;
    status: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    featured: z.ZodOptional<z.ZodString>;
    hasDiscount: z.ZodOptional<z.ZodString>;
    sort: z.ZodOptional<z.ZodString>;
    exclude: z.ZodOptional<z.ZodString>;
    dynamicFilters: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: string;
    limit: string;
    page: string;
    search?: string | undefined;
    categories?: string | undefined;
    sort?: string | undefined;
    minPrice?: string | undefined;
    featured?: string | undefined;
    hasDiscount?: string | undefined;
    exclude?: string | undefined;
    dynamicFilters?: string | undefined;
    maxPrice?: string | undefined;
}, {
    search?: string | undefined;
    status?: string | undefined;
    categories?: string | undefined;
    sort?: string | undefined;
    limit?: string | undefined;
    page?: string | undefined;
    minPrice?: string | undefined;
    featured?: string | undefined;
    hasDiscount?: string | undefined;
    exclude?: string | undefined;
    dynamicFilters?: string | undefined;
    maxPrice?: string | undefined;
}>;
export declare const getProductParams: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
}, {
    id: string;
}>;
export declare const updateShortNameSchema: z.ZodObject<{
    shortNameAwb: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    shortNameAwb?: string | undefined;
}, {
    shortNameAwb?: string | undefined;
}>;
export declare const orderItemSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    productId: z.ZodString;
    name: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    price: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    quantity: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    image: z.ZodOptional<z.ZodString>;
    sku: z.ZodOptional<z.ZodString>;
    selectedTierId: z.ZodOptional<z.ZodString>;
    multiplier: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    name: string;
    price: number;
    productId: string;
    quantity: number;
    id?: string | undefined;
    sku?: string | undefined;
    image?: string | undefined;
    multiplier?: number | undefined;
    selectedTierId?: string | undefined;
}, {
    productId: string;
    id?: string | undefined;
    name?: string | undefined;
    price?: number | undefined;
    sku?: string | undefined;
    image?: string | undefined;
    multiplier?: number | undefined;
    quantity?: number | undefined;
    selectedTierId?: string | undefined;
}>;
export declare const createOrderSchema: z.ZodObject<{
    userId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    fullName: z.ZodString;
    phone: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    phone2: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    governorate: z.ZodString;
    address: z.ZodString;
    notes: z.ZodOptional<z.ZodString>;
    paymentMethod: z.ZodOptional<z.ZodString>;
    items: z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        productId: z.ZodString;
        name: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        price: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        quantity: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        image: z.ZodOptional<z.ZodString>;
        sku: z.ZodOptional<z.ZodString>;
        selectedTierId: z.ZodOptional<z.ZodString>;
        multiplier: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        price: number;
        productId: string;
        quantity: number;
        id?: string | undefined;
        sku?: string | undefined;
        image?: string | undefined;
        multiplier?: number | undefined;
        selectedTierId?: string | undefined;
    }, {
        productId: string;
        id?: string | undefined;
        name?: string | undefined;
        price?: number | undefined;
        sku?: string | undefined;
        image?: string | undefined;
        multiplier?: number | undefined;
        quantity?: number | undefined;
        selectedTierId?: string | undefined;
    }>, "many">;
    shippingCost: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    taxAmount: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    extraFee: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    codAdvancePayment: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    codReturnShipping: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    totalAtDelivery: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    couponCode: z.ZodOptional<z.ZodString>;
    walletNumber: z.ZodOptional<z.ZodString>;
    paymobOrderId: z.ZodOptional<z.ZodString>;
    traderId: z.ZodOptional<z.ZodString>;
    finalCodAmount: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    phone: string;
    address: string;
    governorate: string;
    fullName: string;
    shippingCost: number;
    codAdvancePayment: number;
    codReturnShipping: number;
    totalAtDelivery: number;
    taxAmount: number;
    extraFee: number;
    items: {
        name: string;
        price: number;
        productId: string;
        quantity: number;
        id?: string | undefined;
        sku?: string | undefined;
        image?: string | undefined;
        multiplier?: number | undefined;
        selectedTierId?: string | undefined;
    }[];
    email?: string | undefined;
    phone2?: string | undefined;
    userId?: string | null | undefined;
    notes?: string | undefined;
    paymentMethod?: string | undefined;
    paymobOrderId?: string | undefined;
    traderId?: string | undefined;
    finalCodAmount?: number | undefined;
    couponCode?: string | undefined;
    walletNumber?: string | undefined;
}, {
    address: string;
    governorate: string;
    fullName: string;
    items: {
        productId: string;
        id?: string | undefined;
        name?: string | undefined;
        price?: number | undefined;
        sku?: string | undefined;
        image?: string | undefined;
        multiplier?: number | undefined;
        quantity?: number | undefined;
        selectedTierId?: string | undefined;
    }[];
    email?: string | undefined;
    phone?: string | undefined;
    phone2?: string | undefined;
    userId?: string | null | undefined;
    notes?: string | undefined;
    paymentMethod?: string | undefined;
    paymobOrderId?: string | undefined;
    shippingCost?: number | undefined;
    codAdvancePayment?: number | undefined;
    codReturnShipping?: number | undefined;
    totalAtDelivery?: number | undefined;
    taxAmount?: number | undefined;
    extraFee?: number | undefined;
    traderId?: string | undefined;
    finalCodAmount?: number | undefined;
    couponCode?: string | undefined;
    walletNumber?: string | undefined;
}>;
export declare const updatePendingOrderSchema: z.ZodObject<{
    fullName: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    governorate: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    paymentMethod: z.ZodOptional<z.ZodString>;
    items: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        productId: z.ZodString;
        name: z.ZodDefault<z.ZodOptional<z.ZodString>>;
        price: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        quantity: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
        image: z.ZodOptional<z.ZodString>;
        sku: z.ZodOptional<z.ZodString>;
        selectedTierId: z.ZodOptional<z.ZodString>;
        multiplier: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        name: string;
        price: number;
        productId: string;
        quantity: number;
        id?: string | undefined;
        sku?: string | undefined;
        image?: string | undefined;
        multiplier?: number | undefined;
        selectedTierId?: string | undefined;
    }, {
        productId: string;
        id?: string | undefined;
        name?: string | undefined;
        price?: number | undefined;
        sku?: string | undefined;
        image?: string | undefined;
        multiplier?: number | undefined;
        quantity?: number | undefined;
        selectedTierId?: string | undefined;
    }>, "many">>;
    shippingCost: z.ZodOptional<z.ZodNumber>;
    taxAmount: z.ZodOptional<z.ZodNumber>;
    extraFee: z.ZodOptional<z.ZodNumber>;
    couponCode: z.ZodOptional<z.ZodString>;
    traderId: z.ZodOptional<z.ZodString>;
    finalCodAmount: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    email?: string | undefined;
    phone?: string | undefined;
    address?: string | undefined;
    governorate?: string | undefined;
    fullName?: string | undefined;
    notes?: string | undefined;
    paymentMethod?: string | undefined;
    shippingCost?: number | undefined;
    taxAmount?: number | undefined;
    extraFee?: number | undefined;
    traderId?: string | undefined;
    finalCodAmount?: number | undefined;
    items?: {
        name: string;
        price: number;
        productId: string;
        quantity: number;
        id?: string | undefined;
        sku?: string | undefined;
        image?: string | undefined;
        multiplier?: number | undefined;
        selectedTierId?: string | undefined;
    }[] | undefined;
    couponCode?: string | undefined;
}, {
    email?: string | undefined;
    phone?: string | undefined;
    address?: string | undefined;
    governorate?: string | undefined;
    fullName?: string | undefined;
    notes?: string | undefined;
    paymentMethod?: string | undefined;
    shippingCost?: number | undefined;
    taxAmount?: number | undefined;
    extraFee?: number | undefined;
    traderId?: string | undefined;
    finalCodAmount?: number | undefined;
    items?: {
        productId: string;
        id?: string | undefined;
        name?: string | undefined;
        price?: number | undefined;
        sku?: string | undefined;
        image?: string | undefined;
        multiplier?: number | undefined;
        quantity?: number | undefined;
        selectedTierId?: string | undefined;
    }[] | undefined;
    couponCode?: string | undefined;
}>;
export declare const updateOrderStatusSchema: z.ZodObject<{
    status: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: string;
}, {
    status: string;
}>;
export declare const bulkDeleteOrdersSchema: z.ZodObject<{
    orderIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    orderIds: string[];
}, {
    orderIds: string[];
}>;
export declare const bulkUpdateOrdersStatusSchema: z.ZodObject<{
    orderIds: z.ZodArray<z.ZodString, "many">;
    status: z.ZodString;
}, "strip", z.ZodTypeAny, {
    status: string;
    orderIds: string[];
}, {
    status: string;
    orderIds: string[];
}>;
export declare const listOrdersQuery: z.ZodObject<{
    userId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodString>;
    page: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    limit: string;
    page: string;
    status?: string | undefined;
    userId?: string | undefined;
}, {
    status?: string | undefined;
    userId?: string | undefined;
    limit?: string | undefined;
    page?: string | undefined;
}>;
export declare const retryPaymentSchema: z.ZodObject<{
    walletNumber: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    walletNumber?: string | undefined;
}, {
    walletNumber?: string | undefined;
}>;
export declare const initiatePaymentSchema: z.ZodObject<{
    orderId: z.ZodString;
    amount: z.ZodNumber;
    paymentMethod: z.ZodString;
    walletNumber: z.ZodOptional<z.ZodString>;
    fullName: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    governorate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    fullName: string;
    paymentMethod: string;
    orderId: string;
    amount: number;
    email?: string | undefined;
    phone?: string | undefined;
    address?: string | undefined;
    governorate?: string | undefined;
    walletNumber?: string | undefined;
}, {
    fullName: string;
    paymentMethod: string;
    orderId: string;
    amount: number;
    email?: string | undefined;
    phone?: string | undefined;
    address?: string | undefined;
    governorate?: string | undefined;
    walletNumber?: string | undefined;
}>;
export declare const verifyPaymentSchema: z.ZodObject<{
    paymobOrderId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    paymobOrderId: string;
}, {
    paymobOrderId: string;
}>;
export declare const createUserSchema: z.ZodObject<{
    name: z.ZodString;
    email: z.ZodString;
    phone: z.ZodOptional<z.ZodString>;
    password: z.ZodString;
    address: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name: string;
    email: string;
    password: string;
    phone?: string | undefined;
    address?: string | undefined;
    status?: string | undefined;
}, {
    name: string;
    email: string;
    password: string;
    phone?: string | undefined;
    address?: string | undefined;
    status?: string | undefined;
}>;
export declare const updateProfileSchema: z.ZodEffects<z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    phone2: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    phone?: string | undefined;
    phone2?: string | undefined;
}, {
    name?: string | undefined;
    phone?: string | undefined;
    phone2?: string | undefined;
}>, {
    name?: string | undefined;
    phone?: string | undefined;
    phone2?: string | undefined;
}, {
    name?: string | undefined;
    phone?: string | undefined;
    phone2?: string | undefined;
}>;
export declare const updateUserStatusSchema: z.ZodObject<{
    status: z.ZodEnum<["active", "inactive", "blocked"]>;
}, "strip", z.ZodTypeAny, {
    status: "active" | "inactive" | "blocked";
}, {
    status: "active" | "inactive" | "blocked";
}>;
export declare const updateCustomerSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    email: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    phone2: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    governorate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    phone2?: string | undefined;
    address?: string | undefined;
    governorate?: string | undefined;
}, {
    name?: string | undefined;
    email?: string | undefined;
    phone?: string | undefined;
    phone2?: string | undefined;
    address?: string | undefined;
    governorate?: string | undefined;
}>;
export declare const listUsersQuery: z.ZodObject<{
    page: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    search: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit: string;
    page: string;
    search?: string | undefined;
}, {
    search?: string | undefined;
    limit?: string | undefined;
    page?: string | undefined;
}>;
export declare const createAddressSchema: z.ZodObject<{
    title: z.ZodString;
    fullName: z.ZodString;
    phone: z.ZodString;
    phone2: z.ZodOptional<z.ZodString>;
    governorate: z.ZodString;
    address: z.ZodString;
    isDefault: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    phone: string;
    address: string;
    governorate: string;
    fullName: string;
    title: string;
    phone2?: string | undefined;
    isDefault?: boolean | undefined;
}, {
    phone: string;
    address: string;
    governorate: string;
    fullName: string;
    title: string;
    phone2?: string | undefined;
    isDefault?: boolean | undefined;
}>;
export declare const updateAddressSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    fullName: z.ZodOptional<z.ZodString>;
    phone: z.ZodOptional<z.ZodString>;
    phone2: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    governorate: z.ZodOptional<z.ZodString>;
    address: z.ZodOptional<z.ZodString>;
    isDefault: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
}, "strip", z.ZodTypeAny, {
    phone?: string | undefined;
    phone2?: string | undefined;
    address?: string | undefined;
    governorate?: string | undefined;
    fullName?: string | undefined;
    title?: string | undefined;
    isDefault?: boolean | undefined;
}, {
    phone?: string | undefined;
    phone2?: string | undefined;
    address?: string | undefined;
    governorate?: string | undefined;
    fullName?: string | undefined;
    title?: string | undefined;
    isDefault?: boolean | undefined;
}>;
export declare const createCategorySchema: z.ZodObject<{
    name: z.ZodString;
    parentId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    image: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    icon: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    isFeatured: z.ZodOptional<z.ZodBoolean>;
    slug: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    attributesSchema: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    name: string;
    slug?: string | null | undefined;
    parentId?: string | null | undefined;
    image?: string | null | undefined;
    icon?: string | null | undefined;
    isActive?: boolean | undefined;
    isFeatured?: boolean | undefined;
    attributesSchema?: any;
}, {
    name: string;
    slug?: string | null | undefined;
    parentId?: string | null | undefined;
    image?: string | null | undefined;
    icon?: string | null | undefined;
    isActive?: boolean | undefined;
    isFeatured?: boolean | undefined;
    attributesSchema?: any;
}>;
export declare const updateCategorySchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    parentId: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    image: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    icon: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    isActive: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    isFeatured: z.ZodOptional<z.ZodOptional<z.ZodBoolean>>;
    slug: z.ZodOptional<z.ZodNullable<z.ZodOptional<z.ZodString>>>;
    attributesSchema: z.ZodOptional<z.ZodOptional<z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    slug?: string | null | undefined;
    parentId?: string | null | undefined;
    image?: string | null | undefined;
    icon?: string | null | undefined;
    isActive?: boolean | undefined;
    isFeatured?: boolean | undefined;
    attributesSchema?: any;
}, {
    name?: string | undefined;
    slug?: string | null | undefined;
    parentId?: string | null | undefined;
    image?: string | null | undefined;
    icon?: string | null | undefined;
    isActive?: boolean | undefined;
    isFeatured?: boolean | undefined;
    attributesSchema?: any;
}>;
export declare const createCouponSchema: z.ZodObject<{
    code: z.ZodString;
    discount: z.ZodNumber;
    type: z.ZodString;
    usageLimit: z.ZodNumber;
    minOrder: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    startDate: z.ZodOptional<z.ZodString>;
    expiryDate: z.ZodString;
}, "strip", z.ZodTypeAny, {
    code: string;
    discount: number;
    type: string;
    usageLimit: number;
    minOrder: number;
    expiryDate: string;
    startDate?: string | undefined;
}, {
    code: string;
    discount: number;
    type: string;
    usageLimit: number;
    expiryDate: string;
    minOrder?: number | undefined;
    startDate?: string | undefined;
}>;
export declare const updateCouponSchema: z.ZodObject<{
    code: z.ZodOptional<z.ZodString>;
    discount: z.ZodOptional<z.ZodNumber>;
    type: z.ZodOptional<z.ZodString>;
    usageLimit: z.ZodOptional<z.ZodNumber>;
    minOrder: z.ZodOptional<z.ZodDefault<z.ZodOptional<z.ZodNumber>>>;
    startDate: z.ZodOptional<z.ZodOptional<z.ZodString>>;
    expiryDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    code?: string | undefined;
    discount?: number | undefined;
    type?: string | undefined;
    usageLimit?: number | undefined;
    minOrder?: number | undefined;
    startDate?: string | undefined;
    expiryDate?: string | undefined;
}, {
    code?: string | undefined;
    discount?: number | undefined;
    type?: string | undefined;
    usageLimit?: number | undefined;
    minOrder?: number | undefined;
    startDate?: string | undefined;
    expiryDate?: string | undefined;
}>;
export declare const validateCouponSchema: z.ZodObject<{
    code: z.ZodString;
    orderTotal: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    code: string;
    orderTotal?: number | undefined;
}, {
    code: string;
    orderTotal?: number | undefined;
}>;
export declare const createReviewSchema: z.ZodObject<{
    productId: z.ZodString;
    userId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    customerName: z.ZodOptional<z.ZodString>;
    rating: z.ZodNumber;
    text: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, "strip", z.ZodTypeAny, {
    productId: string;
    rating: number;
    text: string;
    userId?: string | null | undefined;
    customerName?: string | undefined;
}, {
    productId: string;
    rating: number;
    userId?: string | null | undefined;
    customerName?: string | undefined;
    text?: string | undefined;
}>;
export declare const approveReviewSchema: z.ZodObject<{
    status: z.ZodEnum<["approved", "rejected", "pending"]>;
}, "strip", z.ZodTypeAny, {
    status: "pending" | "approved" | "rejected";
}, {
    status: "pending" | "approved" | "rejected";
}>;
export declare const listReviewsQuery: z.ZodObject<{
    status: z.ZodOptional<z.ZodString>;
    productId: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: string | undefined;
    productId?: string | undefined;
}, {
    status?: string | undefined;
    productId?: string | undefined;
}>;
export declare const addWishlistSchema: z.ZodObject<{
    productId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    productId: string;
}, {
    productId: string;
}>;
export declare const testGeminiSchema: z.ZodObject<{
    apiKey: z.ZodString;
}, "strip", z.ZodTypeAny, {
    apiKey: string;
}, {
    apiKey: string;
}>;
export declare const testNotificationSchema: z.ZodObject<{
    type: z.ZodString;
    config: z.ZodEffects<z.ZodAny, any, any>;
}, "strip", z.ZodTypeAny, {
    type: string;
    config?: any;
}, {
    type: string;
    config?: any;
}>;
export declare const generateBundleSchema: z.ZodObject<{
    businessType: z.ZodString;
    budget: z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodNumber]>, string | number, string | number>;
    selectedFeatures: z.ZodArray<z.ZodString, "many">;
    osPreference: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    businessType: string;
    budget: string | number;
    selectedFeatures: string[];
    osPreference?: string | undefined;
}, {
    businessType: string;
    budget: string | number;
    selectedFeatures: string[];
    osPreference?: string | undefined;
}>;
export declare const logBundleSchema: z.ZodObject<{
    userId: z.ZodNullable<z.ZodOptional<z.ZodString>>;
    businessType: z.ZodOptional<z.ZodString>;
    budget: z.ZodOptional<z.ZodString>;
    selectedFeatures: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    resultBundle: z.ZodOptional<z.ZodAny>;
    matchScore: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    userId?: string | null | undefined;
    businessType?: string | undefined;
    budget?: string | undefined;
    selectedFeatures?: string[] | undefined;
    resultBundle?: any;
    matchScore?: number | undefined;
}, {
    userId?: string | null | undefined;
    businessType?: string | undefined;
    budget?: string | undefined;
    selectedFeatures?: string[] | undefined;
    resultBundle?: any;
    matchScore?: number | undefined;
}>;
export declare const getReportsQuery: z.ZodObject<{
    range: z.ZodOptional<z.ZodString>;
    startDate: z.ZodOptional<z.ZodString>;
    endDate: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    startDate?: string | undefined;
    range?: string | undefined;
    endDate?: string | undefined;
}, {
    startDate?: string | undefined;
    range?: string | undefined;
    endDate?: string | undefined;
}>;
export declare const deleteSpecValueSchema: z.ZodObject<{
    key: z.ZodString;
    value: z.ZodString;
}, "strip", z.ZodTypeAny, {
    key: string;
    value: string;
}, {
    key: string;
    value: string;
}>;
export declare const executeSyncSchema: z.ZodObject<{
    items: z.ZodArray<z.ZodAny, "many">;
}, "strip", z.ZodTypeAny, {
    items: any[];
}, {
    items: any[];
}>;
//# sourceMappingURL=index.d.ts.map