import express from "express";
import prisma from "../../database.js";
import authMiddleware from "../../middleware/authMiddleware.js";
import toUserResponse from "../../utils/toUserResponse.js";

const router = express.Router();

function formatSemesterLabel(semesterCode, termNumber) {
  if (!semesterCode) return `Term ${termNumber}`;
  const match = String(semesterCode).match(/^(\d{4})[-.](\d{1,2})$/);
  if (match) return `${match[1]}.${match[2]}`;
  return String(semesterCode).replace("-", ".");
}

function toTaskResponse(task) {
  return {
    id: task.id,
    task: task.title,
    time: task.dueLabel || "Hom nay",
    completed: task.completed,
    priority: task.priority,
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
      return res.status(404).json({ message: "Khong tim thay tai khoan" });
    }

    if (user.role !== 1) {
      return res.status(403).json({ message: "Chi sinh vien moi duoc truy cap" });
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

    return res.json({
      profile: {
        fullName: user.studentProfile?.fullName || "Student",
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
      upcomingClasses: [],
      todayTasks: todayTasks.map(toTaskResponse),
    });
  } catch (error) {
    console.error("DASHBOARD ERROR:", error);
    return res.status(500).json({ message: "Loi server khi tai dashboard" });
  }
});

router.post("/me/tasks", authMiddleware, async (req, res) => {
  try {
    const title = String(req.body?.title || "").trim();
    const dueLabel = String(req.body?.dueLabel || "Hom nay").trim();
    const priority = String(req.body?.priority || "normal").trim() || "normal";

    if (!title) {
      return res.status(400).json({ message: "Noi dung task khong duoc de trong" });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, role: true },
    });

    if (!user) {
      return res.status(404).json({ message: "Khong tim thay tai khoan" });
    }

    if (user.role !== 1) {
      return res.status(403).json({ message: "Chi sinh vien moi co the tao task" });
    }

    const task = await prisma.studentTask.create({
      data: {
        userId: req.user.id,
        title,
        dueLabel,
        dueAt: new Date(),
        priority,
      },
    });

    return res.status(201).json({ task: toTaskResponse(task) });
  } catch (error) {
    console.error("CREATE TASK ERROR:", error);
    return res.status(500).json({ message: "Loi server khi tao task" });
  }
});

router.patch("/me/tasks/:taskId/toggle", authMiddleware, async (req, res) => {
  try {
    const taskId = Number(req.params.taskId);

    if (!Number.isInteger(taskId)) {
      return res.status(400).json({ message: "Task khong hop le" });
    }

    const currentTask = await prisma.studentTask.findFirst({
      where: {
        id: taskId,
        userId: req.user.id,
      },
    });

    if (!currentTask) {
      return res.status(404).json({ message: "Khong tim thay task" });
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
    return res.status(500).json({ message: "Loi server khi cap nhat task" });
  }
});

router.get("/me/grades", authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { studentProfile: true },
    });

    if (!user) {
      return res.status(404).json({ message: "Khong tim thay tai khoan" });
    }

    if (user.role !== 1) {
      return res.status(403).json({ message: "Chi sinh vien moi duoc truy cap" });
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

    const grades = records.map((item) => {
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
        status: item.resultStatus?.toUpperCase() === "PASSED" ? "Dat" : "Chua dat",
      };
    });

    const validGrades = grades.filter((g) => typeof g.avg === "number");
    const totalCredits = validGrades.reduce((sum, g) => sum + g.credits, 0);
    const weightedSum = validGrades.reduce((sum, g) => sum + g.avg * g.credits, 0);
    const avgGPA = totalCredits > 0 ? Number((weightedSum / totalCredits).toFixed(2)) : 0;
    const passedCourses = grades.filter((g) => g.status === "Dat").length;

    const subjectStats = validGrades
      .slice(0, 8)
      .map((g) => ({
        name: g.code || g.subject.slice(0, 8),
        score: g.avg,
      }))
      .reverse();

    const skillBuckets = [
      { key: "Programming", keywords: ["lap trinh", "program", "web"], values: [] },
      { key: "Algorithms", keywords: ["giai thuat", "algorithm", "cau truc"], values: [] },
      { key: "Database", keywords: ["du lieu", "database", "sql"], values: [] },
      { key: "Networking", keywords: ["mang", "network"], values: [] },
      { key: "AI/ML", keywords: ["tri tue", "hoc may", "ai", "machine"], values: [] },
      { key: "Systems", keywords: ["he dieu hanh", "system", "bao mat"], values: [] },
    ];

    for (const g of validGrades) {
      const lowerName = `${g.subject} ${g.code}`.toLowerCase();
      for (const bucket of skillBuckets) {
        if (bucket.keywords.some((kw) => lowerName.includes(kw))) {
          bucket.values.push(g.avg * 10);
        }
      }
    }

    const skillData = skillBuckets.map((bucket) => {
      const hasValue = bucket.values.length > 0;
      const score = hasValue
        ? Math.round(bucket.values.reduce((a, b) => a + b, 0) / bucket.values.length)
        : Math.round(avgGPA * 10);
      return { skill: bucket.key, score };
    });

    return res.json({
      profile: {
        fullName: user.studentProfile?.fullName || "Student",
        studentCode: user.studentProfile?.studentCode || "",
      },
      semesters,
      grades,
      stats: {
        avgGPA,
        totalCredits,
        totalCourses: grades.length,
        passedCourses,
      },
      subjectStats,
      skillData,
    });
  } catch (error) {
    console.error("GRADES ERROR:", error);
    return res.status(500).json({ message: "Loi server khi tai bang diem" });
  }
});

router.put("/me/profile", authMiddleware, async (req, res) => {
  try {
    const { fullName, studentCode, majorId, schoolYear, phone, bio } = req.body;

    if (!fullName || !String(fullName).trim()) {
      return res.status(400).json({ message: "Ho ten khong duoc de trong" });
    }

    if (!majorId || Number.isNaN(Number(majorId))) {
      return res.status(400).json({ message: "Nganh hoc khong hop le" });
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
      return res.status(404).json({ message: "Khong tim thay tai khoan" });
    }

    if (currentUser.role !== 1) {
      return res.status(403).json({ message: "Chi sinh vien moi co the cap nhat ho so" });
    }

    const selectedMajor = await prisma.major.findUnique({
      where: { id: Number(majorId) },
      select: { id: true },
    });

    if (!selectedMajor) {
      return res.status(400).json({ message: "Nganh hoc khong ton tai" });
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
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
      message: "Cap nhat ho so thanh cong",
      user: toUserResponse(updatedUser),
    });
  } catch (error) {
    if (error && error.code === "P2002") {
      return res.status(409).json({ message: "Ma sinh vien hoac so dien thoai da ton tai" });
    }

    console.error("COMPLETE PROFILE ERROR:", error);
    return res.status(500).json({ message: "Loi server khi cap nhat ho so" });
  }
});

export default router;
