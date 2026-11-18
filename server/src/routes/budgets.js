import { Router } from 'express';
import {
  categoryParamsSchema,
  deleteBudget,
  listBudgets,
  listBudgetsQuerySchema,
  upsertBudget,
  upsertBudgetSchema,
} from '../controllers/budgetController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);
router.get('/', validate(listBudgetsQuerySchema, 'query'), listBudgets);
router.put(
  '/:categoryId',
  validate(categoryParamsSchema, 'params'),
  validate(upsertBudgetSchema),
  upsertBudget,
);
router.delete('/:categoryId', validate(categoryParamsSchema, 'params'), deleteBudget);

export default router;
