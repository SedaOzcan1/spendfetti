import { Router } from 'express';
import {
  createCategory,
  createCategorySchema,
  listCategories,
  listCategoriesQuerySchema,
} from '../controllers/categoryController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);
router.get('/', validate(listCategoriesQuerySchema, 'query'), listCategories);
router.post('/', validate(createCategorySchema), createCategory);

export default router;
