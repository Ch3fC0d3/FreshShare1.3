// models/Notification.js
const { Schema, model, Types } = require('mongoose');

const NotificationSchema = new Schema({
  userId: { type: Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['email','push','sms','inapp'], default: 'inapp' },
  template: { type: String }, // e.g., 'deadline_soon', 'pickup_reminder'
  payload: { type: Schema.Types.Mixed },
  isSent: { type: Boolean, default: false },
  sendAt: { type: Date }
}, { timestamps: true });

NotificationSchema.index({ userId: 1, sendAt: 1 });

module.exports = model('Notification', NotificationSchema);