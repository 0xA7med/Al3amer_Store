import { Router } from 'express';
import { CheckoutController } from '../controllers/checkout.controller.js';
import rateLimit from 'express-rate-limit';

const router: Router = Router();

// Rate Limiter: Max 5 payment initiations per minute per IP
const paymentLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    message: { error: 'تم تجاوز الحد المسموح من الطلبات. الرجاء المحاولة بعد دقيقة.' },
    standardHeaders: true,
    legacyHeaders: false,
    // express-rate-limit defaults to req.ip which handles IPv6 safely
});

router.post('/initiate-payment', paymentLimiter, CheckoutController.initiatePayment);
router.post('/verify', paymentLimiter, CheckoutController.verifyPayment);

export default router;
