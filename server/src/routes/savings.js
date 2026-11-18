import { Router } from 'express';
import {
  closeMonth,
  createEntry,
  createEntrySchema,
  createGoal,
  createGoalSchema,
  deleteGoal,
  getOverview,
  listEntries,
  listEntriesQuerySchema,
  monthCloseSchema,
  overviewQuerySchema,
  removeEntry,
  updateGoal,
  updateGoalSchema,
} from '../controllers/savingsController.js';
import { idParamsSchema } from '../lib/schemas.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';

const router = Router();
const withId = validate(idParamsSchema, 'params');

router.use(requireAuth);
router.get('/', validate(overviewQuerySchema, 'query'), getOverview);
router.post('/goals', validate(createGoalSchema), createGoal);
router.patch('/goals/:id', withId, validate(updateGoalSchema), updateGoal);
router.delete('/goals/:id', withId, deleteGoal);
router.get('/entries', validate(listEntriesQuerySchema, 'query'), listEntries);
router.post('/entries', validate(createEntrySchema), createEntry);
router.delete('/entries/:id', withId, removeEntry);
router.post('/month-close', validate(monthCloseSchema), closeMonth);

export default router;
