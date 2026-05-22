import express from "express";
import prisma from "../database.js";
import authMiddleware from "../middleware/authMiddleware.js";
import { ensureDueTaskNotifications, toNotificationResponse } from "../utils/notifications.js";
import { emitToUser } from "../realtime.js";

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    await ensureDueTaskNotifications(prisma, req.user.id);

    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: req.user.id },
        orderBy: [{ readAt: "asc" }, { createdAt: "desc" }],
        take: 30,
        include: {
          actor: {
            include: { studentProfile: true },
          },
        },
      }),
      prisma.notification.count({
        where: {
          userId: req.user.id,
          readAt: null,
        },
      }),
    ]);

    return res.json({
      unreadCount,
      notifications: notifications.map(toNotificationResponse),
    });
  } catch (error) {
    console.error("NOTIFICATION LIST ERROR:", error);
    return res.status(500).json({ message: "Lỗi server khi tải thông báo" });
  }
});

router.patch("/:notificationId/read", authMiddleware, async (req, res) => {
  try {
    const notificationId = Number(req.params.notificationId);
    if (!Number.isInteger(notificationId)) {
      return res.status(400).json({ message: "Thông báo không hợp lệ" });
    }

    const result = await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId: req.user.id,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: req.user.id,
        readAt: null,
      },
    });

    if (result.count > 0) {
      emitToUser(req.user.id, "notification:changed", { type: "read", unreadCount });
    }

    return res.json({ unreadCount, updated: result.count });
  } catch (error) {
    console.error("READ NOTIFICATION ERROR:", error);
    return res.status(500).json({ message: "Lỗi server khi cập nhật thông báo" });
  }
});

router.patch("/read-all", authMiddleware, async (req, res) => {
  try {
    const result = await prisma.notification.updateMany({
      where: {
        userId: req.user.id,
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
    if (result.count > 0) {
      emitToUser(req.user.id, "notification:changed", { type: "read_all", unreadCount: 0 });
    }

    return res.json({ unreadCount: 0, updated: result.count });
  } catch (error) {
    console.error("READ ALL NOTIFICATIONS ERROR:", error);
    return res.status(500).json({ message: "Lỗi server khi cập nhật thông báo" });
  }
});

export default router;
