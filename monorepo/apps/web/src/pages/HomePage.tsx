import { Link } from 'react-router-dom';
import { ProductCard } from '../components/products';

// Sample product data
const BEST_SELLERS = [
    {
        id: '1',
        name: 'طابعة إيصالات حرارية Xprinter Q800',
        brand: 'Xprinter',
        price: 1500,
        originalPrice: 1650,
        rating: 4,
        reviewCount: 24,
        imageUrl:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuDxxJ9tmTVPceVucCSIsPiqO8tUFn8kabL61HDi4Ov6m5QZpfBdnlViwjY2haLMYyLth5Bc-Gt3u1H9M99ogXqu4GxkbXAH9fctr-zP39eATS-uGKSiy1IhrD6f28hfM4HWC8Qt8whBF0BcM4pZnrBi9UfKu54xqmYWyaiJLFpNv3f5NjPz5GZdAEA3xKjGa1KVxfI9LgMJ3CU40RlCFDsJBVfKMKd3F9iWWNpwe1KbzwvNYTF2t_nyJSxCuuVIk5EZbRDYRizhV1o',
        badge: { type: 'discount' as const, text: 'خصم ١٠٪' },
    },
    {
        id: '2',
        name: 'قارئ باركود ثنائي الأبعاد 2D Sunmi',
        brand: 'Sunmi',
        price: 850,
        rating: 5,
        reviewCount: 15,
        imageUrl:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuBKDOjzgb-jtD5OnlEJUl5E6CgtjL-tH4hUqnjzgVfT-gENm5bi4NxRILh2Duszx5ZHczzPxxPemOpmq7u39awgNL0bSIW64FVYKTa9-QzwIdklJAgcViOHmO7NwSPcpuFp5Utd4YgyvM_SrzaYcyqGeLVEg1QZhBh8UQSq4gNyHNyL0V2aRhJFpaMaI76pcg7GtgVDcoK0u-PBT_GlWPJbSGG7eTtfUHojlQdrd9hjCESoRDzOdfO4epqfXqTU0bp_tb0_LLWxzEY',
    },
    {
        id: '3',
        name: 'درج نقدية ٥ خانات معدن صلب',
        brand: 'Generic',
        price: 950,
        rating: 4,
        reviewCount: 8,
        imageUrl:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuDU8YUXsa4aX9Rgz3AXNGkLVwNo6mya28J_m5z4aXxMlu1ndIj5hKGrVW2sRO3hB9yyEhpFOZeFAo-6DEalbvgLu3P_fHPLnZr9MGo9fuEeGcQbeOvz3QiREB_dg7Oj4fYY5NrsmCpAbI9A0F8FyNwFiQHTQXNVRVZWcSl9ocP4lkjx0GO4k2D-YVOjk_uzsN1aLjkf1Jd-1kkf1S9NhlfBZezXWoO713C_Zwx3ngse-MkpGN2jlbyG9iE_4pmduTlxXzsJGrTF_S8',
        badge: { type: 'new' as const, text: 'وصل حديثاً' },
    },
    {
        id: '4',
        name: 'كرتونة ورق حراري ٧.٩ (٥٠ بكرة)',
        brand: 'Generic',
        price: 1200,
        rating: 5,
        reviewCount: 42,
        imageUrl:
            'https://lh3.googleusercontent.com/aida-public/AB6AXuAePSWiHG5jOfDGouVCn_9cQnwDvm34Rd4RxGfw4Rt3qEsU8wfD32BxjJ-dBLPuIux8OKgYsfPpmIPDHtMfWj9JnsPsBhwieQ_rGSGh5BlLWA-maPhE364E_o4X0jVLeXUK4FQhiNldgW6a5xD_Yyr0zNFX4iTCyiglBx1p2vp42z8hKHB0aiOpsd4mjdfg9ML5d60bew7qIkeHfEbIDYqAxgmNWGxbxXpYb_XV3I_wIJ3-l4E23PIYLVx4Bx-Fi2xtVlHz8k9-rvQ',
    },
];

const CATEGORIES = [
    { icon: 'print', name: 'طابعات فواتير' },
    { icon: 'qr_code_scanner', name: 'قارئ باركود' },
    { icon: 'point_of_sale', name: 'أجهزة كاشير' },
    { icon: 'inbox', name: 'أدراج نقدية' },
    { icon: 'receipt_long', name: 'رولات ورق' },
    { icon: 'scale', name: 'موازين باركود' },
];

export function HomePage() {
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
                        {CATEGORIES.map((cat) => (
                            <Link
                                to={`/shop?category=${cat.name}`}
                                key={cat.name}
                                className="glass-card p-4 rounded-xl flex flex-col items-center justify-center gap-3 text-center group h-36"
                            >
                                <span className="material-symbols-outlined text-4xl text-gray-500 group-hover:text-primary transition-colors">
                                    {cat.icon}
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
                        {BEST_SELLERS.map((product) => (
                            <ProductCard key={product.id} {...product} />
                        ))}
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
