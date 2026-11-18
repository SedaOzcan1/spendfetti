import { Schema, model } from 'mongoose';

export const SAVINGS_KINDS = ['savings', 'investment'];

const savingsGoalSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    kind: { type: String, enum: SAVINGS_KINDS, default: 'savings' },
    targetAmount: { type: Number, required: true, min: 1 },
    targetDate: { type: Date },
    achievedAt: { type: Date },
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

savingsGoalSchema.index({ userId: 1, createdAt: 1 });

export const SavingsGoal = model('SavingsGoal', savingsGoalSchema);
