import { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import API from "../../api/axios";
import toast from "react-hot-toast";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all, donor, hospital
  const [searchQuery, setSearchQuery] = useState(""); // 🔍 Added search state

  const fetchUsers = async () => {
    try {
      const res = await API.get("/api/admin/users");
      setUsers(res.data.users || []);
    } catch (err) {
      toast.error("Failed to load user directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (userId) => {
    try {
      const res = await API.patch(`/api/admin/users/${userId}/toggle`);
      toast.success(res.data.message);
      fetchUsers(); // Refresh list to show new status
    } catch (err) {
      toast.error(err.response?.data?.message || "Action failed");
    }
  };

  /* ================= FILTER & SEARCH LOGIC ================= */
  const filteredUsers = users.filter((user) => {
    // 1. Role Filter
    const matchesRole = filter === "all" || user.role === filter;
    
    // 2. Search Query (matches name or email)
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesRole && matchesSearch;
  });

  if (loading) return <div className="p-10 text-center font-bold">Loading User Directory...</div>;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1">
        <header className="bg-white border-b px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-xl font-bold text-gray-800">👥 User Management</h1>
          
          {/* SEARCH & FILTER CONTROLS */}
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <input 
              type="text" 
              placeholder="Search name or email..." 
              className="px-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-red-500 w-full sm:w-64 shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            <div className="flex bg-gray-100 p-1 rounded-lg">
              {["all", "donor", "hospital"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-4 py-1 rounded-md text-xs capitalize font-bold transition-all ${
                    filter === type ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {type}s
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="p-6 max-w-7xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden border">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b text-[10px] uppercase text-gray-400 font-black tracking-widest">
                  <th className="px-6 py-4">User Information</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Account Health</th>
                  <th className="px-6 py-4 text-right">System Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-red-50/30 transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-800 group-hover:text-red-600 transition-colors">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          user.role === 'hospital' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                          <span className={`text-xs font-bold ${user.isActive ? 'text-gray-700' : 'text-red-600'}`}>
                            {user.isActive ? 'ACTIVE' : 'SUSPENDED'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {user.role !== 'admin' ? (
                          <button
                            onClick={() => handleToggleStatus(user._id)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all shadow-sm ${
                              user.isActive 
                              ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white' 
                              : 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-600 hover:text-white'
                            }`}
                          >
                            {user.isActive ? 'DEACTIVATE' : 'ACTIVATE'}
                          </button>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-300 uppercase tracking-tighter">System Protected</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-10 text-center text-gray-400 italic">
                      No users found matching "{searchQuery}" in {filter}s category.
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