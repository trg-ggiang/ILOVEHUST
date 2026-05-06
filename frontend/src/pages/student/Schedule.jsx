import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  MapPin,
  Plus,
} from "lucide-react";
import api from "../../api";
import {
  getStoredLanguage,
  getStoredSidebarState,
  setStoredLanguage,
  setStoredSidebarState,
} from "../../i18n/language";
import { SCHEDULE_TEXT, STUDENT_COMMON_TEXT } from "../../i18n/translations";
import StudentHeader from "../../components/student/StudentHeader";
import StudentTaskbar from "../../components/student/StudentTaskbar";
import { handleStudentMenuNavigation } from "../../utils/studentNavigation";
import "./Dashboard.css";
import "./Schedule.css";

function toDateParam(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromDateParam(value) {
  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return new Date(2026, 3, 28);
  return new Date(year, month - 1, day);
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function getWeekOfMonth(date) {
  return Math.ceil(date.getDate() / 7);
}

function formatDate(value, language) {
  const date = fromDateParam(value);
  return date.toLocaleDateString(language === "ja" ? "ja-JP" : "vi-VN");
}

function getEventIcon(type) {
  if (type === "exam") return Calendar;
  if (type === "assignment") return BookOpen;
  return Clock;
}

export default function SchedulePage() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState(getStoredLanguage);
  const [sidebarOpen, setSidebarOpen] = useState(getStoredSidebarState);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 28));
  const [viewMode, setViewMode] = useState("week");
  const [payload, setPayload] = useState({
    days: [],
    visibleDays: [],
    timeSlots: [],
    classes: [],
    selectedDayClasses: [],
    upcomingEvents: [],
    stats: {},
  });
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: toDateParam(currentDate),
    time: "08:00",
    type: "assignment",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const t = useMemo(() => SCHEDULE_TEXT[language] || SCHEDULE_TEXT.vi, [language]);
  const commonText = useMemo(() => STUDENT_COMMON_TEXT[language] || STUDENT_COMMON_TEXT.vi, [language]);

  const visibleDays = payload.visibleDays?.length ? payload.visibleDays : payload.days;

  useEffect(() => {
    setStoredLanguage(language);
  }, [language]);

  useEffect(() => {
    setStoredSidebarState(sidebarOpen);
  }, [sidebarOpen]);

  useEffect(() => {
    setNewEvent((current) => ({ ...current, date: toDateParam(currentDate) }));
  }, [currentDate]);

  async function loadSchedule(date = currentDate) {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await api.get("/schedule", {
        params: {
          date: toDateParam(date),
          view: viewMode,
        },
      });
      setPayload(response.data || payload);
    } catch {
      setError(t.loadFailed);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSchedule(currentDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate, viewMode]);

  function handleMenuClick(key) {
    handleStudentMenuNavigation(key, navigate, "schedule");
  }

  async function handleCreateEvent(event) {
    event.preventDefault();
    const title = newEvent.title.trim();
    if (!title) {
      setError(t.requiredTitle);
      return;
    }

    try {
      setSaving(true);
      setError("");
      const response = await api.post("/schedule/events", {
        title,
        date: newEvent.date,
        time: newEvent.time,
        type: newEvent.type,
      });
      setPayload(response.data || payload);
      setCurrentDate(fromDateParam(newEvent.date));
      setNewEvent((current) => ({ ...current, title: "" }));
      setShowEventForm(false);
    } catch {
      setError(t.createFailed);
    } finally {
      setSaving(false);
    }
  }

  const gridStyle = {
    gridTemplateColumns: `96px repeat(${Math.max(visibleDays.length, 1)}, minmax(160px, 1fr))`,
  };

  const stats = payload.stats || {};
  const selectedDateLabel = t.selectedDate(
    getWeekOfMonth(currentDate),
    currentDate.getMonth() + 1,
    currentDate.getFullYear()
  );

  return (
    <div className="student-layout schedule-layout">
      <StudentTaskbar
        language={language}
        activeKey="schedule"
        onMenuClick={handleMenuClick}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className={`student-main page-fade-in ${sidebarOpen ? "" : "expanded"}`}>
        <StudentHeader
          fullName={localStorage.getItem("fullName") || commonText.fallbackName}
          studentCode=""
          language={language}
          onLanguageChange={setLanguage}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />

        <section className="student-main-content schedule-content">
          <div className="schedule-page-head">
            <div>
              <h1>{t.pageTitle}</h1>
              <p>{t.pageSubtitle}</p>
            </div>
            <button type="button" className="schedule-primary-btn" onClick={() => setShowEventForm((prev) => !prev)}>
              <Plus size={18} />
              {t.addEvent}
            </button>
          </div>

          {showEventForm ? (
            <form className="schedule-event-form" onSubmit={handleCreateEvent}>
              <input
                type="text"
                value={newEvent.title}
                onChange={(event) => setNewEvent((current) => ({ ...current, title: event.target.value }))}
                placeholder={t.eventPlaceholder}
              />
              <input
                type="date"
                value={newEvent.date}
                onChange={(event) => setNewEvent((current) => ({ ...current, date: event.target.value }))}
              />
              <input
                type="time"
                value={newEvent.time}
                onChange={(event) => setNewEvent((current) => ({ ...current, time: event.target.value }))}
              />
              <select
                value={newEvent.type}
                onChange={(event) => setNewEvent((current) => ({ ...current, type: event.target.value }))}
              >
                <option value="assignment">{t.eventTypes.assignment}</option>
                <option value="exam">{t.eventTypes.exam}</option>
                <option value="presentation">{t.eventTypes.presentation}</option>
                <option value="other">{t.eventTypes.other}</option>
              </select>
              <button type="submit" disabled={saving}>
                {saving ? t.saving : t.saveEvent}
              </button>
            </form>
          ) : null}

          {error ? <p className="schedule-error">{error}</p> : null}

          <div className="schedule-stat-grid">
            <article className="schedule-stat blue">
              <span><BookOpen size={22} /></span>
              <strong>{stats.weeklyClasses || 0}</strong>
              <p>{t.weeklyClasses}</p>
            </article>
            <article className="schedule-stat purple">
              <span><Calendar size={22} /></span>
              <strong>{stats.studyDays || 0}</strong>
              <p>{t.studyDays}</p>
            </article>
            <article className="schedule-stat green">
              <span><Clock size={22} /></span>
              <strong>{Number(stats.weeklyHours || 0).toLocaleString(language === "ja" ? "ja-JP" : "vi-VN")}</strong>
              <p>{t.weeklyHours}</p>
            </article>
            <article className="schedule-stat orange">
              <span><MapPin size={22} /></span>
              <strong>{stats.rooms || 0}</strong>
              <p>{t.rooms}</p>
            </article>
          </div>

          <div className="schedule-controls">
            <div className="schedule-date-switch">
              <button type="button" onClick={() => setCurrentDate((date) => addDays(date, viewMode === "week" ? -7 : -1))} aria-label={t.prev}>
                <ChevronLeft size={20} />
              </button>
              <h2>{language === "ja" ? selectedDateLabel : `${t.weekPrefix} ${selectedDateLabel}`}</h2>
              <button type="button" onClick={() => setCurrentDate((date) => addDays(date, viewMode === "week" ? 7 : 1))} aria-label={t.next}>
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="schedule-view-actions">
              <button type="button" className={viewMode === "week" ? "active" : ""} onClick={() => setViewMode("week")}>
                {t.week}
              </button>
              <button type="button" className={viewMode === "day" ? "active" : ""} onClick={() => setViewMode("day")}>
                {t.day}
              </button>
              <button type="button" className="schedule-filter-btn" onClick={() => loadSchedule(currentDate)}>
                <Filter size={17} />
              </button>
            </div>
          </div>

          <div className="schedule-grid-card">
            {loading ? <p className="empty-text">{t.loading}</p> : null}
            <div className="schedule-grid-scroll">
              <div className="schedule-grid">
                <div className="schedule-grid-head-row" style={gridStyle}>
                  <div className="schedule-grid-head time">{t.time}</div>
                  {visibleDays.map((day) => (
                    <button
                      type="button"
                      key={day.weekday}
                      className={`schedule-grid-head ${day.isSelected ? "selected" : ""}`}
                      onClick={() => setCurrentDate(fromDateParam(day.date))}
                    >
                      <strong>{t.weekdayLabels[day.weekday] || day.label}</strong>
                      <span>{day.displayDate}</span>
                    </button>
                  ))}
                </div>
                {payload.timeSlots.map((time) => (
                  <div className="schedule-grid-row" key={time} style={gridStyle}>
                    <div className="schedule-time-cell">{time}</div>
                    {visibleDays.map((day) => {
                      const classInSlot = payload.classes.find(
                        (item) => item.day === day.weekday && item.startHour === Number(time.slice(0, 2))
                      );

                      return (
                        <div key={`${day.weekday}-${time}`} className={`schedule-cell ${day.isSelected ? "selected" : ""}`}>
                          {classInSlot ? (
                            <div className={`schedule-class-card ${classInSlot.color}`}>
                              <strong>{classInSlot.subject}</strong>
                              <em>{t.classTypes[classInSlot.type] || classInSlot.type}</em>
                              <span><Clock size={13} /> {classInSlot.time}</span>
                              <span><MapPin size={13} /> {classInSlot.room}</span>
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="schedule-bottom-grid">
            <article className="schedule-panel">
              <h3><Calendar size={20} /> {t.upcomingEvents}</h3>
              <div className="schedule-event-list">
                {payload.upcomingEvents.length === 0 ? <p className="empty-text">{t.noUpcomingEvents}</p> : null}
                {payload.upcomingEvents.map((event) => {
                  const Icon = getEventIcon(event.type);
                  return (
                    <div key={event.id} className={`schedule-event-item ${event.color}`}>
                      <span><Icon size={19} /></span>
                      <div>
                        <strong>{event.title}</strong>
                        <p>{formatDate(event.date, language)} - {event.time || t.allDay}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="schedule-today-panel">
              <h3><BookOpen size={20} /> {t.daySchedule}</h3>
              <div className="schedule-today-list">
                {payload.selectedDayClasses.length === 0 ? <p>{t.noClassesToday}</p> : null}
                {payload.selectedDayClasses.map((item) => (
                  <div key={item.id}>
                    <strong>{item.subject}</strong>
                    <span><Clock size={15} /> {item.time}</span>
                    <span><MapPin size={15} /> {item.room}</span>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      </main>
    </div>
  );
}
