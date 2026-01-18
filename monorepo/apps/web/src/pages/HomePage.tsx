import { Link } from 'react-router-dom';
import { ProductCard } from '../components/products';

import { useFeaturedProducts, useCategories } from '../hooks/useProducts';

export function HomePage() {
    const { data: products, isLoading } = useFeaturedProducts();
    const { data: categories } = useCategories();
    return (
        <>
            {/* Hero Section */}
            <section className="relative min-h-[600px] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#101622] via-[#101622]/90 to-transparent z-10"></div>
                    <div
                        className="w-full h-full bg-cover bg-center"
                        style={{
                            backgroundImage:
                                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBSRA-08o641TnVWbQXvSqvffZMwpJspKh9TIjyteXogtTwZ4Z_TxkFR9r9nI7wFeUus9g0dw2wwDlGGH4-ZmZcccGEgchvQZvYF-2webfVkptarfsMczLYJFQ3pBM_2rI5Bp6BG66mcUctH4009pE3N0_ASO5g3lmdMVh_4yiBvdMTV0TE2_TjPvG4g_tPcMTkobIG2m_ugakztSkRu1gw6lrqBC52vrjEoAbsm7sSfMFGz2DeepbdRbwsSDHfFAGd3JE4szqrbX0')",
                        }}
                    ></div>
                </div>
                <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="flex flex-col gap-6 max-w-2xl">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 w-fit backdrop-blur-sm">
                                <span className="flex h-2 w-2 rounded-full bg-accent-red"></span>
                                <span className="text-blue-200 text-xs font-bold">عروض نهاية العام</span>
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
                                أفضل الأسعار في السوق المصري مع ضمان حقيقي ودعم فني.
                            </p>
                            <div className="flex flex-wrap gap-4 pt-4">
                                <Link
                                    to="/shop"
                                    className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white px-8 py-4 rounded-xl text-base font-bold transition-all shadow-[0_0_20px_rgba(19,91,236,0.4)] hover:shadow-[0_0_30px_rgba(19,91,236,0.6)] hover:-translate-y-1"
                                >
                                    <span className="material-symbols-outlined">shopping_bag</span>
                                    <span>تسوق العروض</span>
                                </Link>
                                <button className="flex items-center justify-center gap-2 bg-[#1e293b]/60 hover:bg-[#1e293b] border border-gray-600 text-white px-8 py-4 rounded-xl text-base font-bold transition-all backdrop-blur-md">
                                    <span>تواصل مع المبيعات</span>
                                    <span className="material-symbols-outlined rtl:rotate-180">arrow_right_alt</span>
                                </button>
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
                        {categories?.map((cat: any) => (
                            <Link
                                to={`/shop?categories=${cat.slug}`}
                                key={cat.id}
                                className="glass-card p-4 rounded-xl flex flex-col items-center justify-center gap-3 text-center group h-36"
                            >
                                <span className="material-symbols-outlined text-4xl text-gray-500 group-hover:text-primary transition-colors">
                                    {cat.icon || 'category'}
                                </span>
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
                        {isLoading ? (
                            <div className="col-span-full flex justify-center py-12">
                                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : (
                            products?.map((product) => (
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
