import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  const major = await prisma.major.upsert({
    where: { majorCode: "IT-E10" },
    update: {},
    create: {
      majorCode: "IT-E10",
      majorName: "Công nghệ thông tin",
      facultyName: "Trường Công nghệ Thông tin và Truyền thông",
    },
  });

  const semester1 = await prisma.semester.upsert({
    where: { semesterCode: "2024-1" },
    update: {},
    create: {
      semesterCode: "2024-1",
      semesterName: "Học kỳ 1 năm học 2024",
      academicYear: "2024-2025",
      termNumber: 1,
      isCurrent: false,
    },
  });

  const semester2 = await prisma.semester.upsert({
    where: { semesterCode: "2024-2" },
    update: {},
    create: {
      semesterCode: "2024-2",
      semesterName: "Học kỳ 2 năm học 2024",
      academicYear: "2024-2025",
      termNumber: 2,
      isCurrent: true,
    },
  });

  const course1 = await prisma.course.upsert({
    where: { courseCode: "IT1110" },
    update: {},
    create: {
      courseCode: "IT1110",
      courseName: "Tin học đại cương",
      credits: 3,
    },
  });

  const course2 = await prisma.course.upsert({
    where: { courseCode: "IT2002" },
    update: {},
    create: {
      courseCode: "IT2002",
      courseName: "Cơ sở dữ liệu",
      credits: 3,
    },
  });

  const course3 = await prisma.course.upsert({
    where: { courseCode: "IT2020" },
    update: {},
    create: {
      courseCode: "IT2020",
      courseName: "Lập trình hướng đối tượng",
      credits: 3,
    },
  });

  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const studentPasswordHash = await bcrypt.hash("student123", 10);

  await prisma.user.upsert({
    where: { email: "admin@ilovehust.local" },
    update: {
      phone: "0900000000",
      passwordHash: adminPasswordHash,
      role: 0,
    },
    create: {
      email: "admin@ilovehust.local",
      phone: "0900000000",
      passwordHash: adminPasswordHash,
      role: 0,
    },
  });

  const student = await prisma.user.upsert({
    where: { email: "student@ilovehust.local" },
    update: {
      phone: "0911111111",
      passwordHash: studentPasswordHash,
      role: 1,
    },
    create: {
      email: "student@ilovehust.local",
      phone: "0911111111",
      passwordHash: studentPasswordHash,
      role: 1,
    },
  });

  await prisma.studentProfile.upsert({
    where: { userId: student.id },
    update: {
      majorId: major.id,
      fullName: "Demo Student",
      studentCode: "20240001",
      schoolYear: 2,
      gpa: "3.25",
      cpa: "3.18",
      profileCompleted: false,
      cttConnected: false,
    },
    create: {
      userId: student.id,
      majorId: major.id,
      fullName: "Demo Student",
      studentCode: "20240001",
      schoolYear: 2,
      gpa: "3.25",
      cpa: "3.18",
      profileCompleted: false,
      cttConnected: false,
    },
  });

  await prisma.gradeRecord.deleteMany({
    where: { userId: student.id },
  });

  await prisma.gradeRecord.createMany({
    data: [
      {
        userId: student.id,
        semesterId: semester1.id,
        courseId: course1.id,
        processScore: "8.00",
        examScore: "9.00",
        score10: "8.50",
        score4: "3.50",
        letterScore: "B+",
        resultStatus: "PASSED",
        importedFromCtt: false,
      },
      {
        userId: student.id,
        semesterId: semester2.id,
        courseId: course2.id,
        processScore: "8.70",
        examScore: "9.10",
        score10: "8.90",
        score4: "3.70",
        letterScore: "A",
        resultStatus: "PASSED",
        importedFromCtt: false,
      },
      {
        userId: student.id,
        semesterId: semester2.id,
        courseId: course3.id,
        processScore: "8.80",
        examScore: "9.20",
        score10: "9.00",
        score4: "4.00",
        letterScore: "A",
        resultStatus: "PASSED",
        importedFromCtt: false,
      },
    ],
  });

  console.log("Seed done");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });