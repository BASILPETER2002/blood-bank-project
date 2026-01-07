// server/src/api/controllers/hospital.controller.js

import { validationResult } from "express-validator";
import Hospital from "../../models/Hospital.model.js";
import User from "../../models/User.model.js";

/* ======================================================
   CREATE OR UPDATE HOSPITAL PROFILE
   ====================================================== */
export const upsertHospitalProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name,
      registrationNumber,
      address,
      contactPhone,
      contactEmail,
      coordinates,
      departments,
    } = req.body;

    const userId = req.user.id; // ✅ ALWAYS use req.user.id

    let hospital = await Hospital.findOne({ user: userId });

    const location =
      coordinates &&
      Array.isArray(coordinates) &&
      coordinates.length === 2
        ? { type: "Point", coordinates }
        : undefined;

    const updateData = {
      name,
      registrationNumber,
      address,
      contactPhone,
      contactEmail,
      departments,
    };

    if (location) updateData.location = location;

    // 🔁 UPDATE
    if (hospital) {
      Object.keys(updateData).forEach((key) => {
        if (updateData[key] !== undefined) {
          hospital[key] = updateData[key];
        }
      });

      await hospital.save();
    }
    // 🆕 CREATE
    else {
      hospital = await Hospital.create({
        user: userId,
        name,
        registrationNumber,
        address,
        contactPhone,
        contactEmail,
        location: location || { type: "Point", coordinates: [0, 0] },
        departments: departments || [],
      });

      // Link hospital to user metadata (optional but useful)
      await User.findByIdAndUpdate(userId, {
        $set: { "meta.hospitalId": hospital._id },
      });
    }

    res.json({
      message: "Hospital profile saved successfully",
      hospital,
    });
  } catch (err) {
    console.error("❌ Upsert hospital profile failed:", err);
    res.status(500).json({ message: "Failed to save hospital profile" });
  }
};

/* ======================================================
   GET CURRENT HOSPITAL PROFILE
   ====================================================== */
export const getMyHospitalProfile = async (req, res) => {
  try {
    const hospital = await Hospital.findOne({ user: req.user.id });

    if (!hospital) {
      return res.status(404).json({
        message: "Hospital profile not found",
      });
    }

    res.json({ hospital });
  } catch (err) {
    console.error("❌ Fetch hospital profile failed:", err);
    res.status(500).json({ message: "Failed to load hospital profile" });
  }
};

/* ======================================================
   GET HOSPITAL BY ID (PUBLIC / ADMIN USE)
   ====================================================== */
export const getHospitalById = async (req, res) => {
  try {
    const { id } = req.params;

    const hospital = await Hospital.findById(id);
    if (!hospital) {
      return res.status(404).json({
        message: "Hospital not found",
      });
    }

    res.json({ hospital });
  } catch (err) {
    console.error("❌ Fetch hospital by ID failed:", err);
    res.status(500).json({ message: "Failed to fetch hospital" });
  }
};
