import { useState } from 'react';
import toast from 'react-hot-toast';

// ================================================================
// Price Modal
// ================================================================
export function PriceModal({ count, onClose, onApply, isPending }: {
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

// ================================================================
// Stock Modal
// ================================================================
export function StockModal({ count, onClose, onApply, isPending }: {
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

// ================================================================
// Bulk Category Modal
// ================================================================
export function CategoryModal({ count, categories: cats, onClose, onApply, isPending }: {
    count: number;
    categories: { id: string; name: string; parentId?: string | null; parent?: { name: string } | null }[];
    onClose: () => void;
    onApply: (categoryId: string) => void;
    isPending: boolean;
}) {
    const [selectedCat, setSelectedCat] = useState('');

    const parents = cats.filter(c => !c.parentId);
    const children = cats.filter(c => !!c.parentId);
    const orderedList: { id: string; label: string; isChild: boolean }[] = [];
    parents.forEach(p => {
        orderedList.push({ id: p.id, label: p.name, isChild: false });
        children.filter(c => c.parentId === p.id).forEach(c => {
            orderedList.push({ id: c.id, label: `↳ ${c.name}`, isChild: true });
        });
    });
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
                        <select value={selectedCat} onChange={e => setSelectedCat(e.target.value)}
                            className="w-full h-11 bg-black/30 border border-white/10 rounded-xl px-4 text-white text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 outline-none appearance-none" autoFocus>
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

// ================================================================
// Delete Confirm Modal
// ================================================================
export function DeleteConfirmModal({ count, onClose, onConfirm, isPending }: {
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
