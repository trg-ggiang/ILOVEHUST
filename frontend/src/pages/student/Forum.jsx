import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
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
import StudentHeader from "../../components/student/StudentHeader";
import StudentTaskbar from "../../components/student/StudentTaskbar";
import "./Dashboard.css";
import "./Forum.css";

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

function formatRelativeTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMinutes < 60) return `${diffMinutes} phut truoc`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} gio truoc`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} ngay truoc`;
}

export default function ForumPage() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState(getStoredLanguage);
  const [sidebarOpen, setSidebarOpen] = useState(getStoredSidebarState);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [payload, setPayload] = useState({ categories: [], posts: [], trendingTopics: [] });
  const [loading, setLoading] = useState(true);
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
          },
        });
        if (!mounted) return;
        setPayload(response.data || { categories: [], posts: [], trendingTopics: [] });
      } catch {
        if (!mounted) return;
        setError("Khong the tai dien dan.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    const timeoutId = window.setTimeout(loadForum, 180);
    return () => {
      mounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [navigate, searchText, selectedCategory]);

  function handleMenuClick(key) {
    if (key === "logout") {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("fullName");
      navigate("/login", { replace: true });
      return;
    }

    if (key === "home") {
      navigate("/dashboard");
      return;
    }

    if (key === "grades") {
      navigate("/grades");
      return;
    }

    if (key === "forum") return;

    if (key === "messages") {
      navigate("/messages");
    }
  }

  async function reloadForum() {
    const response = await api.get("/forum", {
      params: { category: selectedCategory, search: searchText },
    });
    setPayload(response.data || { categories: [], posts: [], trendingTopics: [] });
  }

  async function handleCreatePost(event) {
    event.preventDefault();
    const title = newPost.title.trim();
    const content = newPost.content.trim();

    if (!title || !content) {
      setError("Vui long nhap tieu de va noi dung.");
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
      setError("Khong the tao bai viet.");
    }
  }

  async function handleToggleLike(postId) {
    try {
      setError("");
      const response = await api.post(`/forum/posts/${postId}/likes`);
      setPayload(response.data || payload);
    } catch {
      setError("Khong the cap nhat like.");
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
      setError("Khong the gui binh luan.");
    }
  }

  return (
    <div className="student-layout forum-layout">
      <StudentTaskbar
        language={language}
        activeKey="forum"
        onMenuClick={handleMenuClick}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className={`student-main page-fade-in ${sidebarOpen ? "" : "expanded"}`}>
        <StudentHeader
          fullName={localStorage.getItem("fullName") || "Student"}
          studentCode=""
          language={language}
          onLanguageChange={setLanguage}
          onSearchChange={setSearchText}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />

        <section className="student-main-content forum-content">
          <div className="forum-page-head">
            <div>
              <h1>Dien dan</h1>
              <p>Noi trao doi kien thuc va ket noi cong dong</p>
            </div>
            <button type="button" className="create-post-btn" onClick={() => setShowPostForm((prev) => !prev)}>
              <Plus size={18} />
              Tao bai viet
            </button>
          </div>

          {showPostForm ? (
            <form className="forum-create-panel" onSubmit={handleCreatePost}>
              <input
                type="text"
                value={newPost.title}
                onChange={(event) => setNewPost((current) => ({ ...current, title: event.target.value }))}
                placeholder="Tieu de bai viet"
              />
              <textarea
                value={newPost.content}
                onChange={(event) => setNewPost((current) => ({ ...current, content: event.target.value }))}
                placeholder="Ban muon chia se dieu gi?"
                rows={4}
              />
              <div className="forum-create-row">
                <select
                  value={newPost.categorySlug}
                  onChange={(event) => setNewPost((current) => ({ ...current, categorySlug: event.target.value }))}
                >
                  {selectableCategories.map((category) => (
                    <option key={category.slug} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newPost.tags}
                  onChange={(event) => setNewPost((current) => ({ ...current, tags: event.target.value }))}
                  placeholder="Tags, cach nhau bang dau phay"
                />
                <button type="submit">Dang bai</button>
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
                  <strong>{category.name}</strong>
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
                placeholder="Tim kiem bai viet..."
              />
            </label>
            <button type="button" className="forum-filter-btn" onClick={reloadForum}>
              <Filter size={18} />
              Bo loc
            </button>
          </div>

          {error ? <p className="forum-error">{error}</p> : null}

          <div className="forum-grid">
            <div className="forum-post-list">
              {loading ? <p className="empty-text">Dang tai dien dan...</p> : null}
              {!loading && payload.posts.length === 0 ? <p className="empty-text">Chua co bai viet phu hop.</p> : null}

              {payload.posts.map((post) => (
                <article key={post.id} className="forum-post-card">
                  <div className="forum-post-meta">
                    <div className="forum-avatar">{post.authorInitial}</div>
                    <div>
                      <div className="forum-author-line">
                        <strong>{post.author}</strong>
                        <span>
                          <Clock size={13} />
                          {formatRelativeTime(post.time)}
                        </span>
                        {post.isHot ? (
                          <em>
                            <Flame size={13} />
                            Hot
                          </em>
                        ) : null}
                      </div>
                      <small>{post.category}</small>
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
                      {post.likedByCurrentUser ? "Da thich" : "Thich"} · {post.likes}
                    </button>
                    <button
                      type="button"
                      className={`comment-action ${openCommentsPostId === post.id ? "active" : ""}`}
                      onClick={() => setOpenCommentsPostId(openCommentsPostId === post.id ? null : post.id)}
                    >
                      <MessageCircle size={18} />
                      Binh luan · {post.comments}
                    </button>
                  </div>

                  {openCommentsPostId === post.id ? (
                    <div className="forum-comments-panel">
                      <div className="forum-comments-list">
                        {(post.commentItems || []).length === 0 ? (
                          <p className="forum-empty-comments">Chua co binh luan nao.</p>
                        ) : null}
                        {(post.commentItems || []).map((comment) => (
                          <div key={comment.id} className="forum-comment">
                            <div className="forum-comment-avatar">{comment.authorInitial}</div>
                            <div className="forum-comment-bubble">
                              <div>
                                <strong>{comment.author}</strong>
                                <span>{formatRelativeTime(comment.time)}</span>
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
                          placeholder="Viet binh luan..."
                          autoFocus
                        />
                        <button type="submit" aria-label="Gui binh luan">
                          <Send size={16} />
                        </button>
                      </form>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>

            <aside className="forum-trending">
              <h3>
                <BarChart3 size={20} />
                Chủ đề đang hot
              </h3>
              {payload.trendingTopics.map((topic, index) => {
                const topicLabel = typeof topic === "string" ? topic : topic.tag;
                const topicCount = typeof topic === "string" ? 0 : topic.count;

                return (
                  <button key={topicLabel} type="button" onClick={() => setSearchText(topicLabel.replace("#", ""))}>
                    <span>{index + 1}</span>
                    <strong>{topicLabel}</strong>
                    <small>{topicCount} bài</small>
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
