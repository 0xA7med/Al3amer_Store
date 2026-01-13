import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

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

    const addToWishlistMutation = useMutation({
        mutationFn: async (productId: string) => {
            await api.post('/wishlist', { productId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wishlist'] });
        },
    });

    const removeFromWishlistMutation = useMutation({
        mutationFn: async (productId: string) => {
            await api.delete(`/wishlist/${productId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wishlist'] });
        },
    });

    const toggleWishlistMutation = useMutation({
        mutationFn: async (productId: string) => {
            const response = await api.post('/wishlist/toggle', { productId });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['wishlist'] });
        },
    });

    const isInWishlist = (productId: string) => {
        return wishlist.some(item => item.productId === productId);
    };

    return {
        wishlist,
        isLoading,
        error,
        fetchWishlist: () => queryClient.invalidateQueries({ queryKey: ['wishlist'] }),
        addToWishlist: addToWishlistMutation.mutateAsync,
        removeFromWishlist: removeFromWishlistMutation.mutateAsync,
        toggleWishlist: toggleWishlistMutation.mutateAsync,
        isInWishlist,
    };
}
