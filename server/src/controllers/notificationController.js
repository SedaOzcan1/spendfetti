import { z } from 'zod';
import { HttpError } from '../lib/httpError.js';
import { Notification } from '../models/index.js';
import { syncReminders } from '../services/notificationService.js';

export const listNotificationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  // Cursor: createdAt of the last item from the previous page
  before: z.coerce.date().optional(),
  unread: z.enum(['true', 'false']).optional(),
});

const unreadCount = (userId) => Notification.countDocuments({ userId, readAt: null });

export async function listNotifications(req, res) {
  const { limit, before, unread } = req.validated.query;
  await syncReminders(req.user);

  const items = await Notification.find({
    userId: req.user._id,
    ...(before && { createdAt: { $lt: before } }),
    ...(unread === 'true' && { readAt: null }),
  })
    .sort({ createdAt: -1, _id: -1 })
    .limit(limit + 1);

  const hasMore = items.length > limit;
  const page = items.slice(0, limit);
  res.json({
    items: page,
    unreadCount: await unreadCount(req.user._id),
    nextCursor: hasMore ? page.at(-1).createdAt.toISOString() : null,
  });
}

export async function getUnreadCount(req, res) {
  await syncReminders(req.user);
  res.json({ unreadCount: await unreadCount(req.user._id) });
}

async function setRead(req, res, read) {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.validated.params.id, userId: req.user._id },
    { $set: { readAt: read ? new Date() : null } },
    { returnDocument: 'after' },
  );
  if (!notification) throw HttpError.notFound('Notification not found');
  res.json({ notification, unreadCount: await unreadCount(req.user._id) });
}

export const markRead = (req, res) => setRead(req, res, true);
export const markUnread = (req, res) => setRead(req, res, false);

export async function markAllRead(req, res) {
  await Notification.updateMany(
    { userId: req.user._id, readAt: null },
    { $set: { readAt: new Date() } },
  );
  res.json({ unreadCount: 0 });
}

export async function deleteNotification(req, res) {
  const { deletedCount } = await Notification.deleteOne({
    _id: req.validated.params.id,
    userId: req.user._id,
  });
  if (!deletedCount) throw HttpError.notFound('Notification not found');
  res.status(204).end();
}
