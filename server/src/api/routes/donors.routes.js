import express from "express";
import { authMiddleware, requireRole } from "../../middlewares/auth.middleware.js";

// Make sure these controller names exactly match your donor.controller.js
import {
  getMyDonorProfile,
  getDonorRequests,
} from "../controllers/donor.controller.js";

const router = express.Router();

// The "me" route
router.get(
  "/me",
  authMiddleware,
  requireRole(["donor"]),
  getMyDonorProfile
);

// The requests route
router.get(
  "/requests",
  authMiddleware,
  requireRole(["donor"]),
  getDonorRequests
);

export default router;