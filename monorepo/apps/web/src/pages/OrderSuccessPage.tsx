import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle, Package, Home, Receipt } from 'lucide-react';

export function OrderSuccessPage() {
    const { id } = useParams();

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

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-transparent to-[#101622]/50">
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
                                <span className="font-mono font-bold text-white text-lg tracking-wider">#{id?.slice(-8).toUpperCase()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm">حالة الطلب</span>
                                <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20">
                                    قيد التجهيز
                                </span>
                            </div>
                        </div>
                    </div>

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
                    <div className="mt-12 pt-8 border-t border-white/5">
                        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm text-slate-500">
                            <div className="flex items-center gap-2">
                                <Receipt className="size-4 text-primary" />
                                <span>وصلك بريد إلكتروني بالتفاصيل</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default OrderSuccessPage;
