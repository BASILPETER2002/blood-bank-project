// server/src/models/BloodRequest.model.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const BloodRequestSchema = new Schema(
  {
    hospital: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true },

    bloodType: { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'], required: true },
    unitsRequired: { type: Number, required: true, min: 1 },
    unitsFulfilled: { type: Number, default: 0 },

    // open | matched | partially_fulfilled | fulfilled | cancelled
    status: { type: String, default: 'open' },

    critical: { type: Boolean, default: false }, // triggers SOS flow

    // optional message from hospital
    message: { type: String },

    // location (hospital location; used for geo queries when hospital location isn't inferred)
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },

    // matched donors / reservations
    matches: [
      {
        donorUser: { type: Schema.Types.ObjectId, ref: 'User' }, // donor who accepted
        unitsReserved: Number,
        status: { type: String, enum: ['reserved', 'collected', 'cancelled'], default: 'reserved' },
        createdAt: { type: Date, default: Date.now }
      }
    ],

    expiresAt: { type: Date }, // optional: expiry for the request
    meta: { type: Schema.Types.Mixed } // flexible field
  },
  { timestamps: true }
);

// geo index for location-based search
BloodRequestSchema.index({ location: '2dsphere' });

// index critical requests for quick searching
BloodRequestSchema.index({ critical: 1, status: 1, createdAt: -1 });

export default mongoose.model('BloodRequest', BloodRequestSchema);
