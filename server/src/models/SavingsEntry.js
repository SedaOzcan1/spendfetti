import { Schema, model } from 'mongoose';
import { MONTH_REGEX } from './constants.js';

export const SAVINGS_ENTRY_TYPES = ['deposit', 'withdrawal'];
export const SAVINGS_ENTRY_SOURCES = ['manual', 'month_close'];

/** Money moved into (or out of) a savings goal. Not an expense. */
const savingsEntrySchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    goalId: { type: Schema.Types.ObjectId, ref: 'SavingsGoal', required: true },
    type: { type: String, enum: SAVINGS_ENTRY_TYPES, required: true },
    amount: { type: Number, required: true, min: 0.01 },
    date: { type: Date, required: true },
    note: { type: String, trim: true, maxlength: 200 },
    source: { type: String, enum: SAVINGS_ENTRY_SOURCES, default: 'manual' },
    // For month_close entries: the month whose surplus was saved
    month: { type: String, match: MONTH_REGEX },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.userId;
        return ret;
      },
    },
  },
);

savingsEntrySchema.index({ userId: 1, goalId: 1, date: -1 });
savingsEntrySchema.index({ userId: 1, source: 1, month: 1 });

export const SavingsEntry = model('SavingsEntry', savingsEntrySchema);
