import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';

export interface WishlistItem {
    id: string;
    productId: string;
    product: {
        id: string;
        name: string;
        price: number;
        discountPrice?: number;
        images: { url: string }[];
        category?: { name: string };
        brand?: { name: string };
        stock: number;
        slug: string;
    };
}

export function useWishlist() {
    const queryClient = useQueryClient();

    const { data: wishlist = [], isLoading, error } = useQuery<WishlistItem[]>({
        queryKey: ['wishlist'],
        queryFn: async () => {
            const response = await api.get('/wishlist');
            return response.data;
        },
        enabled: !!localStorage.getItem('token'),
        retry: false,
    });

    const toggleWishlistMutation = useMutation({
        mutationFn: async (productId: string) => {
            const response = await api.post('/wishlist/toggle', { productId });
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['wishlist'] });
            if (data.inWishlist) {
                toast.success('تمت الإضافة للمفضلة', {
                    icon: '❤️',
                    style: { direction: 'rtl' }
                });
            } else {
                toast.success('تم الإزالة من المفضلة', {
                    icon: '💔',
                    style: { direction: 'rtl' }
                });
            }
        },
        onError: () => {
            toast.error('حدث خطأ أثناء تحديث المفضلة', {
                style: { direction: 'rtl' }
            });
        }
    });

    const isInWishlist = (productId: string) => {
        return wishlist.some(item => item.productId === productId);
    };

    return {
        wishlist,
        isLoading,
        isToggling: toggleWishlistMutation.isPending,
        error,
        fetchWishlist: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
        addToWishlist: (productId: string) => toggleWishlistMutation.mutate(productId),
        removeFromWishlist: (productId: string) => toggleWishlistMutation.mutate(productId),
        toggleWishlist: (productId: string) => toggleWishlistMutation.mutate(productId),
        isInWishlist,
    };
}
