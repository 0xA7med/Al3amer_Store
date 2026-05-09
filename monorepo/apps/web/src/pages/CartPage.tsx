import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../hooks/useWishlist';
import { CheckoutProgressBar } from '../components/checkout';
import SEOHead from '../components/SEO/SEOHead';

export function CartPage() {
    const { items: cartItems, updateQuantity, removeFromCart, totalPrice: subtotal, addToCart } = useCart();
    const { wishlist } = useWishlist();

    // Filter wishlist items that are not already in the cart
    const suggestedItems = wishlist.filter(wItem => !cartItems.find(cItem => cItem.id === wItem.productId)).slice(0, 4);
    const [couponCode, setCouponCode] = useState('');
    const [couponApplied, setCouponApplied] = useState(false);

    const discount = couponApplied ? Math.round(subtotal * 0.1) : 0;
    const total = subtotal - discount;

    const handleApplyCoupon = () => {
        if (couponCode.toLowerCase() === 'al3amer10') {
            setCouponApplied(true);
        }
    };

    return (
        <div className="max-w-7xl mx-auto w-full px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
            <SEOHead title="سلة التسوق" description="سلة التسوق الخاصة بك في مركز العامر" noindex />
            {/* Progress Steps */}
            <CheckoutProgressBar currentStep={1} />

            {/* Breadcrumb */}
            <nav className="flex mb-8 text-sm font-medium text-gray-400">
                <ol className="flex items-center gap-2">
                    <li><Link to="/" className="hover:text-primary transition-colors">الرئيسية</Link></li>
                    <li><span className="material-symbols-outlined text-sm">chevron_left</span></li>
                    <li className="text-white font-bold">سلة المشتريات</li>
                </ol>
            </nav>

            <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-3xl">shopping_cart</span>
                سلة المشتريات
                <span className="text-base font-normal text-gray-400">({cartItems.length} منتج)</span>
            </h1>

            {cartItems.length === 0 ? (
                <div className="glass-panel rounded-2xl p-12 text-center">
                    <span className="material-symbols-outlined text-6xl text-gray-600 mb-4">shopping_cart</span>
                    <h2 className="text-xl font-bold text-white mb-2">سلة المشتريات فارغة</h2>
                    <p className="text-gray-400 mb-6">استكشف منتجاتنا وأضف ما يناسبك</p>
                    <Link to="/shop" className="inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-bold transition-colors">
                        <span className="material-symbols-outlined">storefront</span>
                        تصفح المنتجات
                    </Link>
                </div>
            ) : (
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 flex flex-col gap-4 w-full max-w-full overflow-hidden">
                        {cartItems.map((item) => (
                            <div key={item.id} className="glass-panel rounded-2xl p-3 sm:p-4 flex gap-3 sm:gap-4 items-center group hover:border-primary/30 transition-colors">
                                {/* Image */}
                                <Link to={`/product/${item.id}`} className="size-20 md:size-28 rounded-xl bg-[#181a20] border border-white/5 overflow-hidden flex-shrink-0">
                                    <div className="w-full h-full bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url('${item.image}')` }} />
                                </Link>

                                {/* Info */}
                                <div className="flex-1 flex flex-col gap-2">
                                    <div className="flex items-start justify-between gap-2">
                                        <div>
                                            {/* Brand removed as not in context yet, or allow optional */}
                                            <Link to={`/product/${item.id}`}>
                                                <h3 className="text-white font-bold text-sm md:text-lg hover:text-primary transition-colors line-clamp-2">{item.name}</h3>
                                            </Link>
                                        </div>
                                        <button onClick={() => removeFromCart(item.id)} className="text-gray-500 hover:text-accent-red transition-colors p-1">
                                            <span className="material-symbols-outlined">delete</span>
                                        </button>
                                    </div>

                                    <div className="flex flex-wrap items-center justify-between gap-y-2 mt-auto">
                                        {/* Quantity */}
                                        <div className="flex items-center gap-1 bg-[#181a20] rounded-lg border border-white/10 h-10 px-1">
                                            <button onClick={() => updateQuantity(item.id, item.quantity + 1)} disabled={item.stock !== undefined && item.quantity >= Math.floor(item.stock / (item.multiplier || 1))} className="size-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors">
                                                <span className="material-symbols-outlined text-lg">add</span>
                                            </button>
                                            <span className="w-8 text-center text-white font-bold">{item.quantity}</span>
                                            <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1} className="size-8 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded transition-colors">
                                                <span className="material-symbols-outlined text-lg">remove</span>
                                            </button>
                                        </div>

                                        {/* Price */}
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-xl md:text-2xl font-bold text-accent-red">{(item.price * item.quantity).toLocaleString()}</span>
                                            <span className="text-sm text-gray-400">ج.م</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Navigation Buttons */}
                        <div className="mt-8 flex flex-col sm:flex-row gap-4">
                            <Link
                                to="/shop"
                                className="flex-1 inline-flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-bold py-4 px-8 rounded-xl border border-white/10 transition-all active:scale-[0.98]"
                            >
                                <span className="material-symbols-outlined rtl:rotate-180">arrow_back</span>
                                متابعة التسوق
                            </Link>
                            <Link
                                to="/checkout"
                                className="flex-1 inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-4 px-8 rounded-xl shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
                            >
                                متابعة لمعلومات الشحن
                                <span className="material-symbols-outlined rtl:rotate-180">arrow_forward</span>
                            </Link>
                        </div>

                        {/* Wishlist Suggestions */}
                        {suggestedItems.length > 0 && (
                            <div className="mt-8 border-t border-white/10 pt-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-red-500">favorite</span>
                                    من قائمة المفضلة لديك
                                </h3>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                                    {suggestedItems.map(item => (
                                        <div key={item.id} className="glass-panel p-2 sm:p-3 rounded-xl flex flex-col gap-3 group border border-white/5 hover:border-primary/30 transition-all">
                                            <Link to={`/product/${item.product.slug}`} className="aspect-square bg-[#181a20] rounded-lg overflow-hidden relative">
                                                {item.product.images?.[0]?.url ? (
                                                    <img src={item.product.images[0].url} alt={item.product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                        <span className="material-symbols-outlined">image</span>
                                                    </div>
                                                )}
                                            </Link>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-white text-sm font-bold truncate group-hover:text-primary transition-colors">{item.product.name}</h4>
                                                <div className="flex items-baseline gap-1.5 mt-1">
                                                    <span className="text-accent-red font-bold text-sm">{Number(item.product.discountPrice || item.product.price).toLocaleString()}</span>
                                                    <span className="text-gray-500 text-xs">ج.م</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => addToCart({
                                                    id: item.product.id,
                                                    name: item.product.name,
                                                    price: item.product.discountPrice || item.product.price,
                                                    image: item.product.images?.[0]?.url || '',
                                                    quantity: 1
                                                })}
                                                className="w-full py-2.5 bg-white/5 hover:bg-primary text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 active:scale-95"
                                            >
                                                <span className="material-symbols-outlined text-sm">add_shopping_cart</span>
                                                أضف
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1 w-full max-w-full">
                        <div className="glass-panel rounded-2xl p-4 sm:p-6 sticky top-24">
                            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">receipt_long</span>
                                ملخص الطلب
                            </h3>

                            <div className="flex flex-col gap-4 mb-6">
                                <div className="flex justify-between text-gray-300">
                                    <span>المجموع الفرعي</span>
                                    <span className="font-bold">{subtotal.toLocaleString()} ج.م</span>
                                </div>
                                {couponApplied && (
                                    <div className="flex justify-between text-emerald-400">
                                        <span className="flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">sell</span>
                                            خصم الكوبون (10%)
                                        </span>
                                        <span className="font-bold">-{discount.toLocaleString()} ج.م</span>
                                    </div>
                                )}
                                <div className="h-px bg-white/10"></div>
                                <div className="flex justify-between text-white text-lg">
                                    <span className="font-bold">الإجمالي</span>
                                    <span className="font-extrabold text-2xl text-primary">{total.toLocaleString()} ج.م</span>
                                </div>
                            </div>

                            {/* Coupon */}
                            <div className="relative mb-6">
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                                    <span className="material-symbols-outlined">sell</span>
                                </div>
                                <input
                                    type="text"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value)}
                                    disabled={couponApplied}
                                    className="w-full h-12 bg-[#181a20] border border-white/10 rounded-xl pr-10 pl-24 text-white focus:border-primary focus:ring-1 focus:ring-primary placeholder-gray-500 transition-all disabled:opacity-50"
                                    placeholder="كود الخصم"
                                />
                                <button
                                    onClick={handleApplyCoupon}
                                    disabled={couponApplied || !couponCode}
                                    className="absolute left-1 top-1 bottom-1 px-4 bg-white/5 hover:bg-primary/20 hover:text-primary text-gray-300 text-sm rounded-lg font-bold transition-colors disabled:opacity-50"
                                >
                                    {couponApplied ? 'تم ✓' : 'تطبيق'}
                                </button>
                            </div>

                            {/* Checkout Button */}
                            <Link
                                to="/checkout"
                                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-all active:scale-[0.98] group"
                            >
                                <span className="material-symbols-outlined group-hover:animate-bounce">payment</span>
                                إتمام الطلب
                            </Link>

                            {/* Trust Badges */}
                            <div className="grid grid-cols-3 gap-2 mt-6 pt-6 border-t border-white/5">
                                {[
                                    { icon: 'verified_user', text: 'ضمان شامل' },
                                    { icon: 'payments', text: 'دفع آمن' },
                                    { icon: 'local_shipping', text: 'توصيل سريع' },
                                ].map((badge) => (
                                    <div key={badge.icon} className="flex flex-col items-center text-center gap-1">
                                        <span className="material-symbols-outlined text-primary text-xl">{badge.icon}</span>
                                        <span className="text-[10px] text-gray-400">{badge.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CartPage;
