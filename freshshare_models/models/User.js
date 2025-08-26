// models/User.js
const { Schema, model, Types } = require('mongoose');
const { AddressSchema, GeoPointSchema } = require('./_shared');

const GroupMembershipSchema = new Schema(
  {
    groupId: { type: Types.ObjectId, ref: 'Group', required: true },
    role: {
      type: String,
      enum: ['admin', 'organizer', 'moderator', 'member'],
      default: 'member',
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'banned'],
      default: 'active',
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: false },
      sms: { type: Boolean, default: false },
    },
  },
  { _id: false }
);

const PreferencesSchema = new Schema(
  {
    dietary: {
      vegetarian: { type: Boolean, default: false },
      vegan: { type: Boolean, default: false },
      glutenFree: { type: Boolean, default: false },
      allergies: [{ type: String }],
    },
    pickupRadiusMiles: { type: Number, default: 5 },
    defaultHub: { type: Types.ObjectId, ref: 'Hub' },
    defaultPickupWindow: { type: Types.ObjectId, ref: 'PickupSlot' },
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: false },
    newsletter: { type: Boolean, default: false },
  },
  { _id: false }
);

const UserSchema = new Schema(
  {
    username: { type: String, index: true },
    firstName: String,
    lastName: String,
    email: { type: String, unique: true, required: true, index: true },
    passwordHash: { type: String, required: true },
    profileImage: String,
    bio: String,
    contact: {
      phoneNumber: String,
      location: {
        address: { type: AddressSchema },
        geo: { type: GeoPointSchema },
      },
    },
    groups: [GroupMembershipSchema],
    systemRoles: [{ type: Types.ObjectId, ref: 'Role' }],
    preferences: { type: PreferencesSchema, default: () => ({}) },
    wallet: {
      credits: { type: Number, default: 0 },
    },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

// 2dsphere index for user location (if set)
UserSchema.index({ 'contact.location.geo': '2dsphere' });

module.exports = model('User', UserSchema);
