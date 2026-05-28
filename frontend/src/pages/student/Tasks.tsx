import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calendar,
  CheckSquare,
  Clock,
  Edit,
  Flag,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import api from "../../services/api";
import {
  getStoredLanguage,
  getStoredSidebarState,
  setStoredLanguage,
  setStoredSidebarState,
} from "../../i18n/language";
import { STUDENT_COMMON_TEXT, TASKS_TEXT } from "../../i18n/translations";
import StudentHeader from "../../components/student/StudentHeader";
import StudentTaskbar from "../../components/student/StudentTaskbar";
import { handleStudentMenuNavigation } from "../../utils/studentNavigation";

const EMPTY_FORM = {
  title: "",
  description: "",
  dueDate: "",
  priority: "medium",
  category: "Học tập",
};

const DEFAULT_STATS = {
  total: 0,
  active: 0,
  completed: 0,
  highPriority: 0,
  progress: 0,
};

const TASK_COMPLETE_ANIMATION_MS = 500;

const FILTER_OPTIONS = ["all", "active", "completed"];

const CATEGORY_OPTIONS = [
  { key: "study", value: "Học tập" },
  { key: "project", value: "Dự án" },
  { key: "personal", value: "Cá nhân" },
  { key: "other", value: "Khác" },
];

function formatDate(value, language, text) {
  if (!value) return text.noDueDate;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(language === "ja" ? "ja-JP" : "vi-VN");
}

function getPriorityText(priority, text) {
  if (priority === "high") return text.priorities.high;
  if (priority === "low") return text.priorities.low;
  return text.priorities.medium;
}

function getCategoryLabel(category, text) {
  const option = CATEGORY_OPTIONS.find((item) => item.value === category);
  return option ? text.categories[option.key] : category || text.categories.other;
}

function getTaskForm(task) {
  return {
    title: task?.title || task?.task || "",
    description: task?.description || "",
    dueDate: task?.dueDate || "",
    priority: task?.priority || "medium",
    category: task?.category || "Học tập",
  };
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export default function TasksPage() {
  const navigate = useNavigate();
  const loadMoreRef = useRef(null);
  const [language, setLanguage] = useState(getStoredLanguage);
  const [sidebarOpen, setSidebarOpen] = useState(getStoredSidebarState);
  const [profile, setProfile] = useState({
    fullName: localStorage.getItem("fullName") || "",
    studentCode: "",
  });
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, hasMore: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [completingTaskIds, setCompletingTaskIds] = useState(new Set());
  const t = useMemo(() => TASKS_TEXT[language] || TASKS_TEXT.vi, [language]);
  const commonText = useMemo(() => STUDENT_COMMON_TEXT[language] || STUDENT_COMMON_TEXT.vi, [language]);
  const filterOptions = useMemo(
    () => FILTER_OPTIONS.map((value) => ({ value, label: t.filters[value] })),
    [t]
  );
  const categoryOptions = useMemo(
    () => CATEGORY_OPTIONS.map((item) => ({ ...item, label: t.categories[item.key] })),
    [t]
  );

  const progress = useMemo(() => {
    if (Number.isFinite(stats.progress)) return stats.progress;
    return stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;
  }, [stats]);

  useEffect(() => {
    setStoredLanguage(language);
  }, [language]);

  useEffect(() => {
    setStoredSidebarState(sidebarOpen);
  }, [sidebarOpen]);

  async function loadTasks(nextStatus = filterStatus, nextSearch = searchText, nextPage = 1, append = false) {
    const response = await api.get("/students/me/tasks", {
      params: {
        status: nextStatus,
        search: nextSearch,
        page: nextPage,
        limit: pagination.limit,
      },
    });
    const nextTasks = response.data?.tasks || [];
    setTasks((current) => (append ? [...current, ...nextTasks] : nextTasks));
    setStats(response.data?.stats || DEFAULT_STATS);
    setPagination(response.data?.pagination || { page: nextPage, limit: pagination.limit, total: nextTasks.length, hasMore: false });
  }

  useEffect(() => {
    let mounted = true;

    async function loadPage() {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        setLoading(true);
        setError("");
        const [meResponse, taskResponse] = await Promise.all([
          api.get("/auth/me"),
          api.get("/students/me/tasks", {
            params: {
              status: "all",
              search: "",
              page: 1,
              limit: 20,
            },
          }),
        ]);

        if (!mounted) return;

        const user = meResponse.data?.user;
        if (user?.role === 1 && !user.profileCompleted) {
          navigate("/complete-profile", { replace: true });
          return;
        }

        setProfile({
          fullName: user?.fullName || "",
          studentCode: user?.studentCode || "",
        });
        setTasks(taskResponse.data?.tasks || []);
        setStats(taskResponse.data?.stats || DEFAULT_STATS);
        setPagination(taskResponse.data?.pagination || { page: 1, limit: 20, total: 0, hasMore: false });
      } catch {
        if (!mounted) return;
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadPage();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (loading) return undefined;

    let mounted = true;
    const timeoutId = window.setTimeout(async () => {
      try {
        setError("");
        const response = await api.get("/students/me/tasks", {
          params: {
            status: filterStatus,
            search: searchText,
            page: 1,
            limit: pagination.limit,
          },
        });
        if (!mounted) return;
        setTasks(response.data?.tasks || []);
        setStats(response.data?.stats || DEFAULT_STATS);
        setPagination(response.data?.pagination || { page: 1, limit: pagination.limit, total: 0, hasMore: false });
      } catch {
        if (mounted) setError(t.loadFailed);
      }
    }, 180);

    return () => {
      mounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [filterStatus, searchText, loading, t.loadFailed, pagination.limit]);

  async function handleLoadMoreTasks() {
    if (!pagination.hasMore || loadingMore) return;

    try {
      setLoadingMore(true);
      setError("");
      await loadTasks(filterStatus, searchText, pagination.page + 1, true);
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
          handleLoadMoreTasks();
        }
      },
      { rootMargin: "320px 0px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [pagination.hasMore, pagination.page, loadingMore, filterStatus, searchText]);

  function handleMenuClick(key) {
    handleStudentMenuNavigation(key, navigate, "tasks");
  }

  function openCreateModal() {
    setEditingTaskId(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowTaskModal(true);
  }

  function openEditModal(task) {
    setEditingTaskId(task.id);
    setForm(getTaskForm(task));
    setError("");
    setShowTaskModal(true);
  }

  async function handleSubmitTask(event) {
    event.preventDefault();
    const title = form.title.trim();

    if (!title) {
      setError(t.requiredTitle);
      return;
    }

    try {
      setSaving(true);
      setError("");
      const payload = {
        title,
        description: form.description.trim(),
        dueDate: form.dueDate,
        priority: form.priority,
        category: form.category,
      };

      if (editingTaskId) {
        await api.patch(`/students/me/tasks/${editingTaskId}`, payload);
      } else {
        await api.post("/students/me/tasks", payload);
      }

      setShowTaskModal(false);
      setEditingTaskId(null);
      setForm(EMPTY_FORM);
      await loadTasks(filterStatus, searchText, 1, false);
    } catch {
      setError(editingTaskId ? t.updateFailed : t.createFailed);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleTask(taskId) {
    const previousTasks = tasks;
    const currentTask = tasks.find((task) => task.id === taskId);
    const isCompleting = currentTask ? !currentTask.completed : false;

    if (isCompleting) {
      setCompletingTaskIds((current) => new Set(current).add(taskId));
    }

    setTasks((current) =>
      current.map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );

    try {
      setError("");
      await api.patch(`/students/me/tasks/${taskId}/toggle`);
      if (isCompleting) {
        await wait(TASK_COMPLETE_ANIMATION_MS);
      }
      await loadTasks(filterStatus, searchText, 1, false);
    } catch {
      setTasks(previousTasks);
      setCompletingTaskIds((current) => {
        const next = new Set(current);
        next.delete(taskId);
        return next;
      });
      setError(t.statusFailed);
    } finally {
      if (isCompleting) {
        setCompletingTaskIds((current) => {
          const next = new Set(current);
          next.delete(taskId);
          return next;
        });
      }
    }
  }

  async function handleDeleteTask(taskId) {
    const previousTasks = tasks;
    setTasks((current) => current.filter((task) => task.id !== taskId));

    try {
      setError("");
      await api.delete(`/students/me/tasks/${taskId}`);
      await loadTasks(filterStatus, searchText, 1, false);
    } catch {
      setTasks(previousTasks);
      setError(t.deleteFailed);
    }
  }

  return (
    <div className={`student-layout tasks-layout ${sidebarOpen ? "" : "sidebar-collapsed"}`}>
      <StudentTaskbar
        language={language}
        activeKey="tasks"
        onMenuClick={handleMenuClick}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <StudentHeader
        fullName={profile.fullName || commonText.fallbackName}
        studentCode={profile.studentCode}
        language={language}
        onLanguageChange={setLanguage}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />

      <main className={`student-main page-fade-in ${sidebarOpen ? "" : "expanded"}`}>
        <section className="student-main-content tasks-content">
          <div className="tasks-page-head">
            <div>
              <h1>{t.pageTitle}</h1>
              <p>{t.pageSubtitle}</p>
            </div>
            <button type="button" className="tasks-primary-btn" onClick={openCreateModal}>
              <Plus size={19} />
              {t.addTask}
            </button>
          </div>

          <div className="tasks-stat-grid">
            <article className="tasks-stat-card blue">
              <span><CheckSquare size={24} /></span>
              <strong>{stats.total || 0}</strong>
              <p>{t.totalTasks}</p>
            </article>
            <article className="tasks-stat-card orange">
              <span><Clock size={24} /></span>
              <strong>{stats.active || 0}</strong>
              <p>{t.activeTasks}</p>
            </article>
            <article className="tasks-stat-card green">
              <span><CheckSquare size={24} /></span>
              <strong>{stats.completed || 0}</strong>
              <p>{t.completedTasks}</p>
            </article>
            <article className="tasks-stat-card red">
              <span><Flag size={24} /></span>
              <strong>{stats.highPriority || 0}</strong>
              <p>{t.highPriorityTasks}</p>
            </article>
          </div>

          <div className="tasks-filter-row">
            <label className="tasks-search">
              <Search size={19} />
              <input
                type="text"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder={t.searchPlaceholder}
              />
            </label>

            <div className="tasks-segmented" role="group" aria-label={t.filterAria}>
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={filterStatus === option.value ? "active" : ""}
                  onClick={() => setFilterStatus(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {error ? <p className="tasks-error">{error}</p> : null}

          <div className="tasks-list">
            {loading ? <p className="empty-text">{t.loading}</p> : null}
            {!loading && tasks.length === 0 ? (
              <div className="tasks-empty">
                <CheckSquare size={58} />
                <strong>{t.emptyTitle}</strong>
                <p>{t.emptyHint}</p>
              </div>
            ) : null}

            {tasks.map((task) => (
              <article
                key={task.id}
                className={`tasks-item ${task.completed ? "completed" : ""} ${completingTaskIds.has(task.id) ? "completing" : ""}`}
              >
                <button
                  type="button"
                  className="tasks-check-btn"
                  aria-label={t.toggleAria}
                  onClick={() => handleToggleTask(task.id)}
                >
                  {task.completed ? "✓" : ""}
                </button>

                <div className="tasks-item-body">
                  <div className="tasks-item-top">
                    <h2>{task.title || task.task}</h2>
                    <div className="tasks-actions">
                      <button type="button" aria-label={t.editAria} onClick={() => openEditModal(task)}>
                        <Edit size={17} />
                      </button>
                      <button type="button" aria-label={t.deleteAria} className="danger" onClick={() => handleDeleteTask(task.id)}>
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>

                  <p>{task.description || t.noDescription}</p>

                  <div className="tasks-meta-row">
                    <span className={`priority-chip ${task.priority || "medium"}`}>
                      <Flag size={14} />
                      {getPriorityText(task.priority, t)}
                    </span>
                    <span className="due-chip">
                      <Calendar size={14} />
                      {formatDate(task.dueDate, language, t)}
                    </span>
                    <span className="category-chip">{getCategoryLabel(task.category, t)}</span>
                  </div>
                </div>
              </article>
            ))}

            {pagination.hasMore ? (
              <button
                ref={loadMoreRef}
                type="button"
                className="tasks-load-more"
                onClick={handleLoadMoreTasks}
                disabled={loadingMore}
              >
                {loadingMore ? "Đang tải..." : "Tải thêm công việc"}
              </button>
            ) : null}
          </div>

          <section className="tasks-progress-card">
            <div>
              <h3>{t.progressTitle}</h3>
              <strong>{progress}%</strong>
            </div>
            <div className="tasks-progress-track">
              <span style={{ width: `${progress}%` }} />
            </div>
            <p>{t.progressText(stats.completed || 0, stats.total || 0)}</p>
          </section>
        </section>
      </main>

      {showTaskModal ? (
        <div className="tasks-modal-backdrop" role="presentation">
          <form className="tasks-modal" onSubmit={handleSubmitTask}>
            <div className="tasks-modal-head">
              <div>
                <h2>{editingTaskId ? t.editTitle : t.createTitle}</h2>
                <p>{editingTaskId ? t.editSubtitle : t.createSubtitle}</p>
              </div>
              <button type="button" aria-label={t.close} onClick={() => setShowTaskModal(false)}>
                <X size={19} />
              </button>
            </div>

            <label>
              <span>{t.titleLabel}</span>
              <input
                type="text"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder={t.titlePlaceholder}
                autoFocus
              />
            </label>

            <label>
              <span>{t.descriptionLabel}</span>
              <textarea
                value={form.description}
                onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
                placeholder={t.descriptionPlaceholder}
                rows={3}
              />
            </label>

            <div className="tasks-form-grid">
              <label>
                <span>{t.dueDateLabel}</span>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))}
                />
              </label>

              <label>
                <span>{t.priorityLabel}</span>
                <select
                  value={form.priority}
                  onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
                >
                  <option value="high">{t.priorities.high}</option>
                  <option value="medium">{t.priorities.medium}</option>
                  <option value="low">{t.priorities.low}</option>
                </select>
              </label>
            </div>

            <label>
              <span>{t.categoryLabel}</span>
              <select
                value={form.category}
                onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
              >
                {categoryOptions.map((category) => (
                  <option key={category.value} value={category.value}>{category.label}</option>
                ))}
              </select>
            </label>

            <div className="tasks-modal-actions">
              <button type="button" className="secondary" onClick={() => setShowTaskModal(false)}>
                {t.cancel}
              </button>
              <button type="submit" disabled={saving}>
                {saving ? t.saving : t.save}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
