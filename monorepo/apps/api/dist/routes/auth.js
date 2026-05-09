import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { verifyToken } from '../lib/auth.js';
import { validate } from '../lib/validate.js';
import { registerSchema, loginSchema, socialLoginSchema } from '../schemas/index.js';
const router = Router();
router.post('/register', validate({ body: registerSchema }), AuthController.register);
router.post('/login', validate({ body: loginSchema }), AuthController.login);
router.post('/social', validate({ body: socialLoginSchema }), AuthController.socialLogin);
router.get('/me', verifyToken, AuthController.me);
export default router;
//# sourceMappingURL=auth.js.map