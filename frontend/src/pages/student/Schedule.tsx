import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  Gamepad2,
  ListChecks,
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

function toDateParam(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function fromDateParam(value) {
  const [year, month, day] = String(value).split("-").map(Number);
  if (!year || !month || !day) return new Date();
  return new Date(year, month - 1, day);
}

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function addMonths(date, amount) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + amount);
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
  if (type === "task") return ListChecks;
  if (type === "play") return Gamepad2;
  if (type === "study") return BookOpen;
  if (type === "exam") return Calendar;
  if (type === "assignment") return BookOpen;
  return Clock;
}

function getEventTypeLabel(type, text) {
  if (type === "task") return text.taskDue;
  return text.eventTypes[type] || text.eventTypes.other;
}

const GOOGLE_HOUR_HEIGHT = 78;

function getHourNumber(time) {
  return Number(String(time || "00:00").slice(0, 2)) || 0;
}

function getCalendarEventStyle(item, firstHour) {
  const startMinutes = Number.isFinite(Number(item.startMinutes))
    ? Number(item.startMinutes)
    : (Number(item.startHour) || firstHour) * 60;
  const durationMinutes = Math.max(30, Number(item.durationMinutes) || 60);
  const top = ((startMinutes - firstHour * 60) / 60) * GOOGLE_HOUR_HEIGHT + 6;
  const height = Math.max(38, (durationMinutes / 60) * GOOGLE_HOUR_HEIGHT - 8);

  return {
    top: `${Math.max(6, top)}px`,
    height: `${height}px`,
  };
}

export default function SchedulePage() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState(getStoredLanguage);
  const [sidebarOpen, setSidebarOpen] = useState(getStoredSidebarState);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState("week");
  const [payload, setPayload] = useState({
    days: [],
    visibleDays: [],
    timeSlots: [],
    classes: [],
    calendarItems: [],
    selectedDayClasses: [],
    selectedDayEvents: [],
    upcomingEvents: [],
    stats: {},
  });
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: toDateParam(currentDate),
    startTime: "08:00",
    endTime: "09:00",
    type: "study",
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

  function getDefaultEndTime(startTime) {
    const date = new Date(`2000-01-01T${startTime || "08:00"}:00`);
    if (Number.isNaN(date.getTime())) return "09:00";
    date.setHours(date.getHours() + 1);
    return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  function openEventForm(date, time = "08:00") {
    setNewEvent((current) => ({
      ...current,
      date,
      startTime: time,
      endTime: getDefaultEndTime(time),
    }));
    setCurrentDate(fromDateParam(date));
    setShowEventForm(true);
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
      await api.post("/schedule/events", {
        title,
        date: newEvent.date,
        startTime: newEvent.startTime,
        endTime: newEvent.endTime,
        type: newEvent.type,
      });
      const nextDate = fromDateParam(newEvent.date);
      const response = await api.get("/schedule", {
        params: {
          date: newEvent.date,
          view: viewMode,
        },
      });
      setPayload(response.data || payload);
      setCurrentDate(nextDate);
      setNewEvent((current) => ({ ...current, title: "" }));
      setShowEventForm(false);
    } catch {
      setError(t.createFailed);
    } finally {
      setSaving(false);
    }
  }

  const timeSlots = payload.timeSlots || [];
  const firstHour = getHourNumber(timeSlots[0] || "06:00");
  const calendarHeight = Math.max(timeSlots.length, 1) * GOOGLE_HOUR_HEIGHT;

  const stats = payload.stats || {};
  const selectedDateLabel = viewMode === "month"
    ? currentDate.toLocaleDateString(language === "ja" ? "ja-JP" : "vi-VN", { month: "long", year: "numeric" })
    : t.selectedDate(
    getWeekOfMonth(currentDate),
    currentDate.getMonth() + 1,
    currentDate.getFullYear()
  );

  const navigationStep = viewMode === "month" ? "month" : viewMode === "week" ? "week" : "day";

  return (
    <div className={`student-layout schedule-layout ${sidebarOpen ? "" : "sidebar-collapsed"}`}>
      <StudentTaskbar
        language={language}
        activeKey="schedule"
        onMenuClick={handleMenuClick}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <StudentHeader
        fullName={localStorage.getItem("fullName") || commonText.fallbackName}
        studentCode=""
        language={language}
        onLanguageChange={setLanguage}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
      />

      <main className={`student-main page-fade-in ${sidebarOpen ? "" : "expanded"}`}>
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
                value={newEvent.startTime}
                onChange={(event) =>
                  setNewEvent((current) => ({
                    ...current,
                    startTime: event.target.value,
                    endTime: current.endTime || getDefaultEndTime(event.target.value),
                  }))
                }
              />
              <input
                type="time"
                value={newEvent.endTime}
                onChange={(event) => setNewEvent((current) => ({ ...current, endTime: event.target.value }))}
              />
              <select
                value={newEvent.type}
                onChange={(event) => setNewEvent((current) => ({ ...current, type: event.target.value }))}
              >
                <option value="study">{t.eventTypes.study}</option>
                <option value="play">{t.eventTypes.play}</option>
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
              <button
                type="button"
                onClick={() => setCurrentDate((date) => navigationStep === "month" ? addMonths(date, -1) : addDays(date, navigationStep === "week" ? -7 : -1))}
                aria-label={t.prev}
              >
                <ChevronLeft size={20} />
              </button>
              <h2>{viewMode === "month" || language === "ja" ? selectedDateLabel : `${t.weekPrefix} ${selectedDateLabel}`}</h2>
              <button
                type="button"
                onClick={() => setCurrentDate((date) => navigationStep === "month" ? addMonths(date, 1) : addDays(date, navigationStep === "week" ? 7 : 1))}
                aria-label={t.next}
              >
                <ChevronRight size={20} />
              </button>
            </div>

            <div className="schedule-view-actions">
              <button type="button" className={viewMode === "week" ? "active" : ""} onClick={() => setViewMode("week")}>
                {t.week}
              </button>
              <button type="button" className={viewMode === "month" ? "active" : ""} onClick={() => setViewMode("month")}>
                {t.month}
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
            {viewMode === "month" ? (
              <div className="schedule-month-grid">
                {Object.entries(t.weekdayLabels).map(([weekday, label]) => (
                  <div key={weekday} className="schedule-month-weekday">{label}</div>
                ))}
                {visibleDays.map((day) => {
                  const items = (payload.calendarItems || [])
                    .filter((item) => item.date === day.date)
                    .sort((a, b) => `${a.time || "23:59"}-${a.title}`.localeCompare(`${b.time || "23:59"}-${b.title}`));

                  return (
                    <button
                      type="button"
                      key={day.date}
                      className={`schedule-month-day ${day.isSelected ? "selected" : ""} ${day.isCurrentMonth ? "" : "muted"}`}
                      onClick={() => openEventForm(day.date)}
                    >
                      <span>{day.dayNumber}</span>
                      <div>
                        {items.slice(0, 4).map((item) => (
                          <em key={`${item.source}-${item.id}`} className={`schedule-month-event ${item.color} ${item.source}`}>
                            {item.time ? `${item.time} ` : ""}{item.title || item.subject}
                          </em>
                        ))}
                        {items.length > 4 ? <strong>{t.moreEvents(items.length - 4)}</strong> : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
            <div className="schedule-google-scroll">
              <div className="schedule-google-calendar">
                <div className="schedule-google-head" style={{ gridTemplateColumns: `76px repeat(${Math.max(visibleDays.length, 1)}, minmax(160px, 1fr))` }}>
                  <div className="schedule-google-head-time">{t.time}</div>
                  {visibleDays.map((day) => (
                    <button
                      type="button"
                      key={day.date}
                      className={`schedule-google-day-head ${day.isSelected ? "selected" : ""}`}
                      onClick={() => setCurrentDate(fromDateParam(day.date))}
                    >
                      <strong>{t.weekdayLabels[day.weekday] || day.label}</strong>
                      <span>{day.displayDate}</span>
                    </button>
                  ))}
                </div>

                <div className="schedule-google-body" style={{ gridTemplateColumns: `76px repeat(${Math.max(visibleDays.length, 1)}, minmax(160px, 1fr))` }}>
                  <div className="schedule-google-time-axis">
                    {timeSlots.map((time) => (
                      <div key={time}>{time}</div>
                    ))}
                  </div>

                  {visibleDays.map((day) => {
                    const dayItems = (payload.calendarItems || [])
                      .filter((item) => item.date === day.date)
                      .sort((a, b) => (Number(a.startMinutes) || 0) - (Number(b.startMinutes) || 0));

                    return (
                      <div
                        key={day.date}
                        className={`schedule-google-day-column ${day.isSelected ? "selected" : ""}`}
                        style={{ height: `${calendarHeight}px` }}
                      >
                        {timeSlots.map((time) => (
                          <button
                            type="button"
                            key={`${day.date}-${time}`}
                            className="schedule-google-hour"
                            style={{ height: `${GOOGLE_HOUR_HEIGHT}px` }}
                            onClick={() => openEventForm(day.date, time)}
                            aria-label={`${day.displayDate} ${time}`}
                          />
                        ))}

                        {dayItems.map((item) => (
                          <button
                            type="button"
                            key={`${item.source}-${item.id}`}
                            className={`schedule-google-event ${item.color} ${item.source}`}
                            style={getCalendarEventStyle(item, firstHour)}
                            onClick={(event) => {
                              event.stopPropagation();
                              setCurrentDate(fromDateParam(day.date));
                            }}
                          >
                            <strong>{item.title || item.subject}</strong>
                            <span>
                              {item.source === "class"
                                ? t.classTypes[item.type] || item.type
                                : getEventTypeLabel(item.type, t)}
                            </span>
                            <em>{item.time || t.allDay}{item.room ? ` · ${item.room}` : ""}</em>
                          </button>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            )}
          </div>

          <div className="schedule-bottom-grid">
            <article className="schedule-panel">
              <h3><Calendar size={20} /> {t.upcomingEvents}</h3>
              <div className="schedule-event-list">
                {payload.upcomingEvents.length === 0 ? <p className="empty-text">{t.noUpcomingEvents}</p> : null}
                {(payload.upcomingEvents || []).map((event) => {
                  const Icon = getEventIcon(event.type);
                  return (
                    <div key={`${event.source || "event"}-${event.id}`} className={`schedule-event-item ${event.color}`}>
                      <span><Icon size={19} /></span>
                      <div>
                        <strong>{event.title}</strong>
                        <p>{getEventTypeLabel(event.type, t)} · {formatDate(event.date, language)} - {event.time || t.allDay}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="schedule-today-panel">
              <h3><BookOpen size={20} /> {t.daySchedule}</h3>
              <div className="schedule-today-list">
                {(payload.selectedDayEvents || []).length === 0 ? <p>{t.noClassesToday}</p> : null}
                {(payload.selectedDayEvents || []).map((item) => (
                  <div key={`${item.source}-${item.id}`}>
                    <strong>{item.title || item.subject}</strong>
                    <span><Clock size={15} /> {item.time || t.allDay}</span>
                    <span>
                      {item.source === "class" ? <MapPin size={15} /> : <Calendar size={15} />}
                      {item.source === "class" ? item.room : getEventTypeLabel(item.type, t)}
                    </span>
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
