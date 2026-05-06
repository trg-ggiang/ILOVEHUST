import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  TrendingUp,
  Award,
  Download,
  Filter,
  Search,
  Star,
  ChevronDown,
  Target,
  Zap,
} from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import api from "../../api";
import {
  getStoredLanguage,
  setStoredLanguage,
  getStoredSidebarState,
  setStoredSidebarState,
} from "../../i18n/language";
import { GRADES_TEXT } from "../../i18n/translations";
import StudentTaskbar from "../../components/student/StudentTaskbar";
import StudentHeader from "../../components/student/StudentHeader";
import { handleStudentMenuNavigation } from "../../utils/studentNavigation";
import "./Grades.css";

const ALL_SEMESTER_KEY = "__all__";

function normalizePdfText(value) {
  return String(value ?? "-")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, " ")
    .trim();
}

function polarToCartesian(cx, cy, radius, angle) {
  const radian = ((angle - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radian),
    y: cy + radius * Math.sin(radian),
  };
}

function createPiePath(cx, cy, radius, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, radius, endAngle);
  const end = polarToCartesian(cx, cy, radius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    `M ${cx} ${cy}`,
    `L ${start.x} ${start.y}`,
    `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
    "Z",
  ].join(" ");
}

function ScoreDistributionChart({ distribution = [], labels, emptyLabel, ariaLabel }) {
  const total = distribution.reduce((sum, item) => sum + item.count, 0);
  const cx = 150;
  const cy = 140;
  const radius = 86;
  let currentAngle = -90;

  return (
    <div className="score-distribution">
      {total === 0 ? <p className="empty-text">{emptyLabel}</p> : null}
      <svg viewBox="0 0 300 280" className="score-pie" role="img" aria-label={ariaLabel}>
        {total > 0
          ? distribution.map((item) => {
              const percentage = item.count / total;
              const sliceAngle = percentage >= 1 ? 359.99 : percentage * 360;
              const endAngle = currentAngle + sliceAngle;
              const midAngle = currentAngle + (endAngle - currentAngle) / 2;
              const labelPoint = polarToCartesian(cx, cy, 124, midAngle);
              const path = createPiePath(cx, cy, radius, currentAngle, endAngle);
              currentAngle = endAngle;

              if (item.count === 0) return null;

              return (
                <g key={item.key}>
                  <path d={path} fill={item.color} className="score-pie-slice" />
                  <text
                    x={labelPoint.x}
                    y={labelPoint.y}
                    className="score-pie-label"
                    fill={item.color}
                    textAnchor={labelPoint.x < cx ? "end" : "start"}
                  >
                    {`${Math.round(percentage * 100)}%`}
                  </text>
                </g>
              );
            })
          : null}
      </svg>

      <div className="score-legend">
        {distribution.map((item) => (
          <span key={item.key} style={{ color: item.color }}>
            <i style={{ background: item.color }} />
            {labels[item.key]}
          </span>
        ))}
      </div>
    </div>
  );
}

function RadarChartBlock({ data }) {
  const cx = 160;
  const cy = 140;
  const radius = 96;
  const levels = [20, 40, 60, 80, 100];

  const points = data.map((item, idx) => {
    const angle = ((Math.PI * 2) / data.length) * idx - Math.PI / 2;
    const r = (item.score / 100) * radius;
    return {
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      labelX: cx + Math.cos(angle) * (radius + 22),
      labelY: cy + Math.sin(angle) * (radius + 22),
      skill: item.skill,
    };
  });

  const polygon = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox="0 0 320 280" className="grades-radar" role="img" aria-label="Biểu đồ kỹ năng">
      {levels.map((level) => {
        const r = (level / 100) * radius;
        const ringPoints = data
          .map((_, idx) => {
            const angle = ((Math.PI * 2) / data.length) * idx - Math.PI / 2;
            return `${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`;
          })
          .join(" ");

        return <polygon key={level} points={ringPoints} className="radar-ring" />;
      })}

      {data.map((_, idx) => {
        const angle = ((Math.PI * 2) / data.length) * idx - Math.PI / 2;
        return (
          <line
            key={idx}
            x1={cx}
            y1={cy}
            x2={cx + Math.cos(angle) * radius}
            y2={cy + Math.sin(angle) * radius}
            className="radar-axis"
          />
        );
      })}

      <polygon points={polygon} className="radar-area" />
      {points.map((p) => (
        <circle key={p.skill} cx={p.x} cy={p.y} r="3.5" className="radar-dot" />
      ))}
      {points.map((p) => (
        <text key={`${p.skill}-label`} x={p.labelX} y={p.labelY} textAnchor="middle" className="radar-label">
          {p.skill}
        </text>
      ))}
    </svg>
  );
}

export default function GradesPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(getStoredSidebarState);
  const [language, setLanguage] = useState(getStoredLanguage);
  const [selectedSemester, setSelectedSemester] = useState(ALL_SEMESTER_KEY);
  const [searchText, setSearchText] = useState("");
  const [activeMenu, setActiveMenu] = useState("grades");
  const [profile, setProfile] = useState({ fullName: "", studentCode: "" });
  const [payload, setPayload] = useState({ semesters: [], grades: [], stats: {}, subjectStats: [], skillData: [], scoreDistribution: [] });
  const [pageReady, setPageReady] = useState(false);
  const [error, setError] = useState("");

  const t = useMemo(() => GRADES_TEXT[language] || GRADES_TEXT.vi, [language]);

  async function loadGrades(semester = selectedSemester, search = searchText) {
    const response = await api.get("/students/me/grades", {
      params: {
        semester,
        search,
      },
    });
    setPayload(response.data || { semesters: [], grades: [], stats: {}, subjectStats: [], skillData: [], scoreDistribution: [] });
  }

  useEffect(() => {
    setStoredLanguage(language);
  }, [language]);

  useEffect(() => {
    setStoredSidebarState(sidebarOpen);
  }, [sidebarOpen]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const [meRes, gradesRes] = await Promise.all([
          api.get("/auth/me"),
          api.get("/students/me/grades", {
            params: {
              semester: ALL_SEMESTER_KEY,
              search: "",
            },
          }),
        ]);
        const me = meRes.data?.user;

        if (!mounted || !me) return;

        if (me.role === 1 && !me.profileCompleted) {
          navigate("/complete-profile", { replace: true });
          return;
        }

        setProfile({
          fullName: gradesRes.data?.profile?.fullName || me.fullName || "",
          studentCode: gradesRes.data?.profile?.studentCode || me.studentCode || "",
        });

        setPayload(gradesRes.data || { semesters: [], grades: [], stats: {}, subjectStats: [], skillData: [], scoreDistribution: [] });
        setPageReady(true);
      } catch {
        if (!mounted) return;
        localStorage.removeItem("token");
        navigate("/login", { replace: true });
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  useEffect(() => {
    if (!pageReady) return undefined;

    let mounted = true;
    const timeoutId = window.setTimeout(async () => {
      try {
        setError("");
        const response = await api.get("/students/me/grades", {
          params: {
            semester: selectedSemester,
            search: searchText,
          },
        });
        if (mounted) {
          setPayload(response.data || { semesters: [], grades: [], stats: {}, subjectStats: [], skillData: [], scoreDistribution: [] });
        }
      } catch {
        if (mounted) setError(t.loadFailed);
      }
    }, 180);

    return () => {
      mounted = false;
      window.clearTimeout(timeoutId);
    };
  }, [pageReady, searchText, selectedSemester, t.loadFailed]);

  const semesters = useMemo(
    () => [{ value: ALL_SEMESTER_KEY, label: t.allSemesters }, ...(payload.semesters || []).map((s) => ({ value: s, label: s }))],
    [payload.semesters, t.allSemesters]
  );

  const grades = payload.grades || [];
  const derivedStats = payload.stats || { avgGPA: 0, totalCredits: 0, totalCourses: 0, passedCourses: 0, rank: "C" };

  function handleExportPdf() {
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
    const title = language === "ja" ? "Grade Transcript" : "Bang diem";
    const studentLine = `${profile.fullName || "-"} - ${profile.studentCode || "-"}`;
    const semesterLine =
      selectedSemester === ALL_SEMESTER_KEY
        ? t.allSemesters
        : selectedSemester;

    doc.setFontSize(18);
    doc.text(normalizePdfText(title), 40, 42);
    doc.setFontSize(11);
    doc.text(normalizePdfText(studentLine), 40, 62);
    doc.text(
      normalizePdfText(`Semester: ${semesterLine} | GPA: ${derivedStats.avgGPA} | Credits: ${derivedStats.totalCredits}`),
      40,
      78
    );

    autoTable(doc, {
      startY: 92,
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 5 },
      headStyles: { fillColor: [220, 38, 38], textColor: 255 },
      head: [[
        "#",
        normalizePdfText(t.thSubject),
        normalizePdfText(t.thCode),
        normalizePdfText(t.thCredits),
        normalizePdfText(t.thMidterm),
        normalizePdfText(t.thFinal),
        normalizePdfText(t.thAvg),
        normalizePdfText(t.thStatus),
        "Semester",
      ]],
      body: grades.map((grade, index) => {
        const isPassed = grade.statusKey === "passed" || grade.status === "Đạt" || grade.status === "Dat";
        return [
          String(index + 1),
          normalizePdfText(grade.subject),
          normalizePdfText(grade.code),
          String(grade.credits ?? "-"),
          grade.midterm ?? "-",
          grade.final ?? "-",
          grade.avg ?? "-",
          isPassed ? normalizePdfText(t.statusPass) : normalizePdfText(t.statusFail),
          normalizePdfText(grade.semester),
        ];
      }),
      columnStyles: {
        0: { cellWidth: 28, halign: "center" },
        1: { cellWidth: 220 },
        2: { cellWidth: 72, halign: "center" },
        3: { cellWidth: 56, halign: "center" },
        4: { cellWidth: 64, halign: "center" },
        5: { cellWidth: 64, halign: "center" },
        6: { cellWidth: 66, halign: "center" },
        7: { cellWidth: 76, halign: "center" },
        8: { cellWidth: 96, halign: "center" },
      },
      didDrawPage: () => {
        doc.setFontSize(9);
        doc.text(
          normalizePdfText(`Generated at ${new Date().toLocaleString()}`),
          40,
          doc.internal.pageSize.getHeight() - 20
        );
      },
    });

    const fileName = `bang-diem-${(profile.studentCode || "student").replace(/\s+/g, "-")}.pdf`;
    doc.save(fileName);
  }

  function handleMenuClick(key) {
    if (!handleStudentMenuNavigation(key, navigate, "grades")) {
      setActiveMenu(key);
    }
  }

  return (
    <div className="student-layout grades-layout">
      <StudentTaskbar
        language={language}
        activeKey={activeMenu}
        onMenuClick={handleMenuClick}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className={`student-main ${sidebarOpen ? "" : "expanded"}`}>
        <StudentHeader
          fullName={profile.fullName}
          studentCode={profile.studentCode}
          language={language}
          onLanguageChange={setLanguage}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />

        <section className="student-main-content grades-content">
          <div className="grades-page-head">
            <div>
              <h1>{t.pageTitle}</h1>
              <p>{t.pageSubtitle}</p>
            </div>
            <button type="button" className="export-btn" onClick={handleExportPdf}>
              <Download size={18} /> {t.exportLabel}
            </button>
          </div>

          {error ? <p className="grades-error">{error}</p> : null}

          <div className="grades-stats-grid">
            <article className="grades-stat-card red">
              <div className="grades-stat-top"><TrendingUp size={20} /><span>{t.gpaTag}</span></div>
              <strong>{derivedStats.avgGPA}</strong>
              <p>{t.gpaDesc}</p>
            </article>
            <article className="grades-stat-card blue">
              <div className="grades-stat-top"><BookOpen size={20} /><span>{t.creditsTag}</span></div>
              <strong>{derivedStats.totalCredits}</strong>
              <p>{t.creditsDesc}</p>
            </article>
            <article className="grades-stat-card green">
              <div className="grades-stat-top"><Award size={20} /><span>{t.coursesTag}</span></div>
              <strong>{derivedStats.totalCourses}</strong>
              <p>{t.coursesDesc}</p>
            </article>
            <article className="grades-stat-card purple">
              <div className="grades-stat-top"><Star size={20} /><span>{t.rankTag}</span></div>
              <strong>{derivedStats.rank}</strong>
              <p>{t.rankDesc}</p>
            </article>
          </div>

          <div className="grades-charts-grid">
            <article className="grades-chart-card">
              <h3 className="grades-chart-title">
                <span className="chart-icon purple"><Target size={19} /></span>
                {t.subjectChart}
              </h3>
              <ScoreDistributionChart
                distribution={payload.scoreDistribution || []}
                labels={t.scoreDistribution}
                emptyLabel={t.noData}
                ariaLabel={t.subjectChart}
              />
            </article>
            <article className="grades-chart-card">
              <h3 className="grades-chart-title">
                <span className="chart-icon blue"><Zap size={19} /></span>
                {t.skillChart}
              </h3>
              <RadarChartBlock data={payload.skillData || []} />
            </article>
          </div>

          <div className="grades-filters-row">
            <label className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </label>

            <div className="semester-select-wrap">
              <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)}>
                {semesters.map((sem) => (
                  <option key={sem.value} value={sem.value}>{sem.label}</option>
                ))}
              </select>
              <ChevronDown size={18} />
            </div>

            <button type="button" className="filter-btn" onClick={() => loadGrades()}>
              <Filter size={18} /> {t.filterLabel}
            </button>
          </div>

          <div className="grades-table-wrap">
            <table className="grades-table">
              <thead>
                <tr>
                  <th>{t.thSubject}</th>
                  <th>{t.thCode}</th>
                  <th>{t.thCredits}</th>
                  <th>{t.thMidterm}</th>
                  <th>{t.thFinal}</th>
                  <th>{t.thAvg}</th>
                  <th>{t.thStatus}</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((grade) => {
                  const isPassed = grade.statusKey === "passed" || grade.status === "Đạt" || grade.status === "Dat";
                  return (
                    <tr key={grade.id}>
                      <td>
                        <div className="subject-cell">
                          <strong>{grade.subject}</strong>
                          <span>{grade.semester}</span>
                        </div>
                      </td>
                      <td><span className="code-chip">{grade.code}</span></td>
                      <td>{grade.credits}</td>
                      <td>{grade.midterm ?? "-"}</td>
                      <td>{grade.final ?? "-"}</td>
                      <td>
                        <span className={`score-chip ${grade.avg >= 8.5 ? "green" : grade.avg >= 7 ? "blue" : "orange"}`}>
                          {grade.avg ?? "-"}
                        </span>
                      </td>
                      <td>
                        <span className={`status-chip ${isPassed ? "ok" : "bad"}`}>
                          {isPassed ? t.statusPass : t.statusFail}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
