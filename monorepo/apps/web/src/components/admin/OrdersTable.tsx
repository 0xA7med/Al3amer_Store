import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { type Order, useUpdateOrderStatus } from '../../hooks/useAdmin';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
export const STATUS_CONFIG: Record<string, { color: string; label: string; icon: string }> = {
    pending:    { color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',   label: 'قيد الانتظار',   icon: 'pending' },
    pending_payment: { color: 'bg-orange-500/10 text-orange-400 border-orange-500/20', label: 'بانتظار الدفع', icon: 'hourglass_empty' },
    processing: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',         label: 'قيد المعالجة',   icon: 'sync' },
    shipped:    { color: 'bg-purple-500/10 text-purple-400 border-purple-500/20',    label: 'جاري التوصيل',   icon: 'local_shipping' },
    delivered:  { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'مكتمل',          icon: 'check_circle' },
    paid:       { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'مدفوع',          icon: 'paid' },
    cancelled:  { color: 'bg-red-500/10 text-red-400 border-red-500/20',             label: 'ملغي',           icon: 'cancel' },
};

export const getPaymentInfo = (order: Order | any) => {
    const method = typeof order === 'string' ? order : (order?.paymentMethod || 'cod');
    const advance = typeof order === 'object' ? parseFloat(order?.codAdvancePayment || '0') : 0;

    if (method === 'manual_paid') {
        return { label: 'مدفوع بالكامل', icon: 'verified', color: 'text-emerald-400' };
    }
    if (method === 'cod') {
        if (advance > 0) {
            return { label: 'دفع جزئي (عربون)', icon: 'savings', color: 'text-amber-400' };
        }
        return { label: 'الدفع عند الاستلام', icon: 'payments', color: 'text-emerald-400' };
    }
    if (method === 'paymob')        return { label: 'بطاقة ائتمان (فيزا)', icon: 'credit_card', color: 'text-blue-400' };
    if (method === 'paymob_wallet') return { label: 'محفظة إلكترونية', icon: 'account_balance_wallet', color: 'text-purple-400' };
    if (method === 'online')        return { label: 'دفع إلكتروني', icon: 'language', color: 'text-blue-400' };

    return { label: method || 'غير محدد', icon: 'payments', color: 'text-slate-400' };
};

// ─────────────────────────────────────────────
// Internal StatusBadge sub-component
// ─────────────────────────────────────────────
import { createPortal } from 'react-dom';

function StatusBadge({ status, orderId }: { status: string; orderId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState({ top: 0, right: 0, bottom: 0, direction: 'down' as 'up' | 'down' });
    const updateStatus = useUpdateOrderStatus();

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                buttonRef.current && !buttonRef.current.contains(e.target as Node) &&
                dropdownRef.current && !dropdownRef.current.contains(e.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        const handleScroll = () => {
            if (isOpen) setIsOpen(false); // Close on scroll
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', handleScroll);

            if (buttonRef.current) {
                const rect = buttonRef.current.getBoundingClientRect();
                const dropdownHeight = 220; // Estimated max height of dropdown (5 items * ~40px + padding + border)
                const spaceBelow = window.innerHeight - rect.bottom;
                const shouldShowUp = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

                setCoords({
                    top: shouldShowUp ? 0 : rect.bottom + 4,
                    bottom: shouldShowUp ? window.innerHeight - rect.top + 4 : 0,
                    right: window.innerWidth - rect.right,
                    direction: shouldShowUp ? 'up' : 'down'
                });
            }
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleScroll);
        };
    }, [isOpen]);

    const currentConfig = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

    const handleSelect = async (newStatus: string) => {
        if (newStatus !== status) {
            try { await updateStatus.mutateAsync({ orderId, status: newStatus }); } catch { /* toast handled in hook */ }
        }
        setIsOpen(false);
    };

    return (
        <>
            <button
                ref={buttonRef}
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all hover:brightness-110 ${currentConfig.color}`}
            >
                <span className={`material-symbols-outlined text-[16px] ${status === 'processing' ? 'animate-spin' : ''}`}>
                    {currentConfig.icon}
                </span>
                {currentConfig.label}
                <span className="material-symbols-outlined text-[14px]">expand_more</span>
            </button>

            {isOpen && createPortal(
                <div
                    ref={dropdownRef}
                    style={{
                        position: 'fixed',
                        top: coords.direction === 'down' ? `${coords.top}px` : 'auto',
                        bottom: coords.direction === 'up' ? `${coords.bottom}px` : 'auto',
                        right: `${coords.right}px`,
                        zIndex: 9999
                    }}
                    className={`w-40 bg-[#1e2330] border border-white/10 rounded-lg shadow-xl overflow-hidden animate-in fade-in duration-100 ${
                        coords.direction === 'down' ? 'zoom-in-95 mt-1' : 'zoom-in-95 mb-1'
                    }`}
                >
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                        <button
                            key={key}
                            onClick={(e) => { e.stopPropagation(); handleSelect(key); }}
                            className={`w-full text-right px-4 py-2 text-xs font-medium hover:bg-white/5 flex items-center gap-2 ${status === key ? 'text-primary' : 'text-slate-300'}`}
                        >
                            <span className="material-symbols-outlined text-[14px]">{config.icon}</span>
                            {config.label}
                        </button>
                    ))}
                </div>,
                document.body
            )}
        </>
    );
}

// ─────────────────────────────────────────────
// SharedOrdersTable Props
// ─────────────────────────────────────────────
interface SharedOrdersTableProps {
    orders: Order[];
    onViewDetails: (order: Order) => void;
    /** If false, checkboxes and bulk-selection are hidden (e.g. Dashboard widget) */
    showCheckboxes?: boolean;
    selectedRows?: string[];
    onSelectRow?: (e: React.MouseEvent, id: string) => void;
    onSelectAll?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onDelete?: (orderId: string) => void;
    /** Show payment method column (omit in compact Dashboard view) */
    showPayment?: boolean;
}

import { PortableBillFormModal } from './PortableBillFormModal';

// ─────────────────────────────────────────────
// SharedOrdersTable
// ─────────────────────────────────────────────
export default function SharedOrdersTable({
    orders,
    onViewDetails,
    showCheckboxes = true,
    selectedRows = [],
    onSelectRow,
    onSelectAll,
    onDelete,
    showPayment = true,
}: SharedOrdersTableProps) {
    const [printingOrder, setPrintingOrder] = useState<any>(null);

    return (
        <div className="w-full">
            {printingOrder && (
                <PortableBillFormModal order={printingOrder} onClose={() => setPrintingOrder(null)} />
            )}
            
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-right border-collapse">
                    <thead className="bg-white/[0.02] border-b border-white/5 text-slate-400 font-medium whitespace-nowrap">
                        <tr>
                            {showCheckboxes && (
                                <th className="px-6 py-4 w-10 text-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedRows.length === orders.length && orders.length > 0}
                                        onChange={onSelectAll}
                                        className="rounded border-slate-600 bg-transparent text-primary focus:ring-primary size-4 cursor-pointer"
                                    />
                                </th>
                            )}
                            <th className="px-6 py-4 font-bold text-slate-300">رقم الطلب</th>
                            <th className="px-6 py-4 font-bold text-slate-300">العميل</th>
                            <th className="px-6 py-4 font-bold text-slate-300">المنتجات</th>
                            <th className="px-6 py-4 font-bold text-slate-300">التاريخ</th>
                            <th className="px-6 py-4 font-bold text-slate-300">الحالة</th>
                            {showPayment && <th className="px-6 py-4 font-bold text-slate-300">الدفع</th>}
                            <th className="px-6 py-4 font-bold text-slate-300">الإجمالي</th>
                            <th className="px-6 py-4 font-bold text-slate-300">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-300">
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan={showPayment ? 9 : 8} className="px-6 py-12 text-center text-slate-500">
                                    <span className="material-symbols-outlined text-4xl mb-2 block">shopping_bag</span>
                                    لا توجد طلبات تطابق البحث
                                </td>
                            </tr>
                        ) : (
                            orders.map((order) => {
                                const customerName = order.user?.name || order.fullName || 'غير معروف';
                                const customerPhone = order.user?.phone || order.phone || '';
                                const isGuest = !order.user;

                                return (
                                    <tr
                                        key={order.id}
                                        className={`border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors ${selectedRows.includes(order.id) ? 'bg-primary/5' : ''}`}
                                    >
                                        {showCheckboxes && (
                                            <td className="px-6 py-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedRows.includes(order.id)}
                                                    onChange={() => {}}
                                                    onClick={(e) => onSelectRow?.(e as any, order.id)}
                                                    className="rounded border-slate-600 bg-transparent text-primary focus:ring-primary size-4 cursor-pointer"
                                                />
                                            </td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => onViewDetails(order)}
                                                className="font-bold text-white hover:text-primary transition-colors font-mono text-sm"
                                            >
                                                #{order.orderNumber}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col min-w-0 gap-0.5">
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        to={`/admin/customers/${encodeURIComponent(customerPhone)}`}
                                                        className="text-white text-sm font-bold truncate hover:text-primary transition-colors"
                                                    >
                                                        {customerName}
                                                    </Link>
                                                    {isGuest && !order.traderId && (
                                                        <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 font-bold uppercase flex-shrink-0">
                                                            زائر
                                                        </span>
                                                    )}
                                                    {order.traderId && (
                                                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold uppercase flex-shrink-0 flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[12px]">verified_user</span>
                                                            مسوق
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-slate-400 text-xs font-mono">{customerPhone || 'بدون هاتف'}</span>
                                                    {order.trader?.traderBranding?.storeName && (
                                                        <span className="text-[10px] text-primary/60 font-medium truncate max-w-[100px]">
                                                            ({order.trader.traderBranding.storeName})
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex -space-x-2 rtl:space-x-reverse">
                                                    {order.items?.slice(0, 2).map((item, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="size-8 rounded-lg border border-white/10 bg-slate-800 overflow-hidden relative flex-shrink-0"
                                                        >
                                                            {item.product?.images?.[0]?.url ? (
                                                                <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <div className="w-full h-full flex items-center justify-center bg-white/5">
                                                                    <span className="material-symbols-outlined text-[14px] text-slate-500">image</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                                {(order.items?.length || 0) > 2 && (
                                                    <span className="text-xs font-bold text-slate-400">+{order.items.length - 2}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-slate-400 text-sm whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white">
                                                    {new Date(order.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                                                </span>
                                                <span className="text-[10px] text-slate-500">
                                                    {new Date(order.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <StatusBadge status={order.status} orderId={order.id} />
                                        </td>
                                        {showPayment && (
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className={`material-symbols-outlined text-[18px] ${getPaymentInfo(order).color}`}>
                                                        {getPaymentInfo(order).icon}
                                                    </span>
                                                    <span className="text-xs font-bold text-slate-300">
                                                        {getPaymentInfo(order).label}
                                                    </span>
                                                </div>
                                            </td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-base font-extrabold text-white">
                                                        {parseFloat(order.total || '0').toLocaleString('ar-EG')}
                                                    </span>
                                                    <span className="text-[10px] text-primary font-bold">ج.م</span>
                                                </div>
                                                {order.traderCommission && (
                                                    <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[10px]">payments</span>
                                                        ربح: {parseFloat(order.traderCommission).toLocaleString('ar-EG')} ج.م
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => onViewDetails(order)} className="size-8 flex items-center justify-center rounded-lg bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white transition-all">
                                                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                </button>
                                                <button onClick={() => setPrintingOrder(order)} className="size-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-all">
                                                    <span className="material-symbols-outlined text-[18px]">print</span>
                                                </button>
                                                {onDelete && (
                                                    <button onClick={() => onDelete(order.id)} className="size-8 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white transition-all">
                                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden flex flex-col gap-4 p-4">
                {orders.length === 0 ? (
                    <div className="px-6 py-12 text-center text-slate-500 bg-white/5 rounded-xl border border-dashed border-white/10">
                        <span className="material-symbols-outlined text-4xl mb-2 block">shopping_bag</span>
                        لا توجد طلبات تطابق البحث
                    </div>
                ) : (
                    orders.map((order) => {
                        const customerName = order.user?.name || order.fullName || 'غير معروف';
                        const customerPhone = order.user?.phone || order.phone || '';
                        const isGuest = !order.user;
                        const paymentInfo = getPaymentInfo(order);

                        return (
                            <div
                                key={order.id}
                                className={`glass-panel p-4 rounded-xl border border-white/5 relative flex flex-col gap-4 transition-all active:scale-[0.98] ${selectedRows.includes(order.id) ? 'border-primary/40 bg-primary/5' : ''}`}
                            >
                                {/* Header: Order Number & Selection */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {showCheckboxes && (
                                            <input
                                                type="checkbox"
                                                checked={selectedRows.includes(order.id)}
                                                onChange={() => {}}
                                                onClick={(e) => onSelectRow?.(e as any, order.id)}
                                                className="rounded border-slate-600 bg-transparent text-primary focus:ring-primary size-5 cursor-pointer"
                                            />
                                        )}
                                        <button
                                            onClick={() => onViewDetails(order)}
                                            className="font-black text-white text-base font-mono"
                                        >
                                            #{order.orderNumber}
                                        </button>
                                    </div>
                                    <StatusBadge status={order.status} orderId={order.id} />
                                </div>

                                {/* Customer & Info Grid */}
                                <div className="grid grid-cols-2 gap-4 border-y border-white/5 py-3">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1">
                                            <span className="text-[10px] text-slate-500 font-bold uppercase">العميل</span>
                                            {order.notes && (
                                                <span className="material-symbols-outlined text-primary text-[14px]" title="يوجد ملاحظات">chat_bubble</span>
                                            )}
                                        </div>
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                            <Link
                                                to={`/admin/customers/${encodeURIComponent(customerPhone)}`}
                                                className="text-white text-sm font-bold truncate max-w-[100px]"
                                            >
                                                {customerName}
                                            </Link>
                                            {isGuest && !order.traderId && (
                                                <span className="text-[8px] px-1 py-0.5 rounded bg-white/5 border border-white/10 text-slate-500 font-bold">زائر</span>
                                            )}
                                            {order.traderId && (
                                                <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center gap-0.5">
                                                    <span className="material-symbols-outlined text-[10px]">verified_user</span>
                                                    مسوق
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-slate-400 text-[10px] font-mono">{customerPhone}</span>
                                    </div>
                                    <div className="flex flex-col gap-1 items-end">
                                        <span className="text-[10px] text-slate-500 font-bold uppercase text-left">التاريخ والشحن</span>
                                        <span className="text-white text-sm font-bold">
                                            {order.governorate || 'غير محدد'}
                                        </span>
                                        <div className="flex flex-col items-end">
                                            <span className="text-slate-500 text-[10px] font-medium">
                                                {new Date(order.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                                            </span>
                                            <span className="text-slate-500 text-[10px] font-mono">
                                                {new Date(order.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment & Total */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className={`size-8 rounded-lg bg-white/5 flex items-center justify-center text-slate-400 ${paymentInfo.color}`}>
                                            <span className="material-symbols-outlined text-[18px]">{paymentInfo.icon}</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-500 font-bold">الدفع</span>
                                            <span className="text-xs text-slate-300 font-bold">{paymentInfo.label}</span>
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <span className="text-[10px] text-slate-500 font-bold block mb-0.5">الإجمالي</span>
                                        <span className="text-lg font-black text-white">
                                            {parseFloat(order.total || '0').toLocaleString('ar-EG')}
                                            <span className="text-xs text-primary font-bold"> ج.م</span>
                                        </span>
                                    </div>
                                </div>

                                {/* Footer: Products & Actions */}
                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex -space-x-1.5 rtl:space-x-reverse">
                                        {order.items?.slice(0, 3).map((item, idx) => (
                                            <div key={idx} className="size-7 rounded-lg border border-white/10 bg-slate-800 overflow-hidden shrink-0">
                                                {item.product?.images?.[0]?.url ? (
                                                    <img src={item.product.images[0].url} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center"><span className="material-symbols-outlined text-[12px]">image</span></div>
                                                )}
                                            </div>
                                        ))}
                                        {(order.items?.length || 0) > 3 && (
                                            <div className="size-7 rounded-lg bg-white/10 border border-white/10 flex items-center justify-center text-[10px] font-bold text-slate-400">
                                                +{order.items.length - 3}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => onViewDetails(order)}
                                            className="size-9 flex items-center justify-center rounded-xl bg-primary text-background-dark font-bold shadow-lg shadow-primary/20"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                                        </button>
                                        <button
                                            onClick={() => setPrintingOrder(order)}
                                            className="size-9 flex items-center justify-center rounded-xl bg-white/5 text-slate-300 border border-white/10"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">print</span>
                                        </button>
                                        {onDelete && (
                                            <button
                                                onClick={() => onDelete(order.id)}
                                                className="size-9 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 border border-red-500/20"
                                            >
                                                <span className="material-symbols-outlined text-[20px]">delete</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
