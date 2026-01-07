// server/src/models/DonorProfile.model.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const DonorProfileSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true }, // link to User
    bloodType: { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'], required: true },

    // GeoJSON location (optional — donors may choose not to share)
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },

    isAvailable: { type: Boolean, default: true },
    preferences: {
      sms: { type: Boolean, default: true },
      email: { type: Boolean, default: true },
      inApp: { type: Boolean, default: true },
    },

    // donation history (array of Donation refs)
    donations: [{ type: Schema.Types.ObjectId, ref: 'Donation' }],

    lastDonationDate: { type: Date, default: null },
    eligibleFrom: { type: Date, default: null }, // lastDonationDate + 90 days (or config)
    reliabilityScore: { type: Number, default: 100 }, // optional: used to sort matches

    // optional: quick contact fallback if different from User.phone
    emergencyContact: {
      name: String,
      phone: String,
    },
  },
  { timestamps: true }
);

// geospatial index for location queries
DonorProfileSchema.index({ location: '2dsphere' });

export default mongoose.model('DonorProfile', DonorProfileSchema);
