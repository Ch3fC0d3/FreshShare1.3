// models/Shipment.js
const { Schema, model, Types } = require('mongoose');

const ShipmentSchema = new Schema(
  {
    supplier: { type: String, required: true },
    listingId: { type: Types.ObjectId, ref: 'Listing', required: true },
    hubId: { type: Types.ObjectId, ref: 'Hub', required: true },
    eta: { type: Date },
    receivedAt: { type: Date },
    status: {
      type: String,
      enum: ['in_transit', 'received', 'cancelled'],
      default: 'in_transit',
    },
  },
  { timestamps: true }
);

ShipmentSchema.index({ hubId: 1, eta: 1 });

module.exports = model('Shipment', ShipmentSchema);
