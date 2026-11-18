import { Schema, model } from 'mongoose';

export const NOTIFICATION_TYPES = [
  'welcome',
  'budget_warning',
  'budget_exceeded',
  'fun_budget_low',
  'month_close_reminder',
  'savings_goal_reached',
];

const RETENTION_SECONDS = 90 * 24 * 60 * 60;

const notificationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    title: { type: String, required: true, maxlength: 140 },
    body: { type: String, maxlength: 280 },
    // In-app path to open, e.g. /budgets
    link: { type: String, maxlength: 200 },
    // Prevents duplicates, e.g. budget_warning:<categoryId>:2026-11
    dedupeKey: { type: String, required: true },
    readAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        ret.read = ret.readAt !== null;
        delete ret._id;
        delete ret.__v;
        delete ret.userId;
        delete ret.dedupeKey;
        return ret;
      },
    },
  },
);

notificationSchema.index({ userId: 1, dedupeKey: 1 }, { unique: true });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, readAt: 1 });
// Old notifications are cleaned up automatically
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: RETENTION_SECONDS });

export const Notification = model('Notification', notificationSchema);
