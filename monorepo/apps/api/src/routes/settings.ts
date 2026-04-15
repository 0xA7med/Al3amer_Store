import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller.js';

const router: Router = Router();

// Public route (no auth required)
router.get('/public', SettingsController.getPublic);

// Protected routes
router.get('/', SettingsController.get);
router.put('/', SettingsController.update);
router.patch('/', SettingsController.update);  // PATCH alias (used by bill layout config)
router.post('/test-gemini', SettingsController.testGemini);

export default router;
