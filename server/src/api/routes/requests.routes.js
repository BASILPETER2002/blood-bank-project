import express from "express";
import {
  createRequest,
  acceptRequest,
  approveDonor,
  rejectDonor,
  getHospitalRequests,
  getDonorRequests,
} from "../controllers/request.controller.js";
// ✅ Fixed: Changed 'auth' to 'authMiddleware'
import { authMiddleware, requireRole } from "../../middlewares/auth.middleware.js";

const router = express.Router();

console.log("✅ requests.routes.js LOADED - Routes Reordered");

/* ================= STATIC ROUTES ================= */
router.get(
  "/hospital",
  authMiddleware,
  requireRole(["hospital"]),
  getHospitalRequests
);

router.get(
  "/history/donor",
  authMiddleware,
  requireRole(["donor"]),
  getDonorRequests
);

router.post(
  "/",
  authMiddleware,
  requireRole(["hospital"]),
  createRequest
);

/* ================= DYNAMIC ROUTES ================= */
router.post(
  "/:requestId/accept",
  authMiddleware,
  requireRole(["donor"]),
  acceptRequest
);

router.post(
  "/:requestId/approve/:donorId",
  authMiddleware,
  requireRole(["hospital"]),
  approveDonor
);

router.post(
  "/:requestId/reject/:donorId",
  authMiddleware,
  requireRole(["hospital"]),
  rejectDonor
);

export default router;