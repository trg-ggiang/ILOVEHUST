import express from "express";
import prisma from "../../database.js";
import authMiddleware from "../../middleware/authMiddleware.js";

const router = express.Router();

const DAY_LABELS = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];
const TIME_SLOTS = ["06:00", "07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00"];
const EVENT_TYPES = new Set(["study", "play", "exam", "assignment", "presentation", "other"]);

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

function getMonthStart(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function getMonthEnd(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

function daysDateForWeekday(weekStart, weekday) {
  return toDateOnly(addDays(weekStart, Math.max(Number(weekday) || 1, 1) - 1));
}

function getClassHours(item) {
  const [startHour, startMinute] = item.startTime.split(":").map(Number);
  const [endHour, endMinute] = item.endTime.split(":").map(Number);
  const start = startHour + (startMinute || 0) / 60;
  const end = endHour + (endMinute || 0) / 60;
  return Math.max(0, end - start);
}

function getTimeHour(value) {
  const [hour, minute] = String(value || "00:00").split(":").map(Number);
  return (hour || 0) + (minute || 0) / 60;
}

function getTimeMinutes(value) {
  const [hour, minute] = String(value || "00:00").split(":").map(Number);
  return ((hour || 0) * 60) + (minute || 0);
}

function mergeScheduleClasses(classes) {
  const sorted = [...classes].sort((a, b) =>
    `${a.weekday}-${a.subject}-${a.room || ""}-${a.startTime}`.localeCompare(`${b.weekday}-${b.subject}-${b.room || ""}-${b.startTime}`)
  );
  const merged = [];

  for (const item of sorted) {
    const previous = merged[merged.length - 1];
    const sameBlock =
      previous &&
      previous.weekday === item.weekday &&
      previous.subject === item.subject &&
      previous.room === item.room &&
      previous.classType === item.classType &&
      previous.color === item.color &&
      previous.endTime === item.startTime;

    if (sameBlock) {
      previous.endTime = item.endTime;
      previous.id = `${previous.id}-${item.id}`;
    } else {
      merged.push({ ...item });
    }
  }

  return merged;
}

function toClassResponse(item) {
  const start = getTimeHour(item.startTime);
  const end = getTimeHour(item.endTime);
  const durationSlots = Math.max(1, Math.ceil(end - start));
  const startMinutes = getTimeMinutes(item.startTime);
  const endMinutes = getTimeMinutes(item.endTime);

  return {
    id: item.id,
    source: "class",
    subject: item.subject,
    title: item.subject,
    type: item.classType,
    time: `${item.startTime} - ${item.endTime}`,
    startTime: item.startTime,
    endTime: item.endTime,
    startHour: Number(item.startTime.slice(0, 2)),
    endHour: Number(item.endTime.slice(0, 2)),
    startMinutes,
    endMinutes,
    durationMinutes: Math.max(30, endMinutes - startMinutes),
    durationSlots,
    room: item.room || "",
    day: item.weekday,
    color: item.color,
  };
}

function toEventResponse(item) {
  const startMinutes = item.eventTime ? getTimeMinutes(item.eventTime) : 8 * 60;
  const rawEndMinutes = item.endTime ? getTimeMinutes(item.endTime) : startMinutes + 60;
  const endMinutes = rawEndMinutes > startMinutes ? rawEndMinutes : startMinutes + 60;

  return {
    id: item.id,
    source: "event",
    title: item.title,
    date: toDateOnly(item.eventDate),
    time: item.eventTime || "",
    endTime: item.endTime || "",
    type: item.eventType,
    color: item.color,
    startHour: item.eventTime ? Number(item.eventTime.slice(0, 2)) : 8,
    startMinutes,
    endMinutes,
    durationMinutes: Math.max(30, endMinutes - startMinutes),
    durationSlots: Math.max(1, Math.ceil((endMinutes - startMinutes) / 60)),
  };
}

function toTaskCalendarResponse(task) {
  const priority = String(task.priority || "medium");
  return {
    id: `task-${task.id}`,
    taskId: task.id,
    source: "task",
    title: task.title,
    date: toDateOnly(task.dueAt),
    time: "",
    type: "task",
    color: priority === "high" ? "red" : priority === "low" ? "green" : "blue",
    completed: task.completed,
    startHour: 8,
    startMinutes: 8 * 60,
    endMinutes: 9 * 60,
    durationMinutes: 60,
    durationSlots: 1,
  };
}

async function buildSchedulePayload(userId, selectedDate, viewMode = "week") {
  const normalizedViewMode = viewMode === "month" ? "month" : viewMode === "day" ? "day" : "week";
  const weekStart = getWeekStart(selectedDate);
  const weekEnd = addDays(weekStart, 6);
  const monthStart = getMonthStart(selectedDate);
  const monthEnd = getMonthEnd(selectedDate);
  const rangeStart = normalizedViewMode === "month" ? getWeekStart(monthStart) : weekStart;
  const rangeEnd = normalizedViewMode === "month" ? addDays(getWeekStart(monthEnd), 6) : weekEnd;
  const selectedWeekday = getWeekday(selectedDate);

  const [classes, weekEvents, upcomingEvents, weekTasks, upcomingTasks] = await Promise.all([
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
          gte: rangeStart,
          lte: rangeEnd,
        },
      },
      orderBy: [{ eventDate: "asc" }, { eventTime: "asc" }, { createdAt: "asc" }],
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
    prisma.studentTask.findMany({
      where: {
        userId,
        completed: false,
        dueAt: {
          gte: rangeStart,
          lte: addDays(rangeEnd, 1),
        },
      },
      orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
    }),
    prisma.studentTask.findMany({
      where: {
        userId,
        completed: false,
        dueAt: {
          gte: selectedDate,
        },
      },
      orderBy: [{ dueAt: "asc" }, { createdAt: "asc" }],
      take: 6,
    }),
  ]);

  const mergedClasses = mergeScheduleClasses(classes);
  const classItems = mergedClasses.map(toClassResponse);
  const eventItems = weekEvents.map(toEventResponse);
  const taskItems = weekTasks.filter((task) => task.dueAt).map(toTaskCalendarResponse);
  const days = Array.from({ length: Math.round((rangeEnd.getTime() - rangeStart.getTime()) / 86400000) + 1 }, (_item, index) => {
    const date = addDays(rangeStart, index);
    const dateOnly = toDateOnly(date);
    const weekday = getWeekday(date);

    return {
      weekday,
      label: DAY_LABELS[weekday - 1],
      date: dateOnly,
      displayDate: `${date.getUTCDate().toString().padStart(2, "0")}/${(date.getUTCMonth() + 1).toString().padStart(2, "0")}`,
      dayNumber: date.getUTCDate(),
      isSelected: dateOnly === toDateOnly(selectedDate),
      isCurrentMonth: date.getUTCMonth() === selectedDate.getUTCMonth(),
    };
  });
  const recurringClassItems = normalizedViewMode === "month"
    ? days.flatMap((day) =>
        classItems
          .filter((item) => item.day === day.weekday)
          .map((item) => ({ ...item, date: day.date }))
      )
    : classItems.map((item) => ({
        ...item,
        date: daysDateForWeekday(weekStart, item.day),
      }));
  const calendarItems = [
    ...recurringClassItems,
    ...eventItems,
    ...taskItems,
  ];
  const studyDays = new Set(mergedClasses.map((item) => item.weekday));
  const rooms = new Set(mergedClasses.map((item) => item.room).filter(Boolean));
  const weeklyHours = mergedClasses.reduce((sum, item) => sum + getClassHours(item), 0);
  const visibleDays = normalizedViewMode === "day"
    ? days.filter((day) => day.isSelected)
    : normalizedViewMode === "week"
      ? days.slice(0, 7)
      : days;

  return {
    selectedDate: toDateOnly(selectedDate),
    selectedWeekday,
    viewMode: normalizedViewMode,
    weekStart: toDateOnly(weekStart),
    weekEnd: toDateOnly(weekEnd),
    monthStart: toDateOnly(monthStart),
    monthEnd: toDateOnly(monthEnd),
    days,
    visibleDays,
    timeSlots: TIME_SLOTS,
    classes: classItems,
    calendarItems,
    selectedDayClasses: classItems.filter((item) => item.day === selectedWeekday),
    selectedDayEvents: calendarItems.filter((item) => item.date === toDateOnly(selectedDate)),
    upcomingEvents: [
      ...upcomingEvents.map(toEventResponse),
      ...upcomingTasks.filter((task) => task.dueAt).map(toTaskCalendarResponse),
    ]
      .sort((a, b) => `${a.date} ${a.time || "23:59"}`.localeCompare(`${b.date} ${b.time || "23:59"}`))
      .slice(0, 8),
    stats: {
      weeklyClasses: mergedClasses.length,
      studyDays: studyDays.size,
      weeklyHours: Number(weeklyHours.toFixed(1)),
      rooms: rooms.size,
      weeklyEvents: eventItems.length + taskItems.length,
    },
  };
}

router.get("/", authMiddleware, async (req, res) => {
  try {
    const selectedDate = parseDateOnly(req.query.date) || new Date();
    const viewMode = req.query.view === "month" ? "month" : req.query.view === "day" ? "day" : "week";
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
    const rawStartTime = String(req.body?.startTime || req.body?.time || "").trim();
    const rawEndTime = String(req.body?.endTime || "").trim();
    const eventTime = rawStartTime && /^\d{2}:\d{2}$/.test(rawStartTime) ? rawStartTime : null;
    const endTime = rawEndTime && /^\d{2}:\d{2}$/.test(rawEndTime) ? rawEndTime : null;
    const eventType = EVENT_TYPES.has(req.body?.type) ? req.body.type : "other";

    if (!title) {
      return res.status(400).json({ message: "Tiêu đề sự kiện không được để trống" });
    }

    if (!eventDate) {
      return res.status(400).json({ message: "Ngày sự kiện không hợp lệ" });
    }

    if (eventTime && endTime && getTimeMinutes(endTime) <= getTimeMinutes(eventTime)) {
      return res.status(400).json({ message: "Giá» káº¿t thÃºc pháº£i sau giá» báº¯t Ä‘áº§u" });
    }

    await prisma.studentScheduleEvent.create({
      data: {
        userId: req.user.id,
        title,
        eventDate,
        eventTime,
        endTime,
        eventType,
        color:
          eventType === "exam"
            ? "red"
            : eventType === "assignment" || eventType === "study"
              ? "blue"
              : eventType === "play"
                ? "green"
                : eventType === "presentation"
                  ? "orange"
                  : "purple",
      },
    });

    return res.status(201).json(await buildSchedulePayload(req.user.id, eventDate, "week"));
  } catch (error) {
    console.error("CREATE SCHEDULE EVENT ERROR:", error);
    return res.status(500).json({ message: "Lỗi server khi tạo sự kiện" });
  }
});

export default router;
