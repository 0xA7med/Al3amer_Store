import { Router } from 'express';
import { OrdersController } from '../controllers/orders.controller.js';

const router = Router();

router.post('/', OrdersController.create);
router.get('/', OrdersController.list);
router.get('/:id', OrdersController.getOne);
router.get('/:id/status', OrdersController.getStatus);
router.put('/:id/status', OrdersController.updateStatus);

export default router;
