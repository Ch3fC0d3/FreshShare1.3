// models/LineItemShare.js
const { Schema, model, Types } = require('mongoose');

const LineItemShareSchema = new Schema(
  {
    orderId: { type: Types.ObjectId, ref: 'Order', required: true },
    listingId: { type: Types.ObjectId, ref: 'Listing', required: true },
    userId: { type: Types.ObjectId, ref: 'User', required: true },
    pledgedShares: { type: Number, required: true },
    actualWeight: { type: Number }, // for variance calculation (optional)
    adjustedAmount: { type: Number, default: 0 }, // refunds/credits
    notes: { type: String },
  },
  { timestamps: true }
);

LineItemShareSchema.index({ orderId: 1, userId: 1 });

module.exports = model('LineItemShare', LineItemShareSchema);
