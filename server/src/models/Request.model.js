// Request.model.js
import mongoose from "mongoose";

const requestSchema = new mongoose.Schema(
  {
    hospital: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    bloodType: {
      type: String,
      required: true,
    },
    units: {
      type: Number,
      default: 1,
    },
    isCritical: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      // ✅ CHANGE: Added "completed" to match admin.controller.js logic
      enum: ["open", "completed", "fulfilled", "cancelled"],
      default: "open",
    },
    acceptedDonors: [
      {
        donor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
      },
    ],
    requiredDonors: {
      type: Number,
      default: 1,
    },
    isLocked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true } // Added timestamps for better sorting in history
);

export default mongoose.model("Request", requestSchema);