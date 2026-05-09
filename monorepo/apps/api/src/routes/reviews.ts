import { Router } from 'express';
import { ReviewsController } from '../controllers/reviews.controller.js';
import { validate } from '../lib/validate.js';
import { createReviewSchema, approveReviewSchema, listReviewsQuery } from '../schemas/index.js';

const router: Router = Router();

router.get('/', validate({ query: listReviewsQuery }), ReviewsController.list);
router.get('/:id', ReviewsController.getOne);
router.post('/', validate({ body: createReviewSchema }), ReviewsController.create);
router.patch('/:id/approve', validate({ body: approveReviewSchema }), ReviewsController.approve);
router.delete('/:id', ReviewsController.delete);

export default router;
