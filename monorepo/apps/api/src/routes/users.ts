import { Router } from 'express';
import { UsersController } from '../controllers/users.controller.js';
import { verifyToken } from '../lib/auth.js';
import { validate } from '../lib/validate.js';
import {
    createUserSchema, updateProfileSchema, updateUserStatusSchema,
    updateCustomerSchema, listUsersQuery,
} from '../schemas/index.js';

const router: Router = Router();

router.post('/', validate({ body: createUserSchema }), UsersController.create);
router.get('/', validate({ query: listUsersQuery }), UsersController.list);
router.get('/:id', UsersController.getOne);
router.put('/profile', verifyToken, validate({ body: updateProfileSchema }), UsersController.updateProfile);
router.patch('/:id/status', validate({ body: updateUserStatusSchema }), UsersController.updateStatus);
router.put('/:id', validate({ body: updateCustomerSchema }), UsersController.updateCustomer);
router.delete('/:id', UsersController.deleteCustomer);

export default router;
