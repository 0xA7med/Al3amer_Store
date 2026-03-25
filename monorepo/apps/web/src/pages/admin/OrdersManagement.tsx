import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useAdminOrders, useUpdateOrderStatus, useAdminProducts, useBulkDeleteOrders, useBulkUpdateOrdersStatus, type Order } from '../../hooks/useAdmin';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import OrdersTable, { STATUS_CONFIG } from '../../components/admin/OrdersTable';
import OrderDetailsModal from '../../components/admin/OrderDetailsModal';

export default function OrdersManagement() {
    // Hooks
    const [searchParams, setSearchParams] = useSearchParams();
    const { data: ordersData, isLoading } = useAdminOrders();
    const orders = ordersData?.data || [];
    const bulkDelete = useBulkDeleteOrders();
    const bulkUpdateStatus = useBulkUpdateOrdersStatus();

    // State
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [selectedRows, setSelectedRows] = useState<string[]>([]);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
    const [isBulkStatusOpen, setIsBulkStatusOpen] = useState(false);
    const bulkDropdownRef = useRef<HTMLDivElement>(null);

    // Sync URL param → open modal
    useEffect(() => {
        const orderId = searchParams.get('id');
        if (orderId && orders.length > 0) {
            const order = orders.find(o => o.id === orderId);
            if (order) { setSelectedOrder(order); setIsDetailsOpen(true); }
        }
    }, [searchParams, orders]);

    // Click-outside for bulk dropdown
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (bulkDropdownRef.current && !bulkDropdownRef.current.contains(e.target as Node))
                setIsBulkStatusOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleCloseDetails = () => {
        setIsDetailsOpen(false);
        setSelectedOrder(null);
        setSearchParams(p => { p.delete('id'); return p; });
    };

    const handleViewDetails = (order: Order) => {
        setSelectedOrder(order);
        setIsDetailsOpen(true);
        setSearchParams({ id: order.id });
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedRows(e.target.checked ? filteredOrders.map(o => o.id) : []);
    };

    const handleSelectRow = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setSelectedRows(prev =>
            prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = async () => {
        if (window.confirm(`هل أنت متأكد من حذف ${selectedRows.length} طلب؟`)) {
            await bulkDelete.mutateAsync(selectedRows);
            setSelectedRows([]);
        }
    };

    const handleBulkStatusUpdate = async (newStatus: string) => {
        await bulkUpdateStatus.mutateAsync({ orderIds: selectedRows, status: newStatus });
    };

    const handleDelete = (orderId: string) => {
        if (window.confirm('هل أنت متأكد من حذف هذا الطلب؟')) {
            bulkDelete.mutateAsync([orderId]);
        }
    };

    // ─── Stats ───
    const totalOrders     = orders.length;
    const processingOrders = orders.filter(o => o.status === 'pending' || o.status === 'processing').length;
    const completedOrders  = orders.filter(o => o.status === 'delivered').length;
    const cancelledOrders  = orders.filter(o => o.status === 'cancelled').length;

    // ─── Per-status counts for filter tabs ───
    const counts: Record<string, number> = {
        all:        orders.length,
        pending:    orders.filter(o => o.status === 'pending').length,
        processing: orders.filter(o => o.status === 'processing').length,
        shipped:    orders.filter(o => o.status === 'shipped').length,
        delivered:  orders.filter(o => o.status === 'delivered').length,
        cancelled:  orders.filter(o => o.status === 'cancelled').length,
    };

    // ─── Filtered list ───
    const filteredOrders = orders.filter(order => {
        const userIdParam  = searchParams.get('userId');
        const phoneParam   = searchParams.get('phone');

        if (userIdParam && order.user?.id !== userIdParam && (order as any).userId !== userIdParam) return false;
        if (phoneParam && order.phone !== phoneParam && order.user?.phone !== phoneParam) return false;

        const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
        const s = searchTerm.toLowerCase();
        const matchesSearch =
            order.orderNumber.toLowerCase().includes(s) ||
            order.user?.name?.toLowerCase().includes(s) ||
            order.fullName?.toLowerCase().includes(s) ||
            order.phone?.toLowerCase().includes(s) ||
            order.user?.phone?.toLowerCase().includes(s);
        return matchesStatus && matchesSearch;
    });

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
                {[
                    { label: 'إجمالي الطلبات',  value: totalOrders,      icon: 'shopping_cart',  color: 'blue-500',    glow: 'rgba(59,130,246,0.2)' },
                    { label: 'قيد المعالجة',     value: processingOrders, icon: 'pending_actions', color: 'yellow-500', glow: 'rgba(234,179,8,0.2)',  alert: processingOrders > 0 },
                    { label: 'طلبات مكتملة',    value: completedOrders,  icon: 'check_circle',   color: 'emerald-500', glow: 'rgba(16,185,129,0.2)' },
                    { label: 'ملغية / مرتجعة',  value: cancelledOrders,  icon: 'cancel',         color: 'red-500',     glow: 'rgba(239,68,68,0.2)' },
                ].map((card, i) => (
                    <div key={i} className={`glass-panel p-5 rounded-xl relative overflow-hidden group hover:border-${card.color}/30 transition-all`}>
                        <div className={`absolute right-0 top-0 w-24 h-24 bg-${card.color}/10 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110`}></div>
                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div className={`size-10 rounded-lg bg-${card.color}/10 flex items-center justify-center text-${card.color.replace('500', '400')} border border-${card.color}/20`} style={{ boxShadow: `0 0 15px ${card.glow}` }}>
                                <span className="material-symbols-outlined">{card.icon}</span>
                            </div>
                            {card.alert && (
                                <span className="text-xs font-bold text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20 animate-pulse">مطلوب إجراء</span>
                            )}
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-2xl font-extrabold text-white mb-1">{card.value}</h3>
                            <p className="text-slate-400 text-xs font-medium">{card.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters & Table */}
            <div className="glass-panel rounded-xl overflow-hidden flex flex-col">
                {/* Toolbar */}
                <div className="p-5 flex flex-col xl:flex-row items-center gap-5 justify-between border-b border-white/5 backdrop-blur-xl transition-all min-h-[80px]">
                    {selectedRows.length > 0 ? (
                        /* Bulk actions bar */
                        <div className="w-full flex items-center justify-between bg-primary/10 border border-primary/20 rounded-lg p-3 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-3">
                                <span className="flex items-center justify-center size-6 rounded-full bg-primary text-white text-xs font-bold shadow-[0_0_10px_rgba(37,244,238,0.4)]">
                                    {selectedRows.length}
                                </span>
                                <span className="text-white font-bold text-sm">طلب محدد</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative" ref={bulkDropdownRef}>
                                    <button
                                        onClick={() => setIsBulkStatusOpen(!isBulkStatusOpen)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold border transition-all ${isBulkStatusOpen ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 hover:bg-white/10 text-white border-white/10'}`}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">update</span>
                                        تحديث الحالة
                                        <span className={`material-symbols-outlined text-[16px] transition-transform ${isBulkStatusOpen ? 'rotate-180' : ''}`}>expand_more</span>
                                    </button>
                                    {isBulkStatusOpen && (
                                        <div className="absolute top-full mt-2 left-0 w-48 bg-[#1e2330] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                                            <div className="p-2 border-b border-white/5 bg-white/[0.02]">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-2">تغيير الحالة إلى:</span>
                                            </div>
                                            <div className="p-1">
                                                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                                    <button
                                                        key={key}
                                                        onClick={() => { handleBulkStatusUpdate(key); setIsBulkStatusOpen(false); }}
                                                        className="w-full text-right px-3 py-2 text-xs font-bold hover:bg-white/5 rounded-lg flex items-center gap-3 text-slate-300 hover:text-white transition-colors"
                                                    >
                                                        <span className={`material-symbols-outlined text-[18px] ${config.color.split(' ')[1]}`}>{config.icon}</span>
                                                        {config.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <button onClick={handleBulkDelete} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-bold border border-red-500/20 transition-all">
                                    <span className="material-symbols-outlined text-[18px]">delete</span>
                                    حذف المحدد
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="w-full xl:w-auto flex flex-col sm:flex-row gap-4 flex-1">
                                {/* Search */}
                                <div className="relative flex-1 max-w-md group">
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-primary transition-colors">
                                        <span className="material-symbols-outlined">search</span>
                                    </div>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="بحث برقم الطلب، اسم العميل، الهاتف..."
                                        className="block w-full h-11 pr-10 pl-4 rounded-lg bg-[#0f1115]/50 border border-white/10 text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-primary focus:border-primary focus:bg-[#0f1115] transition-all shadow-inner"
                                    />
                                </div>

                                {/* Status Filter Tabs with counts */}
                                <div className="flex items-center gap-1 bg-[#0f1115]/50 rounded-lg border border-white/10 p-1 overflow-x-auto max-w-full no-scrollbar">
                                    {[
                                        { key: 'all',        label: 'الكل' },
                                        { key: 'processing', label: 'قيد المعالجة' },
                                        { key: 'shipped',    label: 'جاري التوصيل' },
                                        { key: 'delivered',  label: 'مكتمل' },
                                        { key: 'cancelled',  label: 'ملغي' },
                                    ].map(tab => (
                                        <button
                                            key={tab.key}
                                            onClick={() => setFilterStatus(tab.key)}
                                            className={`px-3 py-2 rounded-md text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${filterStatus === tab.key ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                                        >
                                            {tab.label}
                                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${filterStatus === tab.key ? 'bg-white/20 text-white' : 'bg-white/5 text-slate-500'}`}>
                                                {counts[tab.key]}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
                                <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0f1115] border border-white/10 text-slate-300 hover:text-white hover:border-primary/50 transition-all text-sm font-medium">
                                    <span className="material-symbols-outlined text-[20px]">download</span>
                                    <span>تصدير</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Table */}
                <div className="overflow-x-auto min-h-[400px]">
                    <OrdersTable
                        orders={filteredOrders}
                        onViewDetails={handleViewDetails}
                        showCheckboxes={true}
                        selectedRows={selectedRows}
                        onSelectRow={handleSelectRow}
                        onSelectAll={handleSelectAll}
                        onDelete={handleDelete}
                        showPayment={true}
                    />
                </div>
            </div>

            {/* Order Details Modal */}
            {isDetailsOpen && selectedOrder && (
                <OrderDetailsModal order={selectedOrder} onClose={handleCloseDetails} />
            )}

            {/* Create Order Modal */}
            {isCreateOrderOpen && (
                <CreateOrderModal onClose={() => setIsCreateOrderOpen(false)} />
            )}
        </div>
    );
}

// ─────────────────────────────────────────────
// CreateOrderModal (unchanged from original)
// ─────────────────────────────────────────────
function CreateOrderModal({ onClose }: { onClose: () => void }) {
    const [customer, setCustomer] = useState({ name: '', phone: '', address: '', city: 'Cairo', governorate: 'Cairo' });
    const [cart, setCart] = useState<{ product: any; quantity: number }[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const { data: productsData } = useAdminProducts({ search: searchTerm, limit: 5 });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const addToCart = (product: any) => { setCart([...cart, { product, quantity: 1 }]); setSearchTerm(''); };
    const removeFromCart = (idx: number) => { setCart(cart.filter((_, i) => i !== idx)); };
    const updateQuantity = (idx: number, delta: number) => {
        const nc = [...cart]; nc[idx].quantity = Math.max(1, nc[idx].quantity + delta); setCart(nc);
    };
    const total = cart.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            await api.post('/orders', {
                fullName: customer.name, phone: customer.phone, address: customer.address,
                city: customer.city, governorate: customer.governorate, paymentMethod: 'cod',
                items: cart.map(i => ({ productId: i.product.id, quantity: i.quantity }))
            });
            toast.success('تم إنشاء الطلب بنجاح');
            onClose();
        } catch (error) {
            console.error(error); toast.error('فشل إنشاء الطلب');
        } finally { setIsSubmitting(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="glass-panel rounded-xl max-w-2xl w-full flex flex-col max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white">إنشاء طلب جديد</h3>
                    <button onClick={onClose}><span className="material-symbols-outlined text-slate-400 hover:text-white">close</span></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-primary uppercase tracking-wider">بيانات العميل</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <input value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} placeholder="الاسم بالكامل" className="px-4 py-2 bg-white/5 rounded-lg text-white border border-white/10" />
                            <input value={customer.phone} onChange={e => setCustomer({ ...customer, phone: e.target.value })} placeholder="رقم الهاتف" className="px-4 py-2 bg-white/5 rounded-lg text-white border border-white/10" />
                            <input value={customer.address} onChange={e => setCustomer({ ...customer, address: e.target.value })} placeholder="العنوان" className="px-4 py-2 bg-white/5 rounded-lg text-white border border-white/10 col-span-2" />
                        </div>
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-primary uppercase tracking-wider">المنتجات</h4>
                        <div className="relative">
                            <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="بحث عن منتج..." className="w-full px-4 py-3 bg-white/5 rounded-lg text-white border border-white/10 focus:ring-1 focus:ring-primary" />
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
                    <button onClick={handleSubmit} disabled={isSubmitting || cart.length === 0 || !customer.name} className="px-6 py-2 rounded-lg bg-primary hover:brightness-110 text-white font-bold disabled:opacity-50 flex items-center gap-2">
                        {isSubmitting && <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                        إنشاء الطلب
                    </button>
                </div>
            </div>
        </div>
    );
}
