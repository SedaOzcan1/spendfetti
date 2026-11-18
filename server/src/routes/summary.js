import { Router } from 'express';
import { getSummary, summaryQuerySchema } from '../controllers/summaryController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.get('/', requireAuth, validate(summaryQuerySchema, 'query'), getSummary);

export default router;
