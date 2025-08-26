// models/_shared.js
const { Schema } = require('mongoose');

// GeoJSON Point schema [lng, lat]
const GeoPointSchema = new Schema(
  {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: {
      type: [Number],
      required: true,
      // index added on parent schema where used
      validate: {
        validator: function (v) {
          return (
            Array.isArray(v) &&
            v.length === 2 &&
            v.every((n) => typeof n === 'number')
          );
        },
        message: 'coordinates must be [lng, lat]',
      },
    },
  },
  { _id: false }
);

const AddressSchema = new Schema(
  {
    name: { type: String }, // optional label, e.g., "Home", "Hub A"
    address1: { type: String },
    address2: { type: String },
    city: { type: String },
    state: { type: String },
    zipCode: { type: String },
    country: { type: String, default: 'USA' },
  },
  { _id: false }
);

module.exports = {
  GeoPointSchema,
  AddressSchema,
};
