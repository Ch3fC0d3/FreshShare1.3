// models/Role.js
const { Schema, model } = require('mongoose');

const RoleSchema = new Schema(
  {
    name: {
      type: String,
      enum: ['user', 'moderator', 'organizer', 'admin'],
      required: true,
      unique: true,
    },
  },
  { timestamps: true }
);

module.exports = model('Role', RoleSchema);
