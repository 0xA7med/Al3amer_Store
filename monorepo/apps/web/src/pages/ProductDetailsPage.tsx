import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    Star, ShoppingCart, Heart, Share2, ChevronLeft, Minus, Plus,
    Check, Info, ShieldCheck, Truck,
    CreditCard, ShoppingBag, Verified, MessageCircle
} from 'lucide-react';
import { useProduct, useProducts, type Product } from '../hooks/useProducts';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../hooks/useWishlist';
import toast from 'react-hot-toast';
import { useSettings } from '../context/SettingsContext';
import { ProductGallery, ProductTabs, RelatedProducts, ProductLightbox, StickyMobileCart } from '../components/products';
import SEOHead from '../components/SEO/SEOHead';
import { buildProductSchema, buildBreadcrumbSchema, buildFAQSchema } from '../components/SEO/ProductSchema';

export const ProductDetailsPage = () => {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { data: product, isLoading, error } = useProduct(slug || '');

    const [userSelectedImage, setUserSelectedImage] = useState<number | null>(null);
    const [isZoomOpen, setIsZoomOpen] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [activeTab, setActiveTab] = useState<'specs' | 'video' | 'reviews' | 'warranty' | 'faq'>('specs');
    const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
    const [showStickyCart, setShowStickyCart] = useState(false);
    const [showAllSpecs, setShowAllSpecs] = useState(false);
    const { addToCart, items } = useCart();
    const { isAuthenticated } = useAuth();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const { settings } = useSettings();
    const isWishlisted = isInWishlist(product?.id || '');

    const { data: relatedProductsData } = useProducts({
        category: product?.category?.slug || '',
        limit: 10
    });
    
    // Smart Linkage Extraction
    const accessories = (product as any).relationships?.filter((r: any) => r.type === 'accessory').map((r: any) => r.relatedProduct).filter(Boolean) || [];
    const alternatives = (product as any).relationships?.filter((r: any) => r.type === 'alternative').map((r: any) => r.relatedProduct).filter(Boolean) || [];
    const manualRelated = (product as any).relationships?.filter((r: any) => r.type === 'related').map((r: any) => r.relatedProduct).filter(Boolean) || [];

    const relatedProducts = manualRelated.length > 0 
        ? manualRelated 
        : (relatedProductsData?.data as Product[] || []).filter(p => p.id !== product?.id);

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
                image: p.images.find((img: any) => img.isPrimary)?.url || p.images?.[0]?.url || 'https://via.placeholder.com/64',
                quantity: 1,
                sku: p.sku,
                stock: p.stock,
            });
        });
        toast.success(`تم إضافة ${topTwo.length + 1} منتجات إلى السلة بنجاح`);
    };

    // Scroll listener for sticky mobile CTA
    useEffect(() => {
        const handleScroll = () => {
            setShowStickyCart(window.scrollY > 700);
        };
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Auto-select logic
    const [selectedVariant, setSelectedVariant] = useState<Product | null>(null);
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [selectedTierIndex, setSelectedTierIndex] = useState<number>(0);

    useEffect(() => {
        if (!product) return;
        
        let initialVariant = null;
        if (product.parent) {
            initialVariant = product as Product;
        } else if (product.variants && product.variants.length > 0) {
            initialVariant = product.variants[0];
        }

        setSelectedVariant(initialVariant);
        setSelectedTierIndex(0); // Reset tier when product/variant changes

        if (initialVariant?.variantOptions) {
            const defaults: Record<string, string> = {};
            initialVariant.variantOptions.forEach((opt: any) => {
                defaults[opt.attributeName] = opt.value;
            });
            setSelectedOptions(defaults);
        } else {
            setSelectedOptions({});
        }
    }, [product?.id]);

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

    // Variant State Logic
    const hasVariants = product.variants && product.variants.length > 0;
    const allVariants = hasVariants ? product.variants! : (product.parent ? [product] : []);
    // Derived available attributes
    const availableAttributes = (() => {
        if (allVariants.length === 0) return {};
        const attrs: Record<string, Set<string>> = {};
        allVariants.forEach(v => {
            if (v.variantOptions) {
                v.variantOptions.forEach((opt: any) => {
                    if (!attrs[opt.attributeName]) attrs[opt.attributeName] = new Set();
                    attrs[opt.attributeName].add(opt.value);
                });
            }
        });
        const result: Record<string, string[]> = {};
        for (const key in attrs) {
            result[key] = Array.from(attrs[key]);
        }
        return result;
    })();

    // Handle Option Click
    const handleOptionSelect = (attributeName: string, value: string) => {
        const newOptions = { ...selectedOptions, [attributeName]: value };
        setSelectedOptions(newOptions);

        // Find matching variant
        const matched = allVariants.find(v => {
            if (!v.variantOptions) return false;
            return v.variantOptions.every((opt: any) => newOptions[opt.attributeName] === opt.value);
        });

        if (matched) {
            setSelectedVariant(matched);
            setSelectedTierIndex(0); // Reset tier for new variant
            setUserSelectedImage(null); 
        }
    };

    // Which product to display data for?
    const displayProduct = selectedVariant || product;
    const currentTier = displayProduct.salesTiers?.[selectedTierIndex];

    // Get images - include tier image if available
    const productImagesData = displayProduct.images && displayProduct.images.length > 0 
        ? [...displayProduct.images] 
        : (product.images ? [...product.images] : []);

    // Active Image logic
    const tierImageUrl = currentTier?.imageUrl;
    
    const images = productImagesData.map(img => img.url);
    if (tierImageUrl && !images.includes(tierImageUrl)) {
        images.unshift(tierImageUrl);
    }
    
    if (images.length === 0) {
        images.push('https://via.placeholder.com/600x600/181a20/ffffff?text=No+Image');
    }

    // Get primary image index
    const primaryIndex = Math.max(0, productImagesData.findIndex(img => img.isPrimary) ?? 0);

    // Active index defaults to primaryIndex if user hasn't selected one
    const activeImageIndex = userSelectedImage !== null ? userSelectedImage : primaryIndex;

    // Parse specifications correctly
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

    const specifications = parseSpecs(displayProduct.specifications || product.specifications);

    const displayLabelMap: Record<string, string> = {
        'connectivity': 'طرق الاتصال',
        'usage': 'نمط الاستخدام',
        'اتصال': 'طرق الاتصال',
        'الاستخدام': 'نمط الاستخدام'
    };

    // Price formatting - override with tier if set
    const basePrice = parseFloat(displayProduct.price);
    const baseDiscount = displayProduct.discountPrice ? parseFloat(displayProduct.discountPrice) : null;

    // Tier-adjusted price
    let price = basePrice;
    if (currentTier) {
        const factor = parseFloat(String(currentTier.adjustmentValue || currentTier.quantity || '1'));
        price = basePrice * factor;
    }
    const discountPrice = currentTier ? null : baseDiscount; // Tiers represent bulk pricing
    
    const hasDiscount = !!(discountPrice && discountPrice < price);
    const discountPercent = hasDiscount ? Math.round((1 - (discountPrice! / price)) * 100) : 0;

    // Stock-aware max quantity
    const tierMultiplier = currentTier?.quantity || 1;
    const maxQuantity = Math.floor((displayProduct.stock || 0) / tierMultiplier);

    const breadcrumbItems = [
        { name: 'الرئيسية', url: '/' },
        ...(product?.category ? [{ name: product.category.name, url: `/shop?category=${product.category.slug}` }] : []),
        { name: product?.name || 'المنتج', url: `/product/${slug}` },
    ];

    const productJsonLd = product ? buildProductSchema(product) : undefined;
    const breadcrumbJsonLd = buildBreadcrumbSchema(breadcrumbItems);
    const faqJsonLd = product?.faq ? buildFAQSchema(product.faq) : undefined;

    return (
        <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
            <SEOHead
              title={product?.metaTitle || product?.name || 'المنتج'}
              description={product?.metaDescription || product?.description?.slice(0, 160) || 'تفاصيل المنتج'}
              canonical={`/product/${slug}`}
              ogImage={product?.images?.[0]?.url}
              ogType="product"
              jsonLd={[productJsonLd, breadcrumbJsonLd, faqJsonLd].filter(Boolean)}
            />
            {/* Breadcrumb Navigation */}
            <nav className="flex mb-8 overflow-x-auto no-scrollbar pb-1">
                <ol className="inline-flex items-center space-x-reverse space-x-1 md:space-x-2 rtl:space-x-reverse whitespace-nowrap">
                    <li className="inline-flex items-center">
                        <Link to="/" className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-primary transition-colors">
                            <Info className="w-4 h-4 ml-1" />
                            الرئيسية
                        </Link>
                    </li>
                    {/* Build full breadcrumb chain from category ancestry */}
                    {(() => {
                        const crumbs: { name: string; slug: string }[] = [];
                        if (product.category) {
                            // Walk up the parent chain
                            const cat = product.category as any;
                            if (cat.parent?.parent) {
                                crumbs.push({ name: cat.parent.parent.name, slug: cat.parent.parent.slug });
                            }
                            if (cat.parent) {
                                crumbs.push({ name: cat.parent.name, slug: cat.parent.slug });
                            }
                            crumbs.push({ name: cat.name, slug: cat.slug });
                        }
                        return crumbs.map((crumb, idx) => (
                            <li key={idx} className={idx < crumbs.length - 1 ? 'hidden sm:inline-flex' : 'inline-flex'}>
                                <div className="flex items-center">
                                    <ChevronLeft className="w-4 h-4 text-slate-600 mx-1 md:mx-2 rtl:rotate-180" />
                                    <Link to={`/shop?categories=${crumb.slug}`} className="text-[11px] md:text-sm font-medium text-slate-400 hover:text-primary transition-colors">
                                        {crumb.name}
                                    </Link>
                                </div>
                            </li>
                        ));
                    })()}
                    <li aria-current="page">
                        <div className="flex items-center">
                            <ChevronLeft className="w-4 h-4 text-slate-600 mx-1 md:mx-2 rtl:rotate-180" />
                            <span className="text-[11px] md:text-sm font-medium text-primary line-clamp-1 max-w-[150px] md:max-w-xs">{product.name}</span>
                        </div>
                    </li>
                </ol>
            </nav>

            {/* Product Title - shown ABOVE the gallery for easy screenshot capture */}
            <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-md">
                        {product.brand?.name || 'براند كاشير'}
                    </span>
                    <span className={`text-xs font-bold flex items-center gap-1 border px-2.5 py-1 rounded-md ${
                        product.stock > 0
                            ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                            : 'text-red-400 bg-red-500/10 border-red-500/20'
                    }`}>
                        <Check className="w-3.5 h-3.5" />
                        {product.stock > 0 ? 'متوفر' : 'نفذت الكمية'}
                    </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white leading-tight tracking-tight">
                    {product.name}
                </h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 mb-16">
                <ProductGallery
                    images={images}
                    product={product}
                    activeImageIndex={activeImageIndex}
                    hasDiscount={hasDiscount}
                    discountPercent={discountPercent}
                    isWishlisted={isWishlisted}
                    isAuthenticated={isAuthenticated}
                    onWishlistToggle={toggleWishlist}
                    onImageSelect={(idx) => setUserSelectedImage(idx)}
                    onZoomOpen={() => setIsZoomOpen(true)}
                    onVideoTab={() => {
                        setActiveTab('video');
                        window.scrollTo({ top: document.getElementById('tabs-section')?.offsetTop || 500, behavior: 'smooth' });
                    }}
                />

                {/* Product Purchase & Info Section */}
                <div className="lg:col-span-5 flex flex-col gap-4 md:gap-6">
                    <div className="flex flex-col gap-2 md:gap-3">
                        {/* Brand + stock badges — hidden on mobile (shown above gallery), visible on desktop */}
                        <div className="hidden lg:flex items-center justify-between">
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
                                        const shareUrl = window.location.href;
                                        if (navigator.share) {
                                            try {
                                                await navigator.share({
                                                    title: product.name,
                                                    text: `${product.name} - ${(hasDiscount ? discountPrice : price)?.toLocaleString()} ج.م`,
                                                    url: shareUrl
                                                });
                                            } catch (err) {
                                                if ((err as any).name !== 'AbortError') {
                                                    toast.error('فشلت عملية المشاركة')
                                                }
                                            }
                                        } else {
                                            navigator.clipboard.writeText(shareUrl);
                                            toast.success('تم نسخ الرابط');
                                        }
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:text-primary hover:border-primary/50 transition-all group"
                                >
                                    <Share2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    <span className="text-xs font-bold font-primary">مشاركة</span>
                                </button>
                            </div>
                        </div>


                        {/* Title — hidden on mobile (shown above gallery) */}
                        <h1 className="hidden lg:block text-3xl md:text-4xl font-extrabold text-white leading-tight tracking-tight mt-1 mb-1">
                            {product.name}
                        </h1>
                        <div className="flex flex-wrap items-center gap-3 text-[11px] md:text-sm">
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

                    <div className="relative">
                        <div 
                            className={`text-slate-300 leading-relaxed text-sm md:text-base border-r-2 border-primary/50 pr-4 italic transition-all duration-300 ${isDescriptionExpanded ? '' : 'line-clamp-2'}`} 
                            style={{ whiteSpace: 'pre-line' }}
                        >
                            {product.description || 'وصف المنتج غير متاح حالياً، يرجى مراجعة المواصفات الفنية.'}
                        </div>
                        
                        {(product.description && (product.description.split('\n').length > 4 || product.description.length > 200)) && (
                            <>
                                {!isDescriptionExpanded && (
                                    <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background-dark to-transparent pointer-events-none"></div>
                                )}
                                <button 
                                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                                    className="text-primary hover:text-white text-sm font-bold mt-2 flex items-center gap-1 transition-colors relative z-10"
                                >
                                    {isDescriptionExpanded ? (
                                        <>إخفاء التفاصيل <Minus className="w-4 h-4" /></>
                                    ) : (
                                        <>قراءة المزيد <Plus className="w-4 h-4" /></>
                                    )}
                                </button>
                            </>
                        )}

                        {product.llmDescription && isDescriptionExpanded && (
                            <div className="mt-4 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-xs md:text-sm leading-relaxed font-mono">
                                <h4 className="font-bold text-indigo-400 mb-2 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[16px]">psychology</span>
                                    خلاصة تقنية (AI Summary)
                                </h4>
                                {product.llmDescription}
                            </div>
                        )}
                    </div>

                    <div className="glass-panel p-4 md:p-6 rounded-2xl flex flex-col gap-4 md:gap-6 shadow-2xl shadow-black/40 border-t border-t-white/10 relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-red via-primary to-brand-red opacity-50"></div>

                        {/* Variant Selector */}
                        {Object.keys(availableAttributes).length > 0 && (
                            <div className="flex flex-col gap-5 relative z-10 pb-4 border-b border-white/5">
                                {Object.entries(availableAttributes).map(([attrName, values]) => (
                                    <div key={attrName} className="flex flex-col gap-3">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-sm md:text-base font-bold text-slate-300">
                                                {displayLabelMap[attrName.toLowerCase()] || attrName}
                                            </h4>
                                            {selectedOptions[attrName] && (
                                                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                                                    {selectedOptions[attrName]}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-2.5">
                                            {values.map(val => {
                                                const isSelected = selectedOptions[attrName] === val;
                                                return (
                                                    <button
                                                        key={val}
                                                        onClick={() => handleOptionSelect(attrName, val)}
                                                        className={`px-4 md:px-5 py-2.5 md:py-3 rounded-xl text-sm font-bold border transition-all active:scale-95 ${
                                                            isSelected 
                                                                ? 'bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(19,91,236,0.15)] ring-1 ring-primary/50' 
                                                                : 'bg-surface-dark border-white/10 text-slate-400 hover:border-slate-500 hover:text-white hover:bg-white/5 shadow-sm'
                                                        }`}
                                                    >
                                                        {val}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Sales Tiers (Bulk Packs) */}
                        {displayProduct.salesTiers && displayProduct.salesTiers.length > 0 && (
                            <div className="flex flex-col gap-4 relative z-10 pb-4 border-b border-white/5">
                                <div className="flex items-center gap-2">
                                    <h4 className="text-sm md:text-base font-bold text-slate-300">الكمية / العرض</h4>
                                    <span className="text-[10px] text-slate-500 font-bold bg-white/5 px-2 py-0.5 rounded border border-white/5">اختر حجم العبوة</span>
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                    {displayProduct.salesTiers.map((tier: any, idx: number) => (
                                        <button
                                            key={idx}
                                            onClick={() => {
                                                setSelectedTierIndex(idx);
                                                setUserSelectedImage(null);
                                            }}
                                            className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all active:scale-95 ${
                                                selectedTierIndex === idx 
                                                    ? 'bg-primary/10 border-primary text-primary shadow-[0_0_15px_rgba(19,91,236,0.15)] ring-1 ring-primary/50' 
                                                    : 'bg-surface-dark border-white/10 text-slate-400 hover:border-slate-500 hover:text-white hover:bg-white/5 shadow-sm'
                                            }`}
                                        >
                                            <span className="text-xs font-black mb-1">{tier.quantity} {tier.quantity === 1 ? 'بكرة' : 'بكرة'}</span>
                                            <span className="text-[10px] opacity-70">
                                                {parseFloat(tier.price).toLocaleString('ar-EG')} ج.م
                                            </span>
                                            {tier.quantity > 1 && (
                                                <span className="text-[8px] mt-1 bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-full font-bold">توفير bulk</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex items-end gap-3 flex-wrap relative z-10">
                            <div className="flex flex-col">
                                {hasDiscount && (
                                    <span className="text-slate-400 text-xs md:text-sm font-medium line-through mb-0.5 flex items-center gap-1">
                                        {price.toLocaleString('ar-EG')} ج.م
                                    </span>
                                )}
                                <div className="flex items-baseline gap-1 flex-wrap">
                                    <span className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-brand-red tracking-tight">
                                        {price?.toLocaleString('ar-EG', { useGrouping: false })}
                                    </span>
                                    <span className="text-base sm:text-xl font-medium text-slate-300">جنية مصري</span>
                                </div>
                            </div>
                            {hasDiscount && (
                                <div className="mr-auto flex flex-col items-end">
                                    <span className="text-[10px] md:text-xs font-bold text-white uppercase tracking-wider bg-brand-red px-2 py-0.5 rounded shadow-lg shadow-red-900/40">عرض محدود</span>
                                    <span className="text-xs md:text-sm text-emerald-400 font-medium mt-1">وفرت {(price - discountPrice!).toLocaleString('ar-EG')} ج.م</span>
                                </div>
                            )}
                        </div>

                        <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

                        <div className="flex flex-col gap-3 md:gap-4">
                            <div className="grid grid-cols-12 gap-3 md:gap-4">
                                <div className="col-span-5 md:col-span-4 flex items-center justify-between bg-surface-dark rounded-xl border border-white/10 h-12 md:h-12 px-1 focus-within:border-primary/50 transition-colors">
                                    <button
                                        onClick={() => setQuantity(q => Math.min(q + 1, maxQuantity))}
                                        disabled={quantity >= maxQuantity}
                                        className="size-8 md:size-9 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
                                    >
                                        <Plus className="w-4 h-4 md:w-5 md:h-5" />
                                    </button>
                                    <span className="text-white font-bold text-base md:text-lg">{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                        disabled={quantity <= 1}
                                        className="size-8 md:size-9 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg transition-colors"
                                    >
                                        <Minus className="w-4 h-4 md:w-5 md:h-5" />
                                    </button>
                                </div>
                                <button
                                    onClick={() => {
                                        addToCart({
                                            id: displayProduct.id,
                                            name: displayProduct.name,
                                            price: price,
                                            image: tierImageUrl || images[0],
                                            quantity,
                                            sku: displayProduct.sku,
                                            selectedTierId: currentTier?.id,
                                            multiplier: currentTier?.quantity || 1,
                                            stock: displayProduct.stock,
                                        });
                                        toast.success('تم إضافة المنتج للسلة بنجاح');
                                    }}
                                    disabled={displayProduct.stock === 0 || quantity > maxQuantity}
                                    className="col-span-7 md:col-span-8 bg-primary hover:bg-blue-600 disabled:bg-slate-700 text-white font-bold rounded-xl h-12 flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all active:scale-[0.98] group/btn"
                                >
                                    <ShoppingCart className="w-4 h-4 md:w-5 md:h-5 group-hover/btn:animate-bounce" />
                                    <span className="text-sm md:text-base">{isInCart ? 'أضف مجدداً' : 'أضف إلى السلة'}</span>
                                </button>
                            </div>

                            <button
                                onClick={() => {
                                    addToCart({
                                        id: displayProduct.id,
                                        name: displayProduct.name,
                                        price: price,
                                        image: tierImageUrl || images[0],
                                        quantity,
                                        sku: displayProduct.sku,
                                        selectedTierId: currentTier?.id,
                                        multiplier: currentTier?.quantity || 1,
                                        stock: displayProduct.stock,
                                    });
                                    navigate('/checkout');
                                }}
                                disabled={displayProduct.stock === 0 || quantity > maxQuantity}
                                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white font-bold rounded-xl h-14 flex items-center justify-center gap-3 shadow-lg shadow-emerald-900/20 hover:shadow-emerald-900/40 transition-all active:scale-[0.98] group/btn"
                            >
                                <ShoppingBag className="w-6 h-6 group-hover/btn:animate-bounce" />
                                <span className="text-base">شراء الآن</span>
                            </button>

                            {displayProduct.stock === 0 && (
                                <a
                                    href={`https://wa.me/${settings.whatsapp?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`مرحباً، أود الاستفسار عن توفر منتج: ${displayProduct.name}`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full bg-[#25D366] hover:bg-[#20ba59] text-white font-bold rounded-xl h-14 flex items-center justify-center gap-3 shadow-lg shadow-green-900/20 hover:shadow-green-900/40 transition-all active:scale-[0.98] group/btn mt-2"
                                >
                                    <MessageCircle className="w-6 h-6 group-hover/btn:scale-110 transition-transform" />
                                    <span className="text-base">استفسار عبر واتساب</span>
                                </a>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                            <div className="flex flex-col items-center justify-center text-center gap-1 p-2 rounded-lg hover:bg-white/5 transition-colors">
                                <ShieldCheck className="w-6 h-6 text-primary" />
                                <span className="text-[10px] text-slate-400">ضمان العامر ستور</span>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center gap-1 p-2 rounded-lg hover:bg-white/5 transition-colors">
                                <Truck className="w-6 h-6 text-primary" />
                                <span className="text-[10px] text-slate-400">شحن سريع لحد الباب</span>
                            </div>
                            <div className="flex flex-col items-center justify-center text-center gap-1 p-2 rounded-lg hover:bg-white/5 transition-colors">
                                <CreditCard className="w-6 h-6 text-primary" />
                                <span className="text-[10px] text-slate-400">الدفع عند الاستلام</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

                <ProductTabs
                    product={product}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    specifications={specifications}
                    showAllSpecs={showAllSpecs}
                    onShowAllSpecsToggle={() => setShowAllSpecs(s => !s)}
                    displayLabelMap={displayLabelMap}
                    relatedProducts={relatedProducts}
                    addToCart={addToCart}
                    handleAddAllToCart={handleAddAllToCart}
                    onVideoTab={() => {
                        setActiveTab('video');
                        setTimeout(() => {
                            const el = document.getElementById('tabs-section');
                            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 50);
                    }}
                />



                <RelatedProducts
                    relatedProducts={accessories}
                    addToCart={addToCart}
                    items={items}
                    title="إكسسوارات متوافقة"
                    subtitle="منتجات نوصي بها لتعمل مع هذا المنتج بشكل مثالي"
                />

                <RelatedProducts
                    relatedProducts={relatedProducts}
                    addToCart={addToCart}
                    items={items}
                    title="منتجات ذات صلة"
                    subtitle="قد تجد هذه المنتجات مفيدة لك أيضاً"
                />

                <RelatedProducts
                    relatedProducts={alternatives}
                    addToCart={addToCart}
                    items={items}
                    title="بدائل مقترحة"
                    subtitle="خيارات أخرى مشابهة لهذا المنتج قد تناسب احتياجك"
                />

                <ProductLightbox
                    images={images}
                    activeImageIndex={activeImageIndex}
                    isZoomOpen={isZoomOpen}
                    productName={product.name}
                    onImageSelect={(idx) => setUserSelectedImage(idx)}
                    onClose={() => setIsZoomOpen(false)}
                />

                <StickyMobileCart
                    displayProduct={displayProduct}
                    images={images}
                    hasDiscount={hasDiscount}
                    discountPrice={discountPrice}
                    price={price}
                    discountPercent={discountPercent}
                    isInCart={isInCart}
                    showStickyCart={showStickyCart}
                    addToCart={addToCart}
                />
        </div>
    );
};

export default ProductDetailsPage;
