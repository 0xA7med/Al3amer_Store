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
    videoUrl?: string | null;
    videoTitle?: string | null;
    videoDescription?: string | null;
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
}

export function useProducts(params?: UseProductsParams) {
    return useQuery({
        queryKey: ['products', params],
        queryFn: async () => {
            const queryParams = { ...params };
            if (Array.isArray(queryParams.categories)) {
                queryParams.categories = queryParams.categories.join(',');
            }
            const { data } = await api.get<ProductsResponse>('/products', { params: queryParams });
            return data;
        },
    });
}

// Special hook for featured products which might just slice the result or use a specific endpoint if we make one
export function useFeaturedProducts() {
    return useQuery({
        queryKey: ['products', 'featured'],
        queryFn: async () => {
            // For now, allow fetching a list and filtering client side or just taking first few
            const { data } = await api.get<ProductsResponse>('/products?limit=20');
            return data.data.filter(p => p.isFeatured);
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
