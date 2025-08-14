// models/Order.js
const { Schema, model, Types } = require('mongoose');

const OrderSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', required: true },
  listingId: { type: Types.ObjectId, ref: 'Listing', required: true },
  groupId: { type: Types.ObjectId, ref: 'Group' },
  hubId: { type: Types.ObjectId, ref: 'Hub' },
  pickupSlotId: { type: Types.ObjectId, ref: 'PickupSlot' },

  status: {
    type: String,
    enum: ['PLEDGED','CONFIRMED','LOCKED','RECEIVED','SPLIT_READY','PICKED_UP','CLOSED','CANCELLED','FAILED'],
    default: 'PLEDGED'
  },

  // For BULK_DROP: shares pledged. For NEIGHBOR_SHARE: quantity purchased
  shares: { type: Number, default: 0 },

  // Money
  itemSubtotal: { type: Number, default: 0 },
  shippingSplit: { type: Number, default: 0 },
  hubFee: { type: Number, default: 0 },
  platformFee: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, default: 0 },

  paymentIntentId: { type: Types.ObjectId, ref: 'PaymentIntent' },

  qrCode: { type: String }, // can store token/UUID

}, { timestamps: true });

OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ listingId: 1 });
OrderSchema.index({ status: 1 });

module.exports = model('Order', OrderSchema);