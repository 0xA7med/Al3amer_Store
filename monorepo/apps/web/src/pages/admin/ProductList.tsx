import { useState, useMemo, useCallback, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAdminProducts, useAdminStats, useDeleteProduct, useBulkUpdateProducts, type Product } from '../../hooks/useAdmin';
import toast from 'react-hot-toast';

import { CustomSelect } from '../../components/ui/CustomSelect';
import InventorySyncModal from '../../components/admin/InventorySyncModal';

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: string }> = {
    active: { color: 'text-emerald-500', label: 'نشط', icon: 'check_circle' },
    draft: { color: 'text-slate-500', label: 'غير نشط', icon: 'visibility_off' },
};

function getProductStatus(product: Product): string {
    if (product.status === 'archived') return 'draft';
    return product.status || 'active';
}

interface ProductRowProps {
    product: Product;
    editedValue: { price?: string; stock?: number } | undefined;
    onEditChange: (id: string, field: 'price' | 'stock', value: string) => void;
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
        <tr className="hover:bg-white/5 transition-colors group">
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
                            <img
                                src={imageUrl}
                                alt={product.name}
                                className="w-full h-full object-cover rounded"
                                onError={() => setImageError(true)}
                                loading="lazy"
                            />
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
            <td className="px-6 py-2 text-slate-400">{product.category?.name || 'غير مصنف'}</td>
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
                <div className="relative group/input min-w-[100px] max-w-[140px]">
                    <input
                        type="text"
                        value={editedValue?.price ?? product.price}
                        onChange={(e) => onEditChange(product.id, 'price', e.target.value)}
                        className={`w-full bg-white/5 border ${editedValue?.price !== undefined ? 'border-primary/50' : 'border-white/5'} hover:border-white/20 rounded px-3 py-2 pl-9 text-sm font-bold text-white transition-all focus:border-primary focus:ring-1 focus:ring-primary outline-none`}
                    />
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-500 font-bold pointer-events-none bg-white/5 px-1 rounded">ج.م</span>
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
                    <button
                        onClick={() => onDelete(product)}
                        className="p-2 rounded hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-colors"
                        title="حذف"
                    >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                    <button
                        onClick={() => navigate(`/admin/products/${product.id}`)}
                        className="p-2 rounded hover:bg-white/10 hover:text-white text-slate-400 transition-colors"
                        title="تعديل"
                    >
                        <span className="material-symbols-outlined text-[18px]">edit_square</span>
                    </button>
                    <Link to={`/product/${product.id}`} className="p-2 rounded hover:bg-white/10 hover:text-white text-slate-400 transition-colors" title="معاينة">
                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                    </Link>
                </div>
            </td>
        </tr>
    );
});

export function ProductList() {
    const { data: productsData, isLoading, refetch } = useAdminProducts({ limit: 100 });
    const { data: statsData } = useAdminStats();
    const [syncModalOpen, setSyncModalOpen] = useState(false);
    const deleteProduct = useDeleteProduct();
    const bulkUpdate = useBulkUpdateProducts();
    const products = productsData?.data || [];

    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; product: Product | null }>({ show: false, product: null });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Inline Editing State
    const [editedProducts, setEditedProducts] = useState<Record<string, { price?: string; stock?: number }>>({});

    const hasChanges = Object.keys(editedProducts).length > 0;

    const handleEditChange = useCallback((id: string, field: 'price' | 'stock', value: string) => {
        setEditedProducts(prev => {
            const current = prev[id] || {};
            return {
                ...prev,
                [id]: {
                    ...current,
                    [field]: field === 'stock' ? parseInt(value) || 0 : value
                }
            };
        });
    }, []);

    const handleSaveAll = async () => {
        const updates = Object.entries(editedProducts).map(([id, data]) => ({
            id,
            ...data
        }));
        try {
            await bulkUpdate.mutateAsync(updates);
            setEditedProducts({});
        } catch (err) {
            console.error('Failed to bulk update:', err);
        }
    };

    const handleDiscard = () => {
        setEditedProducts({});
    };

    const handleDelete = async () => {
        if (deleteConfirm.product) {
            try {
                await deleteProduct.mutateAsync(deleteConfirm.product.id);
                setDeleteConfirm({ show: false, product: null });
            } catch (error) {
                console.error('Failed to delete product:', error);
            }
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
        setSelectedIds(prev => {
            const newSelected = new Set(prev);
            if (newSelected.has(id)) {
                newSelected.delete(id);
            } else {
                newSelected.add(id);
            }
            return newSelected;
        });
    }, []);

    const handleDeleteClick = useCallback((product: Product) => {
        setDeleteConfirm({ show: true, product });
    }, []);

    const handleBulkDelete = async () => {
        if (window.confirm(`هل أنت متأكد من حذف ${selectedIds.size} منتجات؟`)) {
            try {
                for (const id of Array.from(selectedIds)) {
                    await deleteProduct.mutateAsync(id);
                }
                setSelectedIds(new Set());
                toast.success('تم حذف المنتجات المحددة بنجاح');
            } catch (error) {
                console.error('Failed to bulk delete:', error);
            }
        }
    };

    // Calculate stats
    const totalProducts = products.length;
    const totalValue = products.reduce((sum, p) => sum + (parseFloat(p.price) * p.stock), 0);
    const lowStockCount = products.filter(p => p.stock < 10 && p.stock > 0).length;

    // Unique categories from data
    const categories = [...new Set(products.map(p => p.category?.name).filter(Boolean))];

    // Unified Filter and Sort Logic
    const filteredAndSortedProducts = useMemo(() => {
        let result = products.filter((product) => {
            const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (product.sku?.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesCategory = selectedCategory === '' || product.category?.name === selectedCategory;
            const matchesStatus = selectedStatus === '' || product.status === selectedStatus;
            return matchesSearch && matchesCategory && matchesStatus;
        });

        result.sort((a, b) => {
            if (sortBy === 'name') {
                return a.name.localeCompare(b.name, 'ar');
            }
            if (sortBy === 'price_asc') {
                return parseFloat(a.price) - parseFloat(b.price);
            }
            if (sortBy === 'price_desc') {
                return parseFloat(b.price) - parseFloat(a.price);
            }
            if (sortBy === 'newest') {
                return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            }
            if (sortBy === 'oldest') {
                return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
            }
            return 0;
        });

        return result;
    }, [products, searchQuery, selectedCategory, selectedStatus, sortBy]);

    const filteredProducts = filteredAndSortedProducts;

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

    return (
        <div className="flex flex-col gap-6">
            {/* Page Header */}
            <div className="flex items-center justify-between px-8 py-4 border-b border-white/5 bg-background-dark/80 backdrop-blur-md sticky top-0 z-50 -mx-8 -mt-6 mb-2">
                <div className="flex items-center gap-4">
                    <h2 className="text-white text-xl font-bold tracking-tight">إدارة المنتجات</h2>
                    <span className="h-6 w-px bg-white/10 mx-2"></span>
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-white/5 text-slate-400 border border-white/5">{totalProducts} منتج</span>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="glass-panel rounded-xl p-5 flex items-center gap-4">
                    <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[28px]">inventory</span>
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold">إجمالي المنتجات</p>
                        <h3 className="text-xl font-bold text-white">{statsData?.totalProducts || totalProducts} <span className="text-xs text-slate-500 font-normal">منتج</span></h3>
                    </div>
                </div>

                {/* Visible Products */}
                <div className="glass-panel rounded-xl p-5 flex items-center gap-4">
                    <div className="size-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <span className="material-symbols-outlined text-[28px]">visibility</span>
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold">منتجات ظاهرة</p>
                        <h3 className="text-xl font-bold text-white">{statsData?.activeProducts || 0} <span className="text-xs text-slate-500 font-normal">منتج</span></h3>
                    </div>
                </div>

                {/* Hidden Products */}
                <div className="glass-panel rounded-xl p-5 flex items-center gap-4">
                    <div className="size-12 rounded-lg bg-slate-500/10 flex items-center justify-center text-slate-400">
                        <span className="material-symbols-outlined text-[28px]">visibility_off</span>
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold">منتجات مخفية</p>
                        <h3 className="text-xl font-bold text-white">{statsData?.inactiveProducts || 0} <span className="text-xs text-slate-500 font-normal">منتج</span></h3>
                    </div>
                </div>
                <div className="glass-panel rounded-xl p-5 flex items-center gap-4">
                    <div className="size-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <span className="material-symbols-outlined text-[28px]">attach_money</span>
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold">قيمة المخزون</p>
                        <h3 className="text-xl font-bold text-white">{totalValue.toLocaleString('ar-EG')} <span className="text-xs text-slate-500 font-normal">ج.م</span></h3>
                    </div>
                </div>
                <div className="glass-panel rounded-xl p-5 flex items-center gap-4 border-l-2 border-secondary/50">
                    <div className="size-12 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                        <span className="material-symbols-outlined text-[28px]">warning</span>
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold">تنبيهات المخزون</p>
                        <h3 className="text-xl font-bold text-white">{lowStockCount} <span className="text-xs text-slate-500 font-normal">منتجات منخفضة</span></h3>
                    </div>
                </div>
            </div>

            {/* Filters & Actions */}
            <div className="glass-panel rounded-xl p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
                <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                    <div className="relative w-full md:w-64">
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                            <span className="material-symbols-outlined text-[20px]">search</span>
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="بحث باسم المنتج، SKU..."
                            className="block w-full h-10 pr-10 pl-4 rounded-lg bg-white/5 border border-white/5 text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-primary focus:border-primary/50 transition-all"
                        />
                    </div>
                    <CustomSelect
                        value={selectedCategory}
                        onChange={setSelectedCategory}
                        options={[
                            { value: '', label: 'جميع الأقسام' },
                            ...categories.filter((cat): cat is string => !!cat).map(cat => ({ value: cat, label: cat }))
                        ]}
                        placeholder="جميع الأقسام"
                        className="w-full md:w-48"
                    />
                    <CustomSelect
                        value={selectedStatus}
                        onChange={setSelectedStatus}
                        options={[
                            { value: '', label: 'الحالة: الكل' },
                            { value: 'active', label: 'نشط' },
                            { value: 'draft', label: 'غير نشط' }
                        ]}
                        placeholder="الحالة: الكل"
                        className="w-full md:w-40"
                    />
                    <CustomSelect
                        value={sortBy}
                        onChange={setSortBy}
                        options={[
                            { value: 'name', label: 'الاسم (أ-ي)' },
                            { value: 'price_asc', label: 'السعر: من الأقل' },
                            { value: 'price_desc', label: 'السعر: من الأعلى' },
                            { value: 'newest', label: 'الأحدث أولاً' },
                            { value: 'oldest', label: 'الأقدم أولاً' }
                        ]}
                        placeholder="ترتيب حسب"
                        className="w-full md:w-44"
                        icon="sort"
                    />
                </div>
                <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
                    {selectedIds.size > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-bold border border-red-500/20 transition-all"
                        >
                            <span className="material-symbols-outlined text-[20px]">delete_sweep</span>
                            <span>حذف المختار ({selectedIds.size})</span>
                        </button>
                    )}
                    <button
                        onClick={() => setSyncModalOpen(true)}
                        className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-sm font-bold border border-emerald-500/20 transition-all"
                    >
                        <span className="material-symbols-outlined text-[20px]">sync</span>
                        <span>تحديث المخزون (Excel)</span>
                    </button>
                    <Link to="/admin/products/add" className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-bold shadow-lg shadow-primary/20 transition-all w-full md:w-auto">
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        <span>إضافة منتج</span>
                    </Link>
                </div>
            </div>

            {/* Products Table */}
            <div className="glass-panel rounded-xl overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px] text-sm text-right">
                        <thead className="bg-white/5 text-slate-400 font-medium border-b border-white/5">
                            <tr>
                                <th className="px-6 py-3 w-10">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={filteredProducts.length > 0 && selectedIds.size === filteredProducts.length}
                                            onChange={toggleSelectAll}
                                            className="rounded border-white/10 bg-white/5 text-primary focus:ring-0 cursor-pointer"
                                        />
                                    </div>
                                </th>
                                <th className="px-6 py-3 whitespace-nowrap">المنتج</th>
                                <th className="px-6 py-3 whitespace-nowrap">القسم</th>
                                <th className="px-6 py-3 whitespace-nowrap w-32 text-center">الحالة</th>
                                <th className="px-6 py-3 whitespace-nowrap w-40">السعر</th>
                                <th className="px-6 py-3 whitespace-nowrap w-32">المخزون</th>
                                <th className="px-6 py-3 whitespace-nowrap text-left">إجراءات</th>
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

                {/* Pagination */}
                <div className="p-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs text-slate-500">عرض {filteredProducts.length} من {totalProducts} منتج</span>
                    <div className="flex items-center gap-2">
                        <button className="size-8 flex items-center justify-center rounded bg-primary text-white text-xs font-bold shadow-lg shadow-primary/20">1</button>
                    </div>
                </div>
            </div>

            {/* Action Toolbar (Sticky) */}
            {hasChanges && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-8 duration-300">
                    <div className="bg-slate-900/90 backdrop-blur-xl border border-primary/20 rounded-2xl p-2 pl-6 flex items-center gap-4 shadow-2xl shadow-primary/20 ring-1 ring-white/10">
                        <div className="flex items-center gap-2">
                            <div className="size-2 rounded-full bg-primary animate-pulse"></div>
                            <span className="text-sm font-bold text-white whitespace-nowrap">لديك {Object.keys(editedProducts).length} تعديلات غير محفوظة</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleDiscard}
                                disabled={bulkUpdate.isPending}
                                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 text-sm font-bold transition-all disabled:opacity-50"
                            >
                                تجاهل
                            </button>
                            <button
                                onClick={handleSaveAll}
                                disabled={bulkUpdate.isPending}
                                className="px-6 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-bold transition-all shadow-lg shadow-primary/30 flex items-center gap-2 disabled:opacity-50"
                            >
                                {bulkUpdate.isPending ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        جاري الحفظ...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[18px]">save</span>
                                        حفظ التعديلات
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
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
                            <button
                                onClick={handleDelete}
                                disabled={deleteProduct.isPending}
                                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
                            >
                                {deleteProduct.isPending ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        جاري الحذف...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-[18px]">delete</span>
                                        نعم، احذف المنتج
                                    </>
                                )}
                            </button>
                            <button
                                onClick={() => setDeleteConfirm({ show: false, product: null })}
                                disabled={deleteProduct.isPending}
                                className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 px-4 py-2.5 rounded-lg text-sm font-bold transition-all border border-white/10"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Inventory Sync Modal */}
            <InventorySyncModal
                isOpen={syncModalOpen}
                onClose={() => setSyncModalOpen(false)}
                onSuccess={() => refetch()}
            />
        </div>
    );
}

export default ProductList;
