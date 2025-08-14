// models/Adjustment.js
const { Schema, model, Types } = require('mongoose');

const AdjustmentSchema = new Schema({
  orderId: { type: Types.ObjectId, ref: 'Order', required: true },
  userId: { type: Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, enum: ['weight_diff','damage','missed_pickup','other'], required: true },
  type: { type: String, enum: ['refund','credit'], required: true },
  amount: { type: Number, required: true },
  issuedAt: { type: Date, default: Date.now }
}, { timestamps: true });

AdjustmentSchema.index({ orderId: 1, issuedAt: -1 });

module.exports = model('Adjustment', AdjustmentSchema);