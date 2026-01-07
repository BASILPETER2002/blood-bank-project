import axios from "axios";

// Automatically switches between Localhost (dev) and Render (prod)
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const API = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

/* ================= ATTACH TOKEN ================= */
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/* ================= HANDLE AUTH ERRORS ================= */
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      console.warn("🔒 Unauthorized / Session expired");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      
      // Prevent redirect loop if already on login
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

export default API;