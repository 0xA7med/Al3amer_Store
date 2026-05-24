import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, PlayCircle, Cpu, LayoutList, Verified, Plus, Minus, HelpCircle } from 'lucide-react';
import { getEmbedUrl } from '../../utils/videoParser';
import type { Product } from '../../hooks/useProducts';

// YouTube Facade: extracts video ID to show thumbnail before loading iframe
function getYouTubeId(url: string): string | null {
    try {
        const u = new URL(url);
        if (u.hostname.includes('youtu.be')) return u.pathname.slice(1);
        return u.searchParams.get('v');
    } catch { return null; }
}

// Lazy YouTube Player: shows thumbnail + play button, loads iframe only on click
function LazyYouTube({ embedUrl, videoUrl, title }: { embedUrl: string; videoUrl: string; title: string }) {
    const [activated, setActivated] = useState(false);
    const videoId = getYouTubeId(videoUrl);
    const thumbUrl = videoId
        ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
        : null;

    if (activated) {
        return (
            <iframe
                className="w-full h-full"
                src={`${embedUrl}&autoplay=1`}
                title={title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            />
        );
    }

    return (
        <button
            type="button"
            onClick={() => setActivated(true)}
            className="w-full h-full relative flex items-center justify-center bg-black/70 group"
            aria-label={`تشغيل ${title}`}
            style={{ aspectRatio: '16/9' }}
        >
            {thumbUrl && (
                <img
                    src={thumbUrl}
                    alt={title}
                    className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    loading="lazy"
                    width="480" height="270"
                />
            )}
            <div className="relative z-10 size-16 rounded-full bg-primary/90 hover:bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 transition-all group-hover:scale-110">
                <PlayCircle className="w-9 h-9 text-white" />
            </div>
        </button>
    );
}

interface ProductTabsProps {
    product: Product;
    activeTab: 'specs' | 'video' | 'reviews' | 'warranty' | 'faq';
    onTabChange: (tab: 'specs' | 'video' | 'reviews' | 'warranty' | 'faq') => void;
    specifications: { key: string; value: string }[];
    showAllSpecs: boolean;
    onShowAllSpecsToggle: () => void;
    displayLabelMap: Record<string, string>;
    relatedProducts: Product[];
    addToCart: (item: any) => void;
    handleAddAllToCart: () => void;
    onVideoTab: () => void;
}

export function ProductTabs({
    product,
    activeTab,
    onTabChange,
    specifications,
    showAllSpecs,
    onShowAllSpecsToggle,
    displayLabelMap,
    relatedProducts,
    addToCart,
    handleAddAllToCart,
    onVideoTab,
}: ProductTabsProps) {
    const topTwo = relatedProducts.slice(0, 2);

    return (
        <div id="tabs-section" className="flex flex-col gap-8">
            <div className="border-b border-white/10 sticky top-20 bg-background-dark/95 backdrop-blur z-30">
                <nav className="flex gap-8 overflow-x-auto no-scrollbar">
                    <button
                        onClick={() => onTabChange('specs')}
                        className={`border-b-2 px-4 py-4 text-base whitespace-nowrap flex items-center gap-2 transition-all ${activeTab === 'specs' ? 'border-primary text-primary font-bold bg-primary/5' : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600 font-medium'
                            }`}
                    >
                        <LayoutList className="w-5 h-5" />
                        المواصفات التقنية
                    </button>
                    {product.videos && product.videos.length > 0 && (
                        <button
                            onClick={() => onTabChange('video')}
                            className={`border-b-2 px-4 py-4 text-base whitespace-nowrap flex items-center gap-2 transition-all ${activeTab === 'video' ? 'border-primary text-primary font-bold bg-primary/5' : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600 font-medium'
                                }`}
                        >
                            <PlayCircle className="w-5 h-5" />
                            فيديو توضيحي
                        </button>
                    )}
                    <button
                        onClick={() => onTabChange('reviews')}
                        className={`border-b-2 px-4 py-4 text-base whitespace-nowrap flex items-center gap-2 transition-all ${activeTab === 'reviews' ? 'border-primary text-primary font-bold bg-primary/5' : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600 font-medium'
                            }`}
                    >
                        <Star className="w-5 h-5" />
                        التقييمات ({product.reviewCount || 0})
                    </button>
                    {product.faq && product.faq.length > 0 && (
                        <button
                            onClick={() => onTabChange('faq')}
                            className={`border-b-2 px-4 py-4 text-base whitespace-nowrap flex items-center gap-2 transition-all ${activeTab === 'faq' ? 'border-primary text-primary font-bold bg-primary/5' : 'border-transparent text-slate-400 hover:text-white hover:border-slate-600 font-medium'
                                }`}
                        >
                            <HelpCircle className="w-5 h-5" />
                            الأسئلة الشائعة
                        </button>
                    )}
                </nav>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col gap-8">
                    {activeTab === 'specs' && (
                        <div className="glass-panel rounded-2xl overflow-hidden border border-white/10 animate-in fade-in slide-in-from-bottom-4 duration-500 p-4 md:p-6">
                            <div className="flex items-center gap-2 mb-4 md:mb-6 border-b border-white/10 pb-3 md:pb-4">
                                <Cpu className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                                <h3 className="text-lg md:text-xl font-bold text-white">المواصفات الفنية</h3>
                            </div>
                            
                            {(() => {
                                const dynamicSpecs = Object.entries(product.dynamicAttributes || {}).map(([k, v]) => ({
                                    key: k,
                                    value: Array.isArray(v) ? v.join(' ، ') : String(v)
                                }));
                                
                                const merged = [...dynamicSpecs];
                                specifications.forEach(spec => {
                                    if (!merged.some(m => m.key.toLowerCase() === spec.key.toLowerCase())) {
                                        merged.push(spec);
                                    }
                                });

                                if (merged.length === 0) {
                                    return <div className="p-8 text-center text-slate-500 italic">لا توجد مواصفات فنية لهذا المنتج حالياً.</div>;
                                }

                                return (
                                    <>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            {(showAllSpecs ? merged : merged.slice(0, 4)).map((spec, idx) => (
                                                <div 
                                                    key={idx} 
                                                    className="p-3 bg-[#101622]/80 backdrop-blur rounded-xl border border-white/5 hover:border-primary/40 transition-all flex flex-row items-start justify-between gap-2 group"
                                                >
                                                    <span className="text-slate-400 font-medium text-sm flex items-start gap-2 flex-1 pt-0.5">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-primary transition-colors mt-1.5 flex-shrink-0"></span>
                                                        {displayLabelMap[spec.key.toLowerCase()] || spec.key}
                                                    </span>
                                                    <span className="text-white font-bold text-sm text-left break-words max-w-[55%]">
                                                        {spec.value}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                        {merged.length > 4 && (
                                            <button
                                                onClick={onShowAllSpecsToggle}
                                                className="mt-4 w-full py-2.5 rounded-xl border border-white/10 text-slate-300 hover:text-primary hover:border-primary/40 text-sm font-bold flex items-center justify-center gap-2 transition-colors bg-white/2 hover:bg-primary/5"
                                            >
                                                {showAllSpecs ? (
                                                    <><Minus className="w-4 h-4" />إخفاء المواصفات</>
                                                ) : (
                                                    <><Plus className="w-4 h-4" />عرض كل المواصفات ({merged.length - 4} إضافية)</>
                                                )}
                                            </button>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    )}

                    {activeTab === 'video' && product.videos && product.videos.length > 0 && (
                        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {product.videos.map((video, idx) => {
                                const embedUrl = getEmbedUrl(video.url);
                                if (!embedUrl) return null;
                                const isFB = video.url.includes('facebook') || video.url.includes('fb.watch');
                                return (
                                    <div key={idx} className="glass-panel rounded-2xl overflow-hidden border border-white/10 shadow-xl">
                                        <div className="flex items-center gap-3 px-5 py-3 bg-white/5 border-b border-white/10">
                                            <span className="size-7 rounded-full bg-primary/20 border border-primary/30 text-primary text-sm font-black flex items-center justify-center">{idx + 1}</span>
                                            <h3 className="text-white font-bold text-base flex-1">{video.title || `فيديو رقم ${idx + 1}`}</h3>
                                            {video.is_featured && (
                                                <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded uppercase font-bold">مميز</span>
                                            )}
                                            {isFB && (
                                                <span className="text-[10px] bg-blue-700 text-white px-2 py-0.5 rounded font-bold">Facebook</span>
                                            )}
                                        </div>
                                        {isFB ? (
                                            <div className="aspect-video w-full bg-gradient-to-br from-[#1877f2]/10 to-black/60 flex flex-col items-center justify-center gap-4 p-8 text-center">
                                                <div className="size-16 rounded-full bg-[#1877f2]/20 border border-[#1877f2]/30 flex items-center justify-center">
                                                    <PlayCircle className="w-10 h-10 text-[#1877f2]" />
                                                </div>
                                                <p className="text-slate-300 text-sm">فيديو Facebook — اضغط للمشاهدة في صفحة جديدة</p>
                                                <a
                                                    href={video.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-5 py-2 bg-[#1877f2] hover:bg-[#1565d8] text-white rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
                                                >
                                                    <PlayCircle className="w-4 h-4" />
                                                    مشاهدة على Facebook
                                                </a>
                                            </div>
                                        ) : (
                                            <div className="aspect-video w-full bg-black/50 overflow-hidden">
                                                <LazyYouTube
                                                    embedUrl={embedUrl}
                                                    videoUrl={video.url}
                                                    title={video.title || `فيديو رقم ${idx + 1}`}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'reviews' && (
                        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {product.reviews && product.reviews.length > 0 && (
                                <div className="glass-panel p-4 sm:p-6 rounded-2xl flex flex-wrap gap-4 sm:gap-8 items-center bg-gradient-to-br from-surface-dark to-transparent">
                                    <div className="flex flex-col items-center justify-center gap-1 min-w-[120px] sm:min-w-[140px] border-l border-white/5 pl-4 sm:pl-8">
                                        <span className="text-6xl font-extrabold text-white tracking-tighter">{product.averageRating}</span>
                                        <div className="flex text-yellow-400 gap-0.5 my-1">
                                            {Array.from({ length: 5 }).map((_, i) => (
                                                <Star key={i} className={`w-6 h-6 ${i < Math.floor(product.averageRating || 0) ? 'fill-current' : ''}`} />
                                            ))}
                                        </div>
                                        <span className="text-slate-400 text-sm font-medium">بناءً على {product.reviewCount} تقييم</span>
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
                            )}

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

                    {activeTab === 'faq' && product.faq && product.faq.length > 0 && (
                        <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center gap-2 mb-2">
                                <HelpCircle className="w-6 h-6 text-primary" />
                                <h3 className="text-xl font-bold text-white">الأسئلة الشائعة حول المنتج</h3>
                            </div>
                            <div className="grid gap-4">
                                {product.faq.map((item, idx) => (
                                    <div key={idx} className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-primary/20 transition-all group">
                                        <div className="flex gap-4">
                                            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold">؟</div>
                                            <div className="flex flex-col gap-2">
                                                <h4 className="text-white font-bold text-base group-hover:text-primary transition-colors">{item.question}</h4>
                                                <p className="text-slate-400 text-sm leading-relaxed">{item.answer}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="glass-panel rounded-2xl p-6 border border-white/10">
                        <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">add_link</span>
                            اشتروه معاً عادة
                        </h4>
                        <div className="flex flex-col gap-4">
                            {topTwo.map((rp: Product) => (
                                <div key={rp.id} className="flex gap-3 items-center group cursor-pointer p-2 rounded-xl hover:bg-white/5 transition-colors">
                                    <Link to={`/product/${rp.slug || rp.id}`} className="size-16 rounded-lg bg-surface-dark border border-white/5 overflow-hidden flex-shrink-0 relative">
                                        <img src={rp.images.find(img => img.isPrimary)?.url || rp.images[0]?.url || 'https://via.placeholder.com/64'} alt={rp.name} width="64" height="64" className="w-full h-full object-contain" />
                                    </Link>
                                    <div className="flex flex-col flex-1">
                                        <Link to={`/product/${rp.slug || rp.id}`}>
                                            <h5 className="text-slate-200 text-xs font-medium group-hover:text-primary transition-colors line-clamp-1">{rp.name}</h5>
                                        </Link>
                                        <div className="flex justify-between items-center mt-1">
                                            <span className="text-brand-red font-bold text-sm">
                                                {(rp.discountPrice ? parseFloat(rp.discountPrice) : parseFloat(rp.price)).toLocaleString()} ج.م
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    const effectivePrice = rp.discountPrice ? parseFloat(rp.discountPrice) : parseFloat(rp.price);
                                                    addToCart({
                                                        id: rp.id,
                                                        name: rp.name,
                                                        price: effectivePrice,
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
                            {topTwo.length === 0 && (
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

                    {product.videos && product.videos.length > 0 && product.videos.some(v => v.is_featured) && (() => {
                        const featured = product.videos.find(v => v.is_featured);
                        if (!featured) return null;
                        const embedUrl = getEmbedUrl(featured.url);
                        if (!embedUrl) return null;

                        return (
                            <div className="glass-panel p-6 rounded-2xl overflow-hidden relative border border-white/10">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-3xl rounded-full -z-10"></div>
                                <h4 className="text-white font-bold mb-4 flex items-center justify-between">
                                    {featured.title || 'فيديو المنتج'}
                                    <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded uppercase font-bold text-center">شاهد الآن</span>
                                </h4>
                                <div
                                    onClick={onVideoTab}
                                    className="aspect-video w-full rounded-xl bg-black/50 overflow-hidden relative group cursor-pointer border border-white/10 shadow-lg"
                                >
                                    <div className="absolute inset-0 z-20 transition-transform group-hover:bg-black/20 bg-transparent flex items-center justify-center">
                                        <div className="size-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity">
                                            <PlayCircle className="w-8 h-8 text-white" />
                                        </div>
                                    </div>
                                    {/* Sidebar preview: static thumbnail only — no iframe loaded here */}
                                    {(() => {
                                        const vid = getYouTubeId(featured.url);
                                        return vid ? (
                                            <img
                                                src={`https://i.ytimg.com/vi/${vid}/mqdefault.jpg`}
                                                alt={featured.title || 'فيديو المنتج'}
                                                className="w-full h-full absolute inset-0 object-cover opacity-80"
                                                loading="lazy"
                                                width="320" height="180"
                                            />
                                        ) : null;
                                    })()}
                                </div>
                                <p className="text-slate-400 text-xs mt-3 leading-relaxed italic">اضغط لمشاهدة الفيديو كاملاً في قسم الفيديو أعلاه.</p>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
}
