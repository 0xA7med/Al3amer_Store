import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ProductCard } from '../components/products';
import { useProducts } from '../hooks/useProducts';
import api from '../lib/api';

const FALLBACK_CATEGORIES = [
    { id: '1', name: 'أجهزة نقاط البيع', slug: 'pos-systems' },
    { id: '2', name: 'طابعات الباركود', slug: 'printers' },
    { id: '3', name: 'ماسحات الباركود', slug: 'scanners' },
    { id: '4', name: 'أدراج النقدية', slug: 'drawers' },
    { id: '5', name: 'الموازين الإلكترونية', slug: 'scales' },
];



export function ShopPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const queryCategories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
    const querySearch = searchParams.get('search') || '';

    // State
    const [selectedCategories, setSelectedCategories] = useState<string[]>(queryCategories);
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [selectedConnectivity, setSelectedConnectivity] = useState<string[]>([]);
    const [selectedUsage, setSelectedUsage] = useState<string[]>([]);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
    const [sortBy, setSortBy] = useState('rating');

    // Sync state if url changes
    useEffect(() => {
        const categoriesFromUrl = searchParams.get('categories')?.split(',').filter(Boolean) || [];
        setSelectedCategories(categoriesFromUrl);
    }, [searchParams]);

    // Fetch Categories
    const { data: categories = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const { data } = await api.get('/categories');
            return data;
        },
        initialData: []
    });

    const effectiveCategories = categories.length > 0
        ? categories.filter((c: any) => c.isActive !== false) // Default to true if undefined
        : FALLBACK_CATEGORIES;

    const displayCategories = [
        { id: 'all', name: 'الكل', slug: 'all' },
        ...effectiveCategories.map((cat: any) => ({
            id: cat.slug || cat.id,
            name: cat.name,
            slug: cat.slug || cat.id
        }))
    ];

    const { data: productsData, isLoading } = useProducts({
        limit: 1000,
        categories: selectedCategories,
        search: querySearch
    });

    const products = productsData?.data || [];

    // Derive Dynamic Filters
    const dynamicBrands = Array.from(new Set(products.map(p => p.brand?.name).filter(Boolean)));
    const dynamicConnectivity = ['USB', 'Bluetooth', 'Wi-Fi', 'Ethernet']; // Usually fixed for POS
    const dynamicUsage = ['Handheld', 'Desktop', 'Industrial', 'Mobile'];

    // Category Counts
    const categoryCounts = products.reduce((acc, product) => {
        const catSlug = product.category?.slug || product.category?.id || 'other';
        acc[catSlug] = (acc[catSlug] || 0) + 1;
        acc['all'] = (acc['all'] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Filtering logic (Local filters for things not yet handled by API or complex)
    const filteredProducts = products.filter((product) => {
        // Categories are now handled by API

        if (querySearch) {
            const searchLower = querySearch.toLowerCase();
            const matchesName = product.name.toLowerCase().includes(searchLower);
            const matchesBrand = product.brand?.name?.toLowerCase().includes(searchLower);
            if (!matchesName && !matchesBrand) return false;
        }

        if (selectedBrands.length > 0 && product.brand && !selectedBrands.includes(product.brand.name)) return false;

        // Connectivity Filter (check specifications array)
        if (selectedConnectivity.length > 0) {
            const specs = product.specifications || [];
            const conn = specs.find((s: any) => s.key === 'connectivity' || s.key === 'اتصال')?.value || '';
            if (!selectedConnectivity.some(c => conn.toLowerCase().includes(c.toLowerCase()))) return false;
        }

        // Usage Filter
        if (selectedUsage.length > 0) {
            const specs = product.specifications || [];
            const usage = specs.find((s: any) => s.key === 'usage' || s.key === 'الاستخدام')?.value || '';
            if (!selectedUsage.some(u => usage.toLowerCase().includes(u.toLowerCase()))) return false;
        }

        const price = parseFloat(product.price);
        if (price < priceRange[0] || price > priceRange[1]) return false;

        return true;
    }).sort((a, b) => {
        if (sortBy === 'price-asc') return parseFloat(a.price) - parseFloat(b.price);
        if (sortBy === 'price-desc') return parseFloat(b.price) - parseFloat(a.price);
        return 0;
    });

    const toggleFilter = (set: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
        set((prev) => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
    };

    const toggleCategory = (slug: string) => {
        let newCategories: string[];
        if (slug === 'all') {
            newCategories = [];
        } else {
            newCategories = selectedCategories.includes(slug)
                ? selectedCategories.filter(s => s !== slug)
                : [...selectedCategories, slug];
        }

        setSelectedCategories(newCategories);
        setSearchParams(prev => {
            if (newCategories.length > 0) {
                prev.set('categories', newCategories.join(','));
            } else {
                prev.delete('categories');
            }
            return prev;
        });
    };

    const clearAllFilters = () => {
        setSelectedCategories([]);
        setSelectedBrands([]);
        setSelectedConnectivity([]);
        setSelectedUsage([]);
        setPriceRange([0, 100000]);
        setSearchParams({});
    };

    // Active Filters for Chips
    const activeFilters = [
        ...selectedBrands.map(b => ({ id: `brand-${b}`, label: b, onRemove: () => toggleFilter(setSelectedBrands, b) })),
        ...selectedConnectivity.map(c => ({ id: `conn-${c}`, label: c, onRemove: () => toggleFilter(setSelectedConnectivity, c) })),
        ...selectedUsage.map(u => ({ id: `usage-${u}`, label: u, onRemove: () => toggleFilter(setSelectedUsage, u) })),
    ];

    selectedCategories.forEach(slug => {
        const cat = displayCategories.find(c => c.slug === slug);
        if (cat) {
            activeFilters.unshift({ id: `cat-${slug}`, label: cat.name, onRemove: () => toggleCategory(slug) });
        }
    });

    return (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            {/* Breadcrumb */}
            <nav className="flex mb-8 text-sm font-medium text-gray-400">
                <ol className="flex items-center gap-2">
                    <li><Link to="/" className="hover:text-primary transition-colors">الرئيسية</Link></li>
                    <li><span className="material-symbols-outlined text-sm pt-1">chevron_left</span></li>
                    <li className="text-white font-bold">المتجر</li>
                    {querySearch && (
                        <>
                            <li><span className="material-symbols-outlined text-sm pt-1">chevron_left</span></li>
                            <li>نتائج بحث: <span className="text-primary">"{querySearch}"</span></li>
                        </>
                    )}
                </ol>
            </nav>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Filters */}
                <aside className="w-full lg:w-72 flex-shrink-0 space-y-6">
                    <div className="glass-panel rounded-2xl p-6 sticky top-24">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">filter_list</span>
                                تصفية النتائج
                            </h3>
                            <button
                                onClick={clearAllFilters}
                                className="text-xs text-primary hover:underline"
                            >
                                مسح الكل
                            </button>
                        </div>

                        {/* Categories */}
                        <div className="border-b border-gray-700/50 pb-6 mb-6">
                            <h4 className="font-bold mb-4 text-sm text-gray-200">الفئات</h4>
                            <div className="space-y-3">
                                {displayCategories.map((cat) => (
                                    <label key={cat.id} className="flex items-center justify-between cursor-pointer group">
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="checkbox"
                                                checked={cat.slug === 'all' ? selectedCategories.length === 0 : selectedCategories.includes(cat.slug)}
                                                onChange={() => toggleCategory(cat.slug)}
                                                className="rounded border-gray-600 bg-[#101622] text-primary focus:ring-0 focus:ring-offset-0 size-4"
                                            />
                                            <span className={`text-sm transition-colors ${(cat.slug === 'all' ? selectedCategories.length === 0 : selectedCategories.includes(cat.slug)) ? 'text-primary' : 'text-gray-300 group-hover:text-white'}`}>
                                                {cat.name}
                                            </span>
                                        </div>
                                        <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                                            {categoryCounts[cat.slug] || 0}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Brands */}
                        <div className="border-b border-gray-700/50 pb-6 mb-6">
                            <h4 className="font-bold mb-4 text-sm text-gray-200">العلامة التجارية</h4>
                            <div className="space-y-3 max-h-[160px] overflow-y-auto custom-scrollbar pr-2">
                                {dynamicBrands.map((brand) => (
                                    <label key={brand as string} className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={selectedBrands.includes(brand as string)}
                                            onChange={() => toggleFilter(setSelectedBrands, brand as string)}
                                            className="rounded border-gray-600 bg-[#101622] text-primary focus:ring-0 focus:ring-offset-0 size-4"
                                        />
                                        <span className="text-gray-300 group-hover:text-white text-sm transition-colors">
                                            {brand as string}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Connectivity */}
                        <div className="border-b border-gray-700/50 pb-6 mb-6">
                            <h4 className="font-bold mb-4 text-sm text-gray-200">الاتصال</h4>
                            <div className="grid grid-cols-2 gap-2">
                                {dynamicConnectivity.map((conn) => (
                                    <button
                                        key={conn}
                                        onClick={() => toggleFilter(setSelectedConnectivity, conn)}
                                        className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all border ${selectedConnectivity.includes(conn)
                                            ? 'bg-primary/20 border-primary text-primary'
                                            : 'bg-white/5 border-white/5 text-gray-400 hover:border-gray-600'
                                            }`}
                                    >
                                        {conn}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Usage/Classification */}
                        <div className="border-b border-gray-700/50 pb-6 mb-6">
                            <h4 className="font-bold mb-4 text-sm text-gray-200">الاستخدام</h4>
                            <div className="space-y-2">
                                {dynamicUsage.map((usage) => (
                                    <label key={usage} className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={selectedUsage.includes(usage)}
                                            onChange={() => toggleFilter(setSelectedUsage, usage)}
                                            className="rounded border-gray-600 bg-[#101622] text-primary focus:ring-0 focus:ring-offset-0 size-4"
                                        />
                                        <span className="text-gray-300 group-hover:text-white text-sm transition-colors font-medium">
                                            {usage}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Price Filter */}
                        <div>
                            <h4 className="font-bold mb-4 text-sm text-gray-200">السعر</h4>
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        className="w-full bg-[#101622] border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white focus:border-primary outline-none"
                                        placeholder="من"
                                        value={priceRange[0]}
                                        onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                                    />
                                    <span className="text-gray-600">-</span>
                                    <input
                                        type="number"
                                        className="w-full bg-[#101622] border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white focus:border-primary outline-none"
                                        placeholder="إلى"
                                        value={priceRange[1]}
                                        onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                                    />
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="100000"
                                    step="1000"
                                    value={priceRange[1]}
                                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                                    className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Products Grid */}
                <div className="flex-1">
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-2">
                            <h1 className="text-3xl font-bold text-white">منتجاتنا</h1>
                            {activeFilters.length > 0 && (
                                <button
                                    onClick={clearAllFilters}
                                    className="text-xs text-slate-500 hover:text-white flex items-center gap-1 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-sm">close</span>
                                    مسح كل الفلاتر
                                </button>
                            )}
                        </div>
                        <p className="text-gray-400 text-sm mb-6">
                            {filteredProducts.length} منتج متوفر
                        </p>

                        {/* Filter Chips */}
                        {activeFilters.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-6">
                                {activeFilters.map((chip) => (
                                    <span
                                        key={chip.id}
                                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold"
                                    >
                                        {chip.label}
                                        <button onClick={chip.onRemove} className="hover:text-white">
                                            <span className="material-symbols-outlined text-[14px]">close</span>
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                        {/* Sort & Filter Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-3 rounded-xl">
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => setSortBy('all')}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${sortBy === 'all' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-[#232f48] hover:bg-[#324467] text-gray-300 hover:text-white'}`}
                                >
                                    الكل
                                </button>
                                <button
                                    onClick={() => setSortBy('bestselling')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${sortBy === 'bestselling' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-[#232f48] hover:bg-[#324467] text-gray-300 hover:text-white'}`}
                                >
                                    الأكثر مبيعاً
                                </button>
                                <button
                                    onClick={() => setSortBy('new')}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${sortBy === 'new' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-[#232f48] hover:bg-[#324467] text-gray-300 hover:text-white'}`}
                                >
                                    وصل حديثاً
                                </button>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-sm text-gray-400 hidden sm:block">ترتيب حسب:</span>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="appearance-none bg-[#101622] text-white border border-gray-700 rounded-lg py-2 pr-4 pl-10 text-sm focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer"
                                >
                                    <option value="rating">التقييم الأعلى</option>
                                    <option value="price-asc">السعر: من الأقل للأعلى</option>
                                    <option value="price-desc">السعر: من الأعلى للأقل</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Products Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {isLoading ? (
                            <div className="col-span-full flex justify-center py-20">
                                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            filteredProducts.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    id={product.id}
                                    name={product.name}
                                    brand={product.brand?.name || 'Generic'}
                                    price={parseFloat(product.price)}
                                    originalPrice={product.discountPrice ? parseFloat(product.discountPrice) : undefined}
                                    rating={5} // Placeholder
                                    imageUrl={product.images.find(i => i.isPrimary)?.url || product.images[0]?.url || ''}
                                    slug={product.slug}
                                    badge={product.isFeatured ? { type: 'new', text: 'مميز' } : undefined}
                                />
                            ))
                        )}
                    </div>

                    {filteredProducts.length === 0 && !isLoading && (
                        <div className="text-center py-20">
                            <span className="material-symbols-outlined text-6xl text-gray-600 mb-4">inventory_2</span>
                            <p className="text-gray-400 text-lg">لا توجد منتجات تطابق معايير البحث</p>
                            <button
                                onClick={() => { setSelectedCategories([]); setSelectedBrands([]); }}
                                className="mt-4 px-6 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-colors"
                            >
                                مسح المرشحات
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ShopPage;
