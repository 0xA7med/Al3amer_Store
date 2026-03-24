import { Router, type IRouter } from 'express';
import { ProductsController } from '../controllers/products.controller.js';
import inventorySyncRouter from './inventory-sync.js';

const router: IRouter = Router();

// Mount import routes first (more specific path)
router.use('/import', inventorySyncRouter);

router.post('/ai-generate', ProductsController.aiGenerate);
router.post('/validate-cart', ProductsController.validateCart);
router.get('/search-suggestions', ProductsController.searchSuggestions);
router.get('/', ProductsController.list);
router.get('/:id', ProductsController.getOne);
router.post('/', ProductsController.create);
router.put('/:id', ProductsController.update);
router.patch('/bulk', ProductsController.bulkUpdate);
router.post('/bulk-action', ProductsController.bulkAction);
router.delete('/:id', ProductsController.delete);

export default router;
