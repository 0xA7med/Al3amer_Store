import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminReports } from '../../hooks/useAdminReports';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell
} from 'recharts';

export default function AdminReportsPage() {
    const [range, setRange] = useState('month');
    const [customStart, setCustomStart] = useState<string>('');
    const [customEnd, setCustomEnd] = useState<string>('');

    const { stats, salesByCategory, topProducts, dailySalesChart, isLoading } = useAdminReports({
        range,
        startDate: customStart ? new Date(customStart) : undefined,
        endDate: customEnd ? new Date(customEnd) : undefined
    });

    const handleExportCSV = () => {
        if (!topProducts.length) return;

        const headers = ['Product', 'Category', 'Sales', 'Revenue', 'Stock'];
        const csvContent = [
            headers.join(','),
            ...topProducts.map(p =>
                `"${p.name}","${p.category}",${p.sales},${p.revenue},${p.stock}`
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `reports_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading || !stats) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const COLORS = ['#135bec', '#10b981', '#3b82f6', '#a855f7', '#eab308'];

    return (
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-10 z-10 scroll-smooth">
            <div className="max-w-7xl mx-auto flex flex-col gap-8">
                {/* Header */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 pb-4 border-b border-white/5">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-white text-3xl font-bold leading-tight">التقارير والتحليلات</h1>
                        <p className="text-slate-400 text-base font-normal">
                            نظرة شاملة على أداء متجرك ومبيعاتك.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                        <div className="flex items-center gap-2 bg-[#1e232d] border border-white/10 rounded-lg p-1">
                            {['week', 'month', 'year'].map((r) => (
                                <button
                                    key={r}
                                    onClick={() => {
                                        setRange(r);
                                        setCustomStart('');
                                        setCustomEnd('');
                                    }}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${range === r && !customStart
                                        ? 'bg-primary text-white shadow-lg'
                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    {r === 'week' ? 'أسبوع' : r === 'month' ? 'شهر' : 'سنة'}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2 bg-[#1e232d] border border-white/10 rounded-lg px-3 py-1.5">
                            <span className="text-slate-500 text-xs font-bold">مخصص:</span>
                            <input
                                type="date"
                                value={customStart}
                                onChange={(e) => setCustomStart(e.target.value)}
                                className="bg-transparent text-white text-xs outline-none border-none focus:ring-0 p-0 w-24 calendar-picker-indicator-invert"
                            />
                            <span className="text-slate-600">-</span>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={(e) => setCustomEnd(e.target.value)}
                                className="bg-transparent text-white text-xs outline-none border-none focus:ring-0 p-0 w-24 calendar-picker-indicator-invert"
                            />
                        </div>

                        <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition-colors text-sm font-bold shadow-lg shadow-primary/20 mr-auto xl:mr-0"
                        >
                            <span className="material-symbols-outlined text-[20px]">download</span>
                            <span className="hidden sm:inline">تصدير CSV</span>
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { title: 'إجمالي الإيرادات', value: stats.totalRevenue.toLocaleString(), unit: 'ج.م', change: stats.revenueChange, icon: 'payments', color: 'primary' },
                        { title: 'إجمالي الطلبات', value: stats.totalOrders.toLocaleString(), unit: 'طلب', change: stats.ordersChange, icon: 'shopping_cart', color: 'blue-400' },
                        { title: 'متوسط قيمة الطلب', value: stats.averageOrderValue.toLocaleString(), unit: 'ج.م', change: stats.aovChange, icon: 'analytics', color: 'purple-400' },
                        { title: 'العملاء الجدد', value: stats.newCustomers.toLocaleString(), unit: 'عميل', change: stats.customersChange, icon: 'group_add', color: 'emerald-400' },
                    ].map((stat, index) => (
                        <div key={index} className="glass-panel p-6 rounded-xl relative overflow-hidden group hover:border-white/20 transition-all">
                            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-${stat.color}`}>
                                <span className="material-symbols-outlined text-6xl">{stat.icon}</span>
                            </div>
                            <div className="relative z-10">
                                <p className="text-slate-400 text-sm font-medium">{stat.title}</p>
                                <h3 className="text-2xl font-bold text-white mt-1">{stat.value} <span className="text-xs font-normal text-slate-500">{stat.unit}</span></h3>
                                <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${stat.change > 0 ? 'text-emerald-400' : stat.change < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                    <span className="material-symbols-outlined text-[16px]">
                                        {stat.change > 0 ? 'trending_up' : stat.change < 0 ? 'trending_down' : 'trending_flat'}
                                    </span>
                                    <span>{Math.abs(stat.change)}%</span>
                                    <span className="text-slate-500 font-medium mr-1">مقارنة بالفترة السابقة</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Revenue Chart */}
                    <div className="lg:col-span-2 glass-panel p-6 rounded-xl flex flex-col">
                        <h3 className="text-lg font-bold text-white mb-6">تحليل الإيرادات</h3>
                        <div className="flex-1 min-h-[300px] w-full">
                            {dailySalesChart.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <AreaChart data={dailySalesChart} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#135bec" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#135bec" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                        <XAxis
                                            dataKey="day"
                                            stroke="#64748b"
                                            tick={{ fill: '#64748b', fontSize: 11 }}
                                            tickLine={{ stroke: '#64748b' }}
                                            interval="preserveStartEnd"
                                        />
                                        <YAxis
                                            stroke="#64748b"
                                            tick={{ fill: '#64748b', fontSize: 11 }}
                                            tickLine={{ stroke: '#64748b' }}
                                            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#1e232d',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '8px',
                                                color: '#fff'
                                            }}
                                            formatter={(value) => [`${(value as number || 0).toLocaleString()} ج.م`, 'الإيرادات']}
                                            labelFormatter={(label) => `التاريخ: ${label}`}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#135bec"
                                            strokeWidth={2}
                                            fillOpacity={1}
                                            fill="url(#colorRevenue)"
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-[300px] text-slate-500">
                                    <div className="text-center">
                                        <span className="material-symbols-outlined text-4xl mb-2 block">insights</span>
                                        <p>لا توجد بيانات مبيعات بعد</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sales by Category (Pie Chart) */}
                    <div className="glass-panel p-6 rounded-xl flex flex-col">
                        <h3 className="text-lg font-bold text-white mb-6">المبيعات حسب القسم</h3>
                        <div className="flex-1 min-h-[300px] w-full flex flex-col items-center justify-center">
                            {salesByCategory.length > 0 ? (
                                <>
                                    <ResponsiveContainer width="100%" height={200}>
                                        <PieChart>
                                            <Pie
                                                data={salesByCategory as any[]}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {salesByCategory.map((_entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#1e232d',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    borderRadius: '8px',
                                                    color: '#fff'
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="w-full flex flex-col gap-3 mt-4">
                                        {salesByCategory.map((cat, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                                    <span className="text-white">{cat.name}</span>
                                                </div>
                                                <span className="text-slate-400">{cat.value}%</span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center text-slate-500">
                                    <span className="material-symbols-outlined text-4xl mb-2 block">pie_chart</span>
                                    <p>لا توجد بيانات تصنيف</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Top Products Table */}
                <div className="glass-panel rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white">المنتجات الأكثر مبيعاً</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-white/5 text-slate-400 font-medium">
                                <tr>
                                    <th className="px-6 py-4">المنتج</th>
                                    <th className="px-6 py-4">القسم</th>
                                    <th className="px-6 py-4">عدد القطع المباعة</th>
                                    <th className="px-6 py-4">الإيرادات</th>
                                    <th className="px-6 py-4">المخزون المتبقي</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-slate-300">
                                {topProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                            لا توجد منتجات مباعة في هذه الفترة
                                        </td>
                                    </tr>
                                ) : (
                                    topProducts.map((product) => (
                                        <tr key={product.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 font-bold text-white group-hover:text-primary transition-colors">
                                                <Link to={`/admin/products/${product.id}`} className="flex items-center gap-3">
                                                    {product.imageUrl && (
                                                        <img src={product.imageUrl} alt={product.name} className="w-8 h-8 rounded object-cover bg-white/5" />
                                                    )}
                                                    {product.name}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4">{product.category}</td>
                                            <td className="px-6 py-4">{product.sales.toLocaleString()}</td>
                                            <td className="px-6 py-4 text-emerald-400 font-bold">{product.revenue.toLocaleString()} ج.م</td>
                                            <td className={`px-6 py-4 ${product.stock < 10 ? 'text-red-400 font-bold' : product.stock < 50 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                                                {product.stock}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

