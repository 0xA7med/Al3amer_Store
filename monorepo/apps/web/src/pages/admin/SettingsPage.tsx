import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';
import toast from 'react-hot-toast';

import type { Tab, SettingsFormData, TestingState } from '../../components/admin/settings/types';
import { DEFAULT_FORM_DATA } from '../../components/admin/settings/constants';
import { GeneralTab, ContactTab, SocialTab, ShippingTab, TaxTab, PaymentTab, NotificationsTab } from '../../components/admin/settings/SettingsTabs';

export default function SettingsPage() {
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<Tab>('general');
    const [formData, setFormData] = useState<SettingsFormData>({
        storeNameAr: '', storeNameEn: '', logoUrl: '', faviconUrl: '', metaTitle: '', metaDescription: '', metaKeywords: '',
        supportPhone: '', supportEmail: '', address: '',
        facebook: '', instagram: '', whatsapp: '', twitterX: '',
        ...DEFAULT_FORM_DATA,
        customCityRatesEnabled: false,
        codExtraFee: '0',
        paymobEnabled: false, paymobApiKey: '', paymobIntegrationCard: '', paymobIntegrationWallet: '', paymobIframeId: '',
        telegramEnabled: false, telegramBotToken: '', telegramChatId: '',
        whatsappEnabled: false, whatsappApiKey: '', whatsappRecipientPhone: '',
        emailEnabled: false, smtpHost: '', smtpUser: '', smtpPass: '', emailFrom: '', emailReceiver: '',
        taxRegistrationNumber: '',
    });

    const { data: settings, isLoading } = useQuery({
        queryKey: ['admin-settings'],
        queryFn: async () => { const { data } = await api.get('/settings'); return data; },
    });

    useEffect(() => {
        if (settings) {
            setFormData(prev => ({
                ...prev,
                ...settings,
                vatEnabled: settings.vatEnabled ?? true,
                pricesIncludeTax: settings.pricesIncludeTax ?? true,
                codEnabled: settings.codEnabled ?? true,
                paymobEnabled: settings.paymobEnabled ?? false,
                customCityRatesEnabled: settings.customCityRatesEnabled ?? false,
            }));
        }
    }, [settings]);

    const saveMutation = useMutation({
        mutationFn: async (data: SettingsFormData) => { const { data: response } = await api.put('/settings', data); return response; },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
            queryClient.invalidateQueries({ queryKey: ['settings'] });
            toast.success('تم حفظ الإعدادات بنجاح');
        },
        onError: () => { toast.error('حدث خطأ أثناء حفظ الإعدادات'); },
    });

    const [testing, setTesting] = useState<TestingState>({ whatsapp: false, telegram: false, email: false });

    const handleTestNotification = async (type: 'whatsapp' | 'telegram' | 'email') => {
        setTesting(prev => ({ ...prev, [type]: true }));
        try {
            const configMap: Record<string, any> = {
                whatsapp: { apiKey: formData.whatsappApiKey, phone: formData.whatsappRecipientPhone },
                telegram: { token: formData.telegramBotToken, chatId: formData.telegramChatId },
                email: { smtpHost: formData.smtpHost, smtpPort: formData.smtpPort, smtpUser: formData.smtpUser, pass: formData.smtpPass, emailReceiver: formData.emailReceiver, emailFrom: formData.emailFrom },
            };
            const { data } = await api.post('/settings/test-notification', { type, config: configMap[type] });
            if (data.success) toast.success(data.message || 'تم إرسال رسالة الاختبار بنجاح');
            else toast.error(data.error || 'فشل إرسال رسالة الاختبار');
        } catch (error: any) {
            toast.error(error.response?.data?.error || error.response?.data?.message || 'فشل إرسال رسالة الاختبار. تأكد من صحة البيانات.');
        } finally {
            setTesting(prev => ({ ...prev, [type]: false }));
        }
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
        { id: 'notifications', label: 'الإشعارات', icon: 'notifications_active' },
    ];

    const renderTab = () => {
        const props = { formData, setFormData: (d: SettingsFormData) => setFormData(d) };
        switch (activeTab) {
            case 'general': return <GeneralTab {...props} />;
            case 'contact': return <ContactTab {...props} />;
            case 'social': return <SocialTab {...props} />;
            case 'shipping': return <ShippingTab {...props} />;
            case 'tax': return <TaxTab {...props} />;
            case 'payment': return <PaymentTab {...props} />;
            case 'notifications': return <NotificationsTab {...props} testing={testing} onTest={handleTestNotification} />;
        }
    };

    return (
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-10 z-10 scroll-smooth">
            <div className="max-w-5xl mx-auto flex flex-col gap-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-white/5">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-white text-3xl md:text-4xl font-bold leading-tight">إعدادات المتجر</h1>
                        <p className="text-[#9da6b9] text-base font-normal max-w-2xl">التحكم الكامل في إعدادات متجرك من معلومات الاتصال إلى طرق الدفع والشحن</p>
                    </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/10 scrollbar-hide">
                    {tabs.map((tab) => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-primary text-white shadow-lg' : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'}`}>
                            <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                <div className="glass-panel backdrop-blur-md rounded-xl border border-white/10 p-6 shadow-lg">
                    {renderTab()}
                </div>

                <div className="sticky bottom-4 z-50">
                    <div className="bg-[#1e232d]/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 flex items-center justify-end gap-4 shadow-2xl">
                        <button onClick={() => saveMutation.mutate(formData)} disabled={saveMutation.isPending}
                            className="bg-primary hover:bg-blue-600 text-white text-base font-bold py-2.5 px-8 rounded-lg shadow-lg shadow-primary/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                            {saveMutation.isPending ? <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <span className="material-symbols-outlined text-[20px]">save</span>}
                            حفظ التغييرات
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
