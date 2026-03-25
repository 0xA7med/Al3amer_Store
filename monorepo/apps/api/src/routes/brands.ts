import { Router } from 'express';
import type { IRouter } from 'express';
import { BrandsController } from '../controllers/brands.controller.js';

const router: IRouter = Router();

router.get('/', BrandsController.list);

export default router;
