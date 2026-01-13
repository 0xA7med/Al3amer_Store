import { Router } from 'express';
import { CategoriesController } from '../controllers/categories.controller.js';

const router = Router();
const controller = new CategoriesController();

router.get('/', controller.list);
router.get('/:id', controller.get);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

export default router;
