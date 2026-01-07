import { useState, useEffect } from "react";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import API from "../api/axios";
import toast from "react-hot-toast";

export default function Login() {
  const { login, user } = useAuth(); // ✅ Get 'user' from context
  const navigate = useNavigate();
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "donor",
    bloodType: "A+", 
  });

  // ✅ REDIRECT LOGIC: Run this whenever 'user' updates
  useEffect(() => {
    if (user) {
      // If user is already logged in, send them to their dashboard immediately
      if (user.role === "admin") navigate("/admin");
      else if (user.role === "hospital") navigate("/hospital");
      else if (user.role === "donor") navigate("/donor");
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegistering) {
        await API.post("/api/auth/register", formData);
        toast.success("Account created! Logging you in...");
        await login(formData.email, formData.password);
      } else {
        await login(formData.email, formData.password);
      }
      
      toast.success("Welcome back!");
      // The useEffect above will handle the redirect now
      
    } catch (err) {
      console.error("Auth Error:", err);
      toast.error(err.response?.data?.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        
        {/* LEFT SIDE: BRANDING */}
        <div className="md:w-1/2 bg-gradient-to-br from-red-700 to-red-900 text-white p-10 flex flex-col justify-center">
          <h1 className="text-4xl font-black mb-4">
            {isRegistering ? "Join the Mission." : "Welcome Back."}
          </h1>
          <p className="text-red-100 text-lg mb-8">
            {isRegistering 
              ? "Connect with hospitals nearby and save lives. Every drop counts." 
              : "Access your dashboard to manage requests, view history, and save lives."}
          </p>
          <div className="space-y-4">
            <FeatureItem icon="🚑" text="Real-time SOS Alerts" />
            <FeatureItem icon="🛡️" text="Secure & Private" />
            <FeatureItem icon="🌍" text="Community Driven" />
          </div>
        </div>

        {/* RIGHT SIDE: FORM */}
        <div className="md:w-1/2 p-10 flex flex-col justify-center bg-white">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            {isRegistering ? "Create Account" : "Sign In"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {isRegistering && (
              <div className="animate-in fade-in slide-in-from-bottom-2">
                <label className="block text-sm font-bold text-gray-500 mb-1">Full Name</label>
                <input
                  type="text" name="name" required placeholder="John Doe"
                  className="w-full px-4 py-2 border rounded-lg outline-none focus:border-red-500"
                  value={formData.name} onChange={handleChange}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-500 mb-1">Email Address</label>
              <input
                type="email" name="email" required placeholder="you@example.com"
                className="w-full px-4 py-2 border rounded-lg outline-none focus:border-red-500"
                value={formData.email} onChange={handleChange}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-500 mb-1">Password</label>
              <input
                type="password" name="password" required placeholder="••••••••"
                className="w-full px-4 py-2 border rounded-lg outline-none focus:border-red-500"
                value={formData.password} onChange={handleChange}
              />
            </div>

            {isRegistering && (
              <div className="animate-in fade-in slide-in-from-bottom-2 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2">I am a...</label>
                  <div className="grid grid-cols-2 gap-3">
                    <RoleCard 
                      role="donor" current={formData.role} 
                      setRole={(r) => setFormData({ ...formData, role: r })} 
                      icon="🩸" label="Donor"
                    />
                    <RoleCard 
                      role="hospital" current={formData.role} 
                      setRole={(r) => setFormData({ ...formData, role: r })} 
                      icon="🏥" label="Hospital"
                    />
                  </div>
                </div>

                {formData.role === 'donor' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-500 mb-1">Blood Group</label>
                    <select
                      name="bloodType"
                      className="w-full px-4 py-2 border rounded-lg outline-none focus:border-red-500 bg-white"
                      value={formData.bloodType}
                      onChange={handleChange}
                    >
                      {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bt => (
                        <option key={bt} value={bt}>{bt}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg shadow-lg mt-4 transition-transform active:scale-95 disabled:opacity-50"
            >
              {loading ? "Processing..." : isRegistering ? "Create Account" : "Login"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              {isRegistering ? "Already have an account?" : "New to BloodLink?"}
              <button
                onClick={() => setIsRegistering(!isRegistering)}
                className="ml-2 text-red-600 font-bold hover:underline"
              >
                {isRegistering ? "Sign In" : "Register Now"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({ icon, text }) {
  return (
    <div className="flex items-center gap-3 bg-white/10 p-3 rounded-lg backdrop-blur-sm">
      <span className="text-2xl">{icon}</span>
      <span className="font-semibold">{text}</span>
    </div>
  );
}

function RoleCard({ role, current, setRole, icon, label }) {
  const isSelected = current === role;
  return (
    <div
      onClick={() => setRole(role)}
      className={`cursor-pointer border-2 rounded-lg p-2 flex items-center justify-center gap-2 transition-all ${
        isSelected ? "border-red-600 bg-red-50 text-red-700" : "border-gray-200 text-gray-500"
      }`}
    >
      <span className="text-xl">{icon}</span>
      <span className="font-bold">{label}</span>
    </div>
  );
}