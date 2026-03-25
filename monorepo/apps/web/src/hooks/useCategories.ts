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
    isFeatured?: boolean;
    attributesSchema?: { name: string; type: 'single-select' | 'multi-select'; options: string[] }[];
    children?: Category[]; // For tree structure
    parent?: Category | null;
    products?: any[]; // To show count
    productCount?: number; // total (active + draft)
    activeProductCount?: number; // only active
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
            map.set(cat.id, { 
                ...cat, 
                children: [], 
                productCount: cat.productCount || 0,
                activeProductCount: cat.activeProductCount || 0
            });
        });

        // Second pass: link parents
        flatList.forEach(cat => {
            const current = map.get(cat.id);
            if (!current) return;
            if (cat.parentId && map.has(cat.parentId)) {
                map.get(cat.parentId)!.children!.push(current);
            } else {
                roots.push(current);
            }
        });

        // Recursive helper to sum child product counts into parents
        const aggregateCounts = (node: Category): { total: number, active: number } => {
            let total = node.productCount || 0;
            let active = node.activeProductCount || 0;
            
            if (node.children) {
                node.children.forEach(child => {
                    const childCounts = aggregateCounts(child);
                    total += childCounts.total;
                    active += childCounts.active;
                });
            }
            
            node.productCount = total;
            node.activeProductCount = active;
            return { total, active };
        };

        // Aggregrate counts starting from roots
        roots.forEach(r => aggregateCounts(r));

        return roots;
    };

    const categoryTree = buildTree(categories);

    const createmut = useMutation({
        mutationFn: async (data: Partial<Category>) => {
            await api.post('/categories', data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('تم إنشاء القسم بنجاح');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error || 'حدث خطأ في إنشاء القسم');
        }
    });

    const updateMut = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Category> }) => {
            await api.put(`/categories/${id}`, data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('تم تحديث القسم بنجاح');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error || 'حدث خطأ في تحديث القسم');
        }
    });

    const deleteMut = useMutation({
        mutationFn: async (id: string) => {
            await api.delete(`/categories/${id}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            toast.success('تم حذف القسم بنجاح');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.error || 'حدث خطأ في حذف القسم');
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
