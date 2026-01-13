import { Router } from 'express';
import { ProductsController } from '../controllers/products.controller.js';

const router = Router();

router.post('/ai-generate', ProductsController.aiGenerate);
router.get('/search-suggestions', ProductsController.searchSuggestions);
router.get('/', ProductsController.list);
router.get('/:id', ProductsController.getOne);
router.post('/', ProductsController.create);
router.put('/:id', ProductsController.update);
router.patch('/bulk', ProductsController.bulkUpdate);
router.delete('/:id', ProductsController.delete);

export default router;
