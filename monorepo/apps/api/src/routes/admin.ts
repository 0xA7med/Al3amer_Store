import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';
import { validate } from '../lib/validate.js';
import { getReportsQuery } from '../schemas/index.js';

const router: Router = Router();

router.get('/stats', AdminController.getStats);
router.get('/reports', validate({ query: getReportsQuery }), AdminController.getReports);
router.get('/ai-logs', AdminController.getAILogs);
router.get('/debug-models', AdminController.debugModels);

export default router;
