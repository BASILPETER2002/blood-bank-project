import User from "../../models/User.model.js";
import Request from "../../models/Request.model.js";
import DonorProfile from "../../models/DonorProfile.model.js";

/**
 * GET /api/admin/stats
 * Expanded System-wide statistics with Blood Type Heatmap
 */
export const getAdminStats = async (req, res, next) => {
  try {
    // Basic User Counts
    const totalUsers = await User.countDocuments();
    const donors = await User.countDocuments({ role: "donor" });
    const hospitals = await User.countDocuments({ role: "hospital" });

    // SOS Success Metrics
    const totalSOS = await Request.countDocuments();
    const completedSOS = await Request.countDocuments({ 
      status: { $in: ["completed", "fulfilled"] } 
    });

    // 📊 BLOOD TYPE HEATMAP (Demand vs Supply)
    // Aggregate demand from all requests
    const demandData = await Request.aggregate([
      { $group: { _id: "$bloodType", count: { $sum: 1 } } }
    ]);

    // Aggregate supply from all donor profiles
    const supplyData = await DonorProfile.aggregate([
      { $group: { _id: "$bloodType", count: { $sum: 1 } } }
    ]);

    res.json({
      users: { total: totalUsers, donors, hospitals },
      sos: {
        total: totalSOS,
        completed: completedSOS,
        successRate: totalSOS === 0 ? 0 : Math.round((completedSOS / totalSOS) * 100),
      },
      heatmap: {
        demand: demandData,
        supply: supplyData
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/users
 * Includes isActive status for management
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-passwordHash -refreshTokens");
    res.json({ users });
  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/users/:id/toggle
 * Activate / Deactivate a user
 */
export const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === "admin") {
      return res.status(400).json({ message: "Admin users cannot be deactivated" });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.json({
      message: "User status updated",
      userId: user._id,
      isActive: user.isActive,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/sos
 * Comprehensive SOS monitoring
 */
export const getAllSOS = async (req, res, next) => {
  try {
    const requests = await Request.find()
      .populate("hospital", "name email")
      .populate("acceptedDonors.donor", "name email")
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/admin/requests/cleanup
 * Maintenance: Auto-expire old 'open' requests
 */
export const cleanupOldRequests = async (req, res, next) => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    // Find open requests older than 24 hours and mark them expired
    const result = await Request.updateMany(
      { 
        status: "open", 
        createdAt: { $lt: twentyFourHoursAgo } 
      },
      { $set: { status: "expired" } }
    );

    res.json({
      message: "Cleanup successful",
      expiredCount: result.modifiedCount
    });
  } catch (err) {
    next(err);
  }
};