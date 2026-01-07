import { Link } from 'react-router-dom';

interface ProductCardProps {
    id: string;
    name: string;
    brand: string;
    price: number;
    originalPrice?: number;
    rating: number;
    reviewCount: number;
    imageUrl: string;
    badge?: {
        type: 'discount' | 'new';
        text: string;
    };
}

export function ProductCard({
    id,
    name,
    brand,
    price,
    originalPrice,
    rating,
    reviewCount,
    imageUrl,
    badge,
}: ProductCardProps) {
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
        <div className="glass-card rounded-2xl overflow-hidden group flex flex-col h-full relative p-0 hover:z-10">
            {/* Badge */}
            {badge && (
                <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
                    <span
                        className={`text-white text-[11px] font-bold px-3 py-1 rounded-lg backdrop-blur-md shadow-lg ${badge.type === 'discount'
                                ? 'bg-accent-red shadow-red-900/20'
                                : 'bg-primary shadow-blue-900/20'
                            }`}
                    >
                        {badge.text}
                    </span>
                </div>
            )}

            {/* Image */}
            <Link
                to={`/product/${id}`}
                className="relative w-full aspect-[4/3] bg-gradient-to-b from-white/5 to-transparent p-6 flex items-center justify-center overflow-hidden"
            >
                <div
                    className="w-full h-full bg-contain bg-center bg-no-repeat transition-transform duration-500 group-hover:scale-110 drop-shadow-2xl"
                    style={{ backgroundImage: `url('${imageUrl}')` }}
                />
            </Link>

            {/* Content */}
            <div className="p-5 flex flex-col flex-1 border-t border-white/5 bg-gradient-to-b from-[#1e293b]/20 to-[#1e293b]/60">
                {/* Title */}
                <div className="mb-2">
                    <Link to={`/product/${id}`}>
                        <h3 className="text-white font-bold text-lg leading-snug line-clamp-2 hover:text-primary transition-colors cursor-pointer">
                            {name}
                        </h3>
                    </Link>
                    <span className="text-xs text-gray-500">{brand}</span>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1.5 mb-4">
                    <div className="flex text-yellow-400 text-sm gap-[1px]">{renderStars()}</div>
                    <span className="text-xs text-gray-400 font-medium font-['Manrope'] pt-0.5">
                        ({reviewCount})
                    </span>
                </div>

                {/* Price & Add to Cart */}
                <div className="mt-auto flex items-end justify-between gap-2">
                    <div className="flex flex-col gap-0.5">
                        {originalPrice && (
                            <span className="text-gray-500 text-sm font-['Manrope'] line-through decoration-red-500/60 decoration-1">
                                {originalPrice.toLocaleString()}
                            </span>
                        )}
                        <div className="flex items-baseline gap-1">
                            <span className="text-white text-2xl font-bold font-['Manrope']">
                                {price.toLocaleString()}
                            </span>
                            <span className="text-xs text-gray-400 font-medium">ج.م</span>
                        </div>
                    </div>
                    <button
                        className={`size-11 rounded-xl text-white flex items-center justify-center transition-all shadow-lg hover:scale-110 active:scale-95 group/btn ${originalPrice
                                ? 'bg-primary hover:bg-primary-dark shadow-primary/20'
                                : 'bg-gray-700 hover:bg-primary shadow-primary/20'
                            }`}
                    >
                        <span className="material-symbols-outlined group-hover/btn:animate-pulse">
                            add_shopping_cart
                        </span>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default ProductCard;
