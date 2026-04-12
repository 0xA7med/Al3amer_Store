import { Link } from 'react-router-dom';
import { useDashboardStats, type Order } from '../../hooks/useAdmin';
import { useAdminReports } from '../../hooks/useAdminReports';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { motion } from 'framer-motion';
import { useState } from 'react';
import OrdersTable from '../../components/admin/OrdersTable';
import OrderDetailsModal from '../../components/admin/OrderDetailsModal';

export function DashboardOverview() {
    const { stats, isLoading, products, orders } = useDashboardStats();
    const { dailySalesChart } = useAdminReports('week');

    // ── In-page modal state (Phase 2 Fix) ──
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsDetailsOpen(true);
    };

    const handleCloseDetails = () => {
        setIsDetailsOpen(false);
        setSelectedOrder(null);
    };

    // Recent orders (last 5) — fetched by the stats endpoint
    const recentOrders = orders.slice(0, 5);

    // Top products by featured flag (filtering for ACTIVE only)
    const activeProducts = products.filter(p => p.status === 'active');
    const topProducts = activeProducts.filter(p => p.isFeatured).slice(0, 3);
    if (topProducts.length < 3) {
        const remaining = activeProducts.filter(p => !topProducts.find(tp => tp.id === p.id)).slice(0, 3 - topProducts.length);
        topProducts.push(...remaining);
    }

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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                    { label: 'إجمالي الإيرادات',  value: stats.totalRevenue,    unit: 'ج.م',     icon: 'payments',      color: 'primary',    sub: `من ${stats.totalOrders} طلب`,         trend: 'trending_up' },
                    { label: 'إجمالي الطلبات',    value: stats.totalOrders,     unit: 'طلب',    icon: 'shopping_cart', color: 'blue-400',   sub: `${stats.completedOrders} مكتمل`,      trend: 'check_circle' },
                    { label: 'إجمالي المنتجات',   value: stats.totalProducts,   unit: 'منتج',   icon: 'inventory',     color: 'purple-400', sub: 'في المتجر',                            trend: 'star' },
                    { label: 'تنبيهات المخزون',  value: stats.lowStockProducts, unit: 'منتجات', icon: 'warning',      color: 'secondary',  sub: 'مخزون منخفض',                         trend: 'arrow_downward', isAlert: true },
                ].map((item, idx) => (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                        key={idx}
                        className={`glass-panel rounded-xl p-3 md:p-6 relative overflow-hidden group hover:border-${item.color}/30 transition-all ${item.isAlert ? 'border-l-4 border-l-secondary' : ''}`}
                    >
                        <div className={`absolute top-0 right-0 p-2 md:p-4 opacity-5 md:opacity-10 group-hover:opacity-20 transition-opacity text-${item.color}`}>
                            <span className="material-symbols-outlined text-4xl md:text-6xl">{item.icon}</span>
                        </div>
                        <div className="flex flex-col gap-0.5 md:gap-1 relative z-10">
                            <p className="text-slate-500 md:text-slate-400 text-[10px] md:text-sm font-bold truncate">{item.label}</p>
                            <h3 className="text-lg md:text-2xl font-black text-white mt-0.5">
                                {item.value.toLocaleString('ar-EG')} <span className="text-[10px] md:text-sm font-normal text-slate-500">{item.unit}</span>
                            </h3>
                            <div className={`flex items-center gap-1 mt-1 md:mt-2 text-${item.color} text-[10px] md:text-xs font-bold`}>
                                <span className="material-symbols-outlined text-[14px] md:text-[16px]">{item.trend}</span>
                                <span className="truncate">{item.sub}</span>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Chart + Quick Stats */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
                {/* Sales Chart */}
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
                                <XAxis dataKey="day" stroke="#475569" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                <YAxis stroke="#475569" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => v >= 1000 ? `${v / 1000}k` : v} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#1e2330', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px', color: '#fff' }}
                                    itemStyle={{ color: '#25f4ee' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#25f4ee" strokeWidth={3} fillOpacity={1} fill="url(#dashboardRevenue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Summary + Top Sellers */}
                <div className="flex flex-col gap-6">
                    <div className="glass-panel rounded-xl p-6 bg-gradient-to-br from-[#1e2330] to-transparent">
                        <h3 className="text-lg font-bold text-white mb-6">حالة المتجر</h3>
                        <div className="space-y-6">
                            {[
                                { label: 'طلبات مكتملة', value: stats.completedOrders, color: 'emerald-400', icon: 'check_circle', bg: 'bg-emerald-500/10' },
                                { label: 'قيد المعالجة', value: stats.pendingOrders,   color: 'yellow-400', icon: 'pending',       bg: 'bg-yellow-500/10' },
                                { label: 'طلبات ملغية',  value: stats.cancelledOrders, color: 'red-400',    icon: 'cancel',        bg: 'bg-red-500/10' },
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

                    {/* Top Selling */}
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

            {/* Recent Orders Table — uses SharedOrdersTable */}
            <motion.div
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
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
                    {/* No checkboxes, no delete, no payment col in dashboard widget */}
                    <OrdersTable
                        orders={recentOrders}
                        onViewDetails={handleViewDetails}
                        showCheckboxes={false}
                        showPayment={true}
                    />
                </div>
            </motion.div>

            {/* In-page Order Details Modal — NO redirect (Phase 2 Fix) */}
            {isDetailsOpen && selectedOrder && (
                <OrderDetailsModal order={selectedOrder} onClose={handleCloseDetails} />
            )}
        </div>
    );
}

export default DashboardOverview;
