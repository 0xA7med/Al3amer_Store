import { Router } from 'express';
import { OrdersController } from '../controllers/orders.controller.js';
import rateLimit from 'express-rate-limit';
import { validate } from '../lib/validate.js';
import { createOrderSchema, updatePendingOrderSchema, updateOrderStatusSchema, bulkDeleteOrdersSchema, bulkUpdateOrdersStatusSchema, listOrdersQuery, retryPaymentSchema, } from '../schemas/index.js';
const router = Router();
// Rate Limiter: Max 10 orders per minute per IP
const orderCreationLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: { error: 'تم تجاوز الحد المسموح من الطلبات. الرجاء المحاولة بعد دقيقة.' },
    standardHeaders: true,
    legacyHeaders: false,
});
router.delete('/', validate({ body: bulkDeleteOrdersSchema }), OrdersController.bulkDelete);
router.patch('/status', validate({ body: bulkUpdateOrdersStatusSchema }), OrdersController.bulkUpdateStatus);
router.post('/', orderCreationLimiter, validate({ body: createOrderSchema }), OrdersController.create);
router.get('/', validate({ query: listOrdersQuery }), OrdersController.list);
router.get('/user/by-phone/:phone', OrdersController.getByPhone);
router.get('/:id', OrdersController.getOne);
router.put('/:id', validate({ body: updatePendingOrderSchema }), OrdersController.updatePendingOrder);
router.put('/:id/status', validate({ body: updateOrderStatusSchema }), OrdersController.updateStatus);
router.post('/:id/verify-payment', orderCreationLimiter, OrdersController.verifyPayment);
router.post('/:id/retry-payment', orderCreationLimiter, validate({ body: retryPaymentSchema }), OrdersController.retryPayment);
export default router;
//# sourceMappingURL=orders.js.map