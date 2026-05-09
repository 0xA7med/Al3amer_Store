import { useState } from 'react';
import toast from 'react-hot-toast';
import { compressImage } from '../../utils/imageUtils';
import type { Product } from '../../hooks/useAdmin';

export function GroupModal({ products, onClose, onApply, isPending }: {
    products: Product[];
    onClose: () => void;
    onApply: (groupName: string, variants: { id: string; options: Record<string, string> }[], multiplier?: number, tiers?: any[]) => void;
    isPending: boolean;
}) {
    const [groupName, setGroupName] = useState('');
    const [propertyNames, setPropertyNames] = useState<string[]>(['المقاس']);
    const [variantValues, setVariantValues] = useState<Record<string, Record<string, string>>>({});
    const [accountingMultiplier, setAccountingMultiplier] = useState<string>('1');
    const [salesTiers, setSalesTiers] = useState<any[]>([
        { id: 'initial-tier', label: 'بكرة واحدة', quantity: 1, adjustmentType: 'multiplier', adjustmentValue: '1', imageUrl: '' }
    ]);

    const handleAddProperty = () => setPropertyNames([...propertyNames, 'خاصية جديدة']);

    const applyToAll = (propName: string) => {
        const firstValue = variantValues[products[0].id]?.[propName] || '';
        const newValues = { ...variantValues };
        products.forEach(p => {
            if (!newValues[p.id]) newValues[p.id] = {};
            newValues[p.id][propName] = firstValue;
        });
        setVariantValues(newValues);
        toast.success(`تم تطبيق "${firstValue}" على جميع المنتجات`);
    };

    const handleUpdatePropertyName = (index: number, newName: string) => {
        const newProps = [...propertyNames];
        const oldName = newProps[index];
        newProps[index] = newName;
        setPropertyNames(newProps);

        const newValues = { ...variantValues };
        Object.keys(newValues).forEach(id => {
            if (newValues[id]?.[oldName] !== undefined) {
                newValues[id][newName] = newValues[id][oldName];
                delete newValues[id][oldName];
            }
        });
        setVariantValues(newValues);
    };

    const handleRemoveProperty = (index: number) => {
        const oldName = propertyNames[index];
        const newProps = propertyNames.filter((_, i) => i !== index);
        setPropertyNames(newProps);

        const newValues = { ...variantValues };
        Object.keys(newValues).forEach(id => {
            if (newValues[id]) delete newValues[id][oldName];
        });
        setVariantValues(newValues);
    };

    const handleValueChange = (productId: string, propName: string, value: string) => {
        setVariantValues(prev => ({
            ...prev,
            [productId]: {
                ...(prev[productId] || {}),
                [propName]: value
            }
        }));
    };

    const handleAddTier = () => {
        setSalesTiers([...salesTiers, { id: Math.random().toString(36).substring(7), label: '', quantity: 1, adjustmentType: 'multiplier', adjustmentValue: '1', imageUrl: '' }]);
    };

    const handleTierImageUpload = async (index: number, file: File) => {
        try {
            const compressed = await compressImage(file);
            handleUpdateTier(index, 'imageUrl', compressed);
            toast.success('تم رفع الصورة بنجاح');
        } catch (error) {
            toast.error('فشل رفع الصورة');
        }
    };

    const handleUpdateTier = (index: number, field: string, value: any) => {
        const newTiers = [...salesTiers];
        newTiers[index] = { ...newTiers[index], [field]: value };
        setSalesTiers(newTiers);
    };

    const handleRemoveTier = (index: number) => {
        setSalesTiers(salesTiers.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (!groupName.trim()) return toast.error('يرجى إدخال اسم المجموعة');
        const variants = products.map(p => ({
            id: p.id,
            options: variantValues[p.id] || {}
        }));
        onApply(
            groupName,
            variants,
            parseFloat(accountingMultiplier) || 1,
            salesTiers.length > 0 ? salesTiers : undefined
        );
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-[#1e2532] border border-white/10 rounded-2xl w-full max-w-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined">call_merge</span>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-white">دمج كمنتج متغير</h3>
                            <p className="text-sm text-slate-400">تجميع {products.length} منتجات في منتج واحد</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 transition-colors">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-300 mb-2">اسم المتغير الأب (Parent Product Name)</label>
                            <input type="text" value={groupName} onChange={e => setGroupName(e.target.value)} placeholder="مثال: بكر كاشير فوري 80مم"
                                className="w-full bg-[#0f1115] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-primary mb-2 flex items-center gap-2">
                                <span className="material-symbols-outlined text-[18px]">inventory</span>
                                عدد الوحدات في العبوة المخزنية (Multiplier)
                            </label>
                            <input type="number" value={accountingMultiplier} onChange={e => setAccountingMultiplier(e.target.value)}
                                placeholder="مثال: 100 للبكر، 1 للقطع المنفردة"
                                className="w-full bg-[#0f1115] border border-primary/20 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" />
                        </div>
                    </div>

                    {/* Sales Tiers */}
                    <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h4 className="text-sm font-bold text-white">شرائح الكمية والأسعار (Sales Tiers)</h4>
                                <p className="text-[11px] text-slate-400 mt-0.5">حدد الأسعار والكميات والصور لكل عبوة (مثلاً: 1 بكرة، 5 بكرات...)</p>
                            </div>
                            <button onClick={handleAddTier} className="text-xs bg-primary text-white px-3 py-2 rounded-lg flex items-center gap-1 hover:bg-primary-dark transition-colors">
                                <span className="material-symbols-outlined text-[16px]">add</span> إضافة شريحة
                            </button>
                        </div>
                        <div className="space-y-3">
                            {salesTiers.map((tier, idx) => (
                                <div key={idx} className="grid grid-cols-12 gap-2 bg-[#0f1115] p-3 rounded-xl border border-white/5 items-center">
                                    <div className="col-span-3">
                                        <label className="text-[10px] text-slate-500 block mb-1">اسم الشريحة</label>
                                        <input type="text" placeholder="مثال: قطعة" value={tier.label} onChange={e => handleUpdateTier(idx, 'label', e.target.value)}
                                            className="w-full bg-[#1e2532] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] text-slate-500 block mb-1">الكمية</label>
                                        <input type="number" placeholder="100" value={tier.quantity} onChange={e => handleUpdateTier(idx, 'quantity', parseInt(e.target.value))}
                                            className="w-full bg-[#1e2532] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white outline-none" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] text-slate-500 block mb-1">معامل السعر (Factor)</label>
                                        <input type="number" placeholder="85" value={tier.adjustmentValue} onChange={e => handleUpdateTier(idx, 'adjustmentValue', e.target.value)}
                                            className="w-full bg-[#1e2532] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-primary font-bold outline-none" />
                                    </div>
                                    <div className="col-span-4 flex items-end gap-2">
                                        <div className="flex-1">
                                            <label className="text-[10px] text-slate-500 block mb-1">صورة العبوة</label>
                                            <div className="flex items-center gap-2">
                                                <input type="text" placeholder="رابط..." value={tier.imageUrl} onChange={e => handleUpdateTier(idx, 'imageUrl', e.target.value)}
                                                    className="w-full bg-[#1e2532] border border-white/10 rounded-lg px-2 py-1.5 text-[8px] text-white outline-none" />
                                                <button onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*'; input.onchange = (e) => { const file = (e.target as HTMLInputElement).files?.[0]; if (file) handleTierImageUpload(idx, file); }; input.click(); }}
                                                    className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all shrink-0" title="رفع صورة من الجهاز">
                                                    <span className="material-symbols-outlined text-sm">upload</span>
                                                </button>
                                            </div>
                                        </div>
                                        {tier.imageUrl && (
                                            <img src={tier.imageUrl} className="size-8 rounded border border-white/10 object-cover" alt="" />
                                        )}
                                    </div>
                                    <div className="col-span-1 flex justify-end">
                                        <button onClick={() => handleRemoveTier(idx)} className="text-red-400 hover:bg-red-400/10 p-1 rounded-lg transition-colors">
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {salesTiers.length === 0 && (
                                <div className="text-center py-4 text-slate-500 text-xs italic">لا توجد شرائح مضافة حالياً. سيتم استخدام سعر المنتج والكمية 1 افتراضياً.</div>
                            )}
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <label className="block text-sm font-bold text-slate-300">الخصائص المميزة للفروع (Variant Attributes)</label>
                            <button onClick={handleAddProperty} className="text-xs bg-white/5 hover:bg-white/10 text-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors">
                                <span className="material-symbols-outlined text-[16px]">add</span> اضافة خاصية
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {propertyNames.map((propName, index) => (
                                <div key={index} className="flex items-center gap-2 bg-[#0f1115] border border-white/10 rounded-xl px-3 py-2">
                                    <input type="text" value={propName} onChange={e => handleUpdatePropertyName(index, e.target.value)}
                                        className="bg-transparent text-sm text-white font-bold w-24 outline-none border-b border-white/5 focus:border-primary" />
                                    {propertyNames.length > 1 && (
                                        <button onClick={() => handleRemoveProperty(index)} className="text-red-400 hover:text-red-300 bg-red-400/10 p-1 rounded-lg">
                                            <span className="material-symbols-outlined text-[16px]">close</span>
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="border border-white/10 rounded-xl overflow-hidden bg-[#0f1115]/50 overflow-x-auto">
                        <table className="w-full text-sm text-right min-w-[600px]">
                            <thead className="bg-[#0f1115] border-b border-white/10 text-slate-400 font-bold">
                                <tr>
                                    <th className="px-4 py-3 min-w-[200px]">المنتج والفروع (Variants)</th>
                                    <th className="px-4 py-3 text-center border-l border-white/5">السعر الأساسي</th>
                                    {salesTiers.map((tier, i) => (
                                        <th key={i} className="px-4 py-3 text-center bg-primary/5 border-l border-white/5 whitespace-nowrap">
                                            سعر {tier.label || `شريحة ${i + 1}`}
                                            <div className="text-[10px] opacity-60 font-medium">(الكمية: {tier.quantity})</div>
                                        </th>
                                    ))}
                                    {propertyNames.map((p, i) => (
                                        <th key={i} className="px-4 py-4 text-primary relative group border-l border-white/5 whitespace-nowrap">
                                            <div className="flex items-center justify-between">
                                                <span>{p}</span>
                                                <button onClick={() => applyToAll(p)}
                                                    title={`تطبيق أول قيمة على كل الـ ${p}`}
                                                    className="size-6 rounded bg-primary/20 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all ml-2">
                                                    <span className="material-symbols-outlined text-[16px]">content_copy</span>
                                                </button>
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-white">
                                {products.map(p => (
                                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-4 py-3 font-semibold">
                                            <div className="truncate max-w-[200px]" title={p.name}>{p.name}</div>
                                        </td>
                                        <td className="px-4 py-3 text-center font-bold text-slate-400 bg-white/[0.01] border-l border-white/5">
                                            {parseFloat(p.price).toLocaleString('ar-EG')} ج.م
                                        </td>
                                        {salesTiers.map((tier, i) => {
                                            const factor = parseFloat(tier.adjustmentValue) || 1;
                                            const basePrice = parseFloat(p.price);
                                            const calcPrice = (basePrice * factor);
                                            return (
                                                <td key={i} className="px-4 py-3 text-center font-black text-emerald-400 bg-primary/5 border-l border-white/5">
                                                    {calcPrice.toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                            );
                                        })}
                                        {propertyNames.map((propName, i) => (
                                            <td key={i} className="px-4 py-3 border-l border-white/5">
                                                <input type="text" placeholder="القيمة..."
                                                    value={variantValues[p.id]?.[propName] || ''}
                                                    onChange={e => handleValueChange(p.id, propName, e.target.value)}
                                                    className="w-full bg-[#1e2532] border border-white/10 rounded-lg px-3 py-1.5 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm" />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="flex gap-3 mt-8">
                    <button onClick={handleSubmit} disabled={isPending}
                        className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50">
                        {isPending ? <span className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className="material-symbols-outlined">done</span>}
                        حفظ ودمج المنتجات
                    </button>
                    <button onClick={onClose} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-colors">إلغاء</button>
                </div>
            </div>
        </div>
    );
}
