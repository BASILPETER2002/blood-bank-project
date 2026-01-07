import mongoose from 'mongoose';

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    phone: { type: String, trim: true },

    // role: donor | hospital | lab | admin
    role: { type: String, enum: ['donor', 'hospital', 'lab', 'admin'], default: 'donor' },

    // For hospitals/labs you can add extra meta later (address, registration no, etc.)
    meta: { type: Schema.Types.Mixed }, // flexible field

    passwordHash: { type: String, required: true },

    // socket id for realtime notifications (optional)
    socketId: { type: String, default: null },

    // list of active refresh tokens (rotate & revoke)
    refreshTokens: [{ token: String, createdAt: Date }],

    // availability + geo location for donors
    isAvailable: { type: Boolean, default: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    },

    // donation-specific fields (for donors)
    bloodType: { type: String, enum: ['A+','A-','B+','B-','AB+','AB-','O+','O-'], default: null },
    lastDonationDate: { type: Date, default: null },
    eligibleFrom: { type: Date, default: null }
  },
  { timestamps: true }
);

// Create geo index for donors (if using location)
UserSchema.index({ location: '2dsphere' });

export default mongoose.model('User', UserSchema);
