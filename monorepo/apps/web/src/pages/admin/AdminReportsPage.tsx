import { useState } from 'react';
import { useAdminReports } from '../../hooks/useAdminReports';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';

export default function AdminReportsPage() {
    const [dateRange, setDateRange] = useState('month');
    const [customDates, setCustomDates] = useState<{ start: Date | null, end: Date | null }>({ start: null, end: null });
    const { stats, salesByCategory, topProducts, dailySalesChart, isLoading } = useAdminReports(dateRange, customDates);

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
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-white/5">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-primary">
                            <span className="material-symbols-outlined">analytics</span>
                            <span className="text-xs font-bold uppercase tracking-widest">تحليلات المبيعات</span>
                        </div>
                        <h1 className="text-white text-3xl md:text-4xl font-black leading-tight">غرفة التحكم</h1>
                        <p className="text-slate-400 text-sm font-medium max-w-lg">
                            تحليل شامل لمؤشرات الأداء الرئيسية ونمو المتجر. استخدم التعديلات الزمنية للمقارنة بين الفترات.
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
                            <option value="custom">فترة مخصصة</option>
                        </select>

                        {dateRange === 'custom' && (
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    className="bg-[#1e232d] border border-white/10 text-white text-sm rounded-lg px-2 py-2 focus:ring-1 focus:ring-primary outline-none"
                                    onChange={(e) => setCustomDates(prev => ({ ...prev, start: e.target.valueAsDate }))}
                                />
                                <span className="text-white">-</span>
                                <input
                                    type="date"
                                    className="bg-[#1e232d] border border-white/10 text-white text-sm rounded-lg px-2 py-2 focus:ring-1 focus:ring-primary outline-none"
                                    onChange={(e) => setCustomDates(prev => ({ ...prev, end: e.target.valueAsDate }))}
                                />
                            </div>
                        )}
                        <button
                            onClick={() => {
                                if (!stats || !dailySalesChart.length) return;
                                const csvContent = [
                                    ['Date', 'Orders', 'Revenue'],
                                    ...dailySalesChart.map(d => [d.date, d.orders, d.revenue])
                                ].map(e => e.join(",")).join("\n");

                                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                                const link = document.createElement("a");
                                const url = URL.createObjectURL(blob);
                                link.setAttribute("href", url);
                                link.setAttribute("download", `report_${dateRange}.csv`);
                                link.style.visibility = 'hidden';
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }}
                            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg transition-colors text-sm font-bold shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined text-[20px]">download</span>
                            <span>تصدير تقرير</span>
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        {
                            title: 'إجمالي الإيرادات',
                            value: stats.totalRevenue,
                            unit: 'ج.م',
                            change: stats.revenueChange,
                            icon: 'payments',
                            color: 'primary',
                            desc: 'إجمالي دخل المتجر قبل الخصومات'
                        },
                        {
                            title: 'إجمالي الطلبات',
                            value: stats.totalOrders,
                            unit: 'طلب',
                            change: stats.ordersChange,
                            icon: 'shopping_cart',
                            color: 'blue-400',
                            desc: 'عدد الطلبات المكتملة والمعالجة'
                        },
                        {
                            title: 'متوسط قيمة الطلب',
                            value: stats.averageOrderValue,
                            unit: 'ج.م',
                            change: stats.aovChange,
                            icon: 'analytics',
                            color: 'purple-400',
                            desc: 'متوسط الإنفاق لكل عميل'
                        },
                        {
                            title: 'العملاء الجدد',
                            value: stats.newCustomers,
                            unit: 'عميل',
                            change: stats.customersChange,
                            icon: 'group_add',
                            color: 'emerald-400',
                            desc: 'نمو قاعدة العملاء في هذه الفترة'
                        },
                    ].map((stat, index) => (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            key={index}
                            className="glass-panel p-6 rounded-xl relative overflow-hidden group hover:border-white/20 transition-all cursor-help"
                            title={stat.desc}
                        >
                            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-${stat.color}`}>
                                <span className="material-symbols-outlined text-6xl">{stat.icon}</span>
                            </div>
                            <div className="relative z-10">
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{stat.title}</p>
                                <h3 className="text-2xl font-black text-white">{stat.value.toLocaleString('ar-EG')} <span className="text-xs font-normal text-slate-500">{stat.unit}</span></h3>
                                <div className={`flex items-center gap-1 mt-3 px-2 py-1 rounded-full w-fit text-[10px] font-black ${stat.change > 0 ? 'bg-emerald-500/10 text-emerald-400' : stat.change < 0 ? 'bg-red-500/10 text-red-400' : 'bg-slate-500/10 text-slate-400'}`}>
                                    <span className="material-symbols-outlined text-[14px]">
                                        {stat.change > 0 ? 'trending_up' : stat.change < 0 ? 'trending_down' : 'trending_flat'}
                                    </span>
                                    <span>{stat.change > 0 ? '+' : ''}{stat.change}%</span>
                                    <span className="opacity-60 font-medium">مقارنة بالسابق</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Revenue Chart */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="lg:col-span-2 glass-panel p-8 rounded-xl flex flex-col min-h-[450px]"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-xl font-bold text-white">تحليل مبيعات {dateRange === 'week' ? 'الأسبوع' : dateRange === 'month' ? 'الشهر' : 'العام'}</h3>
                                <p className="text-slate-500 text-sm">مخطط بياني يوضح تذبذب الإيرادات اليومي</p>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="size-3 rounded-full bg-primary shadow-[0_0_10px_rgba(37,244,238,0.5)]"></span>
                                    <span className="text-xs text-slate-400">الإيرادات</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 w-full">
                            {dailySalesChart.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={dailySalesChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorRevenueMain" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#25f4ee" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#25f4ee" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                                        <XAxis
                                            dataKey="day"
                                            stroke="#475569"
                                            tick={{ fill: '#475569', fontSize: 10 }}
                                            tickLine={false}
                                            axisLine={false}
                                            dy={10}
                                        />
                                        <YAxis
                                            stroke="#475569"
                                            tick={{ fill: '#475569', fontSize: 10 }}
                                            tickLine={false}
                                            axisLine={false}
                                            tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#1e2330',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                borderRadius: '12px',
                                                color: '#fff',
                                                fontSize: '12px'
                                            }}
                                            itemStyle={{ color: '#25f4ee' }}
                                            formatter={(value) => [`${(value as number || 0).toLocaleString()} ج.م`, 'الإيرادات']}
                                            labelFormatter={(label) => `التاريخ: ${label}`}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="revenue"
                                            stroke="#25f4ee"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorRevenueMain)"
                                            activeDot={{ r: 6, stroke: '#1e2330', strokeWidth: 2 }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-500">
                                    <div className="text-center">
                                        <span className="material-symbols-outlined text-5xl mb-3 opacity-20">equalizer</span>
                                        <p className="text-sm">لا تتوفر بيانات مبيعات لهذه الفترة</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Sales by Category & Top Actions */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="flex flex-col gap-6"
                    >
                        <div className="glass-panel p-8 rounded-xl flex-1 flex flex-col">
                            <h3 className="text-lg font-bold text-white mb-2">أداء الأقسام</h3>
                            <p className="text-slate-500 text-xs mb-8">توزيع المبيعات حسب تصنيف المنتج</p>

                            <div className="space-y-6 flex-1">
                                {salesByCategory.map((cat, idx) => (
                                    <div key={idx} className="flex flex-col gap-3">
                                        <div className="flex justify-between items-center text-xs">
                                            <div className="flex items-center gap-2">
                                                <div className={`size-2 rounded-full ${cat.color.replace('bg-', 'bg-')}`}></div>
                                                <span className="text-slate-300 font-bold">{cat.name}</span>
                                            </div>
                                            <span className="text-white font-mono">{cat.value}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${cat.value}%` }}
                                                transition={{ duration: 1, delay: 0.8 + (idx * 0.1) }}
                                                className={`h-full ${cat.color} rounded-full`}
                                            ></motion.div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 pt-8 border-t border-white/5">
                                <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                                    <p className="text-[10px] text-primary font-bold uppercase mb-1">نصيحة ذكية</p>
                                    <p className="text-xs text-slate-400 leading-relaxed italic">
                                        يوصى بزيادة العروض على قسم "{salesByCategory.sort((a, b) => a.value - b.value)[0]?.name}" لرفع معدلات النمو.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Top Products Detailed View */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="glass-panel rounded-xl overflow-hidden shadow-2xl shadow-black/20"
                >
                    <div className="p-8 border-b border-white/5 flex flex-wrap justify-between items-center gap-4">
                        <div>
                            <h3 className="text-xl font-bold text-white">ترتيب النخبة</h3>
                            <p className="text-slate-500 text-sm">أكثر 5 منتجات تحقيقاً للأرباح والمبيعات</p>
                        </div>
                        <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-xl border border-emerald-500/20">
                            <span className="material-symbols-outlined text-[18px]">verified</span>
                            <span className="text-xs font-bold uppercase">المنتجات الأكثر ثباتاً</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-right">
                            <thead className="bg-white/2 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-white/5">
                                <tr>
                                    <th className="px-8 py-5">المنتج والوصف</th>
                                    <th className="px-8 py-5 text-center">التصنيف</th>
                                    <th className="px-8 py-5 text-center">وحدات مباعة</th>
                                    <th className="px-8 py-5 text-center">صافي الإيرادات</th>
                                    <th className="px-8 py-5 text-center">المخزون الحالي</th>
                                    <th className="px-8 py-5 text-center">الأداء</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/2 text-slate-300">
                                {topProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-white/2 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="size-14 rounded-xl bg-white/5 overflow-hidden ring-1 ring-white/10 group-hover:ring-primary/50 transition-all">
                                                    <img
                                                        src={product.imageUrl || 'https://via.placeholder.com/100'}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-black text-white text-base group-hover:text-primary transition-colors">{product.name}</span>
                                                    <span className="text-[10px] text-slate-500 font-mono uppercase">ID: {product.id.substring(0, 8)}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <span className="px-3 py-1 bg-slate-800 text-slate-400 rounded-full text-[10px] font-bold">
                                                {product.category}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="font-black text-white text-lg">{product.sales.toLocaleString('ar-EG')}</span>
                                                <span className="text-[10px] text-slate-500">قطعة</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="font-black text-emerald-400 text-lg">{product.revenue.toLocaleString('ar-EG')}</span>
                                                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">جنيه مصري</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <span className={`font-black ${product.stock < 50 ? 'text-secondary' : 'text-emerald-400'}`}>
                                                    {product.stock} <span className="text-[10px] font-normal opacity-60">متبقي</span>
                                                </span>
                                                <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full ${product.stock < 50 ? 'bg-secondary' : 'bg-emerald-400'}`}
                                                        style={{ width: `${Math.min(product.stock, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-center">
                                            <div className="size-10 mx-auto rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                                <span className="material-symbols-outlined text-[20px]">trending_up</span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

