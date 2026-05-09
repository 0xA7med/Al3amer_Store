import { Router } from 'express';
import { AddressesController } from '../controllers/addresses.controller.js';
import { verifyToken } from '../lib/auth.js';
import { validate } from '../lib/validate.js';
import { createAddressSchema, updateAddressSchema } from '../schemas/index.js';

const router: Router = Router();

// All routes require authentication
router.use(verifyToken);

router.get('/', AddressesController.list);
router.post('/', validate({ body: createAddressSchema }), AddressesController.create);
router.put('/:id', validate({ body: updateAddressSchema }), AddressesController.update);
router.delete('/:id', AddressesController.delete);
router.patch('/:id/default', AddressesController.setDefault);

export default router;
