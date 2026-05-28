import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Flame,
  Lock,
  LogOut,
  MessageSquareText,
  Pin,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart as ReBarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart as ReLineChart,
  Pie,
  PieChart as RePieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../../services/api";

const numberFormat = new Intl.NumberFormat("vi-VN");
const dateFormat = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const chartColors = ["#dc2626", "#2563eb", "#16a34a", "#7c3aed", "#ea580c", "#0891b2", "#be123c"];

const initialSummary = {
  stats: {
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    studentUsers: 0,
    adminUsers: 0,
    newUsersToday: 0,
    newUsers7Days: 0,
    newUsers30Days: 0,
    totalPosts: 0,
    hotPosts: 0,
    pinnedPosts: 0,
    lockedPosts: 0,
    totalComments: 0,
    totalLikes: 0,
  },
  recentUsers: [],
  recentPosts: [],
  charts: {
    registrationsByMonth: [],
    studentsByYear: [],
    usersByType: [],
    studentsByMajor: [],
    hotTopics: [],
    forumByCategory: [],
  },
};

function formatNumber(value) {
  return numberFormat.format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "Chưa có";
  return dateFormat.format(new Date(value));
}

function getInitials(name) {
  return String(name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function AdminChartPanel({ title, subtitle, children }) {
  return (
    <article className="admin-chart-panel">
      <div className="admin-chart-head">
        <section>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </section>
      </div>
      <div className="admin-chart-body">{children}</div>
    </article>
  );
}

function ForumActivityPanel({ data }) {
  const maxPosts = Math.max(1, ...data.map((item) => item.posts || 0));
  const totals = data.reduce(
    (acc, item) => ({
      posts: acc.posts + (item.posts || 0),
      comments: acc.comments + (item.comments || 0),
      likes: acc.likes + (item.likes || 0),
      hot: acc.hot + (item.hot || 0),
      locked: acc.locked + (item.locked || 0),
    }),
    { posts: 0, comments: 0, likes: 0, hot: 0, locked: 0 }
  );
  const ranked = [...data]
    .map((item) => ({
      ...item,
      engagement: (item.comments || 0) + (item.likes || 0),
      interactionRate: item.posts ? ((item.comments || 0) + (item.likes || 0)) / item.posts : 0,
    }))
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 5);

  return (
    <article className="admin-forum-activity">
      <div className="admin-chart-head">
        <section>
          <h2>Hoat dong forum</h2>
          <p>Quan sat danh muc, tuong tac va trang thai can xu ly</p>
        </section>
      </div>

      <div className="admin-forum-kpis">
        <div><strong>{formatNumber(totals.posts)}</strong><span>Bai viet</span></div>
        <div><strong>{formatNumber(totals.comments)}</strong><span>Binh luan</span></div>
        <div><strong>{formatNumber(totals.likes)}</strong><span>Luot thich</span></div>
        <div><strong>{formatNumber(totals.hot + totals.locked)}</strong><span>Can theo doi</span></div>
      </div>

      <div className="admin-forum-combo">
        <ResponsiveContainer width="100%" height="100%">
          <ReBarChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
            <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 4" />
            <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip formatter={(value) => formatNumber(value)} />
            <Legend />
            <Bar dataKey="posts" name="Bai viet" fill="#dc2626" radius={[8, 8, 0, 0]} />
            <Bar dataKey="comments" name="Binh luan" fill="#2563eb" radius={[8, 8, 0, 0]} />
            <Bar dataKey="likes" name="Luot thich" fill="#16a34a" radius={[8, 8, 0, 0]} />
          </ReBarChart>
        </ResponsiveContainer>
      </div>

      <div className="admin-forum-breakdown">
        {ranked.map((item) => (
          <div className="admin-forum-breakdown-row" key={item.name}>
            <div>
              <strong>{item.name}</strong>
              <span>{formatNumber(item.posts)} bai · {formatNumber(item.interactionRate.toFixed(1))} tuong tac/bai</span>
            </div>
            <div className="admin-forum-progress">
              <span style={{ width: `${Math.max(8, ((item.posts || 0) / maxPosts) * 100)}%` }} />
            </div>
            <small>{formatNumber(item.hot)} hot · {formatNumber(item.locked)} khoa</small>
          </div>
        ))}
      </div>
    </article>
  );
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState("overview");
  const [summary, setSummary] = useState(initialSummary);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [userPagination, setUserPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [postPagination, setPostPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [userFilters, setUserFilters] = useState({ search: "", role: "all", status: "all", page: 1 });
  const [postFilters, setPostFilters] = useState({ search: "", category: "all", state: "all", page: 1 });
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");

  const statCards = useMemo(
    () => [
      {
        label: "Tổng người dùng",
        value: summary.stats.totalUsers,
        hint: `${formatNumber(summary.stats.activeUsers)} đang hoạt động`,
        icon: Users,
        tone: "red",
      },
      {
        label: "Tài khoản mới hôm nay",
        value: summary.stats.newUsersToday,
        hint: `${formatNumber(summary.stats.newUsers7Days)} trong 7 ngày`,
        icon: UserPlus,
        tone: "blue",
      },
      {
        label: "Bài viết forum",
        value: summary.stats.totalPosts,
        hint: `${formatNumber(summary.stats.totalComments)} bình luận`,
        icon: MessageSquareText,
        tone: "green",
      },
      {
        label: "Bài cần chú ý",
        value: summary.stats.hotPosts + summary.stats.pinnedPosts + summary.stats.lockedPosts,
        hint: `${formatNumber(summary.stats.lockedPosts)} đã khóa`,
        icon: ShieldCheck,
        tone: "purple",
      },
    ],
    [summary]
  );

  const loadSummary = async () => {
    const response = await api.get("/admin/summary");
    setSummary(response.data);
  };

  const loadUsers = async (filters = userFilters) => {
    const response = await api.get("/admin/users", { params: { ...filters, limit: 12 } });
    setUsers(response.data.users || []);
    setUserPagination(response.data.pagination || { page: 1, totalPages: 1, total: 0 });
  };

  const loadPosts = async (filters = postFilters) => {
    const response = await api.get("/admin/forum/posts", { params: { ...filters, limit: 10 } });
    setPosts(response.data.posts || []);
    setCategories(response.data.categories || []);
    setPostPagination(response.data.pagination || { page: 1, totalPages: 1, total: 0 });
  };

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      await Promise.all([loadSummary(), loadUsers(), loadPosts()]);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        navigate("/login", { replace: true });
        return;
      }
      setError(err.response?.data?.message || "Không thể tải dữ liệu quản trị");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("token")) {
      navigate("/login", { replace: true });
      return;
    }
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("fullName");
    navigate("/login", { replace: true });
  };

  const applyUserFilters = async (nextFilters) => {
    const filters = { ...userFilters, ...nextFilters };
    setUserFilters(filters);
    setError("");
    try {
      await loadUsers(filters);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải danh sách người dùng");
    }
  };

  const applyPostFilters = async (nextFilters) => {
    const filters = { ...postFilters, ...nextFilters };
    setPostFilters(filters);
    setError("");
    try {
      await loadPosts(filters);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể tải danh sách bài viết");
    }
  };

  const toggleUserStatus = async (user) => {
    const key = `user-${user.id}`;
    setBusyId(key);
    setError("");
    try {
      const response = await api.patch(`/admin/users/${user.id}/status`, { isActive: !user.isActive });
      setUsers((current) => current.map((item) => (item.id === user.id ? response.data.user : item)));
      await loadSummary();
    } catch (err) {
      setError(err.response?.data?.message || "Không thể cập nhật người dùng");
    } finally {
      setBusyId("");
    }
  };

  const updatePost = async (post, field) => {
    const key = `post-${post.id}-${field}`;
    setBusyId(key);
    setError("");
    try {
      const response = await api.patch(`/admin/forum/posts/${post.id}`, { [field]: !post[field] });
      setPosts((current) => current.map((item) => (item.id === post.id ? response.data.post : item)));
      await loadSummary();
    } catch (err) {
      setError(err.response?.data?.message || "Không thể cập nhật bài viết");
    } finally {
      setBusyId("");
    }
  };

  const deletePost = async (postId) => {
    const confirmed = window.confirm("Xóa bài viết này? Toàn bộ bình luận và lượt thích liên quan cũng sẽ bị xóa.");
    if (!confirmed) return;

    const key = `post-${postId}-delete`;
    setBusyId(key);
    setError("");
    try {
      await api.delete(`/admin/forum/posts/${postId}`);
      await Promise.all([loadSummary(), loadPosts(postFilters)]);
    } catch (err) {
      setError(err.response?.data?.message || "Không thể xóa bài viết");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div><ShieldCheck size={24} /></div>
          <section>
            <strong>ILoveHust</strong>
            <span>Admin</span>
          </section>
        </div>

        <nav className="admin-nav" aria-label="Admin navigation">
          <button className={activeView === "overview" ? "active" : ""} onClick={() => setActiveView("overview")}>
            <BarChart3 size={19} />
            <span>Tổng quan</span>
          </button>
          <button className={activeView === "users" ? "active" : ""} onClick={() => setActiveView("users")}>
            <Users size={19} />
            <span>Người dùng</span>
          </button>
          <button className={activeView === "forum" ? "active" : ""} onClick={() => setActiveView("forum")}>
            <MessageSquareText size={19} />
            <span>Forum</span>
          </button>
        </nav>

        <button className="admin-logout" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Đăng xuất</span>
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <span>Bảng điều khiển quản trị</span>
            <h1>Quản lý hệ thống</h1>
          </div>
          <button className="admin-refresh" onClick={loadAll} disabled={loading}>
            Làm mới
          </button>
        </header>

        {error && <p className="admin-alert">{error}</p>}
        {loading ? (
          <div className="admin-loading">Đang tải dữ liệu quản trị...</div>
        ) : (
          <>
            {activeView === "overview" && (
              <section className="admin-section">
                <div className="admin-stat-grid">
                  {[
                    {
                      title: "Nguoi dung",
                      main: statCards[0],
                      extra: statCards[1],
                      metrics: [
                        { label: "Dang hoat dong", value: summary.stats.activeUsers },
                        { label: "Moi hom nay", value: summary.stats.newUsersToday },
                        { label: "Moi 7 ngay", value: summary.stats.newUsers7Days },
                        { label: "Moi 30 ngay", value: summary.stats.newUsers30Days },
                        { label: "Sinh vien", value: summary.stats.studentUsers },
                        { label: "Admin", value: summary.stats.adminUsers },
                      ],
                    },
                    {
                      title: "Forum",
                      main: statCards[2],
                      extra: statCards[3],
                      metrics: [
                        { label: "Binh luan", value: summary.stats.totalComments },
                        { label: "Luot thich", value: summary.stats.totalLikes },
                        { label: "Bai hot", value: summary.stats.hotPosts },
                        { label: "Da ghim", value: summary.stats.pinnedPosts },
                        { label: "Da khoa", value: summary.stats.lockedPosts },
                        { label: "Can chu y", value: summary.stats.hotPosts + summary.stats.pinnedPosts + summary.stats.lockedPosts },
                      ],
                    },
                  ].map((item) => {
                    const Icon = item.main.icon;
                    return (
                      <article className={`admin-stat-card admin-stat-card-wide ${item.main.tone}`} key={item.title}>
                        <div className="admin-stat-summary">
                          <span><Icon size={22} /></span>
                          <section>
                            <p>{item.title}</p>
                            <strong>{formatNumber(item.main.value)}</strong>
                            <small>{item.main.label}</small>
                          </section>
                          <section className="admin-stat-secondary">
                            <strong>{formatNumber(item.extra.value)}</strong>
                            <small>{item.extra.label}</small>
                          </section>
                        </div>
                        <div className="admin-stat-metrics">
                          {item.metrics.map((metric) => (
                            <div key={metric.label}>
                              <strong>{formatNumber(metric.value)}</strong>
                              <span>{metric.label}</span>
                            </div>
                          ))}
                        </div>
                      </article>
                    );
                  })}
                </div>

                <div className="admin-chart-grid">
                  <AdminChartPanel
                    title="Lượt đăng ký theo tháng"
                    subtitle="Theo dõi user mới trong 12 tháng gần nhất"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <ReLineChart data={summary.charts.registrationsByMonth} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
                        <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 4" />
                        <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip formatter={(value) => formatNumber(value)} />
                        <Legend />
                        <Line type="monotone" dataKey="users" name="Tổng đăng ký" stroke="#dc2626" strokeWidth={3} dot={{ r: 4 }} />
                        <Line type="monotone" dataKey="students" name="Sinh viên" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                      </ReLineChart>
                    </ResponsiveContainer>
                  </AdminChartPanel>

                  <AdminChartPanel
                    title="Sinh viên theo năm"
                    subtitle="Phân bổ sinh viên theo khóa/năm nhập học"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={summary.charts.studentsByYear}
                          dataKey="value"
                          nameKey="year"
                          innerRadius={58}
                          outerRadius={92}
                          paddingAngle={2}
                        >
                          {summary.charts.studentsByYear.map((entry, index) => (
                            <Cell key={entry.year} fill={chartColors[index % chartColors.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatNumber(value)} />
                        <Legend />
                      </RePieChart>
                    </ResponsiveContainer>
                  </AdminChartPanel>

                  <AdminChartPanel
                    title="5 chủ đề hot nhất"
                    subtitle="Xếp hạng theo số bài, lượt thích, bình luận và trạng thái hot"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <ReBarChart data={summary.charts.hotTopics} margin={{ top: 8, right: 10, left: -18, bottom: 0 }}>
                        <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 4" />
                        <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip formatter={(value) => formatNumber(value)} />
                        <Bar dataKey="score" name="Điểm hot" radius={[8, 8, 0, 0]}>
                          {summary.charts.hotTopics.map((entry, index) => (
                            <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                          ))}
                        </Bar>
                        <Bar dataKey="posts" name="Số bài" fill="#94a3b8" radius={[8, 8, 0, 0]} />
                      </ReBarChart>
                    </ResponsiveContainer>
                  </AdminChartPanel>

                  <ForumActivityPanel data={summary.charts.forumByCategory} />
                </div>

                <div className="admin-overview-grid">
                  <article className="admin-panel">
                    <div className="admin-panel-head">
                      <h2>Tài khoản mới</h2>
                      <span>{formatNumber(summary.stats.newUsers30Days)} trong 30 ngày</span>
                    </div>
                    <div className="admin-mini-list">
                      {summary.recentUsers.map((user) => (
                        <div className="admin-mini-row" key={user.id}>
                          <div className="admin-avatar">{getInitials(user.fullName)}</div>
                          <section>
                            <strong>{user.fullName}</strong>
                            <p>{user.email}</p>
                          </section>
                          <time>{formatDate(user.createdAt)}</time>
                        </div>
                      ))}
                    </div>
                  </article>

                  <article className="admin-panel">
                    <div className="admin-panel-head">
                      <h2>Forum gần đây</h2>
                      <span>{formatNumber(summary.stats.totalLikes)} lượt thích</span>
                    </div>
                    <div className="admin-mini-list">
                      {summary.recentPosts.map((post) => (
                        <div className="admin-mini-row forum" key={post.id}>
                          <div className="admin-post-dot"><MessageSquareText size={16} /></div>
                          <section>
                            <strong>{post.title}</strong>
                            <p>{post.author.fullName} · {post.category.name}</p>
                          </section>
                          <time>{formatDate(post.createdAt)}</time>
                        </div>
                      ))}
                    </div>
                  </article>
                </div>
              </section>
            )}

            {activeView === "users" && (
              <section className="admin-section">
                <div className="admin-toolbar">
                  <label className="admin-search">
                    <Search size={18} />
                    <input
                      value={userFilters.search}
                      onChange={(event) => setUserFilters((current) => ({ ...current, search: event.target.value }))}
                      onKeyDown={(event) => event.key === "Enter" && applyUserFilters({ page: 1 })}
                      placeholder="Tìm theo tên, email, mã sinh viên"
                    />
                  </label>
                  <select value={userFilters.role} onChange={(event) => applyUserFilters({ role: event.target.value, page: 1 })}>
                    <option value="all">Tất cả vai trò</option>
                    <option value="student">Sinh viên</option>
                    <option value="admin">Admin</option>
                  </select>
                  <select value={userFilters.status} onChange={(event) => applyUserFilters({ status: event.target.value, page: 1 })}>
                    <option value="all">Tất cả trạng thái</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Đã khóa</option>
                  </select>
                  <button onClick={() => applyUserFilters({ page: 1 })}>Tìm</button>
                </div>

                <div className="admin-table-card">
                  <div className="admin-table-head users">
                    <span>Người dùng</span>
                    <span>Vai trò</span>
                    <span>Hồ sơ</span>
                    <span>Ngày tạo</span>
                    <span>Trạng thái</span>
                    <span></span>
                  </div>
                  {users.map((user) => (
                    <div className="admin-table-row users" key={user.id}>
                      <div className="admin-user-cell">
                        <div className="admin-avatar">{getInitials(user.fullName)}</div>
                        <section>
                          <strong>{user.fullName}</strong>
                          <p>{user.email}</p>
                        </section>
                      </div>
                      <span>{user.roleLabel}</span>
                      <span>{user.studentCode || user.major || "Chưa cập nhật"}</span>
                      <span>{formatDate(user.createdAt)}</span>
                      <span className={`admin-status ${user.isActive ? "active" : "locked"}`}>
                        {user.isActive ? "Hoạt động" : "Đã khóa"}
                      </span>
                      <button
                        className="admin-row-action"
                        disabled={busyId === `user-${user.id}`}
                        onClick={() => toggleUserStatus(user)}
                      >
                        {user.isActive ? <Lock size={16} /> : <UserCheck size={16} />}
                      </button>
                    </div>
                  ))}
                  {users.length === 0 && <div className="admin-empty">Không có người dùng phù hợp</div>}
                </div>

                <div className="admin-pagination">
                  <span>{formatNumber(userPagination.total)} người dùng</span>
                  <div>
                    <button disabled={userPagination.page <= 1} onClick={() => applyUserFilters({ page: userPagination.page - 1 })}>Trước</button>
                    <strong>{userPagination.page}/{userPagination.totalPages}</strong>
                    <button disabled={userPagination.page >= userPagination.totalPages} onClick={() => applyUserFilters({ page: userPagination.page + 1 })}>Sau</button>
                  </div>
                </div>
              </section>
            )}

            {activeView === "forum" && (
              <section className="admin-section">
                <div className="admin-toolbar">
                  <label className="admin-search">
                    <Search size={18} />
                    <input
                      value={postFilters.search}
                      onChange={(event) => setPostFilters((current) => ({ ...current, search: event.target.value }))}
                      onKeyDown={(event) => event.key === "Enter" && applyPostFilters({ page: 1 })}
                      placeholder="Tìm theo tiêu đề, nội dung, tác giả"
                    />
                  </label>
                  <select value={postFilters.category} onChange={(event) => applyPostFilters({ category: event.target.value, page: 1 })}>
                    <option value="all">Tất cả danh mục</option>
                    {categories.map((category) => (
                      <option value={category.slug} key={category.id}>{category.name}</option>
                    ))}
                  </select>
                  <select value={postFilters.state} onChange={(event) => applyPostFilters({ state: event.target.value, page: 1 })}>
                    <option value="all">Tất cả trạng thái</option>
                    <option value="hot">Hot</option>
                    <option value="pinned">Đã ghim</option>
                    <option value="locked">Đã khóa</option>
                  </select>
                  <button onClick={() => applyPostFilters({ page: 1 })}>Tìm</button>
                </div>

                <div className="admin-forum-list">
                  {posts.map((post) => (
                    <article className="admin-post-card" key={post.id}>
                      <div className="admin-post-main">
                        <div className="admin-post-title">
                          <h2>{post.title}</h2>
                          <div>
                            {post.isPinned && <span className="admin-chip purple">Ghim</span>}
                            {post.isHot && <span className="admin-chip orange">Hot</span>}
                            {post.isLocked && <span className="admin-chip red">Khóa</span>}
                          </div>
                        </div>
                        <p>{post.content}</p>
                        <div className="admin-post-meta">
                          <span>{post.author.fullName}</span>
                          <span>{post.category.name}</span>
                          <span>{formatNumber(post.counts.likes)} thích</span>
                          <span>{formatNumber(post.counts.comments)} bình luận</span>
                          <span>{formatDate(post.createdAt)}</span>
                        </div>
                      </div>
                      <div className="admin-post-actions">
                        <button className={post.isHot ? "active" : ""} disabled={busyId === `post-${post.id}-isHot`} onClick={() => updatePost(post, "isHot")} title="Đánh dấu hot">
                          <Flame size={17} />
                        </button>
                        <button className={post.isPinned ? "active" : ""} disabled={busyId === `post-${post.id}-isPinned`} onClick={() => updatePost(post, "isPinned")} title="Ghim bài">
                          <Pin size={17} />
                        </button>
                        <button className={post.isLocked ? "active" : ""} disabled={busyId === `post-${post.id}-isLocked`} onClick={() => updatePost(post, "isLocked")} title="Khóa bài">
                          <Lock size={17} />
                        </button>
                        <button className="danger" disabled={busyId === `post-${post.id}-delete`} onClick={() => deletePost(post.id)} title="Xóa bài">
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </article>
                  ))}
                  {posts.length === 0 && <div className="admin-empty">Không có bài viết phù hợp</div>}
                </div>

                <div className="admin-pagination">
                  <span>{formatNumber(postPagination.total)} bài viết</span>
                  <div>
                    <button disabled={postPagination.page <= 1} onClick={() => applyPostFilters({ page: postPagination.page - 1 })}>Trước</button>
                    <strong>{postPagination.page}/{postPagination.totalPages}</strong>
                    <button disabled={postPagination.page >= postPagination.totalPages} onClick={() => applyPostFilters({ page: postPagination.page + 1 })}>Sau</button>
                  </div>
                </div>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
