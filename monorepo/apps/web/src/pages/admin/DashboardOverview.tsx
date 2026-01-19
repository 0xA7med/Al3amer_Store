import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDashboardStats, useUpdateOrderStatus } from '../../hooks/useAdmin';
import TimeAgo from '../../components/TimeAgo';

// Status configuration for dropdown
const STATUS_CONFIG: Record<string, { color: string; label: string; icon: string }> = {
    pending: { color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', label: 'قيد الانتظار', icon: 'pending' },
    processing: { color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', label: 'قيد المعالجة', icon: 'sync' },
    shipped: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'جاري التوصيل', icon: 'local_shipping' },
    delivered: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'مكتمل', icon: 'check_circle' },
    cancelled: { color: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'ملغي', icon: 'cancel' },
};

export function DashboardOverview() {
    const { stats, isLoading, products, orders } = useDashboardStats();
    const updateStatus = useUpdateOrderStatus();

    // Get recent orders (last 5)
    const recentOrders = orders.slice(0, 5);

    // Get top products (by featured flag for now, or first few)
    const topProducts = products.filter(p => p.isFeatured).slice(0, 3);
    if (topProducts.length < 3) {
        topProducts.push(...products.slice(0, 3 - topProducts.length));
    }

    // Notifications: New orders and low stock alerts
    const newOrdersCount = orders.filter(o => o.status === 'pending').length;
    const lowStockProducts = products.filter(p => p.stock < 10).slice(0, 3);

    // Quick Status Change Component
    const StatusBadge = ({ status, orderId }: { status: string; orderId: string }) => {
        const [isOpen, setIsOpen] = useState(false);
        const ref = useRef<HTMLDivElement>(null);

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (ref.current && !ref.current.contains(event.target as Node)) {
                    setIsOpen(false);
                }
            };
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, []);

        const currentConfig = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

        const handleSelect = async (newStatus: string) => {
            if (newStatus !== status) {
                await updateStatus.mutateAsync({ orderId, status: newStatus });
            }
            setIsOpen(false);
        };

        return (
            <div className="relative" ref={ref}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-all ${currentConfig.color} hover:brightness-110`}
                >
                    <span className={`material-symbols-outlined text-[14px] ${status === 'processing' ? 'animate-spin' : ''}`}>
                        {currentConfig.icon}
                    </span>
                    {currentConfig.label}
                    <span className="material-symbols-outlined text-[12px]">expand_more</span>
                </button>

                {isOpen && (
                    <div className="absolute top-full mt-1 right-0 z-50 w-36 bg-[#1e2330] border border-white/10 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                            <button
                                key={key}
                                onClick={() => handleSelect(key)}
                                className={`w-full text-right px-3 py-2 text-xs font-medium hover:bg-white/5 flex items-center gap-2 ${status === key ? 'text-primary' : 'text-slate-300'}`}
                            >
                                <span className="material-symbols-outlined text-[14px]">
                                    {config.icon}
                                </span>
                                {config.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // Print AWB Handler
    const handlePrintAWB = (order: any) => {
        const printWindow = window.open('', '_blank', 'width=400,height=600');
        if (!printWindow) return;

        const awbContent = `
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <title>بوليصة الشحن - طلب #${order.orderNumber}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Segoe UI', Tahoma, sans-serif; }
                    body { padding: 20px; background: #fff; }
                    .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 15px; margin-bottom: 15px; }
                    .logo { font-size: 24px; font-weight: bold; color: #135bec; }
                    .order-num { font-size: 14px; color: #666; margin-top: 5px; }
                    .barcode { text-align: center; padding: 20px 0; border-bottom: 2px dashed #000; margin-bottom: 15px; }
                    .barcode-text { font-family: 'Libre Barcode 39', monospace; font-size: 48px; letter-spacing: 5px; }
                    .barcode-id { font-size: 12px; color: #666; margin-top: 5px; }
                    .section { margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee; }
                    .section-title { font-size: 12px; color: #666; margin-bottom: 8px; font-weight: bold; }
                    .section-content { font-size: 14px; line-height: 1.6; }
                    .items { background: #f5f5f5; padding: 10px; border-radius: 5px; }
                    .item { display: flex; justify-content: space-between; padding: 5px 0; }
                    .total { font-size: 18px; font-weight: bold; text-align: center; padding: 15px; background: #f0f0f0; border-radius: 5px; }
                    .footer { text-align: center; font-size: 10px; color: #999; margin-top: 20px; }
                    @media print { body { padding: 10px; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo">Al3amer Store</div>
                    <div class="order-num">طلب رقم: #${order.orderNumber}</div>
                </div>
                
                <div class="barcode">
                    <div class="barcode-text">*${order.orderNumber}*</div>
                    <div class="barcode-id">${order.orderNumber}</div>
                </div>
                
                <div class="section">
                    <div class="section-title">بيانات المستلم</div>
                    <div class="section-content">
                        <strong>${order.user?.name || order.fullName || 'غير محدد'}</strong><br>
                        ${order.user?.phone || order.phone || 'N/A'}<br>
                        ${order.governorate || ''}, ${order.city || ''}<br>
                        ${order.address || ''}
                    </div>
                </div>
                
                <div class="section">
                    <div class="section-title">المنتجات</div>
                    <div class="items">
                        ${(order.items || []).map((item: any) => `
                            <div class="item">
                                <span>${item.product?.name || item.name || 'منتج'} × ${item.quantity}</span>
                                <span>${parseFloat(item.price || '0').toLocaleString('ar-EG')} ج.م</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="total">
                    الإجمالي: ${parseFloat(order.total || '0').toLocaleString('ar-EG')} ج.م
                    <br>
                    <small style="color: #666;">الدفع: ${order.paymentMethod === 'cod' ? 'عند الاستلام' : 'مدفوع إلكترونياً'}</small>
                </div>
                
                <div class="footer">
                    تاريخ الطباعة: ${new Date().toLocaleDateString('ar-EG')} - Al3amer Store
                </div>
                
                <script>
                    window.onload = function() { window.print(); }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(awbContent);
        printWindow.document.close();
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
        <div className="max-w-7xl mx-auto flex flex-col gap-8">
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

            {/* Main Content Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Order Status Summary */}
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

                {/* Quick Actions & Notifications */}
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

                    {/* Notifications Widget */}
                    <div className="glass-panel rounded-xl p-6 flex-1">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">notifications</span>
                            التنبيهات
                        </h3>
                        <div className="flex flex-col gap-3">
                            {newOrdersCount > 0 && (
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                    <div className="size-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                                        <span className="material-symbols-outlined">shopping_bag</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white text-sm font-bold">{newOrdersCount} طلبات جديدة</p>
                                        <p className="text-slate-400 text-xs">تتطلب المراجعة</p>
                                    </div>
                                    <Link to="/admin/orders" className="text-blue-400 hover:text-blue-300">
                                        <span className="material-symbols-outlined">arrow_forward</span>
                                    </Link>
                                </div>
                            )}
                            {lowStockProducts.length > 0 && (
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                                    <div className="size-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400">
                                        <span className="material-symbols-outlined">inventory_2</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white text-sm font-bold">{lowStockProducts.length} منتجات مخزون منخفض</p>
                                        <p className="text-slate-400 text-xs truncate">
                                            {lowStockProducts.map(p => p.name).join('، ')}
                                        </p>
                                    </div>
                                    <Link to="/admin/products" className="text-yellow-400 hover:text-yellow-300">
                                        <span className="material-symbols-outlined">arrow_forward</span>
                                    </Link>
                                </div>
                            )}
                            {newOrdersCount === 0 && lowStockProducts.length === 0 && (
                                <div className="text-center py-6 text-slate-500">
                                    <span className="material-symbols-outlined text-3xl mb-2 block">check_circle</span>
                                    <p className="text-sm">لا توجد تنبيهات</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Enhanced Recent Orders Table */}
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
                                <th className="px-6 py-4 whitespace-nowrap">الإجمالي</th>
                                <th className="px-6 py-4 whitespace-nowrap">الحالة</th>
                                <th className="px-6 py-4 whitespace-nowrap text-left">إجراءات</th>
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
                                    <tr key={order.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <Link
                                                to={`/admin/orders/${order.id}`}
                                                className="font-mono text-primary font-bold bg-primary/10 px-2 py-1 rounded text-xs border border-primary/20 hover:bg-primary/20 transition-colors"
                                            >
                                                #{order.orderNumber}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4">
                                            <Link
                                                to={`/admin/customers/${order.user?.id || ''}`}
                                                className="flex items-center gap-3 hover:text-primary transition-colors"
                                            >
                                                <div className="size-8 rounded-full bg-slate-700 flex items-center justify-center text-white text-sm font-bold">
                                                    {order.user?.name?.charAt(0) || '?'}
                                                </div>
                                                <span>{order.user?.name || 'غير معروف'}</span>
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400">
                                            <TimeAgo date={order.createdAt} />
                                        </td>
                                        <td className="px-6 py-4 font-bold text-white">
                                            {parseFloat(order.total || '0').toLocaleString('ar-EG')} ج.م
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge status={order.status} orderId={order.id} />
                                        </td>
                                        <td className="px-6 py-4 text-left">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handlePrintAWB(order)}
                                                    className="size-8 flex items-center justify-center rounded-lg hover:bg-blue-500/20 hover:text-blue-400 text-slate-400 transition-all"
                                                    title="طباعة بوليصة الشحن"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                                                </button>
                                                <button
                                                    className="size-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                                                    title="طباعة الفاتورة"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">print</span>
                                                </button>
                                                <Link
                                                    to={`/admin/orders/${order.id}`}
                                                    className="size-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-primary hover:text-white text-slate-300 border border-white/10 transition-all"
                                                    title="عرض التفاصيل"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                </Link>
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

