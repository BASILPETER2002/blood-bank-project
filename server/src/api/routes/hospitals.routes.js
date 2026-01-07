import express from "express";
import { body } from "express-validator";
import * as hospitalController from "../controllers/hospital.controller.js";
// ✅ Fixed: Changed 'auth' to 'authMiddleware'
import { authMiddleware, requireRole } from "../../middlewares/auth.middleware.js";

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  requireRole(["hospital"]),
  [body("name").isLength({ min: 2 }).withMessage("name required")],
  hospitalController.upsertHospitalProfile
);

router.get(
  "/me",
  authMiddleware,
  requireRole(["hospital"]),
  hospitalController.getMyHospitalProfile
);

router.get("/:id", authMiddleware, hospitalController.getHospitalById);

export default router;