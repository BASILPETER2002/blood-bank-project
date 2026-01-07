// server/src/models/Donation.model.js
import mongoose from 'mongoose';

const { Schema } = mongoose;

const DonationSchema = new Schema(
  {
    donorUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    donorProfile: { type: Schema.Types.ObjectId, ref: 'DonorProfile' },

    hospital: { type: Schema.Types.ObjectId, ref: 'Hospital', required: true },

    date: { type: Date, default: Date.now },
    units: { type: Number, default: 1 },
    bloodBagId: { type: String }, // optional bag id / barcode
    notes: { type: String },
    verifiedBy: { type: Schema.Types.ObjectId, ref: 'User' } // hospital staff who verified
  },
  { timestamps: true }
);

// index by donor and hospital for quick history queries
DonationSchema.index({ donorUser: 1, hospital: 1, date: -1 });

export default mongoose.model('Donation', DonationSchema);
