import { Schema, model } from 'mongoose';

export const EVENT_TYPES = [
  'concert',
  'theatre',
  'standup',
  'cinema',
  'festival',
  'sports',
  'workshop',
  'exhibition',
  'outdoor',
];

const eventSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    type: { type: String, enum: EVENT_TYPES, required: true },
    city: { type: String, required: true, trim: true },
    venue: { type: String, required: true, trim: true },
    startsAt: { type: Date, required: true },
    endsAt: { type: Date },
    // null → price unknown
    minPrice: { type: Number, min: 0, default: null },
    maxPrice: { type: Number, min: 0, default: null },
    currency: { type: String, default: 'TRY' },
    imageUrl: { type: String },
    url: { type: String, required: true },
    source: { type: String, required: true },
    externalId: { type: String, required: true },
    clicks: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.clicks;
        return ret;
      },
    },
  },
);

eventSchema.index({ city: 1, type: 1, startsAt: 1 }, { collation: { locale: 'en', strength: 2 } });
eventSchema.index({ minPrice: 1 });
eventSchema.index({ source: 1, externalId: 1 }, { unique: true });

export const Event = model('Event', eventSchema);
