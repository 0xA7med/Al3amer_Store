import { Router } from 'express';
import { InventorySyncController, upload } from '../controllers/inventory-sync.controller.js';
const router = Router();
// POST /api/products/import/preview - Upload Excel and get diff preview
router.post('/preview', upload.single('file'), InventorySyncController.preview);
// POST /api/products/import/execute - Execute approved changes
router.post('/execute', InventorySyncController.execute);
export default router;
//# sourceMappingURL=inventory-sync.js.map