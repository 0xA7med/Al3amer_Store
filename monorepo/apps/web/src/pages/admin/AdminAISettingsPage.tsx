import React, { useState } from 'react';

export default function AdminAISettingsPage() {
    const [apiKey, setApiKey] = useState('sk-xxxxxxxxxxxxxxxxxxxxxxxx');
    const [showKey, setShowKey] = useState(false);
    const [isEnabled, setIsEnabled] = useState(true);
    const [descriptionLength, setDescriptionLength] = useState('medium');
    const [language, setLanguage] = useState('ar');
    const [tone, setTone] = useState('Marketing');

    // Fields state
    const [fields, setFields] = useState({
        name: true,
        description: true,
        seo: true,
        specs: false,
        price: false
    });

    const toggleField = (field: keyof typeof fields) => {
        setFields(prev => ({ ...prev, [field]: !prev[field] }));
    };

    return (
        <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-10 z-10 scroll-smooth">
            <div className="max-w-4xl mx-auto flex flex-col gap-6">
                {/* Page Title */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 pb-4 border-b border-white/5">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-white text-3xl md:text-4xl font-bold leading-tight">إعدادات التعبئة التلقائية</h1>
                        <p className="text-[#9da6b9] text-base font-normal max-w-2xl">
                            قم بإدارة مفاتيح الربط وتفضيلات توليد المحتوى بالذكاء الاصطناعي لتسريع عملية إدخال المنتجات.
                        </p>
                    </div>
                    <button className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg border border-white/10 transition-all text-sm">
                        <span className="material-symbols-outlined text-lg">history</span>
                        <span>سجل التغييرات</span>
                    </button>
                </div>

                {/* Enable Switch Panel (Glassmorphism) */}
                <div className="glass-panel backdrop-blur-md rounded-xl border border-white/10 p-6 shadow-xl">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-primary/20 p-3 rounded-full text-primary">
                                <span className="material-symbols-outlined text-2xl">auto_fix_high</span>
                            </div>
                            <div className="flex flex-col">
                                <p className="text-white text-lg font-bold">تفعيل الخدمة</p>
                                <p className="text-[#9da6b9] text-sm">السماح للنظام بملء بيانات المنتجات تلقائياً عند إضافة منتج جديد</p>
                            </div>
                        </div>
                        <label className={`relative flex h-[32px] w-[56px] cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${isEnabled ? 'bg-primary' : 'bg-[#282e39]'}`}>
                            <input
                                type="checkbox"
                                className="peer sr-only"
                                checked={isEnabled}
                                onChange={() => setIsEnabled(!isEnabled)}
                            />
                            <span className={`absolute right-0.5 size-6 rounded-full bg-white shadow-md transition-all ${isEnabled ? '-translate-x-6' : ''}`}></span>
                        </label>
                    </div>
                </div>

                {/* API Configuration Section */}
                <section className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 px-2">
                        <span className="material-symbols-outlined text-primary">api</span>
                        <h3 className="text-white text-xl font-bold">إعدادات الربط (API Configuration)</h3>
                    </div>
                    <div className="glass-panel backdrop-blur-md rounded-xl border border-white/10 p-6 shadow-lg">
                        <div className="flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-white text-sm font-medium">مفتاح Google API Key</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-[#9da6b9]">
                                        <span className="material-symbols-outlined">key</span>
                                    </div>
                                    <input
                                        type={showKey ? "text" : "password"}
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 pr-10 pl-12 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder-[#555]"
                                        placeholder="أدخل مفتاح API الخاص بك هنا"
                                    />
                                    <button
                                        className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#9da6b9] hover:text-white transition-colors"
                                        title="إظهار المفتاح"
                                        onClick={() => setShowKey(!showKey)}
                                    >
                                        <span className="material-symbols-outlined text-xl">{showKey ? 'visibility_off' : 'visibility'}</span>
                                    </button>
                                </div>
                                <p className="text-[#9da6b9] text-xs">يستخدم هذا المفتاح للوصول إلى خدمات Gemini AI لتوليد النصوص.</p>
                            </div>
                            <div className="flex justify-end">
                                <button className="text-primary text-sm font-bold hover:text-blue-400 flex items-center gap-2 py-2 px-4 rounded-lg hover:bg-primary/10 transition-colors">
                                    <span className="material-symbols-outlined text-lg">wifi_protected_setup</span>
                                    اختبار الاتصال
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Content Preferences Section */}
                <section className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 px-2">
                        <span className="material-symbols-outlined text-primary">tune</span>
                        <h3 className="text-white text-xl font-bold">تفضيلات المحتوى</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 glass-panel backdrop-blur-md rounded-xl border border-white/10 p-6 shadow-lg">
                        {/* Tone of Voice */}
                        <div className="flex flex-col gap-2">
                            <label className="text-white text-sm font-medium mb-1">نبرة المحتوى</label>
                            <div className="relative">
                                <select
                                    value={tone}
                                    onChange={(e) => setTone(e.target.value)}
                                    className="w-full appearance-none bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                                >
                                    <option value="Professional">رسمي (Professional)</option>
                                    <option value="Marketing">تسويقي (Marketing)</option>
                                    <option value="Technical">تقني (Technical)</option>
                                    <option value="Friendly">ودود (Friendly)</option>
                                </select>
                                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-[#9da6b9]">
                                    <span className="material-symbols-outlined">expand_more</span>
                                </div>
                            </div>
                            <p className="text-[#9da6b9] text-xs mt-1">يحدد الأسلوب الذي سيستخدمه الذكاء الاصطناعي في كتابة وصف المنتج.</p>
                        </div>

                        {/* Description Length */}
                        <div className="flex flex-col gap-2">
                            <label className="text-white text-sm font-medium mb-1">طول الوصف المفضل</label>
                            <div className="flex items-center justify-between bg-[#111318]/50 border border-[#3b4354] rounded-lg p-1">
                                <button
                                    onClick={() => setDescriptionLength('short')}
                                    className={`flex-1 py-2 text-sm rounded-md transition-all ${descriptionLength === 'short' ? 'text-white bg-primary shadow-lg font-medium' : 'text-[#9da6b9] hover:text-white hover:bg-white/5'}`}
                                >
                                    قصير
                                </button>
                                <button
                                    onClick={() => setDescriptionLength('medium')}
                                    className={`flex-1 py-2 text-sm rounded-md transition-all ${descriptionLength === 'medium' ? 'text-white bg-primary shadow-lg font-medium' : 'text-[#9da6b9] hover:text-white hover:bg-white/5'}`}
                                >
                                    متوسط
                                </button>
                                <button
                                    onClick={() => setDescriptionLength('long')}
                                    className={`flex-1 py-2 text-sm rounded-md transition-all ${descriptionLength === 'long' ? 'text-white bg-primary shadow-lg font-medium' : 'text-[#9da6b9] hover:text-white hover:bg-white/5'}`}
                                >
                                    طويل
                                </button>
                            </div>
                            <p className="text-[#9da6b9] text-xs mt-1">متوسط (حوالي 100-150 كلمة).</p>
                        </div>

                        {/* Language */}
                        <div className="flex flex-col gap-2 md:col-span-2">
                            <label className="text-white text-sm font-medium mb-1">لغة الإخراج الأساسية</label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`relative flex items-center justify-center size-5 rounded-full border ${language === 'ar' ? 'border-primary' : 'border-[#3b4354]'} group-hover:border-primary`}>
                                        <input
                                            type="radio"
                                            name="lang"
                                            className="peer sr-only appearance-none"
                                            checked={language === 'ar'}
                                            onChange={() => setLanguage('ar')}
                                        />
                                        <div className={`size-2.5 rounded-full bg-primary transition-opacity ${language === 'ar' ? 'opacity-100' : 'opacity-0'}`}></div>
                                    </div>
                                    <span className="text-white text-sm">العربية (الافتراضي)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <div className={`relative flex items-center justify-center size-5 rounded-full border ${language === 'en' ? 'border-primary' : 'border-[#3b4354]'} group-hover:border-primary`}>
                                        <input
                                            type="radio"
                                            name="lang"
                                            className="peer sr-only appearance-none"
                                            checked={language === 'en'}
                                            onChange={() => setLanguage('en')}
                                        />
                                        <div className={`size-2.5 rounded-full bg-primary transition-opacity ${language === 'en' ? 'opacity-100' : 'opacity-0'}`}></div>
                                    </div>
                                    <span className="text-white text-sm">English</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Fields Selection */}
                <section className="flex flex-col gap-4">
                    <div className="flex items-center gap-2 px-2">
                        <span className="material-symbols-outlined text-primary">checklist</span>
                        <h3 className="text-white text-xl font-bold">مجالات التعبئة التلقائية</h3>
                    </div>
                    <div className="glass-panel backdrop-blur-md rounded-xl border border-white/10 p-6 shadow-lg">
                        <p className="text-[#9da6b9] text-sm mb-4">اختر الحقول التي يُسمح للذكاء الاصطناعي بتعديلها أو تعبئتها.</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[
                                { id: 'name', label: 'اسم المنتج' },
                                { id: 'description', label: 'الوصف التفصيلي' },
                                { id: 'seo', label: 'كلمات الـ SEO' },
                                { id: 'specs', label: 'المواصفات الفنية' },
                                { id: 'price', label: 'اقتراح سعر البيع' }
                            ].map((field) => (
                                <label key={field.id} className="flex items-center gap-3 p-3 rounded-lg border border-[#3b4354] bg-[#111318]/30 hover:bg-[#111318]/60 hover:border-primary/50 cursor-pointer transition-all group">
                                    <div className={`relative flex items-center justify-center size-5 rounded border bg-[#282e39] transition-colors ${fields[field.id as keyof typeof fields] ? 'border-primary' : 'border-[#555] group-hover:border-primary'}`}>
                                        <input
                                            type="checkbox"
                                            className="peer appearance-none absolute inset-0 w-full h-full cursor-pointer z-10"
                                            checked={fields[field.id as keyof typeof fields]}
                                            onChange={() => toggleField(field.id as keyof typeof fields)}
                                        />
                                        {fields[field.id as keyof typeof fields] && (
                                            <span className="material-symbols-outlined text-white text-[16px] pointer-events-none">check</span>
                                        )}
                                    </div>
                                    <span className="text-white text-sm font-medium">{field.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Action Footer */}
                <div className="sticky bottom-4 z-50 mt-4">
                    <div className="bg-[#1e232d]/90 backdrop-blur-xl border border-white/10 rounded-xl p-4 flex items-center justify-between shadow-2xl">
                        <button className="text-[#9da6b9] hover:text-white font-medium text-sm px-4 py-2 rounded-lg transition-colors">
                            إلغاء التغييرات
                        </button>
                        <button className="bg-primary hover:bg-blue-600 text-white text-base font-bold py-2.5 px-8 rounded-lg shadow-lg shadow-primary/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2">
                            <span className="material-symbols-outlined text-[20px]">save</span>
                            حفظ الإعدادات
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
