import { Check, ShoppingCart, ShoppingBag } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../../hooks/useProducts';

interface StickyMobileCartProps {
    displayProduct: Product;
    images: string[];
    hasDiscount: boolean;
    discountPrice: number | null;
    price: number;
    discountPercent: number;
    isInCart: boolean;
    showStickyCart: boolean;
    addToCart: (item: any) => void;
}

export function StickyMobileCart({
    displayProduct,
    images,
    hasDiscount,
    discountPrice,
    price,
    discountPercent,
    isInCart,
    showStickyCart,
    addToCart,
}: StickyMobileCartProps) {
    const navigate = useNavigate();

    return (
        <AnimatePresence>
            {showStickyCart && (
                <motion.div
                    initial={{ y: 120, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 120, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
                >
                    <div className="h-6 bg-gradient-to-t from-background-dark/80 to-transparent pointer-events-none" />

                    <div className="bg-[#0f172a]/98 backdrop-blur-2xl border-t border-white/8 px-4 pt-3 pb-6 shadow-[0_-4px_30px_rgba(0,0,0,0.6)]">
                        <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-primary/60 to-transparent rounded-full" />

                        <div className="flex items-center gap-3 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-surface-dark border border-white/10 overflow-hidden flex-shrink-0">
                                <img src={images[0]} alt={displayProduct.name} className="w-full h-full object-contain p-1" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-bold text-sm truncate">{displayProduct.name}</p>
                                <div className="flex items-baseline gap-1.5">
                                    <span className="text-brand-red font-extrabold text-lg leading-none">
                                        {(hasDiscount ? discountPrice : price)?.toLocaleString('ar-EG', { useGrouping: false })}
                                    </span>
                                    <span className="text-slate-400 text-xs font-medium">ج.م</span>
                                    {hasDiscount && (
                                        <span className="text-slate-500 text-[11px] line-through">{price.toLocaleString('ar-EG', { useGrouping: false })}</span>
                                    )}
                                </div>
                            </div>
                            {hasDiscount && (
                                <span className="flex-shrink-0 text-[10px] font-black text-white bg-brand-red px-2 py-0.5 rounded-md">
                                    -{discountPercent}%
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => {
                                    addToCart({
                                        id: displayProduct.id,
                                        name: displayProduct.name,
                                        price: hasDiscount ? discountPrice! : price,
                                        image: images[0],
                                        quantity: 1,
                                        sku: displayProduct.sku,
                                        stock: displayProduct.stock,
                                    });
                                    if (!isInCart) toast.success('تم إضافة المنتج للسلة');
                                }}
                                disabled={displayProduct.stock === 0}
                                className={`flex-1 h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.97] border ${
                                    isInCart
                                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                                        : 'bg-white/8 border-white/12 text-white hover:bg-white/12'
                                }`}
                            >
                                {isInCart ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
                                {isInCart ? 'مضاف للسلة' : 'أضف للسلة'}
                            </button>
                            <button
                                onClick={() => {
                                    addToCart({
                                        id: displayProduct.id,
                                        name: displayProduct.name,
                                        price: hasDiscount ? discountPrice! : price,
                                        image: images[0],
                                        quantity: 1,
                                        sku: displayProduct.sku,
                                        stock: displayProduct.stock,
                                    });
                                    navigate('/checkout');
                                }}
                                disabled={displayProduct.stock === 0}
                                className="flex-1 h-12 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-primary hover:bg-blue-500 disabled:bg-slate-700 text-white shadow-lg shadow-primary/25 transition-all active:scale-[0.97]"
                            >
                                <ShoppingBag className="w-4 h-4" />
                                شراء الآن
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
