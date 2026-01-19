import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller.js';

const router = Router();

router.get('/dashboard', AnalyticsController.getDashboardStats);
router.get('/reports', AnalyticsController.getReportsData);

export { router as analyticsRoutes };
