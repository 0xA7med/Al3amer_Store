import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export interface Product {
    id: string;
    name: string;
    description: string;
    price: string;
    discountPrice?: string | null;
    stock: number;
    sku?: string;
    external_id?: string | null; // Pro_ID for inventory sync
    barcode?: string;
    isActive: boolean;
    isFeatured: boolean;
    status: string;
    slug?: string | null;
    videos?: { url: string; title: string; is_featured: boolean }[];
    metaTitle?: string | null;
    metaDescription?: string | null;
    categoryId?: string | null;
    brandId?: string | null;
    cost?: string | null;
    category: {
        id: string;
        name: string;
        slug: string;
        parentId?: string | null;
        parent?: {
            id: string;
            name: string;
            slug: string;
            parentId?: string | null;
            parent?: { id: string; name: string; slug: string } | null;
        } | null;
    } | null;
    brand: { id: string; name: string } | null;
    images: { id: string; url: string; isPrimary: boolean }[];
    specifications?: any;
    dynamicAttributes?: Record<string, string | string[]>;
    tags?: string[];
    salesCount?: number;
    reviewCount?: number;
    averageRating?: number;
    supportPhone?: string;
    createdAt?: string;
    reviews?: {
        id: string;
        rating: number;
        text: string;
        customerName?: string;
        createdAt: string;
        user?: {
            id: string;
            name: string;
        }
    }[];
}

export interface ProductsResponse {
    data: Product[];
    pagination: {
        page: number;
        limit: number;
    };
}

interface UseProductsParams {
    page?: number;
    limit?: number;
    category?: string;
    categories?: string | string[];
    search?: string;
    featured?: boolean;
    dynamicFilters?: string;
}

export function useProducts(params?: UseProductsParams) {
    return useQuery({
        queryKey: ['products', params],
        queryFn: async () => {
            const queryParams = { status: 'active', ...params };
            if (Array.isArray(queryParams.categories)) {
                queryParams.categories = queryParams.categories.join(',');
            }
            const { data } = await api.get<ProductsResponse>('/products', { params: queryParams });
            return data;
        },
    });
}

// Special hook for featured products using server-side filtering
export function useFeaturedProducts(limit = 8) {
    return useQuery({
        queryKey: ['products', 'featured', limit],
        queryFn: async () => {
            const { data } = await api.get<ProductsResponse>(`/products?featured=true&status=active&limit=${limit}`);
            return data.data;
        }
    });
}

export function useBestSellers(limit = 8) {
    return useQuery({
        queryKey: ['products', 'best-selling', limit],
        queryFn: async () => {
            const { data } = await api.get<ProductsResponse>(`/products?sort=bestselling&status=active&limit=${limit}`);
            return data.data;
        }
    });
}

export function useNewArrivals(limit = 8) {
    return useQuery({
        queryKey: ['products', 'newest', limit],
        queryFn: async () => {
            const { data } = await api.get<ProductsResponse>(`/products?sort=newest&status=active&limit=${limit}`);
            return data.data;
        }
    });
}

export function useOffers(limit = 8) {
    return useQuery({
        queryKey: ['products', 'offers', limit],
        queryFn: async () => {
            const { data } = await api.get<ProductsResponse>(`/products?hasDiscount=true&status=active&limit=${limit}`);
            return data.data;
        }
    });
}

export function useProduct(id: string) {
    return useQuery({
        queryKey: ['product', id],
        queryFn: async () => {
            const { data } = await api.get<Product>(`/products/${id}`);
            return data;
        },
        enabled: !!id,
    });
}

export function useCategories() {
    return useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const { data } = await api.get('/categories');
            return data;
        },
    });
}

export function useBrands() {
    return useQuery({
        queryKey: ['brands'],
        queryFn: async () => {
            const { data } = await api.get('/brands');
            return data;
        },
    });
}
