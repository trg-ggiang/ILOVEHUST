import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

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
  { title: "Hoan thanh bai tap lon Cong nghe phan mem", dueLabel: "Hom nay, 20:00", completed: false, priority: "high" },
  { title: "On tap chuong cay nhi phan mon CTDL", dueLabel: "Hom nay, 21:30", completed: false, priority: "high" },
  { title: "Doc truoc slide Machine Learning", dueLabel: "Ngay mai, 08:00", completed: false, priority: "normal" },
  { title: "Nop bao cao lab Mang may tinh", dueLabel: "Da xong", completed: true, priority: "normal" },
  { title: "Cap nhat CV ung tuyen thuc tap", dueLabel: "Thu 6", completed: false, priority: "low" },
];

const forumCategorySeeds = [
  { name: "Hoc tap", slug: "hoc-tap", description: "Trao doi tai lieu, bai tap va kinh nghiem hoc tap", icon: "TrendingUp", color: "blue", sortOrder: 1 },
  { name: "Thac mac", slug: "thac-mac", description: "Dat cau hoi va nhan giai dap tu cong dong", icon: "MessageCircle", color: "purple", sortOrder: 2 },
  { name: "Chia se", slug: "chia-se", description: "Chia se kinh nghiem, co hoi va cau chuyen sinh vien", icon: "Star", color: "green", sortOrder: 3 },
];

const forumUserSeeds = [
  { email: "nguyenvana@ilovehust.local", phone: "0920000001", fullName: "Nguyen Van A", studentCode: "20240001" },
  { email: "tranthib@ilovehust.local", phone: "0920000002", fullName: "Tran Thi B", studentCode: "20240002" },
  { email: "levanc@ilovehust.local", phone: "0920000003", fullName: "Le Van C", studentCode: "20240003" },
  { email: "phamthid@ilovehust.local", phone: "0920000004", fullName: "Pham Thi D", studentCode: "20240004" },
  { email: "hoangvane@ilovehust.local", phone: "0920000005", fullName: "Hoang Van E", studentCode: "20240005" },
];

const forumPostSeeds = [
  {
    authorEmail: "nguyenvana@ilovehust.local",
    categorySlug: "hoc-tap",
    title: "Can tai lieu on tap mon Cau truc du lieu va giai thuat",
    content:
      "Minh dang chuan bi cho ky thi cuoi ky mon CTDL. Cac ban co tai lieu hay de on tap khong? Dac biet la phan cay nhi phan va do thi.",
    tags: ["CTDL", "Tai lieu", "On tap"],
    isHot: true,
    viewCount: 186,
    comments: [
      "Ban xem lai slide thay co cho tren Teams, phan do thi kha sat de thi.",
      "Minh co file tong hop bai tap, de minh gui len group lop.",
    ],
  },
  {
    authorEmail: "tranthib@ilovehust.local",
    categorySlug: "thac-mac",
    title: "Lam the nao de cai thien performance trong JavaScript?",
    content:
      "Em dang lam project web va gap van de ve hieu suat khi xu ly nhieu data. Moi nguoi co tips nao ve render va cache khong a?",
    tags: ["JavaScript", "Performance", "Web Dev"],
    isHot: false,
    viewCount: 94,
    comments: [
      "Thu kiem tra lai dependency array trong useEffect va tranh render lai list qua nhieu.",
      "Neu list lon thi nen dung pagination hoac virtual list.",
    ],
  },
  {
    authorEmail: "levanc@ilovehust.local",
    categorySlug: "chia-se",
    title: "Share kinh nghiem phong van thuc tap tai FPT Software",
    content:
      "Vua pass phong van intern FPT, minh chia se mot so kinh nghiem. Round 1 test logic, round 2 hoi project va kien thuc OOP, database.",
    tags: ["Thuc tap", "FPT", "Phong van"],
    isHot: true,
    viewCount: 271,
    comments: [
      "Cam on ban, phan hoi project co can demo san pham khong?",
      "Minh thay nen chuan bi them SQL join va transaction.",
      "Bai viet huu ich qua.",
    ],
  },
  {
    authorEmail: "phamthid@ilovehust.local",
    categorySlug: "hoc-tap",
    title: "Tim teammate cho do an cuoi ky mon Cong nghe phan mem",
    content:
      "Minh can tim them 2 ban lam team do an CNPM. Topic la xay dung he thong quan ly thu vien, uu tien ban biet React hoac Node.js.",
    tags: ["Do an", "CNPM", "Team"],
    isHot: false,
    viewCount: 83,
    comments: [
      "Minh co the phu trach backend Node.js.",
      "Team da co thiet ke database chua ban?",
    ],
  },
  {
    authorEmail: "hoangvane@ilovehust.local",
    categorySlug: "thac-mac",
    title: "Hoc Machine Learning nen bat dau tu dau?",
    content:
      "Em moi nam 2 va muon tim hieu ve ML. Anh chi co the recommend roadmap, mon nen hoc truoc va tai lieu phu hop khong a?",
    tags: ["Machine Learning", "AI", "Roadmap"],
    isHot: true,
    viewCount: 238,
    comments: [
      "Nen hoc chac xac suat thong ke va dai so tuyen tinh truoc.",
      "Ban co the bat dau voi Python, numpy, pandas roi sang scikit-learn.",
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
      { sender: "nguyenvana@ilovehust.local", content: "Chao moi nguoi!", minutesAgo: 120 },
      { sender: "student@ilovehust.local", content: "Hi, hom nay minh trao doi bai CTDL nhe.", minutesAgo: 116 },
      { sender: "tranthib@ilovehust.local", content: "Minh dang mac phan cay nhi phan tim kiem.", minutesAgo: 84 },
      { sender: "levanc@ilovehust.local", content: "Mai minh hop luc 2pm nhe cac ban.", minutesAgo: 30 },
    ],
  },
  {
    type: "direct",
    members: ["student@ilovehust.local", "nguyenvana@ilovehust.local"],
    unreadForStudent: 0,
    messages: [
      { sender: "nguyenvana@ilovehust.local", content: "Bai tap hom nay kho qua ban oi.", minutesAgo: 190 },
      { sender: "student@ilovehust.local", content: "Ban dang vuong bai nao?", minutesAgo: 184 },
      { sender: "nguyenvana@ilovehust.local", content: "Bai insert va delete trong BST ay.", minutesAgo: 181 },
      { sender: "student@ilovehust.local", content: "Ok de minh gui tai lieu phan do cho ban.", minutesAgo: 176 },
    ],
  },
  {
    type: "direct",
    members: ["student@ilovehust.local", "tranthib@ilovehust.local"],
    unreadForStudent: 0,
    messages: [
      { sender: "student@ilovehust.local", content: "Minh da xem pull request cua ban roi.", minutesAgo: 1500 },
      { sender: "tranthib@ilovehust.local", content: "Thanks ban nhieu nhe!", minutesAgo: 1440 },
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
      { sender: "phamthid@ilovehust.local", content: "Code da push len Github roi nhe.", minutesAgo: 1340 },
      { sender: "hoangvane@ilovehust.local", content: "Toi nay minh review UI tiep.", minutesAgo: 1320 },
    ],
  },
  {
    type: "direct",
    members: ["student@ilovehust.local", "levanc@ilovehust.local"],
    unreadForStudent: 0,
    messages: [
      { sender: "levanc@ilovehust.local", content: "Oke ban, cam on ban nha.", minutesAgo: 2880 },
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
      fullName: "Nguyen Van A",
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
      fullName: "Nguyen Van A",
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
    data: taskSeeds.map((item, index) => ({
      userId: student.id,
      title: item.title,
      dueAt: new Date(Date.now() + (index + 1) * 60 * 60 * 1000),
      dueLabel: item.dueLabel,
      completed: item.completed,
      priority: item.priority,
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

  console.log("Seed done with grades, tasks, forum, and chat demo data");
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
