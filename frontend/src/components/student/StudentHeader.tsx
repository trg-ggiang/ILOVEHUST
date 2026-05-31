import { Bell, CheckCheck, Menu, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { HEADER_TEXT } from "../../i18n/translations";
import { useSocketEvent } from "../../realtime/useSocketEvent";

function formatNotificationTime(value, language, t) {
  if (!value) return "";
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60000));
  if (minutes < 1) return t.justNow;
  if (minutes < 60) return language === "ja" ? `${minutes}分前` : `${minutes} phút trước`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return language === "ja" ? `${hours}時間前` : `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 7) return language === "ja" ? `${days}日前` : `${days} ngày trước`;
  return new Intl.DateTimeFormat(language === "ja" ? "ja-JP" : "vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
}

export default function StudentHeader({
  fullName,
  studentCode,
  avatarUrl,
  onSearchChange,
  language = "vi",
  onLanguageChange,
  onToggleSidebar,
}) {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [headerAvatarUrl, setHeaderAvatarUrl] = useState(avatarUrl || localStorage.getItem("avatarUrl") || "");
  const [avatarFailed, setAvatarFailed] = useState(false);
  const initial = fullName?.trim()?.charAt(0)?.toUpperCase() || "?";
  const t = HEADER_TEXT[language] || HEADER_TEXT.vi;

  async function loadNotifications() {
    try {
      const response = await api.get("/notifications");
      setNotifications(response.data?.notifications || []);
      setUnreadCount(response.data?.unreadCount || 0);
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  useSocketEvent("notification:changed", loadNotifications);

  useEffect(() => {
    const nextAvatarUrl = avatarUrl || localStorage.getItem("avatarUrl") || "";
    setHeaderAvatarUrl(nextAvatarUrl);
    setAvatarFailed(false);
  }, [avatarUrl]);

  useEffect(() => {
    if (avatarUrl || headerAvatarUrl || !localStorage.getItem("token")) return;

    let mounted = true;
    api.get("/auth/me")
      .then((response) => {
        if (!mounted) return;
        const nextAvatarUrl = response.data?.user?.avatarUrl || "";
        if (nextAvatarUrl) {
          localStorage.setItem("avatarUrl", nextAvatarUrl);
          setHeaderAvatarUrl(nextAvatarUrl);
          setAvatarFailed(false);
        }
      })
      .catch(() => null);

    return () => {
      mounted = false;
    };
  }, [avatarUrl, headerAvatarUrl]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setNotificationOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleNotificationClick(notification) {
    if (!notification?.read) {
      setNotifications((current) =>
        current.map((item) => (item.id === notification.id ? { ...item, read: true } : item))
      );
      setUnreadCount((current) => Math.max(current - 1, 0));
      try {
        const response = await api.patch(`/notifications/${notification.id}/read`);
        if (typeof response.data?.unreadCount === "number") {
          setUnreadCount(response.data.unreadCount);
        }
      } catch {
        loadNotifications();
      }
    }

    setNotificationOpen(false);
    if (notification?.link) {
      navigate(notification.link);
    }
  }

  async function handleReadAll() {
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
    try {
      const response = await api.patch("/notifications/read-all");
      if (typeof response.data?.unreadCount === "number") {
        setUnreadCount(response.data.unreadCount);
      }
    } catch {
      loadNotifications();
    }
  }

  return (
    <header className="student-header">
      <button
        type="button"
        className="header-menu-btn"
        aria-label={t.toggleSidebar}
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

      <div className="header-language" role="group" aria-label={t.languageSwitch}>
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
        <div className="notification-wrap" ref={dropdownRef}>
          <button
            type="button"
            className={`notify-btn ${notificationOpen ? "active" : ""}`}
            aria-label={t.notifications}
            aria-expanded={notificationOpen}
            onClick={() => setNotificationOpen((current) => !current)}
          >
            <Bell size={20} strokeWidth={2} />
            {unreadCount > 0 ? (
              <span className="notify-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
            ) : null}
          </button>

          {notificationOpen ? (
            <div className="notification-panel" role="dialog" aria-label={t.notifications}>
              <div className="notification-head">
                <div>
                  <strong>{t.notifications}</strong>
                  <span>{unreadCount > 0 ? t.unreadCount.replace("{count}", unreadCount) : t.noUnread}</span>
                </div>
                <button type="button" onClick={handleReadAll} disabled={unreadCount === 0} aria-label={t.markAllRead}>
                  <CheckCheck size={17} strokeWidth={2} />
                </button>
              </div>

              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="notification-empty">{t.noNotifications}</div>
                ) : (
                  notifications.map((notification) => (
                    <button
                      type="button"
                      key={notification.id}
                      className={`notification-item ${notification.read ? "" : "unread"}`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <span className={`notification-icon ${notification.type}`} />
                      <span className="notification-copy">
                        <strong>{notification.title}</strong>
                        <span>{notification.message}</span>
                        <small>{formatNotificationTime(notification.createdAt, language, t)}</small>
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="header-divider" />

        <div className="student-summary">
          <div className="student-meta">
            <strong>{fullName || "-"}</strong>
            <span>{studentCode || "-"}</span>
          </div>
          <div className="student-avatar">
            {headerAvatarUrl && !avatarFailed ? (
              <img src={headerAvatarUrl} alt={fullName || "Avatar"} onError={() => setAvatarFailed(true)} />
            ) : (
              initial
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

