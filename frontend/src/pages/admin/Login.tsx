import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Mail,
  Lock,
  ChevronRight,
  Sparkles,
  Shield,
  Users,
} from "lucide-react";
import api from "../../services/api";
import { getStoredLanguage, setStoredLanguage } from "../../i18n/language";
import { LOGIN_TEXT } from "../../i18n/translations";

export default function Login() {
  const navigate = useNavigate();

  const [language, setLanguage] = useState(getStoredLanguage);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [message, setMessage] = useState({ key: "", text: "" });
  const [loading, setLoading] = useState(false);

  const t = useMemo(() => LOGIN_TEXT[language] || LOGIN_TEXT.vi, [language]);
  const displayMessage = message.key ? t[message.key] : message.text;

  const isStudentProfileReady = (user) => {
    if (user.role !== 1) {
      return true;
    }

    const hasCompletedFlag = Boolean(user.profileCompleted);
    const hasStudentCode = Boolean(user.studentCode);
    const hasBio = Boolean(user.bio);

    return hasCompletedFlag && hasStudentCode && hasBio;
  };

  const handleLanguageChange = (value) => {
    setLanguage(value);
    setStoredLanguage(value);
    setMessage((current) => (current.key ? current : { key: "", text: "" }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage({ key: "", text: "" });

    if (!email.trim()) {
      setMessage({ key: "requiredEmail", text: "" });
      return;
    }

    if (!password.trim()) {
      setMessage({ key: "requiredPassword", text: "" });
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email: email.trim(),
        password,
        preferredLanguage: language,
      });

      const data = response.data;

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", String(data.user.role));
      localStorage.setItem("fullName", data.user.fullName || "");
      setStoredLanguage(data.user.preferredLanguage || language);

      if (data.user.role === 0) {
        navigate("/admin", { replace: true });
        return;
      }

      if (!isStudentProfileReady(data.user)) {
        navigate("/complete-profile", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      setMessage({ key: "", text: error.response?.data?.message || t.loginFailed });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-overlay"></div>

      <div className="floating-circle circle-one"></div>
      <div className="floating-circle circle-two"></div>

      <div className="login-card">
        <div className="login-left">
          <div className="left-glow glow-one"></div>
          <div className="left-glow glow-two"></div>

          <div className="login-left-content">
            <div className="logo-box">
              <GraduationCap size={48} />
            </div>

            <div>
              <h1>
                I Love Hust
                <span>{t.leftWelcome}</span>
              </h1>
              <div className="title-line"></div>
              <p>{t.leftDesc}</p>
            </div>

            <div className="feature-list">
              <div className="feature-item">
                <Sparkles size={16} />
                <span>{t.f1}</span>
              </div>
              <div className="feature-item">
                <Shield size={16} />
                <span>{t.f2}</span>
              </div>
              <div className="feature-item">
                <Users size={16} />
                <span>{t.f3}</span>
              </div>
            </div>
          </div>

          <div className="student-box">
            <div className="avatar-stack">
              <div></div>
              <div></div>
              <div>5K+</div>
            </div>
            <div>
              <strong>{t.students}</strong>
              <p>{t.using}</p>
            </div>
          </div>
        </div>

        <div className="login-right">
          <div className="login-form-wrap">
            <div className="mobile-brand">
              <div>
                <GraduationCap size={30} />
              </div>
              <section>
                <h1>I Love Hust</h1>
                <p>{t.portalSubtitle}</p>
              </section>
            </div>

            <div className="language-switch">
              <button
                type="button"
                className={language === "vi" ? "active" : ""}
                onClick={() => handleLanguageChange("vi")}
              >
                VI
              </button>
              <button
                type="button"
                className={language === "ja" ? "active" : ""}
                onClick={() => handleLanguageChange("ja")}
              >
                JA
              </button>
            </div>

            <div className="login-header">
              <span>{t.welcomeBack}</span>
              <h2>{t.login}</h2>
              <p>{t.subtitle}</p>
            </div>

            <form onSubmit={handleLogin} className="login-form" noValidate>
              <div className="form-group">
                <label>{t.email}</label>
                <div className="input-box">
                  <Mail
                    size={20}
                    className={focusedField === "email" ? "focused" : ""}
                  />
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="student@ilovehust.local"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{t.password}</label>
                <div className="input-box">
                  <Lock
                    size={20}
                    className={focusedField === "password" ? "focused" : ""}
                  />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="********"
                  />
                </div>
              </div>

              <div className="login-options">
                <label className="remember-row">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>{t.remember}</span>
                </label>

                <a href="#">{t.forgot}</a>
              </div>

              {displayMessage && <p className="login-error">{displayMessage}</p>}

              <button className="login-button" type="submit" disabled={loading}>
                <span>{loading ? t.loading : t.button}</span>
                <ChevronRight size={20} />
              </button>
            </form>

            <div className="signup-text">
              {t.noAccount} <Link to="/register">{t.create}</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
