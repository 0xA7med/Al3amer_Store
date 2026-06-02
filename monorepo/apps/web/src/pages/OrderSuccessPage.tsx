import { useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle, Package, Home, MessageCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useSettings } from '../context/SettingsContext';
import SEOHead from '../components/SEO/SEOHead';

export function OrderSuccessPage() {
    const { id } = useParams();
    const { settings } = useSettings();

    const { data: order } = useQuery({
        queryKey: ['order-success', id],
        queryFn: async () => {
            const { data } = await api.get(`/orders/${id}`);
            return data;
        },
        enabled: !!id,
    });

    const isCod = order?.paymentMethod === 'cod';
    const whatsappNumber = settings?.whatsapp ? settings.whatsapp.replace(/\D/g, '') : '201093166540';
    const advanceAmountNum = Number(settings?.codAdvancePayment || '100');
    
    // Formatting data for WhatsApp
    const orderNum = order?.orderNumber || id?.slice(-8).toUpperCase();
    const subtotal = Number(order?.subtotal || 0).toLocaleString('ar-EG');
    const advance = advanceAmountNum.toLocaleString('ar-EG');
    const shipping = Number(order?.shippingCost || 0).toLocaleString('ar-EG');
    const extraFeeNum = Number(order?.extraFee || 0);
    const extraFeeStr = extraFeeNum > 0 ? ` + ${extraFeeNum.toLocaleString('ar-EG')} رسوم COD` : '';
    
    const productsTotalNum = Number(order?.subtotal || 0);
    const productsRestNum = Math.max(0, productsTotalNum - advanceAmountNum);
    
    const grandTotalNum = Number(order?.total || 0);
    const requiredAtDeliveryNum = Number(order?.totalAtDelivery !== undefined ? order.totalAtDelivery : Math.max(0, grandTotalNum - advanceAmountNum));
    const requiredAtDelivery = requiredAtDeliveryNum.toLocaleString('ar-EG');

    const productsList = order?.items?.map((item: any) => `▪ ${item.name || 'منتج'} (الكمية: ${item.quantity || 1})`).join('\n') || '▪ جاري تحميل المنتجات...';

    // Construct WhatsApp message with dynamic number
    const whatsappMessage = encodeURIComponent(
`مرحباً، أود إتمام إجراءات تأكيد الطلب التالي 👇
*رقم الطلب:* #${orderNum}
---------------------------
*العميل:* ${order?.fullName || ''} 
*الهاتف:* ${order?.phone || ''} 
*العنوان:* ${order?.governorate || ''}، ${order?.city || ''} - ${order?.address || ''} 
*المنتجات:* 
${productsList}
---------------------------
*إجمالي المنتجات:* ${subtotal} ج.م
*مصاريف الشحن:* ${shipping} ج.م
*المطلوب تحويله الآن (عربون):* ${advance} ج.م
*المبلغ المتبقي عند الاستلام:* ${requiredAtDelivery} ج.م
(تفصيل المتبقي: ${productsRestNum.toLocaleString('ar-EG')} منتجات + ${shipping} شحن${extraFeeStr})`
    );

    // Frame Buster: Force parent window to reload/redirect if inside an iframe (Payment Modal)
    // This is critical for Paymob payments that redirect to success inside the iframe.
    // Frame Buster & PostMessage: 
    // 1. Force parent to reload if needed.
    // 2. Send 'PAYMOB_SUCCESS' to parent to close modal cleaner.
    // Frame Buster & PostMessage Logic
    // Handles both Iframe (Modal) and Popup (New Window) scenarios
    useEffect(() => {
        const handlePaymentSuccess = () => {
            const message = 'PAYMOB_SUCCESS';

            // 1. Notify Parent (Iframe mode)
            if (window.parent && window.parent !== window) {
                window.parent.postMessage(message, '*');
                console.log('Sent PAYMOB_SUCCESS to parent');
            }

            // 2. Notify Opener (Popup mode)
            if (window.opener) {
                window.opener.postMessage(message, '*');
                console.log('Sent PAYMOB_SUCCESS to opener');
            }

            // 3. Retry mechanism to ensure message is received
            const interval = setInterval(() => {
                if (window.opener) window.opener.postMessage(message, '*');
                if (window.parent && window.parent !== window) window.parent.postMessage(message, '*');
            }, 1000);

            // 4. Handle Popup Closing / Redirection
            // If we are in a popup (have opener) or iframe (have parent), we want to close/redirect
            setTimeout(() => {
                clearInterval(interval);

                // If it's a popup, close it
                if (window.opener) {
                    window.close();
                }

                // If it's an iframe, force parent reload (fallback safety)
                // We only do this if we haven't already navigated away via the message listener in parent
                if (window.top && window.self !== window.top) {
                    console.log('Frame buster: Redirecting top window to success page');
                    window.top.location.href = window.location.href;
                }
            }, 3000);
        };

        handlePaymentSuccess();
    }, []);

    // Google Customer Reviews opt-in
    const orderEmail = order?.email || '';
    const orderIdStr = order?.orderNumber || id?.slice(-8).toUpperCase() || '';
    const estimatedDays = useMemo(() => {
        if (!order?.createdAt) return 14;
        const created = new Date(order.createdAt);
        created.setDate(created.getDate() + 14);
        return created.toISOString().split('T')[0];
    }, [order?.createdAt]);

    useEffect(() => {
        if (!orderIdStr || !orderEmail) return;
        const script = document.createElement('script');
        script.src = 'https://apis.google.com/js/platform.js?onload=renderOptIn';
        script.async = true;
        script.defer = true;
        document.body.appendChild(script);
        (window as any).renderOptIn = function () {
            (window as any).gapi?.load('surveyoptin', function () {
                (window as any).gapi?.surveyoptin?.render({
                    merchant_id: 5801183579,
                    order_id: orderIdStr,
                    email: orderEmail,
                    delivery_country: 'EG',
                    estimated_delivery_date: estimatedDays,
                });
            });
        };
        return () => {
            document.body.removeChild(script);
        };
    }, [orderIdStr, orderEmail, estimatedDays]);

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-transparent to-[#101622]/50">
            <SEOHead title="تم تأكيد الطلب" description={`طلب رقم ${id} - تم تأكيد طلبك بنجاح في مركز العامر`} noindex />
            <div className="max-w-2xl w-full">
                <div className="glass-panel p-8 md:p-12 rounded-[2.5rem] text-center border-emerald-500/20 shadow-2xl shadow-emerald-500/10 relative overflow-hidden">
                    {/* Decorative Background Glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/10 blur-[100px] -z-10" />

                    {/* Success Icon */}
                    <div className="size-24 rounded-full bg-emerald-500/20 border-4 border-emerald-500/30 flex items-center justify-center mx-auto mb-8 animate-in zoom-in spin-in-12 duration-1000">
                        <CheckCircle className="size-12 text-emerald-400" />
                    </div>

                    {/* Content */}
                    <h1 className="text-3xl md:text-4xl font-black text-white mb-4">شكراً لطلبك!</h1>
                    <p className="text-lg text-slate-300 font-light mb-8 max-w-md mx-auto leading-relaxed">
                        تم استلام طلبك بنجاح. نحن نعمل الآن على تجهيزه وشحنه إليك في أقرب وقت ممكن.
                    </p>

                    {/* Order Details Card */}
                    <div className="bg-[#181a20]/60 border border-white/5 rounded-2xl p-6 mb-10 text-right dir-rtl">
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center pb-4 border-b border-white/5">
                                <span className="text-slate-400 text-sm">رقم الطلب</span>
                                <span className="font-mono font-bold text-white text-lg tracking-wider">#{orderNum}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm">حالة الطلب</span>
                                <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20">
                                    قيد التجهيز
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* WhatsApp COD Confirmation */}
                    {isCod && (
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-6 mb-8 mt-2 text-right dir-rtl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/5 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                            <div className="flex flex-col gap-3 relative z-10">
                                <h3 className="text-orange-400 font-bold text-lg flex items-center gap-2">
                                    <span className="material-symbols-outlined text-xl">error</span>
                                    خطوة أخيرة لتأكيد طلبك!
                                </h3>
                                <p className="text-white/80 text-sm leading-relaxed mb-2 text-justify">
                                    بما أنك اخترت "الدفع عند الاستلام"، يُرجى التواصل معنا عبر واتساب لتحويل <strong>مقدم تأكيد الطلب ({advanceAmountNum} ج.م)</strong> حتى نتمكن من شحن طلبك فوراً.
                                </p>
                                <a 
                                    href={`https://wa.me/${whatsappNumber}?text=${whatsappMessage}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg shadow-[#25D366]/20 active:scale-[0.98]"
                                >
                                    <MessageCircle className="size-5" />
                                    تأكيد الطلب وتسداد المقدم عبر واتساب
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Link
                            to={`/track-order/${id}`}
                            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-2xl shadow-xl shadow-primary/25 transition-all active:scale-[0.98] group"
                        >
                            <Package className="size-5 group-hover:bounce" />
                            <span>تتبع طلبي</span>
                        </Link>
                        <Link
                            to="/"
                            className="flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl border border-white/10 transition-all active:scale-[0.98]"
                        >
                            <Home className="size-5" />
                            <span>العودة للرئيسية</span>
                        </Link>
                    </div>

                    {/* Footer Info */}
                    <div className="mt-8 pt-6 border-t border-white/5 text-center text-sm text-slate-500">
                        <p>شكراً لثقتك في متجر العامر</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OrderSuccessPage;
