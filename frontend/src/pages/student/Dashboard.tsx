import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Award,
  BookOpen,
  Target,
  Calendar,
  Clock,
  BarChart3,
  CheckSquare,
  Plus,
  MessageCircle,
  ChevronRight,
  Sigma,
} from "lucide-react";
import api from "../../api";
import {
  getStoredLanguage,
  setStoredLanguage,
  getStoredSidebarState,
  setStoredSidebarState,
} from "../../i18n/language";
import { DASHBOARD_TEXT } from "../../i18n/translations";
import StudentTaskbar from "../../components/student/StudentTaskbar";
import StudentHeader from "../../components/student/StudentHeader";
import { handleStudentMenuNavigation } from "../../utils/studentNavigation";
import "./Dashboard.css";

const TASK_COMPLETE_REFRESH_DELAY_MS = 500;

function gradeColor(grade) {
  if (grade >= 8.5) return "green";
  if (grade >= 7) return "blue";
  return "orange";
}

function buildLinePath(points) {
  if (!points.length) return "";
  return points
    .map((point, idx) => `${idx === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function formatTaskTime(task, language, text) {
  const rawLabel = String(task?.dueLabel || task?.time || "").trim();

  if (["Hôm nay", "Hom nay", "今日"].includes(rawLabel)) {
    return text.taskDefaultTime;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(rawLabel)) {
    return new Date(`${rawLabel}T00:00:00`).toLocaleDateString(language === "ja" ? "ja-JP" : "vi-VN");
  }

  return rawLabel || text.taskDefaultTime;
}

function GpaAreaChart({ data, emptyLabel, chartLabel }) {
  const width = 640;
  const height = 300;
  const paddingX = 42;
  const paddingY = 22;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const validData = Array.isArray(data) ? data : [];
  const points = validData.map((item, index) => {
    const x =
      validData.length === 1
        ? paddingX + chartWidth / 2
        : paddingX + (index / (validData.length - 1)) * chartWidth;
    const y = paddingY + (1 - (Number(item.gpa || 0) / 4)) * chartHeight;
    return { x, y, label: item.label, value: item.gpa };
  });

  const linePath = buildLinePath(points);
  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
      : "";

  return (
    <div className="gpa-svg-wrap">
      {points.length === 0 ? <p className="empty-text">{emptyLabel}</p> : null}
      <svg viewBox={`0 0 ${width} ${height}`} className="gpa-svg" role="img" aria-label={chartLabel}>
        <defs>
          <linearGradient id="gpaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.24" />
            <stop offset="100%" stopColor="#ef4444" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3, 4].map((tick) => {
          const y = paddingY + (1 - tick / 4) * chartHeight;
          return (
            <g key={tick}>
              <line x1={paddingX} y1={y} x2={width - paddingX} y2={y} className="gpa-grid-line" />
              <text x={paddingX - 16} y={y + 5} className="gpa-axis-label">
                {tick}
              </text>
            </g>
          );
        })}

        {points.map((point) => (
          <line
            key={`${point.label}-grid`}
            x1={point.x}
            y1={paddingY}
            x2={point.x}
            y2={height - paddingY}
            className="gpa-grid-line v"
          />
        ))}

        {points.length > 1 ? <path d={areaPath} fill="url(#gpaFill)" /> : null}
        {points.length > 1 ? <path d={linePath} className="gpa-line" /> : null}

        {points.map((point) => (
          <circle key={point.label} cx={point.x} cy={point.y} r="3.5" className="gpa-dot" />
        ))}

        {points.map((point) => (
          <text key={`${point.label}-x`} x={point.x} y={height - 6} textAnchor="middle" className="gpa-axis-label">
            {point.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState(getStoredLanguage);
  const [activeMenu, setActiveMenu] = useState("home");
  const [sidebarOpen, setSidebarOpen] = useState(getStoredSidebarState);
  const [dashboard, setDashboard] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [taskSaving, setTaskSaving] = useState(false);
  const [taskError, setTaskError] = useState("");
  const [student, setStudent] = useState({
    fullName: localStorage.getItem("fullName") || "",
    studentCode: "",
    role: Number(localStorage.getItem("role") || 1),
  });

  const t = useMemo(() => DASHBOARD_TEXT[language] || DASHBOARD_TEXT.vi, [language]);

  async function refreshDashboard() {
    const response = await api.get("/students/me/dashboard");
    setDashboard(response.data || null);
  }

  useEffect(() => {
    setStoredLanguage(language);
  }, [language]);

  useEffect(() => {
    setStoredSidebarState(sidebarOpen);
  }, [sidebarOpen]);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const [meResponse, dashboardResponse] = await Promise.all([
          api.get("/auth/me"),
          api.get("/students/me/dashboard"),
        ]);

        const user = meResponse.data?.user;
        if (!mounted || !user) return;

        if (user.role === 1 && !user.profileCompleted) {
          navigate("/complete-profile", { replace: true });
          return;
        }

        setStudent({
          fullName: user.fullName || "",
          studentCode: user.studentCode || "",
          role: user.role,
        });
        setDashboard(dashboardResponse.data || null);
      } catch {
        if (!mounted) return;
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [navigate]);

  function handleMenuClick(key) {
    if (!handleStudentMenuNavigation(key, navigate, "home")) {
      setActiveMenu(key);
    }
  }

  async function handleCreateTask(event) {
    event.preventDefault();

    const title = newTaskTitle.trim();
    if (!title) {
      setTaskError(t.taskRequired || "Vui lòng nhập nhiệm vụ.");
      return;
    }

    try {
      setTaskSaving(true);
      setTaskError("");
      await api.post("/students/me/tasks", {
        title,
        dueLabel: t.taskDefaultTime || "Hôm nay",
      });
      setNewTaskTitle("");
      setShowTaskForm(false);
      await refreshDashboard();
    } catch {
      setTaskError(t.taskCreateFailed);
    } finally {
      setTaskSaving(false);
    }
  }

  async function handleToggleTask(taskId) {
    const toggledTask = todayTasks.find((task) => task.id === taskId);

    try {
      setTaskError("");
      setDashboard((current) => ({
        ...current,
        todayTasks: (current?.todayTasks || []).map((task) =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        ),
      }));
      await api.patch(`/students/me/tasks/${taskId}/toggle`);
      if (toggledTask && !toggledTask.completed) {
        await wait(TASK_COMPLETE_REFRESH_DELAY_MS);
      }
      await refreshDashboard();
    } catch {
      setTaskError(t.taskUpdateFailed);
      await refreshDashboard();
    }
  }

  const profile = dashboard?.profile || {};
  const gpa = dashboard?.gpa || { history: [] };
  const stats = dashboard?.stats || {};
  const recentGrades = dashboard?.recentGrades || [];
  const upcomingClasses = dashboard?.upcomingClasses || [];
  const todayTasks = dashboard?.todayTasks || [];

  const lastName = student.fullName.split(" ").filter(Boolean).pop() || student.fullName;
  const welcomeText = language === "ja"
    ? `${t.welcome}、${lastName}さん！`
    : `${t.welcome}, ${lastName}!`;

  return (
    <div className="student-layout">
      <div className="dashboard-blob blob-one" />
      <div className="dashboard-blob blob-two" />

      <StudentTaskbar
        language={language}
        activeKey={activeMenu}
        onMenuClick={handleMenuClick}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className={`student-main page-fade-in ${sidebarOpen ? "" : "expanded"}`}>
        <StudentHeader
          fullName={profile.fullName || student.fullName}
          studentCode={profile.studentCode || student.studentCode}
          language={language}
          onLanguageChange={setLanguage}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />

        <section className="student-main-content">
          <div className="welcome-area">
            <h1>{welcomeText}</h1>
            <p>{t.sub}</p>
          </div>

          <div className="top-grid">
            <article className="gpa-card reveal-card" style={{ "--delay": "60ms" }}>
              <div className="gpa-head">
                <div>
                  <h2>
                    <TrendingUp size={22} /> {t.gpaTrend}
                  </h2>
                  <p>{t.gpaDesc}</p>
                </div>
                <div className="gpa-current-box">
                  <span>{t.currentGpa}</span>
                  <strong>{Number(gpa.current || 0).toFixed(2)}</strong>
                </div>
              </div>

              <GpaAreaChart data={gpa.history || []} emptyLabel={t.noData} chartLabel={t.chartLabel} />

              <div className="gpa-meta-grid">
                <div>
                  <span>{t.bestGpa}</span>
                  <strong>{Number(gpa.best || 0).toFixed(2)}</strong>
                </div>
                <div>
                  <span>{t.avgGpa}</span>
                  <strong>{Number(gpa.average || 0).toFixed(2)}</strong>
                </div>
                <div>
                  <span>{t.growth}</span>
                  <strong>{`${gpa.growthRate >= 0 ? "+" : ""}${gpa.growthRate || 0}%`}</strong>
                </div>
              </div>
            </article>

            <div className="stats-grid">
              <article className="stat-card reveal-card" style={{ "--delay": "120ms" }}>
                <div className="stat-top">
                  <div className="stat-icon blue"><BookOpen size={20} /></div>
                </div>
                <p>{t.finishedCourses}</p>
                <strong>{stats.totalCourses || 0}</strong>
              </article>

              <article className="stat-card reveal-card" style={{ "--delay": "180ms" }}>
                <div className="stat-top">
                  <div className="stat-icon green"><Sigma size={20} /></div>
                </div>
                <p>{t.totalCredits}</p>
                <strong>{stats.totalCredits || 0}</strong>
              </article>

              <article className="stat-card reveal-card" style={{ "--delay": "240ms" }}>
                <div className="stat-top">
                  <div className="stat-icon purple"><Award size={20} /></div>
                </div>
                <p>{t.passedCourses}</p>
                <strong>{stats.passedCourses || 0}</strong>
              </article>

              <article className="stat-card reveal-card" style={{ "--delay": "300ms" }}>
                <div className="stat-top">
                  <div className="stat-icon orange"><Target size={20} /></div>
                </div>
                <p>{t.progress}</p>
                <strong>{`${stats.completionRate || 0}%`}</strong>
              </article>
            </div>
          </div>

          <div className="main-grid">
            <div className="main-left">
              <article className="panel reveal-card" style={{ "--delay": "120ms" }}>
                <div className="panel-head">
                  <h3>
                    <Calendar size={18} /> {t.todaySchedule}
                  </h3>
                </div>

                <div className="class-list">
                  {upcomingClasses.length === 0 ? <p className="empty-text">{t.noData}</p> : null}
                  {upcomingClasses.map((cls) => (
                    <div key={cls.id} className="class-item">
                      <div className="class-icon"><BookOpen size={20} /></div>
                      <div className="class-body">
                        <strong>{cls.subject}</strong>
                        <p><Clock size={14} /> {cls.time}</p>
                      </div>
                      <span>{cls.room}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="panel reveal-card" style={{ "--delay": "180ms" }}>
                <div className="panel-head">
                  <h3>
                    <BarChart3 size={18} /> {t.recentGrades}
                  </h3>
                </div>

                <div className="grade-list">
                  {recentGrades.length === 0 ? <p className="empty-text">{t.noData}</p> : null}
                  {recentGrades.map((item) => {
                    const tone = gradeColor(item.score10 || 0);
                    return (
                      <div key={item.id} className="grade-item">
                        <div>
                          <strong>{item.subject}</strong>
                          <p>{item.credits} {t.creditsUnit}</p>
                        </div>
                        <div className="grade-score-wrap">
                          <span className={`grade-score ${tone}`}>{item.score10 ?? "-"}</span>
                          <div className={`grade-badge ${tone}`}>
                            <Award size={16} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            </div>

            <div className="main-right">
              <article className="panel reveal-card" style={{ "--delay": "220ms" }}>
                <div className="panel-head">
                  <h3>
                    <CheckSquare size={18} /> {t.todayTasks}
                  </h3>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={t.addTaskAria}
                    onClick={() => {
                      setShowTaskForm((prev) => !prev);
                      setTaskError("");
                    }}
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="task-list">
                  {showTaskForm ? (
                    <form className="task-form" onSubmit={handleCreateTask}>
                      <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(event) => setNewTaskTitle(event.target.value)}
                        placeholder={t.taskPlaceholder}
                        autoFocus
                      />
                      <button type="submit" disabled={taskSaving}>
                        {taskSaving ? "..." : "+"}
                      </button>
                    </form>
                  ) : null}
                  {taskError ? <p className="task-error">{taskError}</p> : null}
                  {todayTasks.length === 0 ? <p className="empty-text">{t.noData}</p> : null}
                  {todayTasks.map((task) => (
                    <button
                      key={task.id}
                      type="button"
                      className={`task-item ${task.completed ? "done" : ""}`}
                      onClick={() => handleToggleTask(task.id)}
                    >
                      <span className="task-check" aria-hidden="true">{task.completed ? "✓" : ""}</span>
                      <div className="task-copy">
                        <strong>{task.task}</strong>
                        <p>{formatTaskTime(task, language, t)}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </article>

              <article className="ai-card reveal-card" style={{ "--delay": "280ms" }}>
                <div className="ai-icon">
                  <MessageCircle size={20} />
                </div>
                <h3>{t.aiAssistant}</h3>
                <p>{t.aiHint}</p>
                <button type="button">
                  {t.aiStart} <ChevronRight size={15} />
                </button>
              </article>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

