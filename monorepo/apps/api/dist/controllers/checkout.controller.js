import { db } from '../db/index.js';
import { PaymobService } from '../services/paymob.service.js';
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
    static async initiatePayment(req, res) {
        try {
            const { amount, paymentMethod, walletNumber, fullName, phone, email, address, city, governorate, } = req.body;
            if (!amount || !paymentMethod || !fullName) {
                return res.status(400).json({ error: 'Missing required fields' });
            }
            // Get app settings for Paymob config
            const appSettings = await db.query.settings.findFirst();
            if (!appSettings?.paymobEnabled || !appSettings.paymobApiKey) {
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
            // Generate a temporary merchant ID (not tied to any order yet)
            const tempMerchantId = `CHECKOUT-${Date.now()}`;
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
            const { token: paymentToken, orderId: paymobOrderId } = await PaymobService.generatePaymentKey(appSettings.paymobApiKey, integrationId, parseFloat(amount), tempMerchantId, 'EGP', billingData);
            console.log(`✅ [Checkout] Paymob session created: PaymobOrderID=${paymobOrderId}`);
            // Build redirect URL
            let paymentUrl = '';
            if (isWallet) {
                const targetPhone = walletNumber || phone;
                paymentUrl = await PaymobService.payWithWallet(paymentToken, targetPhone);
            }
            else {
                paymentUrl = `https://accept.paymob.com/api/acceptance/iframes/${appSettings.paymobIframeId}?payment_token=${paymentToken}`;
            }
            return res.json({
                paymentUrl,
                paymobOrderId: paymobOrderId.toString(),
            });
        }
        catch (error) {
            console.error('❌ [Checkout] Initiate Payment Error:', error?.response?.data || error?.message || error);
            return res.status(500).json({ error: 'فشل في بدء عملية الدفع. يرجى المحاولة مرة أخرى.' });
        }
    }
    /**
     * POST /api/checkout/verify
     * Checks if a Paymob payment was successful by paymobOrderId.
     * Does NOT create an order — just returns payment status.
     */
    static async verifyPayment(req, res) {
        try {
            const { paymobOrderId } = req.body;
            if (!paymobOrderId) {
                return res.status(400).json({ error: 'paymobOrderId is required' });
            }
            const appSettings = await db.query.settings.findFirst();
            if (!appSettings?.paymobApiKey) {
                return res.status(500).json({ error: 'Paymob not configured' });
            }
            const isPaid = await PaymobService.getTransactionStatus(appSettings.paymobApiKey, paymobOrderId);
            console.log(`🔍 [Checkout] Verify: PaymobOrderID=${paymobOrderId}, Paid=${isPaid}`);
            return res.json({ paid: isPaid, paymobOrderId });
        }
        catch (error) {
            console.error('❌ [Checkout] Verify Error:', error?.response?.data || error?.message || error);
            return res.status(500).json({ error: 'فشل في التحقق من حالة الدفع' });
        }
    }
}
//# sourceMappingURL=checkout.controller.js.map