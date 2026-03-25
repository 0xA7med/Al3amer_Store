import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { type Order, useUpdateOrderStatus } from '../../hooks/useAdmin';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
export const STATUS_CONFIG: Record<string, { color: string; label: string; icon: string }> = {
    pending:    { color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',   label: 'قيد الانتظار',   icon: 'pending' },
    processing: { color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',   label: 'قيد المعالجة',   icon: 'sync' },
    shipped:    { color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',          label: 'جاري التوصيل',   icon: 'local_shipping' },
    delivered:  { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'مكتمل',          icon: 'check_circle' },
    cancelled:  { color: 'bg-red-500/10 text-red-400 border-red-500/20',             label: 'ملغي',           icon: 'cancel' },
};

export const getPaymentInfo = (method: string) => {
    switch (method) {
        case 'cod':            return { label: 'الدفع عند الاستلام', icon: 'payments',                color: 'text-emerald-400' };
        case 'paymob':         return { label: 'بطاقة ائتمان',        icon: 'credit_card',            color: 'text-blue-400' };
        case 'paymob_wallet':  return { label: 'محفظة إلكترونية',     icon: 'account_balance_wallet', color: 'text-purple-400' };
        case 'online':         return { label: 'دفع إلكتروني',        icon: 'language',               color: 'text-blue-400' };
        default:               return { label: method || 'غير محدد',  icon: 'payments',               color: 'text-slate-400' };
    }
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
    return (
        <table className="w-full text-sm text-right border-collapse">
            <thead className="bg-white/[0.02] border-b border-white/5 text-slate-400 font-medium whitespace-nowrap">
                <tr>
                    {showCheckboxes && (
                        <th className="px-6 py-4 w-10">
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
                            /* NO onClick on <tr> — only Eye Icon & Order ID text trigger modal */
                            <tr
                                key={order.id}
                                className={`border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors ${selectedRows.includes(order.id) ? 'bg-primary/5' : ''}`}
                            >
                                {/* Checkbox */}
                                {showCheckboxes && (
                                    <td className="px-6 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selectedRows.includes(order.id)}
                                            onChange={() => {}}
                                            onClick={(e) => onSelectRow?.(e as any, order.id)}
                                            className="rounded border-slate-600 bg-transparent text-primary focus:ring-primary size-4 cursor-pointer"
                                        />
                                    </td>
                                )}

                                {/* Order Number — clicking triggers modal */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button
                                        onClick={() => onViewDetails(order)}
                                        className="font-bold text-white hover:text-primary transition-colors font-mono text-sm"
                                    >
                                        #{order.orderNumber}
                                    </button>
                                </td>

                                {/* Customer — link to /admin/customers?phone=... */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex flex-col min-w-0 gap-0.5">
                                        <div className="flex items-center gap-2">
                                            <Link
                                                to={`/admin/customers/${encodeURIComponent(customerPhone)}`}
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-white text-sm font-bold truncate hover:text-primary transition-colors"
                                            >
                                                {customerName}
                                            </Link>
                                            {isGuest && (
                                                <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 font-bold uppercase flex-shrink-0">
                                                    زائر
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-slate-400 text-xs font-mono">{customerPhone || 'بدون هاتف'}</span>
                                    </div>
                                </td>

                                {/* Products thumbnails */}
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="flex -space-x-2 rtl:space-x-reverse">
                                            {order.items?.slice(0, 2).map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="w-8 h-8 rounded-lg border border-white/10 bg-slate-800 overflow-hidden relative flex-shrink-0"
                                                    title={item.name || item.product?.name}
                                                >
                                                    {item.product?.images?.[0]?.url ? (
                                                        <img
                                                            src={item.product.images[0].url}
                                                            alt=""
                                                            className="w-full h-full object-cover"
                                                            loading="lazy"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center bg-white/5">
                                                            <span className="material-symbols-outlined text-[14px] text-slate-500">image</span>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        {(order.items?.length || 0) > 2 && (
                                            <span className="text-xs font-bold text-slate-400 bg-white/5 px-2 py-1 rounded border border-white/10 whitespace-nowrap">
                                                +{order.items.length - 2} سلع
                                            </span>
                                        )}
                                    </div>
                                </td>

                                {/* Date */}
                                <td className="px-6 py-4 text-slate-400 text-sm whitespace-nowrap">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-white">
                                            {new Date(order.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                        <span className="text-xs text-slate-500 font-mono">
                                            {new Date(order.createdAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </td>

                                {/* Status — stopPropagation so dropdown doesn't bubble */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <StatusBadge status={order.status} orderId={order.id} />
                                    </div>
                                </td>

                                {/* Payment */}
                                {showPayment && (
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <span className={`material-symbols-outlined text-[18px] ${getPaymentInfo(order.paymentMethod || 'cod').color}`}>
                                                {getPaymentInfo(order.paymentMethod || 'cod').icon}
                                            </span>
                                            <span className="text-xs font-bold text-slate-300">
                                                {getPaymentInfo(order.paymentMethod || 'cod').label}
                                            </span>
                                        </div>
                                    </td>
                                )}

                                {/* Total */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="text-base font-extrabold text-white">
                                        {parseFloat(order.total || '0').toLocaleString('ar-EG')}
                                    </span>
                                    <span className="text-xs text-primary font-bold"> ج.م</span>
                                </td>

                                {/* Actions — stopPropagation so clicks don't bubble */}
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                        {/* Eye Icon — only this + order number open the modal */}
                                        <button
                                            onClick={() => onViewDetails(order)}
                                            className="size-8 flex items-center justify-center rounded-lg bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/20 transition-all shadow-sm"
                                            title="عرض التفاصيل"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                                        </button>

                                        {/* Edit Order — placeholder for future */}
                                        <button
                                            onClick={() => {}}
                                            className="size-8 flex items-center justify-center rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-white border border-amber-500/20 transition-all shadow-sm"
                                            title="تعديل الطلب"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                        </button>

                                        {/* Print */}
                                        <button
                                            onClick={() => window.open(`/admin/orders/${order.id}/print`, '_blank')}
                                            className="size-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 transition-all border border-white/10"
                                            title="طباعة الفاتورة"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">print</span>
                                        </button>

                                        {/* Delete */}
                                        {onDelete && (
                                            <button
                                                onClick={() => onDelete(order.id)}
                                                className="size-8 flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 transition-all shadow-sm"
                                                title="حذف"
                                            >
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
    );
}
