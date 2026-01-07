import jwt from "jsonwebtoken";

/* =====================================================
   AUTH MIDDLEWARE
   - Verifies JWT
   - Normalizes req.user
   ===================================================== */
// Renamed from 'auth' to 'authMiddleware' to match route imports
export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // No Authorization header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // Token is literally "undefined" or empty
    if (!token || token === "undefined") {
      return res.status(401).json({ message: "Malformed token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔥 NORMALIZED USER OBJECT (CRITICAL)
    req.user = {
      id: decoded.id || decoded._id,
      role: decoded.role,
      email: decoded.email,
    };

    next();
  } catch (err) {
    console.error("❌ Auth error:", err.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/* =====================================================
   ROLE-BASED ACCESS CONTROL
   ===================================================== */
export const requireRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      console.error(
        "⛔ Forbidden role:",
        req.user.role,
        "| Allowed:",
        roles.join(", ")
      );
      return res.status(403).json({ message: "Forbidden" });
    }

    next();
  };
};