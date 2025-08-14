// models/CalendarEvent.js
const { Schema, model, Types } = require('mongoose');
const { GeoPointSchema, AddressSchema } = require('./_shared');

const CalendarEventSchema = new Schema({
  title: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['delivery','pickup','group_event','reminder','volunteer'], required: true },
  groupId: { type: Types.ObjectId, ref: 'Group' },
  relatedOrderId: { type: Types.ObjectId, ref: 'Order' },
  location: {
    name: String,
    address: { type: AddressSchema },
    geo: { type: GeoPointSchema }
  },
  startDateTime: { type: Date, required: true },
  endDateTime: { type: Date, required: true },
  repeat: { type: String, enum: ['none','weekly','monthly'], default: 'none' },
  visibility: { type: String, enum: ['group','public','private'], default: 'group' },
  createdBy: { type: Types.ObjectId, ref: 'User', required: true },
  attendees: [{ type: Types.ObjectId, ref: 'User' }],
  reminders: [{
    type: { type: String, enum: ['email','push','sms'], default: 'email' },
    minutesBefore: { type: Number, default: 60 }
  }]
}, { timestamps: true });

CalendarEventSchema.index({ groupId: 1, startDateTime: 1 });
CalendarEventSchema.index({ 'location.geo': '2dsphere' });

module.exports = model('CalendarEvent', CalendarEventSchema);