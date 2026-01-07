import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import API from "../../api/axios";
import socket from "../../socket";
import toast from "react-hot-toast";

export default function HospitalDashboard() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  // State for the SOS form
  const [formData, setFormData] = useState({
    bloodType: "A+",
    units: 1,
    isCritical: false
  });

  // Derived Statistics for the Top Cards
  const stats = {
    total: requests.length,
    active: requests.filter(r => r.status === "open").length,
    completed: requests.filter(r => r.status === "completed").length,
  };

  /* ================= FETCH DATA ================= */
  const fetchRequests = async () => {
    try {
      const res = await API.get("/api/requests/hospital");
      setRequests(res.data?.requests || []);
    } catch (err) {
      console.error("❌ Fetch failed", err);
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  /* ================= SOCKET LISTENER ================= */
  useEffect(() => {
    // Listen for when a donor clicks "Accept"
    const onDonorAccepted = ({ donorName }) => {
      toast.success(`🩸 ${donorName || 'A donor'} just accepted your SOS!`);
      // Play a sound or vibrate here if you wanted
      fetchRequests(); // Refresh to show the new 'Approve' button
    };

    socket.on("donor_accepted", onDonorAccepted);
    return () => socket.off("donor_accepted", onDonorAccepted);
  }, []);

  /* ================= ACTIONS ================= */
  const createSOS = async () => {
    try {
      setSending(true);
      await API.post("/api/requests", formData);
      toast.success("SOS Alert Broadcasted!");
      fetchRequests();
      // Reset critical flag but keep blood type just in case
      setFormData(prev => ({ ...prev, isCritical: false }));
    } catch (err) {
      toast.error("Failed to send SOS");
    } finally {
      setSending(false);
    }
  };

  const approveDonor = async (requestId, donorId) => {
    try {
      await API.post(`/api/requests/${requestId}/approve/${donorId}`);
      toast.success("Donor Approved! Contact details shared.");
      fetchRequests();
    } catch (err) {
      console.error("❌ Approval Error", err.response?.data);
      toast.error(err.response?.data?.message || "Approval Failed");
    }
  };

  const rejectDonor = async (requestId, donorId) => {
    if(!window.confirm("Are you sure you want to reject this donor?")) return;
    try {
      await API.post(`/api/requests/${requestId}/reject/${donorId}`);
      toast.success("Donor Rejected");
      fetchRequests();
    } catch (err) {
      toast.error("Action Failed");
    }
  };

  /* ================= DERIVED DATA ================= */
  // Extracts all donors with 'pending' status across all requests
  const pendingDonors = requests.flatMap(req => 
    (req.acceptedDonors || [])
      .filter(d => d.status === "pending")
      .map(d => ({
        ...d,
        requestId: req._id,
        bloodType: req.bloodType, // pass blood type for context
        reqIsCritical: req.isCritical
      }))
  );

  if (loading) return <div className="p-10 text-center font-bold text-gray-500">Loading Dashboard...</div>;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1">
        {/* Header */}
        <header className="bg-red-700 text-white px-8 py-5 flex justify-between items-center shadow-lg">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">🏥 Hospital Console</h1>
            <p className="text-xs text-red-200 uppercase font-semibold tracking-wider">Emergency Response Unit</p>
          </div>
        </header>

        <main className="p-8 max-w-7xl mx-auto space-y-8">
          
          {/* 📊 SECTION 1: STATISTICS CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard title="Total SOS Alerts" value={stats.total} icon="📢" color="text-blue-600" />
            <StatCard title="Active Needs" value={stats.active} icon="🔥" color="text-red-600" isPulse={stats.active > 0} />
            <StatCard title="Lives Saved" value={stats.completed} icon="❤️" color="text-green-600" />
          </div>

          {/* ⚠️ SECTION 2: URGENT APPROVALS (Only shows if needed) */}
          {pendingDonors.length > 0 && (
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="bg-red-50 border-l-4 border-red-600 p-6 rounded-r-xl shadow-sm">
                <h2 className="text-lg font-black text-red-700 mb-4 flex items-center gap-2">
                  🔔 ACTION REQUIRED: {pendingDonors.length} VOLUNTEER(S) WAITING
                </h2>
                <div className="grid grid-cols-1 gap-4">
                  {pendingDonors.map((entry) => (
                    <div key={`${entry.requestId}-${entry.donor?._id}`} className="bg-white p-4 rounded-lg shadow-md border border-red-100 flex flex-col md:flex-row justify-between items-center gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xl font-bold">
                          {entry.bloodType}
                        </div>
                        <div>
                          <p className="text-lg font-bold text-gray-900">{entry.donor?.name || "Unknown Donor"}</p>
                          <p className="text-sm text-gray-500">{entry.donor?.email}</p>
                          {entry.reqIsCritical && <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded ml-2">CRITICAL REQUEST</span>}
                        </div>
                      </div>
                      <div className="flex gap-3 w-full md:w-auto">
                        <button 
                          onClick={() => approveDonor(entry.requestId, entry.donor?._id)}
                          className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold shadow-sm transition-all active:scale-95"
                        >
                          Approve Match
                        </button>
                        <button 
                          onClick={() => rejectDonor(entry.requestId, entry.donor?._id)}
                          className="flex-1 md:flex-none bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-2 rounded-lg font-bold transition-all active:scale-95"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* 📝 SECTION 3: CREATE SOS FORM */}
            <div className="lg:col-span-1">
              <div className="bg-white p-6 rounded-xl shadow-lg border-t-4 border-red-600 sticky top-6">
                <h2 className="text-lg font-bold mb-6 text-gray-800 flex items-center gap-2">
                  🚀 Broadcast SOS
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Blood Type Needed</label>
                    <select 
                      className="w-full border-2 border-gray-200 rounded-lg p-3 bg-gray-50 font-bold text-gray-700 outline-none focus:border-red-500 transition-colors"
                      value={formData.bloodType}
                      onChange={(e) => setFormData({...formData, bloodType: e.target.value})}
                    >
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bt => (
                        <option key={bt} value={bt}>{bt}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Units Required</label>
                    <input 
                      type="number" 
                      className="w-full border-2 border-gray-200 rounded-lg p-3 bg-gray-50 outline-none focus:border-red-500 font-bold"
                      min="1"
                      value={formData.units}
                      onChange={(e) => setFormData({...formData, units: e.target.value})}
                    />
                  </div>

                  <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-red-50 transition-colors">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 text-red-600 accent-red-600"
                      checked={formData.isCritical}
                      onChange={(e) => setFormData({...formData, isCritical: e.target.checked})}
                    />
                    <span className={`font-bold ${formData.isCritical ? "text-red-600" : "text-gray-600"}`}>
                      Critical Emergency?
                    </span>
                  </label>

                  <button 
                    onClick={createSOS} 
                    disabled={sending}
                    className="w-full bg-red-600 text-white py-4 rounded-xl font-black text-lg shadow-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-transform active:scale-95"
                  >
                    {sending ? "Broadcasting..." : "SEND ALERT NOW"}
                  </button>
                </div>
              </div>
            </div>

            {/* 📜 SECTION 4: HISTORY LIST */}
            <div className="lg:col-span-2">
              <h2 className="text-lg font-bold text-gray-700 mb-4">Request History</h2>
              
              <div className="space-y-4">
                {requests.length === 0 ? (
                  <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
                    <p className="text-gray-400 font-medium">No active blood requests.</p>
                    <p className="text-sm text-gray-300 mt-1">Use the form to create your first alert.</p>
                  </div>
                ) : (
                  requests.map((req) => (
                    <div key={req._id} className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-4">
                          <div className={`w-14 h-14 rounded-lg flex items-center justify-center text-2xl font-black ${req.isCritical ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"}`}>
                            {req.bloodType}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-800">{req.units} Unit(s)</span>
                              {req.isCritical && <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded font-black uppercase">CRITICAL</span>}
                            </div>
                            <p className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString()} at {new Date(req.createdAt).toLocaleTimeString()}</p>
                          </div>
                        </div>
                        <StatusBadge status={req.status} />
                      </div>

                      {/* Donors List inside the card */}
                      {req.acceptedDonors && req.acceptedDonors.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <p className="text-xs font-bold text-gray-400 uppercase mb-2">Responding Donors</p>
                          <div className="space-y-2">
                            {req.acceptedDonors.map(d => (
                              <div key={d._id} className="flex justify-between items-center text-sm">
                                <span className="text-gray-700 font-medium">{d.donor?.name || "Loading..."}</span>
                                {d.status === 'approved' ? (
                                  <span className="text-green-600 font-bold text-xs flex items-center gap-1">
                                    ✅ Match Confirmed
                                  </span>
                                ) : (
                                  <span className="text-yellow-600 font-bold text-xs bg-yellow-50 px-2 py-0.5 rounded">
                                    ⏳ Pending Review
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}

/* --- Sub-Components --- */
function StatCard({ title, value, icon, color, isPulse }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-transparent hover:border-gray-200 transition-all flex items-center gap-4">
      <div className={`text-3xl p-3 bg-gray-50 rounded-lg ${isPulse ? "animate-pulse" : ""}`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{title}</p>
        <p className={`text-3xl font-black ${color}`}>{value}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const styles = {
    open: "bg-yellow-100 text-yellow-800 border border-yellow-200",
    completed: "bg-green-100 text-green-800 border border-green-200",
    expired: "bg-gray-100 text-gray-500 border border-gray-200",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wide ${styles[status] || "bg-gray-100"}`}>
      {status}
    </span>
  );
}