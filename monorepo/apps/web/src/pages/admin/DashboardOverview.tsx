import { Link, useNavigate } from 'react-router-dom';
import { useDashboardStats, useUpdateOrderStatus } from '../../hooks/useAdmin';

import { useState } from 'react';
import toast from 'react-hot-toast';

export function DashboardOverview() {
    const { stats, isLoading, products, orders } = useDashboardStats();
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
                {/* Stat 1 - Revenue */}
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-primary/30 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-primary">payments</span>
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <p className="text-slate-400 text-sm font-medium">إجمالي الإيرادات</p>
                        <h3 className="text-2xl font-bold text-white mt-1">
                            {stats.totalRevenue.toLocaleString('ar-EG')} <span className="text-sm font-normal text-slate-500">ج.م</span>
                        </h3>
                        <div className="flex items-center gap-1 mt-2 text-emerald-400 text-xs font-bold">
                            <span className="material-symbols-outlined text-[16px]">trending_up</span>
                            <span>من {stats.totalOrders} طلب</span>
                        </div>
                    </div>
                </div>
                {/* Stat 2 - Orders */}
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-primary/30 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-blue-400">shopping_cart</span>
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <p className="text-slate-400 text-sm font-medium">إجمالي الطلبات</p>
                        <h3 className="text-2xl font-bold text-white mt-1">{stats.totalOrders} <span className="text-sm font-normal text-slate-500">طلب</span></h3>
                        <div className="flex items-center gap-1 mt-2 text-emerald-400 text-xs font-bold">
                            <span className="material-symbols-outlined text-[16px]">check_circle</span>
                            <span>{stats.completedOrders} مكتمل</span>
                        </div>
                    </div>
                </div>
                {/* Stat 3 - Products */}
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-primary/30 transition-all">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-purple-400">inventory</span>
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <p className="text-slate-400 text-sm font-medium">إجمالي المنتجات</p>
                        <h3 className="text-2xl font-bold text-white mt-1">{stats.totalProducts} <span className="text-sm font-normal text-slate-500">منتج</span></h3>
                        <div className="flex items-center gap-1 mt-2 text-blue-400 text-xs font-bold">
                            <span className="material-symbols-outlined text-[16px]">star</span>
                            <span>في المتجر</span>
                        </div>
                    </div>
                </div>
                {/* Stat 4 - Alerts */}
                <div className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-secondary/30 transition-all border-l-4 border-l-secondary">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <span className="material-symbols-outlined text-6xl text-secondary">warning</span>
                    </div>
                    <div className="flex flex-col gap-1 relative z-10">
                        <p className="text-slate-400 text-sm font-medium">تنبيهات المخزون</p>
                        <h3 className="text-2xl font-bold text-white mt-1">{stats.lowStockProducts} <span className="text-sm font-normal text-slate-500">منتجات</span></h3>
                        <div className="flex items-center gap-1 mt-2 text-secondary text-xs font-bold">
                            <span className="material-symbols-outlined text-[16px]">arrow_downward</span>
                            <span>مخزون منخفض</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Chart Container */}
                <div className="lg:col-span-2 glass-panel rounded-xl p-6 flex flex-col">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-white">ملخص النشاط</h3>
                            <p className="text-slate-400 text-sm">إحصائيات المتجر</p>
                        </div>
                    </div>
                    <div className="flex-1 min-h-[200px] flex items-center justify-center">
                        <div className="text-center">
                            <div className="grid grid-cols-3 gap-8">
                                <div className="text-center">
                                    <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-3">
                                        <span className="material-symbols-outlined text-4xl">check_circle</span>
                                    </div>
                                    <h4 className="text-2xl font-bold text-white">{stats.completedOrders}</h4>
                                    <p className="text-slate-400 text-sm">طلبات مكتملة</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-20 h-20 mx-auto rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-400 mb-3">
                                        <span className="material-symbols-outlined text-4xl">pending</span>
                                    </div>
                                    <h4 className="text-2xl font-bold text-white">{stats.pendingOrders}</h4>
                                    <p className="text-slate-400 text-sm">قيد المعالجة</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-20 h-20 mx-auto rounded-full bg-red-500/10 flex items-center justify-center text-red-400 mb-3">
                                        <span className="material-symbols-outlined text-4xl">cancel</span>
                                    </div>
                                    <h4 className="text-2xl font-bold text-white">{stats.cancelledOrders}</h4>
                                    <p className="text-slate-400 text-sm">ملغية</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Selling / Quick Actions */}
                <div className="flex flex-col gap-6">
                    {/* Quick Actions */}
                    <div className="glass-panel rounded-xl p-6">
                        <h3 className="text-lg font-bold text-white mb-4">إجراءات سريعة</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <Link to="/admin/products/add" className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20">
                                <span className="material-symbols-outlined">add_box</span>
                                <span className="text-xs font-bold">إضافة منتج</span>
                            </Link>
                            <Link to="/admin/orders" className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-[#161b26] text-slate-300 hover:text-white hover:bg-[#1e2736] transition-colors border border-white/5">
                                <span className="material-symbols-outlined">receipt_long</span>
                                <span className="text-xs font-bold">إدارة الطلبات</span>
                            </Link>
                            <Link to="/admin/customers" className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-[#161b26] text-slate-300 hover:text-white hover:bg-[#1e2736] transition-colors border border-white/5">
                                <span className="material-symbols-outlined">person_add</span>
                                <span className="text-xs font-bold">العملاء</span>
                            </Link>
                            <Link to="/admin/products" className="flex flex-col items-center justify-center gap-2 p-4 rounded-lg bg-[#161b26] text-slate-300 hover:text-white hover:bg-[#1e2736] transition-colors border border-white/5">
                                <span className="material-symbols-outlined">inventory</span>
                                <span className="text-xs font-bold">جرد المخزون</span>
                            </Link>
                        </div>
                    </div>
                    {/* Top Product Widget */}
                    <div className="glass-panel rounded-xl p-6 flex-1">
                        <h3 className="text-lg font-bold text-white mb-4">المنتجات المميزة</h3>
                        <div className="flex flex-col gap-4">
                            {topProducts.length === 0 ? (
                                <p className="text-slate-500 text-sm text-center py-4">لا توجد منتجات مميزة</p>
                            ) : (
                                topProducts.map((product, index) => (
                                    <div key={product.id || index} className="flex items-center gap-3 pb-3 border-b border-white/5 last:border-0 last:pb-0">
                                        <div className="size-12 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden">
                                            <img
                                                src={product.images?.find(i => i.isPrimary)?.url || product.images?.[0]?.url || 'https://via.placeholder.com/100'}
                                                alt={product.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-white truncate">{product.name}</p>
                                            <p className="text-xs text-slate-400">{product.category?.name || 'غير مصنف'}</p>
                                        </div>
                                        <p className="text-sm font-bold text-emerald-400">{parseFloat(product.price).toLocaleString('ar-EG')} ج.م</p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Orders Table */}
            <div className="glass-panel rounded-xl overflow-hidden flex flex-col">
                <div className="p-6 border-b border-white/5 flex flex-wrap items-center justify-between gap-4">
                    <h3 className="text-lg font-bold text-white">الطلبات الأخيرة</h3>
                    <Link to="/admin/orders" className="text-sm text-primary font-bold hover:underline">عرض كل الطلبات</Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-white/5 text-slate-400 font-medium">
                            <tr>
                                <th className="px-6 py-4 whitespace-nowrap">رقم الطلب</th>
                                <th className="px-6 py-4 whitespace-nowrap">العميل</th>
                                <th className="px-6 py-4 whitespace-nowrap">التاريخ</th>
                                <th className="px-6 py-4 whitespace-nowrap">الحالة</th>
                                <th className="px-6 py-4 whitespace-nowrap">الإجمالي</th>
                                <th className="px-6 py-4 whitespace-nowrap">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-300">
                            {recentOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        لا توجد طلبات بعد
                                    </td>
                                </tr>
                            ) : (
                                recentOrders.map((order) => (
                                    <tr
                                        key={order.id}
                                        className="hover:bg-white/5 transition-colors group cursor-pointer"
                                        onClick={() => navigate(`/admin/orders?id=${order.id}`)}
                                    >
                                        <td className="px-6 py-4 font-medium text-white hover:text-primary transition-colors">
                                            #{order.orderNumber}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="size-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-sm font-bold">
                                                    {order.user?.name?.charAt(0) || '?'}
                                                </div>
                                                <span className="hover:text-primary transition-colors">{order.user?.name || 'غير معروف'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 font-mono text-xs dir-ltr text-right">
                                            {new Date(order.createdAt).toLocaleString('ar-EG', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusSelect order={order} />
                                        </td>
                                        <td className="px-6 py-4 font-bold text-white">{parseFloat(order.total || '0').toLocaleString('ar-EG')} ج.م</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        window.open(`/admin/orders/${order.id}/print`, '_blank');
                                                    }}
                                                    className="size-8 flex items-center justify-center rounded-lg hover:bg-white/10 hover:text-primary transition-all text-slate-400"
                                                    title="طباعة البوليصة"
                                                >
                                                    <span className="material-symbols-outlined text-[20px]">print</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default DashboardOverview;
