import { useState } from 'react';

interface Category {
    id: number;
    name: string;
    nameEn: string;
    image: string;
    productCount: number;
    children?: Category[];
    expanded?: boolean;
    isActive?: boolean;
}

const CATEGORIES: Category[] = [
    {
        id: 1,
        name: 'أجهزة الكاشير',
        nameEn: 'POS Systems',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBsk0P7H4thcEFU3j2-Z5bZbAV_rFQwPg5XMjBGCzXbXam3gzru2Sz_b_Cszro7q_gUGVYu2JtBua8bN4EpeGzq-3a4gEg34xJftGdxqGk14gzwM8QxIoIjDDpgpojUNf4FIrqQAjJnot855f68YgGKFcGRdwiyl-UQO5Jk32BkdWHeIgyQv0fxclBzKXJ11bymOJUwzi7kkcxLoKYjVnXJ0MsvNTF0q3X2w6nfZ0pEOCEzLcfQ6bps5DVnRBdDj6hGeyZ2x8tDmHA',
        productCount: 124,
        isActive: true,
        children: [
            { id: 11, name: 'شاشات لمس', nameEn: 'Touch Screens', image: '', productCount: 45, isActive: true },
            { id: 12, name: 'طابعات فواتير', nameEn: 'Receipt Printers', image: '', productCount: 79, isActive: true },
        ],
    },
    {
        id: 2,
        name: 'قارئ الباركود',
        nameEn: 'Barcode Scanners',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyvfnrjHmwZCnKNXNKAPjHJfXLDSqkh3I_QO5_VqbPby1SbIEYg5mYF0Vmzgh7o0Pwbd8vyH42fZ-aSElu1f3B4JJ3UyGhxC6kFE9V09yBeLBrKn5K000Te71DNIJ4ock1C5-rV_0Rf7a6jNXWB9-9Nr2lB-o59GMX8SHnZHbHfdkfmP236JgAEVzhTrye8myK7a859M3NTFMB9t0Xs-ZhoXj-geVkFA2gvhWB3vMUYslwhCOHwto2N8Lz0njeSU9s2QK57RKQmv8',
        productCount: 64,
        isActive: true,
        children: [],
    },
    {
        id: 3,
        name: 'موازين إلكترونية',
        nameEn: 'Electronic Scales',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB53AfAdYSVNGB5oYFzfLzNBiSHgxDobxm6eMuU04gox73Dek_5_bgFD2-g2-TUNNxbCrFx1JCtNJvhz9iO_KPbN2II8puGy8ON-PORvD67gnwscRmerEECb2p-NXJOFEzfOPA8sJpnPiQFhadp1njp5toF1Qq5ohLGGkfnXkJatXjtagEez_cEq1lqrOX4D2iaW_TAGqaPHkEmyqpzSJUKNfsO4qGUczLnyJHPXvKwxhHh4WZhvJaCF6O2LUBXNSDJxHqndnh-Q38',
        productCount: 28,
        isActive: true,
        children: [],
    },
    {
        id: 4,
        name: 'مستهلكات',
        nameEn: 'Consumables',
        image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCgAio9WZdWpygXZ0pvf6CB-qjKUwk5AFiG4P2AyARjdCwqBAPX7TNe7ju3FM45hN1Tr8LfqMDSAlBrqqvZOfckkzPwKJiwwMhL0Jkt1NgNSxJLlD-CG8qQjkGQu-gzGbUgh_e4gP4UCZ-34eV0qekQGuYCUjaBMmgwEXy_y2fHLQh1ENa-RF-8a7GlIel0u0-BFK9iRb2yBXXw0OerBnatwWkqDxQDapcQ5_3pfVhkgDiRMJKzlCTjl77AjlIjEoeaC3l-6yvmDtg', // Placeholder for Consumables
        productCount: 0,
        isActive: false,
        children: [],
    },
];

export function CategoriesManagement() {
    const [categories] = useState<Category[]>(CATEGORIES);
    const [editingId, setEditingId] = useState<number | null>(null);

    return (
        <div className="flex flex-col gap-6">
            {/* Top Stats & Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex gap-4">
                    <div className="glass-card px-5 py-3 rounded-xl flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            <span className="material-symbols-outlined text-xl">folder</span>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">إجمالي الأقسام</p>
                            <p className="text-lg font-bold text-white">24</p>
                        </div>
                    </div>
                    <div className="glass-card px-5 py-3 rounded-xl flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                            <span className="material-symbols-outlined text-xl">check_circle</span>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400">أقسام نشطة</p>
                            <p className="text-lg font-bold text-white">18</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => setEditingId(-1)} // -1 for new
                    className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-lg font-bold transition-all shadow-lg shadow-primary/20"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    <span>إضافة قسم جديد</span>
                </button>
            </div>

            {/* Main Content */}
            <div className="glass-panel rounded-xl overflow-hidden flex flex-col min-h-[500px]">
                {/* Toolbar */}
                <div className="p-5 border-b border-white/5 flex flex-wrap items-center justify-between gap-4 bg-white/[0.02]">
                    <div className="relative w-full md:w-80">
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                            <span className="material-symbols-outlined text-[20px]">search</span>
                        </div>
                        <input
                            className="block w-full h-10 pr-10 pl-4 rounded-lg bg-[#0f1115] border border-white/5 text-sm text-white placeholder-slate-500 focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                            placeholder="بحث باسم القسم..."
                            type="text"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <select className="h-10 pl-8 pr-4 rounded-lg bg-[#0f1115] border border-white/5 text-sm text-slate-300 focus:ring-1 focus:ring-primary focus:border-primary appearance-none cursor-pointer">
                                <option>جميع الحالات</option>
                                <option>نشط</option>
                                <option>غير نشط</option>
                            </select>
                            <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none text-slate-400">
                                <span className="material-symbols-outlined text-[20px]">expand_more</span>
                            </div>
                        </div>
                        <button className="size-10 flex items-center justify-center rounded-lg bg-[#0f1115] border border-white/5 text-slate-400 hover:text-white hover:bg-white/5 transition-colors" title="عرض قائمة">
                            <span className="material-symbols-outlined">format_list_bulleted</span>
                        </button>
                        <button className="size-10 flex items-center justify-center rounded-lg bg-primary/20 border border-primary/20 text-primary hover:text-white hover:bg-primary transition-colors" title="عرض شجري">
                            <span className="material-symbols-outlined">account_tree</span>
                        </button>
                    </div>
                </div>

                {/* List Content */}
                <div className="p-5 flex-1 overflow-y-auto space-y-6">
                    {categories.map(category => (
                        <div key={category.id} className="glass-parent-panel rounded-xl p-6 flex flex-col gap-4">
                            {/* Parent Header */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <input className="rounded bg-[#0f1115] border-white/10 text-primary focus:ring-offset-gray-900 focus:ring-primary cursor-pointer" type="checkbox" />
                                    <span className="material-symbols-outlined text-slate-500 cursor-grab active:cursor-grabbing">drag_indicator</span>
                                    <div className="size-12 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center overflow-hidden shrink-0">
                                        {category.image.startsWith('http') ? (
                                            <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="material-symbols-outlined text-3xl text-slate-600">layers</span>
                                        )}
                                    </div>
                                    <div className="flex flex-col">
                                        <h3 className="font-bold text-white text-xl">{category.name}</h3>
                                        <p className="text-sm text-slate-400">{category.nameEn}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="px-3 py-1.5 rounded-md bg-white/5 text-slate-300 font-medium text-sm border border-white/5 whitespace-nowrap">
                                        {category.productCount} منتج
                                    </span>
                                    <button className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${category.isActive ? 'bg-primary' : 'bg-slate-700'}`}>
                                        <span className="sr-only">تفعيل القسم</span>
                                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${category.isActive ? '-translate-x-1' : '-translate-x-6'}`}></span>
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => setEditingId(category.id)} className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors" title="تعديل">
                                            <span className="material-symbols-outlined text-[20px]">edit</span>
                                        </button>
                                        <button className="p-2 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors" title="حذف">
                                            <span className="material-symbols-outlined text-[20px]">delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Children */}
                            {category.children && category.children.length > 0 && (
                                <div className="pr-12 border-r border-white/10 relative">
                                    <div className="absolute right-0 top-0 bottom-0 w-px bg-white/10 -mr-6"></div>
                                    <div className="flex flex-col gap-3">
                                        {category.children.map(child => (
                                            <div key={child.id} className="glass-child-item rounded-lg px-4 py-3 flex items-center justify-between gap-4 hover:bg-white/[0.08] transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <input className="rounded bg-[#0f1115] border-white/10 text-primary focus:ring-offset-gray-900 focus:ring-primary cursor-pointer" type="checkbox" />
                                                    <div className="size-9 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center overflow-hidden shrink-0">
                                                        <span className="material-symbols-outlined text-slate-500 text-lg">touch_app</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-slate-200 text-base">{child.name}</span>
                                                        <span className="text-xs text-slate-500">{child.nameEn}</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="px-2.5 py-1 rounded-md bg-white/5 text-slate-300 font-medium text-xs border border-white/5 whitespace-nowrap">
                                                        {child.productCount} منتج
                                                    </span>
                                                    <button className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${child.isActive ? 'bg-primary' : 'bg-slate-700'}`}>
                                                        <span className="sr-only">تفعيل القسم</span>
                                                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${child.isActive ? '-translate-x-1' : '-translate-x-4.5'}`}></span>
                                                    </button>
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={() => setEditingId(child.id)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors" title="تعديل">
                                                            <span className="material-symbols-outlined text-[16px]">edit</span>
                                                        </button>
                                                        <button className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors" title="حذف">
                                                            <span className="material-symbols-outlined text-[16px]">delete</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-white/5 flex items-center justify-between">
                    <p className="text-xs text-slate-500">عرض 1-4 من 24 قسم</p>
                    <div className="flex gap-2">
                        <button className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed">
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>
                        <button className="p-1.5 rounded-lg bg-primary text-white shadow-lg shadow-primary/20">
                            <span className="text-xs font-bold px-1">1</span>
                        </button>
                        <button className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10">
                            <span className="text-xs font-bold px-1">2</span>
                        </button>
                        <button className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10">
                            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Edit Modal (Simplified) */}
            {editingId && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditingId(null)}>
                    <div className="glass-panel rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">
                                {editingId === -1 ? 'إضافة قسم جديد' : 'تعديل الفئة'}
                            </h3>
                            <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-white">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        {/* Form similar to previous but refined styling */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">اسم الفئة (عربي)</label>
                                <input type="text" className="w-full h-12 bg-[#181a20] border border-white/10 rounded-xl px-4 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                            </div>
                            {/* ... more fields ... */}
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl transition-colors">حفظ</button>
                            <button onClick={() => setEditingId(null)} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors">إلغاء</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CategoriesManagement;
