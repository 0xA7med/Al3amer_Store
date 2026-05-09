import { Router } from 'express';
import { CheckoutController } from '../controllers/checkout.controller.js';
import rateLimit from 'express-rate-limit';
import { validate } from '../lib/validate.js';
import { initiatePaymentSchema, verifyPaymentSchema } from '../schemas/index.js';
const router = Router();
// Rate Limiter: Max 5 payment initiations per minute per IP
const paymentLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    message: { error: 'تم تجاوز الحد المسموح من الطلبات. الرجاء المحاولة بعد دقيقة.' },
    standardHeaders: true,
    legacyHeaders: false,
});
router.post('/initiate-payment', paymentLimiter, validate({ body: initiatePaymentSchema }), CheckoutController.initiatePayment);
router.post('/verify', paymentLimiter, validate({ body: verifyPaymentSchema }), CheckoutController.verifyPayment);
export default router;
//# sourceMappingURL=checkout.js.map