import { Schema, model } from 'mongoose';

const budgetSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    // Monthly spending limit for the category
    limit: { type: Number, required: true, min: 0.01 },
    // Ratio of the limit at which a "close to limit" warning is raised
    alertThreshold: { type: Number, default: 0.9, min: 0.1, max: 1 },
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

budgetSchema.index({ userId: 1, categoryId: 1 }, { unique: true });

export const Budget = model('Budget', budgetSchema);
