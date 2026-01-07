import DonorProfile from "../../models/DonorProfile.model.js";
import Request from "../../models/Request.model.js";

/* ======================================================
   GET LOGGED-IN DONOR PROFILE
   ====================================================== */
export const getMyDonorProfile = async (req, res) => {
  try {
    const donor = await DonorProfile.findOne({ user: req.user.id })
      .populate("user", "name email role");

    if (!donor) {
      return res.status(404).json({
        message: "Donor profile not found",
      });
    }

    res.json(donor);
  } catch (err) {
    console.error("❌ Get donor profile failed:", err);
    res.status(500).json({
      message: "Failed to load donor profile",
    });
  }
};

/* ======================================================
   GET OPEN SOS REQUESTS FOR DONOR (BY BLOOD TYPE)
   ====================================================== */
export const getDonorRequests = async (req, res) => {
  try {
    const donor = await DonorProfile.findOne({ user: req.user.id });

    if (!donor) {
      return res.status(404).json({
        message: "Donor profile not found",
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

/* ======================================================
   ⚠️ IMPORTANT
   DONOR DOES NOT ACCEPT SOS HERE ANYMORE
   ======================================================

   SOS acceptance is handled ONLY in:
   ➜ request.controller.js → acceptRequest

   This prevents:
   ❌ duplicate logic
   ❌ schema mismatch
   ❌ hospital not receiving updates
*/
