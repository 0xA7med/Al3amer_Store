import { useState, memo, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Product } from '../../hooks/useAdmin';
import { calculateAiScore } from '../../utils/aiUtils';

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: string; bgColor: string; borderColor: string }> = {
    active: { color: 'text-emerald-500', label: 'نشط', icon: 'check_circle', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20' },
    draft: { color: 'text-slate-500', label: 'غير نشط', icon: 'visibility_off', bgColor: 'bg-slate-500/10', borderColor: 'border-slate-500/20' },
};

function getProductStatus(product: Product): string {
    if (product.status === 'archived') return 'draft';
    return product.status || 'active';
}

export interface ProductRowProps {
    product: Product;
    editedValue: { price?: string; stock?: number; discountPrice?: string | null } | undefined;
    onEditChange: (id: string, field: 'price' | 'stock' | 'discountPrice', value: string) => void;
    onDelete: (product: Product) => void;
    selected: boolean;
    onToggleSelect: (id: string) => void;
}

export const ProductRow = memo(({
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
    const aiScore = useMemo(() => calculateAiScore(product), [product]);

    return (
        <tr className={`hover:bg-white/5 transition-colors group ${selected ? 'bg-primary/5' : ''}`}>
            <td className="px-6 py-2">
                <div className="flex items-center">
                    <input type="checkbox" checked={selected} onChange={() => onToggleSelect(product.id)}
                        className="rounded border-white/10 bg-white/5 text-primary focus:ring-0 cursor-pointer" />
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
                <div className="flex flex-col gap-0.5">
                    <span className="text-slate-400 text-sm">{product.category?.name || 'غير مصنف'}</span>
                    <div className="flex items-center gap-2">
                        <span className="text-primary/70 text-[10px] font-bold">{product.brand?.name || ''}</span>
                        <div className={`flex items-center gap-1 px-1 rounded border text-[8px] font-black transition-all ${aiScore >= 80 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : aiScore >= 50 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`} title="مؤشر جاهزية الـ AI">
                            <span className="material-symbols-outlined text-[10px]">psychology</span>
                            <span>{aiScore}%</span>
                        </div>
                    </div>
                </div>
            </td>
            <td className="px-6 py-2">
                <div className="flex justify-center">
                    <span className={`material-symbols-outlined text-[20px] ${STATUS_CONFIG[status]?.color || STATUS_CONFIG.active.color}`}
                        title={STATUS_CONFIG[status]?.label || 'نشط'}>
                        {STATUS_CONFIG[status]?.icon || STATUS_CONFIG.active.icon}
                    </span>
                </div>
            </td>
            <td className="px-6 py-2">
                <div className="flex flex-col gap-1 w-full max-w-[140px]">
                    <div className="relative group/input min-w-[100px]">
                        <input type="text"
                            value={product.discountPrice ? (editedValue?.discountPrice ?? product.discountPrice) : (editedValue?.price ?? product.price)}
                            onChange={(e) => onEditChange(product.id, product.discountPrice ? 'discountPrice' : 'price', e.target.value)}
                            className={`w-full bg-white/5 border ${(product.discountPrice ? editedValue?.discountPrice !== undefined : editedValue?.price !== undefined) ? 'border-primary/50' : 'border-white/5'} hover:border-white/20 rounded px-3 py-2 pl-9 text-sm font-bold text-white transition-all focus:border-primary focus:ring-1 focus:ring-primary outline-none`} />
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
                    <input type="number" value={editedValue?.stock ?? product.stock}
                        onChange={(e) => onEditChange(product.id, 'stock', e.target.value)}
                        className={`w-full bg-white/5 border ${editedValue?.stock !== undefined ? 'border-primary/50' : 'border-white/5'} hover:border-white/20 rounded px-2 py-1 text-sm font-bold ${product.stock === 0 ? 'text-red-500' : (product.stock < 10 ? 'text-yellow-400' : 'text-emerald-400')} transition-all focus:border-primary focus:ring-1 focus:ring-primary outline-none`} />
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

export const MobileProductCard = memo(({
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
    const aiScore = useMemo(() => calculateAiScore(product), [product]);

    return (
        <div className={`glass-panel rounded-2xl overflow-hidden transition-all relative group/card border ${selected ? 'ring-2 ring-primary border-transparent' : 'border-white/5 shadow-xl'}`}>
            <div className="flex items-center justify-between p-5 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <input type="checkbox" checked={selected} onChange={() => onToggleSelect(product.id)}
                            className="rounded-md border-white/10 bg-black/20 text-primary focus:ring-offset-0 focus:ring-0 cursor-pointer size-5.5 transition-transform active:scale-90" />
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
                            <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[8px] font-black transition-all ${aiScore >= 80 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : aiScore >= 50 ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`} title="مؤشر جاهزية الـ AI">
                                <span className="material-symbols-outlined text-[10px]">psychology</span>
                                <span>{aiScore}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-5 pt-4 border-t border-white/5">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 px-1">
                            <span className="material-symbols-outlined text-[14px] text-primary">payments</span>
                            السعر الحالي
                        </label>
                        <div className="relative group/price">
                            <input type="text"
                                value={product.discountPrice ? (editedValue?.discountPrice ?? product.discountPrice) : (editedValue?.price ?? product.price)}
                                onChange={(e) => onEditChange(product.id, product.discountPrice ? 'discountPrice' : 'price', e.target.value)}
                                className={`w-full bg-[#0f1115] border ${editedValue?.price || editedValue?.discountPrice ? 'border-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.1)]' : 'border-white/10'} rounded-xl px-3 py-2.5 text-xs font-black text-white outline-none focus:border-primary transition-all pr-8`} />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">ج.م</span>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 px-1">
                            <span className="material-symbols-outlined text-[14px] text-secondary">inventory_2</span>
                            المخزون
                        </label>
                        <div className="relative">
                            <input type="number" value={editedValue?.stock ?? product.stock}
                                onChange={(e) => onEditChange(product.id, 'stock', e.target.value)}
                                className={`w-full bg-[#0f1115] border ${editedValue?.stock !== undefined ? 'border-secondary shadow-[0_0_10px_rgba(var(--secondary-rgb),0.1)]' : 'border-white/10'} rounded-xl px-3 py-2.5 text-xs font-black outline-none focus:border-secondary transition-all ${product.stock === 0 ? 'text-red-500' : (product.stock < 10 ? 'text-yellow-400' : 'text-emerald-400')}`} />
                            <div className={`absolute left-3 top-1/2 -translate-y-1/2 size-1.5 rounded-full ${product.stock === 0 ? 'bg-red-500 shadow-[0_0_5px_red]' : (product.stock < 10 ? 'bg-yellow-400 shadow-[0_0_5px_yellow]' : 'bg-emerald-400 shadow-[0_0_5px_green]')}`} />
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
