import { useState, useCallback, useRef } from 'react';
import { useInventorySync } from '../../hooks/useInventorySync';
import type { DiffItem } from '../../hooks/useInventorySync';
import toast from 'react-hot-toast';

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
    const [summary, setSummary] = useState({ total: 0, new: 0, updates: 0, unchanged: 0 });
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { preview, execute } = useInventorySync();

    const resetModal = useCallback(() => {
        setStep('upload');
        setDiffItems([]);
        setSelectedIds(new Set());
        setSummary({ total: 0, new: 0, updates: 0, unchanged: 0 });
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

    const handleExecute = async () => {
        const itemsToExecute = diffItems.filter(item => selectedIds.has(item.externalId));
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
                                    <span className="material-symbols-rounded text-6xl text-emerald-400 mb-4">check_circle</span>
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

                                    {/* Table */}
                                    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b border-slate-700">
                                                    <th className="p-4 text-right text-xs font-medium text-slate-400 w-12"></th>
                                                    <th className="p-4 text-right text-xs font-medium text-slate-400">المنتج</th>
                                                    <th className="p-4 text-center text-xs font-medium text-slate-400">السعر</th>
                                                    <th className="p-4 text-center text-xs font-medium text-slate-400">الكمية</th>
                                                    <th className="p-4 text-center text-xs font-medium text-slate-400">الحالة</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-700/50">
                                                {diffItems.map((item) => (
                                                    <tr
                                                        key={item.externalId}
                                                        className={`hover:bg-slate-800/50 transition-colors ${selectedIds.has(item.externalId) ? 'bg-slate-800/30' : ''
                                                            }`}
                                                    >
                                                        <td className="p-4">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedIds.has(item.externalId)}
                                                                onChange={() => toggleItem(item.externalId)}
                                                                className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-emerald-500 focus:ring-emerald-500/20"
                                                            />
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="font-medium text-white">{item.name}</div>
                                                            <div className="text-xs text-slate-500">#{item.externalId}</div>
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            {item.status === 'new' ? (
                                                                <span className="text-emerald-400 font-medium">
                                                                    {item.newData?.price?.toLocaleString()} ج.م
                                                                </span>
                                                            ) : item.changes?.price ? (
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <span className="text-slate-500 line-through text-sm">
                                                                        {item.changes.price.old.toLocaleString()}
                                                                    </span>
                                                                    <span className="material-symbols-rounded text-amber-400 text-sm">arrow_forward</span>
                                                                    <span className="text-amber-400 font-medium">
                                                                        {item.changes.price.new.toLocaleString()}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-500">—</span>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            {item.status === 'new' ? (
                                                                <span className="text-emerald-400 font-medium">
                                                                    {item.newData?.stock}
                                                                </span>
                                                            ) : item.changes?.stock ? (
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <span className="text-slate-500 line-through text-sm">
                                                                        {item.changes.stock.old}
                                                                    </span>
                                                                    <span className="material-symbols-rounded text-blue-400 text-sm">arrow_forward</span>
                                                                    <span className="text-blue-400 font-medium">
                                                                        {item.changes.stock.new}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-slate-500">—</span>
                                                            )}
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            {getStatusBadge(item)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
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
                            ← رجوع للرفع
                        </button>
                        <button
                            onClick={handleExecute}
                            disabled={selectedIds.size === 0 || execute.isPending}
                            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                        >
                            <span className="material-symbols-rounded">check_circle</span>
                            تأكيد التحديث ({selectedIds.size} عنصر)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
