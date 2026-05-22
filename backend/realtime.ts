import jwt from "jsonwebtoken";
import { Server } from "socket.io";

let io = null;

function getUserRoom(userId) {
  return `user:${userId}`;
}

export function initRealtime(server) {
  const allowedOrigins = (process.env.FRONTEND_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  io = new Server(server, {
    cors: {
      origin: allowedOrigins.length > 0 ? allowedOrigins : true,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Missing token"));

      const user = jwt.verify(token, process.env.JWT_SECRET);
      socket.data.user = user;
      socket.join(getUserRoom(user.id));
      return next();
    } catch {
      return next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("disconnect", () => {});
  });

  return io;
}

export function emitToUser(userId, event, payload) {
  if (!io || !userId || !event) return;
  io.to(getUserRoom(userId)).emit(event, payload);
}

export function emitToUsers(userIds, event, payload) {
  for (const userId of new Set((userIds || []).filter(Boolean))) {
    emitToUser(userId, event, payload);
  }
}

export function emitToAll(event, payload) {
  if (!io || !event) return;
  io.emit(event, payload);
}
