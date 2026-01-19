import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
const router = Router();
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/social', AuthController.socialLogin);
router.get('/me', AuthController.me);
export default router;
//# sourceMappingURL=auth.js.map