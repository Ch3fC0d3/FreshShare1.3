// models/PickupSlot.js
const { Schema, model, Types } = require('mongoose');

const PickupSlotSchema = new Schema({
  hubId: { type: Types.ObjectId, ref: 'Hub', required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  capacity: { type: Number, default: 50 },
  assignedOrders: [{ type: Types.ObjectId, ref: 'Order' }],
  status: { type: String, enum: ['open', 'full', 'closed'], default: 'open' }
}, { timestamps: true });

PickupSlotSchema.index({ hubId: 1, startTime: 1 });

module.exports = model('PickupSlot', PickupSlotSchema);