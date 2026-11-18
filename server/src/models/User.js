import { Schema, model } from 'mongoose';
import { MONTH_REGEX } from './constants.js';

const seenAchievementSchema = new Schema(
  {
    key: { type: String, required: true },
    month: { type: String, required: true, match: MONTH_REGEX },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    city: { type: String, trim: true, maxlength: 80 },
    currency: { type: String, default: 'TRY', uppercase: true, minlength: 3, maxlength: 3 },
    funBudgetPromptEnabled: { type: Boolean, default: true },
    funBudgetRatio: { type: Number, default: 0.2, min: 0, max: 1 },
    confettiEnabled: { type: Boolean, default: true },
    lastLoginAt: { type: Date },
    seenAchievements: { type: [seenAchievementSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        delete ret.seenAchievements;
        return ret;
      },
    },
  },
);

export const User = model('User', userSchema);
