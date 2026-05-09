import { Router } from 'express';
import { MetadataController } from '../controllers/metadata.controller.js';
import { validate } from '../lib/validate.js';
import { deleteSpecValueSchema } from '../schemas/index.js';

const router: Router = Router();
const controller = new MetadataController();

router.get('/', (req, res) => controller.listUniqueSpecs(req, res));
router.post('/delete-value', validate({ body: deleteSpecValueSchema }), (req, res) => controller.deleteSpecValue(req, res));

export default router;
