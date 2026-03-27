import { Router } from 'express';
import { WishlistController } from '../controllers/wishlist.controller.js';
import { verifyToken } from '../lib/auth.js';

const router: Router = Router();

// All routes require authentication except check (optional)
router.get('/', verifyToken, WishlistController.list);
router.post('/', verifyToken, WishlistController.add);
router.delete('/:productId', verifyToken, WishlistController.remove);
router.post('/toggle', verifyToken, WishlistController.toggle);
router.get('/check/:productId', WishlistController.check); // Optional auth

export default router;
