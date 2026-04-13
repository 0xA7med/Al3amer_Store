import { Router } from 'express';
import { OrdersController } from '../controllers/orders.controller.js';
import rateLimit from 'express-rate-limit';

const router: Router = Router();

// Rate Limiter: Max 10 orders per minute per IP
const orderCreationLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: { error: 'تم تجاوز الحد المسموح من الطلبات. الرجاء المحاولة بعد دقيقة.' },
    standardHeaders: true,
    legacyHeaders: false,
    // express-rate-limit defaults to req.ip which handles IPv6 safely
});

router.delete('/', OrdersController.bulkDelete);
router.patch('/status', OrdersController.bulkUpdateStatus);
router.post('/', orderCreationLimiter, OrdersController.create);
router.get('/', OrdersController.list);
router.get('/user/by-phone/:phone', OrdersController.getByPhone);
router.get('/:id', OrdersController.getOne);
router.put('/:id', OrdersController.updatePendingOrder);
router.put('/:id/status', OrdersController.updateStatus);
router.post('/:id/verify-payment', orderCreationLimiter, OrdersController.verifyPayment);
router.post('/:id/retry-payment', orderCreationLimiter, OrdersController.retryPayment);

export default router;
