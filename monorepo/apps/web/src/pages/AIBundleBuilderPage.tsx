import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useCart } from '../context/CartContext';
import { SlidersHorizontal, Sparkles, Wand2, ShoppingCart, Plus, Check, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface BundleProduct {
    productId: string;
    name: string;
    desc: string;
    price: number;
    imageUrl: string;
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

export function AIBundleBuilderPage() {
    const navigate = useNavigate();
    const { addToCart } = useCart();

    const [businessType, setBusinessType] = useState('restaurant');
    const [customBusinessType, setCustomBusinessType] = useState('');
    const [budget, setBudget] = useState(15000);
    const [isCustomBudget, setIsCustomBudget] = useState(false);
    const [customBudget, setCustomBudget] = useState<number | ''>(5000);
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>(['printer', 'touch']);

    const [result, setResult] = useState<BundleResult | null>(null);
    const [hasGenerated, setHasGenerated] = useState(false);
    const [isManualMode, setIsManualMode] = useState(false);
    const [manualStep, setManualStep] = useState(1);
    const [manualBundle, setManualBundle] = useState<any[]>([]);

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
            const { data } = await api.post('/ai-bundle/generate', {
                businessType: businessType === 'custom' ? customBusinessType : businessType,
                budget: finalBudget,
                selectedFeatures
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

    const handleAddManualItem = (product: any) => {
        setManualBundle(prev => [
            ...prev,
            {
                productId: product.id,
                name: product.name,
                price: parseFloat(product.price),
                imageUrl: product.images[0]?.url || '',
                category: product.category?.slug
            }
        ]);
        toast.success(`تمت إضافة ${product.name}`);
    };

    const handleRemoveManualItem = (productId: string) => {
        setManualBundle(prev => prev.filter(item => item.productId !== productId));
    };

    const handleAddManualBundleToCart = () => {
        if (manualBundle.length === 0) return;
        manualBundle.forEach(item => {
            addToCart({
                id: item.productId,
                name: item.name,
                price: item.price,
                image: item.imageUrl,
                quantity: 1
            });
        });
        toast.success('تمت إضافة جميع المنتجات للسلة');
        navigate('/cart');
    };

    const totalManualPrice = manualBundle.reduce((sum, item) => sum + item.price, 0);

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
            {/* Background Effects */}
            <div className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-primary/10 rounded-full blur-[100px] -translate-y-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-[#8b5cf6]/10 rounded-full blur-[80px] translate-y-1/3 pointer-events-none"></div>

            {/* Header */}
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-6 text-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-[#8b5cf6]/20 to-primary/20 text-[#8b5cf6] border border-[#8b5cf6]/20 mb-4 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                    <Wand2 className="w-3 h-3 animate-pulse" />
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

                {/* Header Toggle (AI vs Manual) */}
                <div className="flex justify-center mb-8 gap-4">
                    <button
                        onClick={() => setIsManualMode(false)}
                        className={`px-6 py-2.5 rounded-full font-bold transition-all flex items-center gap-2 ${!isManualMode ? 'bg-[#8b5cf6] text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                    >
                        <Sparkles className="w-4 h-4" />
                        المنشئ الذكي
                    </button>
                    <button
                        onClick={() => setIsManualMode(true)}
                        className={`px-6 py-2.5 rounded-full font-bold transition-all flex items-center gap-2 ${isManualMode ? 'bg-[#8b5cf6] text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                    >
                        <SlidersHorizontal className="w-4 h-4" />
                        بناء يدوي
                    </button>
                </div>

                {!isManualMode ? (
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

                                        {/* Custom Business Type Input */}
                                        {businessType === 'custom' && (
                                            <div className="mt-2 animate-fadeIn">
                                                <label className="text-white text-sm font-medium mb-2 block text-xs">يرجى تحديد نوع نشاطك:</label>
                                                <input
                                                    type="text"
                                                    value={customBusinessType}
                                                    onChange={(e) => setCustomBusinessType(e.target.value)}
                                                    placeholder="مثال: ورشة سيارات، مكتبة، محل زهور..."
                                                    className="w-full bg-[#161b26] border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-primary transition-colors text-sm"
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <hr className="border-white/5" />

                                    {/* Step 2: Budget */}
                                    <div className="flex flex-col gap-4">
                                        <label className="text-white font-bold flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className="size-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs border border-primary/20">2</span>
                                                الميزانية التقريبية
                                            </div>
                                        </label>

                                        <div className="bg-[#161b26]/50 rounded-xl p-4 border border-white/5">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex gap-4 items-center">
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            checked={!isCustomBudget}
                                                            onChange={() => setIsCustomBudget(false)}
                                                            className="accent-[#8b5cf6]"
                                                        />
                                                        <span className="text-gray-300 text-xs">ميزانية محددة</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer">
                                                        <input
                                                            type="radio"
                                                            checked={isCustomBudget}
                                                            onChange={() => setIsCustomBudget(true)}
                                                            className="accent-[#8b5cf6]"
                                                        />
                                                        <span className="text-gray-300 text-xs">مبلغ مخصص</span>
                                                    </label>
                                                </div>
                                                <div className="text-primary font-bold dir-ltr flex items-center gap-1">
                                                    <span className="text-lg">{(isCustomBudget && customBudget ? Number(customBudget) : budget).toLocaleString()}</span>
                                                    <span className="text-[10px] text-gray-500">EGP</span>
                                                </div>
                                            </div>

                                            {!isCustomBudget ? (
                                                <>
                                                    <input
                                                        type="range"
                                                        min="5000"
                                                        max="100000"
                                                        step="5000"
                                                        value={budget}
                                                        onChange={(e) => setBudget(Number(e.target.value))}
                                                        className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[#8b5cf6]"
                                                    />
                                                    <div className="flex justify-between text-[10px] text-gray-500 font-medium px-1 mt-2">
                                                        <span>اقتصادي (5k)</span>
                                                        <span>متوسط (50k)</span>
                                                        <span>احترافي (100k)</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={customBudget}
                                                        onChange={(e) => setCustomBudget(e.target.value === '' ? '' : Number(e.target.value))}
                                                        placeholder="أدخل الميزانية (جنية مصري)"
                                                        className="w-full bg-[#161b26] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-primary transition-colors text-left dir-ltr text-sm"
                                                    />
                                                    <span className="absolute right-3 top-2.5 text-gray-500 text-xs">EGP</span>
                                                </div>
                                            )}
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
                                                    <div className="px-4 py-1.5 rounded-lg border border-white/10 bg-[#161b26]/50 text-gray-400 text-xs font-medium hover:bg-white/5 transition-colors peer-checked:bg-primary/20 peer-checked:border-primary peer-checked:text-white">
                                                        {feature.name}
                                                    </div>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isGenerating}
                                        className="w-full mt-4 bg-gradient-to-r from-[#8b5cf6] to-primary hover:from-[#8b5cf6]/90 hover:to-primary/90 text-white font-bold py-4 rounded-xl shadow-lg shadow-[#8b5cf6]/25 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {isGenerating ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                <span>جاري التحليل...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-5 h-5 animate-pulse" />
                                                <span>بناء الحزمة الذكية</span>
                                            </>
                                        )}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Result Section */}
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
                                    {/* AI Analysis & Budget Warning */}
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

                                    {/* Bundle Card */}
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
                                            <button
                                                onClick={handleAddBundleToCart}
                                                className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-primary/25 flex items-center justify-center gap-2 transition-all group"
                                            >
                                                <ShoppingCart className="w-5 h-5 group-hover:animate-bounce" />
                                                إضافة الحزمة للسلة
                                            </button>
                                            <button
                                                onClick={() => setIsManualMode(true)}
                                                className="sm:w-auto bg-white/5 hover:bg-white/10 text-white font-bold py-3.5 px-6 rounded-xl border border-white/10 flex items-center justify-center gap-2 transition-all"
                                            >
                                                <SlidersHorizontal className="w-5 h-5" />
                                                تخصيص المنتجات يدوياً
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                ) : (
                    /* Manual Builder Mode */
                    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-24">
                        <ManualWizard
                            step={manualStep}
                            setStep={setManualStep}
                            manualBundle={manualBundle}
                            onAddItem={handleAddManualItem}
                            onRemoveItem={handleRemoveManualItem}
                        />

                        {/* Sticky Bottom Bar */}
                        <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
                            <div className="max-w-4xl mx-auto glass-panel p-4 rounded-2xl border-primary/30 flex items-center justify-between shadow-2xl">
                                <div className="flex flex-col">
                                    <span className="text-gray-400 text-xs">إجمالي الحزمة</span>
                                    <span className="text-2xl font-bold text-white">{totalManualPrice.toLocaleString()} EGP</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex -space-x-3 rtl:space-x-reverse min-w-[80px]">
                                        {manualBundle.slice(0, 3).map((item, i) => (
                                            <div key={i} className="size-10 rounded-full border-2 border-[#1a1f2e] bg-white p-1 overflow-hidden">
                                                <img src={item.imageUrl || 'https://via.placeholder.com/50'} className="w-full h-full object-contain" />
                                            </div>
                                        ))}
                                        {manualBundle.length > 3 && (
                                            <div className="size-10 rounded-full border-2 border-[#1a1f2e] bg-[#2a3042] flex items-center justify-center text-[10px] text-white font-bold">
                                                +{manualBundle.length - 3}
                                            </div>
                                        )}
                                    </div>
                                    <button
                                        onClick={handleAddManualBundleToCart}
                                        disabled={manualBundle.length === 0}
                                        className="bg-primary hover:bg-primary-dark text-white font-bold px-8 py-3 rounded-xl shadow-lg disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <ShoppingCart className="w-5 h-5" />
                                        إضافة للسلة
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Sub-component for Manual Wizard
function ManualWizard({ step, setStep, manualBundle, onAddItem, onRemoveItem }: any) {
    const categories = [
        { id: 1, title: 'أجهزة الكاشير (POS)', slug: 'pos-systems' },
        { id: 2, title: 'طابعات الفواتير', slug: 'printers' },
        { id: 3, title: 'الماسحات والإضافات', slugs: ['scanners', 'drawers', 'scales'] },
    ];

    const currentCat = categories[step - 1];
    const { data: productsData, isLoading } = useProducts({
        categories: currentCat.slug || currentCat.slugs
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {categories.map((c) => (
                        <div key={c.id} className="flex items-center gap-2">
                            <div className={`size-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${step >= c.id ? 'bg-primary text-white' : 'bg-white/5 text-gray-500 border border-white/5'}`}>
                                {step > c.id ? <Check className="w-4 h-4" /> : c.id}
                            </div>
                            {c.id < 3 && <div className={`w-8 h-px ${step > c.id ? 'bg-primary' : 'bg-white/5'}`} />}
                        </div>
                    ))}
                </div>
                <div className="text-gray-400 text-sm font-medium">خطوة {step} من 3: <span className="text-white">{currentCat.title}</span></div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 min-h-[400px]">
                {isLoading ? (
                    Array(3).fill(0).map((_, i) => <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse" />)
                ) : productsData?.data.map((product) => {
                    const isSelected = manualBundle.some((item: any) => item.productId === product.id);
                    return (
                        <div key={product.id} className={`glass-panel p-4 rounded-2xl border transition-all flex flex-col gap-4 group ${isSelected ? 'border-primary bg-primary/5' : 'border-white/5'}`}>
                            <div className="aspect-square bg-white rounded-xl p-4 relative overflow-hidden flex items-center justify-center">
                                <img src={product.images[0]?.url} className="w-full h-full object-contain group-hover:scale-110 transition-transform" />
                                {isSelected && (
                                    <div className="absolute top-2 right-2 size-8 rounded-full bg-primary flex items-center justify-center text-white shadow-lg">
                                        <Check className="w-4 h-4" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <h4 className="text-white font-bold">{product.name}</h4>
                                <p className="text-gray-400 text-xs mt-1 line-clamp-2">{product.description}</p>
                            </div>
                            <div className="flex items-center justify-between mt-2">
                                <span className="text-xl font-bold text-primary">{parseFloat(product.price).toLocaleString()} EGP</span>
                                {!isSelected ? (
                                    <button
                                        onClick={() => onAddItem(product)}
                                        className="size-10 rounded-xl bg-white/5 hover:bg-primary hover:text-white flex items-center justify-center transition-colors"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => onRemoveItem(product.id)}
                                        className="size-10 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
                {productsData?.data.length === 0 && (
                    <div className="col-span-full py-20 text-center text-gray-500">
                        لا توجد منتجات متاحة في هذا القسم حالياً.
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center pt-8">
                <button
                    disabled={step === 1}
                    onClick={() => setStep(step - 1)}
                    className="flex items-center gap-2 text-gray-400 hover:text-white disabled:opacity-0"
                >
                    <ChevronRight className="w-5 h-5" />
                    السابق
                </button>
                {step < 3 && (
                    <button
                        onClick={() => setStep(step + 1)}
                        className="btn-primary px-8"
                    >
                        المرحلة التالية
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
}

export default AIBundleBuilderPage;
