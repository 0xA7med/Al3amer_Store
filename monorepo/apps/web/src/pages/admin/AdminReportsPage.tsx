import { useState, useMemo } from 'react';
import { useReportsData } from '../../hooks/useAnalytics';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';

// Helper to get date ranges
const getDateRange = (range: string) => {
    const end = new Date();
    const start = new Date();
    if (range === 'week') start.setDate(end.getDate() - 7);
    if (range === 'month') start.setMonth(end.getMonth() - 1);
    if (range === 'year') start.setFullYear(end.getFullYear() - 1);
    return { startDate: start.toISOString(), endDate: end.toISOString() };
};

export default function AdminReportsPage() {
    const [dateRange, setDateRange] = useState('month');
    const { startDate, endDate } = getDateRange(dateRange);

    // We pass date strings to the hook. Assuming hook handles fetching based on these.
    const { data, isLoading } = useReportsData(startDate, endDate);

    // Calculate totals for cards
    const stats = useMemo(() => {
        if (!data) return null;
        const totalRevenue = data.profitability.reduce((sum, item) => sum + parseFloat(item.revenue as any), 0);
        const totalProfit = data.profitability.reduce((sum, item) => sum + parseFloat(item.profit as any), 0);
        // data.customerInsights.new is a count
        const newCustomers = data.customerInsights.new;

        return { totalRevenue, totalProfit, newCustomers };
    }, [data]);

    // Data for Inventory Bar Chart
    const inventoryData = useMemo(() => {
        if (!data) return [];
        return data.inventory.map(item => ({
            name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
            stock: item.stock
        }));
    }, [data]);

    // Data for Customer Pie Chart
    const customerData = useMemo(() => {
        if (!data) return [];
        return [
            { name: 'جدد', value: data.customerInsights.new },
            { name: 'عائدون', value: data.customerInsights.returning } // Approximation logic in backend
        ];
    }, [data]);

    const COLORS = ['#10b981', '#3b82f6'];

    if (isLoading || !data || !stats) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">جاري تحليل البيانات...</p>
            </div>
        );
    }

    const { heatmap, profitability } = data;

    // Export Function
    const handleExport = () => {
        const csvContent = "data:text/csv;charset=utf-8,"
            + "Date,Revenue,Profit\n"
            + profitability.map(e => `${e.date},${e.revenue},${e.profit}`).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "report.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-10 z-10 scroll-smooth">
            <div className="max-w-7xl mx-auto flex flex-col gap-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-white/5">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-white text-3xl font-bold leading-tight">التقارير والتحليلات</h1>
                        <p className="text-slate-400 text-base font-normal">
                            تحليلات متقدمة للأرباح، المخزون، والعملاء.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={dateRange}
                            onChange={(e) => setDateRange(e.target.value)}
                            className="bg-[#1e232d] border border-white/10 text-white text-sm rounded-lg px-4 py-2 focus:ring-1 focus:ring-primary outline-none"
                        >
                            <option value="week">آخر 7 أيام</option>
                            <option value="month">الشهر الحالي</option>
                            <option value="year">السنة الحالية</option>
                        </select>
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition-colors text-sm font-bold shadow-lg shadow-primary/20"
                        >
                            <span className="material-symbols-outlined text-[20px]">download</span>
                            <span>تصدير (CSV)</span>
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-panel p-6 rounded-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 text-primary">
                            <span className="material-symbols-outlined text-6xl">payments</span>
                        </div>
                        <p className="text-slate-400 text-sm font-medium">إجمالي الإيرادات</p>
                        <h3 className="text-2xl font-bold text-white mt-1">{stats.totalRevenue.toLocaleString()} <span className="text-xs text-slate-500">ج.م</span></h3>
                    </div>
                    <div className="glass-panel p-6 rounded-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 text-emerald-400">
                            <span className="material-symbols-outlined text-6xl">monetization_on</span>
                        </div>
                        <p className="text-slate-400 text-sm font-medium">صافي الربح</p>
                        <h3 className="text-2xl font-bold text-white mt-1">{stats.totalProfit.toLocaleString()} <span className="text-xs text-slate-500">ج.م</span></h3>
                    </div>
                    <div className="glass-panel p-6 rounded-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 text-blue-400">
                            <span className="material-symbols-outlined text-6xl">group_add</span>
                        </div>
                        <p className="text-slate-400 text-sm font-medium">العملاء الجدد</p>
                        <h3 className="text-2xl font-bold text-white mt-1">{stats.newCustomers} <span className="text-xs text-slate-500">عميل</span></h3>
                    </div>
                </div>

                {/* Profitability Chart */}
                <div className="glass-panel p-6 rounded-xl flex flex-col">
                    <h3 className="text-lg font-bold text-white mb-6">تحليل الربحية (الإيرادات vs الربح)</h3>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={profitability} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
                                <YAxis stroke="#64748b" tick={{ fill: '#64748b', fontSize: 11 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e232d', border: '1px solid #334155', color: '#fff' }}
                                    formatter={(value: any) => parseFloat(value).toLocaleString() + ' ج.م'}
                                />
                                <Legend />
                                <Area type="monotone" dataKey="revenue" name="الإيرادات" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" />
                                <Area type="monotone" dataKey="profit" name="صافي الربح" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Inventory Health */}
                    <div className="glass-panel p-6 rounded-xl">
                        <h3 className="text-lg font-bold text-white mb-6">صحة المخزون (أقل 10 منتجات)</h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={inventoryData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                                    <XAxis type="number" stroke="#64748b" />
                                    <YAxis type="category" dataKey="name" stroke="#64748b" width={100} tick={{ fontSize: 11 }} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1e232d', border: '1px solid #334155', color: '#fff' }}
                                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    />
                                    <Bar dataKey="stock" name="الكمية المتبقية" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Customer Insights & Heatmap Placeholder */}
                    <div className="flex flex-col gap-6">
                        {/* Customers */}
                        <div className="glass-panel p-6 rounded-xl flex-1">
                            <h3 className="text-lg font-bold text-white mb-4">العملاء (الجدد vs العائدون)</h3>
                            <div className="h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={customerData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {customerData.map((_, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#1e232d', border: 'none', color: '#fff' }} />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Heatmap (Simplified Visual) */}
                        <div className="glass-panel p-6 rounded-xl">
                            <h3 className="text-lg font-bold text-white mb-2">أوقات الذروة</h3>
                            <p className="text-xs text-slate-400 mb-4">توزيع الطلبات حسب الساعة (آخر 24 ساعة)</p>
                            <div className="grid grid-cols-12 gap-1 h-24">
                                {/* Visual representation of hours 0-23. Using heatmap data if available, else random opacity for effect */}
                                {Array.from({ length: 24 }).map((_, i) => {
                                    // Find count for this hour from heatmap data (simplified: sum count for hour across all days)
                                    const count = heatmap.filter(h => h.hour_of_day === i).reduce((acc, curr) => acc + parseInt(curr.count as any), 0);
                                    const max = Math.max(...heatmap.map(h => parseInt(h.count as any))) || 1;
                                    const opacity = (count / max) * 0.8 + 0.2; // Min 0.2 opacity

                                    return (
                                        <div
                                            key={i}
                                            className="rounded bg-primary flex items-end justify-center pb-1 text-[8px] text-white/70"
                                            style={{ opacity: count > 0 ? opacity : 0.1 }}
                                            title={`Hour: ${i}:00 - Orders: ${count}`}
                                        >
                                            {i}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

