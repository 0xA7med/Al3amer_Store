import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { useCart } from '../context/CartContext';
import SEOHead from '../components/SEO/SEOHead';

export function PaymentCallbackPage() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
    const [message, setMessage] = useState('جاري التحقق من الدفع...');
    const { clearCart } = useCart();

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                const success = searchParams.get('success') === 'true';
                const isPending = searchParams.get('pending') === 'true';
                const dataMessage = searchParams.get('data.message');
                const orderId = searchParams.get('order'); // Paymob's internal long integer ID
                const rawMerchantOrderId = searchParams.get('merchant_order_id') || ''; 
                
                // Extract original UUID (everything before the last '-')
                const merchantOrderId = rawMerchantOrderId.includes('-') 
                    ? rawMerchantOrderId.substring(0, rawMerchantOrderId.lastIndexOf('-'))
                    : rawMerchantOrderId;

                // 1. Check if Paymob marked it as failed
                if (!success && !isPending) {
                    setStatus('failed');
                    setMessage(dataMessage || 'فشلت عملية الدفع. يرجى المحاولة مرة أخرى.');
                    setTimeout(() => {
                        window.location.replace(`/checkout?error=${encodeURIComponent(dataMessage || 'فشلت عملية الدفع')}`);
                    }, 3000);
                    return;
                }

                if (!orderId) {
                    throw new Error('بيانات الطلب غير مكتملة (Missing Order ID)');
                }

                // 2. Call backend to verify and finalize order
                const { data } = await api.post('/checkout/verify', { paymobOrderId: orderId });
                
                if (data.paid) {
                    setStatus('success');
                    setMessage('تمت عملية الدفع بنجاح! جاري تحويلك...');
                    
                    // Cleanup any local drafts and clear cart
                    localStorage.removeItem('checkout_draft_order_id');
                    clearCart();

                    // 3. Redirect to Success Page using our UUID (merchant_order_id)
                    setTimeout(() => {
                        window.location.replace(`/order-success/${merchantOrderId || 'success'}`);
                    }, 2000);
                } else {
                    throw new Error('لم يتم تأكيد الدفع من الخادم.');
                }
            } catch (err: any) {
                console.error('Verification Error:', err);
                setStatus('failed');
                setMessage(err.message || 'حدث خطأ أثناء التحقق من الدفع.');
                setTimeout(() => {
                    window.location.replace(`/checkout?error=${encodeURIComponent(err.message || 'حدث خطأ أثناء التحقق')}`);
                }, 3000);
            }
        };

        verifyPayment();
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-[#0f1115] flex items-center justify-center p-4" dir="rtl">
            <SEOHead title="الدفع" description="تأكيد الدفع - مركز العامر" noindex />
            <div className="glass-panel p-8 rounded-2xl max-w-md w-full text-center border border-white/10 bg-[#181a20]">
                {status === 'loading' && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-6"></div>
                        <h2 className="text-xl font-bold text-white mb-2">جاري التحقق من الدفع...</h2>
                        <p className="text-slate-400 text-sm">يرجى عدم إغلاق هذه الصفحة</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center animate-in zoom-in duration-300">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-emerald-500/50">
                            <span className="material-symbols-outlined text-4xl text-emerald-500">check_circle</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">تم الدفع بنجاح</h2>
                        <p className="text-slate-400 mb-8">{message}</p>
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
                        <p className="text-xs text-slate-500 animate-pulse">جاري إعادتك لصفحة الدفع...</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PaymentCallbackPage;
