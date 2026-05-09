import { Router } from 'express';
import { CategoriesController } from '../controllers/categories.controller.js';
import { validate } from '../lib/validate.js';
import { createCategorySchema, updateCategorySchema } from '../schemas/index.js';

const router: Router = Router();
const controller = new CategoriesController();

router.get('/', controller.list);
router.get('/:id', controller.get);
router.post('/', validate({ body: createCategorySchema }), controller.create);
router.put('/:id', validate({ body: updateCategorySchema }), controller.update);
router.delete('/:id', controller.delete);

export default router;
