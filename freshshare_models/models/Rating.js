// models/Rating.js
const { Schema, model, Types } = require('mongoose');

const RatingSchema = new Schema(
  {
    rater: { type: Types.ObjectId, ref: 'User', required: true },
    targetUser: { type: Types.ObjectId, ref: 'User' },
    targetListing: { type: Types.ObjectId, ref: 'Listing' },
    type: { type: String, enum: ['product', 'organizer'], required: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    comment: { type: String },
  },
  { timestamps: true }
);

RatingSchema.index({ targetUser: 1 });
RatingSchema.index({ targetListing: 1 });

module.exports = model('Rating', RatingSchema);
