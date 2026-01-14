import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';

type Tab = 'general' | 'contact' | 'social' | 'shipping' | 'tax' | 'payment';

export default function SettingsPage() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<Tab>('general');

    // Form state
    const [formData, setFormData] = useState({
        // General
        storeNameAr: '',
        storeNameEn: '',
        logoUrl: '',
        faviconUrl: '',
        metaTitle: '',
        metaDescription: '',
        metaKeywords: '',
        // Contact
        supportPhone: '',
        supportEmail: '',
        address: '',
        // Social Media
        facebook: '',
        instagram: '',
        whatsapp: '',
        twitterX: '',
        // Shipping
        shippingFlatRate: '50',
        freeShippingThreshold: '2000',
        customCityRatesEnabled: false,
        // Tax
        vatEnabled: true,
        taxPercentage: '14',
        taxRegistrationNumber: '',
        pricesIncludeTax: true,
        // Payment
        codEnabled: true,
        codExtraFee: '0',
        paymobEnabled: false,
        paymobApiKey: '',
        paymobIntegrationCard: '',
        paymobIntegrationWallet: '',
        paymobIframeId: '',
        // City Rates
        cityShippingRates: [] as { city: string; rate: number }[],
    });

    // Fetch settings
    const { data: settings, isLoading } = useQuery({
        queryKey: ['admin-settings'],
        queryFn: async () => {
            const { data } = await api.get('/settings');
            return data;
        },
    });

    // Load settings into form
    useEffect(() => {
        if (settings) {
            setFormData(prev => ({
                ...prev,
                ...settings,
                // Convert boolean values properly
                vatEnabled: settings.vatEnabled ?? true,
                pricesIncludeTax: settings.pricesIncludeTax ?? true,
                codEnabled: settings.codEnabled ?? true,
                paymobEnabled: settings.paymobEnabled ?? false,
                customCityRatesEnabled: settings.customCityRatesEnabled ?? false,
            }));
        }
    }, [settings]);

    // Save mutation
    const saveMutation = useMutation({
        mutationFn: async (data: typeof formData) => {
            const { data: response } = await api.put('/settings', data);
            return response;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
            queryClient.invalidateQueries({ queryKey: ['settings'] });
            toast.success('تم حفظ الإعدادات بنجاح');
        },
        onError: () => {
            toast.error('حدث خطأ أثناء حفظ الإعدادات');
        },
    });

    const handleSave = () => {
        saveMutation.mutate(formData);
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="size-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const tabs: { id: Tab; label: string; icon: string }[] = [
        { id: 'general', label: 'عام', icon: 'store' },
        { id: 'contact', label: 'التواصل', icon: 'contact_phone' },
        { id: 'social', label: 'مواقع التواصل', icon: 'share' },
        { id: 'shipping', label: 'الشحن', icon: 'local_shipping' },
        { id: 'tax', label: 'الضرائب', icon: 'receipt_long' },
        { id: 'payment', label: 'الدفع', icon: 'payments' },
    ];

    return (
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-10 z-10 scroll-smooth">
            <div className="max-w-5xl mx-auto flex flex-col gap-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-white/5">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-white text-3xl md:text-4xl font-bold leading-tight">إعدادات المتجر</h1>
                        <p className="text-[#9da6b9] text-base font-normal max-w-2xl">
                            التحكم الكامل في إعدادات متجرك من معلومات الاتصال إلى طرق الدفع والشحن
                        </p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/10 scrollbar-hide">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === tab.id
                                ? 'bg-primary text-white shadow-lg'
                                : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                                }`}
                        >
                            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="glass-panel backdrop-blur-md rounded-xl border border-white/10 p-6 shadow-lg">
                    {/* General Tab */}
                    {activeTab === 'general' && (
                        <div className="space-y-6">
                            <h3 className="text-white text-xl font-bold mb-4">المعلومات العامة</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-white text-sm font-medium">اسم المتجر (عربي)</label>
                                    <input
                                        type="text"
                                        value={formData.storeNameAr || ''}
                                        onChange={(e) => setFormData({ ...formData, storeNameAr: e.target.value })}
                                        className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                        placeholder="مركز العامر لأنظمة الكاشير"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-white text-sm font-medium">Store Name (English)</label>
                                    <input
                                        type="text"
                                        value={formData.storeNameEn || ''}
                                        onChange={(e) => setFormData({ ...formData, storeNameEn: e.target.value })}
                                        className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                        placeholder="Al3amer POS Systems"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-white text-sm font-medium">رابط الشعار (Logo URL)</label>
                                    <input
                                        type="url"
                                        value={formData.logoUrl || ''}
                                        onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                                        className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                        placeholder="https://"
                                    />
                                    {formData.logoUrl && (
                                        <div className="mt-2 p-3 bg-white/5 rounded-lg border border-white/10">
                                            <img src={formData.logoUrl} alt="Logo Preview" className="h-16 object-contain" />
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-white text-sm font-medium">رابط الأيقونة (Favicon URL)</label>
                                    <input
                                        type="url"
                                        value={formData.faviconUrl || ''}
                                        onChange={(e) => setFormData({ ...formData, faviconUrl: e.target.value })}
                                        className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                        placeholder="https://"
                                    />
                                    {formData.faviconUrl && (
                                        <div className="mt-2 p-3 bg-white/5 rounded-lg border border-white/10">
                                            <img src={formData.faviconUrl} alt="Favicon Preview" className="h-8 w-8 object-contain" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-white text-sm font-medium">وصف المتجر (Meta Description)</label>
                                <textarea
                                    rows={3}
                                    value={formData.metaDescription || ''}
                                    onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                                    className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                                    placeholder="وجهتك الأولى في مصر لأحدث أنظمة الكاشير والباركود..."
                                />
                            </div>
                        </div>
                    )}

                    {/* Contact Tab */}
                    {activeTab === 'contact' && (
                        <div className="space-y-6">
                            <h3 className="text-white text-xl font-bold mb-4">معلومات التواصل</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-white text-sm font-medium">رقم الهاتف</label>
                                    <input
                                        type="tel"
                                        value={formData.supportPhone || ''}
                                        onChange={(e) => setFormData({ ...formData, supportPhone: e.target.value })}
                                        className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                        placeholder="+20 101 234 5678"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-white text-sm font-medium">البريد الإلكتروني</label>
                                    <input
                                        type="email"
                                        value={formData.supportEmail || ''}
                                        onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                                        className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                        placeholder="support@al3amer.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-white text-sm font-medium">العنوان</label>
                                <textarea
                                    rows={2}
                                    value={formData.address || ''}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                                    placeholder="القاهرة، مدينة نصر، شارع عباس العقاد"
                                />
                            </div>
                        </div>
                    )}

                    {/* Social Media Tab */}
                    {activeTab === 'social' && (
                        <div className="space-y-6">
                            <h3 className="text-white text-xl font-bold mb-4">روابط مواقع التواصل الاجتماعي</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-white text-sm font-medium flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">facebook</span>
                                        Facebook
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.facebook || ''}
                                        onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
                                        className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                        placeholder="https://facebook.com/yourbusiness"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-white text-sm font-medium flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">photo_camera</span>
                                        Instagram
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.instagram || ''}
                                        onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                                        className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                        placeholder="https://instagram.com/yourbusiness"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-white text-sm font-medium flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">chat</span>
                                        WhatsApp
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.whatsapp || ''}
                                        onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                        className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                        placeholder="https://wa.me/201012345678"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-white text-sm font-medium flex items-center gap-2">
                                        <span className="material-symbols-outlined text-primary">alternate_email</span>
                                        Twitter/X
                                    </label>
                                    <input
                                        type="url"
                                        value={formData.twitterX || ''}
                                        onChange={(e) => setFormData({ ...formData, twitterX: e.target.value })}
                                        className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                        placeholder="https://twitter.com/yourbusiness"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Shipping Tab */}
                    {activeTab === 'shipping' && (
                        <div className="space-y-6">
                            <h3 className="text-white text-xl font-bold mb-4">إعدادات الشحن</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-white text-sm font-medium">تكلفة الشحن الثابتة (ج.م)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.shippingFlatRate || ''}
                                        onChange={(e) => setFormData({ ...formData, shippingFlatRate: e.target.value })}
                                        className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                        placeholder="50"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-white text-sm font-medium">الحد الأدنى للشحن المجاني (ج.م)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.freeShippingThreshold || ''}
                                        onChange={(e) => setFormData({ ...formData, freeShippingThreshold: e.target.value })}
                                        className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                        placeholder="2000"
                                    />
                                </div>
                            </div>

                            <div className="border-t border-white/10 pt-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-white font-bold">مصاريف الشحن حسب المحافظة/المدينة</h4>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({
                                            ...formData,
                                            cityShippingRates: [...(formData.cityShippingRates || []), { city: '', rate: 0 }]
                                        })}
                                        className="bg-primary/20 hover:bg-primary/30 text-primary text-sm font-bold py-2 px-4 rounded-lg transition-all flex items-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-sm">add</span>
                                        إضافة محافظة
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {(formData.cityShippingRates || []).map((rate, index) => (
                                        <div key={index} className="flex gap-4 items-end bg-black/20 p-4 rounded-xl border border-white/5">
                                            <div className="flex-1 space-y-2">
                                                <label className="text-gray-400 text-xs">المحافظة / المدينة</label>
                                                <input
                                                    type="text"
                                                    value={rate.city}
                                                    onChange={(e) => {
                                                        const newRates = [...formData.cityShippingRates];
                                                        newRates[index].city = e.target.value;
                                                        setFormData({ ...formData, cityShippingRates: newRates });
                                                    }}
                                                    className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary transition-all text-sm"
                                                    placeholder="مثال: القاهرة"
                                                />
                                            </div>
                                            <div className="w-40 space-y-2">
                                                <label className="text-gray-400 text-xs">التكلفة (ج.م)</label>
                                                <input
                                                    type="number"
                                                    value={rate.rate}
                                                    onChange={(e) => {
                                                        const newRates = [...formData.cityShippingRates];
                                                        newRates[index].rate = parseFloat(e.target.value) || 0;
                                                        setFormData({ ...formData, cityShippingRates: newRates });
                                                    }}
                                                    className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary transition-all text-sm"
                                                />
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const newRates = formData.cityShippingRates.filter((_, i) => i !== index);
                                                    setFormData({ ...formData, cityShippingRates: newRates });
                                                }}
                                                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-3 rounded-lg transition-all"
                                            >
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                        </div>
                                    ))}

                                    {(formData.cityShippingRates || []).length === 0 && (
                                        <p className="text-gray-500 text-sm italic text-center py-4 bg-white/5 rounded-xl border border-dashed border-white/10">
                                            لم يتم إضافة مصاريف شحن مخصصة بعد. سيتم استخدام التكلفة الثابتة لجميع المحافظات.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tax Tab */}
                    {activeTab === 'tax' && (
                        <div className="space-y-6">
                            <h3 className="text-white text-xl font-bold mb-4">إعدادات الضرائب</h3>

                            <label className="flex items-center gap-3 p-4 rounded-lg border border-white/10 bg-white/5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.vatEnabled}
                                    onChange={(e) => setFormData({ ...formData, vatEnabled: e.target.checked })}
                                    className="w-5 h-5 accent-primary"
                                />
                                <div>
                                    <span className="text-white font-medium">تفعيل ضريبة القيمة المضافة (VAT)</span>
                                    <p className="text-sm text-gray-400">إضافة ضريبة القيمة المضافة على الطلبات</p>
                                </div>
                            </label>

                            {formData.vatEnabled && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-white text-sm font-medium">نسبة الضريبة (%)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            value={formData.taxPercentage || ''}
                                            onChange={(e) => setFormData({ ...formData, taxPercentage: e.target.value })}
                                            className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                            placeholder="14"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-white text-sm font-medium">رقم التسجيل الضريبي</label>
                                        <input
                                            type="text"
                                            value={formData.taxRegistrationNumber || ''}
                                            onChange={(e) => setFormData({ ...formData, taxRegistrationNumber: e.target.value })}
                                            className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                            placeholder="اختياري"
                                        />
                                    </div>
                                </div>
                            )}

                            <label className="flex items-center gap-3 p-4 rounded-lg border border-white/10 bg-white/5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.pricesIncludeTax}
                                    onChange={(e) => setFormData({ ...formData, pricesIncludeTax: e.target.checked })}
                                    className="w-5 h-5 accent-primary"
                                />
                                <div>
                                    <span className="text-white font-medium">الأسعار تشمل الضريبة</span>
                                    <p className="text-sm text-gray-400">الأسعار المعروضة تشمل ضريبة القيمة المضافة</p>
                                </div>
                            </label>
                        </div>
                    )}

                    {/* Payment Tab */}
                    {activeTab === 'payment' && (
                        <div className="space-y-6">
                            <h3 className="text-white text-xl font-bold mb-4">طرق الدفع</h3>

                            <label className="flex items-center gap-3 p-4 rounded-lg border border-white/10 bg-white/5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={formData.codEnabled}
                                    onChange={(e) => setFormData({ ...formData, codEnabled: e.target.checked })}
                                    className="w-5 h-5 accent-primary"
                                />
                                <div>
                                    <span className="text-white font-medium">الدفع عند الاستلام (COD)</span>
                                    <p className="text-sm text-gray-400">السماح بالدفع نقداً عند استلام الطلب</p>
                                </div>
                            </label>

                            {formData.codEnabled && (
                                <div className="space-y-2">
                                    <label className="text-white text-sm font-medium">رسوم إضافية للدفع عند الاستلام (ج.م)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formData.codExtraFee || ''}
                                        onChange={(e) => setFormData({ ...formData, codExtraFee: e.target.value })}
                                        className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                        placeholder="0"
                                    />
                                </div>
                            )}

                            <div className="border-t border-white/10 pt-6">
                                <label className="flex items-center gap-3 p-4 rounded-lg border border-white/10 bg-white/5 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.paymobEnabled}
                                        onChange={(e) => setFormData({ ...formData, paymobEnabled: e.target.checked })}
                                        className="w-5 h-5 accent-primary"
                                    />
                                    <div>
                                        <span className="text-white font-medium">Paymob (الدفع الإلكتروني)</span>
                                        <p className="text-sm text-gray-400">تفعيل الدفع عبر بطاقات الائتمان والمحافظ الإلكترونية</p>
                                    </div>
                                </label>

                                {formData.paymobEnabled && (
                                    <div className="mt-4 space-y-4 bg-black/20 p-4 rounded-lg">
                                        <div className="space-y-2">
                                            <label className="text-white text-sm font-medium">Paymob API Key</label>
                                            <input
                                                type="password"
                                                value={formData.paymobApiKey || ''}
                                                onChange={(e) => setFormData({ ...formData, paymobApiKey: e.target.value })}
                                                className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                                placeholder="••••••••"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-white text-sm font-medium">Integration ID (Card)</label>
                                                <input
                                                    type="text"
                                                    value={formData.paymobIntegrationCard || ''}
                                                    onChange={(e) => setFormData({ ...formData, paymobIntegrationCard: e.target.value })}
                                                    className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-white text-sm font-medium">Integration ID (Wallet)</label>
                                                <input
                                                    type="text"
                                                    value={formData.paymobIntegrationWallet || ''}
                                                    onChange={(e) => setFormData({ ...formData, paymobIntegrationWallet: e.target.value })}
                                                    className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-white text-sm font-medium">Paymob Iframe ID</label>
                                            <input
                                                type="text"
                                                value={formData.paymobIframeId || ''}
                                                onChange={(e) => setFormData({ ...formData, paymobIframeId: e.target.value })}
                                                className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                                placeholder="e.g. 123456"
                                            />
                                            <p className="text-[10px] text-gray-500 italic">هذا المعرف مطلوب لعرض صفحة الدفع (Iframe) بشكل صحيح.</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Action Footer */}
                <div className="sticky bottom-4 z-50">
                    <div className="bg-[#1e232d]/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 flex items-center justify-end gap-4 shadow-2xl">
                        <button
                            onClick={handleSave}
                            disabled={saveMutation.isPending}
                            className="bg-primary hover:bg-blue-600 text-white text-base font-bold py-2.5 px-8 rounded-lg shadow-lg shadow-primary/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saveMutation.isPending ? (
                                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <span className="material-symbols-outlined text-[20px]">save</span>
                            )}
                            حفظ التغييرات
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
