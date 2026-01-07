import User from "../../models/User.model.js";
import Request from "../../models/Request.model.js";

/* ======================================================
   GET LOGGED-IN DONOR PROFILE (UPDATED)
   ====================================================== */
export const getMyDonorProfile = async (req, res) => {
  try {
    // ✅ FIX: Look in User collection instead of DonorProfile
    const donor = await User.findById(req.user.id).select("-passwordHash");

    if (!donor) {
      return res.status(404).json({
        message: "Donor profile not found",
      });
    }

    // Return format matches what the frontend expects
    res.json(donor);
  } catch (err) {
    console.error("❌ Get donor profile failed:", err);
    res.status(500).json({
      message: "Failed to load donor profile",
    });
  }
};

/* ======================================================
   GET OPEN SOS REQUESTS FOR DONOR (UPDATED)
   ====================================================== */
export const getDonorRequests = async (req, res) => {
  try {
    // ✅ FIX: Get donor bloodType directly from User collection
    const donor = await User.findById(req.user.id);

    if (!donor || !donor.bloodType) {
      return res.status(404).json({
        message: "Donor profile or blood type not found",
      });
    }

    const requests = await Request.find({
      bloodType: donor.bloodType,
      status: "open",
    })
      .populate("hospital", "name")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error("❌ Fetch donor SOS failed:", err);
    res.status(500).json({
      message: "Failed to fetch donor requests",
    });
  }
};