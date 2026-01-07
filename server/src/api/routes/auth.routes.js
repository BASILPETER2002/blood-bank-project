import express from "express";
import { login, register, getMe } from "../controllers/auth.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = express.Router();

/**
 * Public Routes
 */
router.post("/register", register);
router.post("/login", login);

/**
 * Private Route (Requires Token)
 */
router.get("/me", authMiddleware, getMe);

export default router;