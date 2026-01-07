import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { Server } from "socket.io";

// Import User model to verify donor data
import User from "./models/User.model.js"; 

/* ROUTES */
import authRoutes from "./api/routes/auth.routes.js";
import donorRoutes from "./api/routes/donors.routes.js";
import hospitalRoutes from "./api/routes/hospitals.routes.js";
import requestRoutes from "./api/routes/requests.routes.js";
import adminRoutes from "./api/routes/admin.routes.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:5173",
  "https://blood-bank-project-ecru.vercel.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || origin.endsWith(".vercel.app")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};

app.use(express.json());
app.use(cors(corsOptions));

const io = new Server(server, {
  cors: corsOptions,
});

app.set("io", io);

/* ================= SOCKET AUTH MIDDLEWARE (FIXED) ================= */
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token provided"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ FIX: Check the User collection instead of DonorProfile 
    // since your Atlas data shows bloodType is in the User document.
    const user = await User.findById(decoded.id);

    if (decoded.role === "donor") {
      if (!user || !user.bloodType) {
        return next(new Error("Donor profile incomplete"));
      }
      socket.user = { id: decoded.id, role: "donor", bloodType: user.bloodType };
    } 
    else {
      socket.user = { id: decoded.id, role: decoded.role };
    }

    next();
  } catch (err) {
    console.error("❌ Socket auth failed:", err.message);
    next(new Error("Socket authentication failed"));
  }
});

io.on("connection", (socket) => {
  if (!socket.user) return socket.disconnect();

  const { id, role, bloodType } = socket.user;
  
  if (role === "donor") {
    socket.join(`donors:${bloodType}`);
    socket.join(`donor:${id}`);
    console.log(`🩸 Donor [${id}] joined room: donors:${bloodType}`);
  } 
  else if (role === "hospital") {
    socket.join(`hospital:${id}`);
    console.log(`🏥 Hospital [${id}] connected`);
  }

  socket.on("disconnect", () => {
    console.log(`🔴 Socket disconnected: ${socket.id}`);
  });
});

app.use((req, res, next) => {
  req.io = io;
  next();
});

/* ROUTES */
app.use("/api/auth", authRoutes);
app.use("/api/donors", donorRoutes);
app.use("/api/hospitals", hospitalRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/admin", adminRoutes);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection failed:", err);
    process.exit(1);
  });