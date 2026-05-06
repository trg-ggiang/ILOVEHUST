import express from "express";
import prisma from "../../database.js";
import authMiddleware from "../../middleware/authMiddleware.js";

const router = express.Router();

const CATEGORY_DISPLAY_NAMES = {
  "hoc-tap": "Học tập",
  "thac-mac": "Thắc mắc",
  "chia-se": "Chia sẻ",
};

function toPostResponse(post, currentUserId) {
  const profile = post.author?.studentProfile;
  const likedByCurrentUser = post.likes?.some((like) => like.userId === currentUserId) || false;

  return {
    id: post.id,
    author: profile?.fullName || post.author?.email || "Sinh viên",
    authorInitial: (profile?.fullName || post.author?.email || "?").trim().charAt(0).toUpperCase(),
    title: post.title,
    content: post.content,
    category: post.category?.name || "",
    categorySlug: post.category?.slug || "",
    likes: post._count?.likes || post.likes?.length || 0,
    comments: post._count?.comments || post.comments?.length || 0,
    commentItems: (post.comments || []).map((comment) => {
      const commentProfile = comment.author?.studentProfile;
      const authorName = commentProfile?.fullName || comment.author?.email || "Sinh viên";

      return {
        id: comment.id,
        author: authorName,
        authorInitial: authorName.trim().charAt(0).toUpperCase(),
        content: comment.content,
        time: comment.createdAt,
      };
    }),
    time: post.createdAt,
    tags: post.tags || [],
    isHot: post.isHot,
    isPinned: post.isPinned,
    likedByCurrentUser,
  };
}

function buildTrendingTopics(posts) {
  const topicMap = new Map();

  for (const post of posts) {
    const uniqueTags = new Set((post.tags || []).map((tag) => String(tag).trim()).filter(Boolean));

    for (const tag of uniqueTags) {
      const key = tag.toLowerCase();
      const current = topicMap.get(key) || {
        tag: tag.startsWith("#") ? tag : `#${tag}`,
        count: 0,
        score: 0,
      };
      const likes = post._count?.likes || 0;
      const comments = post._count?.comments || 0;

      current.count += 1;
      current.score += 1 + (post.isHot ? 3 : 0) + likes * 0.5 + comments * 0.75 + (post.viewCount || 0) / 100;
      topicMap.set(key, current);
    }
  }

  return [...topicMap.values()]
    .sort((a, b) => b.score - a.score || b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, 5)
    .map(({ tag, count }) => ({ tag, count }));
}

async function getForumPayload(req) {
  const category = String(req.query.category || "all");
  const search = String(req.query.search || "").trim();

  const categories = await prisma.forumCategory.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: {
      _count: {
        select: { posts: true },
      },
    },
  });

  const selectedCategory = categories.find((item) => item.slug === category);
  const where = {
    ...(category === "hot" ? { isHot: true } : {}),
    ...(selectedCategory ? { categoryId: selectedCategory.id } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { content: { contains: search, mode: "insensitive" } },
            { tags: { has: search } },
          ],
        }
      : {}),
  };

  const posts = await prisma.forumPost.findMany({
    where,
    orderBy: [{ isPinned: "desc" }, { isHot: "desc" }, { createdAt: "desc" }],
    include: {
      author: {
        include: { studentProfile: true },
      },
      category: true,
      likes: {
        where: { userId: req.user.id },
        select: { userId: true },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        include: {
          author: {
            include: { studentProfile: true },
          },
        },
      },
      _count: {
        select: { likes: true, comments: true },
      },
    },
  });

  const [totalCount, hotCount] = await Promise.all([
    prisma.forumPost.count(),
    prisma.forumPost.count({ where: { isHot: true } }),
  ]);

  const postsForTrending = await prisma.forumPost.findMany({
    select: {
      tags: true,
      isHot: true,
      viewCount: true,
      _count: {
        select: { likes: true, comments: true },
      },
    },
  });

  return {
    categories: [
      { name: "Tất cả", slug: "all", count: totalCount, icon: "MessageSquare", color: "red" },
      ...categories.map((item) => ({
        name: CATEGORY_DISPLAY_NAMES[item.slug] || item.name,
        slug: item.slug,
        count: item._count.posts,
        icon: item.icon,
        color: item.color,
      })),
      { name: "Hot", slug: "hot", count: hotCount, icon: "Flame", color: "orange" },
    ],
    posts: posts.map((post) => toPostResponse(post, req.user.id)),
    trendingTopics: buildTrendingTopics(postsForTrending),
  };
}

router.get("/", authMiddleware, async (req, res) => {
  try {
    return res.json(await getForumPayload(req));
  } catch (error) {
    console.error("FORUM LIST ERROR:", error);
    return res.status(500).json({ message: "Lỗi server khi tải diễn đàn" });
  }
});

router.post("/posts", authMiddleware, async (req, res) => {
  try {
    const title = String(req.body?.title || "").trim();
    const content = String(req.body?.content || "").trim();
    const categorySlug = String(req.body?.categorySlug || "hoc-tap").trim();
    const tags = Array.isArray(req.body?.tags)
      ? req.body.tags.map((tag) => String(tag).trim()).filter(Boolean).slice(0, 5)
      : [];

    if (!title || !content) {
      return res.status(400).json({ message: "Tiêu đề và nội dung không được để trống" });
    }

    const category = await prisma.forumCategory.findUnique({
      where: { slug: categorySlug },
    });

    if (!category) {
      return res.status(400).json({ message: "Danh mục diễn đàn không hợp lệ" });
    }

    await prisma.forumPost.create({
      data: {
        authorId: req.user.id,
        categoryId: category.id,
        title,
        content,
        tags,
      },
    });

    return res.status(201).json(await getForumPayload(req));
  } catch (error) {
    console.error("FORUM CREATE POST ERROR:", error);
    return res.status(500).json({ message: "Lỗi server khi tạo bài viết" });
  }
});

router.post("/posts/:postId/likes", authMiddleware, async (req, res) => {
  try {
    const postId = Number(req.params.postId);
    if (!Number.isInteger(postId)) {
      return res.status(400).json({ message: "Bài viết không hợp lệ" });
    }

    const existing = await prisma.forumPostLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: req.user.id,
        },
      },
    });

    if (existing) {
      await prisma.forumPostLike.delete({ where: { id: existing.id } });
    } else {
      await prisma.forumPostLike.create({
        data: {
          postId,
          userId: req.user.id,
        },
      });
    }

    return res.json(await getForumPayload(req));
  } catch (error) {
    console.error("FORUM LIKE ERROR:", error);
    return res.status(500).json({ message: "Lỗi server khi cập nhật lượt thích" });
  }
});

router.post("/posts/:postId/comments", authMiddleware, async (req, res) => {
  try {
    const postId = Number(req.params.postId);
    const content = String(req.body?.content || "").trim();

    if (!Number.isInteger(postId)) {
      return res.status(400).json({ message: "Bài viết không hợp lệ" });
    }

    if (!content) {
      return res.status(400).json({ message: "Nội dung bình luận không được để trống" });
    }

    await prisma.forumComment.create({
      data: {
        postId,
        authorId: req.user.id,
        content,
      },
    });

    return res.status(201).json(await getForumPayload(req));
  } catch (error) {
    console.error("FORUM COMMENT ERROR:", error);
    return res.status(500).json({ message: "Lỗi server khi tạo bình luận" });
  }
});

export default router;
