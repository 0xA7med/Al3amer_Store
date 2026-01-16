import { Request, Response } from 'express';
import { db } from '../db/index.js';
import { orders } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export class WebhookController {
    /**
     * POST /api/webhook/paymob
     * Handles Paymob transaction webhooks with HMAC security
     */
    static async handlePaymobWebhook(req: Request, res: Response) {
        try {
            console.log('🔔 [PAYMOB WEBHOOK] Received Event');

            const hmac = req.query.hmac as string;
            const data = req.body;
            const obj = data.obj;

            if (!hmac || !obj) {
                console.warn('⚠️ [PAYMOB WEBHOOK] Missing HMAC or Payload');
                return res.status(400).send('Bad Request');
            }

            // 1. HMAC Verification
            const secret = process.env.PAYMOB_HMAC_SECRET;
            if (!secret) {
                console.error('❌ [PAYMOB WEBHOOK] PAYMOB_HMAC_SECRET not found in environment');
                return res.status(500).send('Internal Server Error');
            }

            // Paymob HMAC Calculation Keys (in correct order)
            const keys = [
                'amount_cents',
                'created_at',
                'currency',
                'error_occured',
                'has_parent_transaction',
                'id',
                'integration_id',
                'is_3d_secure',
                'is_auth',
                'is_capture',
                'is_refunded',
                'is_standalone_payment',
                'is_voided',
                'order.id',
                'owner',
                'pending',
                'source_data.pan',
                'source_data.sub_type',
                'source_data.type',
                'success'
            ];

            const lexedData: any[] = [];
            keys.forEach(key => {
                if (key === 'order.id') {
                    lexedData.push(obj.order?.id);
                } else if (key.startsWith('source_data.')) {
                    const subKey = key.split('.')[1];
                    lexedData.push(obj.source_data?.[subKey]);
                } else {
                    lexedData.push(obj[key]);
                }
            });

            const concatenatedString = lexedData.join('');
            const calculatedHmac = crypto
                .createHmac('sha512', secret)
                .update(concatenatedString)
                .digest('hex');

            if (calculatedHmac !== hmac) {
                console.error('❌ [PAYMOB WEBHOOK] HMAC Mismatch!');
                return res.status(403).send('Forbidden');
            }

            console.log('✅ [PAYMOB WEBHOOK] HMAC Verified');
            console.log(`📊 Transaction Success: ${obj.success}, Order ID: ${obj.order?.id}, Trans ID: ${obj.id}`);

            // 2. Process Business Logic
            if (obj.success === true) {
                const paymobOrderId = obj.order?.id?.toString();

                if (paymobOrderId) {
                    // Update our internal order
                    const result = await db.update(orders)
                        .set({
                            status: 'processing', // or 'paid' depending on your flow
                            updatedAt: new Date()
                        })
                        .where(eq(orders.paymobOrderId, paymobOrderId))
                        .returning();

                    if (result.length > 0) {
                        console.log(`🎉 [PAYMOB WEBHOOK] Successfully updated order ${result[0].orderNumber} to processing`);
                    } else {
                        console.warn(`⚠️ [PAYMOB WEBHOOK] No internal order found for Paymob Order ID: ${paymobOrderId}`);
                    }
                }
            } else {
                console.log('ℹ️ [PAYMOB WEBHOOK] Skipping non-success transaction');
            }

            // Always respond with 200 to acknowledge receipt
            res.status(200).send('OK');
        } catch (error) {
            console.error('🔥 [PAYMOB WEBHOOK] Crash:', error);
            res.status(500).send('Internal Server Error');
        }
    }
}
