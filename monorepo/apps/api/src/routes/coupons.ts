import { Router } from 'express';
import { CouponsController } from '../controllers/coupons.controller.js';
import { validate } from '../lib/validate.js';
import { createCouponSchema, updateCouponSchema, validateCouponSchema } from '../schemas/index.js';

const router: Router = Router();

router.get('/', CouponsController.list);
router.get('/:id', CouponsController.getOne);
router.post('/', validate({ body: createCouponSchema }), CouponsController.create);
router.post('/validate', validate({ body: validateCouponSchema }), CouponsController.validate);
router.put('/:id', validate({ body: updateCouponSchema }), CouponsController.update);
router.delete('/:id', CouponsController.delete);

export default router;
