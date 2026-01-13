import { Router } from 'express';
import { UsersController } from '../controllers/users.controller.js';
import { verifyToken } from '../lib/auth.js';

const router = Router();

router.post('/', UsersController.create);
router.get('/', UsersController.list);
router.get('/:id', UsersController.getOne);
router.put('/profile', verifyToken, UsersController.updateProfile);
router.patch('/:id/status', UsersController.updateStatus);

export default router;
