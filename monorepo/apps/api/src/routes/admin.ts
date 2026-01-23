import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';

const router = Router();

router.get('/stats', AdminController.getStats);
router.get('/reports', AdminController.getReports);
router.get('/ai-logs', AdminController.getAILogs);
router.get('/debug-models', AdminController.debugModels);

export default router;
