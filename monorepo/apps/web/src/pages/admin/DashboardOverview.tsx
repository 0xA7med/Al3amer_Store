import { Link, useNavigate } from 'react-router-dom';
import { useDashboardStats, useUpdateOrderStatus } from '../../hooks/useAdmin';
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
import { useState } from 'react';
import toast from 'react-hot-toast';

export function DashboardOverview() {
    const { stats, isLoading, products, orders } = useDashboardStats();
    const { dailySalesChart } = useAdminReports('week');
    const updateStatus = useUpdateOrderStatus();
    const navigate = useNavigate();

    // Get recent orders (last 5)
    const recentOrders = orders.slice(0, 5);

    // Get top products (by featured flag for now, or first few)
    const topProducts = products.filter(p => p.isFeatured).slice(0, 3);
    if (topProducts.length < 3) {
        topProducts.push(...products.slice(0, 3 - topProducts.length));
    }

    const handleStatusUpdate = async (orderId: string, newStatus: string) => {
        try {
            await updateStatus.mutateAsync({ orderId, status: newStatus });
            toast.success('تم تحديث الحالة بنجاح');
        } catch (error) {
            console.error(error);
            toast.error('فشل تحديث الحالة');
        }
    };

    const StatusSelect = ({ order }: { order: any }) => {
        const [isOpen, setIsOpen] = useState(false);

        const statusColors: any = {
            pending: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
            processing: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
            shipped: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
            delivered: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
            cancelled: 'text-red-400 bg-red-500/10 border-red-500/20',
        };

        const statusLabels: any = {
            pending: 'قيد الانتظار',
            processing: 'قيد المعالجة',
            shipped: 'تم الشحن',
            delivered: 'مكتمل',
            cancelled: 'ملغي',
        };

        return (
            <div className="relative">
                <button
                    onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${statusColors[order.status] || 'text-slate-400 border-white/10'}`}
                >
                    <span className="truncate">{statusLabels[order.status] || order.status}</span>
                    <span className="material-symbols-outlined text-[14px]">expand_more</span>
                </button>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} />
                        <div className="absolute top-full left-0 mt-1 w-32 bg-[#1e2330] border border-white/10 rounded-lg shadow-xl z-20 py-1 overflow-hidden">
                            {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((st) => (
                                <button
                                    key={st}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleStatusUpdate(order.id, st);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full text-right px-4 py-2 text-xs font-medium hover:bg-white/5 transition-colors ${order.status === st ? 'text-primary' : 'text-slate-300'}`}
                                >
                                    {statusLabels[st]}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">جاري تحميل لوحة التحكم...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto flex flex-col gap-8 pb-10">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    {
                        label: 'إجمالي الإيرادات',
                        value: stats.totalRevenue,
                        unit: 'ج.م',
                        icon: 'payments',
                        color: 'primary',
                        sub: `من ${stats.totalOrders} طلب`,
                        trend: 'trending_up'
                    },
                    {
                        label: 'إجمالي الطلبات',
                        value: stats.totalOrders,
                        unit: 'طلب',
                        icon: 'shopping_cart',
                        color: 'blue-400',
                        sub: `${stats.completedOrders} مكتمل`,
                        trend: 'check_circle'
                    },
                    {
                        label: 'إجمالي المنتجات',
                        value: stats.totalProducts,
                        unit: 'منتج',
                        icon: 'inventory',
                        color: 'purple-400',
                        sub: 'في المتجر',
                        trend: 'star'
                    },
                    {
                        label: 'تنبيهات المخزون',
                        value: stats.lowStockProducts,
                        unit: 'منتجات',
                        icon: 'warning',
                        color: 'secondary',
                        sub: 'مخزون منخفض',
                        trend: 'arrow_downward',
                        isAlert: true
                    },
                ].map((item, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={idx}
                        className={`glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-${item.color}/30 transition-all ${item.isAlert ? 'border-l-4 border-l-secondary' : ''}`}
                    >
                        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-${item.color}`}>
                            <span className="material-symbols-outlined text-6xl">{item.icon}</span>
                        </div>
                        <div className="flex flex-col gap-1 relative z-10">
                            <p className="text-slate-400 text-sm font-medium">{item.label}</p>
                            <h3 className="text-2xl font-bold text-white mt-1">
                                {item.value.toLocaleString('ar-EG')} <span className="text-sm font-normal text-slate-500">{item.unit}</span>
                            </h3>
                            <div className={`flex items-center gap-1 mt-2 text-${item.color} text-xs font-bold`}>
                                <span className="material-symbols-outlined text-[16px]">{item.trend}</span>
                                <span>{item.sub}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Main Chart Section */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
                {/* Chart Container */}
                <div className="lg:col-span-2 glass-panel rounded-xl p-6 flex flex-col min-h-[400px]">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">analytics</span>
                                نبض المبيعات
                            </h3>
                            <p className="text-slate-400 text-sm">أداء المتجر خلال الأسبوع الحالي</p>
                        </div>
                        <Link to="/admin/reports" className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-lg border border-white/5 transition-colors">
                            التقارير الكاملة
                        </Link>
                    </div>
                    <div className="flex-1 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dailySalesChart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="dashboardRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#25f4ee" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#25f4ee" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                                <XAxis
                                    dataKey="day"
                                    stroke="#475569"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    dy={10}
                                />
                                <YAxis
                                    stroke="#475569"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : v}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#1e2330',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        fontSize: '12px',
                                        color: '#fff'
                                    }}
                                    itemStyle={{ color: '#25f4ee' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#25f4ee"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#dashboardRevenue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Summary & Quick Stats */}
                <div className="flex flex-col gap-6">
                    <div className="glass-panel rounded-xl p-6 bg-gradient-to-br from-[#1e2330] to-transparent">
                        <h3 className="text-lg font-bold text-white mb-6">حالة المتجر</h3>
                        <div className="space-y-6">
                            {[
                                { label: 'طلبات مكتملة', value: stats.completedOrders, color: 'emerald-400', icon: 'check_circle', bg: 'bg-emerald-500/10' },
                                { label: 'قيد المعالجة', value: stats.pendingOrders, color: 'yellow-400', icon: 'pending', bg: 'bg-yellow-500/10' },
                                { label: 'طلبات ملغية', value: stats.cancelledOrders, color: 'red-400', icon: 'cancel', bg: 'bg-red-500/10' },
                            ].map((s, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`size-10 rounded-xl ${s.bg} flex items-center justify-center text-${s.color}`}>
                                            <span className="material-symbols-outlined">{s.icon}</span>
                                        </div>
                                        <span className="text-slate-300 font-medium">{s.label}</span>
                                    </div>
                                    <span className="text-xl font-bold text-white">{s.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Top Selling Quick View */}
                    <div className="glass-panel rounded-xl p-6 flex-1">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-white">الأكثر مبيعاً</h3>
                            <Link to="/admin/products" className="text-primary text-xs hover:underline">الكل</Link>
                        </div>
                        <div className="space-y-4">
                            {topProducts.slice(0, 3).map((product, index) => (
                                <div key={product.id || index} className="flex items-center gap-3">
                                    <div className="size-10 rounded-lg bg-white/5 overflow-hidden flex-shrink-0">
                                        <img
                                            src={product.images?.find(i => i.isPrimary)?.url || product.images?.[0]?.url || 'https://via.placeholder.com/100'}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-white truncate">{product.name}</p>
                                        <p className="text-[10px] text-slate-500">{parseFloat(product.price).toLocaleString('ar-EG')} ج.م</p>
                                    </div>
                                    <div className="text-emerald-400">
                                        <span className="material-symbols-outlined text-[18px]">trending_up</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Recent Orders Table */}
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="glass-panel rounded-xl overflow-hidden flex flex-col"
            >
                <div className="p-6 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">history</span>
                        الطلبات الأخيرة
                    </h3>
                    <Link to="/admin/orders" className="text-xs text-primary font-bold hover:underline">عرض كل الطلبات</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-white/2 text-slate-500 font-medium border-b border-white/5">
                            <tr>
                                <th className="px-6 py-4 whitespace-nowrap">رقم الطلب</th>
                                <th className="px-6 py-4 whitespace-nowrap">العميل</th>
                                <th className="px-6 py-4 whitespace-nowrap text-center">التاريخ</th>
                                <th className="px-6 py-4 whitespace-nowrap text-center">الحالة</th>
                                <th className="px-6 py-4 whitespace-nowrap">الإجمالي</th>
                                <th className="px-6 py-4 whitespace-nowrap text-center">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/2 text-slate-300">
                            {recentOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2 text-slate-500">
                                            <span className="material-symbols-outlined text-4xl">inbox_customize</span>
                                            <p>لا توجد طلبات معالجة بعد</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                recentOrders.map((order) => (
                                    <tr
                                        key={order.id}
                                        className="hover:bg-white/2 transition-colors group cursor-pointer"
                                        onClick={() => navigate(`/admin/orders?id=${order.id}`)}
                                    >
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-xs text-slate-400 bg-white/5 px-2 py-1 rounded">#{order.orderNumber}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-bold ring-1 ring-primary/20">
                                                    {order.user?.name?.charAt(0) || '?'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-white leading-tight">{order.user?.name || 'غير معروف'}</span>
                                                    <span className="text-[10px] text-slate-500">{order.user?.phone || 'بدون هاتف'}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 font-mono text-[10px] dir-ltr text-center">
                                            {new Date(order.createdAt).toLocaleString('ar-EG', { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap overflow-visible">
                                            <div className="flex justify-center">
                                                <StatusSelect order={order} />
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-white">{parseFloat(order.total || '0').toLocaleString('ar-EG')} ج.م</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.open(`/admin/orders/${order.id}/print`, '_blank');
                                                    }}
                                                    className="size-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 hover:text-primary transition-all text-slate-400 group-hover:scale-110 active:scale-95"
                                                    title="طباعة البوليصة"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">print</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}

export default DashboardOverview;
