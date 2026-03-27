import { db } from '../db/index.js';
import { settings } from '../db/schema.js';
import { eq } from 'drizzle-orm';
export class SettingsController {
    // GET /api/settings - Fetch global settings
    static async get(_req, res) {
        try {
            // Get the first (and only) settings record
            const settingsRecord = await db.query.settings.findFirst();
            if (settingsRecord) {
                return res.json(settingsRecord);
            }
            // Default safe settings object
            const defaultSettings = {
                storeNameAr: 'مركز العامر لأنظمة الكاشير',
                storeNameEn: 'Al3amer POS Systems',
                supportPhone: '+20 101 234 5678',
                supportEmail: 'support@al3amer.com',
                address: 'القاهرة، مدينة نصر، شارع عباس العقاد',
                codEnabled: true,
                shippingFlatRate: '50',
                freeShippingThreshold: '2000',
                vatEnabled: true,
                taxPercentage: '14',
                pricesIncludeTax: true,
                aiEnabled: true,
                aiTone: 'Marketing',
                aiLanguage: 'ar',
            };
            // Try to create default settings if none exist
            try {
                const [newSettings] = await db.insert(settings).values(defaultSettings).returning();
                return res.json(newSettings);
            }
            catch (insertError) {
                console.error('Failed to auto-create settings, returning default:', insertError);
                // Fallback to in-memory default if DB insert fails
                return res.json({ id: 'default', ...defaultSettings });
            }
        }
        catch (error) {
            console.error('Error fetching settings:', error);
            // Never throw 500 for this, return a safe fallback to keep frontend alive
            res.json({
                storeNameAr: 'Al3amer Store',
                aiEnabled: true
            });
        }
    }
    // GET /api/settings/public - Fetch public settings (no auth required)
    static async getPublic(_req, res) {
        try {
            const settingsRecord = await db.query.settings.findFirst();
            if (!settingsRecord) {
                // Return safe defaults if no settings exist
                return res.json({
                    storeNameAr: 'مركز العامر لأنظمة الكاشير',
                    storeNameEn: 'Al3amer POS Systems',
                    supportPhone: '+20 101 234 5678',
                    supportEmail: 'support@al3amer.com',
                    address: 'القاهرة، مدينة نصر، شارع عباس العقاد',
                    shippingFlatRate: '50',
                    freeShippingThreshold: '2000',
                    vatEnabled: true,
                    taxPercentage: '14',
                    pricesIncludeTax: true,
                    codEnabled: true,
                });
            }
            // Filter out sensitive fields
            const publicSettings = {
                // General
                storeNameAr: settingsRecord.storeNameAr,
                storeNameEn: settingsRecord.storeNameEn,
                supportPhone: settingsRecord.supportPhone,
                supportEmail: settingsRecord.supportEmail,
                address: settingsRecord.address,
                logoUrl: settingsRecord.logoUrl,
                faviconUrl: settingsRecord.faviconUrl,
                // Social Media
                facebook: settingsRecord.facebook,
                instagram: settingsRecord.instagram,
                whatsapp: settingsRecord.whatsapp,
                twitterX: settingsRecord.twitterX,
                // Shipping
                shippingFlatRate: settingsRecord.shippingFlatRate,
                freeShippingThreshold: settingsRecord.freeShippingThreshold,
                cityShippingRates: settingsRecord.cityShippingRates,
                // Tax
                vatEnabled: settingsRecord.vatEnabled,
                taxPercentage: settingsRecord.taxPercentage,
                pricesIncludeTax: settingsRecord.pricesIncludeTax,
                // Payment (public info only)
                codEnabled: settingsRecord.codEnabled,
                codExtraFee: settingsRecord.codExtraFee,
                paymobEnabled: settingsRecord.paymobEnabled,
                paymobIntegrationCard: settingsRecord.paymobIntegrationCard,
                paymobIntegrationWallet: settingsRecord.paymobIntegrationWallet,
                // SEO
                metaTitle: settingsRecord.metaTitle,
                metaDescription: settingsRecord.metaDescription,
                metaKeywords: settingsRecord.metaKeywords,
            };
            res.json(publicSettings);
        }
        catch (error) {
            console.error('Error fetching public settings:', error);
            // Return safe defaults on error
            res.json({
                storeNameAr: 'مركز العامر',
                storeNameEn: 'Al3amer',
                codEnabled: true,
                vatEnabled: false,
            });
        }
    }
    static async update(req, res) {
        try {
            const updateData = req.body;
            // Get existing settings
            const existingSettings = await db.query.settings.findFirst();
            if (!existingSettings) {
                // Create new settings if none exist
                const [newSettings] = await db.insert(settings).values(updateData).returning();
                return res.json(newSettings);
            }
            // Update existing settings
            const [updatedSettings] = await db.update(settings)
                .set(updateData)
                .where(eq(settings.id, existingSettings.id))
                .returning();
            res.json(updatedSettings);
        }
        catch (error) {
            console.error('Error updating settings:', error);
            res.status(500).json({ error: 'Failed to update settings' });
        }
    }
    // POST /api/settings/test-gemini - Test Gemini API connection with Dynamic Discovery
    static async testGemini(req, res) {
        try {
            const { apiKey } = req.body;
            if (!apiKey || !apiKey.trim()) {
                return res.status(400).json({
                    success: false,
                    error: 'مفتاح API مطلوب'
                });
            }
            const cleanKey = apiKey.trim();
            console.log("🚀 Starting Dynamic Model Discovery Test...");
            // Step 1: Discover available models
            const { ModelDiscoveryService } = await import('../services/model-discovery.service');
            const availableModels = await ModelDiscoveryService.discoverModels(cleanKey, 'v1');
            if (availableModels.length === 0) {
                return res.status(500).json({
                    success: false,
                    error: 'لم يتم العثور على نماذج متاحة',
                    details: ['No models available for this API key']
                });
            }
            console.log(`✅ Found ${availableModels.length} available models:`, availableModels);
            // Step 2: Test the first available model
            const errorLogs = [];
            for (const modelName of availableModels) {
                try {
                    console.log(`🧪 Testing model: ${modelName}`);
                    const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${cleanKey}`;
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            contents: [{
                                    parts: [{ text: 'قل مرحبا بالعربية في كلمة واحدة فقط.' }]
                                }]
                        })
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
                            response: text?.trim() || 'No text content'
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
            // If we are here, all discovered models failed
            console.error("❌ All discovered models failed.");
            return res.status(500).json({
                success: false,
                error: 'فشلت جميع النماذج المكتشفة',
                totalModelsFound: availableModels.length,
                allAvailableModels: availableModels,
                details: errorLogs
            });
        }
        catch (error) {
            console.error('Critical failure in testGemini controller:', error);
            res.status(500).json({
                success: false,
                error: 'خطأ داخلي أثناء اختبار الاتصال',
                details: [error.message]
            });
        }
    }
}
//# sourceMappingURL=settings.controller.js.map