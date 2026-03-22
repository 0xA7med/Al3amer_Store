import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { ProductCard } from '../components/products';

import { useFeaturedProducts, useCategories, useNewArrivals, useOffers } from '../hooks/useProducts';

export function HomePage() {
    const { data: featuredProducts, isLoading: isFeaturedLoading } = useFeaturedProducts(12); // Fetch more for hero + grid
    const { data: newArrivals, isLoading: isNewLoading } = useNewArrivals(4);
    const { data: offerProducts, isLoading: isOffersLoading } = useOffers(4);
    const { data: categories } = useCategories();

    const [currentHeroIndex, setCurrentHeroIndex] = useState(0);

    useEffect(() => {
        if (!featuredProducts || featuredProducts.length <= 1) return;
        
        const maxItems = Math.min(featuredProducts.length, 8); // Cycle through up to 8 products
        const interval = setInterval(() => {
            setCurrentHeroIndex(prev => (prev + 1) % maxItems);
        }, 5000); // Change product every 5 seconds
        
        return () => clearInterval(interval);
    }, [featuredProducts]);

    return (
        <>
            {/* Hero Section */}
            <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0 bg-[#0d121c]">
                    <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none"></div>
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+CjxjaXJjbGUgY3g9IjEiIGN5PSIxIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+Cjwvc3ZnPg==')] [background-size:24px_24px] pointer-events-none"></div>
                </div>
                <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="flex flex-col gap-6 max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 w-fit backdrop-blur-sm">
                                <span className="flex h-2 w-2 rounded-full bg-primary"></span>
                                <span className="text-primary-blue text-xs font-bold text-blue-200">حلول كاشير متطورة</span>
                            </div>
                            <h1 className="text-4xl lg:text-6xl font-black text-white leading-[1.2]">
                                طور نشاطك التجاري مع{' '}
                                <span className="text-transparent bg-clip-text bg-gradient-to-l from-primary to-blue-300">
                                    أحدث أجهزة الكاشير
                                </span>
                            </h1>
                            <p className="text-lg text-gray-300 leading-relaxed font-light">
                                نوفر لك حلولاً متكاملة لنقاط البيع، طابعات الفواتير، وأجهزة الباركود.
                                <br className="hidden sm:block" />
                                أفضل الأسعار في السوق المصري مع ضمان حقيقي ودعم فني مستمر.
                            </p>
                            <div className="flex flex-wrap gap-4 pt-4">
                                <Link
                                    to="/shop"
                                    className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-xl text-base font-bold transition-all shadow-[0_0_20px_rgba(19,91,236,0.4)] hover:shadow-[0_0_30px_rgba(19,91,236,0.6)] hover:-translate-y-1"
                                >
                                    <span className="material-symbols-outlined">shopping_bag</span>
                                    <span>تسوق أجهزتك الآن</span>
                                </Link>
                                <Link
                                    to="/ai-builder"
                                    className="flex items-center justify-center gap-2 bg-[#1e293b]/60 hover:bg-[#1e293b] border border-gray-600 hover:border-primary/50 text-white px-8 py-4 rounded-xl text-base font-bold transition-all backdrop-blur-md group"
                                >
                                    <span>صمم كاشيرك بالذكاء الاصطناعي</span>
                                    <Sparkles className="w-5 h-5 text-purple-400 group-hover:text-purple-300 animate-pulse" />
                                </Link>
                            </div>
                            <div className="flex items-center gap-6 pt-8 border-t border-white/10 mt-4">
                                <div className="flex items-center gap-2 text-gray-400">
                                    <span className="material-symbols-outlined text-primary">verified</span>
                                    <span className="text-sm">وكيل معتمد</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-400">
                                    <span className="material-symbols-outlined text-primary">local_shipping</span>
                                    <span className="text-sm">شحن لكل مصر</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-400">
                                    <span className="material-symbols-outlined text-primary">build_circle</span>
                                    <span className="text-sm">صيانة وضمان</span>
                                </div>
                            </div>
                        </div>

                        {/* Hero Image Design Provided by User - Now Dynamic */}
                        <div className="relative hidden lg:block">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px]"></div>
                            
                            {isFeaturedLoading ? (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                                </div>
                            ) : featuredProducts && featuredProducts.length > 0 ? (
                                (() => {
                                    const topProduct = featuredProducts[currentHeroIndex] || featuredProducts[0];
                                    const imageUrl = topProduct.images.find(i => i.isPrimary)?.url || topProduct.images[0]?.url || '';
                                    const hasDiscount = !!topProduct.discountPrice;
                                    const price = parseFloat(topProduct.price);
                                    const discountPrice = hasDiscount ? parseFloat(topProduct.discountPrice as string) : price;
                                    const discountPercent = hasDiscount && price > 0 ? Math.round(((price - discountPrice) / price) * 100) : 0;
                                    
                                    return (
                                        <Link to={`/product/${topProduct.slug}`} className="block relative glass-card p-4 rounded-2xl border border-white/10 rotate-[-2deg] hover:rotate-0 transition-all duration-500 group">
                                            <div 
                                                className="w-full aspect-[4/3] bg-[#000000]/40 rounded-xl overflow-hidden group-hover:scale-[1.02] transition-transform duration-500" 
                                                style={{ 
                                                    backgroundImage: `url('${imageUrl}')`, 
                                                    backgroundSize: 'contain', 
                                                    backgroundRepeat: 'no-repeat',
                                                    backgroundPosition: 'center' 
                                                }}>
                                            </div>
                                            
                                            {/* Name / Price Toast */}
                                            <div className="absolute -top-4 -left-4 sm:-top-6 sm:-left-6 glass-panel px-4 py-3 rounded-xl flex flex-col items-start gap-1 shadow-[0_10px_40px_-10px_rgba(19,91,236,0.4)] border border-white/10 backdrop-blur-xl z-20 transition-transform group-hover:-translate-y-2">
                                                <p className="text-white font-bold text-sm max-w-[200px] truncate text-right w-full" dir="rtl" title={topProduct.name}>
                                                    {topProduct.name}
                                                </p>
                                                <div className="flex items-center flex-row-reverse justify-end gap-3 w-full" dir="ltr">
                                                    {hasDiscount && (
                                                        <div className="flex items-baseline gap-1 text-gray-400/80 line-through decoration-red-500/50">
                                                            <span className="text-xs">ج.م</span>
                                                            <span className="text-sm">{price.toLocaleString()}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex items-baseline gap-1 text-blue-400 font-black">
                                                        <span className="text-xs">ج.م</span>
                                                        <span className="text-lg">{discountPrice.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {(hasDiscount && discountPercent > 0) ? (
                                                <div className="absolute -bottom-6 -right-6 glass-panel p-4 rounded-xl flex items-center gap-3 shadow-xl animate-bounce" style={{ animationDuration: '3s' }}>
                                                    <div className="bg-green-500/20 p-2 rounded-full text-green-400">
                                                        <span className="material-symbols-outlined">percent</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-400">خصم خاص</p>
                                                        <p className="text-white font-bold">يصل إلى {discountPercent}٪</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="absolute -bottom-6 -right-6 glass-panel p-4 rounded-xl flex items-center gap-3 shadow-xl animate-pulse" style={{ animationDuration: '4s' }}>
                                                    <div className="bg-primary/20 p-2 rounded-full text-primary">
                                                        <span className="material-symbols-outlined">star</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-400">المنتج المميز</p>
                                                        <p className="text-white font-bold">الأكثر طلباً</p>
                                                    </div>
                                                </div>
                                            )}
                                        </Link>
                                    );
                                })()
                            ) : (
                                <div className="relative glass-card p-4 rounded-2xl border border-white/10 rotate-[-2deg] hover:rotate-0 transition-transform duration-500">
                                    <div 
                                        className="w-full aspect-[4/3] bg-[#000000]/40 rounded-xl overflow-hidden" 
                                        style={{ 
                                            backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBduotIF9U_ylRKn2foatbuirZdHROKFMaj_qD_PEp0yqxpYgyOV-KRGp04YAOnEba6OxnQydD_NN3j1ohn0vEi0fPDihFC73kgB8UDrIkA7SEPc2Oe7oXIx8fl8Hbi4vKlm16TM5aAtmq79H5w_KXt_Rq-eEouuxZu7V6RLxOJlaoHEgTIBe_-2j0Gq286u6uhdWf49VllOXIVUtpjGK6tjzLKW5-nHtqcw_-48Gxh8_7s2Ds-zsdWZF1Iu0NepkhwJ0NsamIB61Q')", 
                                            backgroundSize: 'cover', 
                                            backgroundPosition: 'center' 
                                        }}>
                                    </div>
                                    <div className="absolute -bottom-6 -right-6 glass-panel p-4 rounded-xl flex items-center gap-3 shadow-xl animate-bounce" style={{ animationDuration: '3s' }}>
                                        <div className="bg-green-500/20 p-2 rounded-full text-green-400">
                                            <span className="material-symbols-outlined">percent</span>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400">خصم خاص</p>
                                            <p className="text-white font-bold">يصل إلى ٢٠٪</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                icon: 'shield_moon',
                                title: 'ضمان محلي شامل',
                                desc: 'جميع أجهزتنا تأتي بضمان حقيقي لمدة عام مع توفر قطع الغيار الأصلية.',
                            },
                            {
                                icon: 'payments',
                                title: 'الدفع عند الاستلام',
                                desc: 'افحص المنتج بنفسك قبل الدفع. نوفر لك خدمة المعاينة عند الاستلام.',
                            },
                            {
                                icon: 'rocket_launch',
                                title: 'شحن سريع للمحافظات',
                                desc: 'توصيل خلال ٢٤ ساعة داخل القاهرة و ٤٨ ساعة لباقي المحافظات.',
                            },
                        ].map((feature) => (
                            <div
                                key={feature.title}
                                className="glass-card p-6 rounded-xl flex flex-col items-start gap-4 hover:border-primary/50 group"
                            >
                                <div className="w-12 h-12 rounded-lg bg-[#232f48] flex items-center justify-center group-hover:bg-primary transition-colors duration-300">
                                    <span className="material-symbols-outlined text-primary group-hover:text-white text-2xl">
                                        {feature.icon}
                                    </span>
                                </div>
                                <div>
                                    <h3 className="text-white text-lg font-bold mb-1">{feature.title}</h3>
                                    <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Categories Section */}
            <section className="py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">تسوق حسب الفئة</h2>
                            <p className="text-gray-400">تصفح المنتجات حسب احتياج نشاطك</p>
                        </div>
                        <Link
                            to="/shop"
                            className="hidden sm:flex items-center gap-1 text-primary hover:text-white transition-colors text-sm font-bold"
                        >
                            <span>عرض الكل</span>
                            <span className="material-symbols-outlined rtl:rotate-180 text-lg">arrow_right_alt</span>
                        </Link>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {categories?.filter((cat: any) => cat.isActive && cat.isFeatured).map((cat: any) => (
                            <Link
                                to={`/shop?categories=${cat.slug}`}
                                key={cat.id}
                                className="glass-card p-4 rounded-xl flex flex-col items-center justify-center gap-3 text-center group h-36"
                            >
                                {cat.image ? (
                                    <img src={cat.image} alt={cat.name} className="w-12 h-12 object-contain" />
                                ) : (
                                    <span className="material-symbols-outlined text-4xl text-gray-500 group-hover:text-primary transition-colors">
                                        {cat.icon || 'category'}
                                    </span>
                                )}
                                <span className="text-sm font-bold text-gray-300 group-hover:text-white">{cat.name}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Best Sellers Section */}
            <section className="py-16 bg-[#0d121c]/50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                            <span className="w-2 h-8 rounded-full bg-accent-red block"></span>
                            الأكثر مبيعاً هذا الشهر
                        </h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {isFeaturedLoading ? (
                            <div className="col-span-full flex justify-center py-12">
                                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            featuredProducts?.slice(0, 4).map((product) => (
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
                                    badge={product.isFeatured ? { type: 'new', text: 'مميز' } : undefined}
                                />
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* New Arrivals Section */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                            <span className="w-2 h-8 rounded-full bg-blue-500 block"></span>
                            وصل حديثاً
                        </h2>
                        <Link to="/shop?sort=newest" className="text-primary hover:underline text-sm font-bold">عرض الكل</Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {isNewLoading ? (
                            <div className="col-span-full gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                                {[1,2,3,4].map(n => <div key={n} className="h-80 bg-gray-800/50 rounded-xl animate-pulse"></div>)}
                            </div>
                        ) : (
                            newArrivals?.map((product) => (
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
                                    badge={{ type: 'new', text: 'جديد' }}
                                />
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* Offers Section */}
            <section className="py-16 bg-[#0d121c]/30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-10">
                        <h2 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                            <span className="w-2 h-8 rounded-full bg-green-500 block"></span>
                            أقوى العروض والخصومات
                        </h2>
                        <Link to="/shop" className="text-primary hover:underline text-sm font-bold">عرض الكل</Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {isOffersLoading ? (
                            <div className="col-span-full gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                                {[1,2,3,4].map(n => <div key={n} className="h-80 bg-gray-800/50 rounded-xl animate-pulse"></div>)}
                            </div>
                        ) : (
                            offerProducts?.map((product) => (
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
                                    badge={{ type: 'discount', text: 'خصم' }}
                                />
                            ))
                        )}
                    </div>
                </div>
            </section>

            {/* Bundle Promo Section */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative rounded-2xl overflow-hidden glass-panel border border-primary/20">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent"></div>
                        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between p-8 md:p-12 gap-8">
                            <div className="flex flex-col gap-4 text-center md:text-right items-center md:items-start max-w-xl">
                                <span className="bg-accent-red text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                    عرض خاص
                                </span>
                                <h2 className="text-3xl md:text-4xl font-bold text-white">تجهيز كامل للسوبر ماركت</h2>
                                <p className="text-gray-300 text-lg">
                                    جهاز كاشير تاتش + طابعة فواتير + قارئ باركود + درج نقدية + برنامج إدارة المخازن.
                                </p>
                                <div className="flex gap-4 mt-2">
                                    <span className="text-2xl font-bold text-white">١٨,٥٠٠ ج.م</span>
                                    <span className="text-xl text-gray-500 line-through">٢٢,٠٠٠ ج.م</span>
                                </div>
                                <Link
                                    to="/ai-builder"
                                    className="mt-4 bg-white text-primary-dark hover:bg-gray-100 px-8 py-3 rounded-lg font-bold transition-colors"
                                >
                                    صمم حزمتك الآن
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}

export default HomePage;
