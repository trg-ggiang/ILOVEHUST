import { io } from "socket.io-client";

let socket = null;

export function getSocket() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL || "/", {
      path: "/socket.io",
      auth: { token },
      transports: ["websocket"],
      autoConnect: true,
    });
    return socket;
  }

  socket.auth = { token };
  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function disconnectSocket() {
  if (!socket) return;
  socket.disconnect();
  socket = null;
}
