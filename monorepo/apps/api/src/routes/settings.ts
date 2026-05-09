import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller.js';
import { validate } from '../lib/validate.js';
import { testGeminiSchema, testNotificationSchema } from '../schemas/index.js';

const router: Router = Router();

// Public route (no auth required)
router.get('/public', SettingsController.getPublic);

// Protected routes
router.get('/', SettingsController.get);
router.put('/', SettingsController.update);
router.patch('/', SettingsController.update);  // PATCH alias (used by bill layout config)
router.post('/test-gemini', validate({ body: testGeminiSchema }), SettingsController.testGemini);
router.post('/test-notification', validate({ body: testNotificationSchema }), SettingsController.testNotification);

export default router;
