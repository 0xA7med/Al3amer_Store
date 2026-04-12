import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAdminOrders, useAdminProducts, useBulkDeleteOrders, useBulkUpdateOrdersStatus, type Order } from '../../hooks/useAdmin';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import OrdersTable, { STATUS_CONFIG } from '../../components/admin/OrdersTable';
import OrderDetailsModal from '../../components/admin/OrderDetailsModal';

const GOVERNORATES = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر', 'البحيرة', 'الفيوم',
    'الغربية', 'الإسماعيلية', 'المنوفية', 'المنيا', 'القليوبية', 'الوادي الجديد',
    'السويس', 'أسوان', 'أسيوط', 'بني سويف', 'بورسعيد', 'دمياط', 'الشرقية', 'جنوب سيناء',
    'كفر الشيخ', 'مطروح', 'الأقصر', 'قنا', 'شمال سيناء', 'سوهاج'
];

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

        const createFor = searchParams.get('createOrderFor');
        if (createFor) {
            setIsCreateOrderOpen(true);
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
        pending_payment: orders.filter(o => o.status === 'pending_payment').length,
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
            order.user?.phone?.toLowerCase().includes(s) ||
            (order.notes && order.notes.toLowerCase().includes(s));
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-white text-lg md:text-xl font-bold tracking-tight">إدارة الطلبات</h2>
                    <div className="h-5 w-px bg-white/10 mx-1"></div>
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5">
                        <span className="material-symbols-outlined text-[14px] text-slate-400">calendar_today</span>
                        <span className="text-slate-300 text-[10px] font-medium">{new Date().toLocaleDateString('ar-EG')}</span>
                    </div>
                </div>
                <button
                    onClick={() => setIsCreateOrderOpen(true)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-blue-600 hover:from-blue-600 hover:to-primary text-white transition-all text-sm font-bold shadow-lg shadow-primary/25 active:scale-95"
                >
                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    <span>طلب يدوي</span>
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {[
                    { label: 'إجمالي الطلبات',  value: totalOrders,      icon: 'shopping_cart',  color: 'blue-500',    glow: 'rgba(59,130,246,0.2)' },
                    { label: 'بانتظار التجهيز',  value: processingOrders, icon: 'pending_actions', color: 'yellow-500', glow: 'rgba(234,179,8,0.2)',  alert: processingOrders > 0 },
                    { label: 'طلبات مكتملة',    value: completedOrders,  icon: 'check_circle',   color: 'emerald-500', glow: 'rgba(16,185,129,0.2)' },
                    { label: 'طلبات ملغاة',     value: cancelledOrders,  icon: 'cancel',         color: 'red-500',     glow: 'rgba(239,68,68,0.2)' },
                ].map((card, i) => (
                    <div key={i} className={`glass-panel p-2.5 md:p-4 rounded-xl relative overflow-hidden group hover:border-${card.color}/40 transition-all flex items-center gap-3 md:gap-4`}>
                        <div className={`size-9 md:size-12 rounded-lg bg-${card.color}/10 flex items-center justify-center text-${card.color.replace('500', '400')} border border-${card.color}/20 shrink-0 relative transition-transform group-hover:scale-110`} style={{ boxShadow: `0 0 15px ${card.glow}` }}>
                            <span className="material-symbols-outlined text-[18px] md:text-[24px]">{card.icon}</span>
                            {card.alert && (
                                <span className="absolute -top-1 -left-1 size-2.5 bg-yellow-400 rounded-full border-2 border-[#1e2330] animate-pulse" />
                            )}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <p className="text-slate-500 md:text-slate-400 text-[9px] md:text-xs font-bold truncate uppercase tracking-wider">{card.label}</p>
                            <h3 className="text-base md:text-2xl font-black text-white leading-tight truncate">{card.value}</h3>
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
                                        { key: 'pending_payment', label: 'بانتظار الدفع' },
                                        { key: 'pending',    label: 'جديد' },
                                        { key: 'processing', label: 'قيد المعالجة' },
                                        { key: 'shipped',    label: 'جاري التوصيل' },
                                        { key: 'delivered',  label: 'مكتمل' },
                                        { key: 'cancelled',  label: 'ملغي' },
                                    ]
                                    .filter(tab => tab.key === 'all' || counts[tab.key] > 0)
                                    .map(tab => (
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
                <CreateOrderModal 
                    initialPhone={searchParams.get('createOrderFor') || ''}
                    onClose={() => {
                        setIsCreateOrderOpen(false);
                        setSearchParams(p => { p.delete('createOrderFor'); return p; });
                    }} 
                />
            )}
        </div>
    );
}

function CreateOrderModal({ onClose, initialPhone }: { onClose: () => void, initialPhone?: string }) {
    const [customer, setCustomer] = useState({ 
        name: '', 
        phone: initialPhone || '', 
        phone2: '',
        address: '', 
        governorate: '', 
        notes: '' 
    });
    
    // New payment options state
    const [paymentOptions, setPaymentOptions] = useState({
        type: 'cod', // 'cod', 'partial', 'paid'
        advance: ''
    });

    const [cart, setCart] = useState<{ product: any; quantity: number }[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const { data: productsData } = useAdminProducts({ search: searchTerm, limit: 10, status: 'active' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const queryClient = useQueryClient();
    
    // Customer search states
    const [customerSearchResults, setCustomerSearchResults] = useState<any[]>([]);
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
    const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            if (customer.phone.length >= 3) {
                setIsSearchingCustomer(true);
                try {
                    const { data } = await api.get('/users', { params: { search: customer.phone, limit: 10 } });
                    if (data?.data && data.data.length > 0) {
                        setCustomerSearchResults(data.data);
                        setShowCustomerDropdown(true);
                    } else {
                        setCustomerSearchResults([]);
                        setShowCustomerDropdown(false);
                    }
                } catch (e) {
                    setCustomerSearchResults([]);
                    setShowCustomerDropdown(false);
                } finally {
                    setIsSearchingCustomer(false);
                }
            } else {
                setCustomerSearchResults([]);
                setShowCustomerDropdown(false);
            }
        };
        const timeout = setTimeout(fetchUserData, 500);
        return () => clearTimeout(timeout);
    }, [customer.phone]);

    const handleSelectCustomer = (selected: any) => {
        setCustomer(prev => ({
            ...prev,
            phone: selected.phone,
            phone2: selected.phone2 || prev.phone2 || '',
            name: selected.name || prev.name,
            address: selected.address || prev.address || '',
            governorate: selected.governorate || prev.governorate || '',
        }));
        setShowCustomerDropdown(false);
    };

    const addToCart = (product: any) => { setCart([...cart, { product, quantity: 1 }]); setSearchTerm(''); };
    const removeFromCart = (idx: number) => { setCart(cart.filter((_, i) => i !== idx)); };
    const updateQuantity = (idx: number, delta: number) => {
        const nc = [...cart]; nc[idx].quantity = Math.max(1, nc[idx].quantity + delta); setCart(nc);
    };
    const total = cart.reduce((s, i) => s + Number(i.product.price) * i.quantity, 0);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const finalNotes = (customer.phone2 ? `رقم إضافي: ${customer.phone2}\n` : '') + (customer.notes || '');
            
            let finalAdvance = 0;
            let finalMethod = 'cod';
            let totalAtDelivery = total;
            
            if (paymentOptions.type === 'partial') {
                finalAdvance = Number(paymentOptions.advance) || 0;
                finalMethod = 'cod';
                totalAtDelivery = Math.max(0, total - finalAdvance);
            } else if (paymentOptions.type === 'paid') {
                finalAdvance = total;
                finalMethod = 'manual_paid';
                totalAtDelivery = 0;
            }

            await api.post('/orders', {
                fullName: customer.name, 
                phone: customer.phone, 
                address: customer.address,
                city: 'لا يوجد',
                governorate: customer.governorate, 
                notes: finalNotes,
                paymentMethod: finalMethod,
                codAdvancePayment: finalAdvance,
                totalAtDelivery: totalAtDelivery,
                items: cart.map(i => ({ productId: i.product.id, quantity: i.quantity }))
            });
            toast.success('تم إنشاء الطلب بنجاح');
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
            onClose();
        } catch (error: any) {
            const msg = error.response?.data?.error || 'فشل إنشاء الطلب';
            console.error(error); 
            toast.error(msg);
        } finally { setIsSubmitting(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-0 md:p-4">
            <div className="glass-panel rounded-none md:rounded-xl w-full md:max-w-3xl flex flex-col h-full md:h-auto md:max-h-[90vh] overflow-hidden">
                <div className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between bg-[#1e2330]/80 sticky top-0 z-10">
                    <h3 className="text-lg md:text-xl font-bold text-white">إنشاء طلب جديد</h3>
                    <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full"><span className="material-symbols-outlined text-slate-400">close</span></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-6">
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-primary uppercase tracking-wider">بيانات العميل</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1 relative">
                                    <label className="text-xs text-slate-400 mr-2">رقم الهاتف الأساسي</label>
                                    <input 
                                        value={customer.phone} 
                                        onChange={e => {
                                            setCustomer({ ...customer, phone: e.target.value });
                                            setShowCustomerDropdown(true);
                                        }} 
                                        onFocus={() => { if (customerSearchResults.length > 0) setShowCustomerDropdown(true); }}
                                        placeholder="01xxxxxxxxx" 
                                        className="w-full px-4 py-2 bg-white/5 rounded-lg text-white border border-white/10 focus:border-primary outline-none" 
                                    />
                                    {isSearchingCustomer && (
                                        <div className="absolute left-3 top-8">
                                            <span className="size-4 border-2 border-primary border-t-transparent rounded-full animate-spin inline-block"></span>
                                        </div>
                                    )}
                                    {/* Customer Search Dropdown */}
                                    {showCustomerDropdown && customerSearchResults.length > 0 && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setShowCustomerDropdown(false)} />
                                            <div className="absolute z-50 w-full mt-1 bg-[#1e2330] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar">
                                                {customerSearchResults.map((user: any) => (
                                                    <button
                                                        key={user.id}
                                                        onClick={() => handleSelectCustomer(user)}
                                                        className="w-full text-right p-3 hover:bg-white/5 border-b border-white/5 last:border-0 flex flex-col gap-1 transition-colors"
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span className="material-symbols-outlined text-sm text-slate-400">person</span>
                                                            <span className="text-white font-bold text-sm">{user.name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2 text-primary font-mono text-xs pr-6">
                                                            <span className="material-symbols-outlined text-[12px]">phone</span>
                                                            {user.phone}
                                                        </div>
                                                        {user.address && (
                                                            <div className="text-xs text-slate-500 pr-6 truncate">
                                                                {user.governorate && `${user.governorate} - `}{user.address}
                                                            </div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 mr-2">الاسم بالكامل</label>
                                    <input value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} placeholder="مثال: أحمد محمد" className="w-full px-4 py-2 bg-white/5 rounded-lg text-white border border-white/10 focus:border-primary outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 mr-2">رقم هاتف إضافي (اختياري)</label>
                                    <input value={customer.phone2} onChange={e => setCustomer({ ...customer, phone2: e.target.value })} placeholder="رقم بديل" className="w-full px-4 py-2 bg-white/5 rounded-lg text-white border border-white/10 focus:border-primary outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 mr-2">المحافظة</label>
                                    <select 
                                        value={customer.governorate} 
                                        onChange={e => setCustomer({ ...customer, governorate: e.target.value })} 
                                        className="w-full px-4 py-2 bg-white/5 rounded-lg text-white border border-white/10 focus:border-primary outline-none appearance-none"
                                    >
                                        <option value="" className="bg-[#1e2330]">اختر المحافظة...</option>
                                        {GOVERNORATES.map(gov => (
                                            <option key={gov} value={gov} className="bg-[#1e2330]">{gov}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-xs text-slate-400 mr-2">العنوان بالتفصيل</label>
                                    <input value={customer.address} onChange={e => setCustomer({ ...customer, address: e.target.value })} placeholder="اسم الشارع، رقم العقار..." className="w-full px-4 py-2 bg-white/5 rounded-lg text-white border border-white/10 focus:border-primary outline-none" />
                                </div>
                                <div className="space-y-1 md:col-span-2">
                                    <label className="text-xs text-slate-400 mr-2">ملاحظات الطلب (اختياري)</label>
                                    <textarea value={customer.notes} onChange={e => setCustomer({ ...customer, notes: e.target.value })} placeholder="أي ملاحظات إضافية..." rows={2} className="w-full px-4 py-2 bg-white/5 rounded-lg text-white border border-white/10 focus:border-primary outline-none resize-none" />
                                </div>
                            </div>
                        </div>

                        {/* Payment Details Section */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-bold text-primary uppercase tracking-wider">تفاصيل الدفع</h4>
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs text-slate-400 mr-2">طريقة الدفع</label>
                                    <select 
                                        value={paymentOptions.type} 
                                        onChange={e => setPaymentOptions({ ...paymentOptions, type: e.target.value, advance: '' })} 
                                        className="w-full px-4 py-2 bg-white/5 rounded-lg text-white border border-white/10 focus:border-primary outline-none appearance-none"
                                    >
                                        <option value="cod" className="bg-[#1e2330]">دفع عند الاستلام (بالكامل)</option>
                                        <option value="partial" className="bg-[#1e2330]">دفع جزئي (عربون)</option>
                                        <option value="paid" className="bg-[#1e2330]">مدفوع بالكامل (مقدماً)</option>
                                    </select>
                                </div>
                                {paymentOptions.type === 'partial' && (
                                    <div className="space-y-1 animate-in fade-in zoom-in-95 duration-200">
                                        <label className="text-xs text-slate-400 mr-2">عربون (المبلغ المدفوع مقدماً)</label>
                                        <input 
                                            type="number"
                                            value={paymentOptions.advance} 
                                            onChange={e => setPaymentOptions({ ...paymentOptions, advance: e.target.value })} 
                                            placeholder="أدخل مبلغ العربون" 
                                            className="w-full px-4 py-2 bg-white/5 rounded-lg text-white border border-white/10 focus:border-primary outline-none" 
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-sm font-bold text-primary uppercase tracking-wider">المنتجات المضافة ({cart.length})</h4>
                        </div>
                        
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">search</span>
                            <input 
                                value={searchTerm} 
                                onChange={e => setSearchTerm(e.target.value)} 
                                placeholder="بحث عن منتج..." 
                                className="w-full pl-10 pr-4 py-3 bg-white/5 rounded-lg text-white border border-white/10 focus:border-primary outline-none transition-all" 
                            />
                            {searchTerm && productsData?.data && (
                                <div className="absolute top-full left-0 w-full bg-[#1e2330] border border-white/10 rounded-lg mt-1 shadow-2xl z-50 max-h-60 overflow-y-auto divide-y divide-white/5">
                                    {productsData.data.map(product => (
                                        <div key={product.id} onClick={() => addToCart(product)} className="p-3 hover:bg-white/5 cursor-pointer flex items-center gap-3 active:bg-primary/10">
                                            {product.images?.[0]?.url && <img src={product.images[0].url} className="size-10 rounded object-cover shadow-lg" />}
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

                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                            {cart.length === 0 ? (
                                <div className="py-8 text-center border-2 border-dashed border-white/5 rounded-xl">
                                    <span className="material-symbols-outlined text-4xl text-white/10 mb-2">shopping_basket</span>
                                    <p className="text-slate-500 text-sm">لم يتم إضافة منتجات بعد</p>
                                </div>
                            ) : cart.map((item, idx) => (
                                <div key={idx} className="flex flex-col gap-2 bg-white/5 p-4 rounded-xl border border-white/5 group relative overflow-hidden">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-center gap-3">
                                            {item.product.images?.[0]?.url && <img src={item.product.images[0].url} className="size-10 rounded object-cover" />}
                                            <div className="text-white font-medium text-sm leading-tight">{item.product.name}</div>
                                        </div>
                                        <button onClick={() => removeFromCart(idx)} className="text-red-400/50 hover:text-red-400 transition-colors">
                                            <span className="material-symbols-outlined text-sm">delete</span>
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                                        <div className="flex items-center gap-2 bg-black/30 rounded-lg p-1">
                                            <button onClick={() => updateQuantity(idx, -1)} className="size-7 rounded hover:bg-white/5 text-primary active:scale-95 transition-all">-</button>
                                            <span className="text-white w-6 text-center text-sm font-bold">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(idx, 1)} className="size-7 rounded hover:bg-white/5 text-primary active:scale-95 transition-all">+</button>
                                        </div>
                                        <div className="text-primary font-bold">{(item.quantity * Number(item.product.price)).toLocaleString()} ج.م</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-4 md:p-6 border-t border-white/10 bg-[#1e2330]/90 backdrop-blur-md sticky bottom-0">
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <span className="text-slate-400 text-sm">إجمالي الطلب</span>
                            <span className="text-2xl font-black text-primary">{total.toLocaleString()} <small className="text-xs font-normal">ج.م</small></span>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={onClose} className="flex-1 py-3 rounded-xl text-slate-300 hover:bg-white/5 border border-white/10 transition-colors text-sm font-medium">إلغاء</button>
                            <button 
                                onClick={handleSubmit} 
                                disabled={isSubmitting || cart.length === 0 || !customer.name || !customer.address || !customer.governorate || !customer.phone || (paymentOptions.type === 'partial' && !paymentOptions.advance)} 
                                className="flex-[2] py-3 rounded-xl bg-primary hover:brightness-110 text-white font-black shadow-[0_0_30px_rgba(var(--color-primary-rgb),0.2)] disabled:opacity-30 disabled:grayscale transition-all flex items-center justify-center gap-2 text-sm"
                            >
                                {isSubmitting ? (
                                    <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <><span>إنشاء الطلب</span><span className="material-symbols-outlined text-sm">auto_awesome</span></>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
