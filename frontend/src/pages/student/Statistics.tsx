import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  PieChart,
  Star,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart as ReBarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart as RePieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import api from "../../services/api";
import {
  getStoredLanguage,
  getStoredSidebarState,
  setStoredLanguage,
  setStoredSidebarState,
} from "../../i18n/language";
import { STATISTICS_TEXT, STUDENT_COMMON_TEXT } from "../../i18n/translations";
import StudentHeader from "../../components/student/StudentHeader";
import StudentTaskbar from "../../components/student/StudentTaskbar";
import { handleStudentMenuNavigation } from "../../utils/studentNavigation";

const DEFAULT_PAYLOAD = {
  profile: { fullName: "", studentCode: "" },
  overview: {
    cumulativeGpa: 0,
    gpaDelta: 0,
    totalCredits: 0,
    programCompletionRate: 0,
    completedCourses: 0,
    bOrBetterRate: 0,
    weeklyStudyHours: 0,
    targetRate: 0,
    goalsAchieved: 0,
    totalGoals: 12,
  },
  semesterGPA: [],
  gradeDistribution: [],
  studyTime: [],
  skillProgress: [],
  achievements: [],
  comparison: {
    studentGpa: 0,
    cohortAverageGpa: 0,
    percentile: 0,
  },
  goals: [],
};

const COLORS = ["#dc2626", "#ea580c", "#ca8a04", "#16a34a", "#2563eb", "#9333ea", "#64748b"];

const ACHIEVEMENT_ICONS = {
  academic: Award,
  community: Star,
  discipline: CheckCircle2,
};

function formatDelta(value, text) {
  const number = Number(value || 0);
  if (number === 0) return text.noChange;
  return text.delta(number);
}

function chartTooltipStyle() {
  return {
    backgroundColor: "#ffffff",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    boxShadow: "0 12px 28px rgba(15, 23, 42, 0.12)",
    padding: "10px 12px",
  };
}

export default function StatisticsPage() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState(getStoredLanguage);
  const [sidebarOpen, setSidebarOpen] = useState(getStoredSidebarState);
  const [payload, setPayload] = useState(DEFAULT_PAYLOAD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const t = useMemo(() => STATISTICS_TEXT[language] || STATISTICS_TEXT.vi, [language]);
  const commonText = useMemo(() => STUDENT_COMMON_TEXT[language] || STUDENT_COMMON_TEXT.vi, [language]);

  const overview = payload.overview || DEFAULT_PAYLOAD.overview;
  const comparison = payload.comparison || DEFAULT_PAYLOAD.comparison;
  const semesterGPA = payload.semesterGPA ?? DEFAULT_PAYLOAD.semesterGPA;
  const gradeDistribution = payload.gradeDistribution ?? DEFAULT_PAYLOAD.gradeDistribution;
  const studyTime = payload.studyTime ?? DEFAULT_PAYLOAD.studyTime;
  const skillProgress = payload.skillProgress ?? DEFAULT_PAYLOAD.skillProgress;
  const achievements = payload.achievements ?? DEFAULT_PAYLOAD.achievements;
  const goals = payload.goals ?? DEFAULT_PAYLOAD.goals;
  const localizedSemesterGPA = useMemo(
    () => semesterGPA.map((item, index) => ({
      ...item,
      semester: language === "ja" ? t.semesterLabel(index + 1) : item.semester,
    })),
    [language, semesterGPA, t]
  );
  const localizedStudyTime = useMemo(
    () => studyTime.map((item) => ({
      ...item,
      day: t.weekdays[item.day] || item.day,
    })),
    [studyTime, t]
  );

  const statsCards = useMemo(
    () => [
      {
        key: "gpa",
        tone: "red",
        icon: TrendingUp,
        value: Number(overview.cumulativeGpa || 0).toFixed(2),
        label: t.gpaLabel,
        hint: formatDelta(overview.gpaDelta, t),
      },
      {
        key: "credits",
        tone: "blue",
        icon: BookOpen,
        value: overview.totalCredits || 0,
        label: t.creditsLabel,
        hint: t.creditsHint(overview.programCompletionRate || 0),
      },
      {
        key: "courses",
        tone: "green",
        icon: Award,
        value: overview.completedCourses || 0,
        label: t.coursesLabel,
        hint: t.coursesHint(overview.bOrBetterRate || 0),
      },
      {
        key: "hours",
        tone: "purple",
        icon: Clock,
        value: `${overview.weeklyStudyHours || 0}h`,
        label: t.hoursLabel,
        hint: t.hoursHint,
      },
      {
        key: "targets",
        tone: "orange",
        icon: Target,
        value: `${overview.targetRate || 0}%`,
        label: t.targetsLabel,
        hint: t.targetsHint(overview.goalsAchieved || 0, overview.totalGoals || 12),
      },
    ],
    [overview, t]
  );

  useEffect(() => {
    setStoredLanguage(language);
  }, [language]);

  useEffect(() => {
    setStoredSidebarState(sidebarOpen);
  }, [sidebarOpen]);

  useEffect(() => {
    let mounted = true;

    async function loadStatistics() {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        setLoading(true);
        setError("");
        const [meResponse, statsResponse] = await Promise.all([
          api.get("/auth/me"),
          api.get("/students/me/statistics"),
        ]);

        if (!mounted) return;

        const user = meResponse.data?.user;
        if (user?.role === 1 && !user.profileCompleted) {
          navigate("/complete-profile", { replace: true });
          return;
        }

        setPayload(statsResponse.data || DEFAULT_PAYLOAD);
      } catch {
        if (!mounted) return;
        setError(t.loadFailed);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadStatistics();

    return () => {
      mounted = false;
    };
  }, [navigate, t.loadFailed]);

  function handleMenuClick(key) {
    handleStudentMenuNavigation(key, navigate, "stats");
  }

  return (
    <div className={`student-layout statistics-layout ${sidebarOpen ? "" : "sidebar-collapsed"}`}>
      <StudentTaskbar
        language={language}
        activeKey="stats"
        onMenuClick={handleMenuClick}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <StudentHeader
        fullName={payload.profile?.fullName || localStorage.getItem("fullName") || commonText.fallbackName}
        studentCode={payload.profile?.studentCode || ""}
        language={language}
        onLanguageChange={setLanguage}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />

      <main className={`student-main page-fade-in ${sidebarOpen ? "" : "expanded"}`}>
        <section className="student-main-content statistics-content">
          <div className="statistics-page-head">
            <div>
              <h1>{t.pageTitle}</h1>
              <p>{t.pageSubtitle}</p>
            </div>
          </div>

          {error ? <p className="statistics-error">{error}</p> : null}
          {loading ? <p className="empty-text">{t.loading}</p> : null}

          <div className="statistics-overview-grid">
            {statsCards.map((card) => {
              const Icon = card.icon;
              return (
                <article key={card.key} className={`statistics-overview-card ${card.tone}`}>
                  <span><Icon size={25} /></span>
                  <strong>{card.value}</strong>
                  <p>{card.label}</p>
                  <small>{card.hint}</small>
                </article>
              );
            })}
          </div>

          <div className="statistics-chart-grid">
            <article className="statistics-chart-card">
              <h3><TrendingUp size={22} /> {t.gpaTrend}</h3>
              <div className="statistics-chart-box">
                {semesterGPA.length === 0 ? <p className="empty-text">{t.noGpa}</p> : null}
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={localizedSemesterGPA}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                    <XAxis dataKey="semester" tick={{ fontSize: 12, fill: "#64748b" }} />
                    <YAxis domain={[0, 4]} tick={{ fontSize: 12, fill: "#64748b" }} />
                    <Tooltip contentStyle={chartTooltipStyle()} />
                    <Area type="monotone" dataKey="gpa" stroke="#dc2626" strokeWidth={3} fill="#fee2e2" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="statistics-chart-card">
              <h3><PieChart size={22} /> {t.gradeDistribution}</h3>
              <div className="statistics-chart-box">
                {gradeDistribution.length === 0 ? <p className="empty-text">{t.noGrades}</p> : null}
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={gradeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ grade, value }) => `${grade} (${value}%)`}
                      outerRadius={100}
                      dataKey="value"
                    >
                      {gradeDistribution.map((entry, index) => (
                        <Cell key={entry.grade} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle()} />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="statistics-chart-card">
              <h3><Clock size={22} /> {t.studyTime}</h3>
              <div className="statistics-chart-box">
                {studyTime.length === 0 ? <p className="empty-text">{t.noStudyTime}</p> : null}
                <ResponsiveContainer width="100%" height="100%">
                  <ReBarChart data={localizedStudyTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#64748b" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
                    <Tooltip contentStyle={chartTooltipStyle()} />
                    <Bar dataKey="hours" fill="#9333ea" radius={[8, 8, 0, 0]} />
                  </ReBarChart>
                </ResponsiveContainer>
              </div>
            </article>

            <article className="statistics-chart-card">
              <h3><BarChart3 size={22} /> {t.skillProgress}</h3>
              <div className="statistics-skill-list">
                {skillProgress.length === 0 ? <p className="empty-text">{t.noSkill}</p> : null}
                {skillProgress.map((skill) => (
                  <div key={skill.skill} className="statistics-skill-item">
                    <div>
                      <strong>{t.skills[skill.key || skill.skill] || skill.skill}</strong>
                      <span>{skill.current}% / {skill.target}%</span>
                    </div>
                    <div className="statistics-progress-track">
                      <i style={{ width: `${skill.current}%` }} />
                      <b style={{ width: `${skill.target}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <section className="statistics-achievement-card">
            <h3><Award size={28} /> {t.achievements}</h3>
            <div className="statistics-achievement-grid">
              {achievements.length === 0 ? <p className="empty-text">{t.noAchievements}</p> : null}
              {achievements.map((achievement) => {
                const Icon = ACHIEVEMENT_ICONS[achievement.key] || Award;
                const translated = t.achievementsByKey[achievement.key];
                const title =
                  typeof translated?.title === "function"
                    ? translated.title(achievement)
                    : translated?.title || achievement.title;
                return (
                  <article key={achievement.key} className="statistics-achievement-item">
                    <span><Icon size={32} /></span>
                    <h4>{title}</h4>
                    <p>{translated?.description ? translated.description(achievement) : achievement.description}</p>
                  </article>
                );
              })}
            </div>
          </section>

          <div className="statistics-bottom-grid">
            <article className="statistics-compare-card">
              <h3>{t.comparisonTitle}</h3>
              <div className="statistics-compare-list">
                <div>
                  <div>
                    <span>{t.yourGpa}</span>
                    <strong>{Number(comparison.studentGpa || 0).toFixed(2)}</strong>
                  </div>
                  <div className="statistics-compare-track red">
                    <i style={{ width: `${Math.min(100, ((comparison.studentGpa || 0) / 4) * 100)}%` }} />
                  </div>
                </div>
                <div>
                  <div>
                    <span>{t.cohortGpa}</span>
                    <strong>{Number(comparison.cohortAverageGpa || 0).toFixed(2)}</strong>
                  </div>
                  <div className="statistics-compare-track gray">
                    <i style={{ width: `${Math.min(100, ((comparison.cohortAverageGpa || 0) / 4) * 100)}%` }} />
                  </div>
                </div>
              </div>
              <p>{t.percentileText(comparison.percentile || 0)}</p>
            </article>

            <article className="statistics-goal-card">
              <h3>{t.nextGoals}</h3>
              <div className="statistics-goal-list">
                {goals.length === 0 ? <p className="empty-text">{t.noGoals}</p> : null}
                {goals.map((goal) => {
                  const translated = t.goalsByKey[goal.key];
                  return (
                  <div key={goal.key || goal.title}>
                    <span><CheckCircle2 size={16} /></span>
                    <div>
                      <strong>{translated?.title || goal.title}</strong>
                      <p>{translated?.description || goal.description}</p>
                    </div>
                  </div>
                );
                })}
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
