import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import toast from 'react-hot-toast';

export interface Category {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
    image: string | null;
    icon: string | null;
    isActive: boolean;
    isFeatured?: boolean; children?: Category[]; // For tree structure
    parent?: Category | null;
    products?: any[]; // To show count
    productCount?: number; // derived
}

export function useCategories() {
    const queryClient = useQueryClient();

    const { data: categories = [], isLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const { data } = await api.get<Category[]>('/categories');
            return data;
        },
    });

    // Helper to build tree from flat list
    const buildTree = (flatList: Category[]): Category[] => {
        const map = new Map<string, Category>();
        const roots: Category[] = [];

        // First pass: create map and initialize children
        flatList.forEach(cat => {
            map.set(cat.id, { ...cat, children: [], productCount: cat.products?.length || 0 });
        });

        // Second pass: link parents
        flatList.forEach(cat => {
            if (cat.parentId && map.has(cat.parentId)) {
                map.get(cat.parentId)!.children!.push(map.get(cat.id)!);
            } else {
                roots.push(map.get(cat.id)!);
            }
        });

        return roots;
    };

    const categoryTree = buildTree(categories);

    // Mutations
    const createmut = useMutation({
        mutationFn: async (data: Partial<Category>) => {
            await api.post('/categories', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('Category created successfully');
        },
        onError: () => {
            toast.error('Failed to create category');
        }
    });

    const updateMut = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Category> }) => {
            await api.put(`/categories/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('Category updated successfully');
        },
        onError: () => {
            toast.error('Failed to update category');
        }
    });

    const deleteMut = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/categories/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('Category deleted successfully');
        },
        onError: () => {
            toast.error('Failed to delete category');
        }
    });

    return {
        categories, // flat list
        categoryTree, // nested list
        isLoading,
        createCategory: createmut.mutateAsync,
        updateCategory: updateMut.mutateAsync,
        deleteCategory: deleteMut.mutateAsync,
        isCreating: createmut.isPending,
        isUpdating: updateMut.isPending,
        isDeleting: deleteMut.isPending,
    };
}
