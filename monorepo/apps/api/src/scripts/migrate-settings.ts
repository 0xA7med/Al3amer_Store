import { db, migrationClient } from '../db/index.js';
import { settings, paymentSettings, notificationSettings, aiSettings, shippingSettings } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';

dotenv.config();

async function migrateSettingsData() {
    console.log('🔄 Starting settings data migration...');

    const existingSettings = await db.query.settings.findFirst();
    if (!existingSettings) {
        console.log('❌ No settings record found. Aborting.');
        return;
    }

    const settingsId = existingSettings.id;
    console.log(`📋 Found settings record: ${settingsId}`);

    // === PAYMENT SETTINGS ===
    const existingPayment = await db.query.paymentSettings.findFirst({
        where: eq(paymentSettings.settingsId, settingsId),
    });

    if (!existingPayment) {
        const paymentData = {
            settingsId,
            paymobEnabled: (existingSettings as any).paymobEnabled ?? false,
            paymobApiKey: (existingSettings as any).paymobApiKey ?? null,
            paymobIntegrationCard: (existingSettings as any).paymobIntegrationCard ?? null,
            paymobIntegrationWallet: (existingSettings as any).paymobIntegrationWallet ?? null,
            paymobIframeId: (existingSettings as any).paymobIframeId ?? null,
            codEnabled: (existingSettings as any).codEnabled ?? true,
            codExtraFee: (existingSettings as any).codExtraFee ?? '0',
            codAdvancePayment: (existingSettings as any).codAdvancePayment ?? '100',
            codReturnShippingBaseFee: (existingSettings as any).codReturnShippingBaseFee ?? '30',
            codReturnShippingBaseAmount: (existingSettings as any).codReturnShippingBaseAmount ?? '1000',
            codReturnShippingExtraFee: (existingSettings as any).codReturnShippingExtraFee ?? '5',
            codReturnShippingExtraAmount: (existingSettings as any).codReturnShippingExtraAmount ?? '1000',
        };
        await db.insert(paymentSettings).values(paymentData);
        console.log('✅ Payment settings migrated');
    } else {
        console.log('⏭️ Payment settings already exist, skipping');
    }

    // === NOTIFICATION SETTINGS ===
    const existingNotification = await db.query.notificationSettings.findFirst({
        where: eq(notificationSettings.settingsId, settingsId),
    });

    if (!existingNotification) {
        const notificationData = {
            settingsId,
            telegramEnabled: (existingSettings as any).telegramEnabled ?? false,
            telegramBotToken: (existingSettings as any).telegramBotToken ?? null,
            telegramChatId: (existingSettings as any).telegramChatId ?? null,
            whatsappEnabled: (existingSettings as any).whatsappEnabled ?? false,
            whatsappApiKey: (existingSettings as any).whatsappApiKey ?? null,
            whatsappRecipientPhone: (existingSettings as any).whatsappRecipientPhone ?? null,
            emailEnabled: (existingSettings as any).emailEnabled ?? false,
            smtpHost: (existingSettings as any).smtpHost ?? null,
            smtpPort: (existingSettings as any).smtpPort ?? 587,
            smtpUser: (existingSettings as any).smtpUser ?? null,
            smtpPass: (existingSettings as any).smtpPass ?? null,
            emailFrom: (existingSettings as any).emailFrom ?? null,
            emailReceiver: (existingSettings as any).emailReceiver ?? null,
        };
        await db.insert(notificationSettings).values(notificationData);
        console.log('✅ Notification settings migrated');
    } else {
        console.log('⏭️ Notification settings already exist, skipping');
    }

    // === AI SETTINGS ===
    const existingAi = await db.query.aiSettings.findFirst({
        where: eq(aiSettings.settingsId, settingsId),
    });

    if (!existingAi) {
        const aiData = {
            settingsId,
            aiEnabled: (existingSettings as any).aiEnabled ?? true,
            googleApiKey: (existingSettings as any).googleApiKey ?? null,
            aiApiKey: (existingSettings as any).aiApiKey ?? null,
            aiTone: (existingSettings as any).aiTone ?? 'Marketing',
            aiLanguage: (existingSettings as any).aiLanguage ?? 'ar',
            aiDescriptionLength: (existingSettings as any).aiDescriptionLength ?? 'medium',
            aiFields: (existingSettings as any).aiFields ?? null,
        };
        await db.insert(aiSettings).values(aiData);
        console.log('✅ AI settings migrated');
    } else {
        console.log('⏭️ AI settings already exist, skipping');
    }

    // === SHIPPING SETTINGS ===
    const existingShipping = await db.query.shippingSettings.findFirst({
        where: eq(shippingSettings.settingsId, settingsId),
    });

    if (!existingShipping) {
        const shippingData = {
            settingsId,
            shippingFlatRate: (existingSettings as any).shippingFlatRate ?? '50',
            freeShippingThreshold: (existingSettings as any).freeShippingThreshold ?? '2000',
            customCityRatesEnabled: (existingSettings as any).customCityRatesEnabled ?? false,
            cityShippingRates: (existingSettings as any).cityShippingRates ?? [],
        };
        await db.insert(shippingSettings).values(shippingData);
        console.log('✅ Shipping settings migrated');
    } else {
        console.log('⏭️ Shipping settings already exist, skipping');
    }

    console.log('\n🎉 Settings data migration completed successfully!');
    process.exit(0);
}

migrateSettingsData().catch((err) => {
    console.error('❌ Migration failed:', err);
    process.exit(1);
});
