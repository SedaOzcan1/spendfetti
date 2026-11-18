import { Router } from 'express';
import {
  getMeta,
  listEvents,
  searchEventsQuerySchema,
  trackClick,
} from '../controllers/eventController.js';
import { idParamsSchema } from '../lib/schemas.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);
router.get('/', validate(searchEventsQuerySchema, 'query'), listEvents);
router.get('/meta', getMeta);
router.post('/:id/click', validate(idParamsSchema, 'params'), trackClick);

export default router;
