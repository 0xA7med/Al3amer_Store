import { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';

export function PaymobCallbackPage() {
    useEffect(() => {
        // 1. Notify Parent immediately on load (Fast Trigger)
        if (window.parent) {
            window.parent.postMessage({ type: 'PAYMOB_PAYMENT_COMPLETED' }, '*');
        }
    }, []);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4 text-center">
            {/* Animated Checkmark */}
            <div className="mb-6 animate-in zoom-in duration-500">
                <div className="size-20 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                    <CheckCircle className="size-10 text-green-600" />
                </div>
            </div>

            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">تم الدفع بنجاح</h1>
            <p className="text-gray-500 mb-8 dir-rtl text-sm md:text-base">جاري إغلاق النافذة وإكمال الطلب...</p>

            {/* Manual Close Button (Ultimate Fallback) */}
            <button
                onClick={() => {
                    // Try postMessage first
                    if (window.parent) {
                        window.parent.postMessage({ type: 'PAYMOB_PAYMENT_COMPLETED' }, '*');
                    }
                    // Force Top-Level Redirect if postMessage fails
                    setTimeout(() => {
                        if (window.top) {
                            window.top.location.href = '/order-success/confirmed';
                        }
                    }, 500);
                }}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors active:scale-95 shadow-lg shadow-green-600/20 text-sm"
            >
                إغلاق وإكمال الطلب (اضغط هنا إذا لم يتم التحويل)
            </button>
        </div>
    );
}

export default PaymobCallbackPage;
