import { Router } from 'express';
import { AIBundleController } from '../controllers/ai-bundle.controller.js';
import { validate } from '../lib/validate.js';
import { generateBundleSchema, logBundleSchema } from '../schemas/index.js';
const router = Router();
router.post('/generate', validate({ body: generateBundleSchema }), AIBundleController.generate);
router.post('/log', validate({ body: logBundleSchema }), AIBundleController.log);
export default router;
//# sourceMappingURL=ai-bundle.js.map