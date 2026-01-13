import { Router } from 'express';
import { AddressesController } from '../controllers/addresses.controller.js';
import { verifyToken } from '../lib/auth.js';

const router = Router();

// All routes require authentication
router.use(verifyToken);

router.get('/', AddressesController.list);
router.post('/', AddressesController.create);
router.put('/:id', AddressesController.update);
router.delete('/:id', AddressesController.delete);
router.patch('/:id/default', AddressesController.setDefault);

export default router;
