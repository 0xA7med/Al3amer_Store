import { useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle, Package, Home, Receipt } from 'lucide-react';

export function OrderSuccessPage() {
    const { id: internalId } = useParams();
    const [searchParams] = useSearchParams();

    // Paymob Query Params
    const isPaymobSuccess = searchParams.get('success') === 'true';
    const paymobOrderId = searchParams.get('order');

    // Frame Buster: Force parent window to reload/redirect if inside an iframe (Payment Modal)
    useEffect(() => {
        const handleFrameBuster = () => {
            if (window.parent && window.self !== window.top) {
                window.parent.postMessage({ type: 'PAYMOB_PAYMENT_COMPLETED' }, '*');
            }
            if (window.top && window.self !== window.top) {
                window.top.location.href = window.location.href;
            }
        };
        handleFrameBuster();
    }, []);

    // Manual Breakout UI for Iframe
    if (typeof window !== 'undefined' && window.self !== window.top) {
        return (
            <div className="fixed inset-0 bg-[#101622] flex flex-col items-center justify-center p-4 text-center z-[99999]">
                <div className="bg-[#181a20] rounded-3xl p-8 max-w-sm w-full border border-emerald-500/20 shadow-2xl animate-in zoom-in duration-300">
                    <div className="size-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="size-10 text-emerald-400" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">تم الدفع بنجاح!</h2>
                    <p className="text-slate-400 mb-8">اضغط على الزر أدناه لإكمال الطلب</p>

                    <button
                        onClick={() => {
                            if (window.top) window.top.location.href = window.location.href;
                        }}
                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-500/20"
                    >
                        إكمال الطلب
                    </button>
                </div>
            </div>
        );
    }

    // Determine what to display (internal ID or Paymob ID)
    const effectiveOrderId = internalId || paymobOrderId;
    const isActuallySuccess = isPaymobSuccess || !!internalId;

    if (!isActuallySuccess && !effectiveOrderId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#101622] text-white p-4">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">عذراً، لم نتمكن من العثور على تفاصيل الطلب</h1>
                    <Link to="/" className="text-primary hover:underline">العودة للرئيسية</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-transparent to-[#101622]/50">
            <div className="max-w-2xl w-full">
                <div className="glass-panel p-8 md:p-12 rounded-[2.5rem] text-center border-emerald-500/20 shadow-2xl shadow-emerald-500/10 relative overflow-hidden">
                    {/* Decorative Background Glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-emerald-500/10 blur-[100px] -z-10" />

                    {/* Success Icon */}
                    <div className="size-24 rounded-full bg-emerald-400/20 border-4 border-emerald-400/30 flex items-center justify-center mx-auto mb-8 animate-in zoom-in duration-1000">
                        <CheckCircle className="size-12 text-emerald-400" />
                    </div>

                    {/* Content */}
                    <h1 className="text-3xl md:text-4xl font-black text-white mb-4">شكراً لطلبك!</h1>
                    <p className="text-lg text-slate-300 font-light mb-8 max-w-md mx-auto leading-relaxed">
                        {isPaymobSuccess ? 'تم تأكيد الدفع بنجاح. ' : ''}تم استلام طلبك بنجاح. نحن نعمل الآن على تجهيزه وشحنه إليك في أقرب وقت ممكن.
                    </p>

                    {/* Order Details Card */}
                    <div className="bg-[#181a20]/60 border border-white/5 rounded-2xl p-6 mb-10 text-right dir-rtl">
                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center pb-4 border-b border-white/5">
                                <span className="text-slate-400 text-sm">{paymobOrderId && !internalId ? 'رقم عملية الدفع' : 'رقم الطلب'}</span>
                                <span className="font-mono font-bold text-white text-lg tracking-wider">
                                    {internalId ? `#${internalId?.slice(-8).toUpperCase()}` : `#${paymobOrderId}`}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400 text-sm">حالة الطلب</span>
                                <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold border border-emerald-500/20">
                                    {isPaymobSuccess ? 'تم الدفع' : 'قيد التجهيز'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {internalId && (
                            <Link
                                to={`/track-order/${internalId}`}
                                className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-2xl shadow-xl shadow-primary/25 transition-all active:scale-[0.98] group"
                            >
                                <Package className="size-5 group-hover:bounce" />
                                <span>تتبع طلبي</span>
                            </Link>
                        )}
                        <Link
                            to="/"
                            className={`flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-2xl border border-white/10 transition-all active:scale-[0.98] ${!internalId ? 'sm:col-span-2' : ''}`}
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
