import { Router } from 'express';
import { OrdersController } from '../controllers/orders.controller.js';
const router = Router();
router.post('/', OrdersController.create);
router.get('/', OrdersController.list);
router.get('/:id', OrdersController.getOne);
router.get('/:id/status', OrdersController.getStatus);
router.put('/:id/status', OrdersController.updateStatus);
router.post('/:id/verify-payment', OrdersController.verifyPayment);
export default router;
//# sourceMappingURL=orders.js.map