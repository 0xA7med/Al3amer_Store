import { db } from '../db/index.js';
import { settings, paymentSettings, notificationSettings, aiSettings, shippingSettings } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { encryptText, decryptText } from '../lib/crypto.utils.js';
import { getMergedSettings } from '../lib/settings-helper.js';
const defaultSettings = {
    storeNameAr: '',
    storeNameEn: '',
    supportPhone: '',
    supportEmail: '',
    address: '',
    logoUrl: '',
    faviconUrl: '',
    facebook: '',
    instagram: '',
    whatsapp: '',
    twitterX: '',
    codEnabled: true,
    vatEnabled: true,
    taxPercentage: '14',
    pricesIncludeTax: true,
    shippingFlatRate: '50',
    freeShippingThreshold: '2000',
    aiEnabled: true,
    aiTone: 'Marketing',
    aiLanguage: 'ar',
};
const defaultSettingsPublic = {
    storeNameAr: '',
    storeNameEn: '',
    supportPhone: '',
    supportEmail: '',
    address: '',
    logoUrl: '',
    faviconUrl: '',
    facebook: '',
    instagram: '',
    whatsapp: '',
    twitterX: '',
    codEnabled: true,
    vatEnabled: true,
    taxPercentage: '14',
    pricesIncludeTax: true,
    shippingFlatRate: '50',
    freeShippingThreshold: '2000',
};
const GENERAL_FIELDS = ['storeNameAr', 'storeNameEn', 'supportPhone', 'supportEmail', 'address', 'logoUrl', 'faviconUrl', 'facebook', 'instagram', 'whatsapp', 'twitterX', 'vatEnabled', 'taxPercentage', 'taxRegistrationNumber', 'pricesIncludeTax', 'facebookPixelId', 'facebookPixelEnabled', 'ga4MeasurementId', 'ga4Enabled', 'metaTitle', 'metaDescription', 'metaKeywords', 'billLayoutConfig'];
const PAYMENT_FIELDS = ['paymobEnabled', 'paymobApiKey', 'paymobIntegrationCard', 'paymobIntegrationWallet', 'paymobIframeId', 'codEnabled', 'codExtraFee', 'codAdvancePayment', 'codReturnShippingBaseFee', 'codReturnShippingBaseAmount', 'codReturnShippingExtraFee', 'codReturnShippingExtraAmount'];
const NOTIFICATION_FIELDS = ['telegramEnabled', 'telegramBotToken', 'telegramChatId', 'whatsappEnabled', 'whatsappApiKey', 'whatsappRecipientPhone', 'emailEnabled', 'smtpHost', 'smtpPort', 'smtpUser', 'smtpPass', 'emailFrom', 'emailReceiver'];
const AI_FIELDS = ['aiEnabled', 'googleApiKey', 'aiApiKey', 'aiTone', 'aiLanguage', 'aiDescriptionLength', 'aiFields'];
const SHIPPING_FIELDS = ['shippingFlatRate', 'freeShippingThreshold', 'customCityRatesEnabled', 'cityShippingRates'];
async function getOrCreateSettingsId() {
    const existing = await db.query.settings.findFirst();
    if (existing)
        return existing.id;
    const [created] = await db.insert(settings).values({}).returning();
    return created.id;
}
async function upsertDomain(table, settingsIdCol, data, settingsId) {
    const keys = Object.keys(data);
    if (keys.length === 0)
        return;
    const results = await db.select().from(table).where(eq(settingsIdCol, settingsId)).limit(1);
    if (results.length > 0) {
        await db.update(table).set(data).where(eq(settingsIdCol, settingsId));
    }
    else {
        await db.insert(table).values({ ...data, settingsId });
    }
}
function pick(obj, keys) {
    const result = {};
    for (const key of keys) {
        if (key in obj)
            result[key] = obj[key];
    }
    return result;
}
export class SettingsController {
    // GET /api/settings - Fetch all settings (admin)
    static async get(_req, res) {
        try {
            const merged = await getMergedSettings();
            if (Object.keys(merged).length > 0) {
                if (merged.paymobApiKey)
                    merged.paymobApiKey = decryptText(merged.paymobApiKey) || merged.paymobApiKey;
                if (merged.googleApiKey)
                    merged.googleApiKey = decryptText(merged.googleApiKey) || merged.googleApiKey;
                if (merged.aiApiKey)
                    merged.aiApiKey = decryptText(merged.aiApiKey) || merged.aiApiKey;
                if (merged.telegramBotToken)
                    merged.telegramBotToken = decryptText(merged.telegramBotToken) || merged.telegramBotToken;
                if (merged.whatsappApiKey)
                    merged.whatsappApiKey = decryptText(merged.whatsappApiKey) || merged.whatsappApiKey;
                if (merged.smtpPass)
                    merged.smtpPass = decryptText(merged.smtpPass) || merged.smtpPass;
                return res.json(merged);
            }
            const settingsId = await getOrCreateSettingsId();
            await db.insert(paymentSettings).values({ settingsId });
            await db.insert(notificationSettings).values({ settingsId });
            await db.insert(aiSettings).values({ settingsId });
            await db.insert(shippingSettings).values({ settingsId });
            const refreshed = await getMergedSettings();
            return res.json({
                id: settingsId,
                ...defaultSettings,
                ...refreshed,
            });
        }
        catch (error) {
            console.error('Error fetching settings:', error);
            res.json({ aiEnabled: true });
        }
    }
    // GET /api/settings/public - Fetch public settings (no auth required)
    static async getPublic(_req, res) {
        try {
            const merged = await getMergedSettings();
            if (Object.keys(merged).length === 0) {
                return res.json(defaultSettingsPublic);
            }
            const publicSettings = {
                storeNameAr: merged.storeNameAr,
                storeNameEn: merged.storeNameEn,
                supportPhone: merged.supportPhone,
                supportEmail: merged.supportEmail,
                address: merged.address,
                logoUrl: merged.logoUrl,
                faviconUrl: merged.faviconUrl,
                facebook: merged.facebook,
                instagram: merged.instagram,
                whatsapp: merged.whatsapp,
                twitterX: merged.twitterX,
                shippingFlatRate: merged.shippingFlatRate,
                freeShippingThreshold: merged.freeShippingThreshold,
                cityShippingRates: merged.cityShippingRates,
                vatEnabled: merged.vatEnabled,
                taxPercentage: merged.taxPercentage,
                pricesIncludeTax: merged.pricesIncludeTax,
                codEnabled: merged.codEnabled,
                codExtraFee: merged.codExtraFee,
                paymobEnabled: merged.paymobEnabled,
                paymobIntegrationCard: merged.paymobIntegrationCard,
                paymobIntegrationWallet: merged.paymobIntegrationWallet,
                metaTitle: merged.metaTitle,
                metaDescription: merged.metaDescription,
                metaKeywords: merged.metaKeywords,
            };
            res.json(publicSettings);
        }
        catch (error) {
            console.error('Error fetching public settings:', error);
            res.json({ codEnabled: true, vatEnabled: false });
        }
    }
    // PUT /api/settings - Update settings
    static async update(req, res) {
        try {
            const updateData = { ...req.body };
            const encryptIfNeeded = (key) => {
                const val = updateData[key];
                if (val && !val.includes(':')) {
                    updateData[key] = encryptText(val);
                }
            };
            encryptIfNeeded('paymobApiKey');
            encryptIfNeeded('googleApiKey');
            encryptIfNeeded('aiApiKey');
            encryptIfNeeded('telegramBotToken');
            encryptIfNeeded('whatsappApiKey');
            encryptIfNeeded('smtpPass');
            const settingsId = await getOrCreateSettingsId();
            const generalData = pick(updateData, GENERAL_FIELDS);
            const paymentData = pick(updateData, PAYMENT_FIELDS);
            const notificationData = pick(updateData, NOTIFICATION_FIELDS);
            const aiData = pick(updateData, AI_FIELDS);
            const shippingData = pick(updateData, SHIPPING_FIELDS);
            if (Object.keys(generalData).length > 0) {
                await db.update(settings).set(generalData).where(eq(settings.id, settingsId));
            }
            await Promise.all([
                upsertDomain(paymentSettings, paymentSettings.settingsId, paymentData, settingsId),
                upsertDomain(notificationSettings, notificationSettings.settingsId, notificationData, settingsId),
                upsertDomain(aiSettings, aiSettings.settingsId, aiData, settingsId),
                upsertDomain(shippingSettings, shippingSettings.settingsId, shippingData, settingsId),
            ]);
            const merged = await getMergedSettings();
            res.json(merged);
        }
        catch (error) {
            console.error('Error updating settings:', error);
            res.status(500).json({ error: 'Failed to update settings' });
        }
    }
    // POST /api/settings/test-gemini
    static async testGemini(req, res) {
        try {
            const { apiKey } = req.body;
            if (!apiKey || !apiKey.trim()) {
                return res.status(400).json({ success: false, error: 'مفتاح API مطلوب' });
            }
            const cleanKey = apiKey.trim();
            console.log('🚀 Starting Dynamic Model Discovery Test...');
            const { ModelDiscoveryService } = await import('../services/model-discovery.service.js');
            const availableModels = await ModelDiscoveryService.discoverModels(cleanKey, 'v1');
            if (availableModels.length === 0) {
                return res.status(500).json({
                    success: false,
                    error: 'لم يتم العثور على نماذج متاحة',
                    details: ['No models available for this API key'],
                });
            }
            console.log(`✅ Found ${availableModels.length} available models:`, availableModels);
            const errorLogs = [];
            for (const modelName of availableModels) {
                try {
                    console.log(`🧪 Testing model: ${modelName}`);
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${cleanKey}`;
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: 'قل مرحبا بالعربية في كلمة واحدة فقط.' }] }],
                        }),
                    });
                    const data = await response.json();
                    if (response.ok) {
                        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                        console.log(`✅ Success with model: ${modelName}`);
                        return res.json({
                            success: true,
                            message: 'تم الاتصال بنجاح! (Dynamic Discovery)',
                            modelUsed: modelName,
                            totalModelsFound: availableModels.length,
                            allAvailableModels: availableModels,
                            response: text?.trim() || 'No text content',
                        });
                    }
                    const errorMsg = data.error?.message || response.statusText;
                    console.warn(`❌ ${modelName} failed (${response.status}): ${errorMsg}`);
                    errorLogs.push(`${modelName} (${response.status}): ${errorMsg}`);
                }
                catch (err) {
                    const errorMsg = err.message || 'Network error';
                    console.warn(`❌ ${modelName} encountered an error: ${errorMsg}`);
                    errorLogs.push(`${modelName}: ${errorMsg}`);
                }
            }
            console.error('❌ All discovered models failed.');
            return res.status(500).json({
                success: false,
                error: 'فشلت جميع النماذج المكتشفة',
                totalModelsFound: availableModels.length,
                allAvailableModels: availableModels,
                details: errorLogs,
            });
        }
        catch (error) {
            console.error('Critical failure in testGemini controller:', error);
            res.status(500).json({ success: false, error: 'خطأ داخلي أثناء اختبار الاتصال', details: [error.message] });
        }
    }
    // POST /api/settings/test-notification
    static async testNotification(req, res) {
        try {
            const { type, config } = req.body;
            if (!type || !config) {
                return res.status(400).json({ success: false, error: 'بيانات الاختبار غير مكتملة' });
            }
            console.log(`🧪 Received test notification request for channel: ${type}`);
            const { NotificationService } = await import('../services/notification.service.js');
            await NotificationService.sendTestNotification(type, config);
            return res.json({ success: true, message: `تم إرسال رسالة الاختبار بنجاح عبر ${type}` });
        }
        catch (error) {
            console.error('❌ SettingsController testNotification failure:', error);
            return res.status(500).json({
                success: false,
                error: 'فشل إرسال رسالة الاختبار',
                message: error.message,
            });
        }
    }
}
//# sourceMappingURL=settings.controller.js.map