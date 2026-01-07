import User from "../../models/User.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

/* ======================================================
   USER REGISTRATION
   ====================================================== */
export const register = async (req, res) => {
  try {
    const { name, email, password, role, bloodType } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 2. Hash the password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // 3. Create the User (Force Active Status)
    const user = await User.create({ 
      name, 
      email, 
      passwordHash, 
      role,
      bloodType: role === 'donor' ? bloodType : undefined, // Only save blood type for donors
      isActive: true // ✅ CRITICAL: Ensures new users can login immediately
    });

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error("Registration Error:", err);
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
};

/* ======================================================
   USER LOGIN (WITH AUTO-FIX REPAIR)
   ====================================================== */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // 1. Find user
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    /* 🚨 REPAIR FIX: 
       If the user is inactive, FORCE them to be active right now. 
       This fixes the "stuck" database records.
    */
    if (!user.isActive) {
      console.log(`⚠️ AUTO-FIX: Activating stuck user ${user.email}...`);
      user.isActive = true;
      await user.save(); // Save the fix to the database
    }

    // 3. Generate Token
    const accessToken = jwt.sign(
      { id: user._id, role: user.role, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      accessToken,
      user: { id: user._id, name: user.name, role: user.role, email: user.email }
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Login failed" });
  }
};

/* ======================================================
   GET CURRENT USER (Session Check)
   ====================================================== */
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-passwordHash");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    console.error("getMe Error:", err);
    res.status(500).json({ message: "Server error fetching session" });
  }
};