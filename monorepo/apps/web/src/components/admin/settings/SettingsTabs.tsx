import type { SettingsFormData, TestingState } from './types';
import { GovernorateSelect } from '../../shared/GovernorateSelect';

// ================================================================
// General Tab
// ================================================================
export function GeneralTab({ formData, setFormData }: { formData: SettingsFormData; setFormData: (d: SettingsFormData) => void }) {
    return (
        <div className="space-y-6">
            <h3 className="text-white text-xl font-bold mb-4">المعلومات العامة</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="اسم المتجر (عربي)">
                    <input type="text" value={formData.storeNameAr || ''} onChange={e => setFormData({ ...formData, storeNameAr: e.target.value })}
                        className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="مركز العامر لأنظمة الكاشير" />
                </Field>
                <Field label="Store Name (English)">
                    <input type="text" value={formData.storeNameEn || ''} onChange={e => setFormData({ ...formData, storeNameEn: e.target.value })}
                        className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="Al3amer POS Systems" />
                </Field>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="رابط الشعار (Logo URL)">
                    <input type="url" value={formData.logoUrl || ''} onChange={e => setFormData({ ...formData, logoUrl: e.target.value })}
                        className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="https://" />
                    {formData.logoUrl && <div className="mt-2 p-3 bg-white/5 rounded-lg border border-white/10"><img src={formData.logoUrl} alt="Logo Preview" className="h-16 object-contain" /></div>}
                </Field>
                <Field label="رابط الأيقونة (Favicon URL)">
                    <input type="url" value={formData.faviconUrl || ''} onChange={e => setFormData({ ...formData, faviconUrl: e.target.value })}
                        className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="https://" />
                    {formData.faviconUrl && <div className="mt-2 p-3 bg-white/5 rounded-lg border border-white/10"><img src={formData.faviconUrl} alt="Favicon Preview" className="h-8 w-8 object-contain" /></div>}
                </Field>
            </div>
            <Field label="وصف المتجر (Meta Description)">
                <textarea rows={3} value={formData.metaDescription || ''} onChange={e => setFormData({ ...formData, metaDescription: e.target.value })}
                    className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none" placeholder="وجهتك الأولى في مصر لأحدث أنظمة الكاشير والباركود..." />
            </Field>
        </div>
    );
}

// ================================================================
// Contact Tab
// ================================================================
export function ContactTab({ formData, setFormData }: { formData: SettingsFormData; setFormData: (d: SettingsFormData) => void }) {
    return (
        <div className="space-y-6">
            <h3 className="text-white text-xl font-bold mb-4">معلومات التواصل</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="رقم الهاتف">
                    <input type="tel" value={formData.supportPhone || ''} onChange={e => setFormData({ ...formData, supportPhone: e.target.value })}
                        className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="+20 101 234 5678" />
                </Field>
                <Field label="البريد الإلكتروني">
                    <input type="email" value={formData.supportEmail || ''} onChange={e => setFormData({ ...formData, supportEmail: e.target.value })}
                        className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="support@al3amer.com" />
                </Field>
            </div>
            <Field label="العنوان">
                <textarea rows={2} value={formData.address || ''} onChange={e => setFormData({ ...formData, address: e.target.value })}
                    className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none" placeholder="القاهرة، مدينة نصر، شارع عباس العقاد" />
            </Field>
        </div>
    );
}

// ================================================================
// Social Tab
// ================================================================
export function SocialTab({ formData, setFormData }: { formData: SettingsFormData; setFormData: (d: SettingsFormData) => void }) {
    return (
        <div className="space-y-6">
            <h3 className="text-white text-xl font-bold mb-4">روابط مواقع التواصل الاجتماعي</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label={<><span className="material-symbols-outlined text-primary">facebook</span> Facebook</>}>
                    <input type="url" value={formData.facebook || ''} onChange={e => setFormData({ ...formData, facebook: e.target.value })}
                        className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="https://facebook.com/yourbusiness" />
                </Field>
                <Field label={<><span className="material-symbols-outlined text-primary">photo_camera</span> Instagram</>}>
                    <input type="url" value={formData.instagram || ''} onChange={e => setFormData({ ...formData, instagram: e.target.value })}
                        className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="https://instagram.com/yourbusiness" />
                </Field>
                <Field label={<><span className="material-symbols-outlined text-primary">chat</span> WhatsApp</>}>
                    <input type="url" value={formData.whatsapp || ''} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                        className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="https://wa.me/201012345678" />
                </Field>
                <Field label={<><span className="material-symbols-outlined text-primary">alternate_email</span> Twitter/X</>}>
                    <input type="url" value={formData.twitterX || ''} onChange={e => setFormData({ ...formData, twitterX: e.target.value })}
                        className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="https://twitter.com/yourbusiness" />
                </Field>
            </div>
        </div>
    );
}

// ================================================================
// Shipping Tab
// ================================================================
export function ShippingTab({ formData, setFormData }: { formData: SettingsFormData; setFormData: (d: SettingsFormData) => void }) {
    return (
        <div className="space-y-6">
            <h3 className="text-white text-xl font-bold mb-4">إعدادات الشحن</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="تكلفة الشحن الثابتة (ج.م)">
                    <input type="number" min="0" step="0.01" value={formData.shippingFlatRate || ''} onChange={e => setFormData({ ...formData, shippingFlatRate: e.target.value })}
                        className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="50" />
                </Field>
                <Field label="الحد الأدنى للشحن المجاني (ج.م)">
                    <input type="number" min="0" step="0.01" value={formData.freeShippingThreshold || ''} onChange={e => setFormData({ ...formData, freeShippingThreshold: e.target.value })}
                        className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="2000" />
                </Field>
            </div>

            <div className="border-t border-white/10 pt-6 space-y-4">
                <div className="flex justify-between items-center">
                    <h4 className="text-white font-bold">مصاريف الشحن حسب المحافظة/المدينة</h4>
                    <button type="button" onClick={() => setFormData({ ...formData, cityShippingRates: [...(formData.cityShippingRates || []), { city: '', rate: 0 }] })}
                        className="bg-primary/20 hover:bg-primary/30 text-primary text-sm font-bold py-2 px-4 rounded-lg transition-all flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm">add</span> إضافة محافظة
                    </button>
                </div>
                <div className="space-y-3">
                    {(formData.cityShippingRates || []).map((rate, index) => (
                        <div key={index} className="flex gap-4 items-end bg-black/20 p-4 rounded-xl border border-white/5">
                            <div className="flex-1 space-y-2">
                                <label className="text-gray-400 text-xs">المحافظة / المدينة</label>
                                <GovernorateSelect
                                    value={rate.city}
                                    onChange={(v) => { const r = [...formData.cityShippingRates]; r[index].city = v; setFormData({ ...formData, cityShippingRates: r }); }}
                                    disabledOptions={formData.cityShippingRates?.filter((_, i) => i !== index).map(r => r.city) || []}
                                />
                            </div>
                            <div className="w-40 space-y-2">
                                <label className="text-gray-400 text-xs">التكلفة (ج.م)</label>
                                <input type="number" value={rate.rate} onChange={(e) => { const r = [...formData.cityShippingRates]; r[index].rate = parseFloat(e.target.value) || 0; setFormData({ ...formData, cityShippingRates: r }); }}
                                    className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary transition-all text-sm" />
                            </div>
                            <button type="button" onClick={() => setFormData({ ...formData, cityShippingRates: formData.cityShippingRates.filter((_, i) => i !== index) })}
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 p-3 rounded-lg transition-all">
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

            {/* COD Settings */}
            <div className="border-t border-white/10 pt-6 space-y-4">
                <h4 className="text-white font-bold flex items-center gap-2"><span className="material-symbols-outlined text-primary">local_shipping</span> إعدادات الدفع عند الاستلام (COD)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Field label={<span title="المبلغ الذي يتم تحصيله من العميل عبر فودافون كاش قبل الشحن كجدية حجز">المقدم المطلوب (ج.م) <span className="material-symbols-outlined text-[10px] text-gray-500 cursor-help">info</span></span>}>
                        <input type="number" value={formData.codAdvancePayment || ''} onChange={e => setFormData({ ...formData, codAdvancePayment: e.target.value })}
                            className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-2.5 px-3 focus:outline-none focus:border-primary transition-all text-sm" />
                    </Field>
                    <Field label={<span title="هذا هو المبلغ الأساسي الذي تطبق عليه الرسوم (مثلاً: أول 1000 ج.م)">المبلغ الأساسي للرسوم (ج.م)</span>}>
                        <input type="number" value={formData.codReturnShippingBaseAmount || ''} onChange={e => setFormData({ ...formData, codReturnShippingBaseAmount: e.target.value })}
                            className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-2.5 px-3 focus:outline-none focus:border-primary transition-all text-sm" />
                    </Field>
                    <Field label={<span title="الرسوم التي تأخذها شركة الشحن على المبلغ الأساسي (مثلاً: 30 ج.م)">الرسوم الأساسية للتحصيل (ج.م)</span>}>
                        <input type="number" value={formData.codReturnShippingBaseFee || ''} onChange={e => setFormData({ ...formData, codReturnShippingBaseFee: e.target.value })}
                            className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-2.5 px-3 focus:outline-none focus:border-primary transition-all text-sm" />
                    </Field>
                    <Field label={<span title="شريحة المبلغ الإضافية التي تطبق عليها الرسوم الإضافية (مثلاً: 1000 ج.م)">شريحة الزيادة الإضافية (ج.م)</span>}>
                        <input type="number" value={formData.codReturnShippingExtraAmount || ''} onChange={e => setFormData({ ...formData, codReturnShippingExtraAmount: e.target.value })}
                            className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-2.5 px-3 focus:outline-none focus:border-primary transition-all text-sm" />
                    </Field>
                    <Field label={<span title="الرسوم التي تطبق على كل شريحة زيادة (مثلاً: 5 ج.م على كل 1000 ج.م زيادة)">الرسوم الإضافية للتحصيل (ج.م)</span>}>
                        <input type="number" value={formData.codReturnShippingExtraFee || ''} onChange={e => setFormData({ ...formData, codReturnShippingExtraFee: e.target.value })}
                            className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-2.5 px-3 focus:outline-none focus:border-primary transition-all text-sm" />
                    </Field>
                </div>
            </div>
        </div>
    );
}

// ================================================================
// Tax Tab
// ================================================================
export function TaxTab({ formData, setFormData }: { formData: SettingsFormData; setFormData: (d: SettingsFormData) => void }) {
    return (
        <div className="space-y-6">
            <h3 className="text-white text-xl font-bold mb-4">إعدادات الضرائب</h3>
            <label className="flex items-center gap-3 p-4 rounded-lg border border-white/10 bg-white/5 cursor-pointer">
                <input type="checkbox" checked={formData.vatEnabled} onChange={e => setFormData({ ...formData, vatEnabled: e.target.checked })} className="w-5 h-5 accent-primary" />
                <div><span className="text-white font-medium">تفعيل ضريبة القيمة المضافة (VAT)</span><p className="text-sm text-gray-400">إضافة ضريبة القيمة المضافة على الطلبات</p></div>
            </label>
            {formData.vatEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field label="نسبة الضريبة (%)">
                        <input type="number" min="0" max="100" step="0.01" value={formData.taxPercentage || ''} onChange={e => setFormData({ ...formData, taxPercentage: e.target.value })}
                            className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="14" />
                    </Field>
                    <Field label="رقم التسجيل الضريبي">
                        <input type="text" value={formData.taxRegistrationNumber || ''} onChange={e => setFormData({ ...formData, taxRegistrationNumber: e.target.value })}
                            className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="اختياري" />
                    </Field>
                </div>
            )}
            <label className="flex items-center gap-3 p-4 rounded-lg border border-white/10 bg-white/5 cursor-pointer">
                <input type="checkbox" checked={formData.pricesIncludeTax} onChange={e => setFormData({ ...formData, pricesIncludeTax: e.target.checked })} className="w-5 h-5 accent-primary" />
                <div><span className="text-white font-medium">الأسعار تشمل الضريبة</span><p className="text-sm text-gray-400">الأسعار المعروضة تشمل ضريبة القيمة المضافة</p></div>
            </label>
        </div>
    );
}

// ================================================================
// Payment Tab
// ================================================================
export function PaymentTab({ formData, setFormData }: { formData: SettingsFormData; setFormData: (d: SettingsFormData) => void }) {
    return (
        <div className="space-y-6">
            <h3 className="text-white text-xl font-bold mb-4">طرق الدفع</h3>
            <label className="flex items-center gap-3 p-4 rounded-lg border border-white/10 bg-white/5 cursor-pointer">
                <input type="checkbox" checked={formData.codEnabled} onChange={e => setFormData({ ...formData, codEnabled: e.target.checked })} className="w-5 h-5 accent-primary" />
                <div><span className="text-white font-medium">الدفع عند الاستلام (COD)</span><p className="text-sm text-gray-400">السماح بالدفع نقداً عند استلام الطلب</p></div>
            </label>
            {formData.codEnabled && (
                <Field label="رسوم إضافية للدفع عند الاستلام (ج.م)">
                    <input type="number" min="0" step="0.01" value={formData.codExtraFee || ''} onChange={e => setFormData({ ...formData, codExtraFee: e.target.value })}
                        className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="0" />
                </Field>
            )}
            <div className="border-t border-white/10 pt-6">
                <label className="flex items-center gap-3 p-4 rounded-lg border border-white/10 bg-white/5 cursor-pointer">
                    <input type="checkbox" checked={formData.paymobEnabled} onChange={e => setFormData({ ...formData, paymobEnabled: e.target.checked })} className="w-5 h-5 accent-primary" />
                    <div><span className="text-white font-medium">Paymob (الدفع الإلكتروني)</span><p className="text-sm text-gray-400">تفعيل الدفع عبر بطاقات الائتمان والمحافظ الإلكترونية</p></div>
                </label>
                {formData.paymobEnabled && (
                    <div className="mt-4 space-y-4 bg-black/20 p-4 rounded-lg">
                        <Field label="Paymob API Key">
                            <input type="password" value={formData.paymobApiKey || ''} onChange={e => setFormData({ ...formData, paymobApiKey: e.target.value })}
                                className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="••••••••" />
                        </Field>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Field label="Integration ID (Card)">
                                <input type="text" value={formData.paymobIntegrationCard || ''} onChange={e => setFormData({ ...formData, paymobIntegrationCard: e.target.value })}
                                    className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                            </Field>
                            <Field label="Integration ID (Wallet)">
                                <input type="text" value={formData.paymobIntegrationWallet || ''} onChange={e => setFormData({ ...formData, paymobIntegrationWallet: e.target.value })}
                                    className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" />
                            </Field>
                        </div>
                        <Field label="Paymob Iframe ID">
                            <input type="text" value={formData.paymobIframeId || ''} onChange={e => setFormData({ ...formData, paymobIframeId: e.target.value })}
                                className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all" placeholder="e.g. 123456" />
                            <p className="text-[10px] text-gray-500 italic">هذا المعرف مطلوب لعرض صفحة الدفع (Iframe) بشكل صحيح.</p>
                        </Field>
                    </div>
                )}
            </div>
        </div>
    );
}

// ================================================================
// Notifications Tab
// ================================================================
export function NotificationsTab({ formData, setFormData, testing, onTest }: {
    formData: SettingsFormData;
    setFormData: (d: SettingsFormData) => void;
    testing: TestingState;
    onTest: (type: 'whatsapp' | 'telegram' | 'email') => void;
}) {
    return (
        <div className="space-y-8">
            <h2 className="text-white text-xl font-bold mb-4">نظام إشعارات الطلبات الجديدة (مجاني)</h2>

            {/* WhatsApp (CallMeBot) */}
            <NotificationChannel
                title="WhatsApp (via CallMeBot)"
                desc="إرسال إشعارات للواتساب مجاناً"
                color="green"
                enabled={formData.whatsappEnabled}
                onToggle={v => setFormData({ ...formData, whatsappEnabled: v })}
                fields={
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <Field label="رقم الهاتف (بصيغة دولية)">
                            <input type="text" value={formData.whatsappRecipientPhone || ''} onChange={e => setFormData({ ...formData, whatsappRecipientPhone: e.target.value })}
                                className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-green-500 transition-all" placeholder="+201012345678" />
                        </Field>
                        <Field label="ApiKey (من CallMeBot)">
                            <input type="password" value={formData.whatsappApiKey || ''} onChange={e => setFormData({ ...formData, whatsappApiKey: e.target.value })}
                                className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-green-500 transition-all" placeholder="••••••••" />
                        </Field>
                        <div className="md:col-span-2">
                            <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg flex gap-3 text-[11px] text-yellow-500/80">
                                <span className="material-symbols-outlined text-[16px]">info</span>
                                <p>للحصول على المفتاح: أرسل رسالة <b>"I allow callmebot to send me messages"</b> لرقم الخدمة على الواتساب. <a href="https://www.callmebot.com/blog/free-api-whatsapp-messages/" target="_blank" className="underline font-bold">التفاصيل هنا</a></p>
                            </div>
                        </div>
                        <div className="md:col-span-2 flex justify-end">
                            <button type="button" onClick={() => onTest('whatsapp')} disabled={testing.whatsapp}
                                className="bg-green-500/20 hover:bg-green-500/30 text-green-500 text-sm font-bold py-2.5 px-6 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50">
                                {testing.whatsapp ? <div className="size-4 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" /> : <span className="material-symbols-outlined text-[18px]">send</span>}
                                اختبار الواتساب
                            </button>
                        </div>
                    </div>
                }
            />

            {/* Telegram */}
            <NotificationChannel
                title="Telegram Bot"
                desc="إشعارات تليجرام فورية وأكثر استقراراً"
                color="blue"
                enabled={formData.telegramEnabled}
                onToggle={v => setFormData({ ...formData, telegramEnabled: v })}
                fields={
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <Field label="Bot Token">
                            <input type="password" value={formData.telegramBotToken || ''} onChange={e => setFormData({ ...formData, telegramBotToken: e.target.value })}
                                className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-blue-500 transition-all" placeholder="123456789:ABCDEF..." />
                        </Field>
                        <Field label="Chat ID">
                            <input type="text" value={formData.telegramChatId || ''} onChange={e => setFormData({ ...formData, telegramChatId: e.target.value })}
                                className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-blue-500 transition-all" placeholder="e.g. 987654321" />
                        </Field>
                        <div className="md:col-span-2 flex justify-end mt-2">
                            <button type="button" onClick={() => onTest('telegram')} disabled={testing.telegram}
                                className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-500 text-sm font-bold py-2.5 px-6 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50">
                                {testing.telegram ? <div className="size-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" /> : <span className="material-symbols-outlined text-[18px]">send</span>}
                                اختبار تليجرام
                            </button>
                        </div>
                    </div>
                }
            />

            {/* Email */}
            <NotificationChannel
                title="Email Notifications"
                desc="ملخص الطلب عبر البريد"
                color="purple"
                enabled={formData.emailEnabled}
                onToggle={v => setFormData({ ...formData, emailEnabled: v })}
                fields={
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <Field label="Email Receiver (Admin)">
                            <input type="email" value={formData.emailReceiver || ''} onChange={e => setFormData({ ...formData, emailReceiver: e.target.value })}
                                className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-purple-500 transition-all" placeholder="admin@example.com" />
                        </Field>
                        <Field label="SMTP Host">
                            <input type="text" value={formData.smtpHost || ''} onChange={e => setFormData({ ...formData, smtpHost: e.target.value })}
                                className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-purple-500 transition-all" placeholder="smtp.gmail.com" />
                        </Field>
                        <Field label="SMTP User">
                            <input type="text" value={formData.smtpUser || ''} onChange={e => setFormData({ ...formData, smtpUser: e.target.value })}
                                className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-purple-500 transition-all" />
                        </Field>
                        <Field label="SMTP App Password">
                            <input type="password" value={formData.smtpPass || ''} onChange={e => setFormData({ ...formData, smtpPass: e.target.value })}
                                className="w-full bg-[#111318]/50 text-white border border-[#3b4354] rounded-lg py-3 px-4 focus:outline-none focus:border-purple-500 transition-all" placeholder="••••••••" />
                        </Field>
                        <div className="md:col-span-2 flex justify-end mt-2">
                            <button type="button" onClick={() => onTest('email')} disabled={testing.email}
                                className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-500 text-sm font-bold py-2.5 px-6 rounded-lg transition-all flex items-center gap-2 disabled:opacity-50">
                                {testing.email ? <div className="size-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" /> : <span className="material-symbols-outlined text-[18px]">send</span>}
                                اختبار البريد
                            </button>
                        </div>
                    </div>
                }
            />
        </div>
    );
}

// ================================================================
// Shared Helpers
// ================================================================

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="space-y-2">
            <label className="text-white text-sm font-medium">{label}</label>
            {children}
        </div>
    );
}

function NotificationChannel({ title, desc, color, enabled, onToggle, fields }: {
    title: string;
    desc: string;
    color: string;
    enabled: boolean;
    onToggle: (v: boolean) => void;
    fields: React.ReactNode;
}) {
    const colorMap: Record<string, string> = { green: 'green', blue: 'blue', purple: 'purple' };
    const c = colorMap[color] || color;
    return (
        <div className="p-6 rounded-xl border border-white/10 bg-white/5 space-y-4">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className={`size-10 rounded-full bg-${c}-500/20 flex items-center justify-center text-${c}-500`}>
                        <span className="material-symbols-outlined text-lg">{color === 'green' ? 'chat' : color === 'blue' ? 'send' : 'mail'}</span>
                    </div>
                    <div>
                        <h4 className="text-white font-bold">{title}</h4>
                        <p className="text-sm text-gray-400">{desc}</p>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={enabled} onChange={e => onToggle(e.target.checked)} className="sr-only peer" />
                    <div className={`w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-${c}-500`} />
                </label>
            </div>
            {enabled && fields}
        </div>
    );
}
