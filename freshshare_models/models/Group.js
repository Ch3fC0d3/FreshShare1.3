// models/Group.js
const { Schema, model, Types } = require('mongoose');
const { AddressSchema, GeoPointSchema } = require('./_shared');

const GroupSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  category: { type: String, enum: ['neighborhood', 'community_garden', 'CSA', 'school', 'other'], default: 'neighborhood' },
  location: {
    address: { type: AddressSchema },
    geo: { type: GeoPointSchema, required: false }
  },
  configuration: {
    rules: { type: Schema.Types.Mixed }, // JSON or markdown string upstream
    deliveryDays: [{ type: String }],
    isPrivate: { type: Boolean, default: false },
    allowGuests: { type: Boolean, default: true },
    capacity: { type: Number, default: 500 },
  },
  createdBy: { type: Types.ObjectId, ref: 'User', required: true },
  members: [{ type: Types.ObjectId, ref: 'User' }],
  admins: [{ type: Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

GroupSchema.index({ 'location.geo': '2dsphere' });
GroupSchema.index({ createdBy: 1 });
GroupSchema.index({ category: 1 });

module.exports = model('Group', GroupSchema);