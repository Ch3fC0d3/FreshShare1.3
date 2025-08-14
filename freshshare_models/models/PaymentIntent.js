// models/PaymentIntent.js
const { Schema, model, Types } = require('mongoose');

const PaymentIntentSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', required: true },
  orderId: { type: Types.ObjectId, ref: 'Order' },
  method: { type: String, enum: ['card','wallet','other'], default: 'card' },
  status: { type: String, enum: ['authorized','captured','voided','refunded','failed'], default: 'authorized' },
  amount: { type: Number, required: true },
  provider: { type: String, enum: ['stripe','paypal','adyen','other'], default: 'stripe' },
  providerRef: { type: String }, // e.g., Stripe PaymentIntent id
  createdAtProvider: { type: Date },
  capturedAt: { type: Date }
}, { timestamps: true });

PaymentIntentSchema.index({ userId: 1, status: 1 });

module.exports = model('PaymentIntent', PaymentIntentSchema);