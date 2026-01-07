import { useState } from 'react';
import { Link } from 'react-router-dom';

type CheckoutStep = 'shipping' | 'payment' | 'review';

const ORDER_ITEMS = [
    { name: 'Sunmi V2 Pro', price: 5500, quantity: 1 },
    { name: 'قارئ باركود 2D', price: 1200, quantity: 2 },
];

import { CheckoutProgressBar } from '../components/checkout';

export function CheckoutPage() {
    const [currentStep, setCurrentStep] = useState<CheckoutStep>('shipping');
    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        email: '',
        governorate: '',
        city: '',
        address: '',
        notes: '',
        paymentMethod: 'cod',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const goToStep = (step: CheckoutStep) => {
        setCurrentStep(step);
    };

    const handleNext = () => {
        if (currentStep === 'shipping') setCurrentStep('payment');
        else if (currentStep === 'payment') setCurrentStep('review');
    };

    const handleBack = () => {
        if (currentStep === 'payment') setCurrentStep('shipping');
        else if (currentStep === 'review') setCurrentStep('payment');
    };

    const subtotal = ORDER_ITEMS.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shipping = 0;
    const total = subtotal + shipping;

    // Map checkout steps to progress bar steps (1=Cart, 2=Shipping, 3=Payment, 4=Review)
    const progressBarStep = currentStep === 'shipping' ? 2 : currentStep === 'payment' ? 3 : 4;

    return (
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
            {/* Breadcrumb */}
            <nav className="flex mb-8 text-sm font-medium text-gray-400">
                <ol className="flex items-center gap-2">
                    <li><Link to="/" className="hover:text-primary transition-colors">الرئيسية</Link></li>
                    <li><span className="material-symbols-outlined text-sm">chevron_left</span></li>
                    <li><Link to="/cart" className="hover:text-primary transition-colors">السلة</Link></li>
                    <li><span className="material-symbols-outlined text-sm">chevron_left</span></li>
                    <li className="text-white font-bold">إتمام الطلب</li>
                </ol>
            </nav>

            {/* Progress Steps */}
            <CheckoutProgressBar currentStep={progressBarStep as 2 | 3 | 4} />

            <div className="grid lg:grid-cols-3 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-2">
                    {/* Shipping Step */}
                    {currentStep === 'shipping' && (
                        <div className="glass-panel rounded-2xl p-6">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">local_shipping</span>
                                معلومات الشحن
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">الاسم بالكامل *</label>
                                    <input
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        className="w-full h-12 bg-[#181a20] border border-white/10 rounded-xl px-4 text-white focus:border-primary focus:ring-1 focus:ring-primary placeholder-gray-500 transition-all"
                                        placeholder="أحمد محمد"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">رقم الهاتف *</label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleInputChange}
                                        className="w-full h-12 bg-[#181a20] border border-white/10 rounded-xl px-4 text-white focus:border-primary focus:ring-1 focus:ring-primary placeholder-gray-500 transition-all text-left dir-ltr"
                                        placeholder="01xxxxxxxxx"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">البريد الإلكتروني</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        className="w-full h-12 bg-[#181a20] border border-white/10 rounded-xl px-4 text-white focus:border-primary focus:ring-1 focus:ring-primary placeholder-gray-500 transition-all text-left dir-ltr"
                                        placeholder="email@example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">المحافظة *</label>
                                    <select
                                        name="governorate"
                                        value={formData.governorate}
                                        onChange={handleInputChange}
                                        className="w-full h-12 bg-[#181a20] border border-white/10 rounded-xl px-4 text-white focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                    >
                                        <option value="">اختر المحافظة</option>
                                        <option value="cairo">القاهرة</option>
                                        <option value="giza">الجيزة</option>
                                        <option value="alexandria">الإسكندرية</option>
                                        <option value="other">محافظة أخرى</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-300 mb-2">المدينة *</label>
                                    <input
                                        type="text"
                                        name="city"
                                        value={formData.city}
                                        onChange={handleInputChange}
                                        className="w-full h-12 bg-[#181a20] border border-white/10 rounded-xl px-4 text-white focus:border-primary focus:ring-1 focus:ring-primary placeholder-gray-500 transition-all"
                                        placeholder="اسم المدينة أو الحي"
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">العنوان بالتفصيل *</label>
                                    <textarea
                                        name="address"
                                        value={formData.address}
                                        onChange={handleInputChange}
                                        rows={3}
                                        className="w-full bg-[#181a20] border border-white/10 rounded-xl px-4 py-3 text-white focus:border-primary focus:ring-1 focus:ring-primary placeholder-gray-500 transition-all resize-none"
                                        placeholder="شارع، مبنى، شقة..."
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-300 mb-2">ملاحظات إضافية</label>
                                    <input
                                        type="text"
                                        name="notes"
                                        value={formData.notes}
                                        onChange={handleInputChange}
                                        className="w-full h-12 bg-[#181a20] border border-white/10 rounded-xl px-4 text-white focus:border-primary focus:ring-1 focus:ring-primary placeholder-gray-500 transition-all"
                                        placeholder="علامة مميزة، وقت التوصيل المفضل..."
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <Link
                                    to="/cart"
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 border border-white/10 transition-all active:scale-[0.98]"
                                >
                                    <span className="material-symbols-outlined rtl:rotate-180">arrow_back</span>
                                    الرجوع للسلة
                                </Link>
                                <button
                                    onClick={handleNext}
                                    className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
                                >
                                    متابعة للدفع
                                    <span className="material-symbols-outlined rtl:rotate-180">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Payment Step */}
                    {currentStep === 'payment' && (
                        <div className="glass-panel rounded-2xl p-6">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">payments</span>
                                طريقة الدفع
                            </h2>

                            <div className="flex flex-col gap-4">
                                {[
                                    { id: 'cod', label: 'الدفع عند الاستلام', icon: 'payments', desc: 'ادفع كاش للمندوب عند التوصيل' },
                                    { id: 'card', label: 'بطاقة ائتمان', icon: 'credit_card', desc: 'Visa, Mastercard' },
                                    { id: 'wallet', label: 'المحافظ الإلكترونية', icon: 'account_balance_wallet', desc: 'فودافون كاش، اتصالات كاش' },
                                ].map((method) => (
                                    <label
                                        key={method.id}
                                        className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${formData.paymentMethod === method.id ? 'border-primary bg-primary/10' : 'border-white/10 hover:border-white/20 bg-[#181a20]'}`}
                                    >
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value={method.id}
                                            checked={formData.paymentMethod === method.id}
                                            onChange={handleInputChange}
                                            className="sr-only"
                                        />
                                        <div className={`size-12 rounded-xl flex items-center justify-center ${formData.paymentMethod === method.id ? 'bg-primary text-white' : 'bg-white/5 text-gray-400'}`}>
                                            <span className="material-symbols-outlined text-2xl">{method.icon}</span>
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-white font-bold">{method.label}</span>
                                            <p className="text-gray-400 text-sm">{method.desc}</p>
                                        </div>
                                        <div className={`size-6 rounded-full border-2 ${formData.paymentMethod === method.id ? 'border-primary bg-primary' : 'border-gray-600'}`}>
                                            {formData.paymentMethod === method.id && (
                                                <span className="material-symbols-outlined text-white text-lg">check</span>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button
                                    onClick={handleBack}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 border border-white/10 transition-all active:scale-[0.98]"
                                >
                                    <span className="material-symbols-outlined rtl:rotate-180">arrow_back</span>
                                    الرجوع للشحن
                                </button>
                                <button
                                    onClick={handleNext}
                                    className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/25 transition-all active:scale-[0.98]"
                                >
                                    مراجعة الطلب
                                    <span className="material-symbols-outlined rtl:rotate-180">arrow_forward</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Review Step */}
                    {currentStep === 'review' && (
                        <div className="glass-panel rounded-2xl p-6">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">fact_check</span>
                                مراجعة الطلب
                            </h2>

                            {/* Shipping Info Summary */}
                            <div className="bg-[#181a20] rounded-xl p-4 mb-4 border border-white/5">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-white font-bold flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-lg">location_on</span>
                                        عنوان التوصيل
                                    </h4>
                                    <button onClick={() => goToStep('shipping')} className="text-primary text-sm hover:underline">تعديل</button>
                                </div>
                                <p className="text-gray-300 text-sm">{formData.fullName || 'الاسم'} • {formData.phone || 'الهاتف'}</p>
                                <p className="text-gray-400 text-sm">{formData.address || 'العنوان'}, {formData.city || 'المدينة'}, {formData.governorate || 'المحافظة'}</p>
                            </div>

                            {/* Payment Method Summary */}
                            <div className="bg-[#181a20] rounded-xl p-4 mb-6 border border-white/5">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-white font-bold flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary text-lg">payments</span>
                                        طريقة الدفع
                                    </h4>
                                    <button onClick={() => goToStep('payment')} className="text-primary text-sm hover:underline">تعديل</button>
                                </div>
                                <p className="text-gray-300 text-sm">
                                    {formData.paymentMethod === 'cod' && 'الدفع عند الاستلام'}
                                    {formData.paymentMethod === 'card' && 'بطاقة ائتمان'}
                                    {formData.paymentMethod === 'wallet' && 'المحافظ الإلكترونية'}
                                </p>
                            </div>

                            <div className="flex gap-4 mt-8">
                                <button
                                    onClick={handleBack}
                                    className="flex-1 bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 border border-white/10 transition-all active:scale-[0.98]"
                                >
                                    <span className="material-symbols-outlined rtl:rotate-180">arrow_back</span>
                                    الرجوع للدفع
                                </button>
                                <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all active:scale-[0.98]">
                                    <span className="material-symbols-outlined">check_circle</span>
                                    تأكيد الطلب
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Order Summary Sidebar */}
                <div className="lg:col-span-1">
                    <div className="glass-panel rounded-2xl p-6 sticky top-24">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">receipt</span>
                            ملخص الطلب
                        </h3>

                        <div className="flex flex-col gap-3 mb-4">
                            {ORDER_ITEMS.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                    <span className="text-gray-300">{item.name} × {item.quantity}</span>
                                    <span className="text-white font-medium">{(item.price * item.quantity).toLocaleString()} ج.م</span>
                                </div>
                            ))}
                        </div>

                        <div className="h-px bg-white/10 my-4"></div>

                        <div className="flex flex-col gap-2 text-sm">
                            <div className="flex justify-between text-gray-300">
                                <span>المجموع الفرعي</span>
                                <span>{subtotal.toLocaleString()} ج.م</span>
                            </div>
                            <div className="flex justify-between text-gray-300">
                                <span>الشحن</span>
                                <span className="text-emerald-400">مجاني</span>
                            </div>
                        </div>

                        <div className="h-px bg-white/10 my-4"></div>

                        <div className="flex justify-between text-white">
                            <span className="font-bold">الإجمالي</span>
                            <span className="font-extrabold text-xl text-primary">{total.toLocaleString()} ج.م</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CheckoutPage;
