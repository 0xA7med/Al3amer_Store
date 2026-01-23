import { Router } from 'express';
import { ProductsController } from '../controllers/products.controller.js';
import inventorySyncRouter from './inventory-sync.js';
const router = Router();
// Mount import routes first (more specific path)
router.use('/import', inventorySyncRouter);
router.post('/ai-generate', ProductsController.aiGenerate);
router.get('/search-suggestions', ProductsController.searchSuggestions);
router.get('/', ProductsController.list);
router.get('/:id', ProductsController.getOne);
router.post('/', ProductsController.create);
router.put('/:id', ProductsController.update);
router.patch('/bulk', ProductsController.bulkUpdate);
router.delete('/:id', ProductsController.delete);
export default router;
//# sourceMappingURL=products.js.map