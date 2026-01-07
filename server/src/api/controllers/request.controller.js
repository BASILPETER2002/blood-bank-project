import Request from "../../models/Request.model.js";
import User from "../../models/User.model.js";

/* ======================================================
   HOSPITAL CREATES SOS
   ====================================================== */
export const createRequest = async (req, res) => {
  try {
    const request = await Request.create({
      hospital: req.user.id,
      bloodType: req.body.bloodType,
      units: req.body.units,
      isCritical: req.body.isCritical,
      status: "open",
      acceptedDonors: [],
    });

    // Notify all matching donors in real-time
    req.io.to(`donors:${request.bloodType}`).emit("SOS_ALERT", {
      requestId: request._id,
      bloodType: request.bloodType,
      units: request.units,
      isCritical: request.isCritical,
    });

    res.status(201).json({ request });
  } catch (err) {
    console.error("❌ CREATE SOS FAILED:", err);
    res.status(500).json({ message: "Failed to create SOS" });
  }
};

/* ======================================================
   DONOR ACCEPTS SOS
   ====================================================== */
export const acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await Request.findById(requestId);
    if (!request) return res.status(404).json({ message: "SOS not found" });

    if (request.status !== "open") return res.status(400).json({ message: "SOS already closed" });

    const alreadyAccepted = request.acceptedDonors.some(
      (d) => d.donor.toString() === req.user.id
    );

    if (alreadyAccepted) return res.status(400).json({ message: "Already accepted this SOS" });

    // Fetch donor's name to send to hospital via socket for immediate UI update
    const donorUser = await User.findById(req.user.id).select("name email");

    request.acceptedDonors.push({
      donor: req.user.id,
      status: "pending",
    });

    await request.save();

    // 🔔 Notify hospital with FULL donor info so buttons appear instantly
    req.io.to(`hospital:${request.hospital}`).emit("SOS_ACCEPTED", {
      requestId: request._id,
      donorId: req.user.id,
      donorName: donorUser.name,
      bloodType: request.bloodType
    });

    res.json({ message: "SOS accepted successfully" });
  } catch (err) {
    console.error("❌ Accept SOS failed:", err);
    res.status(500).json({ message: "Failed to accept SOS" });
  }
};

/* ======================================================
   HOSPITAL APPROVES DONOR
   ====================================================== */
/* ======================================================
   APPROVE DONOR (Hospital Action)
   ====================================================== */
export const approveDonor = async (req, res) => {
  try {
    const { requestId, donorId } = req.params;

    // 1. Find the request
    const request = await Request.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    // 2. Verify only the creator hospital can approve
    if (request.hospital.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // 3. Find the specific donor in the list
    const donorEntry = request.acceptedDonors.find(
      (d) => d.donor.toString() === donorId
    );

    if (!donorEntry) {
      return res.status(404).json({ message: "Donor not found in this request" });
    }

    // 4. ✅ CRITICAL: Update statuses
    donorEntry.status = "approved"; // Mark donor as approved
    request.status = "completed";   // ✅ THIS FIXES THE 0% SUCCESS RATE

    await request.save();

    // 5. (Optional) Notify donor via Socket.io
    // req.io.to(`donor:${donorId}`).emit("request_approved", { requestId });

    res.json({ message: "Donor approved, request completed", request });
  } catch (err) {
    res.status(500).json({ message: "Approval failed", error: err.message });
  }
};
/* ======================================================
   HOSPITAL REJECTS DONOR
   ====================================================== */
export const rejectDonor = async (req, res) => {
  try {
    const { requestId, donorId } = req.params;

    const request = await Request.findById(requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (request.hospital.toString() !== req.user.id) return res.status(403).json({ message: "Unauthorized" });

    request.acceptedDonors.forEach((d) => {
      if (d.donor.toString() === donorId) {
        d.status = "rejected";
      }
    });

    await request.save();

    req.io.to(`donor:${donorId}`).emit("DONOR_REJECTED", { requestId });

    res.json({ message: "Donor rejected successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to reject donor" });
  }
};

/* ======================================================
   HOSPITAL REQUEST HISTORY
   ====================================================== */
export const getHospitalRequests = async (req, res) => {
  try {
    // Populate is mandatory for the Hospital Dashboard to show donor names
    const requests = await Request.find({ hospital: req.user.id })
      .populate("acceptedDonors.donor", "name email")
      .sort({ createdAt: -1 });

    res.json({ requests });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch hospital requests" });
  }
};

/* ======================================================
   DONOR REQUEST HISTORY
   ====================================================== */
export const getDonorRequests = async (req, res) => {
  try {
    const requests = await Request.find({
      "acceptedDonors.donor": req.user.id,
    }).sort({ createdAt: -1 });

    const formatted = requests.map((r) => {
      const entry = r.acceptedDonors.find(
        (d) => d.donor.toString() === req.user.id
      );

      return {
        _id: r._id,
        bloodType: r.bloodType,
        status: entry?.status || "pending",
        createdAt: r.createdAt,
      };
    });

    res.json({ requests: formatted });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch donor requests" });
  }
};