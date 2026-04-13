import { useState } from 'react';
import { Link } from 'react-router-dom';
import { type Order, useUpdateOrder } from '../../hooks/useAdmin';
import { PortableBillFormModal } from './PortableBillFormModal';

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function formatDate(dateString: string): { date: string; time: string } {
    const d = new Date(dateString);
    return {
        date: d.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }),
        time: d.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };
}

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────
interface OrderDetailsModalProps {
    order: Order;
    onClose: () => void;
}

// ─────────────────────────────────────────────
// OrderDetailsModal
// ─────────────────────────────────────────────
export default function OrderDetailsModal({ order, onClose }: OrderDetailsModalProps) {
    const { date, time } = formatDate(order.createdAt);
    const updateOrder = useUpdateOrder();

    const [isEditing, setIsEditing] = useState(false);
    const [showBillModal, setShowBillModal] = useState(false);
    const [editForm, setEditForm] = useState({
        fullName: order.fullName || order.user?.name || '',
        phone: order.phone || order.user?.phone || '',
        governorate: order.governorate || '',
        city: order.city || '',
        address: order.address || '',
        notes: order.notes || ''
    });

    const handleSave = async () => {
        if (!editForm.fullName || !editForm.phone) return;
        try {
            await updateOrder.mutateAsync({ orderId: order.id, data: editForm });
            setIsEditing(false);
        } catch {}
    };

    const customerName = order.fullName || order.user?.name || 'غير معروف';
    const customerPhone = order.phone || order.user?.phone || '';
    const customerEmail = order.email || order.user?.email || '';

    return (
        <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={onClose}
        >
            <div
                className="glass-panel rounded-xl md:rounded-2xl max-w-2xl w-full max-h-[96vh] md:max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div>
                        <h3 className="text-base md:text-lg font-black text-white flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">receipt_long</span>
                            تفاصيل الطلب #{order.orderNumber}
                        </h3>
                        <p className="text-[10px] md:text-sm text-slate-500 mt-0.5">{date} — {time}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-9 md:size-10 flex items-center justify-center rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/5"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-4 md:p-6 overflow-y-auto flex-1 space-y-6">
                    {/* Customer + Delivery */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white/5 rounded-lg p-4">
                            <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px] text-primary">person</span>
                                معلومات العميل
                            </h4>
                            {isEditing ? (
                                <div className="space-y-3">
                                    <input 
                                        type="text" 
                                        value={editForm.fullName} 
                                        onChange={e => setEditForm({...editForm, fullName: e.target.value})} 
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none transition-colors"
                                        placeholder="الاسم كامل"
                                    />
                                    <input 
                                        type="tel" 
                                        value={editForm.phone} 
                                        onChange={e => setEditForm({...editForm, phone: e.target.value})} 
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none transition-colors"
                                        placeholder="رقم الهاتف"
                                    />
                                </div>
                            ) : (
                                <>
                                    <p className="text-white font-medium mb-1">{customerName}</p>
                                    {customerPhone && <p className="text-sm text-slate-400 font-mono">{customerPhone}</p>}
                                    {customerEmail && <p className="text-sm text-slate-400">{customerEmail}</p>}
                                </>
                            )}
                        </div>
                        <div className="bg-white/5 rounded-lg p-4">
                            <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px] text-primary">location_on</span>
                                عنوان التوصيل
                            </h4>
                            {isEditing ? (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <input 
                                            type="text" 
                                            value={editForm.governorate} 
                                            onChange={e => setEditForm({...editForm, governorate: e.target.value})} 
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none transition-colors"
                                            placeholder="المحافظة"
                                        />
                                        <input 
                                            type="text" 
                                            value={editForm.city} 
                                            onChange={e => setEditForm({...editForm, city: e.target.value})} 
                                            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none transition-colors"
                                            placeholder="المدينة"
                                        />
                                    </div>
                                    <input 
                                        type="text" 
                                        value={editForm.address} 
                                        onChange={e => setEditForm({...editForm, address: e.target.value})} 
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none transition-colors"
                                        placeholder="العنوان التفصيلي"
                                    />
                                    <textarea 
                                        value={editForm.notes} 
                                        onChange={e => setEditForm({...editForm, notes: e.target.value})} 
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none transition-colors resize-none h-16"
                                        placeholder="ملاحظات الطلب"
                                    />
                                </div>
                            ) : (
                                <>
                                    <p className="text-white font-medium mb-1">
                                        {order.governorate}{order.city ? `، ${order.city}` : ''}
                                    </p>
                                    {order.address && <p className="text-sm text-slate-400">{order.address}</p>}
                                    {order.notes && <p className="text-xs text-slate-500 mt-2">ملاحظات: {order.notes}</p>}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Order Items */}
                    <div>
                        <h4 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px] text-primary">shopping_bag</span>
                            المنتجات ({order.items?.length || 0})
                        </h4>
                        <div className="space-y-2">
                            {order.items?.map((item, idx) => {
                                // slug may exist at runtime even if not in TS type
                                const slug = (item.product as any)?.slug;
                                const productUrl = slug ? `/product/${slug}` : null;
                                const imageUrl = item.product?.images?.[0]?.url;
                                const displayName = item.name || item.product?.name || 'منتج';

                                const imageEl = (
                                    <div className="size-10 md:size-12 rounded-lg bg-slate-800 flex items-center justify-center overflow-hidden flex-shrink-0 border border-white/5">
                                        {imageUrl ? (
                                            <img src={imageUrl} alt={displayName} className="w-full h-full object-cover" loading="lazy" />
                                        ) : (
                                            <span className="material-symbols-outlined text-slate-600 text-[20px]">image</span>
                                        )}
                                    </div>
                                );

                                return (
                                    <div key={item.id || idx} className="flex items-center gap-3 md:gap-4 bg-white/5 rounded-xl p-2 md:p-3 border border-white/5">
                                        {/* Product image — clickable if slug exists */}
                                        {productUrl ? (
                                            <Link to={productUrl} target="_blank" rel="noopener noreferrer" title="فتح صفحة المنتج">
                                                {imageEl}
                                            </Link>
                                        ) : imageEl}

                                        <div className="flex-1 min-w-0">
                                            {/* Product name — clickable if slug exists */}
                                            {productUrl ? (
                                                <Link
                                                    to={productUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-white text-xs md:text-sm font-bold truncate block hover:text-primary transition-colors"
                                                >
                                                    {displayName}
                                                </Link>
                                            ) : (
                                                <p className="text-white text-xs md:text-sm font-bold truncate">{displayName}</p>
                                            )}
                                            <p className="text-[10px] md:text-xs text-slate-500 font-medium">الكمية: {item.quantity}</p>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-white text-xs md:text-sm font-black whitespace-nowrap">
                                                {parseFloat(item.price || '0').toLocaleString('ar-EG')}
                                            </p>
                                            <p className="text-[10px] text-primary font-bold">ج.م</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-primary/5 rounded-xl p-4 space-y-2 border border-primary/10">
                        <div className="flex justify-between text-xs md:text-sm">
                            <span className="text-slate-500 font-bold">المجموع الفرعي</span>
                            <span className="text-white font-mono">{parseFloat(order.subtotal || '0').toLocaleString('ar-EG')} ج.م</span>
                        </div>
                        <div className="flex justify-between text-xs md:text-sm">
                            <span className="text-slate-500 font-bold">الشحن</span>
                            <span className="text-white font-mono">{parseFloat(order.shippingCost || '0').toLocaleString('ar-EG')} ج.م</span>
                        </div>
                        <div className="flex justify-between text-xs md:text-sm">
                            <span className="text-slate-500 font-bold">طريقة الدفع</span>
                            <span className="text-white font-bold">
                                {order.paymentMethod === 'cod' ? 'الدفع عند الاستلام' 
                                    : order.paymentMethod === 'manual_paid' ? 'مدفوع بالكامل'
                                    : order.paymentMethod === 'paymob' ? 'بطاقة ائتمان (فيزا)'
                                    : order.paymentMethod === 'paymob_wallet' ? 'محفظة إلكترونية'
                                    : 'دفع إلكتروني'}
                            </span>
                        </div>
                        {/* COD Advance Payment breakdown */}
                        {order.codAdvancePayment && parseFloat(order.codAdvancePayment) > 0 && (
                            <>
                                <div className="flex justify-between text-xs md:text-sm">
                                    <span className="text-amber-400 font-bold">المدفوع مقدماً (عربون)</span>
                                    <span className="text-amber-400 font-mono">{parseFloat(order.codAdvancePayment).toLocaleString('ar-EG')} ج.م</span>
                                </div>
                                <div className="flex justify-between text-xs md:text-sm">
                                    <span className="text-emerald-400 font-bold">المتبقي عند الاستلام</span>
                                    <span className="text-emerald-400 font-mono">
                                        {(order.totalAtDelivery ? parseFloat(order.totalAtDelivery) : (parseFloat(order.total || '0') - parseFloat(order.codAdvancePayment))).toLocaleString('ar-EG')} ج.م
                                    </span>
                                </div>
                            </>
                        )}
                        {order.paymentMethod === 'manual_paid' && (
                            <div className="flex justify-between text-xs md:text-sm">
                                <span className="text-emerald-400 font-bold">المتبقي عند الاستلام</span>
                                <span className="text-emerald-400 font-mono">0 ج.م</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-white/5">
                            <span className="text-primary font-black uppercase text-xs tracking-wider">الإجمالي النهائى</span>
                            <div className="text-left">
                                <span className="text-lg md:text-xl font-black text-white">{parseFloat(order.total || '0').toLocaleString('ar-EG')}</span>
                                <span className="text-xs text-primary font-bold ml-1">ج.م</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3 md:p-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-3 bg-white/[0.02]">
                    {isEditing ? (
                        <div className="flex gap-2 w-full md:w-auto">
                            <button
                                onClick={handleSave}
                                disabled={updateOrder.isPending || !editForm.fullName || !editForm.phone}
                                className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-6 py-2.5 rounded-xl bg-emerald-500 text-background-dark text-sm font-black shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                            >
                                {updateOrder.isPending ? <span className="material-symbols-outlined animate-spin text-[18px]">sync</span> : <span className="material-symbols-outlined text-[18px]">save</span>}
                                حفظ التعديلات
                            </button>
                            <button
                                onClick={() => {
                                    setEditForm({
                                        fullName: order.fullName || order.user?.name || '',
                                        phone: order.phone || order.user?.phone || '',
                                        governorate: order.governorate || '',
                                        city: order.city || '',
                                        address: order.address || '',
                                        notes: order.notes || ''
                                    });
                                    setIsEditing(false);
                                }}
                                disabled={updateOrder.isPending}
                                className="px-4 py-2.5 rounded-xl bg-white/5 text-slate-300 text-sm font-bold border border-white/10 active:scale-95 transition-all"
                            >
                                إلغاء
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 md:px-5 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-sm font-black border border-amber-500/20 transition-all active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                            تعديل الطلب
                        </button>
                    )}

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <button
                            onClick={() => setShowBillModal(true)}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 text-slate-300 rounded-xl text-sm font-bold transition-all border border-white/10 active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[20px]">print</span>
                            <span className="md:inline">طباعة</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="flex-1 md:flex-none px-6 py-2.5 bg-primary text-background-dark rounded-xl text-sm font-black transition-all shadow-lg shadow-primary/20 active:scale-95"
                        >
                            إغلاق
                        </button>
                    </div>
                </div>
            </div>

            {/* Bill Form Modal */}
            {showBillModal && (
                <PortableBillFormModal order={order} onClose={() => setShowBillModal(false)} />
            )}
        </div>
    );
}
