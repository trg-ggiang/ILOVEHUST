import "dotenv/config";
import http from "http";
import express from "express";
import cors from "cors";
import systemRoutes from "./routes/systemRoutes.js";
import authRoutes from "./routes/admin/authRoutes.js";
import adminRoutes from "./routes/admin/adminRoutes.js";
import majorRoutes from "./routes/major/majorRoutes.js";
import studentRoutes from "./routes/student/studentRoutes.js";
import forumRoutes from "./routes/student/forumRoutes.js";
import messageRoutes from "./routes/student/messageRoutes.js";
import scheduleRoutes from "./routes/student/scheduleRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import { initRealtime } from "./realtime.js";
import { assertRequiredEnv } from "./config/env.js";

const app = express();
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const isVercel = process.env.VERCEL === "1";
assertRequiredEnv();
const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use("/", systemRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/majors", majorRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/forum", forumRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/schedule", scheduleRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai", aiRoutes);

if (!isVercel) {
  initRealtime(server);

  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

export default app;
export { app, server };

