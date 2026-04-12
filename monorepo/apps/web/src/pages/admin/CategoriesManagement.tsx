import { useState, useEffect } from 'react';
import { useCategories, type Category } from '../../hooks/useCategories';
import toast from 'react-hot-toast';

export default function CategoriesManagement() {
    const { categories, categoryTree, isLoading, createCategory, updateCategory, deleteCategory, isCreating, isUpdating } = useCategories();
    const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
    const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});

    // Stats
    const totalCategories = categories.length;
    const activeCategories = categories.filter(c => c.isActive).length;
    const featuredCategories = categories.filter(c => c.isFeatured).length;
    const totalProducts = categories.reduce((acc, c) => acc + (c.productCount || 0), 0);

    // Toggle expand
    const toggleExpand = (id: string) => {
        setExpandedMap(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Mobile Category Card
    const renderCategoryCard = (category: Category, level: number = 0) => {
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = expandedMap[category.id] ?? true;

        return (
            <div key={category.id} className="flex flex-col">
                <div className={`flex flex-col rounded-xl border transition-all ${
                    level === 0
                        ? 'glass-panel border-white/5 shadow-sm'
                        : 'bg-white/[0.02] border-white/5 mr-4 border-r-2 border-r-primary/20'
                }`}>
                    {/* Card Header */}
                    <div className="flex items-center justify-between p-3">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {/* Expand toggle */}
                            {hasChildren ? (
                                <button
                                    onClick={() => toggleExpand(category.id)}
                                    className="size-7 flex items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:text-white transition-all shrink-0"
                                >
                                    <span className="material-symbols-outlined text-[16px]">
                                        {isExpanded ? 'expand_more' : 'chevron_left'}
                                    </span>
                                </button>
                            ) : (
                                <div className="size-7 shrink-0" />
                            )}

                            {/* Icon / Image */}
                            <div className="size-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                                {category.image ? (
                                    <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="material-symbols-outlined text-primary text-[18px]">
                                        {category.icon || 'category'}
                                    </span>
                                )}
                            </div>

                            {/* Name + slug */}
                            <div className="flex flex-col min-w-0">
                                <h3 className="font-bold text-white text-sm leading-tight truncate">{category.name}</h3>
                                <p className="text-[10px] text-slate-500 font-mono truncate">{category.slug}</p>
                            </div>
                        </div>

                        {/* Right side: status + product count */}
                        <div className="flex items-center gap-2 shrink-0">
                            {category.isFeatured && (
                                <span className="material-symbols-outlined text-amber-400 text-[16px]" title="مميز">star</span>
                            )}
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                category.isActive
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                    : 'bg-slate-500/10 text-slate-500 border-slate-500/20'
                            }`}>
                                {category.isActive ? 'نشط' : 'مخفي'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                                {category.productCount || 0}
                            </span>
                        </div>
                    </div>

                    {/* Action bar */}
                    <div className="flex items-center gap-1 px-3 pb-3 border-t border-white/5 pt-2.5">
                        <button
                            onClick={() => updateCategory({ id: category.id, data: { isActive: !category.isActive } })}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all border ${
                                category.isActive
                                    ? 'bg-slate-500/10 text-slate-400 border-slate-500/20 hover:bg-slate-500/20'
                                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[14px]">
                                {category.isActive ? 'visibility_off' : 'visibility'}
                            </span>
                            {category.isActive ? 'إخفاء' : 'إظهار'}
                        </button>
                        <button
                            onClick={() => setEditingCategory({ parentId: category.id, isActive: true })}
                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all"
                            title="إضافة فرعي"
                        >
                            <span className="material-symbols-outlined text-[14px]">add</span>
                            فرعي
                        </button>
                        <button
                            onClick={() => setEditingCategory({ ...category })}
                            className="size-8 flex items-center justify-center rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5 transition-all"
                            title="تعديل"
                        >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button
                            onClick={() => {
                                if (window.confirm('هل أنت متأكد من حذف هذا القسم؟')) {
                                    deleteCategory(category.id);
                                }
                            }}
                            className="size-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-all"
                            title="حذف"
                        >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                    </div>
                </div>

                {/* Children */}
                {hasChildren && isExpanded && (
                    <div className="flex flex-col gap-2 mt-2 pr-3">
                        {category.children!.map(child => renderCategoryCard(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    // Desktop Table Row
    const renderCategoryRow = (category: Category, level: number = 0) => {
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = expandedMap[category.id] ?? true;

        return (
            <div key={category.id} className="flex flex-col">
                <div
                    className={`flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition-colors ${level > 0 ? 'bg-white/[0.02]' : ''}`}
                    style={{ paddingRight: `${level * 2 + 1.5}rem` }}
                >
                    <div className="flex items-center gap-4 flex-1">
                        <div className="w-6 flex justify-center shrink-0">
                            {hasChildren && (
                                <button onClick={() => toggleExpand(category.id)} className="text-slate-400 hover:text-white">
                                    <span className="material-symbols-outlined text-[20px]">
                                        {isExpanded ? 'expand_more' : 'chevron_left'}
                                    </span>
                                </button>
                            )}
                        </div>
                        <div className="size-10 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center overflow-hidden shrink-0">
                            {category.image ? (
                                <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="material-symbols-outlined text-primary text-[18px]">
                                    {category.icon || 'category'}
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <h3 className="font-bold text-white text-sm">{category.name}</h3>
                                {category.isFeatured && (
                                    <span className="material-symbols-outlined text-amber-400 text-[14px]" title="مميز">star</span>
                                )}
                            </div>
                            <p className="text-xs text-slate-500 font-mono">{category.slug}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="w-16 text-center">
                            <span className="px-2.5 py-1 rounded-md bg-white/5 text-slate-300 font-medium text-xs border border-white/5">
                                {category.productCount || 0}
                            </span>
                        </div>

                        <div className="w-20 flex justify-center">
                            <button
                                onClick={() => updateCategory({ id: category.id, data: { isActive: !category.isActive } })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${category.isActive ? 'bg-primary' : 'bg-slate-700'}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${category.isActive ? '-translate-x-1' : '-translate-x-6'}`} />
                            </button>
                        </div>

                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setEditingCategory({ parentId: category.id, isActive: true })}
                                className="p-2 rounded-lg hover:bg-emerald-500/10 text-emerald-400 transition-colors"
                                title="إضافة فرعي"
                            >
                                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                            </button>
                            <button
                                onClick={() => setEditingCategory({ ...category })}
                                className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
                                title="تعديل"
                            >
                                <span className="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                                onClick={() => {
                                    if (window.confirm('هل أنت متأكد من حذف هذا القسم؟')) {
                                        deleteCategory(category.id);
                                    }
                                }}
                                className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors"
                                title="حذف"
                            >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                        </div>
                    </div>
                </div>

                {hasChildren && isExpanded && (
                    <div className="flex flex-col border-r-2 border-white/5 mr-8">
                        {category.children!.map(child => renderCategoryRow(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4 md:gap-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                        إدارة الأقسام
                        <span className="h-6 w-px bg-white/10 mx-1" />
                        <span className="text-slate-400 text-xs md:text-sm font-normal bg-white/5 px-2 py-1 rounded-md">
                            {totalCategories} قسم
                        </span>
                    </h1>
                </div>
                <button
                    onClick={() => setEditingCategory({ isActive: true })}
                    className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-4 py-2.5 rounded-lg font-bold transition-all shadow-lg shadow-primary/20 text-sm"
                >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    إضافة قسم رئيسي
                </button>
            </div>

            {/* Stats Cards — 2 per row on mobile */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                <div className="glass-panel rounded-xl p-2.5 md:p-4 flex items-center gap-3 md:gap-4 relative overflow-hidden group hover:border-primary/30 transition-all">
                    <div className="size-9 md:size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-[20px] md:text-[28px]">folder</span>
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <p className="text-slate-400 text-[9px] md:text-sm font-medium truncate">إجمالي الأقسام</p>
                        <h3 className="text-base md:text-xl font-bold text-white leading-none">{totalCategories}</h3>
                    </div>
                </div>

                <div className="glass-panel rounded-xl p-2.5 md:p-4 flex items-center gap-3 md:gap-4 relative overflow-hidden group hover:border-emerald-500/30 transition-all">
                    <div className="size-9 md:size-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-[20px] md:text-[28px]">check_circle</span>
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <p className="text-slate-400 text-[9px] md:text-sm font-medium truncate">أقسام نشطة</p>
                        <h3 className="text-base md:text-xl font-bold text-white leading-none">{activeCategories}</h3>
                    </div>
                </div>

                <div className="glass-panel rounded-xl p-2.5 md:p-4 flex items-center gap-3 md:gap-4 relative overflow-hidden group hover:border-amber-500/30 transition-all">
                    <div className="size-9 md:size-12 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-[20px] md:text-[28px]">star</span>
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <p className="text-slate-400 text-[9px] md:text-sm font-medium truncate">أقسام مميزة</p>
                        <h3 className="text-base md:text-xl font-bold text-white leading-none">{featuredCategories}</h3>
                    </div>
                </div>

                <div className="glass-panel rounded-xl p-2.5 md:p-4 flex items-center gap-3 md:gap-4 relative overflow-hidden group hover:border-secondary/30 transition-all">
                    <div className="size-9 md:size-12 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary shrink-0 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-[20px] md:text-[28px]">inventory_2</span>
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                        <p className="text-slate-400 text-[9px] md:text-sm font-medium truncate">إجمالي المنتجات</p>
                        <h3 className="text-base md:text-xl font-bold text-white leading-none">{totalProducts}</h3>
                    </div>
                </div>
            </div>

            {/* Mobile: Card layout */}
            <div className="lg:hidden flex flex-col gap-3 pb-4">
                {categoryTree.length === 0 ? (
                    <div className="glass-panel rounded-xl p-10 flex flex-col items-center gap-3">
                        <span className="material-symbols-outlined text-slate-600 text-[48px]">folder_off</span>
                        <p className="text-slate-500 text-sm">لا توجد أقسام حالياً</p>
                        <button
                            onClick={() => setEditingCategory({ isActive: true })}
                            className="flex items-center gap-2 bg-primary/15 text-primary border border-primary/20 px-4 py-2 rounded-lg text-sm font-bold transition-all hover:bg-primary/25"
                        >
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            إضافة أول قسم
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {categoryTree.map(cat => renderCategoryCard(cat))}
                    </div>
                )}
            </div>

            {/* Desktop: Table layout */}
            <div className="hidden lg:block glass-panel rounded-xl overflow-hidden bg-[#1e232d] border border-white/10">
                <div className="p-5 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <h2 className="text-lg font-bold text-white">هيكل الأقسام</h2>
                    <span className="text-xs text-slate-500">{totalCategories} قسم</span>
                </div>

                <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02] text-xs font-bold text-slate-400">
                    <div className="flex-1 text-right">القسم</div>
                    <div className="flex items-center gap-4">
                        <div className="w-16 text-center">المنتجات</div>
                        <div className="w-20 text-center">الحالة</div>
                        <div className="w-32 text-center">إجراءات</div>
                    </div>
                </div>

                <div className="flex-1">
                    {categoryTree.length === 0 ? (
                        <div className="p-10 text-center text-slate-500">
                            لا توجد أقسام حالياً. أضف قسم جديد للبدء.
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {categoryTree.map(cat => renderCategoryRow(cat))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {editingCategory && (
                <CategoryModal
                    category={editingCategory}
                    onClose={() => setEditingCategory(null)}
                    onSave={async (data) => {
                        if (editingCategory.id) {
                            await updateCategory({ id: editingCategory.id, data });
                        } else {
                            await createCategory(data);
                        }
                        setEditingCategory(null);
                    }}
                    categories={categories}
                    isSaving={isCreating || isUpdating}
                />
            )}
        </div>
    );
}

export function CategoryModal({ category, onClose, onSave, isSaving }: {
    category: Partial<Category>,
    onClose: () => void,
    onSave: (data: Partial<Category>) => Promise<void>,
    categories?: Category[],
    isSaving: boolean
}) {
    const [activeTab, setActiveTab] = useState<'info' | 'filters'>('info');
    const [formData, setFormData] = useState({
        name: category.name || '',
        image: category.image || '',
        icon: category.icon || '',
        slug: category.slug || '',
        parentId: category.parentId || null,
        isActive: category.isActive ?? true,
        isFeatured: category.isFeatured ?? false,
        attributesSchema: (category.attributesSchema || []).map(a => ({ ...a, _id: Math.random().toString(36).substr(2, 9) })),
    });

    useEffect(() => {
        setFormData({
            name: category.name || '',
            image: category.image || '',
            icon: category.icon || '',
            slug: category.slug || '',
            parentId: category.parentId || null,
            isActive: category.isActive ?? true,
            isFeatured: category.isFeatured ?? false,
            attributesSchema: (category.attributesSchema || []).map(a => ({ ...a, _id: Math.random().toString(36).substr(2, 9) })),
        });
    }, [category]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return toast.error('اسم القسم مطلوب');
        const dataToSave = {
            ...formData,
            attributesSchema: formData.attributesSchema.map(({ _id, ...rest }: any) => rest)
        };
        await onSave(dataToSave);
    };

    const addBlock = () => {
        setFormData(p => ({
            ...p,
            attributesSchema: [...p.attributesSchema, { _id: Math.random().toString(36).substr(2, 9), name: '', type: 'multi-select', options: [] }]
        }));
    };

    const removeBlock = (idx: number) => {
        setFormData(p => ({ ...p, attributesSchema: p.attributesSchema.filter((_, i) => i !== idx) }));
    };

    const updateBlock = (idx: number, field: string, value: any) => {
        const schema = [...formData.attributesSchema];
        schema[idx] = { ...schema[idx], [field]: value };
        setFormData(p => ({ ...p, attributesSchema: schema }));
    };

    const isEdit = Boolean(category.id);
    const title = isEdit ? 'تعديل القسم' : (formData.parentId ? 'إضافة قسم فرعي' : 'إضافة قسم رئيسي');

    return (
        <div
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={onClose}
        >
            <div
                className="bg-[#1a1f2e] border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-xl flex flex-col"
                style={{ maxHeight: 'calc(100vh - 0rem)', height: 'auto', maxHeightSm: 'calc(100vh - 2rem)' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Drag handle (mobile) */}
                <div className="flex justify-center pt-3 pb-1 sm:hidden">
                    <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                {/* Sticky Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-primary/15 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-[20px]">
                                {isEdit ? 'edit' : 'add'}
                            </span>
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-white leading-tight">{title}</h3>
                            {formData.name && (
                                <p className="text-[11px] text-slate-500 leading-tight mt-0.5 truncate max-w-[180px]">{formData.name}</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        type="button"
                        className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10 flex-shrink-0 px-5">
                    {[
                        { key: 'info', label: 'المعلومات', icon: 'info' },
                        { key: 'filters', label: 'الفلترة', icon: 'tune', badge: formData.attributesSchema.length || null },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            type="button"
                            onClick={() => setActiveTab(tab.key as any)}
                            className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition-all -mb-px ${
                                activeTab === tab.key
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-slate-400 hover:text-white'
                            }`}
                        >
                            <span className="material-symbols-outlined text-[15px]">{tab.icon}</span>
                            {tab.label}
                            {tab.badge ? (
                                <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] leading-none">
                                    {tab.badge}
                                </span>
                            ) : null}
                        </button>
                    ))}
                </div>

                {/* Scrollable Body */}
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
                    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ maxHeight: '60vh' }}>

                        {/* TAB 1: Basic Info */}
                        {activeTab === 'info' && (
                            <>
                                {/* Name */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                                        اسم القسم <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full h-11 bg-[#101422] border border-white/10 rounded-xl px-4 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all outline-none placeholder-slate-600"
                                        placeholder="مثال: طابعات الحرارة"
                                        required
                                    />
                                </div>

                                {/* Icon */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                                        رمز الأيقونة (Material Symbol)
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            value={formData.icon || ''}
                                            onChange={e => setFormData({ ...formData, icon: e.target.value })}
                                            className="flex-1 h-11 bg-[#101422] border border-white/10 rounded-xl px-4 text-white text-sm focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all outline-none placeholder-slate-600"
                                            placeholder="مثال: print"
                                        />
                                        {formData.icon && (
                                            <div className="size-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                                <span className="material-symbols-outlined text-primary text-[22px]">{formData.icon}</span>
                                            </div>
                                        )}
                                    </div>
                                    <a
                                        href="https://fonts.google.com/icons?icon.set=Material+Symbols"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline mt-1.5"
                                    >
                                        <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                                        تصفح الأيقونات
                                    </a>
                                </div>

                                {/* Slug */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                                        الرابط المخصص (Slug)
                                    </label>
                                    <input
                                        value={formData.slug}
                                        onChange={e => setFormData({ ...formData, slug: e.target.value })}
                                        className="w-full h-11 bg-[#101422] border border-white/10 rounded-xl px-4 text-white text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all outline-none placeholder-slate-600 direction-ltr text-left"
                                        placeholder="custom-slug (فارغ = توليد تلقائي)"
                                    />
                                </div>

                                {/* Status Toggles */}
                                <div className="bg-white/[0.03] rounded-xl border border-white/8 divide-y divide-white/5">
                                    {[
                                        { key: 'isActive', label: 'الحالة', desc: 'ظاهر في المتجر', icon: 'visibility', color: 'bg-primary' },
                                        { key: 'isFeatured', label: 'مميز', desc: 'يظهر في الصفحة الرئيسية', icon: 'star', color: 'bg-amber-500' },
                                    ].map(item => (
                                        <div key={item.key} className="flex items-center justify-between px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <span className={`material-symbols-outlined text-[18px] ${(formData as any)[item.key] ? 'text-primary' : 'text-slate-600'}`}>
                                                    {item.icon}
                                                </span>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-200">{item.label}</p>
                                                    <p className="text-[11px] text-slate-500">{item.desc}</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, [item.key]: !(prev as any)[item.key] }))}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none shrink-0 ${(formData as any)[item.key] ? item.color : 'bg-slate-700'}`}
                                            >
                                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${(formData as any)[item.key] ? 'translate-x-1' : 'translate-x-6'}`} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {/* TAB 2: Filter Blocks */}
                        {activeTab === 'filters' && (
                            <div className="space-y-3">
                                <p className="text-xs text-slate-400">
                                    أضف خصائص تصفية مخصصة. ستظهر عند إضافة منتج وفي صفحة المتجر.
                                </p>

                                {formData.attributesSchema.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center gap-3 py-10 bg-white/[0.02] rounded-xl border border-dashed border-white/10">
                                        <span className="material-symbols-outlined text-slate-600 text-[40px]">filter_list_off</span>
                                        <p className="text-sm text-slate-500">لا توجد خصائص فلترة بعد</p>
                                        <button
                                            type="button"
                                            onClick={addBlock}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-primary/15 hover:bg-primary/25 text-primary border border-primary/20 rounded-lg text-xs font-bold transition-all"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">add</span>
                                            إضافة خاصية
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="space-y-3">
                                            {formData.attributesSchema.map((block: any, idx) => (
                                                <div key={block._id || idx} className="bg-[#101422] rounded-xl border border-white/8 p-4 space-y-3">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="size-6 rounded-md bg-primary/15 flex items-center justify-center shrink-0">
                                                                <span className="text-primary text-[11px] font-bold">{idx + 1}</span>
                                                            </div>
                                                            <span className="text-xs font-bold text-white">
                                                                {block.name || 'خاصية جديدة'}
                                                            </span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => removeBlock(idx)}
                                                            className="size-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0"
                                                        >
                                                            <span className="material-symbols-outlined text-[16px]">delete</span>
                                                        </button>
                                                    </div>

                                                    <div className="grid grid-cols-[1fr_auto] gap-2">
                                                        <input
                                                            type="text"
                                                            value={block.name}
                                                            onChange={e => updateBlock(idx, 'name', e.target.value)}
                                                            placeholder="اسم الخاصية (مثال: Connectivity)"
                                                            className="h-9 bg-[#1a1f2e] border border-white/10 rounded-lg px-3 text-xs text-white focus:border-primary outline-none placeholder-slate-600 w-full"
                                                        />
                                                        <select
                                                            value={block.type}
                                                            onChange={e => updateBlock(idx, 'type', e.target.value)}
                                                            className="h-9 bg-[#1a1f2e] border border-white/10 rounded-lg px-2 text-[11px] text-white focus:border-primary outline-none cursor-pointer w-24 shrink-0"
                                                        >
                                                            <option value="multi-select">متعدد</option>
                                                            <option value="single-select">واحد</option>
                                                        </select>
                                                    </div>

                                                    <div>
                                                        <label className="block text-[10px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                                                            الخيارات (مفصولة بفاصلة)
                                                        </label>
                                                        <input
                                                            type="text"
                                                            value={block.options.join(', ')}
                                                            onChange={e => {
                                                                const opts = e.target.value.split(',').map((s: string) => s.trim());
                                                                updateBlock(idx, 'options', opts);
                                                            }}
                                                            onBlur={e => {
                                                                const opts = e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean);
                                                                updateBlock(idx, 'options', opts);
                                                            }}
                                                            placeholder="USB, Bluetooth, Wi-Fi"
                                                            className="w-full h-9 bg-[#1a1f2e] border border-white/10 rounded-lg px-3 text-xs text-white focus:border-primary outline-none placeholder-slate-600"
                                                        />
                                                        {block.options.length > 0 && (
                                                            <div className="flex flex-wrap gap-1.5 mt-2">
                                                                {block.options.map((opt: string, oi: number) => (
                                                                    <span key={oi} className="px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary text-[10px] font-medium">
                                                                        {opt}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={addBlock}
                                            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-white/15 text-slate-400 hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all text-xs font-bold"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">add</span>
                                            إضافة خاصية جديدة
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sticky Footer */}
                    <div className="flex gap-3 px-5 py-4 border-t border-white/10 flex-shrink-0 bg-[#1a1f2e]">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-sm font-medium transition-all border border-white/8"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-primary/20 text-sm"
                        >
                            {isSaving ? (
                                <>
                                    <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    جاري الحفظ...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[18px]">save</span>
                                    {isEdit ? 'حفظ التعديلات' : 'إنشاء القسم'}
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
