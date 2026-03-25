import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';

export interface Customer {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string | null;
    orders: number;
    totalSpent: number;
    status: 'active' | 'inactive' | 'blocked' | 'guest';
    joinDate: string;
    loyaltyPoints: number;
    location?: string;
    type: 'registered' | 'guest';
}

interface CustomersResponse {
    data: Customer[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export function useCustomers(params?: { page?: number; limit?: number }) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['customers', params],
        queryFn: async () => {
            const { data } = await api.get<CustomersResponse>('/users', { params });
            return data;
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string; status: 'active' | 'inactive' | 'blocked' }) => {
            await api.patch(`/users/${id}/status`, { status });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            toast.success('تم تحديث حالة العميل بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء تحديث حالة العميل');
        }
    });

    // Format customers to match expected interface
    const customers: Customer[] = (query.data?.data || []).map(customer => ({
        id: customer.id,
        name: customer.name,
        email: customer.email || '',
        phone: customer.phone,
        address: customer.address,
        orders: customer.orders || 0,
        totalSpent: customer.totalSpent || 0,
        status: customer.status || 'active',
        joinDate: customer.joinDate ? new Date(customer.joinDate).toLocaleDateString('ar-EG') : 'غير معروف',
        loyaltyPoints: customer.loyaltyPoints || 0,
        location: customer.address || 'غير محدد',
        type: (customer as any).type || 'registered',
    }));

    const updateStatus = (id: string | number, newStatus: 'active' | 'inactive' | 'blocked') => {
        updateStatusMutation.mutate({ id: String(id), status: newStatus });
    };

    const createCustomerMutation = useMutation({
        mutationFn: async (data: any) => {
            const response = await api.post('/users', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['customers'] });
            toast.success('تم إنشاء العميل بنجاح');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.error || 'فشل إنشاء العميل');
            throw error;
        }
    });

    const createCustomer = async (data: any) => {
        return createCustomerMutation.mutateAsync(data);
    };

    return {
        customers,
        isLoading: query.isLoading,
        error: query.error?.message || null,
        updateStatus,
        createCustomer,
        pagination: query.data?.pagination,
    };
}

export function useCustomerOrders(phone?: string) {
    return useQuery({
        queryKey: ['customer-orders', phone],
        queryFn: async () => {
            if (!phone) return [];
            const { data } = await api.get(`/orders/user/by-phone/${encodeURIComponent(phone)}`);
            return data;
        },
        enabled: !!phone,
    });
}
