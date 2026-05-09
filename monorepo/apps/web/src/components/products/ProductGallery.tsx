import { Heart, Share2, PlayCircle, ZoomIn } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Product } from '../../hooks/useProducts';

interface ProductGalleryProps {
    images: string[];
    product: Product;
    activeImageIndex: number;
    hasDiscount: boolean;
    discountPercent: number;
    isWishlisted: boolean;
    isAuthenticated: boolean;
    onWishlistToggle: (id: string) => void;
    onImageSelect: (index: number) => void;
    onZoomOpen: () => void;
    onVideoTab: () => void;
}

export function ProductGallery({
    images,
    product,
    activeImageIndex,
    hasDiscount,
    discountPercent,
    isWishlisted,
    isAuthenticated,
    onWishlistToggle,
    onImageSelect,
    onZoomOpen,
    onVideoTab,
}: ProductGalleryProps) {
    return (
        <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="w-full aspect-[4/3] rounded-2xl glass-panel relative overflow-hidden group">
                <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
                    {hasDiscount && (
                        <span className="px-3 py-1.5 bg-brand-red/90 backdrop-blur text-white text-xs font-bold rounded-lg shadow-lg shadow-red-900/20 border border-red-500/30">
                            خصم {discountPercent}%
                        </span>
                    )}
                </div>
                <div className="absolute top-3 left-3 z-30 flex gap-2">
                    <button
                        onClick={() => {
                            if (!isAuthenticated) {
                                toast.error('يرجى تسجيل الدخول لإضافة المنتج للمفضلة');
                                return;
                            }
                            if (product?.id) onWishlistToggle(product.id);
                        }}
                        className={`size-9 rounded-xl flex items-center justify-center backdrop-blur-md border shadow-lg transition-all ${
                            isWishlisted
                                ? 'bg-red-500/90 border-red-400/50 text-white'
                                : 'bg-surface-dark/80 border-white/10 text-slate-300 hover:bg-red-500/80 hover:text-white hover:border-red-400/30'
                        }`}
                    >
                        <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-current' : ''}`} />
                    </button>
                    <button
                        onClick={async () => {
                            const shareUrl = window.location.href;
                            if (navigator.share) {
                                try { await navigator.share({ title: product.name, url: shareUrl }); }
                                catch (err) { if ((err as any).name !== 'AbortError') toast.error('فشلت عملية المشاركة'); }
                            } else {
                                navigator.clipboard.writeText(shareUrl);
                                toast.success('تم نسخ الرابط');
                            }
                        }}
                        className="size-9 rounded-xl flex items-center justify-center backdrop-blur-md border bg-surface-dark/80 border-white/10 text-slate-300 hover:bg-primary/80 hover:text-white hover:border-primary/30 shadow-lg transition-all"
                    >
                        <Share2 className="w-4 h-4" />
                    </button>
                </div>
                <div
                    className="w-full h-full bg-surface-dark/50 flex items-center justify-center p-4 sm:p-8 transition-transform duration-500 cursor-zoom-in relative"
                    onClick={onZoomOpen}
                >
                    <img
                        src={images[activeImageIndex] || images[0]}
                        alt={product.name}
                        className="w-full h-full object-contain transform group-hover:scale-105 transition-transform duration-500"
                    />
                </div>
                <button
                    onClick={onZoomOpen}
                    className="absolute bottom-4 left-4 p-2.5 rounded-xl bg-surface-dark/80 text-white hover:bg-primary transition-all backdrop-blur-md border border-white/10 hover:border-primary shadow-lg"
                >
                    <ZoomIn className="w-5 h-5" />
                </button>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                {images.map((img, idx) => (
                    <button
                        key={idx}
                        onClick={() => onImageSelect(idx)}
                        className={`relative size-16 md:size-24 rounded-xl border-2 transition-all overflow-hidden flex-shrink-0 bg-surface-dark shadow-lg ${activeImageIndex === idx ? 'border-primary shadow-primary/10' : 'border-transparent hover:border-slate-500 opacity-70 hover:opacity-100'
                            }`}
                    >
                        <img src={img} alt={`${product.name} - ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                ))}
                {product.videos && product.videos.length > 0 && (
                    <button
                        onClick={onVideoTab}
                        className="relative size-16 md:size-24 rounded-xl border-2 border-transparent hover:border-primary overflow-hidden flex-shrink-0 bg-surface-dark transition-all opacity-70 hover:opacity-100 flex items-center justify-center group"
                    >
                        <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors"></div>
                        <PlayCircle className="w-8 h-8 text-white relative z-10 transform group-hover:scale-110 transition-transform" />
                    </button>
                )}
            </div>
        </div>
    );
}
