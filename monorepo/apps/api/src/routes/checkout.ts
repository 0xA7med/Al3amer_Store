import { Router } from 'express';
import { CheckoutController } from '../controllers/checkout.controller.js';

const router: Router = Router();

router.post('/initiate-payment', CheckoutController.initiatePayment);
router.post('/verify', CheckoutController.verifyPayment);

export default router;
