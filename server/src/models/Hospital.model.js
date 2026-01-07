// server/src/models/Hospital.model.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const HospitalSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true }, // auth user record
    name: { type: String, required: true, trim: true },
    registrationNumber: { type: String, trim: true },
    address: { type: String },
    contactPhone: { type: String },
    contactEmail: { type: String },

    // GeoJSON location of hospital
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },

    departments: [{ type: String }], // optional
    isVerified: { type: Boolean, default: false } // verification flag for trust
  },
  { timestamps: true }
);

HospitalSchema.index({ location: '2dsphere' });

export default mongoose.model('Hospital', HospitalSchema);
