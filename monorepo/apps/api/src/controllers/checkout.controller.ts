import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { PaymobService } from '../services/paymob.service.js';
import { decryptText } from '../lib/crypto.utils.js';
import { getMergedSettings } from '../lib/settings-helper.js';

/**
 * Checkout Controller
 * Handles payment initiation and verification WITHOUT creating orders.
 * Orders are only created in the orders controller AFTER payment is confirmed.
 */
export class CheckoutController {

    /**
     * POST /api/checkout/initiate-payment
     * Creates a Paymob payment session. Does NOT create an order.
     * Returns a payment URL for the frontend to open in an iframe/redirect.
     */
    static async initiatePayment(req: Request, res: Response) {
        try {
            const {
                orderId,
                amount,
                paymentMethod,
                walletNumber,
                fullName,
                phone,
                email,
                address,
                city,
                governorate,
            } = req.body;

            if (!orderId || !amount || !paymentMethod || !fullName) {
                return res.status(400).json({ error: 'Missing required fields including orderId' });
            }

            // Get app settings for Paymob config
            const appSettings = await getMergedSettings();
            const paymobApiKeyRaw = appSettings?.paymobApiKey ? decryptText(appSettings.paymobApiKey) : null;
            if (!appSettings?.paymobEnabled || !paymobApiKeyRaw) {
                return res.status(500).json({ error: 'الدفع الإلكتروني غير مُفعّل حالياً' });
            }

            const isWallet = paymentMethod === 'paymob_wallet';
            const integrationId = isWallet
                ? appSettings.paymobIntegrationWallet
                : appSettings.paymobIntegrationCard;

            if (!integrationId) {
                return res.status(400).json({
                    error: isWallet
                        ? 'لم يتم تفعيل الدفع بالمحفظة الإلكترونية'
                        : 'لم يتم تفعيل الدفع بالبطاقة البنكية'
                });
            }

            if (!isWallet && !appSettings.paymobIframeId) {
                return res.status(400).json({ error: 'إعدادات الدفع غير مكتملة' });
            }

            // We use the actual DB order ID + timestamp to ensure uniqueness in Paymob retries
            const tempMerchantId = `${orderId}-${Date.now()}`;

            const billingData = {
                first_name: fullName.split(' ')[0] || 'Guest',
                last_name: fullName.split(' ').slice(1).join(' ') || 'Guest',
                email: email || 'guest@example.com',
                phone_number: phone || '00000000000',
                apartment: 'NA',
                floor: 'NA',
                street: address || 'NA',
                building: 'NA',
                shipping_method: 'PKG',
                postal_code: 'NA',
                city: city || 'NA',
                country: 'EGY',
                state: governorate || 'NA',
            };

            console.log(`💳 [Checkout] Initiating payment: Method=${paymentMethod}, Amount=${amount}, MerchantID=${tempMerchantId}`);

            const { token: paymentToken, orderId: paymobOrderId } = await PaymobService.generatePaymentKey(
                paymobApiKeyRaw!,
                integrationId,
                parseFloat(amount),
                tempMerchantId,
                'EGP',
                billingData
            );

            console.log(`✅ [Checkout] Paymob session created: PaymobOrderID=${paymobOrderId}`);

            // Link the Paymob Order ID to our internal Draft Order
            const { orders } = await import('../db/schema.js');
            const { eq } = await import('drizzle-orm');
            await db.update(orders)
                .set({ paymobOrderId: paymobOrderId.toString() })
                .where(eq(orders.id, orderId));

            // Build redirect URL
            let paymentUrl = '';
            if (isWallet) {
                const targetPhone = walletNumber || phone;
                paymentUrl = await PaymobService.payWithWallet(paymentToken, targetPhone);
            } else {
                paymentUrl = `https://accept.paymob.com/api/acceptance/iframes/${appSettings.paymobIframeId}?payment_token=${paymentToken}`;
            }

            return res.json({
                paymentUrl,
                paymobOrderId: paymobOrderId.toString(),
            });

        } catch (error: any) {
            console.error('❌ [Checkout] Initiate Payment Error:', error?.response?.data || error?.message || error);
            
            const errorMessage = error?.message && error.message.includes('خطأ في بوابة الدفع')
                ? error.message 
                : error?.message && error.message.includes('مصادقة')
                ? error.message
                : error?.message && error.message.includes('فشل في الاتصال')
                ? error.message
                : 'فشل في بدء عملية الدفع. يرجى المحاولة مرة أخرى.';

            return res.status(500).json({ error: errorMessage });
        }
    }

    /**
     * POST /api/checkout/verify
     * Checks if a Paymob payment was successful by paymobOrderId.
     * Does NOT create an order — just returns payment status.
     */
    static async verifyPayment(req: Request, res: Response) {
        try {
            const { paymobOrderId } = req.body;

            if (!paymobOrderId) {
                return res.status(400).json({ error: 'paymobOrderId is required' });
            }

            const appSettings = await getMergedSettings();
            const paymobApiKeyRaw = appSettings?.paymobApiKey ? decryptText(appSettings.paymobApiKey) : null;
            
            if (!paymobApiKeyRaw) {
                return res.status(500).json({ error: 'Paymob not configured' });
            }

            const isPaid = await PaymobService.getTransactionStatus(paymobApiKeyRaw, paymobOrderId);

            console.log(`🔍 [Checkout] Verify: PaymobOrderID=${paymobOrderId}, Paid=${isPaid}`);

            return res.json({ paid: isPaid, paymobOrderId });

        } catch (error: any) {
            console.error('❌ [Checkout] Verify Error:', error?.response?.data || error?.message || error);
            return res.status(500).json({ error: 'فشل في التحقق من حالة الدفع' });
        }
    }
}
