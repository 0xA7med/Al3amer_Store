import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller.js';

const router = Router();

// Public route (no auth required)
router.get('/public', SettingsController.getPublic);

// Protected routes
router.get('/', SettingsController.get);
router.put('/', SettingsController.update);
router.post('/test-gemini', SettingsController.testGemini);

export default router;
