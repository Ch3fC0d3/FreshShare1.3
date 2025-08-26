// models/Listing.js
const { Schema, model, Types } = require('mongoose');
const { AddressSchema, GeoPointSchema } = require('./_shared');

const ListingSchema = new Schema(
  {
    seller: { type: Types.ObjectId, ref: 'User', required: true },
    group: { type: Types.ObjectId, ref: 'Group' },
    hub: { type: Types.ObjectId, ref: 'Hub' },

    type: {
      type: String,
      enum: ['BULK_DROP', 'NEIGHBOR_SHARE', 'RECURRING_ESSENTIAL'],
      required: true,
    },

    title: { type: String, required: true },
    description: String,
    images: [{ type: String }],

    category: { type: String, index: true },
    condition: {
      type: String,
      enum: ['fresh', 'frozen', 'preserved', 'other'],
      default: 'fresh',
    },
    tags: [{ type: String }],
    isOrganic: { type: Boolean, default: false },

    // Pricing and sizing
    price: { type: Number, required: true }, // price per share for BULK_DROP, or per unit for NEIGHBOR_SHARE
    priceUnit: {
      type: String,
      enum: ['each', 'lb', 'kg', 'case', 'share'],
      default: 'each',
    },
    quantity: { type: Number, default: 0 }, // remaining (for neighbor shares)
    caseSize: { type: Number }, // e.g., 40 (lb)
    shareSize: { type: Number }, // e.g., 2 (lb)
    minShares: { type: Number }, // threshold for BULK_DROP
    maxShares: { type: Number },
    pledgedShares: { type: Number, default: 0 },

    // Windows
    orderOpenAt: { type: Date },
    orderCloseAt: { type: Date },
    pickupStartAt: { type: Date },
    pickupEndAt: { type: Date },

    // Location (optional—usually hub handles pickup location)
    location: {
      address: { type: AddressSchema },
      geo: { type: GeoPointSchema },
    },

    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ListingSchema.index({ type: 1, orderCloseAt: 1 });
ListingSchema.index({ seller: 1 });
ListingSchema.index({ group: 1 });
ListingSchema.index({ hub: 1 });
ListingSchema.index({ 'location.geo': '2dsphere' });

module.exports = model('Listing', ListingSchema);
