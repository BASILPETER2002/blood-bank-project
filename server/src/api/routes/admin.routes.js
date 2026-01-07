import express from "express";
import { authMiddleware, requireRole } from "../../middlewares/auth.middleware.js";
import {
  getAdminStats,
  getAllUsers,
  toggleUserStatus,
  getAllSOS,
  cleanupOldRequests,
} from "../controllers/admin.controller.js";

const router = express.Router();

router.use(authMiddleware, requireRole(["admin"]));

router.get("/stats", getAdminStats);
router.get("/users", getAllUsers);
router.patch("/users/:id/toggle", toggleUserStatus);
router.get("/sos", getAllSOS);
router.post("/requests/cleanup", cleanupOldRequests);

export default router;