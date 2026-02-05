import { useMutation } from '@tanstack/react-query';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

    const res = await fetch(`${API_URL}/api/products/import/preview`, {
        method: 'POST',
        body: formData,
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to preview import');
    }

    return res.json();
}

async function executeSync(items: DiffItem[]): Promise<ExecuteResponse> {
    const res = await fetch(`${API_URL}/api/products/import/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
    });

    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to execute import');
    }

    return res.json();
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
