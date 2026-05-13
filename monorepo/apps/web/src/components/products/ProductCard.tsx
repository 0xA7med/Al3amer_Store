import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../hooks/useWishlist';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { optimizeImage, buildSrcset } from '../../lib/image-optimizer';

interface ProductCardProps {
    id: string;
    name: string;
    brand: string;
    price: number;
    originalPrice?: number;
    rating: number;
    imageUrl: string;
    stock?: number;
    slug?: string | null;
    badge?: {
        type: 'discount' | 'new' | 'out_of_stock';
        text: string;
    };
    mobileHorizontal?: boolean;
}

export function ProductCard({
    id,
    name,
    brand,
    price,
    originalPrice,
    rating,
    imageUrl,
    stock = 1,
    slug,
    badge,
    mobileHorizontal = false,
}: ProductCardProps) {
    const { addToCart, items } = useCart();
    const { isAuthenticated } = useAuth();
    const { toggleWishlist, isInWishlist, isToggling } = useWishlist();
    const navigate = useNavigate();
    const isOutOfStock = stock <= 0;
    const isInCart = items.some(item => item.id === id);
    const isWishlisted = isInWishlist(id);
    const discountPercentage = originalPrice
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0;

    return (
        <div className={`glass-card rounded-2xl overflow-hidden group flex ${mobileHorizontal ? 'flex-row sm:flex-col' : 'flex-col'} h-full relative p-0 hover:z-10 transition-all duration-300 hover:shadow-[0_0_30px_rgba(19,91,236,0.15)] hover:border-primary/30 ${isToggling ? 'opacity-80' : ''}`}>
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Floating Actions - desktop hover only */}
            <div className="absolute top-2 left-2 z-20 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 sm:flex hidden transition-all duration-300 translate-x-3 group-hover:translate-x-0">
                <button
                    disabled={isToggling}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isAuthenticated) return navigate('/login');
                        toggleWishlist(id);
                    }}
                    aria-label={isWishlisted ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                    className={`size-8 rounded-lg bg-black/40 backdrop-blur-md border flex items-center justify-center transition-all ${isWishlisted ? 'text-red-400 bg-red-500/10 border-red-500/30' : 'text-gray-400 hover:text-red-400 border-white/10'} ${isToggling ? 'animate-pulse' : ''}`}
                >
                    <span className={`material-symbols-outlined text-[17px] ${isWishlisted ? 'symbol-filled' : ''}`}>favorite</span>
                </button>
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const shareUrl = `${window.location.origin}/product/${slug || id}`;
                        if (navigator.share) {
                            navigator.share({ title: name, text: `اكتشف ${name}`, url: shareUrl }).catch(() => {});
                        } else {
                            navigator.clipboard.writeText(shareUrl);
                            toast.success('تم نسخ الرابط');
                        }
                    }}
                    aria-label="مشاركة المنتج"
                    className="size-8 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-gray-400 hover:text-primary transition-all"
                >
                    <span className="material-symbols-outlined text-[17px]">share</span>
                </button>
            </div>

            {/* Mobile wishlist button - always visible top-left */}
            <button
                disabled={isToggling}
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!isAuthenticated) return navigate('/login');
                    toggleWishlist(id);
                }}
                aria-label={isWishlisted ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
                className={`absolute top-2 left-2 z-20 sm:hidden size-7 rounded-lg backdrop-blur-md border flex items-center justify-center transition-all ${isWishlisted ? 'text-red-400 bg-red-500/10 border-red-500/30' : 'text-gray-400 bg-black/30 border-white/10'} ${isToggling ? 'animate-pulse' : ''}`}
            >
                <span className={`material-symbols-outlined text-[15px] ${isWishlisted ? 'symbol-filled' : ''}`}>favorite</span>
            </button>


            {/* Badges */}
            <div className="absolute top-2 right-2 z-20 flex flex-col gap-1">
                {isOutOfStock && (
                    <span className="text-white text-[9px] font-bold px-2 py-0.5 rounded-md bg-slate-700/90 backdrop-blur-sm border border-white/10">
                        نفذت الكمية
                    </span>
                )}
                {!isOutOfStock && badge && (
                    <span className={`text-white text-[9px] font-bold px-2 py-0.5 rounded-md backdrop-blur-sm border border-white/10 ${badge.type === 'discount' ? 'bg-accent-red/80' : 'bg-primary/80'}`}>
                        {badge.text}
                    </span>
                )}
                {!isOutOfStock && !badge && discountPercentage > 0 && (
                    <span className="text-white text-[9px] font-bold px-2 py-0.5 rounded-md bg-accent-red/80 backdrop-blur-sm border border-white/10">
                        -{discountPercentage}%
                    </span>
                )}
            </div>

            {/* Image */}
            <Link
                to={`/product/${slug || id}`}
                className={`relative overflow-hidden flex items-center justify-center bg-gradient-to-b from-white/5 to-transparent shrink-0 aspect-[4/3] min-h-[160px] sm:min-h-[240px] ${mobileHorizontal ? 'w-[110px] sm:w-full p-2 sm:p-5' : 'w-full p-3 sm:p-6'} ${isOutOfStock ? 'opacity-55' : ''}`}
            >
                <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full scale-0 group-hover:scale-100 transition-transform duration-700 opacity-0 group-hover:opacity-40" />
                <img
                    src={optimizeImage(imageUrl, 400)}
                    srcSet={buildSrcset(imageUrl, [200, 400])}
                    sizes="(max-width: 640px) 200px, 400px"
                    alt={name}
                    loading="lazy"
                    width="400"
                    height="300"
                    className={`w-full h-full object-contain object-center transition-transform duration-700 group-hover:scale-105 drop-shadow-[0_8px_16px_rgba(0,0,0,0.3)] ${isOutOfStock ? 'grayscale' : ''}`}
                />
            </Link>

            {/* Content */}
            <div className={`flex flex-col flex-1 ${mobileHorizontal ? 'p-2.5 sm:p-4' : 'p-2.5 sm:p-4'} bg-[#1e293b]/40 backdrop-blur-sm border-t border-white/5`}>
                
                {/* Brand & Rating */}
                <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[9px] sm:text-[10px] font-bold text-primary uppercase tracking-widest truncate max-w-[55%]">{brand}</span>
                    <div className="flex items-center gap-0.5 shrink-0">
                        <span className="material-symbols-outlined symbol-filled text-yellow-400 text-[12px]">star</span>
                        <span className="text-[9px] text-gray-400 font-bold">{rating.toFixed(1)}</span>
                    </div>
                </div>

                {/* Product Name */}
                <Link to={`/product/${slug || id}`}>
                    <h3 className="text-white font-semibold text-[12px] sm:text-[13px] leading-snug line-clamp-2 group-hover:text-primary/90 transition-colors mb-2 cursor-pointer min-h-[32px] sm:min-h-[38px]">
                        {name}
                    </h3>
                </Link>

                {/* Price + Buttons */}
                <div className="mt-auto flex items-center justify-between gap-1.5 pt-2 border-t border-white/5 min-h-[44px]">
                    {/* Price */}
                    <div className="flex flex-col min-w-0">
                        {originalPrice ? (
                            <span className="text-gray-400 text-[9px] font-bold line-through decoration-red-500/60 leading-none mb-0.5 h-3">
                                {originalPrice.toLocaleString()}
                            </span>
                        ) : (
                            <div className="h-3" /> /* Fixed height placeholder for price row */
                        )}
                        <div className="flex items-baseline gap-0.5">
                            <span className="text-white text-[15px] sm:text-lg font-bold tracking-tight leading-none">
                                {price.toLocaleString()}
                            </span>
                            <span className="text-[8px] sm:text-[9px] text-gray-400 font-bold">ج.م</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    {isOutOfStock ? (
                        <span className="text-[9px] text-gray-400 font-bold bg-white/5 border border-white/5 rounded-lg px-2.5 py-1.5 shrink-0">
                            غير متوفر
                        </span>
                    ) : (
                        <div className="flex items-center gap-1.5 shrink-0">
                            {/* Buy Now - visible on all sizes */}
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    addToCart({ id, name, price, image: imageUrl });
                                    navigate('/checkout');
                                }}
                                className="h-8 sm:h-9 px-2.5 sm:px-3.5 rounded-xl text-white text-[10px] sm:text-[11px] font-bold border border-white/10 bg-white/5 hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center"
                            >
                                شراء
                            </button>
                            {/* Add to Cart */}
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    addToCart({ id, name, price, image: imageUrl });
                                    if (!isInCart) toast.success('تم الإضافة للسلة');
                                }}
                                aria-label={isInCart ? 'مضاف للسلة' : 'أضف للسلة'}
                                className={`size-8 sm:size-9 rounded-xl text-white flex items-center justify-center transition-all active:scale-95 shadow-lg ${isInCart
                                    ? 'bg-emerald-500 border border-emerald-500/30 shadow-emerald-900/20'
                                    : 'bg-primary hover:bg-blue-500 shadow-primary/20 hover:shadow-primary/40'
                                    }`}
                                title={isInCart ? 'مضاف للسلة' : 'أضف للسلة'}
                            >
                                <span className="material-symbols-outlined text-[17px] sm:text-[19px]">
                                    {isInCart ? 'check_circle' : 'shopping_cart'}
                                </span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ProductCard;
