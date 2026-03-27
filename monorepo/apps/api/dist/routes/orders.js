import { Router } from 'express';
import { OrdersController } from '../controllers/orders.controller.js';
const router = Router();
router.delete('/', OrdersController.bulkDelete);
router.patch('/status', OrdersController.bulkUpdateStatus);
router.post('/', OrdersController.create);
router.get('/', OrdersController.list);
router.get('/user/by-phone/:phone', OrdersController.getByPhone);
router.get('/:id', OrdersController.getOne);
router.put('/:id', OrdersController.updatePendingOrder);
router.put('/:id/status', OrdersController.updateStatus);
router.post('/:id/verify-payment', OrdersController.verifyPayment);
router.post('/:id/retry-payment', OrdersController.retryPayment);
export default router;
//# sourceMappingURL=orders.js.map