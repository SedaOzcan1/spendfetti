import { Schema, model } from 'mongoose';
import { TRANSACTION_TYPES } from './constants.js';

const categorySchema = new Schema(
  {
    // null → built-in default category shared by every user
    userId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true, trim: true, maxlength: 40 },
    type: { type: String, enum: TRANSACTION_TYPES, required: true },
    // Stable identifier for built-in categories (e.g. `fun-activities`)
    slug: { type: String, trim: true },
    icon: { type: String, maxlength: 8 },
    color: { type: String, match: /^#[0-9a-fA-F]{6}$/ },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  },
);

categorySchema.virtual('isDefault').get(function isDefault() {
  return this.userId == null;
});

categorySchema.index(
  { userId: 1, type: 1, name: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } },
);
categorySchema.index(
  { slug: 1 },
  { unique: true, partialFilterExpression: { slug: { $type: 'string' } } },
);

export const Category = model('Category', categorySchema);
