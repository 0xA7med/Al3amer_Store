import { Router } from 'express';
import { InventorySyncController, upload } from '../controllers/inventory-sync.controller.js';
import { validate } from '../lib/validate.js';
import { executeSyncSchema } from '../schemas/index.js';

const router: Router = Router();

// POST /api/products/import/preview - Upload Excel and get diff preview
router.post('/preview', upload.single('file'), InventorySyncController.preview);

// POST /api/products/import/execute - Execute approved changes
router.post('/execute', validate({ body: executeSyncSchema }), InventorySyncController.execute);

export default router;
