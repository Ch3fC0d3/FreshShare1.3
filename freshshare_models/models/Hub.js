// models/Hub.js
const { Schema, model, Types } = require('mongoose');
const { AddressSchema, GeoPointSchema } = require('./_shared');

const HoursSchema = new Schema(
  {
    day: {
      type: String,
      enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      required: true,
    },
    open: { type: String }, // "09:00"
    close: { type: String }, // "17:00"
  },
  { _id: false }
);

const HubSchema = new Schema(
  {
    name: { type: String, required: true },
    address: { type: AddressSchema },
    geo: { type: GeoPointSchema, required: true },
    capacity: { type: Number, default: 200 },
    hours: [HoursSchema],
    associatedGroups: [{ type: Types.ObjectId, ref: 'Group' }],
    activePickupSlots: [{ type: Types.ObjectId, ref: 'PickupSlot' }],
  },
  { timestamps: true }
);

HubSchema.index({ geo: '2dsphere' });

module.exports = model('Hub', HubSchema);
