import { useState, useMemo } from 'react';
import type { Product } from '../../hooks/useAdmin';
import { useCategories } from '../../hooks/useCategories';
import { CustomSelect } from '../ui/CustomSelect';
import { CheckCircle } from 'lucide-react';

interface BulkActionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedProducts: Product[];
    onApply: (updates: any[]) => Promise<void>;
    isUpdating: boolean;
}

type TabType = 'status' | 'category' | 'price' | 'stock';

export default function BulkActionsModal({ isOpen, onClose, selectedProducts, onApply, isUpdating }: BulkActionsModalProps) {
    const { categories } = useCategories();
    const [activeTab, setActiveTab] = useState<TabType>('status');

    // Values for changes
    const [statusValue, setStatusValue] = useState<string>('');
    const [categoryIdValue, setCategoryIdValue] = useState<string>('');

    // Price options
    const [priceAction, setPriceAction] = useState<'set' | 'add' | 'subtract' | 'add_percent' | 'subtract_percent'>('set');
    const [priceValue, setPriceValue] = useState<number | ''>('');

    // Stock options
    const [stockAction, setStockAction] = useState<'set' | 'add' | 'subtract'>('set');
    const [stockValue, setStockValue] = useState<number | ''>('');

    const resetValues = () => {
        setStatusValue('');
        setCategoryIdValue('');
        setPriceAction('set');
        setPriceValue('');
        setStockAction('set');
        setStockValue('');
    };

    const handleClose = () => {
        resetValues();
        onClose();
    };

    const previewUpdates = useMemo(() => {
        return selectedProducts.map(product => {
            let newPrice = parseFloat(product.price);
            let newStock = product.stock;
            let newStatus = product.status;
            let newCategoryId = product.category?.id;

            // Apply selected tab logic
            if (activeTab === 'status' && statusValue) {
                newStatus = statusValue;
            }

            if (activeTab === 'category' && categoryIdValue) {
                newCategoryId = categoryIdValue;
            }

            if (activeTab === 'price' && priceValue !== '') {
                const val = Number(priceValue);
                if (priceAction === 'set') newPrice = val;
                else if (priceAction === 'add') newPrice += val;
                else if (priceAction === 'subtract') newPrice = Math.max(0, newPrice - val);
                else if (priceAction === 'add_percent') newPrice = newPrice + (newPrice * (val / 100));
                else if (priceAction === 'subtract_percent') newPrice = Math.max(0, newPrice - (newPrice * (val / 100)));

                // Round to 2 decimals
                newPrice = Math.round(newPrice * 100) / 100;
            }

            if (activeTab === 'stock' && stockValue !== '') {
                const val = Number(stockValue);
                if (stockAction === 'set') newStock = val;
                else if (stockAction === 'add') newStock += val;
                else if (stockAction === 'subtract') newStock = Math.max(0, newStock - val);
            }

            return {
                id: product.id,
                name: product.name,
                oldPrice: parseFloat(product.price),
                newPrice,
                oldStock: product.stock,
                newStock,
                oldStatus: product.status,
                newStatus,
                oldCategoryId: product.category?.id,
                newCategoryId,
            };
        });
    }, [selectedProducts, activeTab, statusValue, categoryIdValue, priceAction, priceValue, stockAction, stockValue]);

    const handleApply = async () => {
        const payload = previewUpdates.map(p => {
            const update: any = { id: p.id };

            if (activeTab === 'status' && p.newStatus !== p.oldStatus) {
                update.status = p.newStatus;
            } else if (activeTab === 'category' && p.newCategoryId !== p.oldCategoryId) {
                update.categoryId = p.newCategoryId;
            } else if (activeTab === 'price' && p.newPrice !== p.oldPrice) {
                update.price = String(p.newPrice);
            } else if (activeTab === 'stock' && p.newStock !== p.oldStock) {
                update.stock = p.newStock;
            }

            return update;
        }).filter(u => Object.keys(u).length > 1); // Only items with actual changes

        await onApply(payload);
        handleClose();
    };

    if (!isOpen) return null;

    const hasChanges = previewUpdates.some(p =>
        (activeTab === 'status' && p.newStatus !== p.oldStatus) ||
        (activeTab === 'category' && p.newCategoryId !== p.oldCategoryId) ||
        (activeTab === 'price' && p.newPrice !== p.oldPrice) ||
        (activeTab === 'stock' && p.newStock !== p.oldStock)
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

            {/* Modal */}
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl mx-4 flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center">
                            <span className="material-symbols-outlined text-white">tune</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">إجراءات متعددة</h2>
                            <p className="text-sm text-slate-400">تعديل {selectedProducts.length} منتج دفعة واحدة</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                        title="إغلاق"
                    >
                        <span className="material-symbols-outlined text-slate-400">close</span>
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden min-h-[400px]">
                    {/* Sidebar Tabs */}
                    <div className="w-48 border-l border-slate-700 bg-slate-800/30 p-4 flex flex-col gap-2 overflow-y-auto">
                        <button
                            onClick={() => setActiveTab('status')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'status' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[20px]">toggle_on</span>
                            الحالة
                        </button>
                        <button
                            onClick={() => setActiveTab('category')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'category' ? 'bg-primary/20 text-primary border border-primary/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[20px]">category</span>
                            القسم
                        </button>
                        <button
                            onClick={() => setActiveTab('price')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'price' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[20px]">payments</span>
                            السعر
                        </button>
                        <button
                            onClick={() => setActiveTab('stock')}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${activeTab === 'stock' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                            الكمية
                        </button>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Forms */}
                        <div className="p-6 border-b border-slate-700 bg-slate-800/10 shrink-0">
                            {activeTab === 'status' && (
                                <div className="space-y-4 max-w-md">
                                    <label className="block text-sm font-bold text-slate-300">تغيير حالة المنتجات كـ:</label>
                                    <CustomSelect
                                        value={statusValue}
                                        onChange={setStatusValue}
                                        options={[
                                            { value: '', label: 'اختر الحالة...' },
                                            { value: 'active', label: 'نشط (ظاهر)' },
                                            { value: 'draft', label: 'غير نشط (مخفي)' }
                                        ]}
                                        placeholder="تغيير الحالة..."
                                    />
                                </div>
                            )}

                            {activeTab === 'category' && (
                                <div className="space-y-4 max-w-md">
                                    <label className="block text-sm font-bold text-slate-300">نقل المنتجات إلى القسم:</label>
                                    <CustomSelect
                                        value={categoryIdValue}
                                        onChange={setCategoryIdValue}
                                        options={[
                                            { value: '', label: 'اختر القسم...' },
                                            ...categories.map(c => ({ value: c.id, label: c.name }))
                                        ]}
                                        placeholder="اختر القسم..."
                                    />
                                </div>
                            )}

                            {activeTab === 'price' && (
                                <div className="space-y-4 max-w-lg">
                                    <label className="block text-sm font-bold text-slate-300">تعديل أسعار المنتجات المحددة</label>
                                    <div className="flex gap-4">
                                        <div className="w-1/2">
                                            <CustomSelect
                                                value={priceAction}
                                                onChange={(v) => setPriceAction(v as any)}
                                                options={[
                                                    { value: 'set', label: 'تغيير السعر إلى...' },
                                                    { value: 'add', label: 'زيادة مبلغ ثابت (+)' },
                                                    { value: 'subtract', label: 'خصم مبلغ ثابت (-)' },
                                                    { value: 'add_percent', label: 'زيادة بنسبة مئوية (+%)' },
                                                    { value: 'subtract_percent', label: 'خصم بنسبة مئوية (-%)' }
                                                ]}
                                                placeholder="طريقة التعديل..."
                                            />
                                        </div>
                                        <div className="w-1/2 relative">
                                            <input
                                                type="number"
                                                value={priceValue}
                                                onChange={e => setPriceValue(e.target.value ? Number(e.target.value) : '')}
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all pr-12"
                                                placeholder="القيمة..."
                                            />
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                                                {priceAction.includes('percent') ? '%' : 'ج.م'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'stock' && (
                                <div className="space-y-4 max-w-lg">
                                    <label className="block text-sm font-bold text-slate-300">تعديل كميات المنتجات المحددة</label>
                                    <div className="flex gap-4">
                                        <div className="w-1/2">
                                            <CustomSelect
                                                value={stockAction}
                                                onChange={(v) => setStockAction(v as any)}
                                                options={[
                                                    { value: 'set', label: 'تحديد الكمية كـ...' },
                                                    { value: 'add', label: 'إضافة كمية (+)' },
                                                    { value: 'subtract', label: 'إنقاص كمية (-)' },
                                                ]}
                                                placeholder="طريقة التعديل..."
                                            />
                                        </div>
                                        <div className="w-1/2">
                                            <input
                                                type="number"
                                                value={stockValue}
                                                onChange={e => setStockValue(e.target.value ? Number(e.target.value) : '')}
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                                placeholder="الكمية..."
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Preview Table */}
                        <div className="flex-1 overflow-y-auto bg-slate-900">
                            <table className="w-full text-sm text-right">
                                <thead className="bg-slate-800/80 sticky top-0 backdrop-blur-sm text-slate-400 border-b border-slate-700 z-10">
                                    <tr>
                                        <th className="py-3 px-4">اسم المنتج</th>
                                        {activeTab === 'status' && <th className="py-3 px-4 w-40 text-center">النتيجة (الحالة)</th>}
                                        {activeTab === 'category' && <th className="py-3 px-4 w-48 text-center">النتيجة (القسم)</th>}
                                        {activeTab === 'price' && <th className="py-3 px-4 w-48 text-center">النتيجة (السعر)</th>}
                                        {activeTab === 'stock' && <th className="py-3 px-4 w-40 text-center">النتيجة (الكمية)</th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {previewUpdates.map((item) => {
                                        let isChanged = false;
                                        if (activeTab === 'status') isChanged = item.newStatus !== item.oldStatus;
                                        else if (activeTab === 'category') isChanged = item.newCategoryId !== item.oldCategoryId;
                                        else if (activeTab === 'price') isChanged = item.newPrice !== item.oldPrice;
                                        else if (activeTab === 'stock') isChanged = item.newStock !== item.oldStock;

                                        return (
                                            <tr key={item.id} className={isChanged ? 'bg-primary/5' : ''}>
                                                <td className="py-3 px-4 text-white font-medium truncate max-w-[300px]" title={item.name}>{item.name}</td>

                                                {/* Specialized Cells per Tab */}
                                                {activeTab === 'status' && (
                                                    <td className="py-3 px-4 text-center">
                                                        {isChanged ? (
                                                            <div className="flex items-center justify-center gap-2">
                                                                <span className="text-slate-500 line-through text-xs">{item.oldStatus === 'active' ? 'نشط' : 'مخفي'}</span>
                                                                <span className="material-symbols-outlined text-sm text-slate-500">arrow_left_alt</span>
                                                                <span className={`font-bold ${item.newStatus === 'active' ? 'text-emerald-400' : 'text-slate-400'}`}>
                                                                    {item.newStatus === 'active' ? 'نشط' : 'مخفي'}
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <span className="opacity-50 text-xs">بدون تغيير</span>
                                                        )}
                                                    </td>
                                                )}

                                                {activeTab === 'category' && (
                                                    <td className="py-3 px-4 text-center">
                                                        {isChanged ? (
                                                            <span className="text-emerald-400 font-bold bg-emerald-400/10 px-2 py-1 rounded inline-block">
                                                                تغيير القسم
                                                            </span>
                                                        ) : (
                                                            <span className="opacity-50 text-xs">بدون تغيير</span>
                                                        )}
                                                    </td>
                                                )}

                                                {activeTab === 'price' && (
                                                    <td className="py-3 px-4 text-center">
                                                        {isChanged ? (
                                                            <div className="flex flex-col items-center justify-center">
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-slate-500 line-through text-xs">{item.oldPrice.toLocaleString()}</span>
                                                                    <span className="material-symbols-outlined text-sm text-slate-500">arrow_left_alt</span>
                                                                    <span className="font-bold text-emerald-400">{item.newPrice.toLocaleString()} ج.م</span>
                                                                </div>
                                                                {item.newPrice > item.oldPrice ? (
                                                                    <span className="text-[10px] text-emerald-500 mt-1">+{((item.newPrice - item.oldPrice) / item.oldPrice * 100).toFixed(1)}% زيادة</span>
                                                                ) : (
                                                                    <span className="text-[10px] text-red-500 mt-1">{((item.newPrice - item.oldPrice) / item.oldPrice * 100).toFixed(1)}% خصم</span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="opacity-50 text-xs">{item.oldPrice.toLocaleString()} ج.م</span>
                                                        )}
                                                    </td>
                                                )}

                                                {activeTab === 'stock' && (
                                                    <td className="py-3 px-4 text-center">
                                                        {isChanged ? (
                                                            <div className="flex items-center justify-center gap-2">
                                                                <span className="text-slate-500 line-through text-xs">{item.oldStock}</span>
                                                                <span className="material-symbols-outlined text-sm text-slate-500">arrow_left_alt</span>
                                                                <span className={`font-bold ${item.newStock > item.oldStock ? 'text-blue-400' : 'text-amber-400'}`}>{item.newStock}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="opacity-50 text-xs">{item.oldStock}</span>
                                                        )}
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-6 border-t border-slate-700 bg-slate-800/50 shrink-0">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                        إلغاء
                    </button>
                    <button
                        onClick={handleApply}
                        disabled={!hasChanges || isUpdating}
                        className="px-6 py-2 bg-gradient-to-r from-primary to-primary-dark text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:grayscale flex items-center gap-2"
                    >
                        {isUpdating ? (
                            <span className="material-symbols-outlined animate-spin">refresh</span>
                        ) : (
                            <CheckCircle className="w-5 h-5" />
                        )}
                        تطبيق التغييرات
                        {hasChanges && <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold mr-2 ml-[-4px]">{previewUpdates.filter(p => p.newPrice !== p.oldPrice || p.newStock !== p.oldStock || p.newStatus !== p.oldStatus || p.newCategoryId !== p.oldCategoryId).length}</span>}
                    </button>
                </div>
            </div>
        </div>
    );
}
