import { Router } from 'express';
import { AdminController } from '../controllers/admin.controller.js';

const router = Router();

router.get('/stats', AdminController.getStats);
router.get('/reports', AdminController.getReports);

export default router;
