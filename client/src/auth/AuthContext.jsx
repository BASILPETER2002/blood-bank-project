import { createContext, useContext, useEffect, useRef, useState } from "react";
import API from "../api/axios";
import socket, { connectSocket, disconnectSocket } from "../socket"; 

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const socketInitialized = useRef(false);

  /* ================= RESTORE SESSION ================= */
  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          API.defaults.headers.common.Authorization = `Bearer ${storedToken}`;
          
          if (!socketInitialized.current) {
            connectSocket(storedToken);
            socketInitialized.current = true;
          }
        } catch (err) {
          console.error("Session restore failed:", err);
          logout(); 
        }
      }
      setLoading(false);
    };

    restoreSession();
  }, []);

  /* ================= LOGIN ================= */
  const login = async (email, password) => {
    const res = await API.post("/api/auth/login", { email, password });
    const { user, accessToken } = res.data;

    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("token", accessToken);
    API.defaults.headers.common.Authorization = `Bearer ${accessToken}`;

    setUser(user);

    if (!socketInitialized.current) {
      connectSocket(accessToken);
      socketInitialized.current = true;
    }

    return user;
  };

  /* ================= LOGOUT (FIXED) ================= */
  const logout = () => {
    // 1. Disconnect Socket
    try {
      disconnectSocket();
    } catch (e) { console.error(e); }
    socketInitialized.current = false;

    // 2. Clear Storage & API
    localStorage.clear();
    delete API.defaults.headers.common.Authorization;

    // 3. Clear State
    setUser(null);

    // 4. ✅ HARD REDIRECT to clear memory and prevent "Redirect Loops"
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}