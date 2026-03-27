import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export function PaymentCallbackPage() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        // Parse Paymob params
        // Paymob typically sends: success=true/false, id, order, merchant_order_id, etc.
        const success = searchParams.get('success') === 'true';
        const isPending = searchParams.get('pending') === 'true';
        const dataMessage = searchParams.get('data.message');

        if (success && !isPending) {
            setStatus('success');
            setMessage('تمت عملية الدفع بنجاح! جاري تحويلك...');
            // Notify parent window
            if (window.opener) {
                window.opener.postMessage('PAYMOB_SUCCESS', '*');
            }
        } else if (isPending) {
            // Sometimes successful wallets return pending first
            setStatus('success');
            setMessage('تم استلام الدفعة بنجاح. جاري التحقق...');
            if (window.opener) {
                window.opener.postMessage('PAYMOB_SUCCESS', '*');
            }
        } else {
            setStatus('failed');
            setMessage(dataMessage || 'فشلت عملية الدفع. يرجى المحاولة مرة أخرى.');
            if (window.opener) {
                window.opener.postMessage({ type: 'PAYMOB_FAILED', message: dataMessage }, '*');
            }
        }
    }, [searchParams]);

    const handleClose = () => {
        if (window.opener) {
            window.close();
        }
    };

    return (
        <div className="min-h-screen bg-[#0f1115] flex items-center justify-center p-4" dir="rtl">
            <div className="glass-panel p-8 rounded-2xl max-w-md w-full text-center border border-white/10 bg-[#181a20]">

                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
                        <h2 className="text-xl font-bold text-white mb-2">جاري التحقق من الدفع...</h2>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center animate-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-emerald-500/50">
                            <span className="material-symbols-outlined text-4xl text-emerald-500">check_circle</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">تم الدفع بنجاح</h2>
                        <p className="text-slate-400 mb-8">{message}</p>
                        <p className="text-xs text-slate-500 animate-pulse">سيتم إغلاق هذه النافذة تلقائياً...</p>
                    </div>
                )}

                {status === 'failed' && (
                    <div className="flex flex-col items-center animate-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-red-500/50">
                            <span className="material-symbols-outlined text-4xl text-red-500">error</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">عفواً، فشلت العملية</h2>
                        <p className="text-red-400/80 mb-8 text-sm bg-red-500/5 p-3 rounded-lg border border-red-500/10">
                            {message}
                        </p>
                        <button
                            onClick={handleClose}
                            className="bg-white/5 hover:bg-white/10 text-white px-6 py-2 rounded-lg font-medium transition-colors border border-white/10"
                        >
                            إغلاق النافذة
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
}
