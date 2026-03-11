import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ProductCard } from '../components/products';
import { useProducts } from '../hooks/useProducts';
import api from '../lib/api';

export function ShopPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const queryCategories = searchParams.get('categories')?.split(',').filter(Boolean) || [];
    const querySearch = searchParams.get('search') || '';

    // State
    const [selectedCategories, setSelectedCategories] = useState<string[]>(queryCategories);
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [selectedSpecs, setSelectedSpecs] = useState<Record<string, string[]>>({});
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
    const [sortBy, setSortBy] = useState('rating');

    // Sync state if url changes
    useEffect(() => {
        const categoriesFromUrl = searchParams.get('categories')?.split(',').filter(Boolean) || [];
        setSelectedCategories(categoriesFromUrl);
    }, [searchParams]);

    // Fetch Categories
    const { data: categoriesData = [] } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const { data } = await api.get('/categories');
            return data;
        },
        initialData: []
    });

    const categoriesList = Array.isArray(categoriesData) ? categoriesData : (categoriesData as any)?.data || [];
    const effectiveCategories = categoriesList.filter((c: any) => c.isActive !== false);

    // Build hierarchy for categories
    const categoryTree = useMemo(() => {
        return effectiveCategories
            .filter((c: any) => !c.parentId && !c.parent_id)
            .map((parent: any) => ({
                ...parent,
                children: effectiveCategories.filter((c: any) => (c.parentId || c.parent_id) === parent.id)
            }));
    }, [effectiveCategories]);

    const { data: productsData, isLoading } = useProducts({
        limit: 1000,
        categories: selectedCategories,
        search: querySearch
    });

    const products = productsData?.data || [];

    // Derive Dynamic Filters
    const dynamicBrands = Array.from(new Set(products.map((p: any) => p.brand?.name).filter(Boolean)));
    
    // Extract dynamic specs
    const dynamicSpecs = useMemo(() => {
        const specsObj: Record<string, Set<string>> = {};
        products.forEach((product: any) => {
            if (product.specifications && Array.isArray(product.specifications)) {
                product.specifications.forEach((spec: any) => {
                    if (spec.key && spec.value) {
                        if (!specsObj[spec.key]) {
                            specsObj[spec.key] = new Set();
                        }
                        const values = spec.value.split(',').map((v: string) => v.trim());
                        values.forEach((v: string) => specsObj[spec.key].add(v));
                    }
                });
            }
        });

        return Object.entries(specsObj)
            .map(([key, valueSet]) => ({
                key,
                values: Array.from(valueSet).sort()
            }))
            .filter(spec => spec.values.length > 0);
    }, [products]);

    // Category Counts
    const categoryCounts = useMemo(() => {
        return products.reduce((acc: any, product: any) => {
            const catSlug = product.category?.slug || product.category?.id || 'other';
            acc[catSlug] = (acc[catSlug] || 0) + 1;
            acc['all'] = (acc['all'] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
    }, [products]);

    // Filtering logic (Local filters for things not yet handled by API or complex)
    const filteredProducts = useMemo(() => {
        return products.filter((product: any) => {
            if (querySearch) {
                const searchLower = querySearch.toLowerCase();
                const matchesName = product.name.toLowerCase().includes(searchLower);
                const matchesBrand = product.brand?.name?.toLowerCase().includes(searchLower);
                if (!matchesName && !matchesBrand) return false;
            }

            if (selectedBrands.length > 0 && product.brand && !selectedBrands.includes(product.brand.name)) return false;

            // Dynamic Specs Filter
            for (const [specKey, selectedValues] of Object.entries(selectedSpecs)) {
                if (selectedValues.length === 0) continue;
                
                const productSpecs = product.specifications || [];
                const specItem = productSpecs.find((s: any) => s.key === specKey);
                if (!specItem) return false;

                const productSpecValues = specItem.value.split(',').map((v: string) => v.trim().toLowerCase());
                const hasMatch = selectedValues.some(val => productSpecValues.includes(val.toLowerCase()));
                if (!hasMatch) return false;
            }

            const price = parseFloat(product.price);
            if (price < priceRange[0] || price > priceRange[1]) return false;

            return true;
        }).sort((a: any, b: any) => {
            if (sortBy === 'price-asc') return parseFloat(a.price) - parseFloat(b.price);
            if (sortBy === 'price-desc') return parseFloat(b.price) - parseFloat(a.price);
            return 0;
        });
    }, [products, querySearch, selectedBrands, selectedSpecs, priceRange, sortBy]);


    const toggleFilter = (set: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
        set((prev) => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
    };

    const toggleSpecFilter = (specKey: string, val: string) => {
        setSelectedSpecs(prev => {
            const currentSelected = prev[specKey] || [];
            const nextSelected = currentSelected.includes(val)
                ? currentSelected.filter(v => v !== val)
                : [...currentSelected, val];
            
            return {
                ...prev,
                [specKey]: nextSelected
            };
        });
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
        setSelectedSpecs({});
        setPriceRange([0, 100000]);
        setSearchParams({});
    };

    // Active Filters for Chips
    const activeFilters = [
        ...selectedBrands.map(b => ({ id: `brand-${b}`, label: b, onRemove: () => toggleFilter(setSelectedBrands, b as string) })),
    ];

    Object.entries(selectedSpecs).forEach(([specKey, values]) => {
        values.forEach(val => {
            activeFilters.push({
                id: `spec-${specKey}-${val}`,
                label: `${val}`,
                onRemove: () => toggleSpecFilter(specKey, val)
            });
        });
    });

    selectedCategories.forEach(slug => {
        const cat = effectiveCategories.find((c: any) => (c.slug || c.id) === slug);
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

                        {/* Categories List */}
                        <div className="border-b border-gray-700/50 pb-6 mb-6">
                            <h4 className="font-bold mb-4 text-sm text-gray-200">الفئات</h4>
                            <div className="space-y-1">
                                <label className="flex items-center justify-between cursor-pointer group py-2">
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            checked={selectedCategories.length === 0}
                                            onChange={() => toggleCategory('all')}
                                            className="rounded border-gray-600 bg-[#101622] text-primary focus:ring-0 focus:ring-offset-0 size-4"
                                        />
                                        <span className={`text-sm transition-colors ${selectedCategories.length === 0 ? 'text-primary' : 'text-gray-300 group-hover:text-white'}`}>
                                            الكل
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                                        {categoryCounts['all'] || 0}
                                    </span>
                                </label>
                                
                                {categoryTree.map((cat: any) => (
                                    <div key={cat.id} className="pt-2">
                                        <label className="flex items-center justify-between cursor-pointer group">
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCategories.includes(cat.slug || cat.id)}
                                                    onChange={() => toggleCategory(cat.slug || cat.id)}
                                                    className="rounded border-gray-600 bg-[#101622] text-primary focus:ring-0 focus:ring-offset-0 size-4"
                                                />
                                                <span className={`text-sm font-bold transition-colors ${selectedCategories.includes(cat.slug || cat.id) ? 'text-primary' : 'text-gray-300 group-hover:text-white'}`}>
                                                    {cat.name}
                                                </span>
                                            </div>
                                            <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                                                {categoryCounts[cat.slug || cat.id] || 0}
                                            </span>
                                        </label>
                                        
                                        {cat.children && cat.children.length > 0 && (
                                            <div className="pl-6 space-y-2 mt-2 mr-6 border-r-2 border-gray-700/50 pr-4">
                                                {cat.children.map((child: any) => (
                                                    <label key={child.id} className="flex items-center justify-between cursor-pointer group">
                                                        <div className="flex items-center gap-3">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedCategories.includes(child.slug || child.id)}
                                                                onChange={() => toggleCategory(child.slug || child.id)}
                                                                className="rounded border-gray-600 bg-[#101622] text-primary focus:ring-0 focus:ring-offset-0 size-3"
                                                            />
                                                            <span className={`text-xs transition-colors ${selectedCategories.includes(child.slug || child.id) ? 'text-primary' : 'text-gray-400 group-hover:text-white'}`}>
                                                                {child.name}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                                                            {categoryCounts[child.slug || child.id] || 0}
                                                        </span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Brands */}
                        {dynamicBrands.length > 0 && (
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
                        )}

                        {/* Dynamic Specs */}
                        {dynamicSpecs.map(spec => (
                            <div key={spec.key} className="border-b border-gray-700/50 pb-6 mb-6">
                                <h4 className="font-bold mb-4 text-sm text-gray-200">{spec.key}</h4>
                                <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-2">
                                    {spec.values.map(val => {
                                        const isSelected = selectedSpecs[spec.key]?.includes(val);
                                        return (
                                            <label key={val} className="flex items-center gap-3 cursor-pointer group">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => toggleSpecFilter(spec.key, val)}
                                                    className="rounded border-gray-600 bg-[#101622] text-primary focus:ring-0 focus:ring-offset-0 size-4"
                                                />
                                                <span className={`text-sm transition-colors font-medium ${isSelected ? 'text-primary' : 'text-gray-300 group-hover:text-white'}`}>
                                                    {val}
                                                </span>
                                            </label>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {/* Price Filter - Dual Range Slider */}
                        <div>
                            <h4 className="font-bold mb-6 text-sm text-gray-200">السعر</h4>
                            <div className="space-y-6">
                                <div className="relative h-2 flex items-center mx-2">
                                    {/* Slider Rail */}
                                    <div className="absolute w-full h-1.5 bg-[#101622] rounded-lg overflow-hidden border border-gray-700/50"></div>
                                    {/* Slider Track */}
                                    <div 
                                        className="absolute h-1.5 bg-gradient-to-r from-primary/80 to-primary rounded-lg"
                                        style={{
                                            left: `${Math.min((priceRange[0] / 100000) * 100, (priceRange[1] / 100000) * 100)}%`,
                                            width: `${Math.max(0, ((priceRange[1] - priceRange[0]) / 100000) * 100)}%`
                                        }}
                                    ></div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100000"
                                        step="100"
                                        value={priceRange[0]}
                                        onChange={(e) => setPriceRange([Math.min(Number(e.target.value), priceRange[1] - 100), priceRange[1]])}
                                        className="absolute w-full appearance-none pointer-events-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(33,150,243,0.5)] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary"
                                        // Specific z-index to handle overlap
                                        style={{ zIndex: priceRange[0] > 100000 - 100 ? 5 : 3 }} 
                                    />
                                    <input
                                        type="range"
                                        min="0"
                                        max="100000"
                                        step="100"
                                        value={priceRange[1]}
                                        onChange={(e) => setPriceRange([priceRange[0], Math.max(Number(e.target.value), priceRange[0] + 100)])}
                                        className="absolute w-full appearance-none pointer-events-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:size-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(33,150,243,0.5)] [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary z-4"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="relative w-full">
                                        <input
                                            type="number"
                                            className="w-full bg-[#101622] border border-gray-700 rounded-lg pr-2 pl-6 py-2 text-xs text-white focus:border-primary outline-none font-medium"
                                            placeholder="من"
                                            value={priceRange[0]}
                                            onChange={(e) => setPriceRange([Math.min(Number(e.target.value), priceRange[1]), priceRange[1]])}
                                        />
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500">ج.م</span>
                                    </div>
                                    <span className="text-gray-600">-</span>
                                    <div className="relative w-full">
                                        <input
                                            type="number"
                                            className="w-full bg-[#101622] border border-gray-700 rounded-lg pr-2 pl-6 py-2 text-xs text-white focus:border-primary outline-none font-medium"
                                            placeholder="إلى"
                                            value={priceRange[1]}
                                            onChange={(e) => setPriceRange([priceRange[0], Math.max(Number(e.target.value), priceRange[0])])}
                                        />
                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-500">ج.م</span>
                                    </div>
                                </div>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {isLoading ? (
                            <div className="col-span-full flex justify-center py-20">
                                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            filteredProducts.map((product: any) => (
                                <ProductCard
                                    key={product.id}
                                    id={product.id}
                                    name={product.name}
                                    brand={product.brand?.name || 'Generic'}
                                    price={parseFloat(product.price)}
                                    originalPrice={product.discountPrice ? parseFloat(product.discountPrice) : undefined}
                                    rating={5} // Placeholder
                                    imageUrl={product.images.find((i: any) => i.isPrimary)?.url || product.images[0]?.url || ''}
                                    slug={product.slug}
                                    badge={product.isFeatured ? { type: 'new', text: 'مميز' } : undefined}
                                />
                            ))
                        )}
                    </div>

                    {filteredProducts.length === 0 && !isLoading && (
                        <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
                            <span className="material-symbols-outlined text-6xl text-gray-600 mb-4">inventory_2</span>
                            <p className="text-gray-400 text-lg">لا توجد منتجات تطابق معايير البحث</p>
                            <button
                                onClick={clearAllFilters}
                                className="mt-4 px-6 py-2 bg-primary/20 hover:bg-primary/30 text-primary rounded-lg transition-colors font-bold"
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
