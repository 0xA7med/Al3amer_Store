import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    Star, ShoppingCart, Heart, Share2, ChevronLeft, Minus, Plus,
    Check, PlayCircle, Info, ShieldCheck, Truck,
    CreditCard, ZoomIn, ShoppingBag, LayoutList, Verified, Cpu
} from 'lucide-react';
import { useProduct, useProducts, type Product } from '../hooks/useProducts';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../hooks/useWishlist';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';

export const ProductDetailsPage = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { data: product, isLoading, error } = useProduct(slug || '');

    const [userSelectedImage, setUserSelectedImage] = useState<number | null>(null);
    const [isZoomOpen, setIsZoomOpen] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState<'specs' | 'video' | 'reviews' | 'warranty'>('specs');
    const { addToCart, items } = useCart();
    const { isAuthenticated } = useAuth();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const isWishlisted = isInWishlist(product?.id || '');

    const { data: relatedProductsData } = useProducts({
        category: product?.category?.slug || '',
        limit: 10
    });
    const relatedProducts = (relatedProductsData?.data as Product[] || []).filter(p => p.id !== product?.id);

    const handleAddAllToCart = () => {
        const topTwo = relatedProducts.slice(0, 2);
        [product, ...topTwo].forEach(p => {
            if (!p) return;
            const pPrice = parseFloat(p.price);
            const pDiscountPrice = p.discountPrice ? parseFloat(p.discountPrice) : null;
            addToCart({
                id: p.id,
                name: p.name,
                price: pDiscountPrice || pPrice,
                image: p.images.find(img => img.isPrimary)?.url || p.images?.[0]?.url || 'https://via.placeholder.com/64',
                quantity: 1,
                sku: p.sku
            });
        });
        toast.success(`تم إضافة ${topTwo.length + 1} منتجات إلى السلة بنجاح`);
    };

    const isInCart = items.some(item => item.id === product?.id);

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">جاري تحميل المنتج...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error || !product) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4">
                <div className="text-center glass-panel p-8 rounded-2xl max-w-md w-full">
                    <Info className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-white mb-2">المنتج غير موجود</h2>
                    <p className="text-gray-400 mb-6">عذراً، لم نتمكن من العثور على هذا المنتج في قاعدة بياناتنا.</p>
                    <Link to="/shop" className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-primary/20">
                        العودة للمتجر
                    </Link>
                </div>
            </div>
        );
    }

    // Get images - use product images or fallback
    const productImagesData = product.images || [];
    const images = productImagesData.length > 0
        ? productImagesData.map(img => img.url)
        : ['https://via.placeholder.com/600x600/181a20/ffffff?text=No+Image'];

    // Get primary image index
    const primaryIndex = Math.max(0, productImagesData.findIndex(img => img.isPrimary) ?? 0);

    // Active index defaults to primaryIndex if user hasn't selected one
    const activeImageIndex = userSelectedImage !== null ? userSelectedImage : primaryIndex;

    // Parse specifications correctly (using the fix from previous turn)
    const parseSpecs = (s: any): { key: string; value: string }[] => {
        if (!s) return [];
        if (!Array.isArray(s) && typeof s === 'object') {
            return Object.entries(s).map(([k, v]) => ({
                key: String(k),
                value: typeof v === 'string' ? v : JSON.stringify(v)
            }));
        }
        if (!Array.isArray(s)) return [];
        return s.map(item => {
            if (typeof item === 'string') return { key: 'المواصفة', value: item };
            let key = String(item.key || '');
            let value = item.value;
            while (value && typeof value === 'object' && 'value' in value) {
                value = value.value;
            }
            return { key, value: String(value || '') };
        });
    };

    const specifications = parseSpecs(product.specifications);

    const displayLabelMap: Record<string, string> = {
        'connectivity': 'طرق الاتصال',
        'usage': 'نمط الاستخدام',
        'اتصال': 'طرق الاتصال',
        'الاستخدام': 'نمط الاستخدام'
    };

    // Price formatting
    const price = parseFloat(product.price);
    const discountPrice = product.discountPrice ? parseFloat(product.discountPrice) : null;
    const hasDiscount = discountPrice && discountPrice < price;
    const discountPercent = hasDiscount ? Math.round((1 - (discountPrice! / price)) * 100) : 0;

    return (
        <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
            {/* Breadcrumb Navigation */}
            <nav className="flex mb-8 overflow-x-auto no-scrollbar pb-1">
                <ol className="inline-flex items-center space-x-reverse space-x-1 md:space-x-2 rtl:space-x-reverse whitespace-nowrap">
                    <li className="inline-flex items-center">
                        <Link to="/" className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-primary transition-colors">
                            <Info className="w-4 h-4 ml-1" />
                            الرئيسية
                        </Link>
                    </li>
                    {product.category && (
                        <li>
                            <div className="flex items-center">
                                <ChevronLeft className="w-4 h-4 text-slate-600 mx-2 rtl:rotate-180" />
                                <Link to={`/shop?category=${product.category.slug}`} className="text-sm font-medium text-slate-400 hover:text-primary transition-colors">
                                    {product.category.name}
                                </Link>
                            </div>
                        </li>
                    )}
                    <li aria-current="page">
                        <div className="flex items-center">
                            <ChevronLeft className="w-4 h-4 text-slate-600 mx-2 rtl:rotate-180" />
                            <span className="text-sm font-medium text-primary line-clamp-1">{product.name}</span>
                        </div>
                    </li>
                </ol>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16">
                {/* Visual Gallery Section */}
                <div className="lg:col-span-7 flex flex-col gap-4">
                    <div className="w-full aspect-[4/3] rounded-2xl glass-panel relative overflow-hidden group">
                        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                            {hasDiscount && (
                                <span className="px-3 py-1.5 bg-brand-red/90 backdrop-blur text-white text-xs font-bold rounded-lg shadow-lg shadow-red-900/20 border border-red-500/30">
                                    خصم {discountPercent}%
                                </span>
                            )}
                            <span className="px-3 py-1.5 bg-emerald-600/90 backdrop-blur text-white text-xs font-bold rounded-lg shadow-lg shadow-emerald-900/20 border border-emerald-500/30 flex items-center gap-1">
                                <Truck className="w-3.5 h-3.5" />
                                شحن مجاني
                            </span>
                        </div>
                        <div
                            className="w-full h-full bg-surface-dark/50 flex items-center justify-center p-8 transition-transform duration-500 cursor-zoom-in"
                            onClick={() => setIsZoomOpen(true)}
                        >
                            <img
                                src={images[activeImageIndex] || images[0]}
                                alt={product.name}
                                className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                        <button
                            onClick={() => setIsZoomOpen(true)}
                            className="absolute bottom-4 left-4 p-2.5 rounded-xl bg-surface-dark/80 text-white hover:bg-primary transition-all backdrop-blur-md border border-white/10 hover:border-primary shadow-lg"
                        >
                            <ZoomIn className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                        {images.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setUserSelectedImage(idx)}
                                className={`relative size-20 md:size-24 rounded-xl border-2 transition-all overflow-hidden flex-shrink-0 bg-surface-dark shadow-lg ${activeImageIndex === idx ? 'border-primary shadow-primary/10' : 'border-transparent hover:border-slate-500 opacity-70 hover:opacity-100'
                                    }`}
                            >
                                <img src={img} alt={`${product.name} - ${idx + 1}`} className="w-full h-full object-cover" />
                            </button>
                        ))}
                        {product.videoUrl && (
                            <button
                                onClick={() => setActiveTab('video')}
                                className="relative size-20 md:size-24 rounded-xl border-2 border-transparent hover:border-primary overflow-hidden flex-shrink-0 bg-surface-dark transition-all opacity-70 hover:opacity-100 flex items-center justify-center group"
                            >
                                <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors"></div>
                                <PlayCircle className="w-8 h-8 text-white relative z-10 transform group-hover:scale-110 transition-transform" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Product Purchase & Info Section */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-md">
                                    {product.brand?.name || 'براند كاشير'}
                                </span>
                                <span className={`text-xs font-bold flex items-center gap-1 border px-2.5 py-1 rounded-md ${product.stock > 0
                                    ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                                    : 'text-red-400 bg-red-500/10 border-red-500/20'
                                    }`}>
                                    <Check className="w-3.5 h-3.5" />
                                    {product.stock > 0 ? 'متوفر' : 'نفذت الكمية'}
                                </span>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        if (!isAuthenticated) {
                                            toast.error('يرجى تسجيل الدخول لإضافة المنتج للمفضلة');
                                            return;
                                        }
                                        if (product?.id) toggleWishlist(product.id);
                                    }}
                                    className={`transition-colors ${isWishlisted ? 'text-red-500 hover:text-red-600' : 'text-slate-400 hover:text-red-500'}`}
                                >
                                    <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                                </button>
                                <button
                                    onClick={async () => {
                                        if (navigator.share) {
                                            try {
                                                await navigator.share({
                                                    title: product.name,
                                                    text: `${product.name} - ${(hasDiscount ? discountPrice : price)?.toLocaleString()} ج.م`,
                                                    url: window.location.href
                                                });
                                            } catch (err) {
                                                if ((err as any).name !== 'AbortError') {
                                                    toast.error('فشلت عملية المشاركة')
                                                }
                                            }
                                        } else {
                                            navigator.clipboard.writeText(window.location.href);
                                            toast.success('تم نسخ الرابط');
                                        }
                                    }}
                                    className="text-slate-400 hover:text-primary transition-colors"
                                >
                                    <Share2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight tracking-tight">
                            {product.name}
                        </h1>
                        <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm">
                            <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                                <div className="flex text-yellow-400 gap-0.5">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <Star key={i} className={`w-3.5 h-3.5 ${i < Math.floor(product.averageRating || 0) ? 'fill-current' : 'opacity-30'}`} />
                                    ))}
                                </div>
                                <span className="text-white font-bold">{product.averageRating || 0}</span>
                                <span className="text-slate-500 font-medium">({product.reviewCount || 0} تقييم)</span>
                            </div>
                            <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                            <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                                <ShoppingBag className="w-4 h-4 text-primary" />
                                تم بيع <span className="text-white font-bold">+{product.salesCount || 0}</span> قطعة
                            </div>
                            <div className="w-1 h-1 rounded-full bg-slate-700"></div>
                            <div className="flex items-center gap-1.5 text-emerald-500 font-bold">
                                <Verified className="w-4 h-4" />
                                متوفر في المخزن ({product.stock})
                            </div>
                        </div>
                    </div>

                    <p className="text-slate-300 leading-relaxed text-sm md:text-base border-r-2 border-primary/50 pr-4 italic">
                        {product.description || 'وصف المنتج غير متاح حالياً، يرجى مراجعة المواصفات الفنية.'}
                    </p>

                    <div className="glass-panel p-6 rounded-2xl flex flex-col gap-6 shadow-2xl shadow-black/40 border-t border-t-white/10 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-red via-primary to-brand-red opacity-50"></div>

                        <div className="flex items-end gap-3 flex-wrap relative z-10">
                            <div className="flex flex-col">
                                {hasDiscount && (
                                    <span className="text-slate-400 text-sm font-medium line-through mb-1 flex items-center gap-1">
                                        {price.toLocaleString('ar-EG')} ج.م
                                    </span>
                                )}
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl md:text-5xl font-extrabold text-brand-red tracking-tight">
                                        {(hasDiscount ? discountPrice : price)?.toLocaleString('ar-EG', { useGrouping: false })}
                                    </span>
                                    <span className="text-xl font-medium text-slate-300">جنية مصري</span>
                                </div>
                            </div>
                            {hasDiscount && (
                                <div className="mr-auto flex flex-col items-end">
                                    <span className="text-xs font-bold text-white uppercase tracking-wider bg-brand-red px-2 py-0.5 rounded shadow-lg shadow-red-900/40">عرض محدود</span>
                                    <span className="text-sm text-emerald-400 font-medium mt-1">وفرت {(price - discountPrice!).toLocaleString('ar-EG')} ج.م</span>
                                </div>
                            )}
                        </div>

                        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                        <div className="flex flex-col gap-4">
                            <div className="grid grid-cols-12 gap-4">
                                <div className="col-span-4 flex items-center justify-between bg-surface-dark rounded-xl border border-white/10 h-12 px-1 focus-within:border-primary/50 transition-colors">
                                    <button
                                        onClick={() => setQuantity(q => q + 1)}
                                        className="size-9 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                    <span className="text-white font-bold text-lg">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                        className="size-9 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        <Minus className="w-5 h-5" />
                                    </button>
                                </div>
                                <button
                                    onClick={() => {
                                        addToCart({
                                            id: product.id,
                                            name: product.name,
                                            price: hasDiscount ? discountPrice! : price,
                                            image: images[0],
                                            quantity,
                                            sku: product.sku
                                        });
                                        toast.success('تم إضافة المنتج للسلة بنجاح');
                                    }}
                                    disabled={product.stock === 0}
                                    className="col-span-8 bg-primary hover:bg-blue-600 disabled:bg-slate-700 text-white font-bold rounded-xl h-12 flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-[0.98] group/btn"
                                >
                                    <ShoppingCart className="w-5 h-5 group-hover/btn:animate-bounce" />
                                    <span className="text-base">{isInCart ? 'أضف مجدداً' : 'أضف إلى السلة'}</span>
                                </button>
                            </div>

                            <button
                                onClick={() => {
                                    addToCart({
                                        id: product.id,
                                        name: product.name,
                                        price: hasDiscount ? discountPrice! : price,
                                        image: images[0],
                                        quantity,
                                        sku: product.sku
                                    });
                                    navigate('/checkout');
                                }}
                                disabled={product.stock === 0}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white font-bold rounded-xl h-14 flex items-center justify-center gap-3 shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40 transition-all active:scale-[0.98] group/btn"
                            >
                                <ShoppingBag className="w-6 h-6 group-hover/btn:animate-bounce" />
                                <span className="text-base">شراء الآن</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                            <div className="flex flex-col items-center justify-center text-center gap-1 p-2 rounded-lg hover:bg-white/5 transition-colors">
                                <ShieldCheck className="w-6 h-6 text-primary" />
                                <span className="text-[10px] text-slate-400">ضمان لمدة سنة</span>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center gap-1 p-2 rounded-lg hover:bg-white/5 transition-colors">
                                <Truck className="w-6 h-6 text-primary" />
                                <span className="text-[10px] text-slate-400">شحن سريع</span>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center gap-1 p-2 rounded-lg hover:bg-white/5 transition-colors">
                                <CreditCard className="w-6 h-6 text-primary" />
                                <span className="text-[10px] text-slate-400">الدفع عند الاستلام</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Content Section (Tabs) */}
            <div className="flex flex-col gap-8">
                <div className="border-b border-white/10 sticky top-20 bg-background-dark/95 backdrop-blur z-30">
                    <nav className="flex gap-8 overflow-x-auto no-scrollbar">
                        <button
                            onClick={() => setActiveTab('specs')}
                            className={`border-b-2 px-4 py-4 text-base whitespace-nowrap flex items-center gap-2 transition-all ${activeTab === 'specs' ? 'border-primary text-primary font-bold bg-primary/5' : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600 font-medium'
                                }`}
                        >
                            <LayoutList className="w-5 h-5" />
                            المواصفات التقنية
                        </button>
                        {product.videoUrl && (
                            <button
                                onClick={() => setActiveTab('video')}
                                className={`border-b-2 px-4 py-4 text-base whitespace-nowrap flex items-center gap-2 transition-all ${activeTab === 'video' ? 'border-primary text-primary font-bold bg-primary/5' : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600 font-medium'
                                    }`}
                            >
                                <PlayCircle className="w-5 h-5" />
                                فيديو توضيحي
                            </button>
                        )}
                        <button
                            onClick={() => setActiveTab('reviews')}
                            className={`border-b-2 px-4 py-4 text-base whitespace-nowrap flex items-center gap-2 transition-all ${activeTab === 'reviews' ? 'border-primary text-primary font-bold bg-primary/5' : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600 font-medium'
                                }`}
                        >
                            <Star className="w-5 h-5" />
                            التقييمات ({product.reviewCount || 0})
                        </button>
                    </nav>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 flex flex-col gap-8">
                        {activeTab === 'specs' && (
                            <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="px-6 py-4 border-b border-white/5 bg-white/5 flex items-center gap-2">
                                    <Cpu className="w-5 h-5 text-primary" />
                                    <h3 className="text-lg font-bold text-white">تفاصيل الجهاز التقنية</h3>
                                </div>
                                <div className="divide-y divide-white/5 text-sm md:text-base">
                                    {specifications.length > 0 ? specifications.map((spec, idx) => (
                                        <div key={idx} className={`grid grid-cols-1 md:grid-cols-3 p-4 hover:bg-white/5 transition-colors group ${idx % 2 !== 0 ? 'bg-surface-dark/30' : ''}`}>
                                            <span className="text-slate-400 font-medium md:col-span-1 flex items-center gap-2">
                                                <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-primary transition-colors"></span>
                                                {displayLabelMap[spec.key.toLowerCase()] || spec.key}
                                            </span>
                                            <span className="text-white font-medium mt-1 md:mt-0 md:col-span-2">{spec.value}</span>
                                        </div>
                                    )) : (
                                        <div className="p-8 text-center text-slate-500 italic">لا توجد مواصفات فنية لهذا المنتج حالياً.</div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'video' && product.videoUrl && (
                            <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 aspect-video animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <iframe
                                    className="w-full h-full"
                                    src={product.videoUrl.replace('watch?v=', 'embed/')}
                                    title="Product Video"
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="glass-panel p-6 rounded-2xl flex flex-wrap gap-8 items-center bg-gradient-to-br from-surface-dark to-transparent">
                                    <div className="flex flex-col items-center justify-center gap-1 min-w-[140px] border-l border-white/5 pl-8">
                                        <span className="text-6xl font-extrabold text-white tracking-tighter">{product.averageRating || 0}</span>
                                        <div className="flex text-yellow-400 gap-0.5 my-1">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star key={i} className={`w-6 h-6 ${i < Math.floor(product.averageRating || 0) ? 'fill-current' : ''}`} />
                                            ))}
                                        </div>
                                        <span className="text-slate-400 text-sm font-medium">بناءً على {product.reviewCount || 0} تقييم</span>
                                    </div>
                                    <div className="flex-1 min-w-[200px] flex flex-col gap-3">
                                        {[5, 4, 3, 2, 1].map((star) => {
                                            const count = product.reviews?.filter(r => r.rating === star).length || 0;
                                            const percent = product.reviewCount ? Math.round((count / product.reviewCount) * 100) : 0;
                                            return (
                                                <div key={star} className="flex items-center gap-3">
                                                    <span className="text-slate-400 text-xs w-6 font-bold">{star} نجوم</span>
                                                    <div className="flex-1 h-2.5 bg-black/40 rounded-full overflow-hidden">
                                                        <div style={{ width: `${percent}%` }} className="h-full bg-gradient-to-r from-primary to-blue-400 rounded-full shadow-[0_0_10px_rgba(19,91,236,0.3)]"></div>
                                                    </div>
                                                    <span className="text-slate-400 text-xs w-8 text-left font-bold">{percent}%</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {product.reviews && product.reviews.length > 0 ? product.reviews.map((review) => (
                                        <div key={review.id} className="glass-panel p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="size-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-sm ring-2 ring-slate-600">
                                                        {(review.customerName || review.user?.name || 'ز').charAt(0)}
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-white font-bold text-sm">{review.customerName || review.user?.name || 'مشتري'}</span>
                                                        <span className="text-slate-500 text-xs flex items-center gap-1">
                                                            <Verified className="w-3 h-3 text-emerald-500" />
                                                            شراء مؤكد • {new Date(review.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex text-yellow-400">
                                                    {Array.from({ length: 5 }).map((_, i) => (
                                                        <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-current' : ''}`} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-slate-300 text-sm leading-relaxed border-r-2 border-primary/30 pr-3">{review.text}</p>
                                        </div>
                                    )) : (
                                        <div className="p-12 text-center text-slate-500 border border-dashed border-white/10 rounded-2xl">
                                            لا توجد تقييمات لهذا المنتج بعد. كن أول من يقيم!
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        {/* Frequently Bought Together (Upsell) */}
                        <div className="glass-panel rounded-2xl p-6 border border-white/10">
                            <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">add_link</span>
                                اشتروه معاً عادة
                            </h4>
                            <div className="flex flex-col gap-4">
                                {relatedProducts.slice(0, 2).map((rp: Product) => (
                                    <div key={rp.id} className="flex gap-3 items-center group cursor-pointer p-2 rounded-xl hover:bg-white/5 transition-colors">
                                        <Link to={`/product/${rp.slug || rp.id}`} className="size-16 rounded-lg bg-surface-dark border border-white/5 overflow-hidden flex-shrink-0 relative">
                                            <img src={rp.images.find(img => img.isPrimary)?.url || rp.images[0]?.url || 'https://via.placeholder.com/64'} alt={rp.name} className="w-full h-full object-contain" />
                                        </Link>
                                        <div className="flex flex-col flex-1">
                                            <Link to={`/product/${rp.slug || rp.id}`}>
                                                <h5 className="text-slate-200 text-xs font-medium group-hover:text-primary transition-colors line-clamp-1">{rp.name}</h5>
                                            </Link>
                                            <div className="flex justify-between items-center mt-1">
                                                <span className="text-brand-red font-bold text-sm">{parseFloat(rp.price).toLocaleString()} ج.م</span>
                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        addToCart({
                                                            id: rp.id,
                                                            name: rp.name,
                                                            price: parseFloat(rp.price),
                                                            image: rp.images.find(img => img.isPrimary)?.url || rp.images[0]?.url,
                                                            quantity: 1
                                                        });
                                                    }}
                                                    className="size-7 rounded-full bg-white/10 hover:bg-primary text-slate-300 hover:text-white flex items-center justify-center transition-colors"
                                                >
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {relatedProducts.length === 0 && (
                                    <p className="text-xs text-slate-500 italic text-center p-4">لا توجد منتجات مقترحة حالياً.</p>
                                )}
                            </div>
                            {relatedProducts.length > 0 && (
                                <button
                                    onClick={handleAddAllToCart}
                                    className="w-full mt-6 py-2.5 rounded-xl border border-primary/30 text-primary bg-primary/5 hover:bg-primary hover:text-white text-sm font-bold transition-all shadow-sm"
                                >
                                    إضافة الكل للسلة
                                </button>
                            )}
                        </div>

                        {product.videoUrl && (
                            <div className="glass-panel p-6 rounded-2xl overflow-hidden relative border border-white/10">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full -z-10"></div>
                                <h4 className="text-white font-bold mb-4 flex items-center justify-between">
                                    {product.videoTitle || 'شرح الاستخدام'}
                                    <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded uppercase font-bold">YouTube</span>
                                </h4>
                                <div
                                    onClick={() => setActiveTab('video')}
                                    className="aspect-video w-full rounded-xl bg-black/50 overflow-hidden relative group cursor-pointer border border-white/10 shadow-lg"
                                >
                                    <div className="absolute inset-0 flex items-center justify-center z-10 transition-transform group-hover:scale-110">
                                        <div className="size-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-xl">
                                            <PlayCircle className="w-10 h-10 text-white fill-current" />
                                        </div>
                                    </div>
                                    <img
                                        src={`https://img.youtube.com/vi/${product.videoUrl?.includes('v=') ? product.videoUrl?.split('v=')[1]?.split('&')[0] : product.videoUrl?.split('/').pop()}/hqdefault.jpg`}
                                        alt="Video Preview"
                                        className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-500"
                                    />
                                </div>
                                <p className="text-slate-400 text-xs mt-3 leading-relaxed italic">{product.videoDescription || 'تعرف على كيفية إعداد الجهاز وربطه بنظام الكاشير في أقل من 5 دقائق.'}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Related Products Section */}
            {relatedProducts.length > 0 && (
                <div className="mt-20 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                                <span className="w-1.5 h-6 bg-brand-red rounded-full block"></span>
                                منتجات قد تعجبك
                            </h2>
                            <p className="text-slate-400 text-sm mt-1 pr-4">تم اختيارها بناءً على اهتماماتك</p>
                        </div>
                        <div className="flex gap-2">
                            <button className="size-10 rounded-full bg-surface-dark hover:bg-primary hover:text-white text-slate-300 flex items-center justify-center border border-white/10 transition-colors rtl:rotate-180 shadow-md">
                                <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
                            </button>
                            <button className="size-10 rounded-full bg-surface-dark hover:bg-primary hover:text-white text-slate-300 flex items-center justify-center border border-white/10 transition-colors rtl:rotate-180 shadow-md">
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {relatedProducts.map((rp: Product) => (
                            <Link key={rp.id} to={`/product/${rp.slug || rp.id}`} className="group">
                                <div className="glass-panel rounded-2xl p-4 hover:border-primary/50 transition-all duration-300 flex flex-col h-full relative overflow-hidden">
                                    <div className="relative w-full aspect-square rounded-xl bg-surface-dark overflow-hidden mb-4 border border-white/5">
                                        <img
                                            src={rp.images.find(img => img.isPrimary)?.url || rp.images[0]?.url || 'https://via.placeholder.com/400'}
                                            alt={rp.name}
                                            className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <button className="absolute top-2 left-2 size-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-brand-red transition-colors backdrop-blur-sm z-20 opacity-0 group-hover:opacity-100 transform translate-y-[-10px] group-hover:translate-y-0 duration-300">
                                            <Heart className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex flex-col flex-1 relative z-20">
                                        <span className="text-[10px] text-primary font-bold mb-1 uppercase tracking-wider">{rp.brand?.name || 'ماركة'}</span>
                                        <h3 className="text-white font-bold text-sm mb-4 line-clamp-2 group-hover:text-primary transition-colors">{rp.name}</h3>
                                        <div className="mt-auto flex items-center justify-between">
                                            <span className="text-lg font-bold text-brand-red">{parseFloat(rp.price).toLocaleString()} ج.م</span>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    addToCart({
                                                        id: rp.id,
                                                        name: rp.name,
                                                        price: parseFloat(rp.price),
                                                        image: rp.images.find(img => img.isPrimary)?.url || rp.images[0]?.url,
                                                        quantity: 1
                                                    });
                                                }}
                                                className="size-10 rounded-xl bg-white/5 hover:bg-primary text-white flex items-center justify-center transition-colors border border-white/10 group-hover:border-primary"
                                            >
                                                <ShoppingCart className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Lightbox / Zoom Overlay */}
            <AnimatePresence>
                {isZoomOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-4"
                        onClick={() => setIsZoomOpen(false)}
                    >
                        {/* Close Button */}
                        <button
                            className="absolute top-6 right-6 size-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors border border-white/10"
                            onClick={() => setIsZoomOpen(false)}
                        >
                            <Plus className="w-6 h-6 rotate-45" />
                        </button>

                        {/* Image Counter */}
                        <div className="absolute top-6 left-6 text-slate-400 text-sm font-medium">
                            {activeImageIndex + 1} / {images.length}
                        </div>

                        {/* Navigation Arrows */}
                        <div className="absolute inset-x-4 md:inset-x-8 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setUserSelectedImage(prev => (prev === null ? primaryIndex : prev + 1) % images.length);
                                }}
                                className="size-14 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors border border-white/10 pointer-events-auto backdrop-blur-md"
                            >
                                <ChevronLeft className="w-8 h-8" />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setUserSelectedImage(prev => (prev === null ? primaryIndex : (prev - 1 + images.length) % images.length));
                                }}
                                className="size-14 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors border border-white/10 pointer-events-auto backdrop-blur-md"
                            >
                                <ChevronLeft className="w-8 h-8 rotate-180" />
                            </button>
                        </div>

                        {/* Main Image */}
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="max-w-5xl w-full h-full flex items-center justify-center"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <img
                                src={images[activeImageIndex]}
                                alt={product.name}
                                className="max-w-full max-h-full object-contain drop-shadow-[0_0_50px_rgba(19,91,236,0.2)]"
                            />
                        </motion.div>

                        {/* Thumbnails Strip */}
                        <div className="absolute bottom-8 flex gap-2 overflow-x-auto max-w-[90vw] p-2 no-scrollbar" onClick={(e: any) => e.stopPropagation()}>
                            {images.map((img, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setUserSelectedImage(idx)}
                                    className={`size-16 rounded-lg border-2 overflow-hidden transition-all flex-shrink-0 ${activeImageIndex === idx ? 'border-primary ring-4 ring-primary/20' : 'border-white/10 opacity-50 hover:opacity-100'}`}
                                >
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProductDetailsPage;
