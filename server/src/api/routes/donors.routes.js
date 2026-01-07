import express from "express";
import { authMiddleware, requireRole } from "../../middlewares/auth.middleware.js";
import {
  getMyDonorProfile,
  getDonorRequests,
} from "../controllers/donor.controller.js";

const router = express.Router();

// Get personal profile
router.get(
  "/me",
  authMiddleware,
  requireRole(["donor"]),
  getMyDonorProfile
);

// Get available SOS requests for this donor
router.get(
  "/requests",
  authMiddleware,
  requireRole(["donor"]),
  getDonorRequests
);

export default router;