import { Router } from 'express';
import {
  decideFunBudget,
  decideFunBudgetSchema,
  getFunBudget,
  getPrompt,
  monthQuerySchema,
} from '../controllers/funBudgetController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);
router.get('/prompt', validate(monthQuerySchema, 'query'), getPrompt);
router.get('/', validate(monthQuerySchema, 'query'), getFunBudget);
router.post('/', validate(decideFunBudgetSchema), decideFunBudget);

export default router;
