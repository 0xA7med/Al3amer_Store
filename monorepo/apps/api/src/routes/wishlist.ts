import { Router } from 'express';
import { WishlistController } from '../controllers/wishlist.controller.js';
import { verifyToken } from '../lib/auth.js';
import { validate } from '../lib/validate.js';
import { addWishlistSchema } from '../schemas/index.js';

const router: Router = Router();

// All routes require authentication except check (optional)
router.get('/', verifyToken, WishlistController.list);
router.post('/', verifyToken, validate({ body: addWishlistSchema }), WishlistController.add);
router.delete('/:productId', verifyToken, WishlistController.remove);
router.post('/toggle', verifyToken, validate({ body: addWishlistSchema }), WishlistController.toggle);
router.get('/check/:productId', WishlistController.check); // Optional auth

export default router;
