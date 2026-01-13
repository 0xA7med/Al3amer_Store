import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';

export interface Product {
    id: string;
    name: string;
    sku: string;
    image: string;
}

export interface Customer {
    id: string;
    name: string;
    type: string;
    avatar: string;
}

export interface Review {
    id: string;
    product: Product;
    customer: Customer;
    rating: number;
    text: string;
    date: string;
    status: 'pending' | 'approved' | 'rejected';
}

export function useReviews(params?: { status?: string; productId?: string }) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['reviews', params],
        queryFn: async () => {
            const { data } = await api.get<Review[]>('/reviews', { params });
            return data;
        },
    });

    const updateStatusMutation = useMutation({
        mutationFn: async ({ id, status }: { id: string | number; status: 'approved' | 'rejected' | 'pending' }) => {
            const { data } = await api.patch(`/reviews/${id}/approve`, { status });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reviews'] });
            toast.success('تم تحديث حالة التقييم');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء تحديث حالة التقييم');
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string | number) => {
            await api.delete(`/reviews/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reviews'] });
            toast.success('تم حذف التقييم');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء حذف التقييم');
        }
    });

    // Format dates for display
    const reviews: Review[] = (query.data || []).map(review => ({
        ...review,
        date: review.date ? new Date(review.date).toLocaleDateString('ar-EG', {
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit',
        }) : 'غير معروف',
    }));

    const updateReviewStatus = (id: number | string, status: 'approved' | 'rejected') => {
        updateStatusMutation.mutate({ id, status });
    };

    const deleteReview = (id: number | string) => {
        deleteMutation.mutate(id);
    };

    return {
        reviews,
        isLoading: query.isLoading,
        error: query.error?.message || null,
        updateReviewStatus,
        deleteReview,
        isUpdating: updateStatusMutation.isPending,
    };
}
