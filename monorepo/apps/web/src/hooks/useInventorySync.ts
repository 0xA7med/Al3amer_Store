import { useMutation } from '@tanstack/react-query';
import api from '../lib/api';

export interface DiffChange {
    old: number;
    new: number;
}

export interface DiffItem {
    externalId: string;
    name: string;
    status: 'new' | 'update' | 'match' | 'existing';
    existingProductId?: string;
    changes?: {
        price?: DiffChange;
        stock?: DiffChange;
        cost?: DiffChange;
    };
    newData?: {
        name: string;
        price: number;
        stock: number;
        cost: number;
    };
    currentData?: {
        price: number;
        stock: number;
        cost: number;
    };
}

export interface PreviewResponse {
    items: DiffItem[];
    summary: {
        total: number;
        new: number;
        updates: number;
        unchanged: number;
    };
}

export interface ExecuteResponse {
    success: boolean;
    message: string;
    results: {
        updated: number;
        created: number;
        errors: string[];
    };
}

async function uploadAndPreview(file: File): Promise<PreviewResponse> {
    const formData = new FormData();
    formData.append('file', file);

    try {
        const { data } = await api.post('/products/import/preview', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return data;
    } catch (error: any) {
        throw new Error(error.response?.data?.error || error.response?.data?.message || 'Failed to preview import');
    }
}

async function executeSync(items: DiffItem[]): Promise<ExecuteResponse> {
    try {
        const { data } = await api.post('/products/import/execute', { items });
        return data;
    } catch (error: any) {
        throw new Error(error.response?.data?.error || error.response?.data?.message || 'Failed to execute import');
    }
}

export function useInventorySync() {
    const previewMutation = useMutation({
        mutationFn: uploadAndPreview,
    });

    const executeMutation = useMutation({
        mutationFn: executeSync,
    });

    return {
        preview: previewMutation,
        execute: executeMutation,
    };
}
