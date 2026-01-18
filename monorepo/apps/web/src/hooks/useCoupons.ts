import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';

export interface Coupon {
    id: string;
    code: string;
    discount: string;
    type: 'percentage' | 'fixed' | 'free_shipping';
    usageCount: number;
    usageLimit: number;
    minOrder: string | null;
    startDate: string | null;
    expiryDate: string;
    status: 'active' | 'expired' | 'scheduled';
    createdAt: string;
}

export interface CreateCouponData {
    code: string;
    discount: number;
    type: 'percentage' | 'fixed' | 'free_shipping';
    usageLimit: number;
    minOrder?: number;
    startDate?: string;
    expiryDate: string;
}

export function useCoupons() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['coupons'],
        queryFn: async () => {
            const { data } = await api.get<Coupon[]>('/coupons');
            return data;
        },
    });

    const createMutation = useMutation({
        mutationFn: async (couponData: CreateCouponData) => {
            const { data } = await api.post('/coupons', couponData);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['coupons'] });
            toast.success('تم إنشاء الكوبون بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء إنشاء الكوبون');
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<CreateCouponData> }) => {
            const response = await api.put(`/coupons/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['coupons'] });
            toast.success('تم تحديث الكوبون بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء تحديث الكوبون');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/coupons/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['coupons'] });
            toast.success('تم حذف الكوبون بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء حذف الكوبون');
        }
    });

    // Format coupons for display
    const coupons: Coupon[] = (query.data || []).map(coupon => ({
        ...coupon,
        // Ensure numeric values are proper numbers for display
        discount: coupon.discount,
        usageCount: coupon.usageCount || 0,
        usageLimit: coupon.usageLimit || 100,
    }));

    return {
        coupons,
        isLoading: query.isLoading,
        error: query.error?.message || null,
        createCoupon: createMutation.mutateAsync,
        updateCoupon: updateMutation.mutateAsync,
        deleteCoupon: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}

// Hook for validating coupon at checkout
export function useValidateCoupon() {
    return useMutation({
        mutationFn: async ({ code, orderTotal }: { code: string; orderTotal: number }) => {
            const { data } = await api.post('/coupons/validate', { code, orderTotal });
            return data;
        },
    });
}
