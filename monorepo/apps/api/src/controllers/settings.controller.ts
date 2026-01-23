import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { settings } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { GoogleGenAI } from '@google/genai';

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

            // ✅ Use the new @google/genai SDK (API v1)
            const client = new GoogleGenAI({
                apiKey: cleanKey,
                apiVersion: 'v1'
            });

            const response = await client.models.generateContent({
                model: 'gemini-1.5-flash',
                contents: [{ role: 'user', parts: [{ text: 'Say hello in Arabic in one word.' }] }],
                config: {
                    maxOutputTokens: 10,
                }
            });

            if (!response.text) {
                return res.status(400).json({
                    success: false,
                    error: 'لم يتم استلام أي نص من Gemini'
                });
            }

            res.json({
                success: true,
                message: 'تم الاتصال بنجاح!',
                response: response.text.trim()
            });

        } catch (error: any) {
            console.error('Error testing Gemini connection:', error);
            res.status(500).json({
                success: false,
                error: 'فشل في الاتصال بخدمة Gemini',
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
                rawError: JSON.stringify(error, Object.getOwnPropertyNames(error))
            });
        }
    }
}
