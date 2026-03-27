import { Router } from 'express';
import { AIBundleController } from '../controllers/ai-bundle.controller.js';

const router: Router = Router();

router.post('/generate', AIBundleController.generate);
router.post('/log', AIBundleController.log);

export default router;
