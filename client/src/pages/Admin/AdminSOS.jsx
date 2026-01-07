import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import API from "../../api/axios";
import toast from "react-hot-toast";

export default function AdminSOS() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBloodType, setSelectedBloodType] = useState("All");

  const bloodTypes = ["All", "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

  const fetchAllSOS = async () => {
    try {
      const res = await API.get("/api/admin/sos");
      setRequests(res.data.requests || []);
    } catch (err) {
      toast.error("Failed to load SOS records");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllSOS();
  }, []);

  /* ================= FILTER LOGIC ================= */
  const filteredRequests = selectedBloodType === "All" 
    ? requests 
    : requests.filter(req => req.bloodType === selectedBloodType);

  if (loading) return <div className="p-10 text-center font-bold">Loading SOS Records...</div>;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1">
        <header className="bg-white border-b px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
          <h1 className="text-xl font-bold text-gray-800">📡 Global SOS Monitor</h1>
          
          {/* 🩸 BLOOD TYPE FILTER DROPDOWN */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-semibold text-gray-500">Filter Blood Type:</label>
            <select 
              className="border rounded-lg px-4 py-2 text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-red-500 font-bold text-red-600"
              value={selectedBloodType}
              onChange={(e) => setSelectedBloodType(e.target.value)}
            >
              {bloodTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </header>

        <main className="p-6 max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b text-[10px] uppercase text-gray-400 font-black tracking-widest">
                  <th className="px-6 py-4">Hospital & Blood Type</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Matched Donor</th>
                  <th className="px-6 py-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((req) => {
                    const approvedEntry = req.acceptedDonors?.find(d => d.status === "approved");
                    
                    return (
                      <tr key={req._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-black text-red-600 w-10">{req.bloodType}</span>
                            <div>
                              <p className="font-bold text-gray-800">{req.hospital?.name || "Unknown Hospital"}</p>
                              <p className="text-[10px] text-gray-400 font-mono">ID: {req._id.slice(-6)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={req.status} isCritical={req.isCritical} />
                        </td>
                        <td className="px-6 py-4">
                          {approvedEntry ? (
                            <div>
                              <p className="text-sm font-bold text-gray-800">{approvedEntry.donor?.name}</p>
                              <p className="text-[10px] text-green-600 font-bold uppercase">Match Approved</p>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">No approved donor yet</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right text-xs text-gray-500 font-medium">
                          {new Date(req.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-10 text-center text-gray-400 italic">
                      No {selectedBloodType} requests found.
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

function StatusBadge({ status, isCritical }) {
  const map = {
    open: "bg-yellow-100 text-yellow-700",
    completed: "bg-green-100 text-green-700",
    fulfilled: "bg-green-100 text-green-700",
    expired: "bg-gray-100 text-gray-400",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div className="flex flex-col gap-1">
      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase text-center ${map[status] || "bg-gray-100"}`}>
        {status}
      </span>
      {isCritical && (
        <span className="bg-red-600 text-white text-[8px] font-black px-1 rounded text-center animate-pulse">
          URGENT
        </span>
      )}
    </div>
  );
}