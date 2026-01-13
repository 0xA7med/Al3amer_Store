import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { ArrowRight, Package, Truck, CheckCircle, Clock, MapPin, Phone, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useProducts } from '../hooks/useProducts';

const STATUS_STEPS = [
    { id: 'pending', label: 'تم الاستلام', icon: Clock, description: 'تم استلام طلبك بنجاح' },
    { id: 'processing', label: 'قيد التجهيز', icon: Package, description: 'جاري تجهيز طلبك في المخازن' },
    { id: 'shipped', label: 'تم الشحن', icon: Truck, description: 'الطلب في طريقه إليك' },
    { id: 'delivered', label: 'تم التوصيل', icon: CheckCircle, description: 'تم توصيل الطلب بنجاح' },
];

export function OrderTrackingPage() {
    const { id } = useParams();

    const { data: order, isLoading, error } = useQuery({
        queryKey: ['order-tracking', id],
        queryFn: async () => {
            const { data } = await api.get(`/orders/${id}`);
            return data;
        },
        enabled: !!id,
    });

    // Fetch suggested products
    const { data: productsData } = useProducts({ limit: 4 });
    const suggestedProducts = productsData?.data || [];

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
                <div className="size-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-4xl text-red-500">error_outline</span>
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">عذراً، لم نتمكن من العثور على الطلب</h1>
                <p className="text-gray-400 mb-8">يرجى التأكد من رابط التتبع أو التواصل مع خدمة العملاء</p>
                <Link to="/" className="btn-primary">
                    العودة للرئيسية
                </Link>
            </div>
        );
    }

    const currentStepIndex = STATUS_STEPS.findIndex(s => s.id === order.status);
    // If cancelled or unknown, maybe default to 0 or handle separately. 
    // For specific status logic, simple index matching:
    // If status is "cancelled", show red alert.
    const isCancelled = order.status === 'cancelled';

    return (
        <div className="container mx-auto px-4 py-8 lg:py-12 max-w-5xl">
            {/* Header */}
            <div className="mb-8">
                <Link to="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-4 transition-colors">
                    <ArrowRight className="size-4 rtl:rotate-180" />
                    الرئيسية
                </Link>
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-2">تتبع الطلب</h1>
                        <p className="text-gray-400 font-mono">#{order.orderNumber || id?.slice(-8).toUpperCase()}</p>
                    </div>
                    {isCancelled ? (
                        <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg font-bold">
                            تم إلغاء الطلب
                        </div>
                    ) : (
                        <div className="px-4 py-2 bg-primary/10 border border-primary/20 text-primary rounded-lg font-bold">
                            متوقع التوصيل: خلال 3-5 أيام عمل
                        </div>
                    )}
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Status Timeline */}
                    <div className="glass-panel p-6 md:p-8 rounded-2xl">
                        {!isCancelled ? (
                            <div className="relative">
                                {/* Connecting Line */}
                                <div className="absolute top-6 right-0 left-0 h-1 bg-white/5 -z-10 hidden md:block" />
                                <div className="absolute right-6 bottom-0 top-0 w-1 bg-white/5 -z-10 md:hidden" />

                                <div className="flex flex-col md:flex-row justify-between gap-8 md:gap-4">
                                    {STATUS_STEPS.map((step, index) => {
                                        const isCompleted = currentStepIndex >= index;
                                        const isCurrent = currentStepIndex === index;

                                        return (
                                            <div key={step.id} className="flex md:flex-col items-start md:items-center gap-4 md:gap-0 relative">
                                                {/* Line Progress (Desktop) */}
                                                {index < STATUS_STEPS.length - 1 && (
                                                    <div
                                                        className={`absolute top-6 right-[50%] left-[-50%] h-1 transition-colors duration-500 hidden md:block -z-10 ${currentStepIndex > index ? 'bg-primary' : 'bg-transparent'
                                                            }`}
                                                    />
                                                )}

                                                {/* Icon Circle */}
                                                <div
                                                    className={`size-12 rounded-full border-4 flex items-center justify-center shrink-0 transition-all duration-500 z-10 ${isCompleted
                                                        ? 'bg-primary border-primary text-white shadow-[0_0_20px_rgba(37,244,238,0.3)]'
                                                        : 'bg-[#181a20] border-white/10 text-gray-500'
                                                        } ${isCurrent ? 'animate-pulse ring-4 ring-primary/20' : ''}`}
                                                >
                                                    <step.icon className="size-5" />
                                                </div>

                                                {/* Text */}
                                                <div className="md:text-center md:mt-4 pt-1 md:pt-0">
                                                    <h3 className={`font-bold mb-1 ${isCompleted ? 'text-white' : 'text-gray-500'}`}>
                                                        {step.label}
                                                    </h3>
                                                    <p className="text-sm text-gray-500 max-w-[150px] mx-auto hidden md:block">
                                                        {step.description}
                                                    </p>
                                                    {/* Mobile Description */}
                                                    <p className="text-sm text-gray-500 md:hidden">
                                                        {step.description}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="size-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="material-symbols-outlined text-3xl text-red-500">cancel</span>
                                </div>
                                <h3 className="text-xl font-bold text-white">تم إلغاء هذا الطلب</h3>
                                <p className="text-gray-400 mt-2">لمزيد من المعلومات، يرجى التواصل مع خدمة العملاء</p>
                            </div>
                        )}
                    </div>

                    {/* Order Items */}
                    <div className="glass-panel p-6 rounded-2xl">
                        <h3 className="text-xl font-bold text-white mb-6 border-b border-white/5 pb-4">محتويات الطلب</h3>
                        <div className="space-y-4">
                            {order.items?.map((item: any) => (
                                <div key={item.id} className="flex gap-4 items-center bg-white/5 p-3 rounded-xl">
                                    <div className="size-20 bg-[#181a20] rounded-lg overflow-hidden border border-white/10 shrink-0">
                                        {item.product?.images?.[0]?.url ? (
                                            <img src={item.product.images[0].url} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-600">
                                                <span className="material-symbols-outlined">image</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-white font-bold mb-1">{item.name}</h4>
                                        <p className="text-primary font-bold">{Number(item.price).toLocaleString()} ج.م</p>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-gray-400 text-sm">الكمية</span>
                                        <div className="text-white font-bold">{item.quantity}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
                            <div className="flex justify-between items-center text-gray-400">
                                <span>المجموع الفرعي</span>
                                <span>{Number(order.subtotal).toLocaleString()} ج.م</span>
                            </div>
                            <div className="flex justify-between items-center text-gray-400">
                                <span>الشحن</span>
                                <span>{Number(order.shippingCost) === 0 ? 'مجاني' : `${Number(order.shippingCost).toLocaleString()} ج.م`}</span>
                            </div>
                            {Number(order.taxAmount) > 0 && (
                                <div className="flex justify-between items-center text-gray-400">
                                    <span>ضريبة القيمة المضافة</span>
                                    <span>{Number(order.taxAmount).toLocaleString()} ج.م</span>
                                </div>
                            )}
                            {Number(order.extraFee || 0) > 0 && (
                                <div className="flex justify-between items-center text-gray-400">
                                    <span>رسوم إضافية</span>
                                    <span>{Number(order.extraFee).toLocaleString()} ج.م</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center pt-3 border-t border-white/5">
                                <span className="text-lg text-white font-bold">الإجمالي</span>
                                <span className="text-2xl font-bold text-primary">{Number(order.total).toLocaleString()} ج.م</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Shipping Address */}
                    <div className="glass-panel p-6 rounded-2xl">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                            <MapPin className="size-5 text-primary" />
                            عنوان التوصيل
                        </h3>
                        <div className="space-y-1 text-gray-300">
                            <p className="text-white font-medium">{order.fullName}</p>
                            <p>{order.address}</p>
                            <p>{order.city}، {order.governorate}</p>
                            <p className="dir-ltr text-right mt-2 text-primary">{order.phone}</p>
                        </div>
                    </div>

                    {/* Need Help? */}
                    <div className="glass-panel p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">support_agent</span>
                            تحتاج مساعدة؟
                        </h3>
                        <p className="text-gray-400 text-sm mb-6">
                            فريق الدعم متاح لمساعدتك في تتبع طلبك أو الإجابة على استفساراتك.
                        </p>
                        <div className="space-y-3">
                            <a
                                href="https://wa.me/201093166540"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 rounded-xl transition-colors"
                            >
                                <span className="material-symbols-outlined">chat</span>
                                تواصل عبر واتساب
                            </a>
                            <a
                                href="tel:+201093166540"
                                className="flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-colors border border-white/10"
                            >
                                <Phone className="size-5" />
                                اتصل بنا
                            </a>
                        </div>
                    </div>

                    {/* Suggested Products Sidebar */}
                    {suggestedProducts.length > 0 && (
                        <div className="glass-panel p-6 rounded-2xl">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-white flex items-center gap-2">
                                    <ShoppingBag className="size-5 text-accent-red" />
                                    <span>منتجات قد تعجبك</span>
                                </h3>
                                <Link to="/shop" className="text-xs text-primary hover:underline">عرض الكل</Link>
                            </div>
                            <div className="space-y-4">
                                {suggestedProducts.map((product) => (
                                    <Link key={product.id} to={`/product/${product.id}`} className="flex gap-3 group">
                                        <div className="size-16 rounded-lg bg-[#181a20] border border-white/10 overflow-hidden shrink-0 relative">
                                            {product.images?.[0]?.url ? (
                                                <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-600">
                                                    <span className="material-symbols-outlined text-sm">image</span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 py-1">
                                            <h4 className="text-gray-300 text-sm font-medium truncate group-hover:text-primary transition-colors">{product.name}</h4>
                                            <div className="mt-1 flex items-baseline gap-2">
                                                <span className="text-white font-bold text-sm">{Number(product.discountPrice || product.price).toLocaleString()} ج.م</span>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                            <Link
                                to="/shop"
                                className="mt-6 flex items-center justify-center gap-2 w-full bg-white/5 hover:bg-white/10 text-white font-bold py-3 rounded-xl transition-colors border border-white/10 group"
                            >
                                <span>تصفح المزيد</span>
                                <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" />
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default OrderTrackingPage;
