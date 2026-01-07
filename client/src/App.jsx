import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import DonorDashboard from "./pages/Donor/DonorDashboard";
import HospitalDashboard from "./pages/Hospital/HospitalDashboard";
import AdminDashboard from "./pages/Admin/AdminDashboard";
import AdminUsers from "./pages/Admin/AdminUsers";
import AdminSOS from "./pages/Admin/AdminSOS";
import ProtectedRoute from "./auth/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />

        {/* Donor Routes */}
        <Route
          path="/donor"
          element={
            <ProtectedRoute role="donor">
              <DonorDashboard />
            </ProtectedRoute>
          }
        />

        {/* Hospital Routes */}
        <Route
          path="/hospital"
          element={
            <ProtectedRoute role="hospital">
              <HospitalDashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes Group */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        
        {/* ✅ User Management Page */}
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute role="admin">
              <AdminUsers />
            </ProtectedRoute>
          }
        />

        {/* ✅ SOS Monitor Page */}
        <Route
          path="/admin/sos"
          element={
            <ProtectedRoute role="admin">
              <AdminSOS />
            </ProtectedRoute>
          }
        />

        {/* Catch-all: Redirect unknown routes to login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}