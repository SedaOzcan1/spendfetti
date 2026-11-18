import { Schema, model } from 'mongoose';
import { TRANSACTION_TYPES } from './constants.js';

const transactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: TRANSACTION_TYPES, required: true },
    amount: { type: Number, required: true, min: 0.01, max: 1_000_000_000 },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    date: { type: Date, required: true },
    note: { type: String, trim: true, maxlength: 500 },
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

// Monthly listing (sorted by date) and per-category aggregation
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, categoryId: 1, date: -1 });

export const Transaction = model('Transaction', transactionSchema);
