import { Router } from 'express';
import { ReviewsController } from '../controllers/reviews.controller.js';
const router = Router();
router.get('/', ReviewsController.list);
router.get('/:id', ReviewsController.getOne);
router.post('/', ReviewsController.create);
router.patch('/:id/approve', ReviewsController.approve);
router.delete('/:id', ReviewsController.delete);
export default router;
//# sourceMappingURL=reviews.js.map