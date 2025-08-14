// models/SplitTask.js
const { Schema, model, Types } = require('mongoose');

const SplitTaskSchema = new Schema({
  listingId: { type: Types.ObjectId, ref: 'Listing', required: true },
  lineItemShareId: { type: Types.ObjectId, ref: 'LineItemShare', required: true },
  taskType: { type: String, enum: ['weigh','bag','label'], required: true },
  completedBy: { type: Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending','done'], default: 'pending' },
  notes: { type: String }
}, { timestamps: true });

SplitTaskSchema.index({ listingId: 1, taskType: 1 });

module.exports = model('SplitTask', SplitTaskSchema);