// models/ActivityLog.js
const { Schema, model, Types } = require('mongoose');

const ActivityLogSchema = new Schema(
  {
    actor: { type: Types.ObjectId, ref: 'User', required: true },
    action: { type: String, required: true },
    subjectType: {
      type: String,
      enum: [
        'listing',
        'group',
        'order',
        'user',
        'shipment',
        'slot',
        'event',
        'other',
      ],
      required: true,
    },
    subjectId: { type: Types.ObjectId, required: true },
    details: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ActivityLogSchema.index({ actor: 1, createdAt: -1 });

module.exports = model('ActivityLog', ActivityLogSchema);
