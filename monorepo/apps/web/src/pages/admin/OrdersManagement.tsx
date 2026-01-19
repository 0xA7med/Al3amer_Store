import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import TimeAgo from '../../components/TimeAgo';

import { useAdminOrders, useUpdateOrderStatus, useAdminProducts, type Order } from '../../hooks/useAdmin';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: string }> = {
    pending: { color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', label: 'قيد الانتظار', icon: 'pending' },
    processing: { color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', label: 'قيد المعالجة', icon: 'sync' },
    shipped: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'جاري التوصيل', icon: 'local_shipping' },
    delivered: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'مكتمل', icon: 'check_circle' },
    cancelled: { color: 'bg-red-500/10 text-red-400 border-red-500/20', label: 'ملغي', icon: 'cancel' },
};

function formatDate(dateString: string): { date: string; time: string } {
    const date = new Date(dateString);
    return {
        date: date.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }),
        time: date.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };
}

export function OrdersManagement() {
    const { data: ordersData, isLoading } = useAdminOrders({ limit: 100 });
    const updateStatus = useUpdateOrderStatus();
    const orders = ordersData?.data || [];

    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);

    // Status Badge Component
    const StatusBadge = ({ status, orderId }: { status: string, orderId: string }) => {
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

        const handleSelect = (newStatus: string) => {
            if (newStatus !== status) {
                handleStatusChange(orderId, newStatus);
            }
            setIsOpen(false);
        };

        return (
            <div className="relative" ref={ref}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${currentConfig.color} hover:brightness-110`}
                >
                    <span className={`material-symbols-outlined text-[16px] ${status === 'processing' ? 'animate-spin' : ''}`}>
                        {currentConfig.icon}
                    </span>
                    {currentConfig.label}
                    <span className="material-symbols-outlined text-[14px]">expand_more</span>
                </button>

                {isOpen && (
                    <div className="absolute top-full mt-1 left-0 z-40 w-40 bg-[#1e2330] border border-white/10 rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                            <button
                                key={key}
                                onClick={() => handleSelect(key)}
                                className={`w-full text-right px-4 py-2 text-xs font-medium hover:bg-white/5 flex items-center gap-2 ${status === key ? 'text-primary' : 'text-slate-300'}`}
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

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        try {
            await updateStatus.mutateAsync({ orderId, status: newStatus });
        } catch (error) {
            console.error('Failed to update order status:', error);
        }
    };

    // Calculate stats
    const totalOrders = orders.length;
    const processingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
    const completedOrders = orders.filter(o => o.status === 'delivered').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

    const filteredOrders = filterStatus === 'all'
        ? orders
        : orders.filter(o => o.status === filterStatus);

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-400">جاري تحميل الطلبات...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h2 className="text-white text-xl font-bold tracking-tight">إدارة الطلبات</h2>
                    <div className="h-6 w-px bg-white/10 mx-2"></div>
                    <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5">
                        <span className="material-symbols-outlined text-[16px] text-slate-400">calendar_today</span>
                        <span className="text-slate-300 text-xs font-medium">اليوم: {new Date().toLocaleDateString('ar-EG')}</span>
                    </div>
                </div>
                <button
                    onClick={() => setIsCreateOrderOpen(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white transition-all text-sm font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transform hover:-translate-y-0.5"
                >
                    <span className="material-symbols-outlined text-[20px]">add_circle</span>
                    <span>طلب يدوي</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-panel p-5 rounded-xl relative overflow-hidden group hover:border-blue-500/30 transition-all">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-blue-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="size-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                            <span className="material-symbols-outlined">shopping_cart</span>
                        </div>
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-2xl font-extrabold text-white mb-1">{totalOrders}</h3>
                        <p className="text-slate-400 text-xs font-medium">إجمالي الطلبات</p>
                    </div>
                </div>
                <div className="glass-panel p-5 rounded-xl relative overflow-hidden group hover:border-yellow-500/30 transition-all">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-yellow-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="size-10 rounded-lg bg-yellow-500/10 flex items-center justify-center text-yellow-400 border border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                            <span className="material-symbols-outlined">pending_actions</span>
                        </div>
                        {processingOrders > 0 && (
                            <span className="text-xs font-bold text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20 animate-pulse">مطلوب إجراء</span>
                        )}
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-2xl font-extrabold text-white mb-1">{processingOrders}</h3>
                        <p className="text-slate-400 text-xs font-medium">قيد المعالجة</p>
                    </div>
                </div>
                <div className="glass-panel p-5 rounded-xl relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="size-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                            <span className="material-symbols-outlined">check_circle</span>
                        </div>
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-2xl font-extrabold text-white mb-1">{completedOrders}</h3>
                        <p className="text-slate-400 text-xs font-medium">طلبات مكتملة</p>
                    </div>
                </div>
                <div className="glass-panel p-5 rounded-xl relative overflow-hidden group hover:border-red-500/30 transition-all">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-red-500/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="size-10 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                            <span className="material-symbols-outlined">cancel</span>
                        </div>
                    </div>
                    <div className="relative z-10">
                        <h3 className="text-2xl font-extrabold text-white mb-1">{cancelledOrders}</h3>
                        <p className="text-slate-400 text-xs font-medium">ملغية / مرتجعة</p>
                    </div>
                </div>
            </div>

            {/* Filters & Table */}
            <div className="glass-panel rounded-xl overflow-hidden flex flex-col">
                <div className="p-5 flex flex-col xl:flex-row items-center gap-5 justify-between border-b border-white/5 backdrop-blur-xl">
                    <div className="w-full xl:w-auto flex flex-col sm:flex-row gap-4 flex-1">
                        <div className="relative flex-1 max-w-md group">
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                                <span className="material-symbols-outlined">search</span>
                            </div>
                            <input
                                type="text"
                                placeholder="بحث برقم الطلب، اسم العميل، الهاتف..."
                                className="block w-full h-11 pr-10 pl-4 rounded-lg bg-[#0f1115]/50 border border-white/10 text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-primary focus:border-primary focus:bg-[#0f1115] transition-all shadow-inner"
                            />
                        </div>
                        <div className="flex items-center gap-1 bg-[#0f1115]/50 rounded-lg border border-white/10 p-1 overflow-x-auto max-w-full no-scrollbar">
                            <button onClick={() => setFilterStatus('all')} className={`px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${filterStatus === 'all' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>الكل</button>
                            <button onClick={() => setFilterStatus('processing')} className={`px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${filterStatus === 'processing' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>قيد المعالجة</button>
                            <button onClick={() => setFilterStatus('shipped')} className={`px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${filterStatus === 'shipped' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>جاري التوصيل</button>
                            <button onClick={() => setFilterStatus('delivered')} className={`px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${filterStatus === 'delivered' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>مكتمل</button>
                            <button onClick={() => setFilterStatus('cancelled')} className={`px-4 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap ${filterStatus === 'cancelled' ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>ملغي</button>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
                        <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0f1115] border border-white/10 text-slate-300 hover:text-white hover:border-primary/50 transition-all text-sm font-medium">
                            <span className="material-symbols-outlined text-[20px]">download</span>
                            <span>تصدير</span>
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right border-collapse">
                        <thead className="bg-white/[0.02] border-b border-white/5 text-slate-400 font-medium">
                            <tr>
                                <th className="px-6 py-4 w-10">
                                    <input type="checkbox" className="rounded border-slate-600 bg-transparent text-primary focus:ring-primary size-4" />
                                </th>
                                <th className="px-6 py-4 whitespace-nowrap font-bold text-slate-300">رقم الطلب</th>
                                <th className="px-6 py-4 whitespace-nowrap font-bold text-slate-300">العميل</th>
                                <th className="px-6 py-4 whitespace-nowrap font-bold text-slate-300">المنتجات</th>
                                <th className="px-6 py-4 whitespace-nowrap font-bold text-slate-300">التاريخ</th>
                                <th className="px-6 py-4 whitespace-nowrap font-bold text-slate-300">الحالة</th>
                                <th className="px-6 py-4 whitespace-nowrap font-bold text-slate-300">الدفع</th>
                                <th className="px-6 py-4 whitespace-nowrap font-bold text-slate-300">الإجمالي</th>
                                <th className="px-6 py-4 whitespace-nowrap text-left font-bold text-slate-300">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-300">
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-12 text-center text-slate-500">
                                        <span className="material-symbols-outlined text-4xl mb-2 block">shopping_bag</span>
                                        لا توجد طلبات تطابق البحث
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => {
                                    const productCount = order.items?.length || 0;
                                    const firstProduct = order.items?.[0];

                                    return (
                                        <tr key={order.id} className="hover:bg-white/5 transition-colors group relative">
                                            <td className="px-6 py-4">
                                                <input type="checkbox" className="rounded border-slate-600 bg-transparent text-primary focus:ring-primary size-4" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <Link to={`/admin/orders/${order.id}`}>
                                                    <span className="font-mono text-primary font-bold bg-primary/10 px-2 py-1 rounded text-xs border border-primary/20 hover:bg-primary/20 transition-colors">#{order.orderNumber}</span>
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-9 rounded-full bg-slate-700 flex items-center justify-center text-white text-sm font-bold ring-2 ring-white/10">
                                                        {order.user?.name?.charAt(0) || '?'}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        {order.user?.id ? (
                                                            <Link to={`/admin/customers/${order.user.id}`} className="text-white font-bold hover:text-primary transition-colors cursor-pointer">
                                                                {order.user?.name || order.fullName || 'أمر غير معروف'}
                                                            </Link>
                                                        ) : (
                                                            <span className="text-white font-bold">{order.user?.name || order.fullName || 'أمر غير معروف'}</span>
                                                        )}
                                                        <span className="text-xs text-slate-500 font-mono" dir="ltr">{order.user?.phone || 'N/A'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs text-slate-400 font-medium">
                                                        {firstProduct?.product?.name || 'منتج'} {productCount > 1 && `+ ${productCount - 1}`}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-400">
                                                <TimeAgo date={order.createdAt} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={order.status} orderId={order.id} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-slate-500 text-[18px]">payments</span>
                                                    <span className="text-xs font-medium text-slate-300">{order.paymentMethod || 'غير محدد'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-bold text-white font-mono text-base">{parseFloat(order.total || '0').toLocaleString('ar-EG')} ج.م</td>
                                            <td className="px-6 py-4 text-left">
                                                <div className="flex items-center justify-end gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                                                    <button className="size-8 flex items-center justify-center rounded-lg hover:bg-primary/20 hover:text-primary text-slate-400 transition-all" title="تعديل">
                                                        <span className="material-symbols-outlined text-[18px]">edit_square</span>
                                                    </button>
                                                    <button className="size-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all" title="طباعة الفاتورة">
                                                        <span className="material-symbols-outlined text-[18px]">print</span>
                                                    </button>
                                                    <button
                                                        onClick={() => setSelectedOrder(order)}
                                                        className="size-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-primary hover:text-white text-slate-300 border border-white/10 transition-all shadow-sm"
                                                        title="عرض التفاصيل"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-panel rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">receipt_long</span>
                                    تفاصيل الطلب #{selectedOrder.orderNumber}
                                </h3>
                                <p className="text-sm text-slate-500 mt-1">{formatDate(selectedOrder.createdAt).date} - {formatDate(selectedOrder.createdAt).time}</p>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="size-10 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-6">
                            {/* Customer Info */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="bg-white/5 rounded-lg p-4">
                                    <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px] text-primary">person</span>
                                        معلومات العميل
                                    </h4>
                                    <p className="text-white font-medium">{selectedOrder.fullName || selectedOrder.user?.name || 'غير معروف'}</p>
                                    <p className="text-sm text-slate-400">{selectedOrder.phone || selectedOrder.user?.phone}</p>
                                    <p className="text-sm text-slate-400">{selectedOrder.email || selectedOrder.user?.email}</p>
                                </div>
                                <div className="bg-white/5 rounded-lg p-4">
                                    <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-[18px] text-primary">location_on</span>
                                        عنوان التوصيل
                                    </h4>
                                    <p className="text-white font-medium">{selectedOrder.governorate}, {selectedOrder.city}</p>
                                    <p className="text-sm text-slate-400">{selectedOrder.address}</p>
                                    {selectedOrder.notes && <p className="text-xs text-slate-500 mt-2">ملاحظات: {selectedOrder.notes}</p>}
                                </div>
                            </div>

                            {/* Order Items */}
                            <div>
                                <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[18px] text-primary">shopping_bag</span>
                                    المنتجات ({selectedOrder.items?.length || 0})
                                </h4>
                                <div className="space-y-2">
                                    {selectedOrder.items?.map((item, idx) => (
                                        <div key={item.id || idx} className="flex items-center gap-4 bg-white/5 rounded-lg p-3">
                                            <div className="size-12 rounded bg-slate-800 flex items-center justify-center overflow-hidden">
                                                {item.product?.images?.[0]?.url ? (
                                                    <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="material-symbols-outlined text-slate-600">image</span>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white font-medium truncate">{item.name || item.product?.name || 'منتج'}</p>
                                                <p className="text-xs text-slate-500">الكمية: {item.quantity}</p>
                                            </div>
                                            <p className="text-white font-bold">{parseFloat(item.price || '0').toLocaleString('ar-EG')} ج.م</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="border-t border-white/5 pt-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">المجموع الفرعي</span>
                                    <span className="text-white">{parseFloat(selectedOrder.subtotal || '0').toLocaleString('ar-EG')} ج.م</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400">الشحن</span>
                                    <span className="text-white">{parseFloat(selectedOrder.shippingCost || '0').toLocaleString('ar-EG')} ج.م</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold border-t border-white/5 pt-2">
                                    <span className="text-primary">الإجمالي</span>
                                    <span className="text-white">{parseFloat(selectedOrder.total || '0').toLocaleString('ar-EG')} ج.م</span>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-white/5 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg text-sm font-bold transition-all border border-white/10"
                            >
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Order Modal */}
            {isCreateOrderOpen && (
                <CreateOrderModal onClose={() => setIsCreateOrderOpen(false)} />
            )}
        </div>
    );
}

export default OrdersManagement;

function CreateOrderModal({ onClose }: { onClose: () => void }) {
    const [customer, setCustomer] = useState({ name: '', phone: '', address: '', city: 'Cairo', governorate: 'Cairo' });
    const [cart, setCart] = useState<{ product: any, quantity: number }[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const { data: productsData } = useAdminProducts({ search: searchTerm, limit: 5 });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // For now simple implementation:
    const addToCart = (product: any) => {
        setCart([...cart, { product, quantity: 1 }]);
        setSearchTerm('');
    };

    const removeFromCart = (idx: number) => {
        setCart(cart.filter((_, i) => i !== idx));
    };

    const updateQuantity = (idx: number, delta: number) => {
        const newCart = [...cart];
        newCart[idx].quantity = Math.max(1, newCart[idx].quantity + delta);
        setCart(newCart);
    };

    const total = cart.reduce((sum, item) => sum + (Number(item.product.price) * item.quantity), 0);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // Simplified order payload
            const orderPayload = {
                fullName: customer.name,
                phone: customer.phone,
                address: customer.address,
                city: customer.city,
                governorate: customer.governorate,
                paymentMethod: 'cod',
                items: cart.map(item => ({
                    productId: item.product.id,
                    quantity: item.quantity
                }))
            };

            await api.post('/orders', orderPayload); // Assuming /orders public endpoint works or admin one
            toast.success('تم إنشاء الطلب بنجاح');
            onClose();
            // Invalidate? Need useQueryClient.
            // window.location.reload(); // Quick fix or pass invalidate function
        } catch (error) {
            console.error(error);
            toast.error('فشل إنشاء الطلب');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-panel rounded-xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">إنشاء طلب جديد</h3>
                    <button onClick={onClose}><span className="material-symbols-outlined text-slate-400 hover:text-white">close</span></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Customer Info */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-primary uppercase tracking-wider">بيانات العميل</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <input value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} placeholder="الاسم بالكامل" className="px-4 py-2 bg-white/5 rounded-lg text-white border border-white/10" />
                            <input value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })} placeholder="رقم الهاتف" className="px-4 py-2 bg-white/5 rounded-lg text-white border border-white/10" />
                            <input value={customer.address} onChange={e => setCustomer({ ...customer, address: e.target.value })} placeholder="العنوان" className="px-4 py-2 bg-white/5 rounded-lg text-white border border-white/10 col-span-2" />
                        </div>
                    </div>

                    {/* Product Search */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-primary uppercase tracking-wider">المنتجات</h4>
                        <div className="relative">
                            <input
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="بحث عن منتج..."
                                className="w-full px-4 py-3 bg-white/5 rounded-lg text-white border border-white/10 focus:ring-1 focus:ring-primary"
                            />
                            {searchTerm && productsData?.data && (
                                <div className="absolute top-full left-0 w-full bg-[#1e2330] border border-white/10 rounded-lg mt-1 shadow-xl z-10 max-h-60 overflow-y-auto">
                                    {productsData.data.map(product => (
                                        <div key={product.id} onClick={() => addToCart(product)} className="p-3 hover:bg-white/5 cursor-pointer flex items-center gap-3 border-b border-white/5 last:border-0">
                                            {product.images?.[0]?.url && <img src={product.images[0].url} className="size-8 rounded object-cover" />}
                                            <div className="flex-1">
                                                <div className="text-white text-sm font-bold">{product.name}</div>
                                                <div className="text-slate-400 text-xs">{product.price} ج.م | المخزون: {product.stock}</div>
                                            </div>
                                            <span className="material-symbols-outlined text-primary">add_circle</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Cart Items */}
                        <div className="space-y-2">
                            {cart.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4 bg-white/5 p-3 rounded-lg">
                                    <div className="flex-1 text-white font-medium">{item.product.name}</div>
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => updateQuantity(idx, -1)} className="size-6 rounded bg-white/10 flex items-center justify-center">-</button>
                                        <span className="text-white w-6 text-center">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(idx, 1)} className="size-6 rounded bg-white/10 flex items-center justify-center">+</button>
                                    </div>
                                    <div className="text-white font-bold w-20 text-left">{(item.quantity * Number(item.product.price)).toLocaleString()} ج.م</div>
                                    <button onClick={() => removeFromCart(idx)} className="text-red-400 hover:text-red-300"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between items-center pt-4 border-t border-white/10">
                            <span className="text-lg font-bold text-white">الإجمالي</span>
                            <span className="text-2xl font-bold text-primary">{total.toLocaleString()} ج.م</span>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-white/5 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2 rounded-lg text-slate-300 hover:bg-white/5">إلغاء</button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting || cart.length === 0 || !customer.name}
                        className="px-6 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white font-bold disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSubmitting && <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        إنشاء الطلب
                    </button>
                </div>
            </div>
        </div>
    );
}
