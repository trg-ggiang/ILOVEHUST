import express from "express";
import prisma from "../../database.js";
import authMiddleware from "../../middleware/authMiddleware.js";

const router = express.Router();

const DAY_LABELS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];
const TIME_SLOTS = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
const EVENT_TYPES = new Set(["exam", "assignment", "presentation", "other"]);

function parseDateOnly(value) {
  const input = String(value || "").trim();
  const match = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function toDateOnly(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + amount);
  return next;
}

function getWeekday(date) {
  const day = date.getUTCDay();
  return day === 0 ? 7 : day;
}

function getWeekStart(date) {
  return addDays(date, -(getWeekday(date) - 1));
}

function getClassHours(item) {
  const [startHour, startMinute] = item.startTime.split(":").map(Number);
  const [endHour, endMinute] = item.endTime.split(":").map(Number);
  const start = startHour + (startMinute || 0) / 60;
  const end = endHour + (endMinute || 0) / 60;
  return Math.max(0, end - start);
}

function toClassResponse(item) {
  return {
    id: item.id,
    subject: item.subject,
    type: item.classType,
    time: `${item.startTime} - ${item.endTime}`,
    startTime: item.startTime,
    endTime: item.endTime,
    startHour: Number(item.startTime.slice(0, 2)),
    room: item.room || "",
    day: item.weekday,
    color: item.color,
  };
}

function toEventResponse(item) {
  return {
    id: item.id,
    title: item.title,
    date: toDateOnly(item.eventDate),
    time: item.eventTime || "",
    type: item.eventType,
    color: item.color,
  };
}

async function buildSchedulePayload(userId, selectedDate, viewMode = "week") {
  const weekStart = getWeekStart(selectedDate);
  const weekEnd = addDays(weekStart, 6);
  const selectedWeekday = getWeekday(selectedDate);

  const [classes, upcomingEvents] = await Promise.all([
    prisma.studentScheduleClass.findMany({
      where: {
        userId,
        isActive: true,
      },
      orderBy: [{ weekday: "asc" }, { startTime: "asc" }],
    }),
    prisma.studentScheduleEvent.findMany({
      where: {
        userId,
        eventDate: {
          gte: selectedDate,
        },
      },
      orderBy: [{ eventDate: "asc" }, { eventTime: "asc" }, { createdAt: "asc" }],
      take: 6,
    }),
  ]);

  const classItems = classes.map(toClassResponse);
  const studyDays = new Set(classes.map((item) => item.weekday));
  const rooms = new Set(classes.map((item) => item.room).filter(Boolean));
  const weeklyHours = classes.reduce((sum, item) => sum + getClassHours(item), 0);
  const days = DAY_LABELS.map((label, index) => {
    const date = addDays(weekStart, index);
    const dateOnly = toDateOnly(date);

    return {
      weekday: index + 1,
      label,
      date: dateOnly,
      displayDate: `${date.getUTCDate().toString().padStart(2, "0")}/${(date.getUTCMonth() + 1).toString().padStart(2, "0")}`,
      isSelected: dateOnly === toDateOnly(selectedDate),
    };
  });

  const visibleDays = viewMode === "day"
    ? days.filter((day) => day.isSelected)
    : days;

  return {
    selectedDate: toDateOnly(selectedDate),
    selectedWeekday,
    viewMode: viewMode === "day" ? "day" : "week",
    weekStart: toDateOnly(weekStart),
    weekEnd: toDateOnly(weekEnd),
    days,
    visibleDays,
    timeSlots: TIME_SLOTS,
    classes: classItems,
    selectedDayClasses: classItems.filter((item) => item.day === selectedWeekday),
    upcomingEvents: upcomingEvents.map(toEventResponse),
    stats: {
      weeklyClasses: classes.length,
      studyDays: studyDays.size,
      weeklyHours: Number(weeklyHours.toFixed(1)),
      rooms: rooms.size,
    },
  };
}

router.get("/", authMiddleware, async (req, res) => {
  try {
    const selectedDate = parseDateOnly(req.query.date) || parseDateOnly("2026-04-28");
    const viewMode = req.query.view === "day" ? "day" : "week";
    return res.json(await buildSchedulePayload(req.user.id, selectedDate, viewMode));
  } catch (error) {
    console.error("SCHEDULE LIST ERROR:", error);
    return res.status(500).json({ message: "Lỗi server khi tải lịch học" });
  }
});

router.post("/events", authMiddleware, async (req, res) => {
  try {
    const title = String(req.body?.title || "").trim();
    const eventDate = parseDateOnly(req.body?.date);
    const rawTime = String(req.body?.time || "").trim();
    const eventTime = rawTime && /^\d{2}:\d{2}$/.test(rawTime) ? rawTime : null;
    const eventType = EVENT_TYPES.has(req.body?.type) ? req.body.type : "other";

    if (!title) {
      return res.status(400).json({ message: "Tiêu đề sự kiện không được để trống" });
    }

    if (!eventDate) {
      return res.status(400).json({ message: "Ngày sự kiện không hợp lệ" });
    }

    await prisma.studentScheduleEvent.create({
      data: {
        userId: req.user.id,
        title,
        eventDate,
        eventTime,
        eventType,
        color: eventType === "exam" ? "red" : eventType === "assignment" ? "blue" : eventType === "presentation" ? "green" : "purple",
      },
    });

    return res.status(201).json(await buildSchedulePayload(req.user.id, eventDate, "week"));
  } catch (error) {
    console.error("CREATE SCHEDULE EVENT ERROR:", error);
    return res.status(500).json({ message: "Lỗi server khi tạo sự kiện" });
  }
});

export default router;
