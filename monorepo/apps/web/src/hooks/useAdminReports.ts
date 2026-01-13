import { useState, useEffect } from 'react';
import api from '../lib/api';

export interface DashboardStats {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    newCustomers: number;
    revenueChange: number;
    ordersChange: number;
    aovChange: number;
    customersChange: number;
}

export interface SalesByCategory {
    name: string;
    value: number;
    color: string;
}

export interface TopProduct {
    id: string;
    name: string;
    category: string;
    sales: number;
    revenue: number;
    stock: number;
}



export function useAdminReports(dateRange: string) {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [salesByCategory, setSalesByCategory] = useState<SalesByCategory[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            setIsLoading(true);
            try {
                const response = await api.get('/admin/reports', { params: { range: dateRange } });
                setStats(response.data.stats);
                setSalesByCategory(response.data.salesByCategory);
                setTopProducts(response.data.topProducts);
            } catch (err) {
                console.error('Failed to fetch reports', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReports();
    }, [dateRange]);

    return {
        stats,
        salesByCategory,
        topProducts,
        isLoading
    };
}
