import { useState } from 'react';
import { Link } from 'react-router-dom';

interface Product {
    id: string;
    name: string;
    sku: string;
    category: string;
    price: number;
    stock: number;
    status: 'active' | 'inactive' | 'draft' | 'out_of_stock' | 'low_stock' | 'hidden';
    image: string;
}

const PRODUCTS: Product[] = [
    {
        id: '1',
        name: 'ميزان باركود إلكتروني',
        sku: 'SCL-2024-X',
        price: 12500,
        stock: 45,
        category: 'أجهزة الوزن',
        status: 'active',
        image: 'https://placehold.co/100'
    },
    {
        id: '2',
        name: 'جهاز كاشير لمس 15 بوصة',
        sku: 'POS-T15-PRO',
        price: 8200,
        stock: 3,
        category: 'أجهزة الكاشير',
        status: 'active', // Displayed as 'active' but logically low stock
        image: 'https://placehold.co/100'
    },
    {
        id: '3',
        name: 'قارئ باركود لاسلكي',
        sku: 'SCN-WL-2D',
        price: 1400,
        stock: 120,
        category: 'قارئ الباركود',
        status: 'active',
        image: 'https://placehold.co/100'
    },
    {
        id: '4',
        name: 'طابعة فواتير حرارية 80مم',
        sku: 'PRT-TH-80',
        price: 3150,
        stock: 0,
        category: 'طابعات الفواتير',
        status: 'out_of_stock',
        image: 'https://placehold.co/100'
    },
    {
        id: '5',
        name: 'درج كاشير 5 خانات',
        sku: 'DRW-MET-5',
        price: 950,
        stock: 22,
        category: 'إكسسوارات',
        status: 'hidden',
        image: 'https://placehold.co/100'
    },
    {
        id: '6',
        name: 'ميزان منزلي ذكي',
        sku: 'SCL-HM-01',
        price: 850,
        stock: 200,
        category: 'أجهزة الوزن',
        status: 'active',
        image: 'https://placehold.co/100'
    },
];

const STATUS_CONFIG: Record<string, { color: string; label: string }> = {
    active: { color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'نشط' },
    inactive: { color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', label: 'غير نشط' },
    draft: { color: 'bg-gray-500/10 text-gray-400 border-gray-500/20', label: 'مسودة' },
    out_of_stock: { color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', label: 'نفذت' },
    low_stock: { color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', label: 'مخزون منخفض' },
    hidden: { color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', label: 'مخفي' },
};

export function ProductList() {
    const [products, setProducts] = useState(PRODUCTS);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');

    const handlePriceChange = (id: string, newPrice: string) => {
        const price = parseFloat(newPrice.replace(/[^0-9.]/g, '')) || 0;
        setProducts(prev => prev.map(p => p.id === id ? { ...p, price } : p));
    };

    const handleStockChange = (id: string, newStock: string) => {
        const stock = parseInt(newStock) || 0;
        setProducts(prev => prev.map(p => p.id === id ? { ...p, stock } : p));
    };

    const filteredProducts = products.filter((product) => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            product.sku.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === '' || product.category === selectedCategory;
        const matchesStatus = selectedStatus === '' || product.status === selectedStatus;
        return matchesSearch && matchesCategory && matchesStatus;
    });

    return (
        <div className="flex flex-col gap-6">
            {/* Page Header */}
            <div className="flex items-center justify-between px-8 py-4 border-b border-white/5 bg-background-dark/80 backdrop-blur-md sticky top-0 z-10 -mx-8 -mt-6 mb-2">
                <div className="flex items-center gap-4">
                    <h2 className="text-white text-xl font-bold tracking-tight">إدارة المنتجات</h2>
                    <span className="h-6 w-px bg-white/10 mx-2"></span>
                    <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-white/5 text-slate-400 border border-white/5">{products.length} منتج</span>
                    </div>
                </div>
                <div className="flex items-center gap-6">
                    {/* User & Notifications would go here from layout but kept simple for now */}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-panel rounded-xl p-5 flex items-center gap-4">
                    <div className="size-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <span className="material-symbols-outlined text-[28px]">inventory</span>
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold">إجمالي المنتجات</p>
                        <h3 className="text-xl font-bold text-white">{products.length} <span className="text-xs text-slate-500 font-normal">منتج</span></h3>
                    </div>
                </div>
                <div className="glass-panel rounded-xl p-5 flex items-center gap-4">
                    <div className="size-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                        <span className="material-symbols-outlined text-[28px]">attach_money</span>
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold">قيمة المخزون</p>
                        <h3 className="text-xl font-bold text-white">450,200 <span className="text-xs text-slate-500 font-normal">ج.م</span></h3>
                    </div>
                </div>
                <div className="glass-panel rounded-xl p-5 flex items-center gap-4 border-l-2 border-secondary/50">
                    <div className="size-12 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary">
                        <span className="material-symbols-outlined text-[28px]">warning</span>
                    </div>
                    <div>
                        <p className="text-slate-400 text-xs font-bold">تنبيهات المخزون</p>
                        <h3 className="text-xl font-bold text-white">5 <span className="text-xs text-slate-500 font-normal">منتجات منخفضة</span></h3>
                    </div>
                </div>
            </div>

            {/* Filters & Actions */}
            <div className="glass-panel rounded-xl p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
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
                    <div className="relative w-full md:w-auto">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="appearance-none block w-full md:w-40 h-10 rounded-lg bg-white/5 border border-white/5 text-sm text-slate-300 focus:ring-1 focus:ring-primary focus:border-primary/50 transition-all pl-10 pr-4 cursor-pointer outline-none"
                        >
                            <option value="">جميع الأقسام</option>
                            <option value="أجهزة الوزن">أجهزة الوزن</option>
                            <option value="أجهزة الكاشير">أجهزة الكاشير</option>
                            <option value="قارئ الباركود">قارئ الباركود</option>
                            <option value="طابعات الفواتير">طابعات الفواتير</option>
                            <option value="إكسسوارات">إكسسوارات</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                            <span className="material-symbols-outlined text-[20px]">expand_more</span>
                        </div>
                    </div>
                    <div className="relative w-full md:w-auto">
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="appearance-none block w-full md:w-40 h-10 rounded-lg bg-white/5 border border-white/5 text-sm text-slate-300 focus:ring-1 focus:ring-primary focus:border-primary/50 transition-all pl-10 pr-4 cursor-pointer outline-none"
                        >
                            <option value="">الحالة: الكل</option>
                            <option value="active">نشط</option>
                            <option value="inactive">غير نشط</option>
                            <option value="out_of_stock">نفذت</option>
                            <option value="hidden">مخفي</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                            <span className="material-symbols-outlined text-[20px]">expand_more</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
                    <button className="flex items-center justify-center gap-2 h-10 px-6 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-600/20 transition-all w-full md:w-auto border border-emerald-500/20">
                        <span className="material-symbols-outlined text-[20px]">save</span>
                        <span>حفظ التعديلات</span>
                    </button>
                    <Link to="/admin/products/add" className="flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-bold shadow-lg shadow-primary/20 transition-all w-full md:w-auto">
                        <span className="material-symbols-outlined text-[20px]">add</span>
                        <span>إضافة منتج</span>
                    </Link>
                    <button className="flex items-center justify-center size-10 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 transition-all">
                        <span className="material-symbols-outlined text-[20px]">ios_share</span>
                    </button>
                </div>
            </div>

            {/* Products Table */}
            <div className="glass-panel rounded-xl overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right">
                        <thead className="bg-white/5 text-slate-400 font-medium border-b border-white/5">
                            <tr>
                                <th className="px-6 py-4 w-10">
                                    <div className="flex items-center">
                                        <input type="checkbox" className="rounded border-white/10 bg-white/5 text-primary focus:ring-0" />
                                    </div>
                                </th>
                                <th className="px-6 py-4 whitespace-nowrap">المنتج</th>
                                <th className="px-6 py-4 whitespace-nowrap">القسم</th>
                                <th className="px-6 py-4 whitespace-nowrap w-40">السعر</th>
                                <th className="px-6 py-4 whitespace-nowrap w-32">المخزون</th>
                                <th className="px-6 py-4 whitespace-nowrap">الحالة</th>
                                <th className="px-6 py-4 whitespace-nowrap text-left">إجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-slate-300">
                            {filteredProducts.map((product) => (
                                <tr key={product.id} className="hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <input type="checkbox" className="rounded border-white/10 bg-white/5 text-primary focus:ring-0" />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-lg bg-white/5 p-1 flex-shrink-0 border border-white/5 flex items-center justify-center">
                                                <img src={product.image} alt={product.name} className="w-full h-full object-cover rounded" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-white text-base">{product.name}</span>
                                                <span className="text-slate-500 text-xs">SKU: {product.sku}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-400">{product.category}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                value={product.price.toLocaleString()}
                                                onChange={(e) => handlePriceChange(product.id, e.target.value)}
                                                className="w-24 h-8 px-2 rounded bg-background-dark border border-white/10 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all text-center font-bold outline-none text-sm"
                                            />
                                            <span className="text-xs text-slate-500 font-bold">ج.م</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={product.stock}
                                                onChange={(e) => handleStockChange(product.id, e.target.value)}
                                                className={`w-20 h-8 px-2 rounded bg-background-dark border border-white/10 ${product.stock < 5 ? 'text-red-400' : 'text-emerald-400'} focus:border-primary focus:ring-1 focus:ring-primary transition-all text-center font-bold outline-none text-sm`}
                                            />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${STATUS_CONFIG[product.status].color}`}>
                                            <span className={`size-1.5 rounded-full ${STATUS_CONFIG[product.status].color.split(' ')[1].replace('text-', 'bg-')}`}></span>
                                            {STATUS_CONFIG[product.status].label}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-left">
                                        <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                            <button className="p-2 rounded hover:bg-red-500/20 hover:text-red-400 text-slate-400 transition-colors" title="حذف">
                                                <span className="material-symbols-outlined text-[18px]">delete</span>
                                            </button>
                                            <Link to={`/admin/products/${product.id}`} className="p-2 rounded hover:bg-white/10 hover:text-white text-slate-400 transition-colors" title="تعديل">
                                                <span className="material-symbols-outlined text-[18px]">edit_square</span>
                                            </Link>
                                            <button className="p-2 rounded hover:bg-white/10 hover:text-white text-slate-400 transition-colors" title="المزيد">
                                                <span className="material-symbols-outlined text-[18px]">more_vert</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="p-4 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs text-slate-500">عرض 1-{products.length} من {products.length} منتج</span>
                    <div className="flex items-center gap-2">
                        <button className="size-8 flex items-center justify-center rounded bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-50">
                            <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>
                        <button className="size-8 flex items-center justify-center rounded bg-primary text-white text-xs font-bold shadow-lg shadow-primary/20">1</button>
                        <button className="size-8 flex items-center justify-center rounded bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors text-xs font-bold">2</button>
                        <button className="size-8 flex items-center justify-center rounded bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                            <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProductList;
