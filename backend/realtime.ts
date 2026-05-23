import jwt from "jsonwebtoken";
import { Server } from "socket.io";
import { getJwtSecret } from "./config/env.js";
import prisma from "./database.js";

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

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Missing token"));

      const payload = jwt.verify(token, getJwtSecret());
      if (typeof payload === "string" || !Number.isInteger(Number(payload.id))) {
        return next(new Error("Invalid token"));
      }

      const user = await prisma.user.findUnique({
        where: { id: Number(payload.id) },
        select: {
          id: true,
          email: true,
          role: true,
          isActive: true,
        },
      });

      if (!user?.isActive) {
        return next(new Error("Inactive account"));
      }

      socket.data.user = {
        id: user.id,
        email: user.email,
        role: user.role,
      };
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
