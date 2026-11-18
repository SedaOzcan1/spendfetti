import { Schema, model } from 'mongoose';
import { MONTH_REGEX } from './constants.js';

export const FUN_BUDGET_STATUSES = ['allocated', 'dismissed'];

const funBudgetSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // The month that was closed with a surplus (YYYY-MM)
    month: { type: String, required: true, match: MONTH_REGEX },
    amount: { type: Number, min: 0, default: 0 },
    status: { type: String, enum: FUN_BUDGET_STATUSES, required: true },
    allocatedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

funBudgetSchema.index({ userId: 1, month: 1 }, { unique: true });

export const FunBudget = model('FunBudget', funBudgetSchema);
