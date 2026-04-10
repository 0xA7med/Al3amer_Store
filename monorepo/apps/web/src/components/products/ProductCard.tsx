import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../hooks/useWishlist';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

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
    stock = 1, // Default to available if not provided
    slug,
    badge,
    mobileHorizontal = false,
}: ProductCardProps) {
    const { addToCart, items } = useCart();
    const { isAuthenticated } = useAuth();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const navigate = useNavigate();
    const isOutOfStock = stock <= 0;
    const isInCart = items.some(item => item.id === id);
    const isWishlisted = isInWishlist(id);
    const discountPercentage = originalPrice
        ? Math.round(((originalPrice - price) / originalPrice) * 100)
        : 0;

    const renderStars = () => {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            stars.push(
                <span
                    key={i}
                    className={`material-symbols-outlined ${i <= rating ? 'symbol-filled text-yellow-400' : 'text-gray-600'} text-[18px]`}
                >
                    star
                </span>
            );
        }
        return stars;
    };

    return (
        <div className={`glass-card rounded-2xl overflow-hidden group flex ${mobileHorizontal ? 'flex-row sm:flex-col' : 'flex-col'} h-full relative p-0 hover:z-10 transition-all duration-300 hover:shadow-[0_0_30px_rgba(19,91,236,0.15)] hover:border-primary/30`}>
            {/* Background Glow on Hover */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            {/* Action Buttons (Floating) - hover-only on desktop */}
            <div className="absolute top-3 left-3 z-20 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (!isAuthenticated) {
                            navigate('/login');
                            return;
                        }
                        toggleWishlist(id);
                    }}
                    className={`size-8 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center transition-all ${isWishlisted ? 'text-red-500 bg-red-500/10 border-red-500/20' : 'text-gray-400 hover:text-red-500 hover:border-red-500/50'}`}
                >
                    <span className={`material-symbols-outlined text-[18px] ${isWishlisted ? 'filled' : ''}`}>favorite</span>
                </button>
                <button className="size-8 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary/50 transition-all">
                    <span className="material-symbols-outlined text-[18px]">compare_arrows</span>
                </button>
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const shareUrl = `${window.location.origin}/product/${slug || id}`;
                        if (navigator.share) {
                            navigator.share({
                                title: name,
                                text: `اكتشف ${name} بمتجر العامر`,
                                url: shareUrl,
                            }).catch(() => {});
                        } else {
                            navigator.clipboard.writeText(shareUrl);
                            toast.success('تم نسخ الرابط');
                        }
                    }}
                    className="size-8 rounded-lg bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center text-gray-400 hover:text-primary hover:border-primary/50 transition-all"
                    title="مشاركة"
                >
                    <span className="material-symbols-outlined text-[18px]">share</span>
                </button>
            </div>

            {/* Badge */}
            {(badge || isOutOfStock) && (
                <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
                    <span
                        className={`text-white text-[10px] font-bold px-2.5 py-1 rounded-md backdrop-blur-md shadow-lg border border-white/10 ${isOutOfStock
                            ? 'bg-slate-700/80 shadow-slate-900/20'
                            : badge?.type === 'discount'
                                ? 'bg-accent-red/80 shadow-red-900/20'
                                : 'bg-primary/80 shadow-blue-900/20'
                            }`}
                    >
                        {isOutOfStock ? 'نفذت الكمية' : badge?.text}
                    </span>
                </div>
            )}
            {!badge && discountPercentage > 0 && (
                <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
                    <span className="text-white text-[10px] font-bold px-2.5 py-1 rounded-md backdrop-blur-md shadow-lg bg-accent-red/80 shadow-red-900/20 border border-white/10">
                        -{discountPercentage}%
                    </span>
                </div>
            )}

            {/* Image Section */}
            <Link
                to={`/product/${slug || id}`}
                className={`relative overflow-hidden flex items-center justify-center p-3 sm:p-6 bg-gradient-to-b from-white/5 to-transparent shrink-0 ${mobileHorizontal ? 'w-[130px] sm:w-full sm:aspect-[4/3]' : 'w-full aspect-[4/3]'} ${isOutOfStock ? 'opacity-60' : ''}`}
            >
                {/* Image Glow */}
                <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full scale-0 group-hover:scale-100 transition-transform duration-700 opacity-0 group-hover:opacity-40" />
                <div
                    className={`w-full h-full bg-contain bg-center bg-no-repeat transition-transform duration-700 group-hover:scale-110 drop-shadow-[0_10px_20px_rgba(0,0,0,0.3)] group-hover:drop-shadow-[0_20px_40px_rgba(19,91,236,0.2)] ${isOutOfStock ? 'grayscale' : ''}`}
                    style={{ backgroundImage: `url('${imageUrl}')` }}
                />
            </Link>

            {/* Content Section */}
            <div className={`p-3 sm:p-5 flex flex-col flex-1 bg-[#1e293b]/40 backdrop-blur-sm ${mobileHorizontal ? 'border-r sm:border-r-0 sm:border-t' : 'border-t'} border-white/5`}>
                <div className="mb-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest truncate max-w-[50%]">{brand}</span>
                        <div className="flex text-yellow-500 gap-[1px] shrink-0">{renderStars()}</div>
                    </div>
                    <Link to={`/product/${slug || id}`}>
                        <h3 className="text-white font-bold text-base leading-snug line-clamp-2 group-hover:text-primary transition-colors cursor-pointer">
                            {name}
                        </h3>
                    </Link>
                </div>

                {/* Price & Add to Cart */}
                <div className="mt-auto pt-4 flex items-end justify-between gap-2 border-t border-white/5">
                    <div className="flex flex-col">
                        {originalPrice && (
                            <span className="text-gray-500 text-xs font-bold line-through decoration-red-500/60 decoration-1 mb-0.5">
                                {originalPrice.toLocaleString()} ج.م
                            </span>
                        )}
                        <div className="flex items-baseline gap-1">
                            <span className="text-white text-xl font-bold tracking-tight">
                                {price.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase">ج.م</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            disabled={isOutOfStock}
                            onClick={(e) => {
                                e.preventDefault();
                                addToCart({ id, name, price, image: imageUrl });
                                navigate('/checkout');
                            }}
                            className={`h-10 px-4 rounded-xl text-white text-[11px] font-bold border transition-all hidden sm:flex items-center justify-center ${isOutOfStock
                                ? 'bg-white/5 border-white/5 text-gray-500 cursor-not-allowed'
                                : 'bg-white/5 hover:bg-white/10 border-white/10'
                                }`}
                        >
                            {isOutOfStock ? 'غير متوفر' : 'شراء الآن'}
                        </button>
                        <button
                            disabled={isOutOfStock}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                addToCart({ id, name, price, image: imageUrl });
                                if (!isInCart) {
                                    toast.success('تم إضافة المنتج للسلة بنجاح');
                                }
                            }}
                            className={`size-10 rounded-xl text-white flex items-center justify-center transition-all shadow-lg active:scale-95 group/btn ${isOutOfStock
                                ? 'bg-slate-800 text-gray-500 cursor-not-allowed border-white/5'
                                : isInCart
                                    ? 'bg-emerald-500 border border-emerald-500/30'
                                    : 'bg-primary hover:bg-blue-500 shadow-primary/20 hover:shadow-primary/40'
                                }`}
                            title={isOutOfStock ? 'نفذت الكمية' : isInCart ? 'مضاف للسلة' : 'أضف للسلة'}
                        >
                            <span className={`material-symbols-outlined text-[20px] transition-transform ${isOutOfStock ? '' : isInCart ? '' : 'group-hover/btn:scale-110'}`}>
                                {isOutOfStock ? 'block' : isInCart ? 'check_circle' : 'shopping_cart'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProductCard;
