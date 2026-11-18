import { Router } from 'express';
import { markAchievementsSeen, markSeenSchema } from '../controllers/achievementController.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.post('/seen', requireAuth, validate(markSeenSchema), markAchievementsSeen);

export default router;
