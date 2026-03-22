import { useState, useCallback, useRef } from 'react';
import { useInventorySync } from '../../hooks/useInventorySync';
import type { DiffItem } from '../../hooks/useInventorySync';
import toast from 'react-hot-toast';
import { ArrowLeft, CheckCircle } from 'lucide-react';

interface InventorySyncModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type Step = 'upload' | 'preview' | 'executing';

export default function InventorySyncModal({ isOpen, onClose, onSuccess }: InventorySyncModalProps) {
    const [step, setStep] = useState<Step>('upload');
    const [diffItems, setDiffItems] = useState<DiffItem[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [editedValues, setEditedValues] = useState<Map<string, {
        price?: number;
        stock?: number;
        cost?: number;
    }>>(new Map());
    const [summary, setSummary] = useState({ total: 0, new: 0, updates: 0, unchanged: 0 });
    const [enabledFields, setEnabledFields] = useState({
        price: true,
        stock: true,
        cost: true
    });
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { preview, execute } = useInventorySync();

    const resetModal = useCallback(() => {
        setStep('upload');
        setDiffItems([]);
        setSelectedIds(new Set());
        setEditedValues(new Map());
        setSummary({ total: 0, new: 0, updates: 0, unchanged: 0 });
        setEnabledFields({ price: true, stock: true, cost: true });
    }, []);

    const handleClose = () => {
        resetModal();
        onClose();
    };

    const handleFileSelect = async (file: File) => {
        if (!file) return;

        // Validate file type
        if (!file.name.match(/\.(xlsx|xls)$/i)) {
            toast.error('يرجى اختيار ملف Excel (.xlsx أو .xls)');
            return;
        }

        try {
            const result = await preview.mutateAsync(file);
            setDiffItems(result.items);
            setSummary(result.summary);
            // Select all items by default
            setSelectedIds(new Set(result.items.map(item => item.externalId)));
            setStep('preview');

            if (result.items.length === 0) {
                toast.success('جميع المنتجات محدثة! لا توجد تغييرات مطلوبة.');
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'فشل في تحليل الملف');
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        const file = e.dataTransfer.files[0];
        if (file) handleFileSelect(file);
    }, []);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(true);
    };

    const handleDragLeave = () => setDragActive(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileSelect(file);
    };

    const toggleItem = (externalId: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(externalId)) {
            newSelected.delete(externalId);
        } else {
            newSelected.add(externalId);
        }
        setSelectedIds(newSelected);
    };

    const toggleAll = () => {
        if (selectedIds.size === diffItems.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(diffItems.map(item => item.externalId)));
        }
    };

    const handleValueChange = (externalId: string, field: 'price' | 'stock' | 'cost', value: number) => {
        setEditedValues(prev => {
            const newMap = new Map(prev);
            const current = newMap.get(externalId) || {};
            newMap.set(externalId, { ...current, [field]: value });
            return newMap;
        });
    };

    const getEffectiveValue = (item: DiffItem, field: 'price' | 'stock' | 'cost'): number => {
        const edited = editedValues.get(item.externalId)?.[field];
        if (edited !== undefined) return edited;

        if (item.status === 'new') {
            return item.newData?.[field] || 0;
        }

        // If there's a change, return the new value
        if (item.changes?.[field]) {
            return item.changes[field]!.new;
        }

        // Otherwise return the current existing value
        return item.currentData?.[field] || 0;
    };

    const handleExecute = async () => {
        const itemsToExecute = diffItems
            .filter(item => selectedIds.has(item.externalId))
            .map(item => {
                const edited = editedValues.get(item.externalId);

                // Apply edited values to the item
                if (item.status === 'new' && item.newData) {
                    return {
                        ...item,
                        newData: {
                            ...item.newData,
                            price: edited?.price ?? item.newData.price,
                            stock: edited?.stock ?? item.newData.stock,
                            cost: edited?.cost ?? item.newData.cost,
                        }
                    };
                } else if (item.status === 'update' && item.changes) {
                    const finalChanges: any = {};
                    if (enabledFields.price) {
                        finalChanges.price = edited?.price !== undefined ? { old: item.changes.price?.old || 0, new: edited.price } : item.changes.price;
                    }
                    if (enabledFields.stock) {
                        finalChanges.stock = edited?.stock !== undefined ? { old: item.changes.stock?.old || 0, new: edited.stock } : item.changes.stock;
                    }
                    if (enabledFields.cost) {
                        finalChanges.cost = edited?.cost !== undefined ? { old: item.changes.cost?.old || 0, new: edited.cost } : item.changes.cost;
                    }

                    return {
                        ...item,
                        changes: finalChanges
                    };
                }
                return item;
            })
            .filter(item => {
                // Remove update items that have no changes after stripping disabled fields
                if (item.status === 'update' && Object.keys(item.changes || {}).length === 0) {
                    return false;
                }
                return true;
            });

        if (itemsToExecute.length === 0) {
            toast.error('يرجى اختيار عنصر واحد على الأقل');
            return;
        }

        setStep('executing');

        try {
            const result = await execute.mutateAsync(itemsToExecute);
            toast.success(result.message);
            onSuccess();
            handleClose();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'فشل في تنفيذ التحديثات');
            setStep('preview');
        }
    };

    const getStatusBadge = (item: DiffItem) => {
        if (item.status === 'new') {
            return (
                <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-400">
                    منتج جديد
                </span>
            );
        }

        const badges = [];
        if (item.changes?.price) {
            badges.push(
                <span key="price" className="px-2 py-1 text-xs font-medium rounded-full bg-amber-500/20 text-amber-400">
                    تعديل سعر
                </span>
            );
        }
        if (item.changes?.stock) {
            badges.push(
                <span key="stock" className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400">
                    تعديل كمية
                </span>
            );
        }
        if (item.changes?.cost) {
            badges.push(
                <span key="cost" className="px-2 py-1 text-xs font-medium rounded-full bg-violet-500/20 text-violet-400">
                    تعديل تكلفة
                </span>
            );
        }

        return <div className="flex gap-1 flex-wrap">{badges}</div>;
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />

            {/* Modal */}
            <div className="relative bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl mx-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                            <span className="material-symbols-rounded text-white">sync</span>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">تحديث المخزون من Excel</h2>
                            <p className="text-sm text-slate-400">مزامنة المخزون مع برنامج المحاسبة</p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                        title="إغلاق"
                    >
                        <span className="material-symbols-rounded text-slate-400">close</span>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
                    {step === 'upload' && (
                        <div
                            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-colors ${dragActive
                                ? 'border-emerald-500 bg-emerald-500/10'
                                : 'border-slate-600 hover:border-slate-500'
                                }`}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleInputChange}
                                className="hidden"
                            />

                            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-slate-800 flex items-center justify-center">
                                <span className="material-symbols-rounded text-4xl text-emerald-400">upload_file</span>
                            </div>

                            <h3 className="text-lg font-semibold text-white mb-2">
                                اسحب ملف Excel هنا
                            </h3>
                            <p className="text-slate-400 mb-6">
                                أو اضغط لاختيار الملف من جهازك
                            </p>

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={preview.isPending}
                                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {preview.isPending ? (
                                    <span className="flex items-center gap-2">
                                        <span className="animate-spin">⏳</span>
                                        جاري التحليل...
                                    </span>
                                ) : (
                                    'اختيار ملف'
                                )}
                            </button>

                            <p className="text-xs text-slate-500 mt-4">
                                الأعمدة المطلوبة: Pro_ID, اسم المنتج, الكمية, سعر البيع, اخر سعر شراء
                            </p>
                        </div>
                    )}

                    {step === 'preview' && (
                        <div>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-4 gap-4 mb-6">
                                <div className="bg-slate-800 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold text-white">{summary.total}</div>
                                    <div className="text-xs text-slate-400">إجمالي المنتجات</div>
                                </div>
                                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold text-emerald-400">{summary.new}</div>
                                    <div className="text-xs text-emerald-400/70">منتج جديد</div>
                                </div>
                                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold text-amber-400">{summary.updates}</div>
                                    <div className="text-xs text-amber-400/70">تحديث</div>
                                </div>
                                <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold text-slate-400">{summary.unchanged}</div>
                                    <div className="text-xs text-slate-500">بدون تغيير</div>
                                </div>
                            </div>

                            {diffItems.length === 0 ? (
                                <div className="text-center py-12">
                                    <CheckCircle className="w-16 h-16 text-emerald-400 mb-4 mx-auto" />
                                    <h3 className="text-xl font-semibold text-white mb-2">لا توجد تغييرات!</h3>
                                    <p className="text-slate-400">جميع المنتجات محدثة بالفعل</p>
                                </div>
                            ) : (
                                <>
                                    {/* Select All */}
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.size === diffItems.length}
                                                onChange={toggleAll}
                                                className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500/20"
                                            />
                                            <span className="text-sm text-slate-300">
                                                تحديد الكل ({selectedIds.size} من {diffItems.length})
                                            </span>
                                        </label>
                                    </div>

                                    {/* Table Header */}
                                    <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-700 bg-slate-800/50 rounded-t-xl text-xs font-medium text-slate-400">
                                        <div className="col-span-4 text-right flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.size === diffItems.length}
                                                onChange={toggleAll}
                                                className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500/20"
                                            />
                                            <span>المنتج</span>
                                        </div>
                                        <div className="col-span-2 flex flex-col items-center gap-1">
                                            <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={enabledFields.price}
                                                    onChange={(e) => setEnabledFields(prev => ({ ...prev, price: e.target.checked }))}
                                                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-amber-500 focus:ring-amber-500/20"
                                                />
                                                <span>السعر</span>
                                            </label>
                                        </div>
                                        <div className="col-span-2 flex flex-col items-center gap-1">
                                            <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={enabledFields.stock}
                                                    onChange={(e) => setEnabledFields(prev => ({ ...prev, stock: e.target.checked }))}
                                                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500/20"
                                                />
                                                <span>الكمية</span>
                                            </label>
                                        </div>
                                        <div className="col-span-2 flex flex-col items-center gap-1">
                                            <label className="flex items-center gap-2 cursor-pointer hover:text-white transition-colors">
                                                <input
                                                    type="checkbox"
                                                    checked={enabledFields.cost}
                                                    onChange={(e) => setEnabledFields(prev => ({ ...prev, cost: e.target.checked }))}
                                                    className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-violet-500 focus:ring-violet-500/20"
                                                />
                                                <span>التكلفة</span>
                                            </label>
                                        </div>
                                        <div className="col-span-2 text-center">الحالة</div>
                                    </div>

                                    {/* Table Body */}
                                    <div className="divide-y divide-slate-700/50 bg-slate-800/20 max-h-[500px] overflow-y-auto">
                                        {diffItems.map((item) => (
                                            <div
                                                key={item.externalId}
                                                className={`grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-800/50 transition-colors ${selectedIds.has(item.externalId) ? 'bg-slate-800/30' : ''}`}
                                            >
                                                {/* Product Name & Checkbox */}
                                                <div className="col-span-4 flex items-center gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.has(item.externalId)}
                                                        onChange={() => toggleItem(item.externalId)}
                                                        className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500/20 shrink-0"
                                                    />
                                                    <div className="min-w-0">
                                                        <div className="font-medium text-white truncate" title={item.name}>{item.name}</div>
                                                        <div className="text-xs text-slate-500">#{item.externalId}</div>
                                                    </div>
                                                </div>

                                                {/* Price Column */}
                                                <div className={`col-span-2 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${!enabledFields.price ? 'opacity-20 grayscale pointer-events-none' : ''}`}>
                                                    {item.changes?.price ? (
                                                        <div className="flex items-center gap-1 opacity-70">
                                                            <span className="text-red-500 text-xs">
                                                                {item.changes.price.old.toLocaleString()}
                                                            </span>
                                                            <ArrowLeft className="w-3 h-3 text-slate-500" />
                                                        </div>
                                                    ) : (
                                                        <div className="h-4"></div>
                                                    )}
                                                    <div className="flex items-center gap-1 w-full">
                                                        <input
                                                            type="number"
                                                            value={String(getEffectiveValue(item, 'price'))}
                                                            onChange={(e) => handleValueChange(item.externalId, 'price', parseFloat(e.target.value) || 0)}
                                                            className={`w-full px-2 py-1.5 bg-slate-700 border rounded font-bold text-center focus:ring-1 text-sm ${item.changes?.price
                                                                ? 'border-emerald-500/50 text-emerald-400 focus:border-emerald-500'
                                                                : 'border-slate-600 text-white focus:border-slate-500'
                                                                }`}
                                                            step="0.01"
                                                            disabled={!enabledFields.price}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Stock Column */}
                                                <div className={`col-span-2 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${!enabledFields.stock ? 'opacity-20 grayscale pointer-events-none' : ''}`}>
                                                    {item.changes?.stock ? (
                                                        <div className="flex items-center gap-1 opacity-70">
                                                            <span className="text-red-500 text-xs">
                                                                {item.changes.stock.old}
                                                            </span>
                                                            <ArrowLeft className="w-3 h-3 text-slate-500" />
                                                        </div>
                                                    ) : (
                                                        <div className="h-4"></div>
                                                    )}
                                                    <input
                                                        type="number"
                                                        value={String(getEffectiveValue(item, 'stock'))}
                                                        onChange={(e) => handleValueChange(item.externalId, 'stock', parseInt(e.target.value) || 0)}
                                                        className={`w-full px-2 py-1.5 bg-slate-700 border rounded font-bold text-center focus:ring-1 text-sm ${item.changes?.stock
                                                            ? 'border-emerald-500/50 text-emerald-400 focus:border-emerald-500'
                                                            : 'border-slate-600 text-white focus:border-slate-500'
                                                            }`}
                                                        step="1"
                                                        disabled={!enabledFields.stock}
                                                    />
                                                </div>

                                                {/* Cost Column */}
                                                <div className={`col-span-2 flex flex-col items-center justify-center gap-1.5 transition-all duration-300 ${!enabledFields.cost ? 'opacity-20 grayscale pointer-events-none' : ''}`}>
                                                    {item.changes?.cost ? (
                                                        <div className="flex items-center gap-1 opacity-70">
                                                            <span className="text-red-500 text-xs">
                                                                {item.changes.cost.old.toLocaleString()}
                                                            </span>
                                                            <ArrowLeft className="w-3 h-3 text-slate-500" />
                                                        </div>
                                                    ) : (
                                                        <div className="h-4"></div>
                                                    )}
                                                    <div className="flex items-center gap-1 w-full">
                                                        <input
                                                            type="number"
                                                            value={String(getEffectiveValue(item, 'cost'))}
                                                            onChange={(e) => handleValueChange(item.externalId, 'cost', parseFloat(e.target.value) || 0)}
                                                            className={`w-full px-2 py-1.5 bg-slate-700 border rounded font-bold text-center focus:ring-1 text-sm ${item.changes?.cost
                                                                ? 'border-emerald-500/50 text-emerald-400 focus:border-emerald-500'
                                                                : 'border-slate-600 text-white focus:border-slate-500'
                                                                }`}
                                                            step="0.01"
                                                            disabled={!enabledFields.cost}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Status Column */}
                                                <div className="col-span-2 flex justify-center">
                                                    {getStatusBadge(item)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {step === 'executing' && (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-500/20 flex items-center justify-center animate-pulse">
                                <span className="material-symbols-rounded text-3xl text-emerald-400 animate-spin">sync</span>
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">جاري تنفيذ التحديثات...</h3>
                            <p className="text-slate-400">يرجى الانتظار</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {step === 'preview' && diffItems.length > 0 && (
                    <div className="flex items-center justify-between p-6 border-t border-slate-700 bg-slate-800/50">
                        <button
                            onClick={resetModal}
                            className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                        >
                            <span className="flex items-center gap-2">
                                <ArrowLeft className="w-4 h-4" />
                                رجوع للرفع
                            </span>
                        </button>
                        <button
                            onClick={handleExecute}
                            disabled={selectedIds.size === 0 || execute.isPending}
                            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                        >
                            <CheckCircle className="w-5 h-5" />
                            تأكيد التحديث ({selectedIds.size} عنصر)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
