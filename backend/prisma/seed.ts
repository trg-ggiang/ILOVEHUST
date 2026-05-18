import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

const semesterSeeds = [
  { code: "2023-1", name: "Học kỳ 1 năm học 2023", year: "2023-2024", term: 1, current: false },
  { code: "2023-2", name: "Học kỳ 2 năm học 2023", year: "2023-2024", term: 2, current: false },
  { code: "2024-1", name: "Học kỳ 1 năm học 2024", year: "2024-2025", term: 1, current: false },
  { code: "2024-2", name: "Học kỳ 2 năm học 2024", year: "2024-2025", term: 2, current: false },
  { code: "2025-1", name: "Học kỳ 1 năm học 2025", year: "2025-2026", term: 1, current: false },
  { code: "2025-2", name: "Học kỳ 2 năm học 2025", year: "2025-2026", term: 2, current: true },
];

const courseSeeds = [
  { code: "IT1110", name: "Tin học đại cương", credits: 3 },
  { code: "IT2002", name: "Cơ sở dữ liệu", credits: 3 },
  { code: "IT2020", name: "Lập trình hướng đối tượng", credits: 3 },
  { code: "IT2030", name: "Cấu trúc dữ liệu và giải thuật", credits: 4 },
  { code: "IT2040", name: "Hệ điều hành", credits: 3 },
  { code: "IT2050", name: "Mạng máy tính", credits: 3 },
  { code: "IT3011", name: "Công nghệ phần mềm", credits: 3 },
  { code: "IT3022", name: "Trí tuệ nhân tạo", credits: 3 },
  { code: "IT3033", name: "Học máy", credits: 3 },
  { code: "IT3044", name: "Phát triển ứng dụng web", credits: 3 },
  { code: "IT3055", name: "Bảo mật thông tin", credits: 3 },
  { code: "IT3066", name: "Phân tích dữ liệu", credits: 3 },
];

const gradeSeedRows = [
  { semesterCode: "2023-1", courseCode: "IT1110", score10: 7.8, score4: 3.0, letter: "B", status: "PASSED" },
  { semesterCode: "2023-1", courseCode: "IT2002", score10: 8.1, score4: 3.2, letter: "B+", status: "PASSED" },
  { semesterCode: "2023-1", courseCode: "IT2020", score10: 7.5, score4: 2.8, letter: "B", status: "PASSED" },

  { semesterCode: "2023-2", courseCode: "IT2030", score10: 8.4, score4: 3.4, letter: "B+", status: "PASSED" },
  { semesterCode: "2023-2", courseCode: "IT2040", score10: 8.0, score4: 3.2, letter: "B+", status: "PASSED" },
  { semesterCode: "2023-2", courseCode: "IT2050", score10: 7.7, score4: 3.0, letter: "B", status: "PASSED" },

  { semesterCode: "2024-1", courseCode: "IT3011", score10: 8.9, score4: 3.7, letter: "A", status: "PASSED" },
  { semesterCode: "2024-1", courseCode: "IT3022", score10: 8.2, score4: 3.3, letter: "B+", status: "PASSED" },
  { semesterCode: "2024-1", courseCode: "IT3033", score10: 7.9, score4: 3.1, letter: "B+", status: "PASSED" },

  { semesterCode: "2024-2", courseCode: "IT3044", score10: 9.1, score4: 3.9, letter: "A", status: "PASSED" },
  { semesterCode: "2024-2", courseCode: "IT3055", score10: 8.7, score4: 3.6, letter: "A", status: "PASSED" },
  { semesterCode: "2024-2", courseCode: "IT3066", score10: 8.6, score4: 3.5, letter: "A", status: "PASSED" },

  { semesterCode: "2025-1", courseCode: "IT2030", score10: 9.2, score4: 3.9, letter: "A", status: "PASSED" },
  { semesterCode: "2025-1", courseCode: "IT3022", score10: 8.8, score4: 3.7, letter: "A", status: "PASSED" },
  { semesterCode: "2025-1", courseCode: "IT3044", score10: 9.0, score4: 3.8, letter: "A", status: "PASSED" },

  { semesterCode: "2025-2", courseCode: "IT3033", score10: 9.3, score4: 4.0, letter: "A", status: "PASSED" },
  { semesterCode: "2025-2", courseCode: "IT3055", score10: 9.1, score4: 3.9, letter: "A", status: "PASSED" },
  { semesterCode: "2025-2", courseCode: "IT3066", score10: 9.0, score4: 3.8, letter: "A", status: "PASSED" },
];

const taskSeeds = [
  {
    title: "Nộp bài tập Toán",
    description: "Bài tập chương 3 - Tích phân",
    dueDate: "2026-04-29",
    completed: false,
    priority: "high",
    category: "Học tập",
  },
  {
    title: "Họp nhóm dự án CNPM",
    description: "Review sprint 2 và planning sprint 3",
    dueDate: "2026-04-28",
    completed: false,
    priority: "medium",
    category: "Dự án",
  },
  {
    title: "Ôn tập CTDL",
    description: "Ôn lại phần cây nhị phân và đồ thị",
    dueDate: "2026-04-30",
    completed: false,
    priority: "high",
    category: "Học tập",
  },
  {
    title: "Mượn sách thư viện",
    description: "Sách: Introduction to Algorithms",
    dueDate: "2026-04-28",
    completed: true,
    priority: "low",
    category: "Khác",
  },
  {
    title: "Chuẩn bị slide thuyết trình",
    description: "Bài thuyết trình môn Mạng máy tính",
    dueDate: "2026-05-01",
    completed: false,
    priority: "medium",
    category: "Học tập",
  },
];

const scheduleClassSeeds = [
  { courseCode: "IT3011", subject: "Công nghệ phần mềm", type: "Lý thuyết", start: "08:00", end: "10:00", room: "D3-301", day: 1, color: "blue" },
  { courseCode: "IT3033", subject: "Học máy", type: "Thực hành", start: "10:15", end: "12:00", room: "D5-205", day: 1, color: "purple" },
  { courseCode: "IT2030", subject: "Cấu trúc dữ liệu", type: "Lý thuyết", start: "14:00", end: "16:00", room: "D3-101", day: 2, color: "red" },
  { courseCode: "IT3044", subject: "Phát triển Web", type: "Thực hành", start: "08:00", end: "10:00", room: "Lab 402", day: 3, color: "green" },
  { courseCode: "IT2050", subject: "Mạng máy tính", type: "Lý thuyết", start: "13:00", end: "15:00", room: "D9-201", day: 3, color: "orange" },
  { courseCode: "IT2040", subject: "Hệ điều hành", type: "Lý thuyết", start: "08:00", end: "10:00", room: "D3-204", day: 4, color: "pink" },
  { courseCode: "IT2002", subject: "Quản trị CSDL", type: "Thực hành", start: "15:00", end: "17:00", room: "Lab 305", day: 5, color: "indigo" },
];

const scheduleEventSeeds = [
  { title: "Kiểm tra giữa kỳ CTDL", date: "2026-05-05", time: "08:00", type: "exam", color: "red" },
  { title: "Nộp bài tập lớn Web", date: "2026-05-10", time: "23:59", type: "assignment", color: "blue" },
  { title: "Thuyết trình nhóm CNPM", date: "2026-05-15", time: "14:00", type: "presentation", color: "green" },
];

const forumCategorySeeds = [
  { name: "Học tập", slug: "hoc-tap", description: "Trao đổi tài liệu, bài tập và kinh nghiệm học tập", icon: "TrendingUp", color: "blue", sortOrder: 1 },
  { name: "Thắc mắc", slug: "thac-mac", description: "Đặt câu hỏi và nhận giải đáp từ cộng đồng", icon: "MessageCircle", color: "purple", sortOrder: 2 },
  { name: "Chia sẻ", slug: "chia-se", description: "Chia sẻ kinh nghiệm, cơ hội và câu chuyện sinh viên", icon: "Star", color: "green", sortOrder: 3 },
];

const forumUserSeeds = [
  { email: "nguyenvana@ilovehust.local", phone: "0920000001", fullName: "Nguyễn Văn A", studentCode: "20240001" },
  { email: "tranthib@ilovehust.local", phone: "0920000002", fullName: "Trần Thị B", studentCode: "20240002" },
  { email: "levanc@ilovehust.local", phone: "0920000003", fullName: "Lê Văn C", studentCode: "20240003" },
  { email: "phamthid@ilovehust.local", phone: "0920000004", fullName: "Phạm Thị D", studentCode: "20240004" },
  { email: "hoangvane@ilovehust.local", phone: "0920000005", fullName: "Hoàng Văn E", studentCode: "20240005" },
];

const forumPostSeeds = [
  {
    authorEmail: "nguyenvana@ilovehust.local",
    categorySlug: "hoc-tap",
    title: "Cần tài liệu ôn tập môn Cấu trúc dữ liệu và giải thuật",
    content:
      "Mình đang chuẩn bị cho kỳ thi cuối kỳ môn CTDL. Các bạn có tài liệu hay để ôn tập không? Đặc biệt là phần cây nhị phân và đồ thị.",
    tags: ["CTDL", "Tài liệu", "Ôn tập"],
    isHot: true,
    viewCount: 186,
    comments: [
      "Bạn xem lại slide thầy cô cho trên Teams, phần đồ thị khá sát đề thi.",
      "Mình có file tổng hợp bài tập, để mình gửi lên group lớp.",
    ],
  },
  {
    authorEmail: "tranthib@ilovehust.local",
    categorySlug: "thac-mac",
    title: "Làm thế nào để cải thiện performance trong JavaScript?",
    content:
      "Em đang làm project web và gặp vấn đề về hiệu suất khi xử lý nhiều data. Mọi người có tips nào về render và cache không ạ?",
    tags: ["JavaScript", "Performance", "Web Dev"],
    isHot: false,
    viewCount: 94,
    comments: [
      "Thử kiểm tra lại dependency array trong useEffect và tránh render lại list quá nhiều.",
      "Nếu list lớn thì nên dùng pagination hoặc virtual list.",
    ],
  },
  {
    authorEmail: "levanc@ilovehust.local",
    categorySlug: "chia-se",
    title: "Share kinh nghiem phong van thuc tap tai FPT Software",
    content:
      "Vừa pass phỏng vấn intern FPT, mình chia sẻ một số kinh nghiệm. Round 1 test logic, round 2 hỏi project và kiến thức OOP, database.",
    tags: ["Thực tập", "FPT", "Phỏng vấn"],
    isHot: true,
    viewCount: 271,
    comments: [
      "Cảm ơn bạn, phần hỏi project có cần demo sản phẩm không?",
      "Mình thấy nên chuẩn bị thêm SQL join và transaction.",
      "Bài viết hữu ích quá.",
    ],
  },
  {
    authorEmail: "phamthid@ilovehust.local",
    categorySlug: "hoc-tap",
    title: "Tìm teammate cho đồ án cuối kỳ môn Công nghệ phần mềm",
    content:
      "Mình cần tìm thêm 2 bạn làm team đồ án CNPM. Topic là xây dựng hệ thống quản lý thư viện, ưu tiên bạn biết React hoặc Node.js.",
    tags: ["Đồ án", "CNPM", "Team"],
    isHot: false,
    viewCount: 83,
    comments: [
      "Mình có thể phụ trách backend Node.js.",
      "Team đã có thiết kế database chưa bạn?",
    ],
  },
  {
    authorEmail: "hoangvane@ilovehust.local",
    categorySlug: "thac-mac",
    title: "Học Machine Learning nên bắt đầu từ đâu?",
    content:
      "Em mới năm 2 và muốn tìm hiểu về ML. Anh chị có thể recommend roadmap, môn nên học trước và tài liệu phù hợp không ạ?",
    tags: ["Machine Learning", "AI", "Roadmap"],
    isHot: true,
    viewCount: 238,
    comments: [
      "Nên học chắc xác suất thống kê và đại số tuyến tính trước.",
      "Bạn có thể bắt đầu với Python, numpy, pandas rồi sang scikit-learn.",
    ],
  },
];

const chatSeeds = [
  {
    title: "Nhom CTDL - Nhom 5",
    type: "group",
    members: [
      "student@ilovehust.local",
      "nguyenvana@ilovehust.local",
      "tranthib@ilovehust.local",
      "levanc@ilovehust.local",
    ],
    unreadForStudent: 3,
    messages: [
      { sender: "nguyenvana@ilovehust.local", content: "Chào mọi người!", minutesAgo: 120 },
      { sender: "student@ilovehust.local", content: "Hi, hôm nay mình trao đổi bài CTDL nhé.", minutesAgo: 116 },
      { sender: "tranthib@ilovehust.local", content: "Mình đang mắc phần cây nhị phân tìm kiếm.", minutesAgo: 84 },
      { sender: "levanc@ilovehust.local", content: "Mai mình họp lúc 2pm nhé các bạn.", minutesAgo: 30 },
    ],
  },
  {
    type: "direct",
    members: ["student@ilovehust.local", "nguyenvana@ilovehust.local"],
    unreadForStudent: 0,
    messages: [
      { sender: "nguyenvana@ilovehust.local", content: "Bài tập hôm nay khó quá bạn ơi.", minutesAgo: 190 },
      { sender: "student@ilovehust.local", content: "Bạn đang vướng bài nào?", minutesAgo: 184 },
      { sender: "nguyenvana@ilovehust.local", content: "Bài insert và delete trong BST ấy.", minutesAgo: 181 },
      { sender: "student@ilovehust.local", content: "Ok để mình gửi tài liệu phần đó cho bạn.", minutesAgo: 176 },
    ],
  },
  {
    type: "direct",
    members: ["student@ilovehust.local", "tranthib@ilovehust.local"],
    unreadForStudent: 0,
    messages: [
      { sender: "student@ilovehust.local", content: "Mình đã xem pull request của bạn rồi.", minutesAgo: 1500 },
      { sender: "tranthib@ilovehust.local", content: "Thanks bạn nhiều nhé!", minutesAgo: 1440 },
    ],
  },
  {
    title: "Nhom Web Dev",
    type: "group",
    members: [
      "student@ilovehust.local",
      "phamthid@ilovehust.local",
      "hoangvane@ilovehust.local",
      "tranthib@ilovehust.local",
    ],
    unreadForStudent: 1,
    messages: [
      { sender: "phamthid@ilovehust.local", content: "Code đã push lên Github rồi nhé.", minutesAgo: 1340 },
      { sender: "hoangvane@ilovehust.local", content: "Tối nay mình review UI tiếp.", minutesAgo: 1320 },
    ],
  },
  {
    type: "direct",
    members: ["student@ilovehust.local", "levanc@ilovehust.local"],
    unreadForStudent: 0,
    messages: [
      { sender: "levanc@ilovehust.local", content: "Oke bạn, cảm ơn bạn nha.", minutesAgo: 2880 },
    ],
  },
];

async function main() {
  const major = await prisma.major.upsert({
    where: { majorCode: "IT-E10" },
    update: {
      majorName: "Cong nghe thong tin",
      facultyName: "Truong Cong nghe Thong tin va Truyen thong",
    },
    create: {
      majorCode: "IT-E10",
      majorName: "Cong nghe thong tin",
      facultyName: "Truong Cong nghe Thong tin va Truyen thong",
    },
  });

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
      update: {
        courseName: item.name,
        credits: item.credits,
      },
      create: {
        courseCode: item.code,
        courseName: item.name,
        credits: item.credits,
      },
    });
  }

  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const studentPasswordHash = await bcrypt.hash("student123", 10);

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

  const student = await prisma.user.upsert({
    where: { email: "student@ilovehust.local" },
    update: {
      phone: "0911111111",
      passwordHash: studentPasswordHash,
      role: 1,
      isActive: true,
      preferredLanguage: "vi",
      lastLoginAt: new Date(),
    },
    create: {
      email: "student@ilovehust.local",
      phone: "0911111111",
      passwordHash: studentPasswordHash,
      role: 1,
      isActive: true,
      preferredLanguage: "vi",
      lastLoginAt: new Date(),
    },
  });

  await prisma.studentProfile.upsert({
    where: { userId: student.id },
    update: {
      majorId: major.id,
      fullName: "Nguyễn Văn A",
      studentCode: "20241234",
      schoolYear: 3,
      gpa: "3.75",
      cpa: "3.62",
      profileCompleted: true,
      cttConnected: true,
    },
    create: {
      userId: student.id,
      majorId: major.id,
      fullName: "Nguyễn Văn A",
      studentCode: "20241234",
      schoolYear: 3,
      gpa: "3.75",
      cpa: "3.62",
      profileCompleted: true,
      cttConnected: true,
    },
  });

  const forumUsers = {};
  for (const item of forumUserSeeds) {
    const isRecentlyOnline = ["nguyenvana@ilovehust.local", "phamthid@ilovehust.local"].includes(item.email);
    const user = await prisma.user.upsert({
      where: { email: item.email },
      update: {
        phone: item.phone,
        passwordHash: studentPasswordHash,
        role: 1,
        isActive: true,
        preferredLanguage: "vi",
        lastLoginAt: isRecentlyOnline ? new Date() : new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
      create: {
        email: item.email,
        phone: item.phone,
        passwordHash: studentPasswordHash,
        role: 1,
        isActive: true,
        preferredLanguage: "vi",
        lastLoginAt: isRecentlyOnline ? new Date() : new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.studentProfile.upsert({
      where: { userId: user.id },
      update: {
        majorId: major.id,
        fullName: item.fullName,
        studentCode: item.studentCode,
        schoolYear: 3,
        profileCompleted: true,
        cttConnected: true,
      },
      create: {
        userId: user.id,
        majorId: major.id,
        fullName: item.fullName,
        studentCode: item.studentCode,
        schoolYear: 3,
        profileCompleted: true,
        cttConnected: true,
      },
    });

    forumUsers[item.email] = user;
  }

  await prisma.gradeRecord.deleteMany({
    where: { userId: student.id },
  });

  await prisma.gradeRecord.createMany({
    data: gradeSeedRows.map((row, idx) => ({
      userId: student.id,
      semesterId: semesters[row.semesterCode].id,
      courseId: courses[row.courseCode].id,
      processScore: Math.max(0, row.score10 - 0.6).toFixed(2),
      examScore: Math.min(10, row.score10 + 0.4).toFixed(2),
      score10: row.score10.toFixed(2),
      score4: row.score4.toFixed(2),
      letterScore: row.letter,
      resultStatus: row.status,
      importedFromCtt: idx % 2 === 0,
    })),
  });

  await prisma.studentTask.deleteMany({
    where: { userId: student.id },
  });

  await prisma.studentTask.createMany({
    data: taskSeeds.map((item) => ({
      userId: student.id,
      title: item.title,
      description: item.description,
      dueAt: new Date(`${item.dueDate}T00:00:00.000Z`),
      dueLabel: item.dueDate,
      completed: item.completed,
      priority: item.priority,
      category: item.category,
    })),
  });

  await prisma.studentScheduleEvent.deleteMany({
    where: { userId: student.id },
  });

  await prisma.studentScheduleClass.deleteMany({
    where: { userId: student.id },
  });

  await prisma.studentScheduleClass.createMany({
    data: scheduleClassSeeds.map((item) => ({
      userId: student.id,
      courseId: courses[item.courseCode]?.id || null,
      semesterId: semesters["2025-2"].id,
      subject: item.subject,
      classType: item.type,
      weekday: item.day,
      startTime: item.start,
      endTime: item.end,
      room: item.room,
      color: item.color,
    })),
  });

  await prisma.studentScheduleEvent.createMany({
    data: scheduleEventSeeds.map((item) => ({
      userId: student.id,
      title: item.title,
      eventDate: new Date(`${item.date}T00:00:00.000Z`),
      eventTime: item.time,
      eventType: item.type,
      color: item.color,
    })),
  });

  await prisma.forumPostLike.deleteMany();
  await prisma.forumComment.deleteMany();
  await prisma.forumPost.deleteMany();

  const categories = {};
  for (const item of forumCategorySeeds) {
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
      create: {
        name: item.name,
        slug: item.slug,
        description: item.description,
        icon: item.icon,
        color: item.color,
        sortOrder: item.sortOrder,
        isActive: true,
      },
    });
  }

  const likeUsers = [student, ...Object.values(forumUsers)];
  for (const [index, item] of forumPostSeeds.entries()) {
    const author = forumUsers[item.authorEmail] || student;
    const post = await prisma.forumPost.create({
      data: {
        authorId: author.id,
        categoryId: categories[item.categorySlug].id,
        title: item.title,
        content: item.content,
        tags: item.tags,
        isHot: item.isHot,
        isPinned: index === 0,
        viewCount: item.viewCount,
        createdAt: new Date(Date.now() - (index + 2) * 60 * 60 * 1000),
      },
    });

    await prisma.forumComment.createMany({
      data: item.comments.map((content, commentIndex) => ({
        postId: post.id,
        authorId: likeUsers[(index + commentIndex + 1) % likeUsers.length].id,
        content,
        createdAt: new Date(Date.now() - (index + commentIndex + 1) * 45 * 60 * 1000),
      })),
    });

    await prisma.forumPostLike.createMany({
      data: likeUsers
        .filter((user) => user.id !== author.id)
        .slice(0, item.isHot ? 5 : 3)
        .map((user) => ({
          postId: post.id,
          userId: user.id,
        })),
      skipDuplicates: true,
    });
  }

  await prisma.message.deleteMany();
  await prisma.conversationMember.deleteMany();
  await prisma.conversation.deleteMany();

  const chatUsers = {
    "student@ilovehust.local": student,
    ...forumUsers,
  };

  for (const [index, item] of chatSeeds.entries()) {
    const conversation = await prisma.conversation.create({
      data: {
        title: item.title || null,
        type: item.type,
        createdById: student.id,
        createdAt: new Date(Date.now() - (index + 2) * 60 * 60 * 1000),
      },
    });

    await prisma.conversationMember.createMany({
      data: item.members.map((email) => ({
        conversationId: conversation.id,
        userId: chatUsers[email].id,
        role: email === "student@ilovehust.local" ? "owner" : "member",
        unreadCount: email === "student@ilovehust.local" ? item.unreadForStudent : 0,
        lastReadAt: email === "student@ilovehust.local" && item.unreadForStudent > 0 ? null : new Date(),
        isStarred: index === 0 && email === "student@ilovehust.local",
      })),
    });

    for (const message of item.messages) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: chatUsers[message.sender].id,
          content: message.content,
          createdAt: new Date(Date.now() - message.minutesAgo * 60 * 1000),
        },
      });
    }
  }

  console.log("Seed done with grades, tasks, schedule, forum, and chat demo data");
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
