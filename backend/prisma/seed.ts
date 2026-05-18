import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const now = Date.now();

const majorSeeds = [
  { code: "IT-E10", name: "Cong nghe thong tin", faculty: "Truong Cong nghe Thong tin va Truyen thong" },
  { code: "IT-E6", name: "Khoa hoc may tinh", faculty: "Truong Cong nghe Thong tin va Truyen thong" },
  { code: "ET-E4", name: "Dien tu vien thong", faculty: "Truong Dien - Dien tu" },
  { code: "ME-E1", name: "Co dien tu", faculty: "Truong Co khi" },
  { code: "EM-E13", name: "Quan tri kinh doanh", faculty: "Truong Kinh te" },
];

const semesterSeeds = [
  { code: "2023-1", name: "Hoc ky 1 nam hoc 2023", year: "2023-2024", term: 1, current: false },
  { code: "2023-2", name: "Hoc ky 2 nam hoc 2023", year: "2023-2024", term: 2, current: false },
  { code: "2024-1", name: "Hoc ky 1 nam hoc 2024", year: "2024-2025", term: 1, current: false },
  { code: "2024-2", name: "Hoc ky 2 nam hoc 2024", year: "2024-2025", term: 2, current: false },
  { code: "2025-1", name: "Hoc ky 1 nam hoc 2025", year: "2025-2026", term: 1, current: false },
  { code: "2025-2", name: "Hoc ky 2 nam hoc 2025", year: "2025-2026", term: 2, current: true },
];

const courseSeeds = [
  { code: "IT1110", name: "Tin hoc dai cuong", credits: 3 },
  { code: "IT2002", name: "Co so du lieu", credits: 3 },
  { code: "IT2020", name: "Lap trinh huong doi tuong", credits: 3 },
  { code: "IT2030", name: "Cau truc du lieu va giai thuat", credits: 4 },
  { code: "IT2040", name: "He dieu hanh", credits: 3 },
  { code: "IT2050", name: "Mang may tinh", credits: 3 },
  { code: "IT3011", name: "Cong nghe phan mem", credits: 3 },
  { code: "IT3022", name: "Tri tue nhan tao", credits: 3 },
  { code: "IT3033", name: "Hoc may", credits: 3 },
  { code: "IT3044", name: "Phat trien ung dung web", credits: 3 },
  { code: "IT3055", name: "Bao mat thong tin", credits: 3 },
  { code: "IT3066", name: "Phan tich du lieu", credits: 3 },
  { code: "MI1110", name: "Giai tich 1", credits: 4 },
  { code: "MI1120", name: "Dai so", credits: 3 },
  { code: "PH1110", name: "Vat ly dai cuong", credits: 3 },
];

const firstNames = ["Nguyen", "Tran", "Le", "Pham", "Hoang", "Vu", "Do", "Bui", "Dang", "Phan"];
const middleNames = ["Van", "Minh", "Duc", "Quang", "Thi", "Ngoc", "Anh", "Gia", "Thanh", "Bao"];
const lastNames = ["An", "Binh", "Chi", "Dung", "Giang", "Ha", "Hung", "Khanh", "Linh", "Nam", "Phuc", "Quan", "Trang", "Vy"];
const postTitles = [
  "Can tai lieu on tap mon {course}",
  "Hoi kinh nghiem lam do an {course}",
  "Tim teammate cho project cuoi ky",
  "Chia se roadmap hoc {tag}",
  "Cach cai thien diem qua trinh",
  "Review mon hoc va cach qua mon",
  "Xin loi khuyen khi phong van thuc tap",
  "Tong hop bai tap va de cuong on thi",
];
const commentTemplates = [
  "Mình cũng đang quan tâm phần này, cảm ơn bạn đã chia sẻ.",
  "Bạn thử xem lại slide và bài tập trên lớp, khá sát đề.",
  "Nếu cần mình có thể gửi thêm tài liệu tham khảo.",
  "Theo mình nên làm demo nhỏ trước rồi mới tối ưu tiếp.",
  "Phần này hỏi thầy cô ở giờ bài tập sẽ rõ hơn nhiều.",
  "Mình đã từng gặp lỗi này, kiểm tra lại database schema nhé.",
];
const messageTemplates = [
  "Mai học nhóm lúc 8h được không?",
  "Bạn gửi mình file bài tập với nhé.",
  "Mình vừa xem lại phần database, có vài chỗ cần sửa.",
  "Ok, tối nay mình push code lên GitHub.",
  "Deadline môn này là cuối tuần đúng không?",
  "Bạn giải thích giúp mình đoạn thuật toán này với.",
  "Mình đã note lại task cho nhóm rồi.",
  "Mai lên thư viện học tiếp nhé.",
];

function pad(value, length = 3) {
  return String(value).padStart(length, "0");
}

function score10For(studentIndex, courseIndex, semesterIndex) {
  const raw = 6.2 + ((studentIndex * 7 + courseIndex * 5 + semesterIndex * 3) % 35) / 10;
  return Math.min(9.8, Number(raw.toFixed(1)));
}

function score4From10(score10) {
  if (score10 >= 8.5) return 4.0;
  if (score10 >= 8.0) return 3.5;
  if (score10 >= 7.0) return 3.0;
  if (score10 >= 6.5) return 2.5;
  if (score10 >= 5.5) return 2.0;
  if (score10 >= 4.0) return 1.0;
  return 0;
}

function letterFrom10(score10) {
  if (score10 >= 9.0) return "A+";
  if (score10 >= 8.5) return "A";
  if (score10 >= 8.0) return "B+";
  if (score10 >= 7.0) return "B";
  if (score10 >= 6.5) return "C+";
  if (score10 >= 5.5) return "C";
  if (score10 >= 4.0) return "D";
  return "F";
}

function createStudentSeed(index) {
  if (index === 0) {
    return {
      email: "student@ilovehust.local",
      phone: "0911111111",
      fullName: "Nguyen Van A",
      studentCode: "20241234",
    };
  }

  const first = firstNames[index % firstNames.length];
  const middle = middleNames[(index * 3) % middleNames.length];
  const last = lastNames[(index * 5) % lastNames.length];

  return {
    email: `sv${pad(index)}@ilovehust.local`,
    phone: `0930${pad(index, 6)}`,
    fullName: `${first} ${middle} ${last}`,
    studentCode: `2025${pad(index, 4)}`,
  };
}

function getRecentDate(minutesAgo) {
  return new Date(now - minutesAgo * 60 * 1000);
}

async function main() {
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const studentPasswordHash = await bcrypt.hash("student123", 10);

  const majors = {};
  for (const item of majorSeeds) {
    majors[item.code] = await prisma.major.upsert({
      where: { majorCode: item.code },
      update: { majorName: item.name, facultyName: item.faculty },
      create: { majorCode: item.code, majorName: item.name, facultyName: item.faculty },
    });
  }

  const semesters = {};
  for (const item of semesterSeeds) {
    semesters[item.code] = await prisma.semester.upsert({
      where: { semesterCode: item.code },
      update: {
        semesterName: item.name,
        academicYear: item.year,
        termNumber: item.term,
        isCurrent: item.current,
      },
      create: {
        semesterCode: item.code,
        semesterName: item.name,
        academicYear: item.year,
        termNumber: item.term,
        isCurrent: item.current,
      },
    });
  }

  const courses = {};
  for (const item of courseSeeds) {
    courses[item.code] = await prisma.course.upsert({
      where: { courseCode: item.code },
      update: { courseName: item.name, credits: item.credits },
      create: { courseCode: item.code, courseName: item.name, credits: item.credits },
    });
  }

  await prisma.user.upsert({
    where: { email: "admin@ilovehust.local" },
    update: {
      phone: "0900000000",
      passwordHash: adminPasswordHash,
      role: 0,
      isActive: true,
      preferredLanguage: "vi",
    },
    create: {
      email: "admin@ilovehust.local",
      phone: "0900000000",
      passwordHash: adminPasswordHash,
      role: 0,
      isActive: true,
      preferredLanguage: "vi",
    },
  });

  const studentSeeds = Array.from({ length: 100 }, (_item, index) => createStudentSeed(index));
  const studentUsers = [];

  for (const [index, item] of studentSeeds.entries()) {
    const user = await prisma.user.upsert({
      where: { email: item.email },
      update: {
        phone: item.phone,
        passwordHash: studentPasswordHash,
        role: 1,
        isActive: true,
        preferredLanguage: index % 9 === 0 ? "ja" : "vi",
        lastLoginAt: index % 4 === 0 ? getRecentDate(index * 3) : getRecentDate(60 * 24 * ((index % 12) + 1)),
      },
      create: {
        email: item.email,
        phone: item.phone,
        passwordHash: studentPasswordHash,
        role: 1,
        isActive: true,
        preferredLanguage: index % 9 === 0 ? "ja" : "vi",
        lastLoginAt: index % 4 === 0 ? getRecentDate(index * 3) : getRecentDate(60 * 24 * ((index % 12) + 1)),
      },
    });

    const major = Object.values(majors)[index % Object.values(majors).length];
    const gpa = (2.6 + (index % 15) / 10).toFixed(2);
    await prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: {
        majorId: major.id,
        fullName: item.fullName,
        studentCode: item.studentCode,
        schoolYear: 1 + (index % 5),
        gpa,
        cpa: gpa,
        profileCompleted: true,
        cttConnected: index % 3 !== 0,
        bio: `Sinh vien ${major.majorName}, quan tam den hoc tap va cong dong HUST.`,
      },
      create: {
        userId: user.id,
        majorId: major.id,
        fullName: item.fullName,
        studentCode: item.studentCode,
        schoolYear: 1 + (index % 5),
        gpa,
        cpa: gpa,
        profileCompleted: true,
        cttConnected: index % 3 !== 0,
        bio: `Sinh vien ${major.majorName}, quan tam den hoc tap va cong dong HUST.`,
      },
    });

    studentUsers.push(user);
  }

  const studentIds = studentUsers.map((user) => user.id);
  await prisma.notification.deleteMany();
  await prisma.messageAttachment.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationMember.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.forumPostLike.deleteMany();
  await prisma.forumComment.deleteMany();
  await prisma.forumPost.deleteMany();
  await prisma.studentScheduleEvent.deleteMany({ where: { userId: { in: studentIds } } });
  await prisma.studentScheduleClass.deleteMany({ where: { userId: { in: studentIds } } });
  await prisma.studentTask.deleteMany({ where: { userId: { in: studentIds } } });
  await prisma.gradeRecord.deleteMany({ where: { userId: { in: studentIds } } });

  const courseList = Object.values(courses);
  const semesterList = Object.values(semesters);
  const gradeRows = [];
  const taskRows = [];
  const scheduleClassRows = [];
  const scheduleEventRows = [];

  for (const [studentIndex, user] of studentUsers.entries()) {
    for (let semesterIndex = 0; semesterIndex < semesterList.length; semesterIndex += 1) {
      for (let offset = 0; offset < 3; offset += 1) {
        const courseIndex = (studentIndex + semesterIndex * 2 + offset) % courseList.length;
        const score10 = score10For(studentIndex, courseIndex, semesterIndex);
        const score4 = score4From10(score10);
        gradeRows.push({
          userId: user.id,
          semesterId: semesterList[semesterIndex].id,
          courseId: courseList[courseIndex].id,
          processScore: Math.max(0, score10 - 0.5).toFixed(2),
          examScore: Math.min(10, score10 + 0.4).toFixed(2),
          score10: score10.toFixed(2),
          score4: score4.toFixed(2),
          letterScore: letterFrom10(score10),
          resultStatus: score10 >= 4 ? "PASSED" : "FAILED",
          importedFromCtt: (studentIndex + courseIndex) % 2 === 0,
        });
      }
    }

    for (let taskIndex = 0; taskIndex < 3; taskIndex += 1) {
      const day = 18 + ((studentIndex + taskIndex) % 10);
      taskRows.push({
        userId: user.id,
        title: ["On tap giua ky", "Hoan thanh bai tap lon", "Hop nhom project"][taskIndex],
        description: `Task demo cho sinh vien ${studentIndex + 1}`,
        dueAt: new Date(`2026-05-${String(day).padStart(2, "0")}T00:00:00.000Z`),
        dueLabel: `2026-05-${String(day).padStart(2, "0")}`,
        completed: (studentIndex + taskIndex) % 4 === 0,
        priority: ["high", "medium", "low"][(studentIndex + taskIndex) % 3],
        category: ["Hoc tap", "Du an", "Ca nhan"][(studentIndex + taskIndex) % 3],
      });
    }

    for (let classIndex = 0; classIndex < 3; classIndex += 1) {
      const course = courseList[(studentIndex + classIndex * 3) % courseList.length];
      scheduleClassRows.push({
        userId: user.id,
        courseId: course.id,
        semesterId: semesters["2025-2"].id,
        subject: course.courseName,
        classType: classIndex % 2 === 0 ? "Ly thuyet" : "Thuc hanh",
        weekday: 1 + ((studentIndex + classIndex) % 6),
        startTime: ["08:00", "10:15", "14:00"][classIndex],
        endTime: ["10:00", "12:00", "16:00"][classIndex],
        room: `D${3 + (studentIndex % 7)}-${100 + studentIndex + classIndex}`,
        color: ["blue", "purple", "green", "orange", "red"][studentIndex % 5],
      });
    }

    scheduleEventRows.push({
      userId: user.id,
      title: "Kiem tra giua ky",
      eventDate: new Date(`2026-05-${String(20 + (studentIndex % 8)).padStart(2, "0")}T00:00:00.000Z`),
      eventTime: "08:00",
      eventType: "exam",
      color: "red",
    });
  }

  await prisma.gradeRecord.createMany({ data: gradeRows, skipDuplicates: true });
  await prisma.studentTask.createMany({ data: taskRows });
  await prisma.studentScheduleClass.createMany({ data: scheduleClassRows });
  await prisma.studentScheduleEvent.createMany({ data: scheduleEventRows });

  const categories = {};
  for (const item of [
    { name: "Hoc tap", slug: "hoc-tap", description: "Trao doi tai lieu, bai tap va kinh nghiem hoc tap", icon: "TrendingUp", color: "blue", sortOrder: 1 },
    { name: "Thac mac", slug: "thac-mac", description: "Dat cau hoi va nhan giai dap tu cong dong", icon: "MessageCircle", color: "purple", sortOrder: 2 },
    { name: "Chia se", slug: "chia-se", description: "Chia se kinh nghiem, co hoi va cau chuyen sinh vien", icon: "Star", color: "green", sortOrder: 3 },
  ]) {
    categories[item.slug] = await prisma.forumCategory.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        description: item.description,
        icon: item.icon,
        color: item.color,
        sortOrder: item.sortOrder,
        isActive: true,
      },
      create: item,
    });
  }

  const categorySlugs = Object.keys(categories);
  const tagPool = ["CTDL", "Database", "React", "NodeJS", "AI", "Intern", "GPA", "HocTap", "Project", "HUST"];
  const createdPosts = [];

  for (let index = 0; index < 100; index += 1) {
    const author = studentUsers[(index * 7 + 3) % studentUsers.length];
    const course = courseList[index % courseList.length];
    const categorySlug = categorySlugs[index % categorySlugs.length];
    const title = postTitles[index % postTitles.length]
      .replace("{course}", course.courseName)
      .replace("{tag}", tagPool[index % tagPool.length]);
    const post = await prisma.forumPost.create({
      data: {
        authorId: author.id,
        categoryId: categories[categorySlug].id,
        title,
        content: `Noi dung bai viet so ${index + 1}. Minh muon trao doi them ve ${course.courseName}, cach hoc hieu qua va kinh nghiem lam bai.`,
        tags: [tagPool[index % tagPool.length], tagPool[(index + 3) % tagPool.length], course.courseCode],
        isHot: index % 5 === 0,
        isPinned: index < 2,
        viewCount: 40 + index * 7,
        createdAt: getRecentDate(45 * (index + 1)),
      },
    });
    createdPosts.push(post);

    const commentCount = 2 + (index % 4);
    await prisma.forumComment.createMany({
      data: Array.from({ length: commentCount }, (_item, commentIndex) => ({
        postId: post.id,
        authorId: studentUsers[(index + commentIndex + 11) % studentUsers.length].id,
        content: commentTemplates[(index + commentIndex) % commentTemplates.length],
        createdAt: getRecentDate(45 * (index + 1) - commentIndex * 7),
      })),
    });

    const likeCount = 8 + (index % 12);
    await prisma.forumPostLike.createMany({
      data: Array.from({ length: likeCount }, (_item, likeIndex) => ({
        postId: post.id,
        userId: studentUsers[(index + likeIndex + 17) % studentUsers.length].id,
      })).filter((like) => like.userId !== author.id),
      skipDuplicates: true,
    });
  }

  const mainStudent = studentUsers[0];
  const conversations = [];

  for (let index = 1; index <= 30; index += 1) {
    const peer = studentUsers[index];
    const conversation = await prisma.conversation.create({
      data: {
        type: "direct",
        createdById: mainStudent.id,
        createdAt: getRecentDate(30 * index),
        updatedAt: getRecentDate(6 * index),
      },
    });
    conversations.push(conversation);
    await prisma.conversationMember.createMany({
      data: [
        {
          conversationId: conversation.id,
          userId: mainStudent.id,
          role: "owner",
          unreadCount: index % 4,
          lastReadAt: index % 4 === 0 ? new Date() : null,
          isStarred: index % 7 === 0,
        },
        {
          conversationId: conversation.id,
          userId: peer.id,
          role: "member",
          unreadCount: 0,
          lastReadAt: new Date(),
        },
      ],
    });

    for (let messageIndex = 0; messageIndex < 8; messageIndex += 1) {
      const sender = messageIndex % 2 === 0 ? peer : mainStudent;
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: sender.id,
          content: messageTemplates[(index + messageIndex) % messageTemplates.length],
          createdAt: getRecentDate(30 * index - messageIndex * 3),
        },
      });
    }
  }

  for (let groupIndex = 0; groupIndex < 8; groupIndex += 1) {
    const memberUsers = [mainStudent, ...Array.from({ length: 5 }, (_item, offset) => studentUsers[31 + groupIndex * 5 + offset])];
    const conversation = await prisma.conversation.create({
      data: {
        title: `Nhom hoc tap ${groupIndex + 1}`,
        type: "group",
        createdById: mainStudent.id,
        createdAt: getRecentDate(800 + groupIndex * 30),
        updatedAt: getRecentDate(20 + groupIndex * 5),
      },
    });
    conversations.push(conversation);
    await prisma.conversationMember.createMany({
      data: memberUsers.map((user, memberIndex) => ({
        conversationId: conversation.id,
        userId: user.id,
        role: memberIndex === 0 ? "owner" : "member",
        unreadCount: memberIndex === 0 ? groupIndex % 3 : 0,
        lastReadAt: memberIndex === 0 && groupIndex % 3 > 0 ? null : new Date(),
        isStarred: groupIndex === 0 && memberIndex === 0,
      })),
    });

    for (let messageIndex = 0; messageIndex < 18; messageIndex += 1) {
      const sender = memberUsers[messageIndex % memberUsers.length];
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: sender.id,
          content: messageTemplates[(groupIndex * 3 + messageIndex) % messageTemplates.length],
          createdAt: getRecentDate(700 + groupIndex * 30 - messageIndex * 4),
        },
      });
    }
  }

  await prisma.notification.createMany({
    data: createdPosts.slice(0, 24).map((post, index) => ({
      userId: mainStudent.id,
      actorId: studentUsers[(index + 5) % studentUsers.length].id,
      type: index % 2 === 0 ? "forum_like" : "forum_comment",
      title: index % 2 === 0 ? "Bai viet cua ban co luot thich moi" : "Bai viet cua ban co binh luan moi",
      message: `Hoat dong moi tren bai viet: ${post.title}`,
      link: "/forum",
      entityType: "forum_post",
      entityId: post.id,
      dedupeKey: `seed-notification-${post.id}-${index}`,
      readAt: index % 4 === 0 ? new Date() : null,
      createdAt: getRecentDate(index * 12),
    })),
    skipDuplicates: true,
  });

  console.log(JSON.stringify({
    students: studentUsers.length,
    forumPosts: createdPosts.length,
    conversations: conversations.length,
    messages: await prisma.message.count(),
    notifications: await prisma.notification.count({ where: { userId: mainStudent.id } }),
  }, null, 2));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
