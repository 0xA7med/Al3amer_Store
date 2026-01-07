import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ProductCard } from '../components/products';

// Sample products (in a real app, this would come from API)
const ALL_PRODUCTS = [
    {
        id: '1',
        name: 'جهاز نقاط بيع صن مي T2 بشاشة لمس 15.6 بوصة',
        brand: 'Sunmi',
        price: 12325,
        originalPrice: 14500,
        rating: 4.8,
        reviewCount: 32,
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMY8XfqON8lUvVVB9L69sQCxr7_AXsKOqvvJBEL-p_MMPwDWUdbHf-awLWJi_ZKqF2jGxwV8-GvgwwJPXxAV7J2Rpi3xa8Y7hhgt6Wub-IDsY9khzMfWLYG0VrbqUWhGlTGUqmEpvxMwiKagbJlQKIQvQmOv_OB02LOwuL8ghKhJ9K2PNa7ngMAaYDMUyyHDaj5xBRzx4nEIN5Jh6kVpftA7TbgLetNjv9sIMGH-bqbwAv6dOFSyrsekUOvbeS14GIpMij48qctVo',
        badge: { type: 'discount' as const, text: 'خصم 15%' },
        category: 'pos',
    },
    {
        id: '2',
        name: 'ماسح باركود هانيويل 1470g ثنائي الأبعاد سلكي',
        brand: 'Honeywell',
        price: 3850,
        rating: 4.9,
        reviewCount: 18,
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuARj3xSr87HXA2HVKK2fzsGk0GLyntPqymRW61P1DfR46QcXWz824dNDHUy-iqktJJ-yAYw-cetY1Gs7-npRU0IRJF0-CR_HmjyxgU_PTHMdCz73pJrllPalklIQ0OcJj2IyAq40tNmhbEMOg-wB2DxkRO80Y6HxVypnERW878Bae0XqZdv9tk1hLNP317OR0Rq4KZWj5dnurpgwntQY_TD1cRo6YYLVUUkxCrG7yGz5_eCcc5KJLHGTxixCkVDSJ0aKd4ivRYSmxQ',
        category: 'scanners',
    },
    {
        id: '3',
        name: 'طابعة فواتير إبسون حرارية TM-T20III',
        brand: 'Epson',
        price: 6200,
        rating: 4.7,
        reviewCount: 25,
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAU1HJ4kCH73qtVltiLp6rsGYn2pAbAkNzvA4KPq_UKGV0FnAnoVFsSnAUTHUIR-E3W36OTY9PsFQv9l9UrVqQbGGp7rQEw65S6L7LrWIv9G9LTbRBJR1M6uJnSKbJcU9Wmqige1mdgh-Y6t3VPR4nDdOtODREQ5xs_m3-wn7rZ99sZ_Opm59eyolroWwea8pYOCZ9xc-kxpDYi9LStda1L3D8I3Vr3oQknZmVEgkt7-17XExaPKLMI50CppYPduMdV1bLpcun1qcc',
        badge: { type: 'new' as const, text: 'جديد' },
        category: 'printers',
    },
    {
        id: '4',
        name: 'درج نقدية معدني 5 خانات ثقيل التحمل',
        brand: 'Generic',
        price: 1850,
        rating: 4.5,
        reviewCount: 12,
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA6uLOi1t86uAk4XNIw7O-9PrHtr5QrID9kCR76oLjEY-Gd6Gg2QpXB52x9ahFBociWZUThFXlc4d9UVptOCXYuYRdcksQxzqE_I4CVDqtyq3b6J7wa3J9Q4HzV2jOaQL4kaIgeFWXboqFS7g0zr6PCMZmQXJeYZz5Q9xpEl7lqf3U9p3tkhwH3T7IEYYgoXynQCXCGIlGfdSoxGldt0Sf-IV82MIJr9g6R__ANz9PcAF04QVse-AEPNGZ_cjhynUZeM7tgWevtkfs',
        category: 'drawers',
    },
    {
        id: '5',
        name: 'جهاز هاند هيلد صن مي V2 Pro مع طابعة مدمجة',
        brand: 'Sunmi',
        price: 6950,
        rating: 4.9,
        reviewCount: 28,
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCoa-8mMOQIAqz5O3DVUmiqoBik-XkxcAY83SZuafJCCHYvhLwWtqRzvTuN0ojFpNPqnYiu7c7rKgOaOsOct6dueKTyiLdvFwfe1UdAmg2_ByYoAu6d-eMbb4xy6QpRY-hkds5tFK9YMup6-5kD1nNnmNG56WEt9psL0oToq-LOlYD18y87BX-3bZkFsLLWAcyNWsOOU_xQ_q4g91fDZt2a1UywSDBaPVtgTSj2H541k0N48CE1VC3ySjGfrUdMAYESwzBWT0awC3k',
        category: 'pos',
    },
    {
        id: '6',
        name: 'طابعة باركود حرارية Xprinter 365B',
        brand: 'Xprinter',
        price: 2100,
        rating: 4.3,
        reviewCount: 15,
        imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBplPM1awXeqqCdoI2FWx4CURvEnfMCohEujk24BoYzaKrZ8345E0bY9ZcKvkqFLrHtm5LuT4OkdHKXJqG1DCx4XL7h7a6_vCjYd65LMmvqScxznqcgS4MfUIsZmG949Xww5Hybf3ProwMwoPPsONMnn2uaD7eDQ72-hDK5bKDPls9_jje-zMHgRIqWTWOZwpBcB2uMkY56-bMG_ktbNM5BpiiEk3U1MDBE_FUns14mcVlwLNiF6luGe7O8jDsyFMVoaR_neJFQXlY',
        category: 'printers',
    },
];

const CATEGORIES = [
    { id: 'all', name: 'الكل', count: 42 },
    { id: 'pos', name: 'أجهزة نقاط البيع (POS)', count: 18 },
    { id: 'scanners', name: 'ماسحات الباركود', count: 12 },
    { id: 'printers', name: 'طابعات الإيصالات', count: 25 },
    { id: 'drawers', name: 'أدراج النقدية', count: 8 },
];

const BRANDS = ['Honeywell', 'Sunmi', 'Epson', 'Xprinter', 'Generic'];

export function ShopPage() {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
    const [sortBy, setSortBy] = useState('rating');

    const filteredProducts = ALL_PRODUCTS.filter((product) => {
        if (selectedCategory !== 'all' && product.category !== selectedCategory) return false;
        if (selectedBrands.length > 0 && !selectedBrands.includes(product.brand)) return false;
        return true;
    });

    const toggleBrand = (brand: string) => {
        setSelectedBrands((prev) =>
            prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
        );
    };

    return (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            {/* Breadcrumb */}
            <nav className="flex mb-8 text-sm font-medium text-gray-400">
                <ol className="flex items-center gap-2">
                    <li><Link to="/" className="hover:text-primary transition-colors">الرئيسية</Link></li>
                    <li><span className="material-symbols-outlined text-sm pt-1">chevron_left</span></li>
                    <li className="text-white font-bold">المتجر</li>
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
                                onClick={() => { setSelectedCategory('all'); setSelectedBrands([]); }}
                                className="text-xs text-primary hover:underline"
                            >
                                مسح الكل
                            </button>
                        </div>

                        {/* Categories */}
                        <div className="border-b border-gray-700/50 pb-6 mb-6">
                            <h4 className="font-bold mb-4 text-sm text-gray-200">الفئات</h4>
                            <div className="space-y-3">
                                {CATEGORIES.map((cat) => (
                                    <label key={cat.id} className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="radio"
                                            name="category"
                                            checked={selectedCategory === cat.id}
                                            onChange={() => setSelectedCategory(cat.id)}
                                            className="rounded-full border-gray-600 bg-[#101622] text-primary focus:ring-0 focus:ring-offset-0 size-4"
                                        />
                                        <span className="text-gray-300 group-hover:text-white text-sm transition-colors">
                                            {cat.name}
                                        </span>
                                        <span className="mr-auto text-xs text-gray-500 bg-[#101622] px-2 py-0.5 rounded-full">
                                            {cat.count}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Brands */}
                        <div>
                            <h4 className="font-bold mb-4 text-sm text-gray-200">العلامة التجارية</h4>
                            <div className="space-y-3">
                                {BRANDS.map((brand) => (
                                    <label key={brand} className="flex items-center gap-3 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={selectedBrands.includes(brand)}
                                            onChange={() => toggleBrand(brand)}
                                            className="rounded border-gray-600 bg-[#101622] text-primary focus:ring-0 focus:ring-offset-0 size-5"
                                        />
                                        <span className="text-gray-300 group-hover:text-white text-sm transition-colors">
                                            {brand}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                </aside>

                {/* Products Grid */}
                <div className="flex-1">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">منتجاتنا</h1>
                        <p className="text-gray-400 text-sm mb-6">
                            {filteredProducts.length} منتج متوفر لترقية نظام الكاشير لديك
                        </p>

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
                        {filteredProducts.map((product) => (
                            <ProductCard
                                key={product.id}
                                id={product.id}
                                name={product.name}
                                brand={product.brand}
                                price={product.price}
                                originalPrice={product.originalPrice}
                                rating={Math.round(product.rating)}
                                reviewCount={product.reviewCount}
                                imageUrl={product.imageUrl}
                                badge={product.badge}
                            />
                        ))}
                    </div>

                    {filteredProducts.length === 0 && (
                        <div className="text-center py-20">
                            <span className="material-symbols-outlined text-6xl text-gray-600 mb-4">inventory_2</span>
                            <p className="text-gray-400 text-lg">لا توجد منتجات تطابق معايير البحث</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ShopPage;
