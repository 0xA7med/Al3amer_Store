import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export interface DashboardStats {
    stats: {
        revenue: { value: number; lastWeek: number; trend: 'up' | 'down' };
        orders: { value: number; lastWeek: number; trend: 'up' | 'down' };
    };
    pendingOrders: any[];
    activityFeed: { type: string; message: string; date: string; id: string }[];
    sparklines: { date: string; count: number }[];
}

export interface ReportsData {
    heatmap: { day_of_week: number; hour_of_day: number; count: number }[];
    profitability: { date: string; revenue: number; cost: number; profit: number }[];
    customerInsights: { new: number; total: number; returning: number };
    inventory: { id: string; name: string; stock: number }[];
}

export function useDashboardStats() {
    return useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: async () => {
            const { data } = await api.get<DashboardStats>('/analytics/dashboard');
            return data;
        },
        refetchInterval: 30000, // Refresh every 30s
    });
}

export function useReportsData(startDate?: string, endDate?: string) {
    return useQuery({
        queryKey: ['reports-data', startDate, endDate],
        queryFn: async () => {
            const { data } = await api.get<ReportsData>('/analytics/reports', {
                params: { startDate, endDate }
            });
            return data;
        }
    });
}
