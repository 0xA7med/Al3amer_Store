import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';

// Types
export interface Product {
    id: string;
    name: string;
    sku: string;
    external_id?: string | null; // Pro_ID for inventory sync
    price: string;
    discountPrice: string | null;
    stock: number;
    isActive: boolean;
    status: string;
    slug?: string;
    isFeatured: boolean;
    videoUrl?: string | null;
    videoTitle?: string | null;
    videoDescription?: string | null;
    category: { id: string; name: string } | null;
    brand: { id: string; name: string } | null;
    images: { url: string; isPrimary: boolean }[];
    createdAt?: string;
}

export interface ProductsResponse {
    data: Product[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface Order {
    id: string;
    orderNumber: string;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    total: string;
    subtotal: string;
    shippingCost: string;
    paymentMethod: string;
    fullName: string;
    phone: string;
    email: string;
    governorate: string;
    city: string;
    address: string;
    notes: string;
    createdAt: string;
    paymobOrderId?: string | null;
    user: {
        id: string;
        name: string;
        email: string;
        phone: string;
    } | null;
    items: {
        id: string;
        quantity: number;
        price: string;
        name: string;
        product: {
            id: string;
            name: string;
            sku: string;
            images: { url: string }[];
        } | null;
    }[];
}

export interface OrdersResponse {
    data: Order[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface DashboardStats {
    totalProducts: number;
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
    totalRevenue: number;
    lowStockProducts: number;
    activeProducts: number;
    inactiveProducts: number;
    totalCustomers: number;
    recentOrders: Order[];
}

// Hooks

export function useAdminProducts(params?: { page?: number; limit?: number; search?: string }) {
    return useQuery({
        queryKey: ['admin-products', params],
        queryFn: async () => {
            const { data } = await api.get<ProductsResponse>('/products', { params: { ...params, status: '' } });
            return data;
        },
    });
}

export function useAdminOrders(params: { userId?: string; status?: string; page?: string; limit?: string } = {}) {
    return useQuery({
        queryKey: ['admin-orders', params],
        queryFn: async () => {
            const queryParams = new URLSearchParams(params as any);
            const { data } = await api.get<{ data: Order[]; pagination: any }>(`/orders?${queryParams.toString()}`);
            return data;
        },
    });
}

export function useAdminOrder(id: string) {
    return useQuery({
        queryKey: ['admin-order', id],
        queryFn: async () => {
            const { data } = await api.get<Order>(`/orders/${id}`);
            return data;
        },
        enabled: !!id,
    });
}


export function useAdminStats() {
    return useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const { data } = await api.get<DashboardStats>('/admin/stats');
            return data;
        },
        staleTime: 30000, // Cache for 30 seconds
    });
}

export function useDashboardStats() {
    const { data: stats, isLoading } = useAdminStats();

    // Provide default values while loading
    const defaultStats: DashboardStats = {
        totalProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        totalRevenue: 0,
        lowStockProducts: 0,
        activeProducts: 0,
        inactiveProducts: 0,
        totalCustomers: 0,
        recentOrders: [],
    };

    // For featured products, we still need to fetch products list
    const { data: productsData } = useAdminProducts({ limit: 100 });

    return {
        stats: stats || defaultStats,
        isLoading,
        products: productsData?.data || [],
        orders: stats?.recentOrders || [],
    };
}

// Mutations

export function useDeleteProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (productId: string) => {
            await api.delete(`/products/${productId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
            toast.success('تم حذف المنتج بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء حذف المنتج');
        }
    });
}

export function useUpdateOrderStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
            const { data } = await api.put(`/orders/${orderId}/status`, { status });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
            toast.success('تم تحديث حالة الطلب بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء تحديث حالة الطلب');
        }
    });
}

export function useUpdateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ productId, data }: { productId: string; data: Partial<Product> }) => {
            const response = await api.put(`/products/${productId}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            // toast handled in component for better control or here? Let's add default
        },
    });
}
export function useCreateProduct() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (data: Partial<Product>) => {
            const response = await api.post('/products', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
        },
    });
}

export function useBulkUpdateProducts() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (updates: { id: string; price?: string; discountPrice?: string | null; stock?: number }[]) => {
            const response = await api.patch('/products/bulk', { updates });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
            toast.success('تم تحديث المنتجات بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء تحديث المنتجات');
        }
    });
}

export function useBulkAction() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: {
            ids: string[];
            action: 'show' | 'hide' | 'delete' | 'price' | 'stock' | 'category';
            payload?: {
                priceMode?: 'add_fixed' | 'subtract_fixed' | 'add_percent' | 'subtract_percent' | 'set_fixed';
                priceValue?: number;
                stockMode?: 'add' | 'subtract' | 'set';
                stockValue?: number;
                categoryId?: string;
            };
        }) => {
            const response = await api.post('/products/bulk-action', payload);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
            toast.success(data?.message || 'تم تنفيذ الإجراء بنجاح');
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.error || 'حدث خطأ أثناء تنفيذ الإجراء');
        }
    });
}
