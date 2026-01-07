import { useState } from 'react';
import { Link } from 'react-router-dom';

// Business types
const BUSINESS_TYPES = [
    { id: 'supermarket', icon: 'storefront', name: 'سوبر ماركت', color: 'text-amber-400' },
    { id: 'restaurant', icon: 'restaurant', name: 'مطعم / كافيه', color: 'text-purple-400' },
    { id: 'clothing', icon: 'checkroom', name: 'ملابس وأحذية', color: 'text-blue-400' },
    { id: 'pharmacy', icon: 'local_pharmacy', name: 'صيدلية', color: 'text-pink-400' },
];

const FEATURES = [
    { id: 'scanner', name: 'قارئ باركود', default: true },
    { id: 'printer', name: 'طابعة فواتير', default: true },
    { id: 'drawer', name: 'درج نقدية', default: false },
    { id: 'touch', name: 'شاشة لمس', default: true },
    { id: 'scale', name: 'ميزان باركود', default: false },
];

// Sample bundle result
const BUNDLE_RESULT = {
    name: 'حزمة السوبر ماركت المتكاملة',
    description: 'نظام كاشير كامل جاهز للتشغيل الفوري',
    originalPrice: 28500,
    price: 24200,
    matchScore: 98,
    products: [
        { name: 'شاشة لمس 15 بوصة Capacitive', desc: 'سريعة الاستجابة، مقاومة للسوائل والأتربة', price: 9500, imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBsk0P7H4thcEFU3j2-Z5bZbAV_rFQwPg5XMjBGCzXbXam3gzru2Sz_b_Cszro7q_gUGVYu2JtBua8bN4EpeGzq-3a4gEg34xJftGdxqGk14gzwM8QxIoIjDDpgpojUNf4FIrqQAjJnot855f68YgGKFcGRdwiyl-UQO5Jk32BkdWHeIgyQv0fxclBzKXJ11bymOJUwzi7kkcxLoKYjVnXJ0MsvNTF0q3X2w6nfZ0pEOCEzLcfQ6bps5DVnRBdDj6hGeyZ2x8tDmHA' },
        { name: 'ميزان باركود إلكتروني 30 كجم', desc: 'طباعة ملصقات فورية، دقة عالية', price: 8200, imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB53AfAdYSVNGB5oYFzfLzNBiSHgxDobxm6eMuU04gox73Dek_5_bgFD2-g2-TUNNxbCrFx1JCtNJvhz9iO_KPbN2II8puGy8ON-PORvD67gnwscRmerEECb2p-NXJOFEzfOPA8sJpnPiQFhadp1njp5toF1Qq5ohLGGkfnXkJatXjtagEez_cEq1lqrOX4D2iaW_TAGqaPHkEmyqpzSJUKNfsO4qGUczLnyJHPXvKwxhHh4WZhvJaCF6O2LUBXNSDJxHqndnh-Q38' },
        { name: 'قارئ باركود ليزر 2D لاسلكي', desc: 'يقرأ من الشاشات، مدى يصل لـ 50 متر', price: 2500, imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDyvfnrjHmwZCnKNXNKAPjHJfXLDSqkh3I_QO5_VqbPby1SbIEYg5mYF0Vmzgh7o0Pwbd8vyH42fZ-aSElu1f3B4JJ3UyGhxC6kFE9V09yBeLBrKn5K000Te71DNIJ4ock1C5-rV_0Rf7a6jNXWB9-9Nr2lB-o59GMX8SHnZHbHfdkfmP236JgAEVzhTrye8myK7a859M3NTFMB9t0Xs-ZhoXj-geVkFA2gvhWB3vMUYslwhCOHwto2N8Lz0njeSU9s2QK57RKQmv8' },
        { name: 'طابعة فواتير حرارية 80مم', desc: 'قص آلي، سرعة طباعة 260مم/ثانية', price: 4000, imageUrl: '' },
    ],
};

export function AIBundleBuilderPage() {
    const [businessType, setBusinessType] = useState('supermarket');
    const [budget, setBudget] = useState(25000);
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
        FEATURES.filter((f) => f.default).map((f) => f.id)
    );
    const [showResult, setShowResult] = useState(true);

    const toggleFeature = (featureId: string) => {
        setSelectedFeatures((prev) =>
            prev.includes(featureId) ? prev.filter((f) => f !== featureId) : [...prev, featureId]
        );
    };

    const handleGenerate = () => {
        setShowResult(true);
    };

    return (
        <div className="relative overflow-hidden flex flex-col flex-1">
            {/* Background Effects */}
            <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#8b5cf6]/10 rounded-full blur-[80px] translate-y-1/3 pointer-events-none"></div>

            {/* Header */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6 text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-[#8b5cf6]/20 to-primary/20 text-[#8b5cf6] border border-[#8b5cf6]/20 mb-4 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8b5cf6] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#8b5cf6]"></span>
                    </span>
                    الجيل الجديد من تجهيز المتاجر
                </span>
                <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
                    صمم كاشير نشاطك <span className="ai-gradient-text">بالذكاء الاصطناعي</span>
                </h1>
                <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                    أجب على 3 أسئلة بسيطة، وسيقوم نظامنا الذكي ببناء الحزمة المثالية لنشاطك التجاري وميزانيتك في ثوانٍ معدودة.
                </p>
            </div>

            {/* Main Content */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 w-full">
                <div className="grid lg:grid-cols-12 gap-8 items-start">
                    {/* Form Section */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                        <div className="glass-panel rounded-2xl p-6 md:p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-l from-[#8b5cf6] to-primary"></div>

                            <form className="flex flex-col gap-8" onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}>
                                {/* Step 1: Business Type */}
                                <div className="flex flex-col gap-4">
                                    <label className="text-white font-bold flex items-center gap-2">
                                        <span className="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs border border-primary/20">1</span>
                                        نوع النشاط التجاري
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {BUSINESS_TYPES.map((type) => (
                                            <label key={type.id} className="cursor-pointer group">
                                                <input
                                                    type="radio"
                                                    name="business_type"
                                                    value={type.id}
                                                    checked={businessType === type.id}
                                                    onChange={() => setBusinessType(type.id)}
                                                    className="peer sr-only"
                                                />
                                                <div className={`h-24 rounded-xl border border-white/10 bg-[#161b26]/50 hover:bg-[#161b26] flex flex-col items-center justify-center gap-2 transition-all group-hover:border-[#8b5cf6]/50 peer-checked:bg-[rgba(139,92,246,0.2)] peer-checked:border-[#8b5cf6] peer-checked:shadow-[0_0_15px_rgba(139,92,246,0.2)]`}>
                                                    <span className={`material-symbols-outlined text-3xl ${type.color} group-hover:scale-110 transition-transform`}>
                                                        {type.icon}
                                                    </span>
                                                    <span className="text-sm font-medium text-gray-300 group-hover:text-white">{type.name}</span>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <hr className="border-white/5" />

                                {/* Step 2: Budget */}
                                <div className="flex flex-col gap-4">
                                    <label className="text-white font-bold flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs border border-primary/20">2</span>
                                            الميزانية التقريبية
                                        </div>
                                        <span className="text-[#8b5cf6] text-sm font-bold dir-ltr">{budget.toLocaleString()} EGP</span>
                                    </label>
                                    <input
                                        type="range"
                                        min="5000"
                                        max="100000"
                                        step="5000"
                                        value={budget}
                                        onChange={(e) => setBudget(Number(e.target.value))}
                                        className="w-full h-2 bg-[#161b26] rounded-lg appearance-none cursor-pointer accent-[#8b5cf6]"
                                    />
                                    <div className="flex justify-between text-xs text-gray-500 font-medium px-1">
                                        <span>اقتصادي</span>
                                        <span>متوسط</span>
                                        <span>احترافي</span>
                                    </div>
                                </div>

                                <hr className="border-white/5" />

                                {/* Step 3: Features */}
                                <div className="flex flex-col gap-4">
                                    <label className="text-white font-bold flex items-center gap-2">
                                        <span className="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs border border-primary/20">3</span>
                                        الاحتياجات والمميزات
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {FEATURES.map((feature) => (
                                            <label key={feature.id} className="cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedFeatures.includes(feature.id)}
                                                    onChange={() => toggleFeature(feature.id)}
                                                    className="sr-only peer"
                                                />
                                                <div className="px-4 py-2 rounded-lg border border-white/10 bg-[#161b26]/50 text-gray-400 text-sm font-medium hover:bg-white/5 transition-colors peer-checked:bg-primary/20 peer-checked:border-primary peer-checked:text-white">
                                                    {feature.name}
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full mt-4 bg-gradient-to-r from-[#8b5cf6] to-primary hover:from-[#8b5cf6]/90 hover:to-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-[#8b5cf6]/25 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    <span className="material-symbols-outlined animate-pulse">auto_awesome</span>
                                    إنشاء الحزمة الذكية
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Result Section */}
                    {showResult && (
                        <div className="lg:col-span-7 space-y-6">
                            {/* AI Analysis */}
                            <div className="flex items-start gap-4 p-4 rounded-xl bg-[#8b5cf6]/5 border border-[#8b5cf6]/10">
                                <div className="size-10 rounded-full bg-[#8b5cf6]/10 flex items-center justify-center flex-shrink-0">
                                    <span className="material-symbols-outlined text-[#8b5cf6]">psychology</span>
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-sm mb-1">تحليل الذكاء الاصطناعي</h3>
                                    <p className="text-gray-400 text-xs leading-relaxed">
                                        بناءً على اختيارك لنشاط <span className="text-amber-400 font-bold">السوبر ماركت</span> وميزانية متوسطة، قمنا باختيار أجهزة تتحمل ضغط العمل العالي مع دقة في قراءة الباركود لضمان سرعة الكاشير. هذه الحزمة توفر لك <span className="text-emerald-400 font-bold">15%</span> مقارنة بشراء القطع منفردة.
                                    </p>
                                </div>
                            </div>

                            {/* Bundle Card */}
                            <div className="glass-panel rounded-2xl overflow-hidden border-[#8b5cf6]/30 ring-1 ring-[#8b5cf6]/20 shadow-2xl shadow-[#8b5cf6]/5">
                                <div className="bg-gradient-to-r from-[#8b5cf6]/20 to-primary/10 p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/20">الأكثر مبيعاً</span>
                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">تطابق {BUNDLE_RESULT.matchScore}%</span>
                                        </div>
                                        <h2 className="text-2xl font-bold text-white">{BUNDLE_RESULT.name}</h2>
                                        <p className="text-gray-400 text-sm">{BUNDLE_RESULT.description}</p>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-xs text-gray-400 line-through mb-0.5">{BUNDLE_RESULT.originalPrice.toLocaleString()} ج.م</p>
                                        <p className="text-3xl font-extrabold text-white leading-none">
                                            {BUNDLE_RESULT.price.toLocaleString()} <span className="text-sm font-normal text-gray-400">ج.م</span>
                                        </p>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <h3 className="text-gray-300 font-bold text-sm mb-4 flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-[18px]">inventory_2</span>
                                        محتويات الحزمة ({BUNDLE_RESULT.products.length} منتجات)
                                    </h3>
                                    <div className="space-y-3">
                                        {BUNDLE_RESULT.products.map((product, index) => (
                                            <div key={index} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-[#8b5cf6]/30 transition-colors group">
                                                <div className="size-16 rounded-lg bg-white p-1 flex-shrink-0 relative overflow-hidden flex items-center justify-center">
                                                    {product.imageUrl ? (
                                                        <img
                                                            alt={product.name}
                                                            className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                                                            src={product.imageUrl}
                                                        />
                                                    ) : (
                                                        <span className="material-symbols-outlined text-gray-800 text-3xl">print</span>
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-white font-bold text-sm">{product.name}</h4>
                                                    <p className="text-xs text-gray-400 mt-1">{product.desc}</p>
                                                </div>
                                                <div className="text-left hidden sm:block">
                                                    <span className="text-white font-bold text-sm">{product.price.toLocaleString()} ج.م</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="p-6 bg-[#161b26] border-t border-white/5 flex flex-col sm:flex-row gap-4">
                                    <Link
                                        to="/cart"
                                        className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-primary/25 flex items-center justify-center gap-2 transition-all group"
                                    >
                                        <span className="material-symbols-outlined group-hover:animate-bounce">shopping_cart_checkout</span>
                                        إضافة الحزمة للسلة
                                    </Link>
                                    <button className="sm:w-auto bg-white/5 hover:bg-white/10 text-white font-bold py-3.5 px-6 rounded-xl border border-white/10 flex items-center justify-center gap-2 transition-all">
                                        <span className="material-symbols-outlined">tune</span>
                                        تخصيص المنتجات
                                    </button>
                                </div>
                            </div>

                            {/* Features */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="flex flex-col items-center text-center gap-2 p-3 rounded-lg bg-white/5 border border-white/5">
                                    <span className="material-symbols-outlined text-emerald-400">verified_user</span>
                                    <span className="text-xs text-gray-300 font-medium">ضمان شامل لمدة عام</span>
                                </div>
                                <div className="flex flex-col items-center text-center gap-2 p-3 rounded-lg bg-white/5 border border-white/5">
                                    <span className="material-symbols-outlined text-blue-400">support_agent</span>
                                    <span className="text-xs text-gray-300 font-medium">دعم فني 24/7 مجاناً</span>
                                </div>
                                <div className="flex flex-col items-center text-center gap-2 p-3 rounded-lg bg-white/5 border border-white/5">
                                    <span className="material-symbols-outlined text-purple-400">rocket_launch</span>
                                    <span className="text-xs text-gray-300 font-medium">تركيب وتدريب مجاني</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AIBundleBuilderPage;
