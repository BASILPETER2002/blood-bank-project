import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar"; // Adjust path if needed
import API from "../../api/axios";
import socket from "../../socket";
import toast from "react-hot-toast";

export default function DonorDashboard() {
  const [profile, setProfile] = useState(null);
  const [openRequests, setOpenRequests] = useState([]); 
  const [myHistory, setMyHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ================= INIT DATA LOADING ================= */
  const fetchData = async () => {
    try {
      const profileRes = await API.get("/api/donors/me");
      setProfile(profileRes.data);

      const requestsRes = await API.get("/api/donors/requests");
      setOpenRequests(requestsRes.data.requests || []);

      const historyRes = await API.get("/api/requests/history/donor");
      setMyHistory(historyRes.data?.requests || []);
    } catch (err) {
      console.error("❌ Data Load Failed:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ================= SOCKET LISTENERS ================= */
  useEffect(() => {
    // 1. New SOS Alert Listener
    const handleSOS = (payload) => {
      console.log("🚨 SOS RECEIVED:", payload);

      // A. Show Popup
      toast((t) => (
        <div className="flex items-center gap-2">
          <span className="text-2xl">🚑</span>
          <div>
            <p className="font-bold">Emergency Alert!</p>
            <p className="text-sm">Hospital needs {payload.bloodType || "blood"}!</p>
          </div>
        </div>
      ), { duration: 5000, style: { border: "2px solid red" } });
      
      // B. ✅ OPTIMISTIC UPDATE (The Critical Fix)
      // Manually add the new alert to the list immediately.
      const newAlert = {
        _id: payload.requestId, // Map requestId from socket to _id
        bloodType: payload.bloodType,
        units: payload.units || 1,
        isCritical: payload.isCritical || false,
        hospital: { name: payload.hospitalName || "Incoming Request..." },
        createdAt: new Date().toISOString()
      };

      setOpenRequests((prev) => {
        // Prevent duplicates
        if (prev.find(r => r._id === newAlert._id)) return prev;
        return [newAlert, ...prev];
      });
    };

    // 2. Approval Listener
    const onApproved = () => {
      toast.success("🎉 Hospital APPROVED your donation request!");
      fetchData(); 
    };

    // 3. Rejection Listener
    const onRejected = () => {
      toast.error("Hospital declined the request.");
      fetchData();
    };

    socket.on("SOS_BROADCAST", handleSOS);
    socket.on("SOS_ALERT", handleSOS);    
    socket.on("donor_approved", onApproved);
    socket.on("donor_rejected", onRejected);

    return () => {
      socket.off("SOS_BROADCAST", handleSOS);
      socket.off("SOS_ALERT", handleSOS);
      socket.off("donor_approved", onApproved);
      socket.off("donor_rejected", onRejected);
    };
  }, []);

  /* ================= ACTIONS ================= */
  const handleAccept = async (requestId) => {
    try {
      await API.post(`/api/requests/${requestId}/accept`);
      toast.success("Response sent! Waiting for hospital approval.");
      
      // Remove from Open Requests immediately to update UI
      setOpenRequests(prev => prev.filter(req => req._id !== requestId));
      
      // Refresh history in background
      const historyRes = await API.get("/api/requests/history/donor");
      setMyHistory(historyRes.data?.requests || []);
      
    } catch (err) {
      console.error("Accept Error:", err);
      toast.error(err.response?.data?.message || "Failed to accept");
    }
  };

  const livesSaved = myHistory.filter(r => r.status === 'completed' || r.status === 'approved').length;

  if (loading) return <div className="p-10 text-center font-bold text-gray-500">Loading Donor Portal...</div>;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1">
        {/* Header */}
        <header className="bg-white border-b px-8 py-5 flex justify-between items-center shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Hello, {profile?.user?.name || "Donor"} 👋</h1>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">
              Blood Group: <span className="text-red-600 text-lg">{profile?.bloodType || "Unknown"}</span>
            </p>
          </div>
          
          <div className="bg-red-50 px-5 py-2 rounded-xl border border-red-100 flex flex-col items-center">
            <span className="text-[10px] text-red-400 font-black uppercase tracking-widest">Lives Impacted</span>
            <span className="text-3xl font-black text-red-600">{livesSaved}</span>
          </div>
        </header>

        <main className="p-8 max-w-6xl mx-auto space-y-8">
          
          {/* 🚨 SECTION 1: ACTIVE EMERGENCIES */}
          <div>
            <h2 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
              🚑 Active Emergencies (Nearby)
            </h2>
            
            {openRequests.length === 0 ? (
              <div className="bg-white p-8 rounded-xl shadow-sm text-center border-2 border-dashed border-gray-200">
                <p className="text-gray-400 font-medium">No active SOS requests right now.</p>
                <p className="text-sm text-green-500 font-bold mt-1">Status: Standby Mode 🟢</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {openRequests.map((req) => (
                  <div key={req._id} className="bg-white p-6 rounded-xl shadow-md border-l-4 border-red-500 flex flex-col md:flex-row justify-between items-center gap-4 animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-red-100 text-red-600 rounded-lg flex items-center justify-center text-2xl font-black shadow-inner">
                        {req.bloodType}
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{req.hospital?.name || "Emergency Request"}</h3>
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-gray-500">Needs {req.units || 1} Unit(s)</p>
                          {req.isCritical && <span className="bg-red-600 text-white text-[10px] px-2 py-0.5 rounded font-black uppercase animate-pulse">CRITICAL</span>}
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleAccept(req._id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg font-bold shadow-md transition-transform active:scale-95 flex items-center gap-2"
                    >
                      <span>🩸</span> I Can Help!
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 📜 SECTION 2: DONATION HISTORY */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
              <h2 className="font-bold text-gray-700">My Donation Activity</h2>
              <span className="text-xs font-bold text-gray-400">{myHistory.length} Total Records</span>
            </div>
            
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase">Hospital</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase">Date</th>
                  <th className="px-6 py-3 text-xs font-bold text-gray-400 uppercase text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {myHistory.length > 0 ? (
                  myHistory.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-800">{item.hospital?.name || "Unknown Hospital"}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <StatusBadge status={item.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-6 py-10 text-center text-gray-400 italic">
                      You haven't interacted with any requests yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </main>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const map = {
    pending: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    approved: "bg-green-100 text-green-700 border border-green-200",
    completed: "bg-blue-100 text-blue-700 border border-blue-200",
    rejected: "bg-gray-100 text-gray-500 border border-gray-200",
  };
  const label = status === 'pending' ? 'Wait for Hospital' : status;
  return (
    <span className={`px-3 py-1 text-[10px] font-black rounded-full uppercase tracking-wide ${map[status] || "bg-gray-100"}`}>
      {label}
    </span>
  );
}