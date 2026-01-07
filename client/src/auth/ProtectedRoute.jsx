import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth(); // ✅ Get loading state from context

  // 1. If the Auth provider is still restoring the session, show a loader
  // This prevents being kicked to /login before the token is verified.
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  // 2. If no user is logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 3. If a specific role is required and the user doesn't have it, redirect
  if (role && user.role !== role) {
    console.warn(`⛔ Access Denied: User role [${user.role}] does not match required [${role}]`);
    
    // Redirect to their specific dashboard instead of login
    return <Navigate to={`/${user.role}`} replace />;
  }

  return children;
}