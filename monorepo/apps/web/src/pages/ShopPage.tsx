import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ProductCard } from '../components/products';
import { useProducts } from '../hooks/useProducts';
import api from '../lib/api';

// =========================================================
// Collapsible Filter Section Component
// =========================================================
function FilterSection({ title, icon, defaultOpen = true, children }: {
    title: string;
    icon: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-gray-700/50 pb-5 mb-5 last:border-b-0 last:pb-0 last:mb-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-full mb-3 group"
                type="button"
            >
                <h4 className="font-bold text-sm text-gray-200 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[18px]">{icon}</span>
                    {title}
                </h4>
                <span className={`material-symbols-outlined text-[18px] text-slate-500 group-hover:text-white transition-all duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    expand_more
                </span>
            </button>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
                {children}
            </div>
        </div>
    );
}

// =========================================================
// Dual Range Slider Component
// =========================================================
function DualRangeSlider({ min, max, step, value, onChange }: {
    min: number;
    max: number;
    step: number;
    value: [number, number];
    onChange: (val: [number, number]) => void;
}) {
    const minPercent = ((value[0] - min) / (max - min)) * 100;
    const maxPercent = ((value[1] - min) / (max - min)) * 100;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                    <span className="absolute -top-5 right-0 text-[10px] text-slate-500">من</span>
                    <input
                        type="number"
                        className="w-full bg-[#101622] border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white focus:border-primary outline-none text-center"
                        value={value[0]}
                        onChange={(e) => {
                            const v = Number(e.target.value);
                            if (v <= value[1]) onChange([v, value[1]]);
                        }}
                    />
                </div>
                <span className="text-gray-600 text-xs font-bold">—</span>
                <div className="flex-1 relative">
                    <span className="absolute -top-5 right-0 text-[10px] text-slate-500">إلى</span>
                    <input
                        type="number"
                        className="w-full bg-[#101622] border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-white focus:border-primary outline-none text-center"
                        value={value[1]}
                        onChange={(e) => {
                            const v = Number(e.target.value);
                            if (v >= value[0]) onChange([value[0], v]);
                        }}
                    />
                </div>
            </div>
            <div className="relative h-6 flex items-center">
                {/* Track background */}
                <div className="absolute inset-x-0 h-1.5 bg-white/10 rounded-full" />
                {/* Active range highlight */}
                <div
                    className="absolute h-1.5 bg-gradient-to-r from-primary to-blue-400 rounded-full"
                    style={{ left: `${minPercent}%`, right: `${100 - maxPercent}%` }}
                />
                {/* Min thumb */}
                <input
                    type="range" min={min} max={max} step={step} value={value[0]}
                    onChange={(e) => {
                        const v = Number(e.target.value);
                        if (v <= value[1]) onChange([v, value[1]]);
                    }}
                    className="absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-primary/30 [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:transition-transform [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:cursor-pointer"
                    style={{ zIndex: value[0] > max - step * 10 ? 5 : 3 }}
                />
                {/* Max thumb */}
                <input
                    type="range" min={min} max={max} step={step} value={value[1]}
                    onChange={(e) => {
                        const v = Number(e.target.value);
                        if (v >= value[0]) onChange([value[0], v]);
                    }}
                    className="absolute inset-x-0 w-full appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-primary/30 [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:transition-transform [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:cursor-pointer"
                    style={{ zIndex: 4 }}
                />
            </div>
            <div className="flex justify-between text-[10px] text-slate-500 font-medium">
                <span>{min.toLocaleString()} ج.م</span>
                <span>{max.toLocaleString()} ج.م</span>
            </div>
        </div>
    );
}

// =========================================================
// Category Tree Item (recursive)
// =========================================================
interface CategoryNode {
    id: string;
    name: string;
    slug: string;
    parentId?: string | null;
    isActive?: boolean;
    productCount?: number;
    activeProductCount?: number;
    children?: CategoryNode[];
}

function CategoryTreeItem({
    node, selectedCategories, categoryCounts, toggleCategory, depth = 0
}: {
    node: CategoryNode;
    selectedCategories: string[];
    categoryCounts: Record<string, number>;
    toggleCategory: (slug: string) => void;
    depth?: number;
}) {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = node.children && node.children.length > 0;
    const isChecked = selectedCategories.includes(node.slug);

    // Use activeProductCount for customers, fallback to calculated counts
    const count = node.activeProductCount !== undefined 
        ? node.activeProductCount 
        : (categoryCounts[node.slug] || 0);

    return (
        <div>
            <label
                className="flex items-center justify-between cursor-pointer group py-1"
                style={{ paddingRight: depth > 0 ? `${depth * 16}px` : undefined }}
            >
                <div className="flex items-center gap-2.5">
                    {hasChildren ? (
                        <button
                            type="button"
                            onClick={(e) => { e.preventDefault(); setExpanded(!expanded); }}
                            className="text-slate-500 hover:text-white transition-colors flex-shrink-0"
                        >
                            <span className={`material-symbols-outlined text-[14px] transition-transform duration-200 ${expanded ? 'rotate-90' : ''}`}>
                                chevron_right
                            </span>
                        </button>
                    ) : (
                        <span className="w-[14px]" />
                    )}
                    <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleCategory(node.slug)}
                        className="rounded border-gray-600 bg-[#101622] text-primary focus:ring-0 focus:ring-offset-0 size-3.5"
                    />
                    <span className={`text-sm transition-colors ${isChecked ? 'text-primary font-semibold' : 'text-gray-300 group-hover:text-white'}`}>
                        {node.name}
                    </span>
                </div>
                <span className="text-[10px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {count}
                </span>
            </label>
            {hasChildren && expanded && (
                <div className="transition-all duration-200">
                    {node.children!.map(child => (
                        <CategoryTreeItem
                            key={child.id}
                            node={child}
                            selectedCategories={selectedCategories}
                            categoryCounts={categoryCounts}
                            toggleCategory={toggleCategory}
                            depth={depth + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// =========================================================
// Build Category Tree
// =========================================================
function buildCategoryTree(flatList: any[]): CategoryNode[] {
    const map = new Map<string, CategoryNode>();
    const roots: CategoryNode[] = [];

    flatList.forEach(cat => {
        map.set(cat.id, { ...cat, children: [] });
    });

    flatList.forEach(cat => {
        const parentId = cat.parentId || cat.parent_id;
        if (parentId && map.has(parentId)) {
            map.get(parentId)!.children!.push(map.get(cat.id)!);
        } else {
            roots.push(map.get(cat.id)!);
        }
    });

    return roots;
}

/**
 * Recursively filters the category tree to remove nodes that have 0 products 
 * AND whose descendants all have 0 products.
 */
function filterEmptyCategories(nodes: CategoryNode[]): CategoryNode[] {
    return nodes.reduce((acc: CategoryNode[], node) => {
        const children = node.children ? filterEmptyCategories(node.children) : [];
        const hasActiveChildren = children.length > 0;
        
        // Calculate total ACTIVE count for this node (direct + children)
        const childrenActiveCount = children.reduce((sum, child) => sum + (child.activeProductCount || 0), 0);
        const nodeActiveCount = (node.activeProductCount || 0) + childrenActiveCount;
        
        const hasDirectActiveProducts = (node.activeProductCount || 0) > 0;

        if (hasDirectActiveProducts || hasActiveChildren) {
            acc.push({ ...node, children, activeProductCount: nodeActiveCount });
        }
        return acc;
    }, []);
}

function getAllDescendantSlugs(parentId: string, flatList: any[]): string[] {
    const children = flatList.filter(c => (c.parentId || c.parent_id) === parentId);
    let slugs: string[] = [];
    children.forEach(child => {
        slugs.push(child.slug);
        slugs = slugs.concat(getAllDescendantSlugs(child.id, flatList));
    });
    return slugs;
}

// =========================================================
// Spec Display Labels (Arabic names for known keys)
// =========================================================
const SPEC_LABEL_MAP: Record<string, string> = {
    connectivity: 'الاتصال',
    usage: 'الاستخدام',
    'اتصال': 'الاتصال',
    'الاستخدام': 'الاستخدام',
    'المعالج': 'المعالج',
    'الذاكرة': 'الذاكرة',
    'الشاشة': 'الشاشة',
    'نظام التشغيل': 'نظام التشغيل',
    'البطارية': 'البطارية',
    'الوزن': 'الوزن',
};

// Keys that make sense as filters (multi-value or categorizable)
const FILTERABLE_SPEC_KEYS = new Set([
    'connectivity', 'اتصال',
    'usage', 'الاستخدام',
]);

// =========================================================
// Main ShopPage
// =========================================================
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
    const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

    // Sync state if url changes
    useEffect(() => {
        const categoriesFromUrl = searchParams.get('categories')?.split(',').filter(Boolean) || [];
        setSelectedCategories(categoriesFromUrl);
    }, [searchParams]);

    // Fetch Categories
    const { data: categoriesRaw, isLoading: isLoadingCategories } = useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const { data } = await api.get('/categories');
            return data;
        }
    });

    const categories = useMemo(() => {
        if (!categoriesRaw) return [];
        return Array.isArray(categoriesRaw) ? categoriesRaw : (categoriesRaw as any).value || [];
    }, [categoriesRaw]);

    const activeCategories = useMemo(() => 
        categories.filter((c: any) => c.isActive !== false),
    [categories]);

    const categoryTree = useMemo(() => {
        const tree = buildCategoryTree(activeCategories);
        return filterEmptyCategories(tree);
    }, [activeCategories]);

    // Expand selected categories to include all descendants
    const expandedCategories = useMemo(() => {
        if (selectedCategories.length === 0) return [];
        
        let allSlugs = [...selectedCategories];
        selectedCategories.forEach(slug => {
            const cat = activeCategories.find((c: any) => c.slug === slug);
            if (cat) {
                const descendantSlugs = getAllDescendantSlugs(cat.id, activeCategories);
                allSlugs = allSlugs.concat(descendantSlugs);
            }
        });
        return Array.from(new Set(allSlugs));
    }, [selectedCategories, activeCategories]);

    const dynamicFiltersParam = useMemo(() => {
        const filters: Record<string, string[]> = {};
        for (const [key, values] of Object.entries(selectedSpecs)) {
            if (values.length > 0) {
                filters[key] = values;
            }
        }
        return Object.keys(filters).length > 0 ? JSON.stringify(filters) : undefined;
    }, [selectedSpecs]);

    const { data: productsData, isLoading } = useProducts({
        limit: 1000,
        categories: expandedCategories,
        search: querySearch,
        dynamicFilters: dynamicFiltersParam
    });

    const products = productsData?.data || [];

    // ── Dynamic price range from products ──
    const computedPriceRange = useMemo(() => {
        if (products.length === 0) return { min: 0, max: 100000 };
        const prices = products.map(p => parseFloat(p.price)).filter(p => !isNaN(p));
        return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
    }, [products]);

    // Initialize price range from computed products
    useEffect(() => {
        if (products.length > 0) {
            setPriceRange([computedPriceRange.min, computedPriceRange.max]);
        }
    }, [computedPriceRange.min, computedPriceRange.max]);

    // ── Dynamic Brands ──
    const dynamicBrands = useMemo(() =>
        Array.from(new Set(products.map(p => p.brand?.name).filter(Boolean))) as string[],
        [products]
    );

    // ── Dynamic Spec Facets (Amazon-style) ──
    const specFacets = useMemo(() => {
        // Priority 1: Use Category attributesSchema if a specific category is selected
        if (selectedCategories.length === 1) {
            const cat = activeCategories.find((c: any) => c.slug === selectedCategories[0]);
            if (cat && cat.attributesSchema && Array.isArray(cat.attributesSchema) && cat.attributesSchema.length > 0) {
                // Map schema to facets
                const schemaFacets = cat.attributesSchema.map((block: any) => ({
                    key: block.name,
                    label: block.name,
                    values: block.options || []
                }));

                // ONLY show options that actually exist in the current filtered products for this category
                // (Optional but recommended for better UX)
                const availableValues = new Map<string, Set<string>>();
                products.forEach(p => {
                    const attrs = p.dynamicAttributes || {};
                    Object.entries(attrs).forEach(([k, v]) => {
                        if (!availableValues.has(k)) availableValues.set(k, new Set());
                        const vals = Array.isArray(v) ? v : [v];
                        vals.forEach(val => availableValues.get(k)!.add(String(val)));
                    });
                });

                return schemaFacets.map((f: any) => ({
                    ...f,
                    values: f.values.filter((v: any) => availableValues.get(f.key)?.has(v))
                })).filter((f: any) => f.values.length > 0);
            }
        }

        // Priority 2: Fallback to inferring from products (for multi-category or no schema)
        const facetMap = new Map<string, Set<string>>();

        products.forEach(product => {
            // New dynamicAttributes structure
            if (product.dynamicAttributes && typeof product.dynamicAttributes === 'object') {
                Object.entries(product.dynamicAttributes).forEach(([key, value]) => {
                    if (!value) return;
                    if (!facetMap.has(key)) facetMap.set(key, new Set());
                    
                    const values = Array.isArray(value) ? value : [value];
                    values.forEach(v => {
                        const strVal = String(v).trim();
                        if (strVal) facetMap.get(key)!.add(strVal);
                    });
                });
            }

            // Fallback: Legacy specifications array (only for common keys)
            const specs = product.specifications;
            if (specs && Array.isArray(specs)) {
                specs.forEach((spec: any) => {
                    const key = spec.key?.trim();
                    if (!key || !spec.value) return;

                    // Only build facets for known filterable keys from legacy
                    if (!FILTERABLE_SPEC_KEYS.has(key.toLowerCase())) return;

                    if (!facetMap.has(key)) facetMap.set(key, new Set());
                    const values = String(spec.value).split(/[,،]/).map(v => v.trim()).filter(Boolean);
                    values.forEach(v => facetMap.get(key)!.add(v));
                });
            }
        });

        // Convert to array of facet groups, merging those with same label
        const groupsByLabel = new Map<string, { key: string; label: string; values: Set<string> }>();
        
        facetMap.forEach((values, key) => {
            const label = SPEC_LABEL_MAP[key] || key;
            if (!groupsByLabel.has(label)) {
                groupsByLabel.set(label, { key, label, values: new Set(values) });
            } else {
                const group = groupsByLabel.get(label)!;
                values.forEach(v => group.values.add(v));
            }
        });

        return Array.from(groupsByLabel.values()).map(g => ({
            key: g.key,
            label: g.label,
            values: Array.from(g.values).sort()
        })).filter(f => f.values.length > 0);
    }, [products, selectedCategories, activeCategories]);

    // ── Category Counts ──
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = {};
        products.forEach(product => {
            // Count direct category
            const cat = product.category;
            if (cat) {
                counts[cat.slug] = (counts[cat.slug] || 0) + 1;
                // Also count parent categories
                if (cat.parent) {
                    counts[cat.parent.slug] = (counts[cat.parent.slug] || 0) + 1;
                    if (cat.parent.parent) {
                        counts[cat.parent.parent.slug] = (counts[cat.parent.parent.slug] || 0) + 1;
                    }
                }
            }
            counts['all'] = (counts['all'] || 0) + 1;
        });
        return counts;
    }, [products]);

    // ── Filtering ──
    const filteredProducts = useMemo(() => {
        return products.filter((product) => {
            // Search
            if (querySearch) {
                const searchLower = querySearch.toLowerCase();
                const matchesName = product.name.toLowerCase().includes(searchLower);
                const matchesBrand = product.brand?.name?.toLowerCase().includes(searchLower);
                if (!matchesName && !matchesBrand) return false;
            }

            // Brand filter
            if (selectedBrands.length > 0 && product.brand && !selectedBrands.includes(product.brand.name)) return false;

            // Dynamic spec filters
            for (const [specKey, selectedValues] of Object.entries(selectedSpecs)) {
                if (selectedValues.length === 0) continue;

                let hasMatch = false;

                // 1. Check dynamicAttributes
                const attrs = product.dynamicAttributes;
                if (attrs && attrs[specKey]) {
                    const productValues = Array.isArray(attrs[specKey]) ? attrs[specKey] : [attrs[specKey]];
                    const productValuesLower = (productValues as string[]).map(v => String(v).trim().toLowerCase());
                    hasMatch = selectedValues.some(sv => productValuesLower.includes(sv.toLowerCase()));
                }

                // 2. Fallback to legacy specifications list
                if (!hasMatch) {
                    const specs = product.specifications || [];
                    if (Array.isArray(specs)) {
                        /* We check case insensitive matching for key if fallback */
                        const spec = specs.find((s: any) => s.key?.trim().toLowerCase() === specKey.toLowerCase());
                        if (spec) {
                            const productValues = String(spec.value).split(/[,،]/).map(v => v.trim().toLowerCase());
                            hasMatch = selectedValues.some(sv => productValues.includes(sv.toLowerCase()));
                        }
                    }
                }

                if (!hasMatch) return false;
            }

            // Price range
            const price = parseFloat(product.price);
            if (price < priceRange[0] || price > priceRange[1]) return false;

            return true;
        }).sort((a, b) => {
            if (sortBy === 'price-asc') return parseFloat(a.price) - parseFloat(b.price);
            if (sortBy === 'price-desc') return parseFloat(b.price) - parseFloat(a.price);
            if (sortBy === 'bestselling') return (b.salesCount || 0) - (a.salesCount || 0);
            if (sortBy === 'new') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            return 0;
        });
    }, [products, querySearch, selectedBrands, selectedSpecs, priceRange, sortBy]);

    // ── Handlers ──
    const toggleFilter = (set: React.Dispatch<React.SetStateAction<string[]>>, val: string) => {
        set((prev) => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
    };

    const toggleSpecFilter = (specKey: string, value: string) => {
        setSelectedSpecs(prev => {
            const current = prev[specKey] || [];
            const updated = current.includes(value)
                ? current.filter(v => v !== value)
                : [...current, value];
            return { ...prev, [specKey]: updated };
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
        setPriceRange([computedPriceRange.min, computedPriceRange.max]);
        setSearchParams({});
    };

    // ── Active Filter Chips ──
    const activeFilters = useMemo(() => {
        const filters: { id: string; label: string; onRemove: () => void }[] = [];

        selectedCategories.forEach(slug => {
            const cat = activeCategories.find((c: any) => c.slug === slug);
            if (cat) {
                filters.push({ id: `cat-${slug}`, label: cat.name, onRemove: () => toggleCategory(slug) });
            }
        });

        selectedBrands.forEach(b => {
            filters.push({ id: `brand-${b}`, label: b, onRemove: () => toggleFilter(setSelectedBrands, b) });
        });

        Object.entries(selectedSpecs).forEach(([key, values]) => {
            values.forEach(v => {
                const label = `${SPEC_LABEL_MAP[key] || key}: ${v}`;
                filters.push({ id: `spec-${key}-${v}`, label, onRemove: () => toggleSpecFilter(key, v) });
            });
        });

        return filters;
    }, [selectedCategories, selectedBrands, selectedSpecs, activeCategories]);

    const hasActiveFilters = activeFilters.length > 0 || priceRange[0] > computedPriceRange.min || priceRange[1] < computedPriceRange.max;

    return (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            {/* Breadcrumb */}
            <nav className="flex mb-6 text-sm font-medium text-gray-400">
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

            {/* Mobile Filter & Sort Button */}
            <div className="lg:hidden mb-4">
                <button
                    onClick={() => setIsFilterDrawerOpen(true)}
                    className="flex items-center gap-2 w-full py-3 px-4 bg-[#1e293b] border border-white/10 rounded-xl text-white font-bold hover:border-primary/50 transition-all active:scale-[0.98]"
                >
                    <span className="material-symbols-outlined text-primary">filter_list</span>
                    <span>تصفية وترتيب</span>
                    {hasActiveFilters && (
                        <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                            {activeFilters.length}
                        </span>
                    )}
                    <span className="material-symbols-outlined text-gray-400 mr-auto">tune</span>
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Sidebar Filters — Desktop only inline, Mobile via Drawer */}
                <aside className="hidden lg:block w-full lg:w-72 flex-shrink-0 space-y-6">
                    <div className="glass-panel rounded-2xl p-5 sticky top-24">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">filter_list</span>
                                تصفية النتائج
                            </h3>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearAllFilters}
                                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                                    مسح الكل
                                </button>
                            )}
                        </div>

                        {/* ── Categories (Tree) ── */}
                        <FilterSection title="الفئات" icon="category" defaultOpen={true}>
                            <div className="space-y-0.5 max-h-[280px] overflow-y-auto custom-scrollbar pr-1">
                                {/* "All" option */}
                                <label className="flex items-center justify-between cursor-pointer group py-1">
                                    <div className="flex items-center gap-2.5">
                                        <span className="w-[14px]" />
                                        <input
                                            type="checkbox"
                                            checked={selectedCategories.length === 0}
                                            onChange={() => toggleCategory('all')}
                                            className="rounded border-gray-600 bg-[#101622] text-primary focus:ring-0 focus:ring-offset-0 size-3.5"
                                        />
                                        <span className={`text-sm transition-colors ${selectedCategories.length === 0 ? 'text-primary font-semibold' : 'text-gray-300 group-hover:text-white'}`}>
                                            الكل
                                        </span>
                                    </div>
                                    <span className="text-[10px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                                        {categoryCounts['all'] || 0}
                                    </span>
                                </label>
                                {categoryTree.length > 0 ? (
                                    categoryTree.map(node => (
                                        <CategoryTreeItem
                                            key={node.id}
                                            node={node}
                                            selectedCategories={selectedCategories}
                                            categoryCounts={categoryCounts}
                                            toggleCategory={toggleCategory}
                                        />
                                    ))
                                ) : (
                                    !isLoadingCategories && <p className="text-[11px] text-slate-500 py-2">لا توجد تصنيفات نشطة</p>
                                )}
                            </div>
                        </FilterSection>

                        {/* ── Brand (dynamic) ── */}
                        {dynamicBrands.length > 0 && (
                            <FilterSection title="العلامة التجارية" icon="verified" defaultOpen={false}>
                                <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                                    {dynamicBrands.map((brand) => (
                                        <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                checked={selectedBrands.includes(brand)}
                                                onChange={() => toggleFilter(setSelectedBrands, brand)}
                                                className="rounded border-gray-600 bg-[#101622] text-primary focus:ring-0 focus:ring-offset-0 size-3.5"
                                            />
                                            <span className={`text-sm transition-colors ${selectedBrands.includes(brand) ? 'text-primary font-semibold' : 'text-gray-300 group-hover:text-white'}`}>
                                                {brand}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </FilterSection>
                        )}

                        {/* ── Dynamic Spec Facets (Amazon-style) ── */}
                        {specFacets.map((facet: { key: string; label: string; values: string[] }) => (
                            <FilterSection key={facet.key} title={facet.label} icon="tune" defaultOpen={false}>
                                <div className="flex flex-wrap gap-1.5">
                                    {facet.values.map((value: string) => {
                                        const isActive = (selectedSpecs[facet.key] || []).includes(value);
                                        return (
                                            <button
                                                key={value}
                                                onClick={() => toggleSpecFilter(facet.key, value)}
                                                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${isActive
                                                    ? 'bg-primary/20 border-primary text-primary shadow-sm shadow-primary/10'
                                                    : 'bg-white/5 border-white/5 text-gray-400 hover:border-gray-600 hover:text-white'
                                                    }`}
                                            >
                                                {value}
                                            </button>
                                        );
                                    })}
                                </div>
                            </FilterSection>
                        ))}

                        {/* ── Price Range (Dual Slider) ── */}
                        <FilterSection title="السعر" icon="payments" defaultOpen={false}>
                            <DualRangeSlider
                                min={computedPriceRange.min}
                                max={computedPriceRange.max || 100000}
                                step={Math.max(1, Math.floor((computedPriceRange.max - computedPriceRange.min) / 100))}
                                value={priceRange}
                                onChange={setPriceRange}
                            />
                        </FilterSection>
                    </div>
                </aside>

                {/* Mobile Filter Bottom-Sheet Drawer */}
                {isFilterDrawerOpen && (
                    <div className="fixed inset-0 z-[105] lg:hidden" role="dialog" aria-modal="true">
                        {/* Backdrop */}
                        <div
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsFilterDrawerOpen(false)}
                        />
                        {/* Sheet */}
                        <div className="absolute bottom-0 inset-x-0 bg-[#0d121c] border-t border-white/10 rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300">
                            {/* Handle Bar */}
                            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                                <div className="w-10 h-1 bg-white/20 rounded-full" />
                            </div>
                            {/* Header */}
                            <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 flex-shrink-0">
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">filter_list</span>
                                    تصفية النتائج
                                </h3>
                                <div className="flex items-center gap-3">
                                    {hasActiveFilters && (
                                        <button
                                            onClick={clearAllFilters}
                                            className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                                            مسح الكل
                                        </button>
                                    )}
                                    <button
                                        onClick={() => setIsFilterDrawerOpen(false)}
                                        className="p-1.5 bg-white/5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-xl">close</span>
                                    </button>
                                </div>
                            </div>
                            {/* Scrollable Content */}
                            <div className="overflow-y-auto flex-1 p-5">
                                {/* Sort */}
                                <div className="mb-5 pb-5 border-b border-gray-700/50">
                                    <h4 className="font-bold text-sm text-gray-200 flex items-center gap-2 mb-3">
                                        <span className="material-symbols-outlined text-primary text-[18px]">sort</span>
                                        ترتيب حسب
                                    </h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { key: 'rating', label: 'التقييم الأعلى' },
                                            { key: 'bestselling', label: 'الأكثر مبيعاً' },
                                            { key: 'new', label: 'وصل حديثاً' },
                                            { key: 'price-asc', label: 'سعر: الأقل أولاً' },
                                            { key: 'price-desc', label: 'سعر: الأعلى أولاً' },
                                        ].map(item => (
                                            <button
                                                key={item.key}
                                                onClick={() => setSortBy(item.key)}
                                                className={`py-2.5 rounded-xl text-sm font-bold transition-all border ${
                                                    sortBy === item.key
                                                        ? 'bg-primary/20 border-primary text-primary'
                                                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-gray-600 hover:text-white'
                                                }`}
                                            >
                                                {item.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Categories */}
                                <FilterSection title="الفئات" icon="category" defaultOpen={true}>
                                    <div className="space-y-0.5 max-h-[240px] overflow-y-auto custom-scrollbar pr-1">
                                        <label className="flex items-center justify-between cursor-pointer group py-1">
                                            <div className="flex items-center gap-2.5">
                                                <span className="w-[14px]" />
                                                <input
                                                    type="checkbox"
                                                    checked={selectedCategories.length === 0}
                                                    onChange={() => toggleCategory('all')}
                                                    className="rounded border-gray-600 bg-[#101622] text-primary focus:ring-0 focus:ring-offset-0 size-3.5"
                                                />
                                                <span className={`text-sm transition-colors ${selectedCategories.length === 0 ? 'text-primary font-semibold' : 'text-gray-300 group-hover:text-white'}`}>الكل</span>
                                            </div>
                                            <span className="text-[10px] text-gray-500 bg-white/5 px-1.5 py-0.5 rounded-full">{categoryCounts['all'] || 0}</span>
                                        </label>
                                        {categoryTree.map(node => (
                                            <CategoryTreeItem
                                                key={node.id}
                                                node={node}
                                                selectedCategories={selectedCategories}
                                                categoryCounts={categoryCounts}
                                                toggleCategory={toggleCategory}
                                            />
                                        ))}
                                    </div>
                                </FilterSection>

                                {/* Brands */}
                                {dynamicBrands.length > 0 && (
                                    <FilterSection title="العلامة التجارية" icon="verified" defaultOpen={false}>
                                        <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                                            {dynamicBrands.map((brand) => (
                                                <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedBrands.includes(brand)}
                                                        onChange={() => toggleFilter(setSelectedBrands, brand)}
                                                        className="rounded border-gray-600 bg-[#101622] text-primary focus:ring-0 focus:ring-offset-0 size-3.5"
                                                    />
                                                    <span className={`text-sm transition-colors ${selectedBrands.includes(brand) ? 'text-primary font-semibold' : 'text-gray-300 group-hover:text-white'}`}>{brand}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </FilterSection>
                                )}

                                {/* Dynamic Specs */}
                                {specFacets.map((facet: { key: string; label: string; values: string[] }) => (
                                    <FilterSection key={facet.key} title={facet.label} icon="tune" defaultOpen={false}>
                                        <div className="flex flex-wrap gap-1.5">
                                            {facet.values.map((value: string) => {
                                                const isActive = (selectedSpecs[facet.key] || []).includes(value);
                                                return (
                                                    <button
                                                        key={value}
                                                        onClick={() => toggleSpecFilter(facet.key, value)}
                                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border ${isActive
                                                            ? 'bg-primary/20 border-primary text-primary shadow-sm shadow-primary/10'
                                                            : 'bg-white/5 border-white/5 text-gray-400 hover:border-gray-600 hover:text-white'
                                                        }`}
                                                    >
                                                        {value}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </FilterSection>
                                ))}

                                {/* Price */}
                                <FilterSection title="السعر" icon="payments" defaultOpen={false}>
                                    <DualRangeSlider
                                        min={computedPriceRange.min}
                                        max={computedPriceRange.max || 100000}
                                        step={Math.max(1, Math.floor((computedPriceRange.max - computedPriceRange.min) / 100))}
                                        value={priceRange}
                                        onChange={setPriceRange}
                                    />
                                </FilterSection>
                            </div>
                            {/* Footer Apply Button */}
                            <div className="p-4 border-t border-white/10 flex-shrink-0">
                                <button
                                    onClick={() => setIsFilterDrawerOpen(false)}
                                    className="w-full py-3.5 bg-primary hover:bg-primary-dark text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/25"
                                >
                                    عرض {filteredProducts.length} منتج
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Products Grid */}
                <div className="flex-1">
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-2">
                            <h1 className="text-3xl font-bold text-white">منتجاتنا</h1>
                            {hasActiveFilters && (
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
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold"
                                    >
                                        {chip.label}
                                        <button onClick={chip.onRemove} className="hover:text-white transition-colors">
                                            <span className="material-symbols-outlined text-[14px]">close</span>
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Sort & Filter Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-4 glass-panel p-3 rounded-xl">
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { key: 'all', label: 'الكل' },
                                    { key: 'bestselling', label: 'الأكثر مبيعاً' },
                                    { key: 'new', label: 'وصل حديثاً' },
                                ].map(item => (
                                    <button
                                        key={item.key}
                                        onClick={() => setSortBy(item.key)}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${sortBy === item.key
                                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                            : 'bg-[#232f48] hover:bg-[#324467] text-gray-300 hover:text-white'
                                            }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
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
                    <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
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
                                    price={product.discountPrice ? parseFloat(product.discountPrice) : parseFloat(product.price)}
                                    originalPrice={product.discountPrice ? parseFloat(product.price) : undefined}
                                    rating={5}
                                    imageUrl={product.images.find(i => i.isPrimary)?.url || product.images[0]?.url || ''}
                                    slug={product.slug}
                                    stock={product.stock}
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
                                onClick={clearAllFilters}
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
