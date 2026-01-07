import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function Sidebar() {
  const { user, logout } = useAuth(); // ✅ Use context properly

  return (
    <div className="h-screen w-64 bg-gray-900 text-white flex flex-col">
      <div className="p-5 text-xl font-bold border-b border-gray-700 flex items-center gap-2">
        <span>🩸</span> Blood Bank
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {user?.role === "admin" && (
          <NavItem to="/admin">Admin Dashboard</NavItem>
        )}

        {user?.role === "hospital" && (
          <>
            <NavItem to="/hospital">Hospital Dashboard</NavItem>
            {/* Add more hospital links here */}
          </>
        )}

        {user?.role === "donor" && (
          <>
            <NavItem to="/donor">Donor Dashboard</NavItem>
            {/* Add more donor links here */}
          </>
        )}
      </nav>

      {/* ✅ Use the Context logout function to prevent redirect loops */}
      <button
        onClick={logout}
        className="m-4 bg-red-600 py-3 rounded font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
      >
        <span>🚪</span> Logout
      </button>
    </div>
  );
}

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block px-3 py-2 rounded transition-colors ${
          isActive ? "bg-red-600 font-bold" : "hover:bg-gray-700 text-gray-300"
        }`
      }
    >
      {children}
    </NavLink>
  );
}