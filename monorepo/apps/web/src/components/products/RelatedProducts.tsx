import { Link } from 'react-router-dom';
import { Heart, Check, ShoppingCart, ChevronLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Product } from '../../hooks/useProducts';
import type { CartItem } from '../../context/CartContext';

interface RelatedProductsProps {
    relatedProducts: Product[];
    addToCart: (item: any) => void;
    items: CartItem[];
    title?: string;
    subtitle?: string;
}

export function RelatedProducts({ 
    relatedProducts, 
    addToCart, 
    items, 
    title = "منتجات قد تعجبك",
    subtitle = "تم اختيارها بناءً على اهتماماتك"
}: RelatedProductsProps) {
    if (relatedProducts.length === 0) return null;

    return (
        <div className="mt-20 mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <span className="w-1.5 h-6 bg-brand-red rounded-full block"></span>
                        {title}
                    </h2>
                    <p className="text-slate-400 text-sm mt-1 pr-4">{subtitle}</p>
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
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {relatedProducts.map((rp: Product) => {
                    const rpPrice = rp.discountPrice ? parseFloat(rp.discountPrice) : parseFloat(rp.price);
                    const rpIsInCart = items.some(item => item.id === rp.id);
                    return (
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
                                    <div className="flex flex-col">
                                        {rp.discountPrice && (
                                            <span className="text-[10px] text-slate-500 line-through">
                                                {parseFloat(rp.price).toLocaleString()} ج.م
                                            </span>
                                        )}
                                        <span className="text-lg font-bold text-brand-red">
                                            {rpPrice.toLocaleString()} ج.م
                                        </span>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            if (rp.stock <= 0) {
                                                toast.error('هذا المنتج غير متوفر حالياً');
                                                return;
                                            }
                                            addToCart({
                                                id: rp.id,
                                                name: rp.name,
                                                price: rpPrice,
                                                image: rp.images.find(img => img.isPrimary)?.url || rp.images[0]?.url,
                                                quantity: 1,
                                                stock: rp.stock,
                                            });
                                            if (!rpIsInCart) toast.success('تم إضافة المنتج للسلة');
                                        }}
                                        disabled={rp.stock <= 0}
                                        className={`size-10 rounded-xl text-white flex items-center justify-center transition-all border ${
                                            rp.stock <= 0
                                                ? 'bg-slate-700 border-slate-600 cursor-not-allowed opacity-50'
                                                : rpIsInCart
                                                    ? 'bg-emerald-500 border-emerald-500/30 shadow-lg shadow-emerald-900/25'
                                                    : 'bg-white/5 hover:bg-primary border-white/10 group-hover:border-primary'
                                        }`}
                                        title={rp.stock <= 0 ? 'غير متوفر' : (rpIsInCart ? 'مضاف للسلة' : 'أضف للسلة')}
                                    >
                                        {rp.stock <= 0
                                            ? <span className="text-[9px] font-bold">نفذ</span>
                                            : rpIsInCart
                                                ? <Check className="w-5 h-5" />
                                                : <ShoppingCart className="w-5 h-5" />
                                        }
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Link>
                    );
                })}
            </div>
        </div>
    );
}
