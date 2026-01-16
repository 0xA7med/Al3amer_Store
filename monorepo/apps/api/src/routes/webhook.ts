import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller.js';

const router = Router();

router.post('/paymob', WebhookController.handlePaymobWebhook);

export default router;
