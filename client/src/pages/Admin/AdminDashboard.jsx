import { useEffect, useState } from "react";
import { Link } from "react-router-dom"; // ✅ Added Link import for navigation
import Sidebar from "../../components/Sidebar";
import API from "../../api/axios";
import toast from "react-hot-toast";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCleaning, setIsCleaning] = useState(false);

  // Fetch real-time stats from the backend
  const fetchStats = async () => {
    try {
      const res = await API.get("/api/admin/stats");
      setStats(res.data);
    } catch (err) {
      console.error("❌ Failed to fetch admin stats:", err);
      toast.error("Could not load system statistics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // System Maintenance: Trigger the cleanup of old SOS requests
  const handleCleanup = async () => {
    try {
      setIsCleaning(true);
      const res = await API.post("/api/admin/requests/cleanup");
      toast.success(`${res.data.expiredCount} stale requests expired!`);
      fetchStats();
    } catch (err) {
      toast.error("Cleanup failed");
    } finally {
      setIsCleaning(false);
    }
  };

  if (loading) return <div className="p-10 text-center font-bold">Loading Admin System...</div>;

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      <Sidebar />

      <div className="flex-1">
        {/* Top Bar */}
        <header className="bg-gradient-to-r from-red-700 to-red-600 text-white px-6 py-4 flex justify-between items-center shadow-lg">
          <h1 className="text-xl font-bold flex items-center gap-2">
            🛡️ Admin Control Center
          </h1>

          <button 
            onClick={handleCleanup}
            disabled={isCleaning}
            className="bg-white text-red-600 px-4 py-1.5 rounded-lg text-sm font-bold shadow hover:bg-red-50 disabled:opacity-50 transition-all"
          >
            {isCleaning ? "Cleaning..." : "🧹 Run System Cleanup"}
          </button>
        </header>

        <main className="p-6 max-w-7xl mx-auto">
          {/* Stats Grid - Using real data from admin.controller.js */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <StatCard title="Total Donors" value={stats?.users?.donors || 0} icon="👥" color="text-blue-600" />
            <StatCard title="Hospitals" value={stats?.users?.hospitals || 0} icon="🏥" color="text-green-600" />
            <StatCard title="Total SOS Alerts" value={stats?.sos?.total || 0} icon="🚨" color="text-red-600" />
            <StatCard title="Success Rate" value={`${stats?.sos?.successRate || 0}%`} icon="📈" color="text-purple-600" />
          </div>

          {/* Blood Type Heatmap Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Supply Heatmap */}
            <div className="bg-white rounded-xl shadow-md p-5 border-t-4 border-green-500">
              <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                🟢 Donor Supply (By Blood Type)
              </h2>
              <div className="space-y-3">
                {stats?.heatmap?.supply?.map((item) => (
                  <div key={item._id} className="flex items-center gap-3">
                    <span className="w-10 font-bold text-red-600">{item._id}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div 
                        className="bg-green-500 h-full transition-all duration-1000" 
                        style={{ width: `${(item.count / stats.users.donors) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">{item.count} Donors</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Demand Heatmap */}
            <div className="bg-white rounded-xl shadow-md p-5 border-t-4 border-red-500">
              <h2 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                🔴 SOS Demand (By Blood Type)
              </h2>
              <div className="space-y-3">
                {stats?.heatmap?.demand?.map((item) => (
                  <div key={item._id} className="flex items-center gap-3">
                    <span className="w-10 font-bold text-red-600">{item._id}</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                      <div 
                        className="bg-red-500 h-full transition-all duration-1000" 
                        style={{ width: `${(item.count / stats.sos.total) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">{item.count} Requests</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Management Actions - Now Clickable! */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <ManageCard
              title="Users List"
              subtitle="Manage Donor/Hospital status"
              icon="👤"
              link="/admin/users" 
            />
            <ManageCard
              title="SOS Monitor"
              subtitle="View all live & past alerts"
              icon="📡"
              link="/admin/sos"
            />
            <ManageCard
              title="System Logs"
              subtitle="Audit trails & reports"
              icon="📝"
              // link="/admin/logs" // Uncomment when logs page is ready
            />
          </div>
        </main>
      </div>
    </div>
  );
}

/* ---------- Sub-Components ---------- */

function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-white rounded-xl shadow p-5 flex items-center gap-4 border-b-2 border-transparent hover:border-gray-300 transition-all">
      <div className="text-4xl">{icon}</div>
      <div>
        <p className="text-xs text-gray-500 uppercase font-semibold">{title}</p>
        <p className={`text-2xl font-black ${color}`}>{value}</p>
      </div>
    </div>
  );
}

function ManageCard({ title, subtitle, icon, link }) {
  const CardContent = (
    <div className="bg-white rounded-xl shadow p-5 flex justify-between items-center group cursor-pointer hover:shadow-lg transition-all border border-transparent hover:border-red-100 h-full">
      <div className="flex items-center gap-4">
        <div className="text-3xl grayscale group-hover:grayscale-0 transition-all">{icon}</div>
        <div>
          <p className="font-bold text-gray-800">{title}</p>
          <p className="text-[10px] text-gray-400 uppercase font-semibold">{subtitle}</p>
        </div>
      </div>
      <div className="text-gray-300 group-hover:text-red-500 transition-colors">➜</div>
    </div>
  );

  // ✅ FIX: If a 'link' prop exists, wrap the card in a Link component
  return link ? <Link to={link} className="block h-full">{CardContent}</Link> : CardContent;
}