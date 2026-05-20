import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Clock,
  Filter,
  Flame,
  MessageCircle,
  MessageSquare,
  Plus,
  Search,
  Send,
  Star,
  ThumbsUp,
  TrendingUp,
} from "lucide-react";
import api from "../../api";
import {
  getStoredLanguage,
  getStoredSidebarState,
  setStoredLanguage,
  setStoredSidebarState,
} from "../../i18n/language";
import { FORUM_TEXT, STUDENT_COMMON_TEXT } from "../../i18n/translations";
import StudentHeader from "../../components/student/StudentHeader";
import StudentTaskbar from "../../components/student/StudentTaskbar";
import { handleStudentMenuNavigation } from "../../utils/studentNavigation";
import { useRealtimeRefresh } from "../../utils/useRealtimeRefresh";

const CATEGORY_ICONS = {
  MessageSquare,
  TrendingUp,
  MessageCircle,
  Star,
  Flame,
};

const COLOR_CLASS = {
  red: "red",
  blue: "blue",
  purple: "purple",
  green: "green",
  orange: "orange",
};

function formatRelativeTime(value, text) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMinutes < 60) return text.minuteAgo(diffMinutes);

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return text.hourAgo(diffHours);

  const diffDays = Math.floor(diffHours / 24);
  return text.dayAgo(diffDays);
}

function getCategoryName(category, text) {
  return text.categories[category.slug] || category.name;
}

function mergeForumPayload(current, next, append = false) {
  if (!append) return next;

  const postMap = new Map();
  for (const post of current.posts || []) postMap.set(post.id, post);
  for (const post of next.posts || []) postMap.set(post.id, post);

  return {
    ...next,
    posts: [...postMap.values()],
  };
}

export default function ForumPage() {
  const navigate = useNavigate();
  const loadMoreRef = useRef(null);
  const [language, setLanguage] = useState(getStoredLanguage);
  const [sidebarOpen, setSidebarOpen] = useState(getStoredSidebarState);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [payload, setPayload] = useState({ categories: [], posts: [], trendingTopics: [] });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, hasMore: false });
  const [showPostForm, setShowPostForm] = useState(false);
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    categorySlug: "hoc-tap",
    tags: "",
  });
  const [openCommentsPostId, setOpenCommentsPostId] = useState(null);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [error, setError] = useState("");
  const t = useMemo(() => FORUM_TEXT[language] || FORUM_TEXT.vi, [language]);
  const commonText = useMemo(() => STUDENT_COMMON_TEXT[language] || STUDENT_COMMON_TEXT.vi, [language]);

  const selectableCategories = useMemo(
    () => payload.categories.filter((category) => category.slug !== "all" && category.slug !== "hot"),
    [payload.categories]
  );

  useEffect(() => {
    setStoredLanguage(language);
  }, [language]);

  useEffect(() => {
    setStoredSidebarState(sidebarOpen);
  }, [sidebarOpen]);

  useEffect(() => {
    let mounted = true;

    async function loadForum() {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        setLoading(true);
        const response = await api.get("/forum", {
          params: {
            category: selectedCategory,
            search: searchText,
            page: 1,
            limit: pagination.limit,
          },
        });
        if (!mounted) return;
        setPayload(response.data || { categories: [], posts: [], trendingTopics: [] });
        setPagination(response.data?.pagination || { page: 1, limit: pagination.limit, total: 0, hasMore: false });
      } catch {
        if (!mounted) return;
        setError(t.loadFailed);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    const timeoutId = window.setTimeout(loadForum, 180);
    return () => {
      mounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [navigate, searchText, selectedCategory, t.loadFailed, pagination.limit]);

  function handleMenuClick(key) {
    handleStudentMenuNavigation(key, navigate, "forum");
  }

  async function reloadForum() {
    const response = await api.get("/forum", {
      params: { category: selectedCategory, search: searchText, page: 1, limit: pagination.limit },
    });
    setPayload(response.data || { categories: [], posts: [], trendingTopics: [] });
    setPagination(response.data?.pagination || { page: 1, limit: pagination.limit, total: 0, hasMore: false });
  }

  useRealtimeRefresh(async () => {
    const response = await api.get("/forum", {
      params: { category: selectedCategory, search: searchText, page: 1, limit: pagination.limit },
    });
    const nextPayload = response.data || { categories: [], posts: [], trendingTopics: [] };
    setPayload((current) => mergeForumPayload(current, nextPayload, current.posts.length > nextPayload.posts.length));
    setPagination((current) => {
      const nextPagination = response.data?.pagination || { page: 1, limit: pagination.limit, total: 0, hasMore: false };
      if (current.page > 1) {
        return { ...nextPagination, page: current.page, hasMore: current.page * current.limit < nextPagination.total };
      }
      return nextPagination;
    });
  }, { intervalMs: 30000 });

  async function handleLoadMorePosts() {
    if (!pagination.hasMore || loadingMore) return;

    try {
      setLoadingMore(true);
      setError("");
      const response = await api.get("/forum", {
        params: {
          category: selectedCategory,
          search: searchText,
          page: pagination.page + 1,
          limit: pagination.limit,
        },
      });
      const nextPayload = response.data || { categories: [], posts: [], trendingTopics: [] };
      setPayload((current) => mergeForumPayload(current, nextPayload, true));
      setPagination(response.data?.pagination || { ...pagination, hasMore: false });
    } catch {
      setError(t.loadFailed);
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !pagination.hasMore) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          handleLoadMorePosts();
        }
      },
      { rootMargin: "360px 0px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [pagination.hasMore, pagination.page, loadingMore, selectedCategory, searchText]);

  async function handleCreatePost(event) {
    event.preventDefault();
    const title = newPost.title.trim();
    const content = newPost.content.trim();

    if (!title || !content) {
      setError(t.requiredPost);
      return;
    }

    try {
      setError("");
      const tags = newPost.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
      const response = await api.post("/forum/posts", {
        title,
        content,
        categorySlug: newPost.categorySlug,
        tags,
      });
      setPayload(response.data || payload);
      setNewPost({ title: "", content: "", categorySlug: "hoc-tap", tags: "" });
      setShowPostForm(false);
    } catch {
      setError(t.createFailed);
    }
  }

  async function handleToggleLike(postId) {
    try {
      setError("");
      const response = await api.post(`/forum/posts/${postId}/likes`);
      setPayload(response.data || payload);
    } catch {
      setError(t.likeFailed);
    }
  }

  async function handleReply(event, postId) {
    event.preventDefault();
    const content = (commentDrafts[postId] || "").trim();
    if (!content) return;

    try {
      setError("");
      const response = await api.post(`/forum/posts/${postId}/comments`, { content });
      setPayload(response.data || payload);
      setOpenCommentsPostId(postId);
      setCommentDrafts((current) => ({ ...current, [postId]: "" }));
    } catch {
      setError(t.commentFailed);
    }
  }

  return (
    <div className={`student-layout forum-layout ${sidebarOpen ? "" : "sidebar-collapsed"}`}>
      <StudentTaskbar
        language={language}
        activeKey="forum"
        onMenuClick={handleMenuClick}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <StudentHeader
        fullName={localStorage.getItem("fullName") || commonText.fallbackName}
        studentCode=""
        language={language}
        onLanguageChange={setLanguage}
        onSearchChange={setSearchText}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />

      <main className={`student-main page-fade-in ${sidebarOpen ? "" : "expanded"}`}>
        <section className="student-main-content forum-content">
          <div className="forum-page-head">
            <div>
              <h1>{t.pageTitle}</h1>
              <p>{t.pageSubtitle}</p>
            </div>
            <button type="button" className="create-post-btn" onClick={() => setShowPostForm((prev) => !prev)}>
              <Plus size={18} />
              {t.createPost}
            </button>
          </div>

          {showPostForm ? (
            <form className="forum-create-panel" onSubmit={handleCreatePost}>
              <input
                type="text"
                value={newPost.title}
                onChange={(event) => setNewPost((current) => ({ ...current, title: event.target.value }))}
                placeholder={t.titlePlaceholder}
              />
              <textarea
                value={newPost.content}
                onChange={(event) => setNewPost((current) => ({ ...current, content: event.target.value }))}
                placeholder={t.contentPlaceholder}
                rows={4}
              />
              <div className="forum-create-row">
                <select
                  value={newPost.categorySlug}
                  onChange={(event) => setNewPost((current) => ({ ...current, categorySlug: event.target.value }))}
                >
                  {selectableCategories.map((category) => (
                    <option key={category.slug} value={category.slug}>
                      {getCategoryName(category, t)}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newPost.tags}
                  onChange={(event) => setNewPost((current) => ({ ...current, tags: event.target.value }))}
                  placeholder={t.tagsPlaceholder}
                />
                <button type="submit">{t.submitPost}</button>
              </div>
            </form>
          ) : null}

          <div className="forum-category-grid">
            {payload.categories.map((category) => {
              const Icon = CATEGORY_ICONS[category.icon] || MessageSquare;
              const tone = COLOR_CLASS[category.color] || "red";
              const active = selectedCategory === category.slug;

              return (
                <button
                  key={category.slug}
                  type="button"
                  className={`forum-category ${tone} ${active ? "active" : ""}`}
                  onClick={() => setSelectedCategory(category.slug)}
                >
                  <div>
                    <Icon size={24} />
                    <span>{category.count}</span>
                  </div>
                  <strong>{getCategoryName(category, t)}</strong>
                </button>
              );
            })}
          </div>

          <div className="forum-search-row">
            <label className="forum-search">
              <Search size={18} />
              <input
                type="text"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder={t.searchPlaceholder}
              />
            </label>
            <button type="button" className="forum-filter-btn" onClick={reloadForum}>
              <Filter size={18} />
              {t.filter}
            </button>
          </div>

          {error ? <p className="forum-error">{error}</p> : null}

          <div className="forum-grid">
            <div className="forum-post-list">
              {loading ? <p className="empty-text">{t.loading}</p> : null}
              {!loading && payload.posts.length === 0 ? <p className="empty-text">{t.emptyPosts}</p> : null}

              {payload.posts.map((post) => (
                <article key={post.id} className="forum-post-card">
                  <div className="forum-post-meta">
                    <div className="forum-avatar">{post.authorInitial}</div>
                    <div>
                      <div className="forum-author-line">
                        <strong>{post.author}</strong>
                        <span>
                          <Clock size={13} />
                          {formatRelativeTime(post.time, t)}
                        </span>
                        {post.isHot ? (
                          <em>
                            <Flame size={13} />
                            {t.hot}
                          </em>
                        ) : null}
                      </div>
                      <small>{getCategoryName({ slug: post.categorySlug, name: post.category }, t)}</small>
                    </div>
                  </div>

                  <h2>{post.title}</h2>
                  <p className="forum-post-content">{post.content}</p>

                  <div className="forum-tags">
                    {post.tags.map((tag) => (
                      <span key={tag}>{`#${tag}`}</span>
                    ))}
                  </div>

                  <div className="forum-post-actions">
                    <button
                      type="button"
                      className={`like-action ${post.likedByCurrentUser ? "liked" : "not-liked"}`}
                      onClick={() => handleToggleLike(post.id)}
                    >
                      <ThumbsUp size={18} />
                      {post.likedByCurrentUser ? t.liked : t.like} · {post.likes}
                    </button>
                    <button
                      type="button"
                      className={`comment-action ${openCommentsPostId === post.id ? "active" : ""}`}
                      onClick={() => setOpenCommentsPostId(openCommentsPostId === post.id ? null : post.id)}
                    >
                      <MessageCircle size={18} />
                      {t.comments} · {post.comments}
                    </button>
                  </div>

                  {openCommentsPostId === post.id ? (
                    <div className="forum-comments-panel">
                      <div className="forum-comments-list">
                        {(post.commentItems || []).length === 0 ? (
                          <p className="forum-empty-comments">{t.emptyComments}</p>
                        ) : null}
                        {(post.commentItems || []).map((comment) => (
                          <div key={comment.id} className="forum-comment">
                            <div className="forum-comment-avatar">{comment.authorInitial}</div>
                            <div className="forum-comment-bubble">
                              <div>
                                <strong>{comment.author}</strong>
                                <span>{formatRelativeTime(comment.time, t)}</span>
                              </div>
                              <p>{comment.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <form className="forum-reply-form" onSubmit={(event) => handleReply(event, post.id)}>
                        <input
                          type="text"
                          value={commentDrafts[post.id] || ""}
                          onChange={(event) =>
                            setCommentDrafts((current) => ({ ...current, [post.id]: event.target.value }))
                          }
                          placeholder={t.commentPlaceholder}
                          autoFocus
                        />
                        <button type="submit" aria-label={t.sendComment}>
                          <Send size={16} />
                        </button>
                      </form>
                    </div>
                  ) : null}
                </article>
              ))}

              {pagination.hasMore ? (
                <button
                  ref={loadMoreRef}
                  type="button"
                  className="forum-load-more"
                  onClick={handleLoadMorePosts}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Đang tải..." : "Tải thêm bài viết"}
                </button>
              ) : null}
            </div>

            <aside className="forum-trending">
              <h3>
                <BarChart3 size={20} />
                {t.trending}
              </h3>
              {payload.trendingTopics.map((topic, index) => {
                const topicLabel = typeof topic === "string" ? topic : topic.tag;
                const topicCount = typeof topic === "string" ? 0 : topic.count;

                return (
                  <button key={topicLabel} type="button" onClick={() => setSearchText(topicLabel.replace("#", ""))}>
                    <span>{index + 1}</span>
                    <strong>{topicLabel}</strong>
                    <small>{t.postCount(topicCount)}</small>
                  </button>
                );
              })}
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}
