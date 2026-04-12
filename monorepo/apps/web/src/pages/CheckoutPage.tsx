import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { useAddresses } from '../hooks/useAddresses';
import { CheckoutProgressBar } from '../components/checkout';
import api from '../lib/api';

const GOVERNORATES = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر', 'البحيرة', 'الفيوم',
    'الغربية', 'الإسماعيلية', 'المنوفية', 'المنيا', 'القليوبية', 'الوادي الجديد',
    'السويس', 'أسوان', 'أسيوط', 'بني سويف', 'بورسعيد', 'دمياط', 'الشرقية', 'جنوب سيناء',
    'كفر الشيخ', 'مطروح', 'الأقصر', 'قنا', 'شمال سيناء', 'سوهاج'
];

const isValidEgyptianPhone = (phone: string) => {
    // Basic Egyptian phone format: 010/011/012/015 followed by 8 digits
    let cleaned = phone.trim().replace(/[\s\(\)\-]/g, '');
    
    // Remove +20 or 20 or 0020 prefix if exists
    if (cleaned.startsWith('+20')) cleaned = '0' + cleaned.substring(3);
    else if (cleaned.startsWith('20')) cleaned = '0' + cleaned.substring(2);
    else if (cleaned.startsWith('0020')) cleaned = '0' + cleaned.substring(4);
    
    // Ensure it starts with 0
    if (!cleaned.startsWith('0') && cleaned.length === 10) cleaned = '0' + cleaned;

    const regex = /^01[0-2,5]\d{8}$/;
    // Block dummy numbers like 01200000000, 01111111111, 01000000000
    const allSameDigit = /^01[0-2,5](\d)\1{7}$/;
    
    const isValid = regex.test(cleaned) && !allSameDigit.test(cleaned);
    if (!isValid && cleaned) {
        console.log('💳 [Validation] Invalid Egyptian phone:', cleaned);
    }
    return isValid;
};

export function CheckoutPage() {
    const navigate = useNavigate();
    const { items, totalPrice, clearCart, validateCart } = useCart();
    const { user } = useAuth();
    const { settings } = useSettings();
    const { addresses, fetchAddresses } = useAddresses();
    const [selectedAddressId, setSelectedAddressId] = useState<string>('new');

    useEffect(() => {
        if (user) {
            fetchAddresses();
        }
    }, [user, fetchAddresses]);

    useEffect(() => {
        if (addresses.length > 0) {
            const defaultAddr = addresses.find(a => a.isDefault);
            if (defaultAddr) {
                setSelectedAddressId(defaultAddr.id);
            } else {
                setSelectedAddressId(addresses[0].id);
            }
        }
    }, [addresses]);

    useEffect(() => {
        if (selectedAddressId !== 'new') {
            const addr = addresses.find(a => a.id === selectedAddressId);
            if (addr) {
                setFormData(prev => ({
                    ...prev,
                    fullName: addr.fullName,
                    phone: addr.phone,
                    phone_2: addr.phone2 || '',
                    address: addr.address,
                    city: addr.city,
                    governorate: addr.governorate,
                    // Keep email from user profile or manual input
                    email: user?.email || prev.email
                }));
            }
        } else if (user) {
            // Reset to user basics but clear address specific fields if switching to new
            setFormData(prev => ({
                ...prev,
                fullName: user.name || '',
                phone: user.phone || '',
                email: user.email || '',
                address: '',
                city: '',
                governorate: '',
                phone_2: ''
            }));
        }
    }, [selectedAddressId, addresses, user]);

    // Wizard Step State
    const [step, setStep] = useState<1 | 2 | 3>(1);

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        phone_2: '',
        address: '',
        city: '',
        governorate: '',
        notes: '',
        paymentMethod: 'cod', // cash on delivery
        walletNumber: ''
    });

    // Auto-fill from user or localStorage
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                fullName: user.name || prev.fullName,
                email: user.email || prev.email,
                phone: user.phone || prev.phone,
                walletNumber: '', // Initialize empty as requested (was user.phone || prev.phone)
                // user address structure might differ, assumption here:
                address: (user as any).address || prev.address
            }));
        } else {
            const saved = localStorage.getItem('checkout_info');
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    setFormData(prev => ({ ...prev, ...parsed }));
                } catch (e) {
                    console.error("Failed to parse saved checkout info", e);
                }
            }
        }
    }, [user]);

    // Removed auto-sync of wallet number to keep it empty by default
    /*
    useEffect(() => {
        if (formData.phone && !formData.walletNumber) {
            setFormData(prev => ({ ...prev, walletNumber: formData.phone }));
        }
    }, [formData.phone]);
    */

    // Save to localStorage on change
    useEffect(() => {
        if (!user) { // Only save to local storage if guest, or maybe always? User prefers simple.
            localStorage.setItem('checkout_info', JSON.stringify(formData));
        }
    }, [formData, user]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Draft Order tracking (to prevent duplicates)
    const [draftOrderId, setDraftOrderId] = useState<string | null>(localStorage.getItem('checkout_draft_order_id'));

    // Check for Paymob external errors returning via URL
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const externalError = urlParams.get('error');
        if (externalError) {
            setError(externalError);
            // Optionally remove it from the URL so it doesn't linger on reload
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    // Coupon State
    const [couponCode, setCouponCode] = useState('');
    const [couponError, setCouponError] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState<{ id: string; code: string; discount: number; type: 'percentage' | 'fixed' | 'free_shipping' } | null>(null);
    const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

    // Build the order payload (reused by both COD and post-payment flows)
    const buildOrderData = () => {
        const finalNotes = (formData.phone_2 ? `Phone 2: ${formData.phone_2}\n` : '') + (formData.notes || '');
        return {
            fullName: formData.fullName,
            phone: formData.phone,
            email: formData.email,
            governorate: formData.governorate,
            city: formData.city,
            address: formData.address,
            notes: finalNotes,
            paymentMethod: formData.paymentMethod,
            items: items.map(item => ({
                productId: item.id,
                name: item.name,
                quantity: item.quantity,
                price: item.price
            })),
            shippingCost,
            taxAmount: vatAmount,
            extraFee: codReturnFee, // Legacy fallback
            codAdvancePayment: codAdvancePaymentAmount,
            codReturnShipping: codReturnFee,
            totalAtDelivery: codTotalAtDelivery,
            couponCode: appliedCoupon ? appliedCoupon.code : undefined,
            totalAmount: finalTotal,
            discountAmount: discountAmount,
            walletNumber: formData.paymentMethod === 'paymob_wallet' ? formData.walletNumber : undefined,
            userId: user?.id,
        };
    };


    // Dynamic calculations based on settings
    const freeShippingThreshold = parseFloat(settings.freeShippingThreshold || '5000');
    const flatShippingRate = parseFloat(settings.shippingFlatRate || '100');

    // Calculate shipping cost based on city/governorate if available
    const getShippingCost = () => {
        if (totalPrice >= freeShippingThreshold) return 0;

        const cityRates = settings.cityShippingRates || [];
        // Try to find a match in governorate or city (case-insensitive)
        const customRate = cityRates.find(r =>
            (formData.governorate && r.city.toLowerCase() === formData.governorate.toLowerCase()) ||
            (formData.city && r.city.toLowerCase() === formData.city.toLowerCase())
        );

        return customRate ? customRate.rate : flatShippingRate;
    };

    const shippingCost = getShippingCost();

    // VAT calculation if enabled
    const vatAmount = settings.vatEnabled
        ? (totalPrice * (parseFloat(settings.taxPercentage || '0') / 100))
        : 0;

    // Calculate Discount
    let discountAmount = 0;
    if (appliedCoupon) {
        if (appliedCoupon.type === 'free_shipping') {
            discountAmount = shippingCost;
        } else if (appliedCoupon.type === 'percentage') {
            discountAmount = (totalPrice * (Number(appliedCoupon.discount) / 100));
        } else {
            discountAmount = Number(appliedCoupon.discount);
        }
        // Ensure discount doesn't exceed total (minus shipping/tax? usually discount applies to subtotal)
        discountAmount = Math.min(discountAmount, totalPrice);
    }

    // COD Advanced Settings and logic
    const isCodEnabled = settings.codEnabled ?? true;
    const isCodSelected = formData.paymentMethod === 'cod' && isCodEnabled;
    const codAdvancePaymentSetting = parseFloat(settings.codAdvancePayment || '100');
    const codReturnShippingBaseAmount = parseFloat(settings.codReturnShippingBaseAmount || '1000');
    const codReturnShippingBaseFee = parseFloat(settings.codReturnShippingBaseFee || '30');
    const codReturnShippingExtraAmount = parseFloat(settings.codReturnShippingExtraAmount || '1000');
    const codReturnShippingExtraFee = parseFloat(settings.codReturnShippingExtraFee || '5');

    // COD Return fee calculation
    let codReturnFee = 0;
    if (isCodSelected) {
        const amountForCODCalc = totalPrice; // Calculate return fee based on subtotal (products price)
        if (amountForCODCalc > 0) {
            const remainingAmount = Math.max(0, amountForCODCalc - codReturnShippingBaseAmount);
            const extraChunks = Math.ceil(remainingAmount / codReturnShippingExtraAmount);
            codReturnFee = codReturnShippingBaseFee + (extraChunks * codReturnShippingExtraFee);
        }
    }

    const codAdvancePaymentAmount = isCodSelected ? codAdvancePaymentSetting : 0;
    const finalTotal = Math.max(0, totalPrice + shippingCost + vatAmount + codReturnFee - discountAmount);
    
    // Total At Delivery = Final Total - Advance Payment (but never less than 0)
    const codTotalAtDelivery = isCodSelected ? Math.max(0, finalTotal - codAdvancePaymentAmount) : finalTotal;

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setIsApplyingCoupon(true);
        setCouponError('');
        try {
            // Dynamic import api if needed or use existing
            // api is imported at top level
            const { data } = await api.post('/coupons/validate', {
                code: couponCode,
                orderTotal: totalPrice
            });

            if (data.valid && data.coupon) {
                setAppliedCoupon(data.coupon);
                setCouponCode('');
                // toast.success('تم تطبيق الكوبون بنجاح');
            } else {
                setAppliedCoupon(null);
                setCouponError('الكوبون غير صالح');
            }
        } catch (err: any) {
            setAppliedCoupon(null);
            setCouponError(err.response?.data?.error || 'حدث خطأ أثناء تفعيل الكوبون');
        } finally {
            setIsApplyingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setCouponCode('');
    };

    const handleNextStep = (e: React.FormEvent) => {
        e.preventDefault();

        // Step 1 Validations
        if (step === 1) {
            // Validate Full Name (at least 2 words, each 2+ chars)
            const nameWords = formData.fullName.trim().split(/\s+/).filter(w => w.length >= 2);
            if (nameWords.length < 2) {
                setError('برجاء إدخال الاسم ثنائي على الأقل');
                return;
            }

            // Validate Phone Number
            if (!isValidEgyptianPhone(formData.phone)) {
                setError('برجاء إدخال رقم هاتف صحيح');
                return;
            }

            // Validate Phone 2 if provided
            if (formData.phone_2) {
                if (!isValidEgyptianPhone(formData.phone_2)) {
                    setError('رقم الهاتف الإضافي غير صحيح');
                    return;
                }
                if (formData.phone === formData.phone_2) {
                    setError('رقم الهاتف الإضافي يجب أن يكون مختلفاً عن الأساسي');
                    return;
                }
            }
        }

        // Validation for Wallet on Payment Step
        if (step === 2 && formData.paymentMethod === 'paymob_wallet') {
            if (!isValidEgyptianPhone(formData.walletNumber)) {
                setError('برجاء إدخال رقم محفظة صحيح');
                return;
            }
        }

        // Clear error if validation passes
        setError('');
        setStep(prev => Math.min(prev + 1, 3) as 1 | 2 | 3);
    };

    const handlePrevStep = () => {
        setError('');
        setStep(prev => Math.max(prev - 1, 1) as 1 | 2 | 3);
    };

    // Upsert the Draft Order and Handle Payment
    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError('');

        try {
            if (formData.paymentMethod === 'paymob_wallet') {
                if (!isValidEgyptianPhone(formData.walletNumber)) {
                    setError('برجاء إدخال رقم محفظة صحيح');
                }
            }

            // 0. Robust Cart Validation before starting payment flow
            const isCartValid = await validateCart();
            if (!isCartValid) {
                // validateCart already handles toast notifications and updating the local state
                setIsSubmitting(false);
                return;
            }

            const orderPayload = buildOrderData();

            // 1. Create or Update Draft Order (UPSERT)
            const endpoint = draftOrderId ? `/orders/${draftOrderId}` : '/orders';
            const method = draftOrderId ? api.put : api.post;

            const orderRes = await method(endpoint, orderPayload);
            const savedOrderId = orderRes.data.id;

            // Save to prevent duplicates on retry
            setDraftOrderId(savedOrderId);
            localStorage.setItem('checkout_draft_order_id', savedOrderId);

            const isOnlinePayment = ['paymob', 'paymob_wallet', 'online'].includes(formData.paymentMethod);

            if (isOnlinePayment) {
                // 2. Initiate Paymob Payment for this actual Order
                const { data } = await api.post('/checkout/initiate-payment', {
                    orderId: savedOrderId,
                    amount: finalTotal,
                    paymentMethod: formData.paymentMethod,
                    walletNumber: formData.paymentMethod === 'paymob_wallet' ? formData.walletNumber : undefined,
                    fullName: formData.fullName,
                    phone: formData.phone,
                    email: formData.email,
                    address: formData.address,
                    city: formData.city,
                    governorate: formData.governorate,
                });

                // 3. FULL PAGE REDIRECT (Solves 3D Secure / Iframe bugs completely)
                window.location.href = data.paymentUrl;
            } else {
                // COD: We are done!
                localStorage.removeItem('checkout_draft_order_id');
                clearCart();
                navigate(`/order-success/${savedOrderId}`);
            }
        } catch (err: any) {
            console.error('Checkout error:', err);
            const serverMsg = err?.response?.data?.error;
            setError(serverMsg || 'حدث خطأ أثناء معالجة الطلب. الرجاء المحاولة مرة أخرى.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (items.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 py-16 text-center">
                <h2 className="text-2xl font-bold text-white mb-4">السلة فارغة</h2>
                <button onClick={() => navigate('/shop')} className="text-primary hover:underline">
                    العودة للتسوق
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <CheckoutProgressBar currentStep={(step + 1) as 1 | 2 | 3 | 4} />

            <div className="grid lg:grid-cols-3 gap-8 mt-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2">
                    <div className="glass-panel p-4 md:p-6 rounded-2xl min-h-[400px]">
                        {error && <div className="bg-red-500/20 text-red-200 p-4 rounded-xl border border-red-500/20 mb-6">{error}</div>}

                        {/* Step 1: Shipping Information */}
                        {step === 1 && (
                            <form id="step1-form" onSubmit={handleNextStep} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">local_shipping</span>
                                    معلومات الشحن
                                </h2>

                                {user && addresses.length > 0 && (
                                    <div className="mb-8 space-y-4">
                                        <h3 className="text-sm font-medium text-gray-400">اختر عنوان التوصيل</h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            {addresses.map(addr => (
                                                <label
                                                    key={addr.id}
                                                    className={`relative flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all ${selectedAddressId === addr.id ? 'border-primary bg-primary/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="address_selection"
                                                        value={addr.id}
                                                        checked={selectedAddressId === addr.id}
                                                        onChange={() => setSelectedAddressId(addr.id)}
                                                        className="mt-1 accent-primary"
                                                    />
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-bold text-white">{addr.title}</span>
                                                            {addr.isDefault && <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">الافتراضي</span>}
                                                        </div>
                                                        <p className="text-sm text-gray-300">{addr.address}، {addr.city}، {addr.governorate}</p>
                                                        <p className="text-xs text-gray-400 mt-1">{addr.fullName} - {addr.phone}</p>
                                                    </div>
                                                </label>
                                            ))}
                                            <label
                                                className={`relative flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${selectedAddressId === 'new' ? 'border-primary bg-primary/10' : 'border-white/10 bg-white/5 hover:border-white/20'}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="address_selection"
                                                    value="new"
                                                    checked={selectedAddressId === 'new'}
                                                    onChange={() => setSelectedAddressId('new')}
                                                    className="accent-primary"
                                                />
                                                <span className="font-bold text-white">إستخدام عنوان جديد</span>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${selectedAddressId !== 'new' ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                                    <div className="space-y-2">
                                        <label className="block text-slate-400 text-sm font-medium">الاسم الكامل</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.fullName}
                                            onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-600 hover:bg-white/[0.07]"
                                            placeholder="أدخل اسمك بالكامل"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-slate-400 text-sm font-medium">البريد الإلكتروني (اختياري)</label>
                                        <input
                                            type="email"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-600 hover:bg-white/[0.07]"
                                            placeholder="name@example.com"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-slate-400 text-sm font-medium">رقم الهاتف</label>
                                        <input
                                            required
                                            type="tel"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-600 hover:bg-white/[0.07]"
                                            placeholder="01xxxxxxxxx"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-slate-400 text-sm font-medium">رقم هاتف إضافي (اختياري)</label>
                                        <input
                                            type="tel"
                                            value={formData.phone_2}
                                            onChange={e => setFormData({ ...formData, phone_2: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-600 hover:bg-white/[0.07]"
                                            placeholder="رقم بديل"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2 relative">
                                        <label className="text-white text-sm font-medium flex items-center justify-between">
                                            <span>المحافظة *</span>
                                        </label>
                                        <div className="relative">
                                            <select
                                                required
                                                value={formData.governorate}
                                                onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
                                                className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 pl-12 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
                                            >
                                                <option value="" disabled>اختر المحافظة...</option>
                                                {GOVERNORATES.map((gov) => (
                                                    <option key={gov} value={gov}>{gov}</option>
                                                ))}
                                            </select>
                                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                                                map
                                            </span>
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                                                expand_more
                                            </span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-slate-400 text-sm font-medium">المدينة</label>
                                        <input
                                            required
                                            type="text"
                                            value={formData.city}
                                            onChange={e => setFormData({ ...formData, city: e.target.value })}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-slate-600 hover:bg-white/[0.07]"
                                            placeholder="الحي / المنطقة"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-slate-400 text-sm font-medium">العنوان بالتفصيل</label>
                                    <textarea
                                        required
                                        rows={2}
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none placeholder:text-slate-600 hover:bg-white/[0.07]"
                                        placeholder="اسم الشارع، رقم العقار، الدور، علامة مميزة..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-slate-400 text-sm font-medium">ملاحظات (اختياري)</label>
                                    <textarea
                                        rows={2}
                                        value={formData.notes}
                                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none placeholder:text-slate-600 hover:bg-white/[0.07]"
                                        placeholder="أي ملاحظات إضافية للتوصيل..."
                                    />
                                </div>
                            </form>
                        )}

                        {/* Step 2: Payment Method */}
                        {step === 2 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">payments</span>
                                    طريقة الدفع
                                </h2>
                                <div className="space-y-3">
                                    {settings.codEnabled && (
                                        <label className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${formData.paymentMethod === 'cod' ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                                            <div className="flex items-center justify-center size-12 rounded-full bg-white/10 text-primary">
                                                <span className="material-symbols-outlined text-2xl">attach_money</span>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-white font-bold text-lg">الدفع عند الاستلام (COD)</span>
                                                    <input
                                                        type="radio"
                                                        name="payment"
                                                        value="cod"
                                                        checked={formData.paymentMethod === 'cod'}
                                                        onChange={() => setFormData({ ...formData, paymentMethod: 'cod' })}
                                                        className="accent-primary w-5 h-5"
                                                    />
                                                </div>
                                                <p className="text-slate-400 text-sm mt-1">ادفع نقداً عند استلام طلبك</p>
                                                {parseFloat(settings.codExtraFee || '0') > 0 && (
                                                    <p className="text-primary text-[10px] font-bold mt-1">+ {settings.codExtraFee} ج.م رسوم إضافية</p>
                                                )}
                                            </div>
                                        </label>
                                    )}

                                    {settings.paymobEnabled && (
                                        <>
                                            <label className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${formData.paymentMethod === 'paymob' ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                                                <div className="flex items-center justify-center size-12 rounded-full bg-white/10 text-primary">
                                                    <span className="material-symbols-outlined text-2xl">credit_card</span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-white font-bold text-lg">بطاقة بنكية (Credit/Debit)</span>
                                                        <input
                                                            type="radio"
                                                            name="payment"
                                                            value="paymob"
                                                            checked={formData.paymentMethod === 'paymob'}
                                                            onChange={() => setFormData({ ...formData, paymentMethod: 'paymob' })}
                                                            className="accent-primary w-5 h-5"
                                                        />
                                                    </div>
                                                    <p className="text-slate-400 text-sm mt-1">Paymob (Visa / Mastercard)</p>
                                                </div>
                                            </label>

                                            <label className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${formData.paymentMethod === 'paymob_wallet' ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                                                <div className="flex items-center justify-center size-12 rounded-full bg-white/10 text-primary">
                                                    <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-white font-bold text-lg">محفظة إلكترونية</span>
                                                        <input
                                                            type="radio"
                                                            name="payment"
                                                            value="paymob_wallet"
                                                            checked={formData.paymentMethod === 'paymob_wallet'}
                                                            onChange={() => setFormData({ ...formData, paymentMethod: 'paymob_wallet' })}
                                                            className="accent-primary w-5 h-5"
                                                        />
                                                    </div>
                                                    <p className="text-slate-400 text-sm mt-1">Vodafone Cash / Etisalat / Orange</p>

                                                    {/* Wallet Number Input */}
                                                    {formData.paymentMethod === 'paymob_wallet' && (
                                                        <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                                                            <label className="text-white text-xs mb-1 block">رقم المحفظة (مطلوب)</label>
                                                            <input
                                                                type="tel"
                                                                required
                                                                placeholder="010xxxxxxxx"
                                                                value={formData.walletNumber}
                                                                onChange={(e) => {
                                                                    setFormData({ ...formData, walletNumber: e.target.value });
                                                                    if (error) setError('');
                                                                }}
                                                                className="w-full bg-black/20 text-white border border-white/10 rounded-lg px-3 py-2 text-sm focus:border-primary outline-none"
                                                                onClick={(e) => e.stopPropagation()}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </label>
                                        </>
                                    )}

                                    {!settings.codEnabled && !settings.paymobEnabled && (
                                        <div className="p-8 text-center glass-panel rounded-2xl border-white/10 border border-dashed">
                                            <span className="material-symbols-outlined text-4xl text-slate-500 mb-2">pending</span>
                                            <p className="text-slate-400">طرق الدفع غير متاحة حالياً، يرجى التواصل مع الدعم الفني.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Review */}
                        {step === 3 && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <span className="material-symbols-outlined text-primary">summarize</span>
                                    مراجعة الطلب
                                </h2>

                                <div className="bg-white/5 rounded-xl p-4 space-y-4">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <h3 className="text-slate-400 text-sm mb-2">عنوان الشحن</h3>
                                            <p className="text-white font-medium">{formData.fullName}</p>
                                            <p className="text-slate-300 text-sm mt-1">
                                                {formData.address}، {formData.city}، {formData.governorate}
                                            </p>
                                            <p className="text-slate-300 text-sm mt-1">{formData.phone}</p>
                                        </div>
                                        <h3 className="text-slate-400 text-sm mb-2">طريقة الدفع</h3>
                                        <p className="text-white font-medium flex items-center gap-2">
                                            <span className="material-symbols-outlined text-emerald-400 text-lg">
                                                {formData.paymentMethod === 'cod' ? 'payments' :
                                                    formData.paymentMethod === 'paymob_wallet' ? 'account_balance_wallet' : 'credit_card'}
                                            </span>
                                            {formData.paymentMethod === 'cod' ? 'الدفع عند الاستلام' :
                                                formData.paymentMethod === 'paymob_wallet' ? 'محفظة إلكترونية' : 'بطاقة بنكية (Paymob)'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Wizard Controls */}
                        <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
                            {step > 1 ? (
                                <button
                                    onClick={handlePrevStep}
                                    type="button"
                                    className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors"
                                >
                                    سابق
                                </button>
                            ) : (
                                <Link
                                    to="/cart"
                                    className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-white font-medium transition-colors flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined rtl:rotate-180">arrow_back</span>
                                    العودة للسلة
                                </Link>
                            )}

                            {step < 3 ? (
                                <button
                                    form={step === 1 ? "step1-form" : undefined}
                                    onClick={step === 2 ? handleNextStep : undefined}
                                    type={step === 1 ? "submit" : "button"}
                                    className="bg-primary hover:bg-primary-dark text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 flex items-center gap-2"
                                >
                                    <span>التالي</span>
                                    <span className="material-symbols-outlined rtl:rotate-180">arrow_forward</span>
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <span>تأكيد الطلب</span>
                                            <span className="material-symbols-outlined">check_circle</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Summary Sidebar */}
                <div className="lg:col-span-1">
                    <div className="glass-panel p-4 md:p-6 rounded-2xl sticky top-24">
                        <h3 className="text-lg font-bold text-white mb-4">ملخص الطلب</h3>
                        <div className="space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {items.map(item => (
                                <div key={item.id} className="flex gap-3 text-sm">
                                    <div className="size-16 rounded-lg bg-white/5 border border-white/10 shrink-0 overflow-hidden">
                                        <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-white line-clamp-2">{item.name}</p>
                                        <p className="text-slate-400">{item.quantity} x {item.price.toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-white/10 pt-4 space-y-3 text-sm">
                            <div className="flex justify-between text-slate-400">
                                <span>المجموع الفرعي</span>
                                <span>{totalPrice.toLocaleString()} ج.م</span>
                            </div>

                            <div className="flex justify-between text-slate-400">
                                <span>مصاريف الشحن</span>
                                <span>{shippingCost === 0 ? 'مجاني' : `${shippingCost.toLocaleString()} ج.م`}</span>
                            </div>

                            {/* COD Return Fee (if applicable) */}
                            {isCodSelected && codReturnFee > 0 && (
                                <div className="flex justify-between text-slate-400 group relative">
                                    <span className="flex items-center gap-1 cursor-help underline decoration-dashed underline-offset-4 decoration-slate-500">
                                        رسوم شحن عودة المبلغ (COD)
                                        <span className="material-symbols-outlined text-[14px] text-slate-500">info</span>
                                        
                                        {/* Tooltip */}
                                        <div className="absolute top-6 right-0 w-64 bg-[#1a1d24] text-slate-300 text-xs p-3 rounded-lg border border-[#3b4354] shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                            تقوم شركة الشحن بخصم هذه المصاريف كعمولة تحصيل لترد لنا قيمة الطلب نقداً.
                                        </div>
                                    </span>
                                    <span className="text-orange-400 font-bold">+{codReturnFee.toFixed(2)} ج.م</span>
                                </div>
                            )}

                            {settings.vatEnabled && vatAmount > 0 && (
                                <div className="flex justify-between text-slate-400">
                                    <span>ضريبة القيمة المضافة ({settings.taxPercentage}%)</span>
                                    <span>{vatAmount.toFixed(2)} ج.م</span>
                                </div>
                            )}

                            {/* Coupon Input */}
                            <div className="pt-2 border-t border-white/5">
                                {!appliedCoupon ? (
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value)}
                                            placeholder="كود الخصم"
                                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-primary outline-none"
                                        />
                                        <button
                                            onClick={handleApplyCoupon}
                                            disabled={isApplyingCoupon || !couponCode}
                                            className="bg-primary/20 hover:bg-primary/30 text-primary px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                                        >
                                            {isApplyingCoupon ? '...' : 'تطبيق'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-emerald-500 text-sm">local_offer</span>
                                            <div>
                                                <p className="text-emerald-500 text-sm font-bold">{appliedCoupon.code}</p>
                                                <p className="text-emerald-500/70 text-[10px]">تم تطبيق الخصم</p>
                                            </div>
                                        </div>
                                        <button onClick={handleRemoveCoupon} className="text-red-400 hover:text-red-300">
                                            <span className="material-symbols-outlined text-lg">close</span>
                                        </button>
                                    </div>
                                )}
                                {couponError && <p className="text-red-400 text-xs mt-1">{couponError}</p>}
                            </div>

                            {discountAmount > 0 && (
                                <div className="flex justify-between text-emerald-400">
                                    <span>خصم الكوبون</span>
                                    <span>- {discountAmount.toLocaleString()} ج.م</span>
                                </div>
                            )}
                            <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-white/10">
                                <span>الإجمالي الكلي</span>
                                <span className="text-primary">{finalTotal.toLocaleString()} ج.م</span>
                            </div>

                            {/* COD Advance Payment Notice */}
                            {isCodSelected && (
                                <div className="mt-4 space-y-3">
                                    <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
                                        <div className="flex items-start gap-2">
                                            <span className="material-symbols-outlined text-orange-400 text-sm mt-0.5">error</span>
                                            <div>
                                                <h4 className="text-orange-400 font-bold text-xs mb-1">لتأكيد الطلب</h4>
                                                <p className="text-gray-300 text-[11px] leading-relaxed">
                                                    سيتم التواصل معك لتحصيل <strong className="text-white">{codAdvancePaymentAmount.toLocaleString()} ج.م</strong> كمقدم تأكيد طلب (فودافون كاش / إنستاباي).
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center text-sm text-gray-400">
                                        <span>مطلوب دفعه مقدماً لتأكيد الطلب</span>
                                        <span className="text-white">{codAdvancePaymentAmount.toLocaleString()} ج.م</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm font-bold bg-white/5 p-3 rounded-lg border border-white/10">
                                        <span className="text-white">المبلغ المُتبقي وقت الاستلام</span>
                                        <span className="text-emerald-400">{codTotalAtDelivery.toLocaleString()} ج.م</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Full Screen Loading Overlay */}
            {isSubmitting && (
                <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
                    <div className="size-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
                    <h3 className="text-xl font-bold text-white mb-2">جاري تنفيذ الطلب...</h3>
                    <p className="text-slate-400 text-sm">برجاء الانتظار، لا تقم بإغلاق الصفحة</p>
                </div>
            )}
        </div>
    );
}

export default CheckoutPage;
