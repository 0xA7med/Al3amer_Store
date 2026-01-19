import { useState } from 'react';
import { useAdminReports } from '../../hooks/useAdminReports';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminReportsPage() {
    const [dateRange, setDateRange] = useState('month');
    const { stats, salesByCategory, topProducts, dailySalesChart, isLoading } = useAdminReports(dateRange);

    if (isLoading || !stats) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-10 z-10 scroll-smooth">
            <div className="max-w-7xl mx-auto flex flex-col gap-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-white/5">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-white text-3xl font-bold leading-tight">التقارير والتحليلات</h1>
                        <p className="text-slate-400 text-base font-normal">
                            نظرة شاملة على أداء متجرك ومبيعاتك.
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
                        <button className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition-colors text-sm font-bold shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined text-[20px]">download</span>
                            <span>تصدير تقرير</span>
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { title: 'إجمالي الإيرادات', value: stats.totalRevenue.toLocaleString(), unit: 'ج.م', change: `${stats.revenueChange > 0 ? '+' : ''}${stats.revenueChange}%`, icon: 'payments', color: 'primary' },
                        { title: 'إجمالي الطلبات', value: stats.totalOrders.toLocaleString(), unit: 'طلب', change: `${stats.ordersChange > 0 ? '+' : ''}${stats.ordersChange}%`, icon: 'shopping_cart', color: 'blue-400' },
                        { title: 'متوسط قيمة الطلب', value: stats.averageOrderValue.toLocaleString(), unit: 'ج.م', change: `${stats.aovChange > 0 ? '+' : ''}${stats.aovChange}%`, icon: 'analytics', color: 'purple-400' },
                        { title: 'العملاء الجدد', value: stats.newCustomers.toLocaleString(), unit: 'عميل', change: `${stats.customersChange > 0 ? '+' : ''}${stats.customersChange}%`, icon: 'group_add', color: 'emerald-400' },
                    ].map((stat, index) => (
                        <div key={index} className="glass-panel p-6 rounded-xl relative overflow-hidden group hover:border-white/20 transition-all">
                            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-${stat.color}`}>
                                <span className="material-symbols-outlined text-6xl">{stat.icon}</span>
                            </div>
                            <div className="relative z-10">
                                <p className="text-slate-400 text-sm font-medium">{stat.title}</p>
                                <h3 className="text-2xl font-bold text-white mt-1">{stat.value} <span className="text-xs font-normal text-slate-500">{stat.unit}</span></h3>
                                <div className={`flex items-center gap-1 mt-2 text-xs font-bold ${stat.change.startsWith('+') ? 'text-emerald-400' : stat.change.startsWith('-') ? 'text-red-400' : 'text-slate-400'}`}>
                                    <span className="material-symbols-outlined text-[16px]">
                                        {stat.change.startsWith('+') ? 'trending_up' : stat.change.startsWith('-') ? 'trending_down' : 'trending_flat'}
                                    </span>
                                    <span>{stat.change}</span>
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
                        <h3 className="text-lg font-bold text-white mb-6">تحليل الإيرادات (آخر 30 يوم)</h3>
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

                    {/* Sales by Category */}
                    <div className="glass-panel p-6 rounded-xl">
                        <h3 className="text-lg font-bold text-white mb-6">المبيعات حسب القسم</h3>
                        <div className="flex flex-col gap-6">
                            {salesByCategory.map((cat, idx) => (
                                <div key={idx} className="flex flex-col gap-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-white">{cat.name}</span>
                                        <span className="text-slate-400">{cat.value}%</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${cat.value}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Top Products Table */}
                <div className="glass-panel rounded-xl overflow-hidden">
                    <div className="p-6 border-b border-white/5 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-white">المنتجات الأكثر مبيعاً</h3>
                        <button className="text-primary text-sm font-bold hover:underline">عرض الكل</button>
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
                                {topProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 font-bold text-white">{product.name}</td>
                                        <td className="px-6 py-4">{product.category}</td>
                                        <td className="px-6 py-4">{product.sales.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-emerald-400 font-bold">{product.revenue.toLocaleString()} ج.م</td>
                                        <td className={`px-6 py-4 ${product.stock < 50 ? 'text-yellow-400' : 'text-emerald-400'}`}>{product.stock}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

