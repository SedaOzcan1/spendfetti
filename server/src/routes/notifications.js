import { Router } from 'express';
import {
  deleteNotification,
  getUnreadCount,
  listNotifications,
  listNotificationsQuerySchema,
  markAllRead,
  markRead,
  markUnread,
} from '../controllers/notificationController.js';
import { idParamsSchema } from '../lib/schemas.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

router.use(requireAuth);
router.get('/', validate(listNotificationsQuerySchema, 'query'), listNotifications);
router.get('/unread-count', getUnreadCount);
router.post('/read-all', markAllRead);
router.patch('/:id/read', validate(idParamsSchema, 'params'), markRead);
router.patch('/:id/unread', validate(idParamsSchema, 'params'), markUnread);
router.delete('/:id', validate(idParamsSchema, 'params'), deleteNotification);

export default router;
