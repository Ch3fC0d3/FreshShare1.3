// models/RSVP.js
const { Schema, model, Types } = require('mongoose');

const RSVPSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true },
    eventId: { type: Types.ObjectId, ref: 'CalendarEvent', required: true },
    status: { type: String, enum: ['yes', 'no', 'maybe'], default: 'yes' },
    notes: { type: String },
  },
  { timestamps: true }
);

RSVPSchema.index({ eventId: 1, userId: 1 }, { unique: true });

module.exports = model('RSVP', RSVPSchema);
