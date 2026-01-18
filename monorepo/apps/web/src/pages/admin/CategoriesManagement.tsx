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

    // Toggle expand
    const toggleExpand = (id: string) => {
        setExpandedMap(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Recursive render for Tree
    const renderCategoryRow = (category: Category, level: number = 0) => {
        const hasChildren = category.children && category.children.length > 0;
        const isExpanded = expandedMap[category.id] ?? true; // Default expanded? Or false? Let's default true for better visibility

        return (
            <div key={category.id} className="flex flex-col">
                <div className={`
                    flex items-center justify-between p-4 border-b border-white/5 hover:bg-white/5 transition-colors
                    ${level > 0 ? 'bg-white/[0.02]' : ''}
                `} style={{ paddingRight: `${level * 2 + 1.5}rem` }}>
                    <div className="flex items-center gap-4">
                        {/* Expand Button or Spacer */}
                        <div className="w-6 flex justify-center">
                            {hasChildren && (
                                <button onClick={() => toggleExpand(category.id)} className="text-slate-400 hover:text-white transition-colors">
                                    <span className="material-symbols-outlined text-[20px]">
                                        {isExpanded ? 'expand_more' : 'chevron_left'}
                                    </span>
                                </button>
                            )}
                        </div>

                        {/* Image */}
                        <div className="size-10 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center overflow-hidden shrink-0">
                            {category.image ? (
                                <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                            ) : (
                                <span className="material-symbols-outlined text-slate-600">
                                    {category.icon || 'category'}
                                </span>
                            )}
                        </div>

                        {/* Name */}
                        <div className="flex flex-col">
                            <h3 className="font-bold text-white text-base">{category.name}</h3>
                            <p className="text-xs text-slate-500">{category.slug}</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                        <span className="px-3 py-1 rounded-md bg-white/5 text-slate-300 font-medium text-xs border border-white/5 whitespace-nowrap">
                            {category.productCount || 0} منتج
                        </span>

                        {/* Status Toggle */}
                        <button
                            onClick={() => updateCategory({ id: category.id, data: { isActive: !category.isActive } })}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${category.isActive ? 'bg-primary' : 'bg-slate-700'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${category.isActive ? '-translate-x-1' : '-translate-x-6'}`}></span>
                        </button>

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

                {/* Children */}
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
        <div className="flex flex-col gap-6 p-6">
            {/* Header Stats */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex gap-4">
                    <div className="glass-card px-5 py-3 rounded-xl flex items-center gap-3 bg-[#1e232d] border border-white/10">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <span className="material-symbols-outlined text-xl">folder</span>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">إجمالي الأقسام</p>
                            <p className="text-lg font-bold text-white">{totalCategories}</p>
                        </div>
                    </div>
                    <div className="glass-card px-5 py-3 rounded-xl flex items-center gap-3 bg-[#1e232d] border border-white/10">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                            <span className="material-symbols-outlined text-xl">check_circle</span>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">أقسام نشطة</p>
                            <p className="text-lg font-bold text-white">{activeCategories}</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setEditingCategory({ isActive: true })} // New Root
                    className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg font-bold transition-all shadow-lg shadow-primary/20"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    <span>إضافة قسم رئيسي</span>
                </button>
            </div>

            {/* Tree Table */}
            <div className="glass-panel rounded-xl overflow-hidden flex flex-col min-h-[500px] bg-[#1e232d] border border-white/10">
                <div className="p-5 border-b border-white/5 bg-white/[0.02]">
                    <h2 className="text-lg font-bold text-white">هيكل الأقسام</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
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
                    categories={categories} // For parent selection if needed (removed for now, using Add Sub button or Add Root)
                    isSaving={isCreating || isUpdating}
                />
            )}
        </div>
    );
}

function CategoryModal({ category, onClose, onSave, isSaving }: {
    category: Partial<Category>,
    onClose: () => void,
    onSave: (data: Partial<Category>) => Promise<void>,
    categories?: Category[],
    isSaving: boolean
}) {
    const [formData, setFormData] = useState({
        name: category.name || '',
        image: category.image || '',
        icon: category.icon || '',
        parentId: category.parentId || null,
        isActive: category.isActive ?? true,
    });

    // Update form data when category prop changes (for edit mode)
    useEffect(() => {
        setFormData({
            name: category.name || '',
            image: category.image || '',
            icon: category.icon || '',
            parentId: category.parentId || null,
            isActive: category.isActive ?? true,
        });
    }, [category]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name) return toast.error('Required fields');
        await onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="glass-panel rounded-2xl w-full max-w-md p-6 bg-[#1e232d] border border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-white">
                        {category.id ? 'تعديل القسم' : (formData.parentId ? 'إضافة قسم فرعي' : 'إضافة قسم جديد')}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">اسم القسم</label>
                        <input
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            className="w-full h-12 bg-[#181a20] border border-white/10 rounded-xl px-4 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                            placeholder="مثال: إلكترونيات"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">رمز الأيقونة (Material Symbol)</label>
                        <input
                            value={formData.icon || ''}
                            onChange={e => setFormData({ ...formData, icon: e.target.value })}
                            className="w-full h-12 bg-[#181a20] border border-white/10 rounded-xl px-4 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                            placeholder="مثال: inventory_2"
                        />
                        {formData.icon && (
                            <div className="mt-2 flex items-center gap-2 p-2 bg-white/5 rounded-lg">
                                <span className="material-symbols-outlined text-primary text-2xl">{formData.icon}</span>
                                <span className="text-sm text-gray-400">معاينة الأيقونة</span>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">رابط الصورة (URL)</label>
                        <input
                            value={formData.image}
                            onChange={e => setFormData({ ...formData, image: e.target.value })}
                            className="w-full h-12 bg-[#181a20] border border-white/10 rounded-xl px-4 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                            placeholder="https://..."
                        />
                    </div>
                    {/* Status Toggle */}
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-medium text-gray-300">الحالة:</label>
                        <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.isActive ? 'bg-primary' : 'bg-slate-700'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isActive ? '-translate-x-1' : '-translate-x-6'}`}></span>
                        </button>
                        <span className="text-sm text-slate-400">{formData.isActive ? 'نشط' : 'غير نشط'}</span>
                    </div>

                    <div className="flex gap-3 mt-6">
                        <button
                            disabled={isSaving}
                            type="submit"
                            className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
                        >
                            {isSaving ? 'جاري الحفظ...' : 'حفظ'}
                        </button>
                        <button type="button" onClick={onClose} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors">إلغاء</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
