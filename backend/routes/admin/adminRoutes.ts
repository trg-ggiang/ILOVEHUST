import express from "express";
import prisma from "../../database.js";
import authMiddleware from "../../middleware/authMiddleware.js";
import { emitToAll } from "../../realtime.js";

const router = express.Router();

function requireAdmin(req, res, next) {
  if (req.user?.role !== 0) {
    return res.status(403).json({ message: "Bạn không có quyền truy cập khu vực quản trị" });
  }

  next();
}

router.use(authMiddleware, requireAdmin);

function startOfDay(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysAgo(days) {
  const date = startOfDay();
  date.setDate(date.getDate() - days);
  return date;
}

function monthKey(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}

function monthLabel(date) {
  return `T${date.getMonth() + 1}/${date.getFullYear()}`;
}

function buildLastMonthBuckets(monthCount = 12) {
  const now = new Date();
  const buckets = [];

  for (let index = monthCount - 1; index >= 0; index -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
    buckets.push({
      key: monthKey(date),
      label: monthLabel(date),
      users: 0,
      students: 0,
      admins: 0,
    });
  }

  return buckets;
}

function buildRecentYearBuckets(yearCount = 4, endYear = new Date().getFullYear()) {
  return Array.from({ length: yearCount }, (_, index) => ({
    year: endYear - yearCount + 1 + index,
    value: 0,
  }));
}

function normalizeSchoolYear(value) {
  const year = Number(value);
  if (!Number.isInteger(year)) return null;
  if (year >= 1900) return year;
  if (year >= 1 && year <= 20) return new Date().getFullYear() - year + 1;
  return null;
}

function buildHotTopics(posts) {
  const topicMap = new Map();

  for (const post of posts) {
    const tags = new Set((post.tags || []).map((tag) => String(tag).trim()).filter(Boolean));

    for (const tag of tags) {
      const key = tag.toLowerCase();
      const current = topicMap.get(key) || {
        name: tag.startsWith("#") ? tag : `#${tag}`,
        posts: 0,
        score: 0,
      };
      const likes = post._count?.likes || 0;
      const comments = post._count?.comments || 0;

      current.posts += 1;
      current.score += 1 + likes * 0.7 + comments * 0.9 + (post.isHot ? 4 : 0) + (post.isPinned ? 1.5 : 0);
      topicMap.set(key, current);
    }
  }

  return [...topicMap.values()]
    .sort((a, b) => b.score - a.score || b.posts - a.posts || a.name.localeCompare(b.name))
    .slice(0, 5)
    .map((topic) => ({
      name: topic.name,
      posts: topic.posts,
      score: Number(topic.score.toFixed(1)),
    }));
}

function toAdminUser(user) {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    role: user.role,
    roleLabel: user.role === 0 ? "Admin" : "Sinh viên",
    preferredLanguage: user.preferredLanguage,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    fullName: user.studentProfile?.fullName || (user.role === 0 ? "Admin" : "Chưa cập nhật"),
    studentCode: user.studentProfile?.studentCode || null,
    major: user.studentProfile?.major?.majorName || null,
    schoolYear: user.studentProfile?.schoolYear || null,
    profileCompleted: user.role === 0 ? true : Boolean(user.studentProfile?.profileCompleted),
  };
}

function toAdminPost(post) {
  const authorName = post.author?.studentProfile?.fullName || post.author?.email || "Không rõ";

  return {
    id: post.id,
    title: post.title,
    content: post.content,
    tags: post.tags,
    isHot: post.isHot,
    isPinned: post.isPinned,
    isLocked: post.isLocked,
    viewCount: post.viewCount,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    category: {
      id: post.category?.id,
      name: post.category?.name,
      slug: post.category?.slug,
    },
    author: {
      id: post.author?.id,
      email: post.author?.email,
      fullName: authorName,
    },
    counts: {
      likes: post._count?.likes || 0,
      comments: post._count?.comments || 0,
    },
  };
}

router.get("/summary", async (_req, res) => {
  try {
    const today = startOfDay();
    const last7Days = daysAgo(6);
    const last30Days = daysAgo(29);
    const monthlyBuckets = buildLastMonthBuckets(12);
    const monthlyStart = new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1);

    const [
      totalUsers,
      activeUsers,
      studentUsers,
      adminUsers,
      newUsersToday,
      newUsers7Days,
      newUsers30Days,
      totalPosts,
      hotPosts,
      pinnedPosts,
      lockedPosts,
      totalComments,
      totalLikes,
      monthlyUsers,
      studentsByYear,
      studentsByMajor,
      forumCategories,
      postsForHotTopics,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: 1 } }),
      prisma.user.count({ where: { role: 0 } }),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { createdAt: { gte: last7Days } } }),
      prisma.user.count({ where: { createdAt: { gte: last30Days } } }),
      prisma.forumPost.count(),
      prisma.forumPost.count({ where: { isHot: true } }),
      prisma.forumPost.count({ where: { isPinned: true } }),
      prisma.forumPost.count({ where: { isLocked: true } }),
      prisma.forumComment.count(),
      prisma.forumPostLike.count(),
      prisma.user.findMany({
        where: { createdAt: { gte: monthlyStart } },
        select: { createdAt: true, role: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.studentProfile.groupBy({
        by: ["schoolYear"],
        _count: { _all: true },
        orderBy: { schoolYear: "asc" },
      }),
      prisma.studentProfile.groupBy({
        by: ["majorId"],
        _count: { _all: true },
        orderBy: { _count: { majorId: "desc" } },
      }),
      prisma.forumCategory.findMany({
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: {
          _count: { select: { posts: true } },
          posts: {
            select: {
              isHot: true,
              isPinned: true,
              isLocked: true,
              _count: { select: { comments: true, likes: true } },
            },
          },
        },
      }),
      prisma.forumPost.findMany({
        select: {
          tags: true,
          isHot: true,
          isPinned: true,
          _count: { select: { likes: true, comments: true } },
        },
      }),
    ]);

    const majorIds = studentsByMajor.map((item) => item.majorId).filter((id) => id !== null);
    const majors = majorIds.length
      ? await prisma.major.findMany({ where: { id: { in: majorIds } } })
      : [];
    const majorNameById = new Map(majors.map((major) => [major.id, major.majorName]));
    const monthlyMap = new Map(monthlyBuckets.map((bucket) => [bucket.key, bucket]));

    for (const user of monthlyUsers) {
      const bucket = monthlyMap.get(monthKey(user.createdAt));
      if (!bucket) continue;
      bucket.users += 1;
      if (user.role === 1) bucket.students += 1;
      if (user.role === 0) bucket.admins += 1;
    }

    const yearCounts = new Map();
    for (const item of studentsByYear) {
      const normalizedYear = normalizeSchoolYear(item.schoolYear);
      if (normalizedYear) {
        yearCounts.set(normalizedYear, (yearCounts.get(normalizedYear) || 0) + item._count._all);
      }
    }
    const latestYear = Math.min(
      new Date().getFullYear(),
      Math.max(new Date().getFullYear(), ...yearCounts.keys())
    );
    const recentYearBuckets = buildRecentYearBuckets(4, latestYear);
    const yearMap = new Map(recentYearBuckets.map((bucket) => [bucket.year, bucket]));
    for (const [year, value] of yearCounts) {
      if (yearMap.has(year)) {
        yearMap.get(year).value = value;
      }
    }

    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        studentProfile: {
          include: { major: true },
        },
      },
    });

    const recentPosts = await prisma.forumPost.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        author: { include: { studentProfile: true } },
        category: true,
        _count: { select: { likes: true, comments: true } },
      },
    });

    return res.json({
      stats: {
        totalUsers,
        activeUsers,
        inactiveUsers: totalUsers - activeUsers,
        studentUsers,
        adminUsers,
        newUsersToday,
        newUsers7Days,
        newUsers30Days,
        totalPosts,
        hotPosts,
        pinnedPosts,
        lockedPosts,
        totalComments,
        totalLikes,
      },
      recentUsers: recentUsers.map(toAdminUser),
      recentPosts: recentPosts.map(toAdminPost),
      charts: {
        registrationsByMonth: monthlyBuckets,
        studentsByYear: recentYearBuckets.map((item) => ({
          year: String(item.year),
          value: item.value,
        })),
        usersByType: [
          { name: "Sinh viên", value: studentUsers },
          { name: "Admin", value: adminUsers },
          { name: "Đang hoạt động", value: activeUsers },
          { name: "Đã khóa", value: totalUsers - activeUsers },
        ],
        studentsByMajor: studentsByMajor.map((item) => ({
          name: item.majorId ? majorNameById.get(item.majorId) || `Ngành #${item.majorId}` : "Chưa cập nhật",
          value: item._count._all,
        })),
        hotTopics: buildHotTopics(postsForHotTopics),
        forumByCategory: forumCategories.map((category) => ({
          name: category.name,
          posts: category._count.posts,
          comments: category.posts.reduce((sum, post) => sum + post._count.comments, 0),
          likes: category.posts.reduce((sum, post) => sum + post._count.likes, 0),
          hot: category.posts.filter((post) => post.isHot).length,
          pinned: category.posts.filter((post) => post.isPinned).length,
          locked: category.posts.filter((post) => post.isLocked).length,
        })),
      },
    });
  } catch (error) {
    console.error("ADMIN SUMMARY ERROR:", error);
    return res.status(500).json({ message: "Lỗi server khi tải thống kê quản trị" });
  }
});

router.get("/users", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(Math.max(Number(req.query.limit || 12), 1), 50);
    const search = String(req.query.search || "").trim();
    const role = String(req.query.role || "all");
    const status = String(req.query.status || "all");
    const skip = (page - 1) * limit;

    const where = {
      ...(role === "admin" ? { role: 0 } : {}),
      ...(role === "student" ? { role: 1 } : {}),
      ...(status === "active" ? { isActive: true } : {}),
      ...(status === "inactive" ? { isActive: false } : {}),
      ...(search
        ? {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
              { studentProfile: { is: { fullName: { contains: search, mode: "insensitive" } } } },
              { studentProfile: { is: { studentCode: { contains: search, mode: "insensitive" } } } },
            ],
          }
        : {}),
    };

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          studentProfile: {
            include: { major: true },
          },
        },
      }),
    ]);

    return res.json({
      users: users.map(toAdminUser),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error("ADMIN USERS ERROR:", error);
    return res.status(500).json({ message: "Lỗi server khi tải danh sách người dùng" });
  }
});

router.patch("/users/:userId/status", async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const isActive = Boolean(req.body?.isActive);

    if (!Number.isInteger(userId)) {
      return res.status(400).json({ message: "Người dùng không hợp lệ" });
    }

    if (userId === req.user.id && !isActive) {
      return res.status(400).json({ message: "Không thể tự khóa tài khoản quản trị đang đăng nhập" });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      include: {
        studentProfile: {
          include: { major: true },
        },
      },
    });

    return res.json({ user: toAdminUser(user) });
  } catch (error) {
    console.error("ADMIN USER STATUS ERROR:", error);
    return res.status(500).json({ message: "Lỗi server khi cập nhật trạng thái người dùng" });
  }
});

router.get("/forum/posts", async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(Math.max(Number(req.query.limit || 10), 1), 50);
    const search = String(req.query.search || "").trim();
    const category = String(req.query.category || "all");
    const state = String(req.query.state || "all");
    const skip = (page - 1) * limit;

    const selectedCategory = category === "all"
      ? null
      : await prisma.forumCategory.findUnique({ where: { slug: category } });

    const where = {
      ...(selectedCategory ? { categoryId: selectedCategory.id } : {}),
      ...(state === "hot" ? { isHot: true } : {}),
      ...(state === "pinned" ? { isPinned: true } : {}),
      ...(state === "locked" ? { isLocked: true } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" } },
              { content: { contains: search, mode: "insensitive" } },
              { author: { email: { contains: search, mode: "insensitive" } } },
              { author: { studentProfile: { is: { fullName: { contains: search, mode: "insensitive" } } } } },
            ],
          }
        : {}),
    };

    const [total, posts, categories] = await Promise.all([
      prisma.forumPost.count({ where }),
      prisma.forumPost.findMany({
        where,
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        skip,
        take: limit,
        include: {
          author: { include: { studentProfile: true } },
          category: true,
          _count: { select: { likes: true, comments: true } },
        },
      }),
      prisma.forumCategory.findMany({
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: { _count: { select: { posts: true } } },
      }),
    ]);

    return res.json({
      posts: posts.map(toAdminPost),
      categories: categories.map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        isActive: item.isActive,
        count: item._count.posts,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error("ADMIN FORUM POSTS ERROR:", error);
    return res.status(500).json({ message: "Lỗi server khi tải bài viết diễn đàn" });
  }
});

router.patch("/forum/posts/:postId", async (req, res) => {
  try {
    const postId = Number(req.params.postId);
    if (!Number.isInteger(postId)) {
      return res.status(400).json({ message: "Bài viết không hợp lệ" });
    }

    const data = {};
    for (const key of ["isHot", "isPinned", "isLocked"]) {
      if (typeof req.body?.[key] === "boolean") {
        data[key] = req.body[key];
      }
    }

    const post = await prisma.forumPost.update({
      where: { id: postId },
      data,
      include: {
        author: { include: { studentProfile: true } },
        category: true,
        _count: { select: { likes: true, comments: true } },
      },
    });

    emitToAll("forum:changed", { action: "post_moderated", postId });

    return res.json({ post: toAdminPost(post) });
  } catch (error) {
    console.error("ADMIN FORUM UPDATE ERROR:", error);
    return res.status(500).json({ message: "Lỗi server khi cập nhật bài viết" });
  }
});

router.delete("/forum/posts/:postId", async (req, res) => {
  try {
    const postId = Number(req.params.postId);
    if (!Number.isInteger(postId)) {
      return res.status(400).json({ message: "Bài viết không hợp lệ" });
    }

    await prisma.forumPost.delete({ where: { id: postId } });
    emitToAll("forum:changed", { action: "post_deleted", postId });

    return res.json({ message: "Đã xóa bài viết" });
  } catch (error) {
    console.error("ADMIN FORUM DELETE ERROR:", error);
    return res.status(500).json({ message: "Lỗi server khi xóa bài viết" });
  }
});

export default router;
