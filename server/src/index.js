import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";

import DonorProfile from "./models/DonorProfile.model.js";

/* ROUTES */
import authRoutes from "./api/routes/auth.routes.js";
import donorRoutes from "./api/routes/donors.routes.js";
import hospitalRoutes from "./api/routes/hospitals.routes.js";
import requestRoutes from "./api/routes/requests.routes.js";
import adminRoutes from "./api/routes/admin.routes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

/* ======================================================
   CONFIGURATION FOR DEPLOYMENT
   ====================================================== */
// Allow both Localhost (for you) and the Live Frontend (for users)
const allowedOrigins = [
  "http://localhost:5173",
  process.env.FRONTEND_URL // You will set this in Render dashboard later
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

/* ======================================================
   EXPRESS MIDDLEWARE
   ====================================================== */
app.use(express.json());
app.use(cors(corsOptions)); // ✅ Updated to use dynamic origins

/* ======================================================
   SOCKET.IO SETUP
   ====================================================== */
const io = new Server(server, {
  cors: corsOptions, // ✅ Updated to match Express CORS
});

app.set("io", io);

/* ======================================================
   SOCKET AUTH MIDDLEWARE
   ====================================================== */
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token provided"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role === "donor") {
      const donor = await DonorProfile.findOne({ user: decoded.id });
      if (!donor || !donor.bloodType) {
        return next(new Error("Donor profile incomplete"));
      }
      socket.user = { id: decoded.id, role: "donor", bloodType: donor.bloodType };
    } 
    else if (decoded.role === "hospital") {
      socket.user = { id: decoded.id, role: "hospital" };
    } 
    else if (decoded.role === "admin") {
      socket.user = { id: decoded.id, role: "admin" };
    }

    next();
  } catch (err) {
    console.error("❌ Socket auth failed:", err.message);
    next(new Error("Socket authentication failed"));
  }
});

/* ======================================================
   SOCKET CONNECTION HANDLER
   ====================================================== */
io.on("connection", (socket) => {
  if (!socket.user) {
    console.warn(`⚠️ Socket connected without user data: ${socket.id}`);
    return socket.disconnect();
  }

  const { id, role, bloodType } = socket.user;
  console.log(`🟢 Socket connected: ${socket.id} | role=${role}`);

  if (role === "donor") {
    console.log(`🩸 Donor [${id}] joined room: donors:${bloodType}`);
    socket.join(`donors:${bloodType}`);
    socket.join(`donor:${id}`);
  } 
  else if (role === "hospital") {
    console.log(`🏥 Hospital [${id}] joined room`);
    socket.join(`hospital:${id}`);
  }

  socket.on("disconnect", () => {
    console.log(`🔴 Socket disconnected: ${socket.id}`);
  });
});

/* ======================================================
   EXPOSE IO TO REQUESTS
   ====================================================== */
app.use((req, res, next) => {
  req.io = io;
  next();
});

/* ======================================================
   ROUTES
   ====================================================== */
app.use("/api/auth", authRoutes);
app.use("/api/donors", donorRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/admin", adminRoutes);

/* ======================================================
   DATABASE + SERVER
   ====================================================== */
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });