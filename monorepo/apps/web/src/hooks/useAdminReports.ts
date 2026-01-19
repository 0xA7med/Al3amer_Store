import { useState, useEffect } from 'react';
import api from '../lib/api';

export interface DashboardStats {
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
    newCustomers: number;
    netProfit?: number;
    customerGrowth?: number;
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
    imageUrl?: string;
}

export interface DailySalesData {
    date: string;
    day: string;
    revenue: number;
    orders: number;
}

export interface DateParams {
    range: string;
    startDate?: Date | null;
    endDate?: Date | null;
}

export function useAdminReports({ range, startDate, endDate }: DateParams) {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [salesByCategory, setSalesByCategory] = useState<SalesByCategory[]>([]);
    const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
    const [dailySalesChart, setDailySalesChart] = useState<DailySalesData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReports = async () => {
            setIsLoading(true);
            try {
                const params: any = { range };
                if (startDate) params.startDate = startDate.toISOString();
                if (endDate) params.endDate = endDate.toISOString();

                const response = await api.get('/admin/reports', { params });
                setStats(response.data.stats);
                setSalesByCategory(response.data.salesByCategory || []);
                setTopProducts(response.data.topProducts || []);
                setDailySalesChart(response.data.dailySalesChart || []);
            } catch (err) {
                console.error('Failed to fetch reports', err);
                // Set empty defaults on error
                setStats({
                    totalRevenue: 0,
                    totalOrders: 0,
                    averageOrderValue: 0,
                    newCustomers: 0,
                    revenueChange: 0,
                    ordersChange: 0,
                    aovChange: 0,
                    customersChange: 0,
                });
                setSalesByCategory([]);
                setTopProducts([]);
                setDailySalesChart([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReports();
    }, [range, startDate, endDate]);

    return {
        stats,
        salesByCategory,
        topProducts,
        dailySalesChart,
        isLoading
    };
}
