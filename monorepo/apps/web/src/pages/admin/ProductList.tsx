import { useState, useMemo, useCallback, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminProducts, useAdminStats, useDeleteProduct, useBulkUpdateProducts, useBulkAction, type Product } from '../../hooks/useAdmin';
import { useCategories, type Category } from '../../hooks/useCategories';
import toast from 'react-hot-toast';
import { CustomSelect } from '../../components/ui/CustomSelect';
import InventorySyncModal from '../../components/admin/InventorySyncModal';

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: string; bgColor: string; borderColor: string }> = {
    active: { color: 'text-emerald-500', label: 'نشط', icon: 'check_circle', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' },
    draft:  { color: 'text-slate-500',   label: 'غير نشط', icon: 'visibility_off', bgColor: 'bg-slate-500/10', borderColor: 'border-slate-500/20' },
};

function getProductStatus(product: Product): string {
    if (product.status === 'archived') return 'draft';
    return product.status || 'active';
}

// ================================================================
// Bulk Action Modals
// ================================================================

function PriceModal({ count, onClose, onApply, isPending }: {
    count: number;
    onClose: () => void;
    onApply: (mode: string, value: number) => void;
    isPending: boolean;
}) {
    const [mode, setMode] = useState('add_fixed');
    const [value, setValue] = useState('');
    const modeOptions = [
        { value: 'add_fixed', label: '➕ زيادة مبلغ ثابت' },
        { value: 'subtract_fixed', label: '➖ نقصان مبلغ ثابت' },
        { value: 'add_percent', label: '📈 زيادة نسبة %' },
        { value: 'subtract_percent', label: '📉 نقصان نسبة %' },
        { value: 'set_fixed', label: '🎯 تحديد سعر ثابت' },
    ];
    const isPercent = mode.includes('percent');
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-[#1e2532] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-amber-400">sell</span>
                        تعديل أسعار ({count} منتج)
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><span className="material-symbols-outlined">close</span></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">نوع التعديل</label>
                        <select value={mode} onChange={e => setMode(e.target.value)}
                            className="w-full h-11 bg-black/20 border border-white/10 rounded-xl px-4 text-white text-sm focus:border-primary outline-none">
                            {modeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">
                            {isPercent ? 'النسبة (%)' : 'المبلغ (ج.م)'}
                        </label>
                        <input type="number" min="0" value={value} onChange={e => setValue(e.target.value)}
                            className="w-full h-11 bg-black/20 border border-white/10 rounded-xl px-4 text-white text-sm focus:border-primary outline-none"
                            placeholder={isPercent ? 'مثال: 10' : 'مثال: 50'} autoFocus />
                    </div>
                </div>
                <div className="flex gap-3 mt-6">
                    <button onClick={() => { if (!value || isNaN(+value)) { toast.error('أدخل قيمة صحيحة'); return; } onApply(mode, +value); }}
                        disabled={isPending}
                        className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
                        {isPending ? <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className="material-symbols-outlined text-[18px]">check</span>}
                        تطبيق
                    </button>
                    <button onClick={onClose} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm transition-colors">إلغاء</button>
                </div>
            </div>
        </div>
    );
}

function StockModal({ count, onClose, onApply, isPending }: {
    count: number;
    onClose: () => void;
    onApply: (mode: string, value: number) => void;
    isPending: boolean;
}) {
    const [mode, setMode] = useState('add');
    const [value, setValue] = useState('');
    const modeOptions = [
        { value: 'add', label: '➕ إضافة كمية' },
        { value: 'subtract', label: '➖ نقصان كمية' },
        { value: 'set', label: '🎯 تحديد كمية ثابتة' },
    ];
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-[#1e2532] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-400">inventory_2</span>
                        تعديل المخزون ({count} منتج)
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><span className="material-symbols-outlined">close</span></button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">نوع التعديل</label>
                        <select value={mode} onChange={e => setMode(e.target.value)}
                            className="w-full h-11 bg-black/20 border border-white/10 rounded-xl px-4 text-white text-sm focus:border-primary outline-none">
                            {modeOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1.5">الكمية</label>
                        <input type="number" min="0" value={value} onChange={e => setValue(e.target.value)}
                            className="w-full h-11 bg-black/20 border border-white/10 rounded-xl px-4 text-white text-sm focus:border-primary outline-none"
                            placeholder="مثال: 10" autoFocus />
                    </div>
                </div>
                <div className="flex gap-3 mt-6">
                    <button onClick={() => { if (!value || isNaN(+value)) { toast.error('أدخل كمية صحيحة'); return; } onApply(mode, +value); }}
                        disabled={isPending}
                        className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
                        {isPending ? <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className="material-symbols-outlined text-[18px]">check</span>}
                        تطبيق
                    </button>
                    <button onClick={onClose} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm transition-colors">إلغاء</button>
                </div>
            </div>
        </div>
    );
}

function CategoryModal({ count, categories: cats, onClose, onApply, isPending }: {
    count: number;
    categories: { id: string; name: string; parentId?: string | null; parent?: { name: string } | null }[];
    onClose: () => void;
    onApply: (categoryId: string) => void;
    isPending: boolean;
}) {
    const [selectedCat, setSelectedCat] = useState('');

    // Build flat list: parents first, then children grouped under their parent
    const parents = cats.filter(c => !c.parentId);
    const children = cats.filter(c => !!c.parentId);

    const orderedList: { id: string; label: string; isChild: boolean }[] = [];
    parents.forEach(p => {
        orderedList.push({ id: p.id, label: p.name, isChild: false });
        children.filter(c => c.parentId === p.id).forEach(c => {
            orderedList.push({ id: c.id, label: `↳ ${c.name}`, isChild: true });
        });
    });
    // Add any orphan children (parents not in list)
    children.filter(c => !parents.find(p => p.id === c.parentId)).forEach(c => {
        orderedList.push({ id: c.id, label: `↳ ${c.name}`, isChild: true });
    });

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-[#1e2532] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-purple-400">category</span>
                        تغيير التصنيف ({count} منتج)
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><span className="material-symbols-outlined">close</span></button>
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">التصنيف الجديد</label>
                    {orderedList.length === 0 ? (
                        <div className="text-slate-500 text-sm py-4 text-center">جاري تحميل التصنيفات...</div>
                    ) : (
                        <select
                            value={selectedCat}
                            onChange={e => setSelectedCat(e.target.value)}
                            className="w-full h-11 bg-black/30 border border-white/10 rounded-xl px-4 text-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 outline-none appearance-none"
                            autoFocus
                        >
                            <option value="" disabled className="bg-[#1e2532] text-slate-400">-- اختر تصنيفاً --</option>
                            {orderedList.map(cat => (
                                <option key={cat.id} value={cat.id} className={`bg-[#1e2532] ${cat.isChild ? 'text-slate-300 pr-4' : 'text-white font-medium'}`}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
                <div className="flex gap-3 mt-6">
                    <button onClick={() => { if (!selectedCat) { toast.error('اختر تصنيفاً أولاً'); return; } onApply(selectedCat); }}
                        disabled={isPending}
                        className="flex-1 flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
                        {isPending ? <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className="material-symbols-outlined text-[18px]">check</span>}
                        تغيير التصنيف
                    </button>
                    <button onClick={onClose} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm transition-colors">إلغاء</button>
                </div>
            </div>
        </div>
    );
}

function DeleteConfirmModal({ count, onClose, onConfirm, isPending }: {
    count: number;
    onClose: () => void;
    onConfirm: () => void;
    isPending: boolean;
}) {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-[#1e2532] border border-white/10 rounded-2xl w-full max-w-sm p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-4 mb-5">
                    <div className="size-14 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
                        <span className="material-symbols-outlined text-[32px]">delete_forever</span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white">تأكيد الحذف الجماعي</h3>
                        <p className="text-sm text-slate-400 mt-1">هل أنت متأكد من حذف <span className="text-red-400 font-bold">{count} منتج</span>؟</p>
                    </div>
                </div>
                <p className="text-xs text-red-400/80 bg-red-500/10 rounded-lg p-3 mb-6">⚠️ هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع بيانات المنتجات المحددة بشكل نهائي.</p>
                <div className="flex gap-3">
                    <button onClick={onConfirm} disabled={isPending}
                        className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
                        {isPending ? <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className="material-symbols-outlined text-[18px]">delete_forever</span>}
                        نعم، احذف الكل
                    </button>
                    <button onClick={onClose} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm transition-colors">إلغاء</button>
                </div>
            </div>
        </div>
    );
}

// ================================================================
// Product Row
// ================================================================

interface ProductRowProps {
    product: Product;
    editedValue: { price?: string; stock?: number; discountPrice?: string | null } | undefined;
    onEditChange: (id: string, field: 'price' | 'stock' | 'discountPrice', value: string) => void;
    onDelete: (product: Product) => void;
    selected: boolean;
    onToggleSelect: (id: string) => void;
}

const ProductRow = memo(({
    product,
    editedValue,
    onEditChange,
    onDelete,
    selected,
    onToggleSelect
}: ProductRowProps) => {
    const navigate = useNavigate();
    const status = getProductStatus(product);
    const [imageError, setImageError] = useState(false);
    const imageUrl = product.images?.find(i => i.isPrimary)?.url || product.images?.[0]?.url;

    return (
        <tr className={`hover:bg-white/5 transition-colors group ${selected ? 'bg-primary/5' : ''}`}>
            <td className="px-6 py-2">
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => onToggleSelect(product.id)}
                        className="rounded border-white/10 bg-white/5 text-primary focus:ring-0 cursor-pointer"
                    />
                </div>
            </td>
            <td className="px-6 py-2">
                <div className="flex items-center gap-4">
                    <div className="size-12 rounded-lg bg-white/5 p-1 flex-shrink-0 border border-white/5 flex items-center justify-center overflow-hidden">
                        {imageUrl && !imageError ? (
                            <img src={imageUrl} alt={product.name} className="w-full h-full object-cover rounded" onError={() => setImageError(true)} loading="lazy" />
                        ) : (
                            <span className="material-symbols-outlined text-slate-600 text-[24px]">image_not_supported</span>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-white text-base">{product.name}</span>
                        <span className="text-slate-500 text-xs">SKU: {product.sku || 'N/A'}</span>
                    </div>
                </div>
            </td>
            <td className="px-6 py-2">
                <div className="flex flex-col">
                    <span className="text-slate-400">{product.category?.name || 'غير مصنف'}</span>
                    <span className="text-primary/70 text-[10px] font-bold">{product.brand?.name || ''}</span>
                </div>
            </td>
            <td className="px-6 py-2">
                <div className="flex justify-center">
                    <span
                        className={`material-symbols-outlined text-[20px] ${STATUS_CONFIG[status]?.color || STATUS_CONFIG.active.color}`}
                        title={STATUS_CONFIG[status]?.label || 'نشط'}
                    >
                        {STATUS_CONFIG[status]?.icon || STATUS_CONFIG.active.icon}
                    </span>
                </div>
            </td>
            <td className="px-6 py-2">
                <div className="flex flex-col gap-1 w-full max-w-[140px]">
                    <div className="relative group/input min-w-[100px]">
                        <input
                            type="text"
                            value={
                                product.discountPrice 
                                    ? (editedValue?.discountPrice ?? product.discountPrice)
                                    : (editedValue?.price ?? product.price)
                            }
                            onChange={(e) => onEditChange(product.id, product.discountPrice ? 'discountPrice' : 'price', e.target.value)}
                            className={`w-full bg-white/5 border ${
                                (product.discountPrice ? editedValue?.discountPrice !== undefined : editedValue?.price !== undefined) 
                                    ? 'border-primary/50' 
                                    : 'border-white/5'
                            } hover:border-white/20 rounded px-3 py-2 pl-9 text-sm font-bold text-white transition-all focus:border-primary focus:ring-1 focus:ring-primary outline-none`}
                        />
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-500 font-bold pointer-events-none bg-white/5 px-1 rounded">ج.م</span>
                    </div>
                    {product.discountPrice && (
                        <div className="flex items-center gap-1.5 px-1 mt-0.5">
                            <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">السعر الأساسي: {product.price} ج.م</span>
                        </div>
                    )}
                </div>
            </td>
            <td className="px-6 py-2">
                <div className="max-w-[80px]">
                    <input
                        type="number"
                        value={editedValue?.stock ?? product.stock}
                        onChange={(e) => onEditChange(product.id, 'stock', e.target.value)}
                        className={`w-full bg-white/5 border ${editedValue?.stock !== undefined ? 'border-primary/50' : 'border-white/5'} hover:border-white/20 rounded px-2 py-1 text-sm font-bold ${product.stock === 0 ? 'text-red-500' : (product.stock < 10 ? 'text-yellow-400' : 'text-emerald-400')} transition-all focus:border-primary focus:ring-1 focus:ring-primary outline-none`}
                    />
                </div>
            </td>
            <td className="px-6 py-2 text-left">
                <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onDelete(product)} className="p-2 rounded hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-colors" title="حذف">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                    <button onClick={() => navigate(`/admin/products/${product.id}`)} className="p-2 rounded hover:bg-white/10 hover:text-white text-slate-400 transition-colors" title="تعديل">
                        <span className="material-symbols-outlined text-[18px]">edit_square</span>
                    </button>
                    <Link to={`/product/${product.slug || product.id}`} className="p-2 rounded hover:bg-white/10 hover:text-white text-slate-400 transition-colors" title="معاينة">
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                    </Link>
                </div>
            </td>
        </tr>
    );
});

const MobileProductCard = memo(({
    product,
    editedValue,
    onEditChange,
    onDelete,
    selected,
    onToggleSelect
}: ProductRowProps) => {
    const navigate = useNavigate();
    const status = getProductStatus(product);
    const [imageError, setImageError] = useState(false);
    const imageUrl = product.images?.find(i => i.isPrimary)?.url || product.images?.[0]?.url;

    return (
        <div className={`glass-panel rounded-2xl overflow-hidden transition-all relative group/card border ${selected ? 'ring-2 ring-primary border-transparent' : 'border-white/5 shadow-xl'}`}>
            {/* Header Area */}
            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => onToggleSelect(product.id)}
                            className="rounded-md border-white/10 bg-black/20 text-primary focus:ring-offset-0 focus:ring-0 cursor-pointer size-5.5 transition-transform active:scale-90"
                        />
                    </div>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${STATUS_CONFIG[status]?.bgColor || 'bg-white/5'} ${STATUS_CONFIG[status]?.borderColor || 'border-white/10'}`}>
                        <span className={`material-symbols-outlined text-[16px] ${STATUS_CONFIG[status]?.color}`}>{STATUS_CONFIG[status]?.icon}</span>
                        <span className={`text-[11px] font-black ${STATUS_CONFIG[status]?.color}`}>{STATUS_CONFIG[status]?.label}</span>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={() => navigate(`/admin/products/${product.id}`)} className="size-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all" title="تعديل">
                        <span className="material-symbols-outlined text-xl">edit_square</span>
                    </button>
                    <button onClick={() => onDelete(product)} className="size-10 flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all" title="حذف">
                        <span className="material-symbols-outlined text-xl">delete</span>
                    </button>
                </div>
            </div>

            <div className="p-4">
                <div className="flex gap-4">
                    <div className="size-20 rounded-xl bg-[#161b26] p-1 shrink-0 border border-white/10 flex items-center justify-center overflow-hidden shadow-inner group-hover/card:scale-105 transition-transform duration-300">
                        {imageUrl && !imageError ? (
                            <img src={imageUrl} alt={product.name} className="w-full h-full object-contain rounded-lg" onError={() => setImageError(true)} />
                        ) : (
                            <span className="material-symbols-outlined text-slate-700 text-[32px]">image</span>
                        )}
                    </div>
                    <div className="flex flex-col min-w-0 flex-1 justify-center">
                        <h4 className="font-black text-white text-sm line-clamp-2 leading-tight mb-2">{product.name}</h4>
                        <div className="flex flex-wrap items-center gap-2">
                             <span className="text-[9px] font-black text-primary uppercase tracking-wider">{product.brand?.name}</span>
                             <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                             <div className="flex items-center gap-1">
                                 <span className="material-symbols-outlined text-[14px] text-slate-500">category</span>
                                 <span className="text-[10px] font-bold text-slate-500">{product.category?.name || 'غير مصنف'}</span>
                             </div>
                        </div>
                    </div>
                </div>

                {/* Coordinated Editing Inputs */}
                <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-white/5">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 px-1">
                            <span className="material-symbols-outlined text-[14px] text-primary">payments</span>
                            السعر الحالي
                        </label>
                        <div className="relative group/price">
                            <input
                                type="text"
                                value={product.discountPrice ? (editedValue?.discountPrice ?? product.discountPrice) : (editedValue?.price ?? product.price)}
                                onChange={(e) => onEditChange(product.id, product.discountPrice ? 'discountPrice' : 'price', e.target.value)}
                                className={`w-full bg-[#0f1115] border ${editedValue?.price || editedValue?.discountPrice ? 'border-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.1)]' : 'border-white/10'} rounded-xl px-3 py-2.5 text-xs font-black text-white outline-none focus:border-primary transition-all pr-8`}
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">ج.م</span>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 px-1">
                            <span className="material-symbols-outlined text-[14px] text-secondary">inventory_2</span>
                            المخزون
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                value={editedValue?.stock ?? product.stock}
                                onChange={(e) => onEditChange(product.id, 'stock', e.target.value)}
                                className={`w-full bg-[#0f1115] border ${editedValue?.stock !== undefined ? 'border-secondary shadow-[0_0_10px_rgba(var(--secondary-rgb),0.1)]' : 'border-white/10'} rounded-xl px-3 py-2.5 text-xs font-black outline-none focus:border-secondary transition-all ${product.stock === 0 ? 'text-red-500' : (product.stock < 10 ? 'text-yellow-400' : 'text-emerald-400')}`}
                            />
                            <div className={`absolute left-3 top-1/2 -translate-y-1/2 size-1.5 rounded-full ${product.stock === 0 ? 'bg-red-500 shadow-[0_0_5px_red]' : (product.stock < 10 ? 'bg-yellow-400 shadow-[0_0_5px_yellow]' : 'bg-emerald-400 shadow-[0_0_5px_green]')}`}></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <Link to={`/product/${product.slug || product.id}`} className="absolute top-[4.5rem] right-4 size-9 rounded-xl bg-white/5 backdrop-blur-md flex items-center justify-center text-slate-400 border border-white/10 hover:bg-white/10 hover:text-white transition-all shadow-lg active:scale-90" title="معاينة في المتجر">
                <span className="material-symbols-outlined text-[20px]">open_in_new</span>
            </Link>
        </div>
    );
});

// ================================================================
// Main Component
// ================================================================

export function ProductList() {
    const { data: productsData, isLoading, refetch } = useAdminProducts({ limit: 5000, status: '' });
    const { data: statsData } = useAdminStats();
    const categoriesResult = useCategories();
    const [syncModalOpen, setSyncModalOpen] = useState(false);
    const deleteProduct = useDeleteProduct();
    const bulkUpdate = useBulkUpdateProducts();
    const bulkAction = useBulkAction();
    const productsList = productsData?.data || [];
    const allCategories: Category[] = categoriesResult?.categories || [];

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; product: Product | null }>({ show: false, product: null });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);

    // Modal states
    const [showPriceModal, setShowPriceModal] = useState(false);
    const [showStockModal, setShowStockModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

    // Inline Editing State
    const [editedProducts, setEditedProducts] = useState<Record<string, { price?: string; stock?: number; discountPrice?: string | null }>>({});
    const hasChanges = Object.keys(editedProducts).length > 0;

    const handleEditChange = useCallback((id: string, field: 'price' | 'stock' | 'discountPrice', value: string) => {
        setEditedProducts(prev => {
            const current = prev[id] || {};
            return { ...prev, [id]: { ...current, [field]: field === 'stock' ? parseInt(value) || 0 : value } };
        });
    }, []);

    const handleSaveAll = async () => {
        const updates = Object.entries(editedProducts).map(([id, data]) => ({ id, ...data }));
        try {
            await bulkUpdate.mutateAsync(updates);
            setEditedProducts({});
        } catch (err) { console.error('Failed to bulk update:', err); }
    };

    const handleDelete = async () => {
        if (deleteConfirm.product) {
            try {
                await deleteProduct.mutateAsync(deleteConfirm.product.id);
                setDeleteConfirm({ show: false, product: null });
            } catch (error) { console.error('Failed to delete product:', error); }
        }
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredProducts.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredProducts.map((p: Product) => p.id)));
        }
    };

    const toggleSelect = useCallback((id: string) => {
        setSelectedIds((prev: Set<string>) => {
            const newSelected = new Set(prev);
            if (newSelected.has(id)) newSelected.delete(id);
            else newSelected.add(id);
            return newSelected;
        });
    }, []);

    const handleDeleteClick = useCallback((product: Product) => {
        setDeleteConfirm({ show: true, product });
    }, []);

    // Bulk action helpers
    const selectedIdsArr = Array.from(selectedIds);

    const executeBulkAction = async (action: string, payload?: any) => {
        await bulkAction.mutateAsync({ ids: selectedIdsArr, action: action as any, payload });
        setSelectedIds(new Set());
    };

    const handleBulkShow = () => executeBulkAction('show');
    const handleBulkHide = () => executeBulkAction('hide');
    const handleBulkDelete = async () => {
        await executeBulkAction('delete');
        setShowBulkDeleteModal(false);
    };
    const handleBulkPrice = async (mode: string, value: number) => {
        await executeBulkAction('price', { priceMode: mode, priceValue: value });
        setShowPriceModal(false);
    };
    const handleBulkStock = async (mode: string, value: number) => {
        await executeBulkAction('stock', { stockMode: mode, stockValue: value });
        setShowStockModal(false);
    };
    const handleBulkCategory = async (categoryId: string) => {
        await executeBulkAction('category', { categoryId });
        setShowCategoryModal(false);
    };

    // Calculate stats
    const totalProducts = productsList.length;
    const totalValue = productsList.reduce((sum, p) => sum + (parseFloat(p.price) * p.stock), 0);
    const lowStockCount = productsList.filter(p => p.stock < 10 && p.stock > 0).length;

    const categories = [...new Set(productsList.map(p => p.category?.name).filter(Boolean))];

    const filteredProducts = useMemo(() => {
        let result = productsList.filter((product) => {
            const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (product.sku?.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesCategory = selectedCategory === '' || product.category?.name === selectedCategory;
            const matchesStatus = selectedStatus === '' || product.status === selectedStatus;
            const matchesLowStock = !showLowStockOnly || (product.stock < 10 && product.stock > 0);
            return matchesSearch && matchesCategory && matchesStatus && matchesLowStock;
        });

        result.sort((a, b) => {
            if (sortBy === 'name') return a.name.localeCompare(b.name, 'ar');
            if (sortBy === 'price_asc') return parseFloat(a.price) - parseFloat(b.price);
            if (sortBy === 'price_desc') return parseFloat(b.price) - parseFloat(a.price);
            if (sortBy === 'newest') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            if (sortBy === 'oldest') return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
            return 0;
        });

        return result;
    }, [productsList, searchQuery, selectedCategory, selectedStatus, sortBy, showLowStockOnly]);

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="text-center">
                        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-gray-400">جاري تحميل المنتجات...</p>
                    </div>
                </div>
            </div>
        );
    }

    const isBulkPending = bulkAction.isPending;

    return (
        <div className="flex flex-col gap-6">
            {/* Page Header */}
            <div className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4 border-b border-white/5 bg-background-dark/80 backdrop-blur-md sticky top-0 z-30 -mx-3 md:-mx-8 -mt-3 md:-mt-6 mb-2">
                <div className="flex items-center gap-3 md:gap-4">
                    <h2 className="text-white text-lg md:text-xl font-bold tracking-tight">إدارة المنتجات</h2>
                    <span className="h-6 w-px bg-white/10 mx-1 md:mx-2"></span>
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] md:text-xs font-bold bg-white/5 text-slate-400 border border-white/5">{totalProducts} منتج</span>
                    </div>
                </div>
            </div>
            
            {/* Stats Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
                <button 
                    onClick={() => {
                        setSelectedStatus('');
                        setShowLowStockOnly(false);
                    }}
                    className={`glass-panel rounded-xl p-2.5 md:p-4 flex items-center gap-4 relative overflow-hidden group transition-all text-right
                        ${selectedStatus === '' && !showLowStockOnly ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'hover:border-primary/30'}`}
                >
                    <div className="size-10 md:size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 transition-all group-hover:scale-110">
                        <span className="material-symbols-outlined text-[20px] md:text-[28px]">inventory</span>
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <p className="text-slate-400 text-[9px] md:text-xs font-bold truncate">إجمالي المنتجات</p>
                        <h3 className="text-base md:text-xl font-bold text-white leading-none truncate">{statsData?.totalProducts || totalProducts}</h3>
                    </div>
                </button>
                
                <button 
                    onClick={() => {
                        setSelectedStatus('active');
                        setShowLowStockOnly(false);
                    }}
                    className={`glass-panel rounded-xl p-2.5 md:p-4 flex items-center gap-4 relative overflow-hidden group transition-all text-right
                        ${selectedStatus === 'active' ? 'border-emerald-500 ring-1 ring-emerald-500/20 bg-emerald-500/5' : 'hover:border-emerald-500/30'}`}
                >
                    <div className="size-10 md:size-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 transition-all group-hover:scale-110">
                        <span className="material-symbols-outlined text-[20px] md:text-[28px]">visibility</span>
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <p className="text-slate-400 text-[9px] md:text-xs font-bold truncate">منتجات نشطة</p>
                        <h3 className="text-base md:text-xl font-bold text-white leading-none truncate">{statsData?.activeProducts || 0}</h3>
                    </div>
                </button>

                <button 
                    onClick={() => {
                        setSelectedStatus('draft');
                        setShowLowStockOnly(false);
                    }}
                    className={`glass-panel rounded-xl p-2.5 md:p-4 flex items-center gap-4 relative overflow-hidden group transition-all text-right
                        ${selectedStatus === 'draft' ? 'border-slate-500 ring-1 ring-slate-500/20 bg-slate-500/5' : 'hover:border-slate-500/30'}`}
                >
                    <div className="size-10 md:size-12 rounded-lg bg-slate-500/10 flex items-center justify-center text-slate-400 shrink-0 transition-all group-hover:scale-110">
                        <span className="material-symbols-outlined text-[20px] md:text-[28px]">visibility_off</span>
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <p className="text-slate-400 text-[9px] md:text-xs font-bold truncate">منتجات مخفية</p>
                        <h3 className="text-base md:text-xl font-bold text-white leading-none truncate">{statsData?.inactiveProducts || 0}</h3>
                    </div>
                </button>

                <div className="glass-panel rounded-xl p-2.5 md:p-4 flex items-center gap-4 relative overflow-hidden group hover:border-emerald-400/30 transition-all">
                    <div className="size-10 md:size-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 transition-all group-hover:scale-110">
                        <span className="material-symbols-outlined text-[20px] md:text-[28px]">attach_money</span>
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <p className="text-slate-400 text-[9px] md:text-xs font-bold truncate">قيمة المخزون</p>
                        <h3 className="text-base md:text-xl font-bold text-white leading-none truncate">{totalValue.toLocaleString('ar-EG')}</h3>
                    </div>
                </div>

                <button 
                    onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                    className={`glass-panel rounded-xl p-2.5 md:p-4 flex items-center gap-4 relative overflow-hidden group transition-all border-l-2 border-secondary/50 col-span-2 lg:col-span-1 text-right
                        ${showLowStockOnly ? 'border-secondary ring-1 ring-secondary/20 bg-secondary/5' : 'hover:border-secondary/30'}`}
                >
                    <div className="size-10 md:size-12 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary shrink-0 transition-all group-hover:scale-110">
                        <span className="material-symbols-outlined text-[20px] md:text-[28px]">warning</span>
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <p className="text-slate-400 text-[9px] md:text-xs font-bold truncate">تنبيهات المخزون</p>
                        <h3 className="text-base md:text-xl font-bold text-white leading-none truncate">{lowStockCount}</h3>
                    </div>
                </button>
            </div>

            {/* Filters & Actions */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between px-1 md:hidden">
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">أدوات الفلترة والتحكم</p>
                    <button 
                        onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-[10px] font-bold transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined text-sm">{isFiltersOpen ? 'expand_less' : 'filter_alt'}</span>
                        {isFiltersOpen ? 'تصغير' : 'توسيع الفلاتر'}
                    </button>
                </div>

                <div className={`${isFiltersOpen ? 'flex' : 'hidden md:flex'} glass-panel rounded-xl p-4 flex-col items-stretch justify-between gap-4 relative z-10 animate-in fade-in slide-in-from-top-2 duration-200`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:flex lg:items-center gap-3">
                        <div className="relative w-full lg:w-64">
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                                <span className="material-symbols-outlined text-[20px]">search</span>
                            </div>
                            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="بحث باسم المنتج، SKU..."
                                className="block w-full h-11 pr-10 pl-4 rounded-lg bg-[#161b26] border border-white/5 text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-primary focus:border-primary/50 transition-all font-bold" />
                        </div>
                        <CustomSelect value={selectedCategory} onChange={setSelectedCategory}
                            options={[{ value: '', label: 'جميع الأقسام' }, ...categories.filter((cat): cat is string => !!cat).map(cat => ({ value: cat, label: cat }))]}
                            placeholder="جميع الأقسام" className="w-full" />
                        <CustomSelect value={selectedStatus} onChange={setSelectedStatus}
                            options={[{ value: '', label: 'الحالة: الكل' }, { value: 'active', label: 'نشط' }, { value: 'draft', label: 'غير نشط' }]}
                            placeholder="الحالة: الكل" className="w-full" />
                        <CustomSelect value={sortBy} onChange={setSortBy}
                            options={[
                                { value: 'name', label: 'الاسم (أ-ي)' },
                                { value: 'price_asc', label: 'السعر: من الأقل' },
                                { value: 'price_desc', label: 'السعر: من الأعلى' },
                                { value: 'newest', label: 'الأحدث أولاً' },
                                { value: 'oldest', label: 'الأقدم أولاً' }
                            ]}
                            placeholder="ترتيب حسب" className="w-full" icon="sort" />
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                        <button onClick={() => setSyncModalOpen(true)}
                            className="flex-1 flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-bold border border-emerald-500/20 transition-all w-full">
                            <span className="material-symbols-outlined text-[20px]">sync</span>
                            <span>تحديث المخزون (Excel)</span>
                        </button>
                        <Link to="/admin/products/add"
                            className="flex-1 flex items-center justify-center gap-2 h-11 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-bold shadow-lg shadow-primary/20 transition-all w-full">
                            <span className="material-symbols-outlined text-[20px]">add</span>
                            <span>إضافة منتج</span>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Products Listing */}
            <div className="flex flex-col">
                {/* Desktop View (Table) */}
                <div className="hidden lg:block glass-panel rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px] text-sm text-right">
                            <thead className="bg-white/5 text-slate-400 font-medium border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-3 w-10">
                                        <div className="flex items-center text-left justify-end">
                                            <input type="checkbox"
                                                checked={filteredProducts.length > 0 && selectedIds.size === filteredProducts.length}
                                                onChange={toggleSelectAll}
                                                className="rounded border-white/10 bg-white/5 text-primary focus:ring-0 cursor-pointer" />
                                        </div>
                                    </th>
                                    <th className="px-6 py-4 whitespace-nowrap">المنتج</th>
                                    <th className="px-6 py-4 whitespace-nowrap">القسم / الماركة</th>
                                    <th className="px-6 py-4 whitespace-nowrap w-24 text-center">الحالة</th>
                                    <th className="px-6 py-4 whitespace-nowrap w-40">السعر</th>
                                    <th className="px-6 py-4 whitespace-nowrap w-32">المخزون</th>
                                    <th className="px-6 py-4 whitespace-nowrap text-left">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-slate-300">
                                {filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                            <span className="material-symbols-outlined text-4xl mb-2 block">inventory_2</span>
                                            لا توجد منتجات تطابق البحث
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProducts.map((product: Product) => (
                                        <ProductRow
                                            key={product.id}
                                            product={product}
                                            editedValue={editedProducts[product.id]}
                                            onEditChange={handleEditChange}
                                            onDelete={handleDeleteClick}
                                            selected={selectedIds.has(product.id)}
                                            onToggleSelect={toggleSelect}
                                        />
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile View (Cards) */}
                <div className="lg:hidden flex flex-col gap-4">
                    {filteredProducts.length === 0 ? (
                        <div className="glass-panel rounded-xl p-12 text-center text-slate-500">
                            <span className="material-symbols-outlined text-4xl mb-2 block">inventory_2</span>
                            لا توجد منتجات تطابق البحث
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {filteredProducts.map((product: Product) => (
                                <MobileProductCard
                                    key={product.id}
                                    product={product}
                                    editedValue={editedProducts[product.id]}
                                    onEditChange={handleEditChange}
                                    onDelete={handleDeleteClick}
                                    selected={selectedIds.has(product.id)}
                                    onToggleSelect={toggleSelect}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                <div className="glass-panel rounded-xl mt-4 p-4 flex items-center justify-between">
                    <span className="text-[10px] md:text-sm text-slate-500 font-bold">عرض {filteredProducts.length} من {totalProducts} منتج</span>
                    <div className="flex items-center gap-2">
                        <button className="size-8 flex items-center justify-center rounded bg-primary text-white text-xs font-bold shadow-lg shadow-primary/20">1</button>
                    </div>
                </div>
            </div>

            {/* ============================================================ */}
            {/* BULK ACTIONS TOOLBAR (Sticky Bottom) */}
            {/* ============================================================ */}
            {selectedIds.size > 0 && !hasChanges && (
                <div className="fixed bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-8 duration-300 w-[95vw] md:w-max">
                    <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 md:p-2 flex items-center gap-1 md:gap-1.5 shadow-2xl ring-1 ring-white/5 overflow-x-auto no-scrollbar">
                        {/* Selection Badge */}
                        <div className="flex items-center gap-2 px-2 md:px-3 py-1.5 border-l border-white/10 ml-0.5 md:ml-1 shrink-0 bg-white/5 rounded-xl">
                            <div className="size-2 rounded-full bg-primary animate-pulse"></div>
                            <span className="text-xs md:text-sm font-black text-white whitespace-nowrap">{selectedIds.size}</span>
                        </div>

                        {/* Show */}
                        <button onClick={handleBulkShow} disabled={isBulkPending}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 text-xs font-bold transition-all disabled:opacity-50 shrink-0"
                            title="إظهار المحدد">
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                            <span>إظهار</span>
                        </button>

                        {/* Hide */}
                        <button onClick={handleBulkHide} disabled={isBulkPending}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-slate-500/20 text-slate-400 hover:text-slate-300 text-xs font-bold transition-all disabled:opacity-50 shrink-0"
                            title="إخفاء المحدد">
                            <span className="material-symbols-outlined text-[18px]">visibility_off</span>
                            <span>إخفاء</span>
                        </button>

                        <div className="h-6 w-px bg-white/10 mx-0.5 shrink-0" />

                        {/* Price */}
                        <button onClick={() => setShowPriceModal(true)} disabled={isBulkPending}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 text-xs font-bold transition-all disabled:opacity-50 shrink-0"
                            title="تعديل الأسعار">
                            <span className="material-symbols-outlined text-[18px]">sell</span>
                            <span>تعديل الأسعار</span>
                        </button>

                        {/* Stock */}
                        <button onClick={() => setShowStockModal(true)} disabled={isBulkPending}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 text-xs font-bold transition-all disabled:opacity-50 shrink-0"
                            title="تعديل المخزون">
                            <span className="material-symbols-outlined text-[18px]">inventory_2</span>
                            <span>تعديل المخزون</span>
                        </button>

                        {/* Category */}
                        <button onClick={() => setShowCategoryModal(true)} disabled={isBulkPending}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 text-xs font-bold transition-all disabled:opacity-50 shrink-0"
                            title="تغيير التصنيف">
                            <span className="material-symbols-outlined text-[18px]">category</span>
                            <span>تغيير التصنيف</span>
                        </button>

                        <div className="h-6 w-px bg-white/10 mx-0.5 shrink-0" />

                        {/* Delete */}
                        <button onClick={() => setShowBulkDeleteModal(true)} disabled={isBulkPending}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-bold transition-all disabled:opacity-50 shrink-0"
                            title="حذف المحدد">
                            <span className="material-symbols-outlined text-[18px]">delete_sweep</span>
                            <span>حذف</span>
                        </button>

                        {/* Close/Deselect */}
                        <button onClick={() => setSelectedIds(new Set())}
                            className="mr-1 p-1.5 rounded-xl hover:bg-white/10 text-slate-500 hover:text-white transition-all shrink-0">
                            <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Inline Edits Toolbar */}
            {hasChanges && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-8 duration-300">
                    <div className="bg-slate-900/90 backdrop-blur-xl border border-primary/20 rounded-2xl p-2 pl-6 flex items-center gap-4 shadow-2xl shadow-primary/20 ring-1 ring-white/10">
                        <div className="flex items-center gap-2">
                            <div className="size-2 rounded-full bg-primary animate-pulse"></div>
                            <span className="text-sm font-bold text-white whitespace-nowrap">لديك {Object.keys(editedProducts).length} تعديلات غير محفوظة</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setEditedProducts({})} disabled={bulkUpdate.isPending}
                                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-sm font-bold transition-all disabled:opacity-50">تجاهل</button>
                            <button onClick={handleSaveAll} disabled={bulkUpdate.isPending}
                                className="px-6 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-bold transition-all shadow-lg shadow-primary/30 flex items-center gap-2 disabled:opacity-50">
                                {bulkUpdate.isPending ? (
                                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> جاري الحفظ...</>
                                ) : (
                                    <><span className="material-symbols-outlined text-[18px]">save</span> حفظ التعديلات</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* MODALS */}
            {/* ============================================================ */}

            {/* Single-Product Delete Confirmation */}
            {deleteConfirm.show && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="glass-panel rounded-xl p-6 max-w-md w-full animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="size-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
                                <span className="material-symbols-outlined text-[28px]">warning</span>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-white">تأكيد الحذف</h3>
                                <p className="text-sm text-slate-400">هل أنت متأكد من حذف هذا المنتج؟</p>
                            </div>
                        </div>
                        <div className="bg-white/5 rounded-lg p-3 mb-6">
                            <p className="text-white font-medium">{deleteConfirm.product?.name}</p>
                            <p className="text-xs text-slate-500">SKU: {deleteConfirm.product?.sku || 'N/A'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={handleDelete} disabled={deleteProduct.isPending}
                                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2">
                                {deleteProduct.isPending ? (
                                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> جاري الحذف...</>
                                ) : (
                                    <><span className="material-symbols-outlined text-[18px]">delete</span> نعم، احذف المنتج</>
                                )}
                            </button>
                            <button onClick={() => setDeleteConfirm({ show: false, product: null })} disabled={deleteProduct.isPending}
                                className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 px-4 py-2.5 rounded-lg text-sm font-bold transition-all border border-white/10">
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Price Modal */}
            {showPriceModal && (
                <PriceModal count={selectedIds.size} onClose={() => setShowPriceModal(false)} onApply={handleBulkPrice} isPending={isBulkPending} />
            )}
            {/* Bulk Stock Modal */}
            {showStockModal && (
                <StockModal count={selectedIds.size} onClose={() => setShowStockModal(false)} onApply={handleBulkStock} isPending={isBulkPending} />
            )}
            {/* Bulk Category Modal */}
            {showCategoryModal && (
                <CategoryModal count={selectedIds.size} categories={allCategories} onClose={() => setShowCategoryModal(false)} onApply={handleBulkCategory} isPending={isBulkPending} />
            )}
            {/* Bulk Delete Confirm */}
            {showBulkDeleteModal && (
                <DeleteConfirmModal count={selectedIds.size} onClose={() => setShowBulkDeleteModal(false)} onConfirm={handleBulkDelete} isPending={isBulkPending} />
            )}

            {/* Inventory Sync Modal */}
            <InventorySyncModal isOpen={syncModalOpen} onClose={() => setSyncModalOpen(false)} onSuccess={() => refetch()} />
        </div>
    );
}

export default ProductList;
