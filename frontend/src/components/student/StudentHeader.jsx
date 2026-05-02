import { Bell, Menu, Search } from "lucide-react";
import { HEADER_TEXT } from "../../i18n/translations";
import "./StudentHeader.css";

export default function StudentHeader({
  fullName,
  studentCode,
  onSearchChange,
  language = "ja",
  onLanguageChange,
  onToggleSidebar,
}) {
  const initial = fullName?.trim()?.charAt(0)?.toUpperCase() || "?";
  const t = HEADER_TEXT[language] || HEADER_TEXT.vi;

  return (
    <header className="student-header">
      <button
        type="button"
        className="header-menu-btn"
        aria-label="Toggle sidebar"
        onClick={onToggleSidebar}
      >
        <Menu size={22} strokeWidth={2} />
      </button>

      <label className="student-search">
        <Search size={20} strokeWidth={2} />
        <input
          type="text"
          placeholder={t.searchPlaceholder}
          onChange={(e) => onSearchChange?.(e.target.value)}
        />
      </label>

      <div className="header-language" role="group" aria-label="language switch">
        <button
          type="button"
          className={language === "vi" ? "active" : ""}
          onClick={() => onLanguageChange?.("vi")}
        >
          VI
        </button>
        <button
          type="button"
          className={language === "ja" ? "active" : ""}
          onClick={() => onLanguageChange?.("ja")}
        >
          JA
        </button>
      </div>

      <div className="header-right">
        <button type="button" className="notify-btn" aria-label="Notifications">
          <Bell size={20} strokeWidth={2} />
          <span className="notify-dot" />
        </button>

        <div className="header-divider" />

        <div className="student-summary">
          <div className="student-meta">
            <strong>{fullName || "-"}</strong>
            <span>{studentCode || "-"}</span>
          </div>
          <div className="student-avatar">{initial}</div>
        </div>
      </div>
    </header>
  );
}
