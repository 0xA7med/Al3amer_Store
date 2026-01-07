import { useState } from 'react';

type SettingsTab = 'general' | 'payment' | 'shipping' | 'taxes' | 'integration' | 'storefront' | 'seo';

export function SettingsPage() {
    const [activeTab, setActiveTab] = useState<SettingsTab>('general');

    const tabs = [
        { id: 'general', label: 'عام' },
        { id: 'payment', label: 'طرق الدفع' },
        { id: 'shipping', label: 'الشحن والتوصيل' },
        { id: 'taxes', label: 'الضرائب' },
        { id: 'integration', label: 'الربط والتحليلات' },
        { id: 'storefront', label: 'واجهة المتجر' },
        { id: 'seo', label: 'SEO' },
    ];

    return (
        <div className="max-w-5xl mx-auto flex flex-col gap-8">
            {/* Tabs */}
            <div className="flex overflow-x-auto pb-2 gap-2 border-b border-white/10 no-scrollbar">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as SettingsTab)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${activeTab === tab.id
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'text-slate-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* General Settings */}
            {activeTab === 'general' && (
                <div className="glass-panel rounded-xl p-8 animate-fade-in-up">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">storefront</span>
                                هوية المتجر
                            </h3>
                            <p className="text-slate-400 text-sm mt-1">البيانات الأساسية التي تظهر للعملاء في الفواتير ورسائل البريد.</p>
                        </div>
                        <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-primary/20 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">save</span>
                            حفظ التغييرات
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-[#94a3b8] text-sm font-medium mb-2">اسم المتجر (بالعربية)</label>
                            <input
                                type="text"
                                defaultValue="مركز العامر لأنظمة الكاشير"
                                className="w-full bg-[#161b26] border border-white/10 text-white rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                            />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-[#94a3b8] text-sm font-medium mb-2">اسم المتجر (بالإنجليزية)</label>
                            <input
                                type="text"
                                defaultValue="Al3amer POS Systems"
                                className="w-full bg-[#161b26] border border-white/10 text-white rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all text-left"
                                dir="ltr"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-[#94a3b8] text-sm font-medium mb-2">رقم الهاتف للدعم</label>
                            <input
                                type="tel"
                                defaultValue="+20 101 234 5678"
                                className="w-full bg-[#161b26] border border-white/10 text-white rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all text-left"
                                dir="ltr"
                            />
                        </div>
                        <div>
                            <label className="block text-[#94a3b8] text-sm font-medium mb-2">البريد الإلكتروني الرسمي</label>
                            <input
                                type="email"
                                defaultValue="support@al3amer.com"
                                className="w-full bg-[#161b26] border border-white/10 text-white rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all text-left"
                                dir="ltr"
                            />
                        </div>
                    </div>

                    <div className="mb-6">
                        <label className="block text-[#94a3b8] text-sm font-medium mb-2">عنوان المقر الرئيسي</label>
                        <input
                            type="text"
                            defaultValue="القاهرة، مدينة نصر، شارع عباس العقاد"
                            className="w-full bg-[#161b26] border border-white/10 text-white rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                        <div className="p-4 border border-dashed border-white/10 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-center cursor-pointer">
                            <div className="mb-3 flex justify-center">
                                <div className="size-16 rounded-xl bg-gradient-to-br from-primary to-blue-900 flex items-center justify-center shadow-lg shadow-primary/20 overflow-hidden">
                                    <img src="https://i.ibb.co/KkCv1LF/Logo-Al3amer.png" alt="Logo" className="size-10 object-contain" />
                                </div>
                            </div>
                            <p className="text-white font-bold text-sm">شعار المتجر</p>
                            <p className="text-slate-400 text-xs mt-1">PNG, JPG بحد أقصى 2MB</p>
                            <button className="mt-3 text-xs text-primary font-bold hover:underline">تغيير الصورة</button>
                        </div>
                        <div className="p-4 border border-dashed border-white/10 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-center cursor-pointer">
                            <div className="mb-3 flex justify-center">
                                <div className="size-12 rounded bg-primary flex items-center justify-center">
                                    <span className="text-white font-bold text-xl">A</span>
                                </div>
                            </div>
                            <p className="text-white font-bold text-sm">أيقونة المتصفح (Favicon)</p>
                            <p className="text-slate-400 text-xs mt-1">ICO, PNG (32x32)</p>
                            <button className="mt-3 text-xs text-primary font-bold hover:underline">تغيير الصورة</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Payment Methods */}
            {activeTab === 'payment' && (
                <div className="glass-panel rounded-xl p-8 animate-fade-in-up">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-emerald-400">payments</span>
                                بوابات الدفع
                            </h3>
                            <p className="text-slate-400 text-sm mt-1">إدارة مفاتيح الربط مع Paymob, Fawry وغيرها.</p>
                        </div>
                        <button className="px-4 py-2 bg-[#161b26] border border-white/10 hover:bg-white/5 text-slate-300 hover:text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">save</span>
                            حفظ
                        </button>
                    </div>

                    <div className="grid gap-4">
                        {/* Paymob */}
                        <div className="border border-white/5 rounded-lg p-5 bg-white/[0.02]">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-12 bg-white rounded flex items-center justify-center overflow-hidden">
                                        <span className="text-blue-600 font-black text-xs">Paymob</span>
                                    </div>
                                    <span className="text-white font-bold">Paymob</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" defaultChecked className="sr-only peer" />
                                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>
                            <div className="grid gap-3">
                                <div>
                                    <label className="text-xs text-slate-400 mb-1 block">API Key</label>
                                    <input
                                        type="password"
                                        defaultValue="ZXlKaGJHY2lPaUpJVXpVN... (hidden)"
                                        readOnly
                                        className="w-full bg-[#161b26] border border-white/10 text-white rounded-lg px-4 py-2 text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">Integration ID (Card)</label>
                                        <input
                                            type="text"
                                            defaultValue="123456"
                                            className="w-full bg-[#161b26] border border-white/10 text-white rounded-lg px-4 py-2 text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">Integration ID (Wallet)</label>
                                        <input
                                            type="text"
                                            defaultValue="789012"
                                            className="w-full bg-[#161b26] border border-white/10 text-white rounded-lg px-4 py-2 text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* COD */}
                        <div className="border border-white/5 rounded-lg p-5 bg-white/[0.02]">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-12 bg-emerald-500/10 border border-emerald-500/20 rounded flex items-center justify-center overflow-hidden">
                                        <span className="material-symbols-outlined text-emerald-400 text-lg">attach_money</span>
                                    </div>
                                    <span className="text-white font-bold">الدفع عند الاستلام</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" defaultChecked className="sr-only peer" />
                                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                </label>
                            </div>
                            <div className="mt-4">
                                <label className="text-xs text-slate-400 mb-1 block">رسوم إضافية (اختياري)</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        defaultValue="10"
                                        className="w-full bg-[#161b26] border border-white/10 text-white rounded-lg pl-12 pr-4 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                                    />
                                    <span className="absolute left-3 top-2.5 text-slate-500 text-sm">ج.م</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Shipping & Taxes (Grouped for brevity, or separated as per activeTab) */}
            {activeTab === 'shipping' && (
                <div className="glass-panel rounded-xl p-6 animate-fade-in-up">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-blue-400">local_shipping</span>
                        إعدادات الشحن
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-[#94a3b8] text-sm font-medium mb-2">تكلفة الشحن الثابتة</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    defaultValue="50"
                                    className="w-full bg-[#161b26] border border-white/10 text-white rounded-lg pl-12 pr-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                                />
                                <span className="absolute left-3 top-2.5 text-slate-500 text-sm">ج.م</span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-[#94a3b8] text-sm font-medium mb-2">الشحن المجاني للطلبات فوق</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    defaultValue="2000"
                                    className="w-full bg-[#161b26] border border-white/10 text-white rounded-lg pl-12 pr-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                                />
                                <span className="absolute left-3 top-2.5 text-slate-500 text-sm">ج.م</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                            <input type="checkbox" id="city_rates" className="rounded border-white/20 bg-[#161b26] text-primary focus:ring-primary" />
                            <label htmlFor="city_rates" className="text-sm text-slate-300">تفعيل أسعار مخصصة للمحافظات</label>
                        </div>
                        <button className="w-full mt-2 py-2 border border-white/10 rounded-lg text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors">إدارة مناطق الشحن</button>
                        <button className="w-full py-2 bg-primary hover:bg-primary-dark text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-primary/20 mt-4">
                            حفظ التغييرات
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'taxes' && (
                <div className="glass-panel rounded-xl p-6 animate-fade-in-up">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-orange-400">percent</span>
                        الضرائب
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-300">تفعيل ضريبة القيمة المضافة</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" defaultChecked className="sr-only peer" />
                                <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                            </label>
                        </div>
                        <div>
                            <label className="block text-[#94a3b8] text-sm font-medium mb-2">نسبة الضريبة (%)</label>
                            <input
                                type="number"
                                defaultValue="14"
                                className="w-full bg-[#161b26] border border-white/10 text-white rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-[#94a3b8] text-sm font-medium mb-2">رقم التسجيل الضريبي</label>
                            <input
                                type="text"
                                defaultValue="123-456-789"
                                className="w-full bg-[#161b26] border border-white/10 text-white rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                            <input type="checkbox" id="tax_inc" defaultChecked className="rounded border-white/20 bg-[#161b26] text-primary focus:ring-primary" />
                            <label htmlFor="tax_inc" className="text-sm text-slate-300">الأسعار المعروضة شاملة الضريبة</label>
                        </div>
                        <button className="w-full py-2 bg-primary hover:bg-primary-dark text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-primary/20 mt-4">
                            حفظ التغييرات
                        </button>
                    </div>
                </div>
            )}

            {/* Integration & Analytics */}
            {activeTab === 'integration' && (
                <div className="glass-panel rounded-xl p-8 animate-fade-in-up">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-purple-400">hub</span>
                                الربط والتحليلات
                            </h3>
                            <p className="text-slate-400 text-sm mt-1">إعدادات بيكسل فيسبوك وجوجل أناليتكس لتتبع الزوار.</p>
                        </div>
                        <button className="px-4 py-2 bg-[#161b26] border border-white/10 hover:bg-white/5 text-slate-300 hover:text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">save</span>
                            حفظ
                        </button>
                    </div>
                    <div className="space-y-6">
                        {/* Facebook Pixel */}
                        <div className="p-5 rounded-lg border border-white/5 bg-white/5 flex flex-col md:flex-row gap-6">
                            <div className="flex items-start gap-4 flex-1">
                                <div className="size-10 rounded-full bg-[#1877F2]/20 flex items-center justify-center text-[#1877F2]">
                                    <span className="material-symbols-outlined">dataset</span>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-white font-bold">Facebook Pixel</h4>
                                    <p className="text-slate-400 text-xs mt-1 mb-3">تتبع التحويلات والإعلانات على فيسبوك وإنستجرام.</p>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="text"
                                            placeholder="Pixel ID (e.g., 1234567890)"
                                            className="w-full bg-[#161b26] border border-white/10 text-white rounded-lg px-4 py-2 text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all text-left"
                                            dir="ltr"
                                        />
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" defaultChecked className="sr-only peer" />
                                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Google Analytics */}
                        <div className="p-5 rounded-lg border border-white/5 bg-white/5 flex flex-col md:flex-row gap-6">
                            <div className="flex items-start gap-4 flex-1">
                                <div className="size-10 rounded-full bg-[#EA4335]/20 flex items-center justify-center text-[#EA4335]">
                                    <span className="material-symbols-outlined">analytics</span>
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-white font-bold">Google Analytics 4</h4>
                                    <p className="text-slate-400 text-xs mt-1 mb-3">احصائيات مفصلة عن زوار متجرك وسلوكهم.</p>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="text"
                                            placeholder="Measurement ID (e.g., G-XXXXXXXXXX)"
                                            className="w-full bg-[#161b26] border border-white/10 text-white rounded-lg px-4 py-2 text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all text-left"
                                            dir="ltr"
                                        />
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" />
                                            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Storefront Banners */}
            {activeTab === 'storefront' && (
                <div className="glass-panel rounded-xl p-8 animate-fade-in-up">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-pink-400">imagesmode</span>
                                بنرات الصفحة الرئيسية
                            </h3>
                            <p className="text-slate-400 text-sm mt-1">التحكم في الصور الإعلانية في واجهة المتجر.</p>
                        </div>
                        <button className="px-4 py-2 bg-[#161b26] border border-white/10 hover:bg-white/5 text-slate-300 hover:text-white text-sm font-bold rounded-lg transition-colors flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">add</span>
                            إضافة بنر
                        </button>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 p-4 border border-white/5 rounded-lg bg-white/[0.02] group hover:border-white/10 transition-colors">
                            <div className="w-32 h-16 bg-slate-800 rounded-md bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBXamKZJmr7N_fQ7L7hhHZKlafOiAguLG6aSD6ptFxWc-aWJNK319jwlnSxTLNvoh8lXJbWdS_3YXiR1BK90NNc23L8qJVr0MyF9zQAGcrdf6u9QUpuGRx_eHT-O5wdK_oyQKl5PLgLV3cdi7k8cR-xKF2uh30WjtJwglbB0LiHr6pEl3Zu4EYPR6AqCtHiO4EDZDiz3f86s_uHRWhFBoEZ0RYknBjGHlR9utd3bMM-mMvYqxMjyfie2bCfuU1feGz8L2tT-8-TuTA')" }}></div>
                            <div className="flex-1">
                                <h4 className="text-white font-bold text-sm">عرض الصيف - خصم 20%</h4>
                                <p className="text-xs text-slate-500">الرابط: /collection/summer-sale</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">نشط</span>
                                <button className="p-1.5 text-slate-400 hover:text-white transition-colors"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                                <button className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-4 border border-white/5 rounded-lg bg-white/[0.02] group hover:border-white/10 transition-colors">
                            <div className="w-32 h-16 bg-slate-800 rounded-md bg-cover bg-center" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAwuHBPMqSUzoZAr563HvDIfAnGlMrsLYDv9zoeGYkrzMhoc5Q3uU9KeNd-YA-VJfC2DRDEkAgo-s-1Fxe4ruTcOM4hcfn8CYPMqq1ebQGGdM3o6tgFvGFGwiIdxPpuzeWZLcO4aBBVhz0ofv2Q4NzSwqYCUtWtCXl9Iqhw2bN4FEGmNz107Y0fGOY_jGEDD7KM_jjQmrMmn3j-rz26IMy2wIlhQuc4Zy1vh4_tJT36izZ8wMJuZlWr2yg8dxjBvFt5GqK7BRfIC4w')" }}></div>
                            <div className="flex-1">
                                <h4 className="text-white font-bold text-sm">وصل حديثاً: طابعات X-Printer</h4>
                                <p className="text-xs text-slate-500">الرابط: /products/printers</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20">نشط</span>
                                <button className="p-1.5 text-slate-400 hover:text-white transition-colors"><span className="material-symbols-outlined text-[18px]">edit</span></button>
                                <button className="p-1.5 text-slate-400 hover:text-red-400 transition-colors"><span className="material-symbols-outlined text-[18px]">delete</span></button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SEO */}
            {activeTab === 'seo' && (
                <div className="glass-panel rounded-xl p-8 mb-8 animate-fade-in-up">
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-cyan-400">search</span>
                                تحسين محركات البحث (SEO)
                            </h3>
                            <p className="text-slate-400 text-sm mt-1">إعدادات Meta Title و Description الافتراضية للمتجر.</p>
                        </div>
                        <button className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-sm font-bold rounded-lg transition-colors shadow-lg shadow-primary/20 flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px]">save</span>
                            حفظ التغييرات
                        </button>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-[#94a3b8] text-sm font-medium mb-2">عنوان الصفحة الرئيسية (Meta Title)</label>
                            <input
                                type="text"
                                defaultValue="تيكر | أفضل معدات الكاشير ونقاط البيع في مصر"
                                className="w-full bg-[#161b26] border border-white/10 text-white rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                            />
                            <p className="text-[11px] text-slate-500 mt-1 text-left" dir="ltr">60 / 60 characters</p>
                        </div>
                        <div>
                            <label className="block text-[#94a3b8] text-sm font-medium mb-2">وصف المتجر (Meta Description)</label>
                            <textarea
                                defaultValue="متجر تيكر يوفر أحدث أجهزة الباركود، طابعات الفواتير، موازين إلكترونية، وأنظمة الكاشير الكاملة بأسعار منافسة في السوق المصري مع ضمان وضمان استبدال."
                                className="w-full bg-[#161b26] border border-white/10 text-white rounded-lg px-4 py-2.5 min-h-[100px] resize-none focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                            />
                            <p className="text-[11px] text-slate-500 mt-1 text-left" dir="ltr">155 / 160 characters</p>
                        </div>
                        <div>
                            <label className="block text-[#94a3b8] text-sm font-medium mb-2">الكلمات المفتاحية (Keywords)</label>
                            <input
                                type="text"
                                defaultValue="كاشير, باركود, طابعة فواتير, ميزان الكتروني, نقاط بيع, POS Egypt"
                                className="w-full bg-[#161b26] border border-white/10 text-white rounded-lg px-4 py-2.5 focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none transition-all"
                            />
                            <p className="text-[11px] text-slate-500 mt-1">افصل بين الكلمات بفاصلة (,)</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SettingsPage;
