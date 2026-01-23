import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { settings } from '../db/schema.js';
import { eq } from 'drizzle-orm';

export class SettingsController {
    // GET /api/settings - Fetch global settings
    static async get(_req: Request, res: Response) {
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
            } catch (insertError) {
                console.error('Failed to auto-create settings, returning default:', insertError);
                // Fallback to in-memory default if DB insert fails
                return res.json({ id: 'default', ...defaultSettings });
            }

        } catch (error) {
            console.error('Error fetching settings:', error);
            // Never throw 500 for this, return a safe fallback to keep frontend alive
            res.json({
                storeNameAr: 'Al3amer Store',
                aiEnabled: true
            });
        }
    }

    // GET /api/settings/public - Fetch public settings (no auth required)
    static async getPublic(_req: Request, res: Response) {
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
        } catch (error) {
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
    static async update(req: Request, res: Response) {
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
        } catch (error) {
            console.error('Error updating settings:', error);
            res.status(500).json({ error: 'Failed to update settings' });
        }
    }

    // POST /api/settings/test-gemini - Test Gemini API connection
    static async testGemini(req: Request, res: Response) {
        try {
            const { apiKey } = req.body;

            if (!apiKey || !apiKey.trim()) {
                return res.status(400).json({
                    success: false,
                    error: 'مفتاح API مطلوب'
                });
            }

            const cleanKey = apiKey.trim();

            // List of models to try in order of preference
            const modelsToTry = [
                'gemini-1.5-flash',
                'gemini-1.5-flash-001',
                'gemini-1.5-flash-latest',
                'gemini-pro',
                'gemini-1.0-pro'
            ];

            let lastError = null;
            let successResponse = null;
            let usedModel = '';

            for (const model of modelsToTry) {
                try {
                    console.log(`SettingController: Attempting connection with model: ${model}`);
                    const response = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`,
                        {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                contents: [{
                                    parts: [{ text: 'Say hello in Arabic in one word.' }]
                                }],
                                generationConfig: {
                                    maxOutputTokens: 10,
                                }
                            }),
                        }
                    );

                    if (response.ok) {
                        const data = await response.json();
                        successResponse = data;
                        usedModel = model;
                        break; // Success!
                    } else {
                        const errorData = await response.json().catch(() => ({}));
                        console.warn(`SettingController: Failed with ${model}:`, errorData);
                        lastError = errorData;
                        // Continue to next model...
                    }
                } catch (e) {
                    console.error(`SettingController: Network error with ${model}:`, e);
                    // Continue...
                }
            }

            if (!successResponse) {
                // Diagnostic step: Try to list available models
                try {
                    console.log('Attempting to list available models for diagnosis...');
                    const modelsResponse = await fetch(
                        `https://generativelanguage.googleapis.com/v1beta/models?key=${cleanKey}`
                    );

                    if (modelsResponse.ok) {
                        const modelsData = await modelsResponse.json() as any;
                        const availableModels = (modelsData.models || [])
                            .map((m: any) => m.name.replace('models/', ''))
                            .filter((n: string) => n.includes('gemini'));

                        return res.status(400).json({
                            success: false,
                            error: `فشل الاتصال بالنماذج المطلوبة. النماذج المتاحة لمفتاحك هي: ${availableModels.join(', ') || 'لا يوجد نماذج متاحة'}`
                        });
                    }
                } catch (diagError) {
                    console.error('Diagnostic check failed:', diagError);
                }

                const errorData = lastError as any;
                const errorMessage = errorData?.error?.message || 'فشل الاتصال بجميع نماذج Gemini المتاحة';
                const errorStatus = errorData?.error?.status || 'UNKNOWN';

                return res.status(400).json({
                    success: false,
                    error: `فشل الربط (${errorStatus}): ${errorMessage}`
                });
            }

            const generatedText = (successResponse as any)?.candidates?.[0]?.content?.parts?.[0]?.text || '';

            res.json({
                success: true,
                message: `تم الاتصال بنجاح (${usedModel})!`,
                response: generatedText.trim()
            });

        } catch (error) {
            console.error('Error testing Gemini connection:', error);
            res.status(500).json({
                success: false,
                error: 'فشل في الاتصال بخدمة Gemini'
            });
        }
    }
}
