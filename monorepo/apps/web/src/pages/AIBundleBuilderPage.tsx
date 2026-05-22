import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCart } from '../context/CartContext';
import { SlidersHorizontal, Sparkles, Wand2, ShoppingCart, Check, ArrowRight, Search, X, Monitor, Smartphone, Cpu, ShieldCheck, Truck, CreditCard } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import SEOHead from '../components/SEO/SEOHead';
import { buildBreadcrumbSchema } from '../components/SEO/ProductSchema';

interface BundleProduct {
    productId: string;
    name: string;
    desc: string;
    price: number;
    imageUrl: string;
    category?: string;
}

interface BundleResult {
    name: string;
    description: string;
    price: number;
    originalPrice: number;
    savings: number;
    savingsPercentage: number;
    matchScore: number;
    products: BundleProduct[];
    exceedsBudget: boolean;
}

const BUSINESS_TYPES = [
    { id: 'supermarket', name: 'سوبر ماركت', icon: 'shopping_cart', color: 'text-emerald-500' },
    { id: 'restaurant', name: 'مطعم / كافيه', icon: 'restaurant', color: 'text-amber-500' },
    { id: 'clothing', name: 'ملابس وأحذية', icon: 'apparel', color: 'text-blue-500' },
    { id: 'pharmacy', name: 'صيدلية', icon: 'medical_services', color: 'text-rose-500' },
    { id: 'custom', name: 'نشاط آخر', icon: 'storefront', color: 'text-purple-500' },
];

const FEATURES = [
    { id: 'scanner', name: 'ماسح باركود' },
    { id: 'printer', name: 'طابعة فواتير' },
    { id: 'scale', name: 'ميزان إلكتروني' },
    { id: 'drawer', name: 'درج نقدية' },
    { id: 'touch', name: 'شاشة لمس' },
];

// Helper to safely check dynamic attributes inclusivity
export const checkAttr = (product: any, key: string, value: string) => {
    const attr = product?.dynamicAttributes?.[key];
    if (Array.isArray(attr)) return attr.includes(value);
    if (typeof attr === 'string') return attr.includes(value);
    return false;
};

// ------------------------------------------------------------------------------------------------
// Main Page
// ------------------------------------------------------------------------------------------------

export function AIBundleBuilderPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { addToCart } = useCart();

    const [businessType, setBusinessType] = useState(searchParams.get('type') || 'restaurant');
    const [customBusinessType, setCustomBusinessType] = useState('');
    const [budget, setBudget] = useState(parseInt(searchParams.get('budget') || '15000'));
    const [isCustomBudget, setIsCustomBudget] = useState(!!searchParams.get('budget'));
    const [customBudget, setCustomBudget] = useState<number | ''>(searchParams.get('budget') ? parseInt(searchParams.get('budget') as string) : 5000);
    const [osPreference, setOsPreference] = useState(searchParams.get('os') || 'any');
    
    const initialFeatures = searchParams.get('features') ? (searchParams.get('features') as string).split(',') : ['printer', 'touch'];
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>(initialFeatures);

    const [result, setResult] = useState<BundleResult | null>(null);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [isManualMode, setIsManualMode] = useState(false);

    const { data: settings } = useQuery({
        queryKey: ['settings'],
        queryFn: async () => {
            const { data } = await api.get('/settings');
            return data;
        }
    });

    const generateBundleMutation = useMutation({
        mutationFn: async () => {
            const finalBudget = isCustomBudget && customBudget ? Number(customBudget) : budget;
            // Always pass OS preference, even to AI Mode
            const { data } = await api.post('/ai-bundle/generate', {
                businessType: businessType === 'custom' ? customBusinessType : businessType,
                budget: finalBudget,
                selectedFeatures,
                osPreference
            });
            return data;
        },
        onSuccess: (data) => {
            setResult(data);
            setTimeout(() => {
                document.getElementById('bundle-result')?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        },
        onError: () => {
            toast.error('حدث خطأ أثناء إنشاء الحزمة. يرجى المحاولة مرة أخرى.');
            setHasGenerated(false);
        }
    });

    const toggleFeature = (id: string) => {
        setSelectedFeatures(prev =>
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        );
    };

    const isGenerating = generateBundleMutation.isPending;

    const handleGenerate = () => {
        setHasGenerated(true);
        setResult(null);
        generateBundleMutation.mutate();
    };

    useEffect(() => {
        if (searchParams.get('type') && searchParams.get('budget') && searchParams.get('features') && !hasGenerated) {
            handleGenerate();
        }
    }, [searchParams, hasGenerated]);

    const handleAddBundleToCart = () => {
        if (!result) return;
        result.products.forEach(product => {
            addToCart({
                id: product.productId,
                name: product.name,
                price: product.price,
                image: product.imageUrl || 'https://via.placeholder.com/150',
                quantity: 1,
            });
        });
        toast.success('تمت إضافة جميع منتجات الحزمة إلى السلة 👍', { position: 'bottom-center' });
        navigate('/cart');
    };

    if (settings && settings.aiEnabled === false) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
                <SEOHead title="منشئ الحزم الذكي" description="منشئ الحزم الذكي - مركز العامر" noindex />
                <div className="size-24 bg-white/5 rounded-full flex items-center justify-center mb-6">
                    <Wand2 className="size-10 text-gray-500" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">الخدمة غير متاحة حالياً</h1>
                <p className="text-gray-400 max-w-md">
                    خدمة منشئ الحزم الذكي متوقفة مؤقتاً للصيانة أو التحديث. يرجى المحاولة في وقت لاحق.
                </p>
                <button onClick={() => navigate('/')} className="mt-8 btn-primary">
                    العودة للرئيسية
                </button>
            </div>
        );
    }

    return (
        <div className="relative overflow-hidden flex flex-col flex-1 pb-12">
            <SEOHead title="منشئ الحزم الذكي" description="صمم حزمة أجهزة الكاشير المناسبة لمتجرك بمساعدة الذكاء الاصطناعي" canonical="/ai-builder" jsonLd={[buildBreadcrumbSchema([{ name: 'الرئيسية', url: '/' }, { name: 'منشئ الحزم الذكي', url: '/ai-builder' }])]} />
            <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#8b5cf6]/10 rounded-full blur-[80px] translate-y-1/3 pointer-events-none"></div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6 text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-[#8b5cf6]/20 to-primary/20 text-[#8b5cf6] border border-[#8b5cf6]/20 mb-4 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                    <Wand2 className="w-3 h-3 animate-pulse" />
                    الجيل الجديد من تجهيز المتاجر
                </span>
                <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
                    صمم كاشير نشاطك <span className="ai-gradient-text">الاحترافي</span>
                </h1>
                <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                    المنصة الاستشارية الأولى لرواد الأعمال، تساعدك على اختيار العتاد المناسب لمشروعك خطوة بخطوة أو عن طريق الذكاء الاصطناعي.
                </p>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 w-full">
                <div className="flex justify-center mb-8 gap-4">
                    <button
                        onClick={() => setIsManualMode(true)}
                        className={`px-6 py-2.5 rounded-full font-bold transition-all flex items-center gap-2 ${isManualMode ? 'bg-[#8b5cf6] text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        المنشئ الاستشاري (يدوي)
                    </button>
                    <button
                        onClick={() => setIsManualMode(false)}
                        className={`px-6 py-2.5 rounded-full font-bold transition-all flex items-center gap-2 ${!isManualMode ? 'bg-[#8b5cf6] text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                    >
                        <Sparkles className="w-4 h-4" />
                        المنشئ الذكي
                    </button>
                </div>

                {!isManualMode ? (
                    <div className="grid lg:grid-cols-12 gap-8 items-start">
                        {/* Form Section */}
                        <div className="lg:col-span-5 flex flex-col gap-6">
                            <div className="glass-panel rounded-2xl p-6 md:p-8 relative overflow-hidden">
                                <form className="flex flex-col gap-8" onSubmit={(e) => { e.preventDefault(); handleGenerate(); }}>
                                    
                                    {/* AI OS Preference - MOVED TO TOP */}
                                    <div className="flex flex-col gap-4">
                                        <label className="text-white font-bold flex items-center gap-2">
                                            <span className="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs border border-primary/20">1</span>
                                            نظام التشغيل المطلوب
                                        </label>
                                        <div className="flex flex-col gap-2">
                                            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-white/10 bg-[#161b26]/50 hover:bg-white/5 transition-colors">
                                                <input type="radio" checked={osPreference === 'any'} onChange={() => setOsPreference('any')} className="accent-[#8b5cf6] w-4 h-4" />
                                                <span className="text-gray-300 text-sm font-medium flex items-center gap-2">
                                                    <Sparkles className="w-4 h-4 text-[#8b5cf6]" /> اختار أفضل نظام للنشاط الخاص بي
                                                </span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-white/10 bg-[#161b26]/50 hover:bg-white/5 transition-colors">
                                                <input type="radio" checked={osPreference === 'android'} onChange={() => setOsPreference('android')} className="accent-emerald-500 w-4 h-4" />
                                                <span className="text-gray-300 text-sm font-medium flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-emerald-500 text-lg">android</span> أندرويد (متنقل / مرن)
                                                </span>
                                            </label>
                                            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-white/10 bg-[#161b26]/50 hover:bg-white/5 transition-colors">
                                                <input type="radio" checked={osPreference === 'windows'} onChange={() => setOsPreference('windows')} className="accent-blue-500 w-4 h-4" />
                                                <span className="text-gray-300 text-sm font-medium flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-blue-500 text-lg">desktop_windows</span> ويندوز (ثابت / قوي)
                                                </span>
                                            </label>
                                        </div>
                                    </div>

                                    <hr className="border-white/5" />

                                    {/* Step 2: Business Type */}
                                    <div className="flex flex-col gap-4">
                                        <label className="text-white font-bold flex items-center gap-2">
                                            <span className="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs border border-primary/20">2</span>
                                            نوع النشاط التجاري
                                        </label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {BUSINESS_TYPES.map((type) => (
                                                <label key={type.id} className="cursor-pointer group relative">
                                                    <input
                                                        type="radio"
                                                        name="business_type"
                                                        value={type.id}
                                                        checked={businessType === type.id}
                                                        onChange={() => setBusinessType(type.id)}
                                                        className="peer sr-only"
                                                    />
                                                    <div className={`h-28 rounded-xl border border-white/10 bg-[#161b26]/50 hover:bg-[#161b26] flex flex-col items-center justify-center gap-3 transition-all group-hover:border-[#8b5cf6]/50 peer-checked:bg-[rgba(139,92,246,0.2)] peer-checked:border-[#8b5cf6] peer-checked:shadow-[0_0_15px_rgba(139,92,246,0.2)]`}>
                                                        <span className={`material-symbols-outlined text-4xl ${type.color} group-hover:scale-110 transition-transform`}>
                                                            {type.icon}
                                                        </span>
                                                        <span className="text-sm font-medium text-gray-300 group-hover:text-white text-center px-2">{type.name}</span>
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                        {businessType === 'custom' && (
                                            <div className="mt-2 animate-fadeIn">
                                                <input type="text" value={customBusinessType} onChange={(e) => setCustomBusinessType(e.target.value)} placeholder="مثال: ورشة سيارات، مكتبة، محل زهور..." className="w-full bg-[#161b26] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors text-sm"/>
                                            </div>
                                        )}
                                    </div>

                                    <hr className="border-white/5" />

                                    {/* Budget */}
                                    <div className="flex flex-col gap-4">
                                        <label className="text-white font-bold flex items-center gap-2">
                                            <span className="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs border border-primary/20">3</span>
                                            الميزانية التقريبية
                                        </label>
                                        <div className="bg-[#161b26]/50 rounded-xl p-4 border border-white/5">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                                <div className="flex gap-4 items-center">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input type="radio" checked={!isCustomBudget} onChange={() => setIsCustomBudget(false)} className="accent-[#8b5cf6]" />
                                                        <span className="text-gray-300 text-xs">ميزانية محددة</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input type="radio" checked={isCustomBudget} onChange={() => setIsCustomBudget(true)} className="accent-[#8b5cf6]" />
                                                        <span className="text-gray-300 text-xs">مبلغ مخصص</span>
                                                    </label>
                                                </div>
                                                <div className="text-primary font-bold dir-ltr flex items-center justify-end gap-1">
                                                    <span className="text-lg">{(isCustomBudget && customBudget ? Number(customBudget) : budget).toLocaleString()}</span>
                                                    <span className="text-[10px] text-gray-500">EGP</span>
                                                </div>
                                            </div>

                                            {!isCustomBudget ? (
                                                <>
                                                    <input type="range" min="5000" max="100000" step="5000" value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#8b5cf6]"/>
                                                    <div className="flex justify-between text-[10px] text-gray-500 font-medium px-1 mt-2">
                                                        <span>اقتصادي (5k)</span>
                                                        <span>متوسط (50k)</span>
                                                        <span>احترافي (100k)</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="relative">
                                                    <input type="number" value={customBudget} onChange={(e) => setCustomBudget(e.target.value === '' ? '' : Number(e.target.value))} placeholder="أدخل الميزانية (جنية مصري)" className="w-full bg-[#161b26] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors text-left dir-ltr text-sm" />
                                                    <span className="absolute right-3 top-2.5 text-gray-500 text-xs">EGP</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <hr className="border-white/5" />

                                    {/* Features */}
                                    <div className="flex flex-col gap-4">
                                        <label className="text-white font-bold flex items-center gap-2">
                                            <span className="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs border border-primary/20">4</span>
                                            الاحتياجات الإضافية
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {FEATURES.map((feature) => (
                                                <label key={feature.id} className="cursor-pointer">
                                                    <input type="checkbox" checked={selectedFeatures.includes(feature.id)} onChange={() => toggleFeature(feature.id)} className="sr-only peer" />
                                                    <div className="px-4 py-1.5 rounded-lg border border-white/10 bg-[#161b26]/50 text-gray-400 text-xs font-medium hover:bg-white/5 transition-colors peer-checked:bg-primary/20 peer-checked:border-primary peer-checked:text-white">
                                                        {feature.name}
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <button type="submit" disabled={isGenerating} className="w-full mt-4 bg-gradient-to-r from-[#8b5cf6] to-primary hover:from-[#8b5cf6]/90 hover:to-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-[#8b5cf6]/25 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">
                                        {isGenerating ? (
                                            <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div><span>جاري التحليل...</span></>
                                        ) : (
                                            <><Sparkles className="w-5 h-5 animate-pulse" /><span>بناء الحزمة الذكية</span></>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* AI Builder Result UI */}
                        <div className="lg:col-span-7">
                            {!hasGenerated ? (
                                <div className="h-full flex flex-col items-center justify-center glass-panel rounded-2xl p-12 border-dashed border-white/10 text-center space-y-4">
                                    <div className="size-20 bg-primary/10 rounded-full flex items-center justify-center">
                                        <Wand2 className="size-10 text-primary/40" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white">جاهز لتجهيز نشاطك؟</h3>
                                    <p className="text-gray-400 max-w-sm">اختر نوع نشاطك وميزانيتك على اليمين وسنقوم ببناء النظام المثالي لك في ثوانٍ.</p>
                                </div>
                            ) : result ? (
                                <div id="bundle-result" className="space-y-6 animate-fadeIn">
                                    <div className={`flex items-start gap-4 p-4 rounded-xl border ${result.exceedsBudget ? 'bg-amber-500/10 border-amber-500/20' : 'bg-[#8b5cf6]/5- border border-[#8b5cf6]/10'}`}>
                                        <div className={`size-10 rounded-full flex items-center justify-center flex-shrink-0 ${result.exceedsBudget ? 'bg-amber-500/10' : 'bg-[#8b5cf6]/10'}`}>
                                            <span className={`material-symbols-outlined ${result.exceedsBudget ? 'text-amber-500' : 'text-[#8b5cf6]'}`}>
                                                {result.exceedsBudget ? 'warning' : 'psychology'}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className={`font-bold text-sm mb-1 ${result.exceedsBudget ? 'text-amber-500' : 'text-white'}`}>
                                                {result.exceedsBudget ? 'تنبيه الميزانية' : 'تحليل الذكاء الاصطناعي'}
                                            </h3>
                                            <p className="text-gray-400 text-xs leading-relaxed">
                                                {result.exceedsBudget
                                                    ? 'بناءً على متطلباتك ونوع نشاطك، تتجاوز هذه الحزمة الميزانية المقترحة للحصول على الحد الأدنى من الجودة والمواصفات المطلوبة.'
                                                    : `بناءً على اختيارك لنشاط ${BUSINESS_TYPES.find(t => t.id === businessType)?.name || 'تجاري'} وميزانية ${(isCustomBudget && customBudget ? Number(customBudget) : budget).toLocaleString()}، قمنا باختيار الحزمة الأمثل.`
                                                }
                                                {!result.exceedsBudget && (
                                                    <> هذه الحزمة توفر لك <span className="text-emerald-400 font-bold">15%</span> مقارنة بشراء القطع منفردة.</>
                                                )}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="glass-panel rounded-2xl overflow-hidden border-[#8b5cf6]/30 ring-1 ring-[#8b5cf6]/20 shadow-2xl shadow-[#8b5cf6]/5">
                                        <div className="bg-gradient-to-r from-[#8b5cf6]/20 to-primary/10 p-6 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/20">الأكثر مبيعاً</span>
                                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">تطابق {result.matchScore}%</span>
                                                </div>
                                                <h2 className="text-2xl font-bold text-white">{result.name}</h2>
                                                <p className="text-gray-400 text-sm">{result.description}</p>
                                            </div>
                                            <div className="text-left">
                                                <p className="text-xs text-gray-400 line-through mb-0.5">{result.originalPrice.toLocaleString()} ج.م</p>
                                                <p className="text-3xl font-extrabold text-white leading-none">
                                                    {result.price.toLocaleString()} <span className="text-sm font-normal text-gray-400">ج.م</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="p-6">
                                            <h3 className="text-gray-300 font-bold text-sm mb-4 flex items-center gap-2">
                                                <span className="material-symbols-outlined text-primary text-[18px]">inventory_2</span>
                                                محتويات الحزمة ({result.products.length} منتجات)
                                            </h3>
                                            <div className="space-y-3">
                                                {result.products.map((product, index) => (
                                                    <div key={index} className="flex items-center gap-4 p-3 rounded-xl bg-white/5 border border-white/5 hover:border-[#8b5cf6]/30 transition-colors group">
                                                        <div className="size-16 rounded-lg bg-white p-1 flex-shrink-0 relative overflow-hidden flex items-center justify-center">
                                                            {product.imageUrl ? (
                                                                <img alt={product.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" src={product.imageUrl} />
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
                                            <button onClick={handleAddBundleToCart} className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-primary/25 flex items-center justify-center gap-2 transition-all group">
                                                <ShoppingCart className="w-5 h-5 group-hover:animate-bounce" /> إضافة الحزمة للسلة
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                ) : (
                    <CascadingBuilder />
                )}
            </div>
        </div>
    );
}

// ------------------------------------------------------------------------------------------------
// TOP-DOWN CASCADING BUILDER
// ------------------------------------------------------------------------------------------------

type PlatformChoice = 'android' | 'windows' | 'skip' | null;

function CascadingBuilder() {
    const { addToCart } = useCart();
    const navigate = useNavigate();

    const [platformChoice, setPlatformChoice] = useState<PlatformChoice>(null);

    // Map UI rows to selections
    const [selectedItems, setSelectedItems] = useState<Record<string, any>>({});
    const [currentRowIndex, setCurrentRowIndex] = useState(0);

    // Quick View Modal State
    const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);

    const handleSelect = (rowId: string, item: any, rowIndex: number) => {
        const nextState = { ...selectedItems, [rowId]: item };
        setSelectedItems(nextState);
        if (rowIndex >= currentRowIndex) {
            setCurrentRowIndex(rowIndex + 1);
        }
    };

    const handleSkip = (rowId: string, rowIndex: number) => {
        const nextState = { ...selectedItems };
        delete nextState[rowId];
        setSelectedItems(nextState);
        if (rowIndex >= currentRowIndex) {
            setCurrentRowIndex(rowIndex + 1);
        }
    };

    // --- Smart Component Deductions ---
    // If the selected Main Device has a built-in printer
    const isMainDevice2In1 = checkAttr(selectedItems['device'], 'طابعة مدمجة', 'نعم');
    const mainDeviceHasScanner = checkAttr(selectedItems['device'], 'قارئ باركود مدمج', 'نعم');
    const receiptPrinterIs2In1 = checkAttr(selectedItems['receipt-printer'], 'نوع الطباعة', 'باركود');

    // Defines the cascading logic sequentially
    const ROWS = [
        { id: 'device', title: '1. الجهاز الرئيسي', category: ['pos-systems', 'handheld-pos'], desc: 'شاشات اللمس والأجهزة المحمولة.', 
          filter: (p: any) => platformChoice === 'skip' ? true : checkAttr(p, 'نظام التشغيل', platformChoice === 'android' ? 'Android' : 'Windows') 
        },
        { id: 'receipt-printer', title: '2. طابعة الفواتير', category: 'printers', filter: (p: any) => checkAttr(p, 'نوع الطباعة', 'فواتير'), 
          desc: 'لطباعة إيصالات العملاء.',
          smartDeduction: isMainDevice2In1 ? '✅ بطاقة الكاشير الرئيسية تحتوي على طابعة مدمجة - نوصي بتخطي هذه الخطوة' : null
        },
        { id: 'barcode-printer', title: '3. طابعة الباركود (ليبل)', category: 'printers', filter: (p: any) => checkAttr(p, 'نوع الطباعة', 'باركود'), 
          desc: 'لطباعة ملصقات الرفوف والمنتجات.',
          smartDeduction: receiptPrinterIs2In1 ? '✅ طابعة الفواتير التي اخترتها تدعم الباركود معاً - نوصي بتخطي هذه الخطوة' : null
        },
        { id: 'scanner', title: '4. قارئ الباركود', category: 'barcode-scanners', 
          desc: 'لتسريع عملية البيع.',
          smartDeduction: mainDeviceHasScanner ? '✅ جهازك الرئيسي يحتوي على قارئ باركود مدمج - يمكنك تخطي هذه الخطوة' : null
        },
        { id: 'drawer', title: '5. درج النقدية', category: 'cash-drawers', desc: 'لحفظ الأوراق النقدية بأمان.' },
        { id: 'consumables', title: '6. المستهلكات والمستلزمات', category: ['thermal-paper', 'barcode-labels'], filter: (p: any) => {
            const needReceipt = !!selectedItems['receipt-printer'] || isMainDevice2In1;
            const needBarcode = !!selectedItems['barcode-printer'] || receiptPrinterIs2In1;
            if (p.category.slug === 'thermal-paper') return needReceipt;
            if (p.category.slug === 'barcode-labels') return needBarcode;
            return false;
        }, desc: 'بكر الفواتير والملصقات المتوافقة مع جهازك.' }
    ];

    const totalManualPrice = Object.values(selectedItems).reduce((sum, item) => sum + (item?.discountPrice ? parseFloat(item.discountPrice) : parseFloat(item?.price || 0)), 0);

    const handleAddToCart = () => {
        Object.values(selectedItems).forEach(item => {
            if (!item) return;
            addToCart({
                id: item.id,
                name: item.name,
                price: item.discountPrice ? parseFloat(item.discountPrice) : parseFloat(item.price),
                image: item.images?.[0]?.url || 'https://via.placeholder.com/150',
                quantity: 1
            });
        });
        toast.success('تمت إضافة جميع المنتجات للسلة');
        navigate('/cart');
    };

    return (
        <div className="flex flex-col gap-6 animate-fadeIn pb-32">
            
            <AnimatePresence mode="wait">
                {!platformChoice ? (
                    // --------------------------------------------------------------------------------
                    // PHASE 1: The Foundation Step (Platform First UI)
                    // --------------------------------------------------------------------------------
                    <motion.div
                        key="foundation"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -30 }}
                        className="max-w-5xl mx-auto w-full flex flex-col gap-8 items-center pt-8"
                    >
                        <div className="text-center w-full">
                            <span className="px-3 py-1 bg-white/5 border border-white/10 text-gray-300 rounded-full text-xs font-bold mb-4 inline-block tracking-widest uppercase">الخطوة الأساسية</span>
                            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">حدد نظام المؤسسة</h2>
                            <p className="text-gray-400 max-w-lg mx-auto">سيقوم النظام الاستشاري بفلترة جميع الأجهزة والإكسسوارات لتتوافق حصرياً مع نظام التشغيل الذي ستختاره لضمان أعلى أداء وكفاءة تشغيلية.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                            {/* Android Platform */}
                            <button
                                onClick={() => setPlatformChoice('android')}
                                className="group relative bg-[#161b26] border-2 border-transparent hover:border-emerald-500/50 rounded-3xl p-8 hover:-translate-y-2 transition-all duration-300 overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -z-10 group-hover:bg-emerald-500/20 transition-colors"></div>
                                <Smartphone className="w-16 h-16 text-emerald-500 mb-6 mx-auto group-hover:scale-110 transition-transform duration-500" />
                                <h3 className="text-2xl font-bold text-white mb-2">نظام Android</h3>
                                <p className="text-gray-400 text-sm leading-relaxed mb-6">مرن، محمول، مبيعات أسرع، يتوافق بسلاسة مع الأجهزة المدمجة.</p>
                                <div className="bg-emerald-500/10 text-emerald-400 font-bold py-2 px-4 rounded-xl text-sm border border-emerald-500/20">اختيار كقاعدة أساسية</div>
                            </button>

                            {/* Windows Platform */}
                            <button
                                onClick={() => setPlatformChoice('windows')}
                                className="group relative bg-[#161b26] border-2 border-transparent hover:border-blue-500/50 rounded-3xl p-8 hover:-translate-y-2 transition-all duration-300 overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -z-10 group-hover:bg-blue-500/20 transition-colors"></div>
                                <Monitor className="w-16 h-16 text-blue-500 mb-6 mx-auto group-hover:scale-110 transition-transform duration-500" />
                                <h3 className="text-2xl font-bold text-white mb-2">نظام Windows</h3>
                                <p className="text-gray-400 text-sm leading-relaxed mb-6">قوة معالجة أعلى، شاشات أكبر، وموثوقية في المشاريع الضخمة.</p>
                                <div className="bg-blue-500/10 text-blue-400 font-bold py-2 px-4 rounded-xl text-sm border border-blue-500/20">اختيار كقاعدة أساسية</div>
                            </button>

                            {/* Peripherals Only / Skip */}
                            <button
                                onClick={() => setPlatformChoice('skip')}
                                className="group relative bg-[#161b26] border-2 border-transparent hover:border-white/20 rounded-3xl p-8 hover:-translate-y-2 transition-all duration-300 overflow-hidden opacity-70 hover:opacity-100"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -z-10 group-hover:bg-white/10 transition-colors"></div>
                                <div className="flex gap-2 justify-center mb-6">
                                    <span className="material-symbols-outlined text-4xl text-gray-400 group-hover:text-white transition-colors">print</span>
                                    <span className="material-symbols-outlined text-4xl text-gray-400 group-hover:text-white transition-colors mt-2">qr_code_scanner</span>
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">لدي نظام مسبقاً</h3>
                                <p className="text-gray-400 text-sm leading-relaxed mb-6">تخطي خطوة الجهاز الرئيسي وانتقل مباشرة لاختيار الإكسسوارات والطابعات.</p>
                                <div className="bg-white/5 text-gray-300 font-bold py-2 px-4 rounded-xl text-sm border border-white/10 group-hover:bg-white/10 transition-colors">الدخول للملحقات فقط</div>
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    // --------------------------------------------------------------------------------
                    // PHASE 2: Cascading Rows (Pre-filtered)
                    // --------------------------------------------------------------------------------
                    <motion.div
                        key="cascading"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-6xl mx-auto w-full flex flex-col gap-6"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-2xl font-extrabold text-white">متوافق مع: <span className="text-primary capitalize">{platformChoice === 'skip' ? 'تحديد حر' : platformChoice}</span></h2>
                            <button onClick={() => setPlatformChoice(null)} className="text-sm font-bold text-gray-400 hover:text-white underline">تغيير النظام</button>
                        </div>

                        {ROWS.map((row, index) => {
                            if (index > currentRowIndex) return null; // Hidden cascading

                            // If user picked 'skip' for platform, auto-skip the first row (Devices)
                            if (platformChoice === 'skip' && row.id === 'device') {
                                if (currentRowIndex === 0) setCurrentRowIndex(1); // Auto progress hook
                                return null;
                            }

                            const isSelected = !!selectedItems[row.id];
                            const isSkipped = currentRowIndex > index && !selectedItems[row.id];
                            const hasSmartDeduction = !!row.smartDeduction;

                            return (
                                <motion.div
                                    key={row.id}
                                    initial={{ opacity: 0, y: 50 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                    className={`w-full glass-panel rounded-2xl overflow-hidden border ${hasSmartDeduction ? 'border-emerald-500/50 ring-1 ring-emerald-500/20' : 'border-white/5'}`}
                                >
                                    <div className={`p-5 flex items-center justify-between border-b ${currentRowIndex === index ? 'border-primary/30 bg-primary/5' : 'border-white/5 bg-white/5'}`}>
                                        <div>
                                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                                {row.title}
                                                {isSelected && <Check className="text-primary size-5" />}
                                                {isSkipped && <span className="text-gray-500 font-normal text-sm ml-2">(تم التخطي)</span>}
                                            </h3>
                                            <p className="text-sm text-gray-400 mt-1">{row.desc}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Smart Deduction Banner Highlight */}
                                    {hasSmartDeduction && !isSelected && !isSkipped && (
                                        <div className="bg-emerald-500/10 px-5 py-3 border-b border-emerald-500/20 flex items-center gap-3">
                                            <span className="flex-1 text-emerald-400 font-bold text-sm">{row.smartDeduction}</span>
                                        </div>
                                    )}

                                    <div className="p-6 bg-[#111827]/30">
                                        <RowContent
                                            categoryId={row.category}
                                            filterFn={row.filter}
                                            selectedItem={selectedItems[row.id]}
                                            onSelect={(item: any) => handleSelect(row.id, item, index)}
                                            onSkip={() => handleSkip(row.id, index)}
                                            isSkipped={isSkipped}
                                            smartDeductionActive={hasSmartDeduction}
                                            onQuickView={(p: any) => setQuickViewProduct(p)}
                                        />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Sticky Summary Footer */}
            {platformChoice && (
                <div className="fixed bottom-0 left-0 right-0 z-40 p-4 transform translate-y-0 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] bg-[#0f1219]/90 backdrop-blur-xl border-t border-white/10">
                    <div className="max-w-6xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <div className="flex flex-col">
                                <span className="text-gray-400 flex items-center gap-2 text-sm font-medium">إجمالي التكلفة</span>
                                <span className="text-3xl font-extrabold text-white">{totalManualPrice.toLocaleString()} <span className="text-sm text-primary">EGP</span></span>
                            </div>
                            <div className="hidden md:flex -space-x-3 rtl:space-x-reverse min-w-[80px]">
                                {Object.values(selectedItems).slice(0, 5).map((item, i) => (
                                    item && <div key={i} className="size-12 rounded-full border-2 border-[#1a1f2e] bg-white p-1 overflow-hidden shadow-lg">
                                        <img src={item.images?.[0]?.url || 'https://via.placeholder.com/50'} alt={item.name || 'منتج'} className="w-full h-full object-contain" />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleAddToCart}
                                disabled={Object.keys(selectedItems).length === 0}
                                className="bg-primary hover:bg-primary-dark text-white font-bold px-8 py-3.5 rounded-xl shadow-[0_0_20px_rgba(var(--color-primary),0.4)] disabled:opacity-50 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                            >
                                <ShoppingCart className="w-5 h-5" />
                                إضافة الحزمة للسلة
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick View Modal (Phase 3) */}
            <AnimatePresence>
                {quickViewProduct && (
                    <QuickViewModal 
                        product={quickViewProduct} 
                        onClose={() => setQuickViewProduct(null)} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// ------------------------------------------------------------------------------------------------
// ROW CONTENT (Cards Rendered Here)
// ------------------------------------------------------------------------------------------------

function RowContent({ categoryId, filterFn, selectedItem, onSelect, onSkip, isSkipped, smartDeductionActive, onQuickView }: any) {
    const { data, isLoading } = useProducts({ categories: categoryId });

    if (isLoading) {
        return (
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scroll">
                {Array(4).fill(0).map((_, i) => (
                    <div key={i} className="w-[280px] h-[350px] flex-shrink-0 bg-white/5 rounded-2xl animate-pulse" />
                ))}
            </div>
        );
    }

    let products = data?.data || [];
    if (filterFn) {
        products = products.filter(filterFn);
    }

    // Extract useful badges from JSONB for the smart cards
    const getBadges = (product: any) => {
        const badges: { icon: string; text: string }[] = [];
        const attrs = product.dynamicAttributes;
        if (!attrs) return badges;
        
        if (checkAttr(product, 'الاتصال', 'Bluetooth')) badges.push({ icon: 'bluetooth', text: 'بلوتوث' });
        else if (checkAttr(product, 'الاتصال', 'USB')) badges.push({ icon: 'usb', text: 'USB' });
        else if (checkAttr(product, 'الاتصال', 'Wi-Fi')) badges.push({ icon: 'wifi', text: 'Wi-Fi' });
        
        if (attrs['نوع الطباعة'] && Array.isArray(attrs['نوع الطباعة']) && attrs['نوع الطباعة'].length > 1) {
            badges.push({ icon: 'integration_instructions', text: 'طابعة 2 في 1' });
        }

        if (attrs['عرض الورق']) badges.push({ icon: 'straighten', text: attrs['عرض الورق'] });
        if (attrs['مقاس الشاشة']) badges.push({ icon: 'monitor', text: attrs['مقاس الشاشة'] });

        return badges.slice(0, 2); // Max 2 badges for card UI
    };

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 pt-2 snap-x hide-scroll">
            {/* The SKIP Card */}
            <div
                onClick={onSkip}
                className={`w-[260px] flex-shrink-0 snap-start rounded-2xl border-2 flex flex-col items-center justify-center p-6 cursor-pointer transition-all group relative overflow-hidden ${!selectedItem && isSkipped ? 'border-primary bg-primary/10' : 'border-dashed border-gray-600 bg-transparent hover:border-gray-400'} ${smartDeductionActive ? 'border-emerald-500 bg-emerald-500/10 hover:border-emerald-400' : ''}`}
            >
                {smartDeductionActive && (
                    <div className="absolute inset-0 bg-emerald-500/10 animate-pulse rounded-2xl pointer-events-none"></div>
                )}
                <div className={`size-16 rounded-full flex items-center justify-center mb-4 transition-all z-10 ${(!selectedItem && isSkipped) || smartDeductionActive ? 'bg-primary text-white scale-110' : 'bg-gray-800 text-gray-400 group-hover:text-white'} ${smartDeductionActive ? 'bg-emerald-500 text-white' : ''}`}>
                    <ArrowRight className="w-8 h-8" />
                </div>
                <h4 className={`font-bold text-lg mb-2 z-10 text-center ${!selectedItem && isSkipped ? 'text-white' : 'text-gray-400 group-hover:text-white'} ${smartDeductionActive ? 'text-emerald-400' : ''}`}>تخطي هذه الخطوة</h4>
                <p className={`text-xs text-center z-10 ${smartDeductionActive ? 'text-emerald-500/70 font-bold' : 'text-gray-500'}`}>{smartDeductionActive ? 'يوصى بالتخطي لتجنب التكرار' : 'لدي هذا المنتج بالفعل أو لا أحتاجه الآن.'}</p>
            </div>

            {/* Smart Product Cards */}
            {products.map((product) => {
                const isSelected = selectedItem?.id === product.id;
                const price = product.discountPrice ? parseFloat(product.discountPrice) : parseFloat(product.price);
                const badges = getBadges(product);
                
                return (
                    <div key={product.id} className="w-[260px] flex-shrink-0 snap-start relative group">
                        {/* Quick View Trigger inside image */}
                        <div onClick={() => onSelect(product)} className={`h-full rounded-2xl border-2 flex flex-col bg-[#161b26] cursor-pointer transition-transform overflow-hidden ${isSelected ? 'border-primary ring-4 ring-primary/20 scale-[1.02]' : 'border-white/5 hover:border-white/20'}`}>
                            {isSelected && (
                                <div className="absolute top-2 right-2 bg-primary text-white p-1.5 rounded-full z-10 shadow-lg animate-bounce">
                                    <Check className="w-4 h-4" />
                                </div>
                            )}
                            <div className="h-40 bg-white p-4 flex items-center justify-center relative group-img">
                                <img src={product.images?.[0]?.url || 'https://via.placeholder.com/150'} alt={product.name} className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500" />
                                {/* Quick View Button Overlay */}
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onQuickView(product); }}
                                    className="absolute bottom-2 left-2 size-8 bg-black/60 backdrop-blur hover:bg-primary text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-20"
                                    title="نظرة سريعة"
                                >
                                    <Search className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="p-4 flex flex-col flex-1 justify-between gap-3 relative z-10 bg-[#161b26]">
                                <div>
                                    <h4 className="text-white font-bold text-sm line-clamp-2 leading-snug group-hover:text-primary transition-colors">{product.name}</h4>
                                    
                                    {/* Smart Badges rendering */}
                                    {badges.length > 0 && (
                                        <div className="flex gap-2 mt-2">
                                            {badges.map((b, i) => (
                                                <span key={i} className="flex items-center gap-1 text-[10px] bg-white/5 border border-white/10 text-gray-300 px-1.5 py-0.5 rounded">
                                                    <span className="material-symbols-outlined text-[12px]">{b.icon}</span>
                                                    {b.text}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-1">
                                    {product.discountPrice && (
                                        <span className="text-xs text-gray-500 line-through">
                                            {parseFloat(product.price).toLocaleString()}
                                        </span>
                                    )}
                                    <span className="text-xl font-bold text-white">
                                        {price.toLocaleString()} <span className="text-xs text-primary font-normal">EGP</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
            
            {products.length === 0 && (
                <div className="w-[300px] flex items-center justify-center py-10 text-gray-500 text-sm border-2 border-dashed border-white/10 rounded-2xl mx-auto snap-start h-full">
                    لا تتوفر منتجات متوافقة تماماً الآن. يُرجى التخطي.
                </div>
            )}
        </div>
    );
}

// ------------------------------------------------------------------------------------------------
// QUICK VIEW MODAL (Phase 3)
// ------------------------------------------------------------------------------------------------
function QuickViewModal({ product, onClose }: { product: any, onClose: () => void }) {
    
    const price = parseFloat(product.price);
    const discountPrice = product.discountPrice ? parseFloat(product.discountPrice) : null;
    const hasDiscount = discountPrice && discountPrice < price;

    const parseSpecs = (s: any): { key: string; value: string }[] => {
        if (!s) return [];
        if (!Array.isArray(s) && typeof s === 'object') {
            return Object.entries(s).map(([k, v]) => ({ key: String(k), value: typeof v === 'string' ? v : JSON.stringify(v) }));
        }
        if (!Array.isArray(s)) return [];
        return s.map((item: any) => {
            if (typeof item === 'string') return { key: 'المواصفة', value: item };
            return { key: item.key || '', value: item.value || '' };
        });
    };

    const combinedSpecs = [
        ...Object.entries(product.dynamicAttributes || {}).map(([key, value]) => ({ key, value: Array.isArray(value) ? value.join('، ') : String(value) })),
        ...parseSpecs(product.specifications)
    ];

    // Filter unique by key
    const uniqueSpecs = combinedSpecs.filter((v, i, a) => a.findIndex(t => (t.key === v.key)) === i);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
            {/* Backdrop */}
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                className="absolute inset-0 bg-background-dark/80 backdrop-blur-md"
            />
            
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 20 }} 
                onClick={e => e.stopPropagation()}
                className="relative w-full max-w-4xl bg-surface-dark border border-white/10 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
                {/* Close Button overlaying image area on mobile, fixed absolute right on desktop */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 left-4 z-50 size-10 bg-black/50 hover:bg-brand-red text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-md"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 overflow-y-auto no-scrollbar">
                    {/* Left: Image */}
                    <div className="bg-white p-8 flex items-center justify-center relative min-h-[300px]">
                        <img 
                            src={product.images?.[0]?.url || 'https://via.placeholder.com/400'} 
                            alt={product.name} 
                            className="w-full h-full object-contain mix-blend-multiply"
                        />
                    </div>
                    
                    {/* Right: Details Container exactly like ProductDetailsPage */}
                    <div className="p-6 md:p-8 flex flex-col gap-6">
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-md self-start">
                                {product.brand?.name || 'براند مختص'}
                            </span>
                            <h2 className="text-2xl font-extrabold text-white leading-tight mt-2">{product.name}</h2>
                            <p className="text-sm text-gray-400 mt-2 line-clamp-3 leading-relaxed">{product.description}</p>
                        </div>

                        <div className="p-4 rounded-2xl flex flex-col gap-2 relative overflow-hidden bg-white/5 border border-white/5">
                            <div className="flex items-end gap-3 flex-wrap">
                                <div className="flex flex-col">
                                    {hasDiscount && (
                                        <span className="text-slate-400 text-sm font-medium line-through mb-1">
                                            {price.toLocaleString('ar-EG')} ج.م
                                        </span>
                                    )}
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-extrabold text-brand-red tracking-tight">
                                            {(hasDiscount ? discountPrice : price)?.toLocaleString('ar-EG')}
                                        </span>
                                        <span className="text-sm font-medium text-slate-300">جنية</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Specs loop */}
                        <div className="flex-1">
                            <h3 className="text-white font-bold mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
                                <Cpu className="w-4 h-4 text-primary" />
                                أبرز المواصفات
                            </h3>
                            <div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                                {uniqueSpecs.slice(0, 10).map((spec, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-[#101622]/80 p-2.5 rounded-lg border border-white/5 text-xs">
                                        <span className="text-gray-400 font-medium">{spec.key}</span>
                                        <span className="text-white font-bold w-1/2 text-left line-clamp-1">{spec.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/5 mt-auto">
                            <div className="flex flex-col items-center justify-center text-center gap-1 p-2 rounded-lg bg-white/5">
                                <ShieldCheck className="w-5 h-5 text-primary" />
                                <span className="text-[10px] text-slate-400">ضمان عام كامل</span>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center gap-1 p-2 rounded-lg bg-white/5">
                                <Truck className="w-5 h-5 text-primary" />
                                <span className="text-[10px] text-slate-400">شحن سريع</span>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center gap-1 p-2 rounded-lg bg-white/5">
                                <CreditCard className="w-5 h-5 text-primary" />
                                <span className="text-[10px] text-slate-400">دفع عند الاستلام</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

export default AIBundleBuilderPage;
