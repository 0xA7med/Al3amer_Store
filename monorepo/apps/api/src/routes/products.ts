import { Router, type IRouter } from 'express';
import { ProductsController } from '../controllers/products.controller.js';
import inventorySyncRouter from './inventory-sync.js';
import { validate } from '../lib/validate.js';
import {
    createProductSchema, updateProductSchema, bulkUpdateSchema, bulkActionSchema,
    validateCartSchema, aiGenerateSchema, listProductsQuery, updateShortNameSchema,
} from '../schemas/index.js';

const router: IRouter = Router();

// Mount import routes first (more specific path)
router.use('/import', inventorySyncRouter);

router.post('/ai-generate', validate({ body: aiGenerateSchema }), ProductsController.aiGenerate);
router.post('/validate-cart', validate({ body: validateCartSchema }), ProductsController.validateCart);
router.get('/popular-searches', ProductsController.popularSearches);
router.get('/search-suggestions', ProductsController.searchSuggestions);
router.get('/', validate({ query: listProductsQuery }), ProductsController.list);
router.get('/:id', ProductsController.getOne);
router.post('/', validate({ body: createProductSchema }), ProductsController.create);
router.put('/:id', validate({ body: updateProductSchema }), ProductsController.update);
router.patch('/bulk', validate({ body: bulkUpdateSchema }), ProductsController.bulkUpdate);
router.post('/bulk-action', validate({ body: bulkActionSchema }), ProductsController.bulkAction);
router.patch('/:id/short-name', validate({ body: updateShortNameSchema }), ProductsController.updateShortName);
router.delete('/:id', ProductsController.delete);

export default router;
