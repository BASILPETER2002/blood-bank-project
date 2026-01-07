import { io } from "socket.io-client";

// Automatically switches between Localhost (dev) and Render (prod)
const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true, // Crucial for production CORS
  transports: ["websocket", "polling"], // Fallback mechanisms
});

export const connectSocket = (token) => {
  if (!socket.connected) {
    socket.auth = { token };
    socket.connect();
    console.log("🔌 Connecting socket to:", SOCKET_URL);
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
    console.log("🔌 Socket disconnected");
  }
};

socket.on("connect", () => {
  console.log("✅ Socket connected ID:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("❌ Socket error:", err.message);
});

export default socket;