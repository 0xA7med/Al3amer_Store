import { Router } from 'express';
import { BrandsController } from '../controllers/brands.controller.js';
const router = Router();
router.get('/', BrandsController.list);
export default router;
//# sourceMappingURL=brands.js.map