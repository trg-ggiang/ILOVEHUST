import express from "express";
import fs from "fs";
import path from "path";
import multer from "multer";
import prisma from "../../database.js";
import authMiddleware from "../../middleware/authMiddleware.js";
import toUserResponse from "../../utils/toUserResponse.js";
import { ensureDueTaskNotifications } from "../../utils/notifications.js";

const router = express.Router();
const avatarUploadDir = path.resolve("uploads/avatars");

fs.mkdirSync(avatarUploadDir, { recursive: true });

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: avatarUploadDir,
    filename: (_req, file, cb) => {
      const extension = path.extname(file.originalname || "").toLowerCase();
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("INVALID_IMAGE"));
      return;
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 1,
  },
});
const TASK_PRIORITIES = new Set(["high", "medium", "low", "normal"]);
const PROGRAM_CREDIT_TARGET = 150;
const STUDY_DAY_LABELS = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const GRADE_BUCKETS = [
  { grade: "A+", min: 9 },
  { grade: "A", min: 8.5 },
  { grade: "B+", min: 8 },
  { grade: "B", min: 7 },
  { grade: "C+", min: 6.5 },
  { grade: "C", min: 5.5 },
  { grade: "D", min: 4 },
  { grade: "F", min: -Infinity },
];
const SKILL_RULES = [
  { skill: "Lap trinh", label: "Lập trình", target: 90, keywords: ["lap trinh", "program", "ung dung"] },
  { skill: "Thuat toan", label: "Thuật toán", target: 90, keywords: ["giai thuat", "cau truc", "algorithm"] },
  { skill: "Database", label: "Database", target: 95, keywords: ["du lieu", "database", "csdl", "sql"] },
  { skill: "Web Dev", label: "Web Dev", target: 90, keywords: ["web"] },
  { skill: "AI/ML", label: "AI/ML", target: 85, keywords: ["tri tue", "hoc may", "machine", "ai"] },
];

function formatSemesterLabel(semesterCode, termNumber) {
  if (!semesterCode) return `Term ${termNumber}`;
  const match = String(semesterCode).match(/^(\d{4})[-.](\d{1,2})$/);
  if (match) return `${match[1]}.${match[2]}`;
  return String(semesterCode).replace("-", ".");
}

function getTodayWeekday() {
  const day = new Date().getDay();
  return day === 0 ? 7 : day;
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function roundNumber(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((Number(value) || 0) * factor) / factor;
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getClassHours(startTime, endTime) {
  const [startHour, startMinute] = String(startTime || "00:00").split(":").map(Number);
  const [endHour, endMinute] = String(endTime || "00:00").split(":").map(Number);
  const start = (startHour || 0) + (startMinute || 0) / 60;
  const end = (endHour || 0) + (endMinute || 0) / 60;
  return Math.max(0, end - start);
}

function buildSemesterStatistics(gradeRecords) {
  const buckets = new Map();

  for (const item of gradeRecords) {
    const key = item.semesterId;
    const score4 = item.score4 ? Number(item.score4) : null;
    const credits = item.course?.credits || 0;

    if (!buckets.has(key)) {
      buckets.set(key, {
        semesterId: item.semesterId,
        sortKey: `${item.semester?.academicYear || ""}-${item.semester?.termNumber || 0}-${item.semester?.semesterCode || ""}`,
        label: formatSemesterLabel(item.semester?.semesterCode, item.semester?.termNumber || 0),
        totalScore4: 0,
        countScore4: 0,
        credits: 0,
      });
    }

    const bucket = buckets.get(key);
    bucket.credits += credits;
    if (score4 !== null) {
      bucket.totalScore4 += score4;
      bucket.countScore4 += 1;
    }
  }

  return [...buckets.values()]
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
    .map((bucket, index) => ({
      semester: `HK${index + 1}`,
      label: bucket.label,
      gpa: bucket.countScore4 > 0 ? roundNumber(bucket.totalScore4 / bucket.countScore4, 2) : 0,
      credits: bucket.credits,
    }));
}

function getGradeBucket(record) {
  const score10 = record.score10 ? Number(record.score10) : null;
  if (score10 !== null) {
    return GRADE_BUCKETS.find((bucket) => score10 >= bucket.min)?.grade || "F";
  }

  const letter = String(record.letterScore || "").trim().toUpperCase();
  return letter || null;
}

function buildGradeDistribution(gradeRecords) {
  const counts = new Map(GRADE_BUCKETS.map((bucket) => [bucket.grade, 0]));
  let total = 0;

  for (const record of gradeRecords) {
    const bucket = getGradeBucket(record);
    if (!bucket) continue;
    counts.set(bucket, (counts.get(bucket) || 0) + 1);
    total += 1;
  }

  if (total === 0) return [];

  return GRADE_BUCKETS
    .map((bucket) => ({
      grade: bucket.grade,
      count: counts.get(bucket.grade) || 0,
      value: roundNumber(((counts.get(bucket.grade) || 0) / total) * 100, 1),
    }))
    .filter((item) => item.count > 0);
}

function buildStudyTime(scheduleClasses) {
  return STUDY_DAY_LABELS.map((day, index) => {
    const weekday = index + 1;
    const classHours = scheduleClasses
      .filter((item) => item.weekday === weekday)
      .reduce((sum, item) => sum + getClassHours(item.startTime, item.endTime), 0);

    return {
      day,
      classHours: roundNumber(classHours, 1),
      selfStudyHours: 0,
      hours: roundNumber(classHours, 1),
    };
  }).filter((item) => item.hours > 0);
}

function averageScorePercent(records) {
  const scores = records
    .map((item) => (item.score10 ? Number(item.score10) * 10 : null))
    .filter((value) => Number.isFinite(value));

  if (!scores.length) return null;
  return Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length);
}

function buildSkillProgress(gradeRecords, forumContribution) {
  if (!gradeRecords.length && forumContribution <= 0) return [];

  const normalizedRecords = gradeRecords.map((record) => ({
    ...record,
    normalizedName: normalizeText(`${record.course?.courseName || ""} ${record.course?.courseCode || ""}`),
  }));
  const overallPercent = averageScorePercent(gradeRecords);

  const gradeSkills = SKILL_RULES.flatMap((rule) => {
    const matchingRecords = normalizedRecords.filter((record) =>
      rule.keywords.some((keyword) => record.normalizedName.includes(keyword))
    );
    const averagePercent = averageScorePercent(matchingRecords);
    if (averagePercent === null && overallPercent === null) return [];
    const current = clampNumber(averagePercent ?? overallPercent, 0, 100);

    return [{
      key: rule.skill,
      skill: rule.label,
      current,
      target: rule.target,
    }];
  });

  const softSkill = forumContribution > 0
    ? [{
      key: "Soft Skills",
      skill: "Soft Skills",
      current: clampNumber(Math.min(forumContribution * 10, 100), 0, 100),
      target: 85,
    }]
    : [];

  return [...gradeSkills, ...softSkill];
}

function buildCohortGpas(recordsByUser) {
  const buckets = new Map();

  for (const record of recordsByUser) {
    const score4 = record.score4 ? Number(record.score4) : null;
    if (score4 === null) continue;

    const bucket = buckets.get(record.userId) || { total: 0, count: 0 };
    bucket.total += score4;
    bucket.count += 1;
    buckets.set(record.userId, bucket);
  }

  return [...buckets.values()]
    .filter((bucket) => bucket.count > 0)
    .map((bucket) => roundNumber(bucket.total / bucket.count, 2));
}

function getGradeRank(avgGPA) {
  if (avgGPA === null || avgGPA === undefined) return "-";
  if (avgGPA >= 8.5) return "A+";
  if (avgGPA >= 7) return "A";
  if (avgGPA >= 5.5) return "B";
  return "C";
}

function toGradeResponse(item) {
  const semesterLabel = formatSemesterLabel(
    item.semester?.semesterCode,
    item.semester?.termNumber || 0
  );

  return {
    id: item.id,
    subject: item.course?.courseName || "Unknown",
    code: item.course?.courseCode || "",
    credits: item.course?.credits || 0,
    midterm: item.processScore ? Number(item.processScore) : null,
    final: item.examScore ? Number(item.examScore) : null,
    avg: item.score10 ? Number(item.score10) : null,
    semester: semesterLabel,
    status: item.resultStatus?.toUpperCase() === "PASSED" ? "Đạt" : "Chưa đạt",
    statusKey: item.resultStatus?.toUpperCase() === "PASSED" ? "passed" : "failed",
  };
}

function buildGradeScoreDistribution(grades) {
  const buckets = [
    { key: "excellent", min: 9, color: "#10b981", count: 0 },
    { key: "good", min: 8, color: "#3b82f6", count: 0 },
    { key: "fair", min: 7, color: "#f59e0b", count: 0 },
    { key: "average", min: -Infinity, color: "#ef4444", count: 0 },
  ];

  const validGrades = grades.filter((grade) => typeof grade.avg === "number");

  for (const grade of validGrades) {
    const score = Number(grade.avg);
    const bucket = buckets.find((item) => score >= item.min);
    if (bucket) bucket.count += 1;
  }

  const total = validGrades.length || 1;
  return buckets.map((bucket) => ({
    key: bucket.key,
    color: bucket.color,
    count: bucket.count,
    percentage: Math.round((bucket.count / total) * 100),
  }));
}

function buildGradeStats(grades) {
  const validGrades = grades.filter((grade) => typeof grade.avg === "number");
  const totalCredits = validGrades.reduce((sum, grade) => sum + (grade.credits || 0), 0);
  const weighted = validGrades.reduce(
    (sum, grade) => sum + ((grade.avg || 0) * (grade.credits || 0)),
    0
  );
  const avgGPA = totalCredits > 0 ? roundNumber(weighted / totalCredits, 2) : null;
  const passedCourses = grades.filter((grade) => grade.statusKey === "passed").length;

  return {
    avgGPA: avgGPA ?? 0,
    totalCredits,
    totalCourses: grades.length,
    passedCourses,
    rank: getGradeRank(avgGPA),
  };
}

function buildGradeSubjectStats(grades) {
  return grades
    .filter((grade) => typeof grade.avg === "number")
    .slice(0, 8)
    .map((grade) => ({
      name: grade.code || grade.subject.slice(0, 8),
      score: grade.avg,
    }))
    .reverse();
}

function buildGradeSkillData(grades, avgGPA) {
  const validGrades = grades.filter((item) => typeof item.avg === "number");
  if (!validGrades.length) return [];

  const skillBuckets = [
    { key: "Programming", keywords: ["lap trinh", "program", "web"], values: [] },
    { key: "Algorithms", keywords: ["giai thuat", "algorithm", "cau truc"], values: [] },
    { key: "Database", keywords: ["du lieu", "database", "sql"], values: [] },
    { key: "Networking", keywords: ["mang", "network"], values: [] },
    { key: "AI/ML", keywords: ["tri tue", "hoc may", "ai", "machine"], values: [] },
    { key: "Systems", keywords: ["he dieu hanh", "system", "bao mat"], values: [] },
  ];

  for (const grade of validGrades) {
    const lowerName = normalizeText(`${grade.subject} ${grade.code}`);
    for (const bucket of skillBuckets) {
      if (bucket.keywords.some((keyword) => lowerName.includes(keyword))) {
        bucket.values.push(grade.avg * 10);
      }
    }
  }

  return skillBuckets
    .filter((bucket) => bucket.values.length > 0)
    .map((bucket) => {
      const score = Math.round(bucket.values.reduce((sum, value) => sum + value, 0) / bucket.values.length);
      return { skill: bucket.key, score };
    });
}

function parseDateOnly(value) {
  const input = String(value || "").trim();
  const match = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function toDateOnly(date) {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

function normalizeTaskPriority(priority) {
  const value = String(priority || "medium").trim().toLowerCase();
  if (!TASK_PRIORITIES.has(value)) return "medium";
  return value === "normal" ? "medium" : value;
}

function normalizeTaskCategory(category) {
  const value = String(category || "").trim();
  if (!value || value === "Khac") return "Khác";
  return value;
}

function buildDueLabel(dueAt, fallback) {
  const label = String(fallback || "").trim();
  if (label) return label;
  return dueAt ? toDateOnly(dueAt) : "Hôm nay";
}

function toTaskResponse(task) {
  const dueDate = toDateOnly(task.dueAt);
  const dueLabel = buildDueLabel(task.dueAt, task.dueLabel);

  return {
    id: task.id,
    title: task.title,
    task: task.title,
    description: task.description || "",
    dueDate,
    dueLabel,
    time: dueLabel,
    completed: task.completed,
    priority: normalizeTaskPriority(task.priority),
    category: normalizeTaskCategory(task.category),
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

async function requireStudent(userId, res, forbiddenMessage) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true },
  });

  if (!user) {
    res.status(404).json({ message: "Không tìm thấy tài khoản" });
    return null;
  }

  if (user.role !== 1) {
    res.status(403).json({ message: forbiddenMessage });
    return null;
  }

  return user;
}

function parseTaskId(value) {
  const taskId = Number(value);
  return Number.isInteger(taskId) && taskId > 0 ? taskId : null;
}

function toTaskStats(tasks) {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const active = total - completed;
  const highPriority = tasks.filter(
    (task) => normalizeTaskPriority(task.priority) === "high" && !task.completed
  ).length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    total,
    active,
    completed,
    highPriority,
    progress,
  };
}

router.get("/me/dashboard", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        studentProfile: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản" });
    }

    if (user.role !== 1) {
      return res.status(403).json({ message: "Chỉ sinh viên mới được truy cập" });
    }

    const gradeRecords = await prisma.gradeRecord.findMany({
      where: { userId: req.user.id },
      include: {
        semester: true,
        course: true,
      },
      orderBy: [{ semester: { termNumber: "asc" } }, { updatedAt: "asc" }],
    });

    const semesterBuckets = new Map();
    for (const item of gradeRecords) {
      const key = item.semesterId;
      const score4 = item.score4 ? Number(item.score4) : null;
      const score10 = item.score10 ? Number(item.score10) : null;

      if (!semesterBuckets.has(key)) {
        semesterBuckets.set(key, {
          semesterId: item.semesterId,
          termNumber: item.semester.termNumber,
          label: formatSemesterLabel(item.semester.semesterCode, item.semester.termNumber),
          totalScore4: 0,
          countScore4: 0,
          totalScore10: 0,
          countScore10: 0,
        });
      }

      const bucket = semesterBuckets.get(key);
      if (score4 !== null) {
        bucket.totalScore4 += score4;
        bucket.countScore4 += 1;
      }
      if (score10 !== null) {
        bucket.totalScore10 += score10;
        bucket.countScore10 += 1;
      }
    }

    const gpaHistory = [...semesterBuckets.values()]
      .sort((a, b) => a.termNumber - b.termNumber)
      .map((bucket) => ({
        semesterId: bucket.semesterId,
        label: bucket.label,
        gpa:
          bucket.countScore4 > 0
            ? Number((bucket.totalScore4 / bucket.countScore4).toFixed(2))
            : null,
        avgScore10:
          bucket.countScore10 > 0
            ? Number((bucket.totalScore10 / bucket.countScore10).toFixed(2))
            : null,
      }))
      .filter((item) => item.gpa !== null);

    const gpaNumbers = gpaHistory.map((item) => item.gpa);
    const currentGpa =
      user.studentProfile?.gpa !== null && user.studentProfile?.gpa !== undefined
        ? Number(user.studentProfile.gpa)
        : gpaNumbers[gpaNumbers.length - 1] || 0;
    const bestGpa = gpaNumbers.length ? Math.max(...gpaNumbers) : currentGpa || 0;
    const avgGpa = gpaNumbers.length
      ? Number((gpaNumbers.reduce((sum, n) => sum + n, 0) / gpaNumbers.length).toFixed(2))
      : currentGpa || 0;
    const growthRate =
      gpaNumbers.length >= 2 && gpaNumbers[0] > 0
        ? Number((((gpaNumbers[gpaNumbers.length - 1] - gpaNumbers[0]) / gpaNumbers[0]) * 100).toFixed(0))
        : 0;

    const totalCourses = gradeRecords.length;
    const totalCredits = gradeRecords.reduce(
      (sum, item) => sum + (item.course?.credits || 0),
      0
    );
    const passedCourses = gradeRecords.filter(
      (item) => item.resultStatus?.toUpperCase() === "PASSED"
    ).length;
    const completionRate =
      totalCourses > 0 ? Number(((passedCourses / totalCourses) * 100).toFixed(0)) : 0;

    const recentGrades = [...gradeRecords]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        subject: item.course?.courseName || "Unknown",
        credits: item.course?.credits || 0,
        score10: item.score10 ? Number(item.score10) : null,
        score4: item.score4 ? Number(item.score4) : null,
        termNumber: item.semester?.termNumber || null,
      }));

    const todayTasks = await prisma.studentTask.findMany({
      where: { userId: req.user.id },
      orderBy: [{ completed: "asc" }, { dueAt: "asc" }, { createdAt: "asc" }],
      take: 3,
    });

    const upcomingClasses = await prisma.studentScheduleClass.findMany({
      where: {
        userId: req.user.id,
        weekday: getTodayWeekday(),
        isActive: true,
      },
      orderBy: { startTime: "asc" },
      take: 4,
    });

    return res.json({
      profile: {
        fullName: user.studentProfile?.fullName || "Sinh viên",
        studentCode: user.studentProfile?.studentCode || "",
        className: user.studentProfile?.schoolYear
          ? `K${user.studentProfile.schoolYear}`
          : null,
      },
      gpa: {
        current: Number((currentGpa || 0).toFixed(2)),
        best: Number((bestGpa || 0).toFixed(2)),
        average: Number((avgGpa || 0).toFixed(2)),
        growthRate,
        history: gpaHistory,
      },
      stats: {
        totalCourses,
        totalCredits,
        passedCourses,
        completionRate,
      },
      recentGrades,
      upcomingClasses: upcomingClasses.map((item) => ({
        id: item.id,
        subject: item.subject,
        time: `${item.startTime} - ${item.endTime}`,
        room: item.room || "",
      })),
      todayTasks: todayTasks.map(toTaskResponse),
    });
  } catch (error) {
    console.error("DASHBOARD ERROR:", error);
    return res.status(500).json({ message: "Lỗi server khi tải dashboard" });
  }
});

router.get("/me/tasks", authMiddleware, async (req, res) => {
  try {
    const student = await requireStudent(
      req.user.id,
      res,
      "Chỉ sinh viên mới được truy cập công việc"
    );
    if (!student) return null;

    const status = String(req.query?.status || "all").trim();
    const search = String(req.query?.search || "").trim();
    const where = {
      userId: req.user.id,
    };

    if (status === "active") {
      where.completed = false;
    } else if (status === "completed") {
      where.completed = true;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { category: { contains: search, mode: "insensitive" } },
      ];
    }

    const [tasks, allTasks] = await Promise.all([
      prisma.studentTask.findMany({
        where,
        orderBy: [
          { completed: "asc" },
          { dueAt: "asc" },
          { priority: "asc" },
          { createdAt: "desc" },
        ],
      }),
      prisma.studentTask.findMany({
        where: {
          userId: req.user.id,
        },
      }),
    ]);

    return res.json({
      tasks: tasks.map(toTaskResponse),
      stats: toTaskStats(allTasks),
    });
  } catch (error) {
    console.error("LIST TASKS ERROR:", error);
    return res.status(500).json({ message: "Lỗi server khi tải công việc" });
  }
});

router.post("/me/tasks", authMiddleware, async (req, res) => {
  try {
    const title = String(req.body?.title || "").trim();
    const description = String(req.body?.description || "").trim();
    const dueDateInput = String(req.body?.dueDate || "").trim();
    const dueAt = dueDateInput ? parseDateOnly(dueDateInput) : null;
    const dueLabel = buildDueLabel(dueAt, req.body?.dueLabel);
    const priority = normalizeTaskPriority(req.body?.priority);
    const category = normalizeTaskCategory(req.body?.category);

    if (!title) {
      return res.status(400).json({ message: "Nội dung công việc không được để trống" });
    }

    if (dueDateInput && !dueAt) {
      return res.status(400).json({ message: "Hạn công việc không hợp lệ" });
    }

    const student = await requireStudent(
      req.user.id,
      res,
      "Chỉ sinh viên mới có thể tạo công việc"
    );
    if (!student) return null;

    const task = await prisma.studentTask.create({
      data: {
        userId: req.user.id,
        title,
        description: description || null,
        dueLabel,
        dueAt: dueAt || new Date(),
        priority,
        category,
      },
    });
    await ensureDueTaskNotifications(prisma, req.user.id);

    return res.status(201).json({ task: toTaskResponse(task) });
  } catch (error) {
    console.error("CREATE TASK ERROR:", error);
    return res.status(500).json({ message: "Lỗi server khi tạo công việc" });
  }
});

router.patch("/me/tasks/:taskId/toggle", authMiddleware, async (req, res) => {
  try {
    const taskId = parseTaskId(req.params.taskId);

    if (!taskId) {
      return res.status(400).json({ message: "Công việc không hợp lệ" });
    }

    const currentTask = await prisma.studentTask.findFirst({
      where: {
        id: taskId,
        userId: req.user.id,
      },
    });

    if (!currentTask) {
      return res.status(404).json({ message: "Không tìm thấy công việc" });
    }

    const task = await prisma.studentTask.update({
      where: { id: taskId },
      data: {
        completed: !currentTask.completed,
      },
    });

    return res.json({ task: toTaskResponse(task) });
  } catch (error) {
    console.error("TOGGLE TASK ERROR:", error);
    return res.status(500).json({ message: "Lỗi server khi cập nhật công việc" });
  }
});

router.patch("/me/tasks/:taskId", authMiddleware, async (req, res) => {
  try {
    const taskId = parseTaskId(req.params.taskId);

    if (!taskId) {
      return res.status(400).json({ message: "Công việc không hợp lệ" });
    }

    const currentTask = await prisma.studentTask.findFirst({
      where: {
        id: taskId,
        userId: req.user.id,
      },
    });

    if (!currentTask) {
      return res.status(404).json({ message: "Không tìm thấy công việc" });
    }

    const data = {};
    if (req.body?.title !== undefined) {
      const title = String(req.body.title || "").trim();
      if (!title) {
        return res.status(400).json({ message: "Nội dung công việc không được để trống" });
      }
      data.title = title;
    }

    if (req.body?.description !== undefined) {
      const description = String(req.body.description || "").trim();
      data.description = description || null;
    }

    if (req.body?.dueDate !== undefined) {
      const dueDateInput = String(req.body.dueDate || "").trim();
      const dueAt = dueDateInput ? parseDateOnly(dueDateInput) : null;
      if (dueDateInput && !dueAt) {
        return res.status(400).json({ message: "Hạn công việc không hợp lệ" });
      }
      data.dueAt = dueAt;
      data.dueLabel = buildDueLabel(dueAt, req.body?.dueLabel);
    } else if (req.body?.dueLabel !== undefined) {
      data.dueLabel = buildDueLabel(currentTask.dueAt, req.body.dueLabel);
    }

    if (req.body?.priority !== undefined) {
      data.priority = normalizeTaskPriority(req.body.priority);
    }

    if (req.body?.category !== undefined) {
      data.category = normalizeTaskCategory(req.body.category);
    }

    if (req.body?.completed !== undefined) {
      data.completed = Boolean(req.body.completed);
    }

    const task = await prisma.studentTask.update({
      where: { id: taskId },
      data,
    });
    await ensureDueTaskNotifications(prisma, req.user.id);

    return res.json({ task: toTaskResponse(task) });
  } catch (error) {
    console.error("UPDATE TASK ERROR:", error);
    return res.status(500).json({ message: "Lỗi server khi cập nhật công việc" });
  }
});

router.delete("/me/tasks/:taskId", authMiddleware, async (req, res) => {
  try {
    const taskId = parseTaskId(req.params.taskId);

    if (!taskId) {
      return res.status(400).json({ message: "Công việc không hợp lệ" });
    }

    const currentTask = await prisma.studentTask.findFirst({
      where: {
        id: taskId,
        userId: req.user.id,
      },
    });

    if (!currentTask) {
      return res.status(404).json({ message: "Không tìm thấy công việc" });
    }

    await prisma.studentTask.delete({
      where: { id: taskId },
    });

    return res.status(204).send();
  } catch (error) {
    console.error("DELETE TASK ERROR:", error);
    return res.status(500).json({ message: "Lỗi server khi xoá công việc" });
  }
});

router.get("/me/statistics", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { studentProfile: true },
    });

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản" });
    }

    if (user.role !== 1) {
      return res.status(403).json({ message: "Chỉ sinh viên mới được truy cập thống kê" });
    }

    const [
      gradeRecords,
      scheduleClasses,
      tasks,
      forumPostCount,
      forumCommentCount,
      cohortRecords,
    ] = await Promise.all([
      prisma.gradeRecord.findMany({
        where: { userId: req.user.id },
        include: { semester: true, course: true },
        orderBy: [
          { semester: { academicYear: "asc" } },
          { semester: { termNumber: "asc" } },
          { updatedAt: "asc" },
        ],
      }),
      prisma.studentScheduleClass.findMany({
        where: { userId: req.user.id, isActive: true },
      }),
      prisma.studentTask.findMany({
        where: { userId: req.user.id },
      }),
      prisma.forumPost.count({
        where: { authorId: req.user.id },
      }),
      prisma.forumComment.count({
        where: { authorId: req.user.id },
      }),
      prisma.gradeRecord.findMany({
        where: { userId: { not: req.user.id } },
        select: { userId: true, score4: true },
      }),
    ]);

    const semesterGPA = buildSemesterStatistics(gradeRecords);
    const hasAcademicData =
      gradeRecords.length > 0 ||
      (user.studentProfile?.gpa !== null && user.studentProfile?.gpa !== undefined);
    const currentGpa =
      user.studentProfile?.gpa !== null && user.studentProfile?.gpa !== undefined
        ? Number(user.studentProfile.gpa)
        : semesterGPA[semesterGPA.length - 1]?.gpa || 0;
    const previousGpa = semesterGPA.length >= 2 ? semesterGPA[semesterGPA.length - 2].gpa : currentGpa;
    const passedRecords = gradeRecords.filter((record) => record.resultStatus?.toUpperCase() === "PASSED");
    const totalCredits = passedRecords.reduce((sum, item) => sum + (item.course?.credits || 0), 0);
    const completedCourses = passedRecords.length;
    const bOrBetterCount = gradeRecords.filter((record) => {
      const score10 = record.score10 ? Number(record.score10) : null;
      return score10 !== null ? score10 >= 7 : ["A+", "A", "B+", "B"].includes(String(record.letterScore || "").toUpperCase());
    }).length;
    const bOrBetterRate = gradeRecords.length > 0 ? Math.round((bOrBetterCount / gradeRecords.length) * 100) : 0;
    const studyTime = buildStudyTime(scheduleClasses);
    const weeklyStudyHours = roundNumber(
      studyTime.reduce((sum, item) => sum + item.hours, 0),
      1
    );
    const forumContribution = forumPostCount + forumCommentCount;
    const skillProgress = buildSkillProgress(gradeRecords, forumContribution);
    const targetRate =
      skillProgress.length > 0
        ? Math.round(
            skillProgress.reduce(
              (sum, item) => sum + Math.min(item.current / item.target, 1),
              0
            ) / skillProgress.length * 100
          )
        : 0;
    const totalGoals = skillProgress.length;
    const goalsAchieved = Math.round((targetRate / 100) * totalGoals);
    const cohortGpas = buildCohortGpas(cohortRecords);
    const cohortAverageGpa = hasAcademicData && cohortGpas.length
      ? roundNumber(cohortGpas.reduce((sum, value) => sum + value, 0) / cohortGpas.length, 2)
      : 0;
    const percentile = hasAcademicData && cohortGpas.length
      ? Math.round((cohortGpas.filter((gpa) => gpa <= currentGpa).length / cohortGpas.length) * 100)
      : 0;
    const taskCompletionRate = tasks.length > 0
      ? Math.round((tasks.filter((task) => task.completed).length / tasks.length) * 100)
      : 0;
    const achievements = [
      ...(hasAcademicData
        ? [{
            key: "academic",
            variant: currentGpa >= 3.6 ? "excellent" : "improving",
            gpa: roundNumber(currentGpa, 2),
            title: currentGpa >= 3.6 ? "Sinh viÃªn xuáº¥t sáº¯c" : "Tiáº¿n bá»™ há»c táº­p",
            description:
              currentGpa >= 3.6
                ? `GPA ${roundNumber(currentGpa, 2)} vÃ  duy trÃ¬ phong Ä‘á»™ há»c táº­p tá»‘t`
                : `GPA hiá»‡n táº¡i ${roundNumber(currentGpa, 2)}, tiáº¿p tá»¥c tá»‘i Æ°u cÃ¡c mÃ´n chuyÃªn ngÃ nh`,
            tone: "gold",
          }]
        : []),
      ...(forumContribution > 0
        ? [{
            key: "community",
            contributionCount: forumContribution,
            title: "Top Contributor",
            description: `${forumContribution} Ä‘Ã³ng gÃ³p trÃªn diá»…n Ä‘Ã n há»c táº­p`,
            tone: "blue",
          }]
        : []),
      ...(tasks.length > 0
        ? [{
            key: "discipline",
            taskCompletionRate,
            title: "Ká»· luáº­t há»c táº­p",
            description: `${taskCompletionRate}% cÃ´ng viá»‡c Ä‘Ã£ hoÃ n thÃ nh trong há»‡ thá»‘ng`,
            tone: "green",
          }]
        : []),
    ];
    const goals = [
      ...(hasAcademicData && currentGpa < 3.8
        ? [{
            key: "gpa",
            title: "Äáº¡t GPA 3.8+",
            description: "Táº­p trung vÃ o cÃ¡c mÃ´n chuyÃªn ngÃ nh vÃ  cáº£i thiá»‡n Ä‘iá»ƒm quÃ¡ trÃ¬nh",
          }]
        : []),
      ...(gradeRecords.length > 0
        ? [{
            key: "projects",
            title: "HoÃ n thÃ nh 2 dá»± Ã¡n cÃ¡ nhÃ¢n",
            description: "Ãp dá»¥ng kiáº¿n thá»©c Ä‘Ã£ há»c vÃ o sáº£n pháº©m thá»±c táº¿",
          }]
        : []),
      ...(totalCredits > 0
        ? [{
            key: "internship",
            title: "Tham gia thá»±c táº­p",
            description: "TÃ­ch lÅ©y kinh nghiá»‡m thá»±c táº¿ vÃ  má»Ÿ rá»™ng há»“ sÆ¡ nÄƒng lá»±c",
          }]
        : []),
    ];

    return res.json({
      profile: {
        fullName: user.studentProfile?.fullName || "Sinh viên",
        studentCode: user.studentProfile?.studentCode || "",
      },
      overview: {
        cumulativeGpa: roundNumber(currentGpa, 2),
        gpaDelta: roundNumber(currentGpa - previousGpa, 2),
        totalCredits,
        programCompletionRate: Math.min(100, Math.round((totalCredits / PROGRAM_CREDIT_TARGET) * 100)),
        completedCourses,
        bOrBetterRate,
        weeklyStudyHours,
        targetRate,
        goalsAchieved,
        totalGoals,
        taskCompletionRate,
      },
      semesterGPA,
      gradeDistribution: buildGradeDistribution(gradeRecords),
      studyTime,
      skillProgress,
      comparison: {
        studentGpa: roundNumber(currentGpa, 2),
        cohortAverageGpa,
        percentile,
      },
      achievements,
      goals,
    });
  } catch (error) {
    console.error("STATISTICS ERROR:", error);
    return res.status(500).json({ message: "Lỗi server khi tải thống kê" });
  }
});

router.get("/me/grades", authMiddleware, async (req, res) => {
  try {
    const selectedSemester = String(req.query?.semester || "__all__").trim();
    const search = String(req.query?.search || "").trim().toLowerCase();
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { studentProfile: true },
    });

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản" });
    }

    if (user.role !== 1) {
      return res.status(403).json({ message: "Chỉ sinh viên mới được truy cập" });
    }

    const records = await prisma.gradeRecord.findMany({
      where: { userId: req.user.id },
      include: { semester: true, course: true },
      orderBy: [{ semester: { academicYear: "desc" } }, { semester: { termNumber: "desc" } }, { updatedAt: "desc" }],
    });

    const semesterSet = new Set();
    const semesters = [];
    for (const item of records) {
      const label = formatSemesterLabel(
        item.semester?.semesterCode,
        item.semester?.termNumber || 0
      );
      if (!semesterSet.has(label)) {
        semesterSet.add(label);
        semesters.push(label);
      }
    }

    const allGrades = records.map(toGradeResponse);
    const grades = allGrades.filter((grade) => {
      const semesterMatch = selectedSemester === "__all__" || grade.semester === selectedSemester;
      const searchText = `${grade.subject} ${grade.code}`.toLowerCase();
      const searchMatch = !search || searchText.includes(search);
      return semesterMatch && searchMatch;
    });
    const stats = buildGradeStats(grades);

    return res.json({
      profile: {
        fullName: user.studentProfile?.fullName || "Sinh viên",
        studentCode: user.studentProfile?.studentCode || "",
      },
      semesters,
      grades,
      stats,
      subjectStats: buildGradeSubjectStats(grades),
      skillData: buildGradeSkillData(grades, stats.avgGPA),
      scoreDistribution: buildGradeScoreDistribution(grades),
      filters: {
        semester: selectedSemester,
        search,
      },
    });
  } catch (error) {
    console.error("GRADES ERROR:", error);
    return res.status(500).json({ message: "Lỗi server khi tải bảng điểm" });
  }
});

router.put("/me/profile", authMiddleware, async (req, res) => {
  try {
    const { fullName, studentCode, majorId, schoolYear, phone, email, bio } = req.body;

    if (!fullName || !String(fullName).trim()) {
      return res.status(400).json({ message: "Họ tên không được để trống" });
    }

    if (!majorId || Number.isNaN(Number(majorId))) {
      return res.status(400).json({ message: "Ngành học không hợp lệ" });
    }

    if (schoolYear !== undefined && schoolYear !== null && schoolYear !== "") {
      const parsedSchoolYear = Number(schoolYear);
      if (!Number.isInteger(parsedSchoolYear) || parsedSchoolYear < 1 || parsedSchoolYear > 8) {
        return res.status(400).json({ message: "Nam hoc phai la so nguyen tu 1 den 8" });
      }
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { studentProfile: true },
    });

    if (!currentUser) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản" });
    }

    if (currentUser.role !== 1) {
      return res.status(403).json({ message: "Chỉ sinh viên mới có thể cập nhật hồ sơ" });
    }

    const selectedMajor = await prisma.major.findUnique({
      where: { id: Number(majorId) },
      select: { id: true },
    });

    if (!selectedMajor) {
      return res.status(400).json({ message: "Ngành học không tồn tại" });
    }

    const nextEmail = email !== undefined ? String(email || "").trim().toLowerCase() : currentUser.email;
    if (!nextEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      return res.status(400).json({ message: "Email khong hop le" });
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        email: nextEmail,
        phone: phone?.trim() || null,
      },
    });

    await prisma.studentProfile.upsert({
      where: { userId: req.user.id },
      create: {
        userId: req.user.id,
        fullName: String(fullName).trim(),
        studentCode: studentCode?.trim() || null,
        majorId: Number(majorId),
        schoolYear: schoolYear ? Number(schoolYear) : null,
        bio: bio?.trim() || null,
        profileCompleted: true,
      },
      update: {
        fullName: String(fullName).trim(),
        studentCode: studentCode?.trim() || null,
        majorId: Number(majorId),
        schoolYear: schoolYear ? Number(schoolYear) : null,
        bio: bio?.trim() || null,
        profileCompleted: true,
      },
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        studentProfile: {
          include: {
            major: true,
          },
        },
      },
    });

    return res.json({
      message: "Cập nhật hồ sơ thành công",
      user: toUserResponse(updatedUser),
    });
  } catch (error) {
    if (error && error.code === "P2002") {
      return res.status(409).json({ message: "Mã sinh viên hoặc số điện thoại đã tồn tại" });
    }

    console.error("COMPLETE PROFILE ERROR:", error);
    return res.status(500).json({ message: "Lỗi server khi cập nhật hồ sơ" });
  }
});

router.post("/me/avatar", authMiddleware, avatarUpload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Vui long chon anh dai dien" });
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { studentProfile: true },
    });

    if (!currentUser) {
      return res.status(404).json({ message: "Khong tim thay tai khoan" });
    }

    if (currentUser.role !== 1) {
      return res.status(403).json({ message: "Chi sinh vien moi co the cap nhat anh dai dien" });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    await prisma.studentProfile.upsert({
      where: { userId: req.user.id },
      create: {
        userId: req.user.id,
        fullName: currentUser.email,
        avatarUrl,
        profileCompleted: false,
      },
      update: {
        avatarUrl,
      },
    });

    const updatedUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        studentProfile: {
          include: {
            major: true,
          },
        },
      },
    });

    return res.json({
      message: "Cap nhat anh dai dien thanh cong",
      avatarUrl,
      user: toUserResponse(updatedUser),
    });
  } catch (error) {
    if (error?.message === "INVALID_IMAGE") {
      return res.status(400).json({ message: "Tep tai len phai la hinh anh" });
    }

    if (error?.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Anh dai dien khong duoc vuot qua 5MB" });
    }

    console.error("UPLOAD AVATAR ERROR:", error);
    return res.status(500).json({ message: "Loi server khi cap nhat anh dai dien" });
  }
});

export default router;
