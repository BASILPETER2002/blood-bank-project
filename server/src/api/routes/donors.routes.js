import express from "express";
// ✅ Fixed: Changed 'auth' to 'authMiddleware'
import { authMiddleware, requireRole } from "../../middlewares/auth.middleware.js";

import {
  getMyDonorProfile,
  getDonorRequests,
} from "../controllers/donor.controller.js";

const router = express.Router();

router.get(
  "/me",
  authMiddleware,
  requireRole(["donor"]),
  getMyDonorProfile
);

router.get(
  "/requests",
  authMiddleware,
  requireRole(["donor"]),
  getDonorRequests
);

export default router;