import "dotenv/config";
import express from "express";
import systemRoutes from "./routes/systemRoutes.js";
import authRoutes from "./routes/admin/authRoutes.js";
import majorRoutes from "./routes/major/majorRoutes.js";
import studentRoutes from "./routes/student/studentRoutes.js";
import forumRoutes from "./routes/student/forumRoutes.js";
import messageRoutes from "./routes/student/messageRoutes.js";
import scheduleRoutes from "./routes/student/scheduleRoutes.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use("/", systemRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/majors", majorRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/forum", forumRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/schedule", scheduleRoutes);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

