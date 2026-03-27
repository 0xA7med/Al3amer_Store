import { Router } from 'express';
import { MetadataController } from '../controllers/metadata.controller.js';
const router = Router();
const controller = new MetadataController();
router.get('/', (req, res) => controller.listUniqueSpecs(req, res));
router.post('/delete-value', (req, res) => controller.deleteSpecValue(req, res));
export default router;
//# sourceMappingURL=metadata.js.map