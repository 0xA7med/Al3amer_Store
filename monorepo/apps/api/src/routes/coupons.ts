import { Router } from 'express';
import { CouponsController } from '../controllers/coupons.controller.js';

const router: Router = Router();

router.get('/', CouponsController.list);
router.get('/:id', CouponsController.getOne);
router.post('/', CouponsController.create);
router.post('/validate', CouponsController.validate);
router.put('/:id', CouponsController.update);
router.delete('/:id', CouponsController.delete);

export default router;
