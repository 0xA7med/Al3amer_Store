import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAdminProducts, useAdminStats, useDeleteProduct, useBulkUpdateProducts, useBulkAction, type Product } from '../../hooks/useAdmin';
import { useCategories, type Category } from '../../hooks/useCategories';


import { CustomSelect } from '../../components/ui/CustomSelect';
import InventorySyncModal from '../../components/admin/InventorySyncModal';
import { PriceModal, StockModal, CategoryModal, DeleteConfirmModal } from '../../components/admin/ProductBulkModals';
import { GroupModal } from '../../components/admin/GroupModal';
import { ProductRow, MobileProductCard } from '../../components/admin/ProductRow';

export function ProductList() {
    const [page, setPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const limit = 50;

    const { data: statsData } = useAdminStats();
    const categoriesResult = useCategories();
    const allCategories: Category[] = categoriesResult?.categories || [];

    const queryParams: Record<string, any> = { page, limit, status: selectedStatus || undefined };
    if (searchQuery) queryParams.search = searchQuery;
    if (selectedCategory) {
        const found = allCategories.find((c: Category) => c.name === selectedCategory);
        if (found) queryParams.categories = found.slug;
    }
    if (sortBy !== 'name') queryParams.sort = sortBy;

    const [syncModalOpen, setSyncModalOpen] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ show: boolean; product: Product | null }>({ show: false, product: null });
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);

    const { data: productsData, isLoading, refetch } = useAdminProducts(queryParams);

    useEffect(() => { setPage(1); }, [searchQuery, selectedCategory, selectedStatus, sortBy, showLowStockOnly]);

    const deleteProduct = useDeleteProduct();
    const bulkUpdate = useBulkUpdateProducts();
    const bulkAction = useBulkAction();
    const productsList = productsData?.data || [];
    const pagination = productsData?.pagination || { total: 0, page: 1, limit, totalPages: 1 };
    const totalPages = pagination.totalPages;

    const [showPriceModal, setShowPriceModal] = useState(false);
    const [showStockModal, setShowStockModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [showGroupModal, setShowGroupModal] = useState(false);

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
    const handleBulkGroup = async (groupName: string, variants: { id: string; options: Record<string, string> }[], accountingMultiplier?: number, salesTiers?: any[]) => {
        await executeBulkAction('group', { groupName, variants, accountingMultiplier, salesTiers });
        setShowGroupModal(false);
    };

    const handleSort = (key: string) => {
        if (sortBy === `${key}_asc`) {
            setSortBy(`${key}_desc`);
        } else {
            setSortBy(`${key}_asc`);
        }
    };

    const renderSortIcon = (key: string) => {
        if (sortBy === `${key}_asc`) return <span className="material-symbols-outlined text-[16px] text-primary transition-all">arrow_upward</span>;
        if (sortBy === `${key}_desc`) return <span className="material-symbols-outlined text-[16px] text-primary transition-all">arrow_downward</span>;
        return <span className="material-symbols-outlined text-[16px] text-slate-500 opacity-0 group-hover:opacity-100 transition-all">unfold_more</span>;
    };

    const filteredProducts = showLowStockOnly
        ? productsList.filter(p => p.stock < 10 && p.stock > 0)
        : productsList;
    const totalProducts = pagination.total;
    const totalValue = productsList.reduce((sum, p) => sum + (parseFloat(p.price) * p.stock), 0);
    const lowStockCount = productsList.filter(p => p.stock < 10 && p.stock > 0).length;
    const categories = [...new Set(allCategories.map(c => c.name).filter(Boolean))];

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
                <button onClick={() => { setSelectedStatus(''); setShowLowStockOnly(false); }}
                    className={`glass-panel rounded-xl p-2.5 md:p-4 flex items-center gap-4 relative overflow-hidden group transition-all text-right ${selectedStatus === '' && !showLowStockOnly ? 'border-primary ring-1 ring-primary/20 bg-primary/5' : 'hover:border-primary/30'}`}>
                    <div className="size-10 md:size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 transition-all group-hover:scale-110">
                        <span className="material-symbols-outlined text-[20px] md:text-[28px]">inventory</span>
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <p className="text-slate-400 text-[9px] md:text-xs font-bold truncate">إجمالي المنتجات</p>
                        <h3 className="text-base md:text-xl font-bold text-white leading-none truncate">{statsData?.totalProducts || totalProducts}</h3>
                    </div>
                </button>

                <button onClick={() => { setSelectedStatus('active'); setShowLowStockOnly(false); }}
                    className={`glass-panel rounded-xl p-2.5 md:p-4 flex items-center gap-4 relative overflow-hidden group transition-all text-right ${selectedStatus === 'active' ? 'border-emerald-500 ring-1 ring-emerald-500/20 bg-emerald-500/5' : 'hover:border-emerald-500/30'}`}>
                    <div className="size-10 md:size-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 transition-all group-hover:scale-110">
                        <span className="material-symbols-outlined text-[20px] md:text-[28px]">visibility</span>
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <p className="text-slate-400 text-[9px] md:text-xs font-bold truncate">منتجات نشطة</p>
                        <h3 className="text-base md:text-xl font-bold text-white leading-none truncate">{statsData?.activeProducts || 0}</h3>
                    </div>
                </button>

                <button onClick={() => { setSelectedStatus('draft'); setShowLowStockOnly(false); }}
                    className={`glass-panel rounded-xl p-2.5 md:p-4 flex items-center gap-4 relative overflow-hidden group transition-all text-right ${selectedStatus === 'draft' ? 'border-slate-500 ring-1 ring-slate-500/20 bg-slate-500/5' : 'hover:border-slate-500/30'}`}>
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

                <button onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                    className={`glass-panel rounded-xl p-2.5 md:p-4 flex items-center gap-4 relative overflow-hidden group transition-all border-l-2 border-secondary/50 col-span-2 lg:col-span-1 text-right ${showLowStockOnly ? 'border-secondary ring-1 ring-secondary/20 bg-secondary/5' : 'hover:border-secondary/30'}`}>
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
                    <button onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-[10px] font-bold transition-all active:scale-95">
                        <span className="material-symbols-outlined text-sm">{isFiltersOpen ? 'expand_less' : 'filter_alt'}</span>
                        {isFiltersOpen ? 'تصغير' : 'توسيع الفلاتر'}
                    </button>
                </div>

                <div className={`${isFiltersOpen ? 'flex' : 'hidden md:flex'} glass-panel rounded-xl p-4 flex-col items-stretch justify-between gap-4 relative z-10 animate-in fade-in slide-in-from-top-2 duration-200`}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="relative w-full">
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
                                { value: 'newest', label: 'الأحدث أولاً' }, 
                                { value: 'oldest', label: 'الأقدم أولاً' },
                                { value: 'name_asc', label: 'الاسم (أ-ي)' }, 
                                { value: 'name_desc', label: 'الاسم (ي-أ)' }, 
                                { value: 'price_asc', label: 'السعر: من الأقل' }, 
                                { value: 'price_desc', label: 'السعر: من الأعلى' },
                                { value: 'stock_asc', label: 'المخزون: من الأقل' },
                                { value: 'stock_desc', label: 'المخزون: من الأعلى' },
                                { value: 'status_asc', label: 'الحالة: نشط أولاً' },
                                { value: 'status_desc', label: 'الحالة: غير نشط أولاً' },
                                { value: 'ai_desc', label: 'مؤشر الذكاء الاصطناعي: الأعلى' },
                                { value: 'ai_asc', label: 'مؤشر الذكاء الاصطناعي: الأقل' }
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

            {/* Products Listing: Desktop Table */}
            <div className="hidden lg:block glass-panel rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1000px] text-sm text-right">
                        <thead className="bg-white/5 text-slate-400 font-medium border-b border-white/5">
                            <tr>
                                <th className="px-6 py-3 w-10">
                                    <div className="flex items-center text-left justify-end">
                                        <input type="checkbox" checked={filteredProducts.length > 0 && selectedIds.size === filteredProducts.length}
                                            onChange={toggleSelectAll} className="rounded border-white/10 bg-white/5 text-primary focus:ring-0 cursor-pointer" />
                                    </div>
                                </th>
                                <th className="px-6 py-4 whitespace-nowrap cursor-pointer hover:text-white group transition-colors" onClick={() => handleSort('name')}>
                                    <div className="flex items-center gap-1">المنتج {renderSortIcon('name')}</div>
                                </th>
                                <th className="px-6 py-4 whitespace-nowrap cursor-pointer hover:text-white group transition-colors" onClick={() => handleSort('ai')}>
                                    <div className="flex items-center gap-1">القسم / الماركة / الذكاء الاصطناعي {renderSortIcon('ai')}</div>
                                </th>
                                <th className="px-6 py-4 whitespace-nowrap w-24 text-center cursor-pointer hover:text-white group transition-colors" onClick={() => handleSort('status')}>
                                    <div className="flex items-center justify-center gap-1">الحالة {renderSortIcon('status')}</div>
                                </th>
                                <th className="px-6 py-4 whitespace-nowrap w-52 cursor-pointer hover:text-white group transition-colors" onClick={() => handleSort('price')}>
                                    <div className="flex items-center gap-1">
                                        التسعير
                                        <span className="text-[9px] text-slate-500 font-medium">(الأساسي / بعد الخصم)</span>
                                        {renderSortIcon('price')}
                                    </div>
                                </th>
                                <th className="px-6 py-4 whitespace-nowrap w-32 cursor-pointer hover:text-white group transition-colors" onClick={() => handleSort('stock')}>
                                    <div className="flex items-center gap-1">المخزون {renderSortIcon('stock')}</div>
                                </th>
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
                                    <ProductRow key={product.id} product={product} editedValue={editedProducts[product.id]}
                                        onEditChange={handleEditChange} onDelete={handleDeleteClick}
                                        selected={selectedIds.has(product.id)} onToggleSelect={toggleSelect} />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Products Listing: Mobile Cards */}
            <div className="lg:hidden flex flex-col gap-4">
                {filteredProducts.length === 0 ? (
                    <div className="glass-panel rounded-xl p-12 text-center text-slate-500">
                        <span className="material-symbols-outlined text-4xl mb-2 block">inventory_2</span>
                        لا توجد منتجات تطابق البحث
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {filteredProducts.map((product: Product) => (
                            <MobileProductCard key={product.id} product={product} editedValue={editedProducts[product.id]}
                                onEditChange={handleEditChange} onDelete={handleDeleteClick}
                                selected={selectedIds.has(product.id)} onToggleSelect={toggleSelect} />
                        ))}
                    </div>
                )}
            </div>

            {/* Pagination */}
            {totalPages > 0 && (
                <div className="glass-panel rounded-xl mt-4 p-4 flex items-center justify-between">
                    <span className="text-[10px] md:text-sm text-slate-500 font-bold">
                        عرض {Math.min((pagination.page - 1) * limit + 1, totalProducts)}–{Math.min(pagination.page * limit, totalProducts)} من {totalProducts} منتج
                    </span>
                    <div className="flex items-center gap-1.5">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                            className="size-8 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>
                        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                            let pageNum: number;
                            if (totalPages <= 7) {
                                pageNum = i + 1;
                            } else if (page <= 4) {
                                pageNum = i + 1;
                            } else if (page >= totalPages - 3) {
                                pageNum = totalPages - 6 + i;
                            } else {
                                pageNum = page - 3 + i;
                            }
                            return (
                                <button key={pageNum} onClick={() => setPage(pageNum)}
                                    className={`size-8 flex items-center justify-center rounded text-xs font-bold transition-all ${page === pageNum ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-transparent hover:bg-white/5 text-slate-400 hover:text-white'}`}>
                                    {pageNum}
                                </button>
                            );
                        })}
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                            className="size-8 flex items-center justify-center rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs font-bold transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Bulk Actions Toolbar */}
            {selectedIds.size > 0 && !hasChanges && (
                <div className="fixed bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-8 duration-300 w-[95vw] md:w-max">
                    <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 md:p-2 flex items-center gap-1 md:gap-1.5 shadow-2xl ring-1 ring-white/5 overflow-x-auto no-scrollbar">
                        <div className="flex items-center gap-2 px-2 md:px-3 py-1.5 border-l border-white/10 ml-0.5 md:ml-1 shrink-0 bg-white/5 rounded-xl">
                            <div className="size-2 rounded-full bg-primary animate-pulse"></div>
                            <span className="text-xs md:text-sm font-black text-white whitespace-nowrap">{selectedIds.size}</span>
                        </div>

                        <button onClick={handleBulkShow} disabled={isBulkPending}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 text-xs font-bold transition-all disabled:opacity-50 shrink-0">
                            <span className="material-symbols-outlined text-[18px]">visibility</span><span>إظهار</span>
                        </button>
                        <button onClick={handleBulkHide} disabled={isBulkPending}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-slate-500/20 text-slate-400 hover:text-slate-300 text-xs font-bold transition-all disabled:opacity-50 shrink-0">
                            <span className="material-symbols-outlined text-[18px]">visibility_off</span><span>إخفاء</span>
                        </button>

                        <div className="h-6 w-px bg-white/10 mx-0.5 shrink-0" />

                        <button onClick={() => setShowPriceModal(true)} disabled={isBulkPending}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 text-xs font-bold transition-all disabled:opacity-50 shrink-0">
                            <span className="material-symbols-outlined text-[18px]">sell</span><span>تعديل الأسعار</span>
                        </button>
                        <button onClick={() => setShowStockModal(true)} disabled={isBulkPending}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 text-xs font-bold transition-all disabled:opacity-50 shrink-0">
                            <span className="material-symbols-outlined text-[18px]">inventory_2</span><span>تعديل المخزون</span>
                        </button>
                        <button onClick={() => setShowCategoryModal(true)} disabled={isBulkPending}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 text-xs font-bold transition-all disabled:opacity-50 shrink-0">
                            <span className="material-symbols-outlined text-[18px]">category</span><span>تغيير التصنيف</span>
                        </button>

                        <div className="h-6 w-px bg-white/10 mx-0.5 shrink-0" />

                        <button onClick={() => setShowGroupModal(true)} disabled={isBulkPending || selectedIds.size < 2}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 text-xs font-bold transition-all disabled:opacity-50 shrink-0">
                            <span className="material-symbols-outlined text-[18px]">call_merge</span><span>دمج متغيرات</span>
                        </button>

                        <div className="h-6 w-px bg-white/10 mx-0.5 shrink-0" />

                        <button onClick={() => setShowBulkDeleteModal(true)} disabled={isBulkPending}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-bold transition-all disabled:opacity-50 shrink-0">
                            <span className="material-symbols-outlined text-[18px]">delete_sweep</span><span>حذف</span>
                        </button>

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
                                className="flex-1 bg-white/5 hover:bg-white/10 text-slate-300 px-4 py-2.5 rounded-lg text-sm font-bold transition-all border border-white/10">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            {showPriceModal && <PriceModal count={selectedIds.size} onClose={() => setShowPriceModal(false)} onApply={handleBulkPrice} isPending={isBulkPending} />}
            {showStockModal && <StockModal count={selectedIds.size} onClose={() => setShowStockModal(false)} onApply={handleBulkStock} isPending={isBulkPending} />}
            {showCategoryModal && <CategoryModal count={selectedIds.size} categories={allCategories} onClose={() => setShowCategoryModal(false)} onApply={handleBulkCategory} isPending={isBulkPending} />}
            {showGroupModal && <GroupModal products={filteredProducts.filter((p: Product) => selectedIds.has(p.id))} onClose={() => setShowGroupModal(false)} onApply={handleBulkGroup} isPending={isBulkPending} />}
            {showBulkDeleteModal && <DeleteConfirmModal count={selectedIds.size} onClose={() => setShowBulkDeleteModal(false)} onConfirm={handleBulkDelete} isPending={isBulkPending} />}

            <InventorySyncModal isOpen={syncModalOpen} onClose={() => setSyncModalOpen(false)} onSuccess={() => refetch()} />
        </div>
    );
}

export default ProductList;
