import {
  House,
  BookOpen,
  MessageSquare,
  MessagesSquare,
  ListChecks,
  CalendarDays,
  BarChart3,
  Bot,
  Users,
  Settings,
  LogOut,
  GraduationCap,
} from "lucide-react";
import { TASKBAR_TEXT } from "../../i18n/translations";
import "./StudentTaskbar.css";

const PRIMARY_ITEMS = [
  { key: "home", icon: House },
  { key: "grades", icon: BookOpen },
  { key: "forum", icon: MessageSquare },
  { key: "messages", icon: MessagesSquare },
  { key: "tasks", icon: ListChecks },
  { key: "schedule", icon: CalendarDays },
  { key: "aiChat", icon: Bot },
  { key: "senpaiChat", icon: Users },
  { key: "stats", icon: BarChart3 },
];

const SECONDARY_ITEMS = [
  { key: "settings", icon: Settings },
  { key: "logout", icon: LogOut },
];

export default function StudentTaskbar({
  activeKey = "home",
  onMenuClick,
  language = "vi",
  isOpen = true,
  onClose,
}) {
  const t = TASKBAR_TEXT[language] || TASKBAR_TEXT.vi;

  return (
    <>
      <aside className={`student-taskbar ${isOpen ? "" : "collapsed"}`}>
        <div className="taskbar-top">
          <div className="taskbar-brand">
            <div className="brand-icon">
              <GraduationCap size={20} />
            </div>
            <div className="brand-text">
              <h2>I Love Hust</h2>
              <p>{t.brandSubtitle}</p>
            </div>
          </div>
        </div>

        <nav className="taskbar-nav">
          {PRIMARY_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeKey === item.key;

            return (
              <button
                key={item.key}
                type="button"
                className={`taskbar-item ${isActive ? "active" : ""}`}
                onClick={() => onMenuClick?.(item.key)}
              >
                <Icon size={22} strokeWidth={2} />
                <span>{t.menu[item.key]}</span>
              </button>
            );
          })}
        </nav>

        <div className="taskbar-divider" />

        <div className="taskbar-bottom">
          {SECONDARY_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeKey === item.key;
            return (
              <button
                key={item.key}
                type="button"
                className={`taskbar-item ${isActive ? "active" : ""}`}
                onClick={() => onMenuClick?.(item.key)}
              >
                <Icon size={22} strokeWidth={2} />
                <span>{t.menu[item.key]}</span>
              </button>
            );
          })}
        </div>
      </aside>

      {isOpen ? <button type="button" className="taskbar-overlay" aria-label={t.hideMenu} onClick={onClose} /> : null}
    </>
  );
}
