import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  Mail,
  Lock,
  ChevronRight,
  Sparkles,
  Shield,
  Users,
} from "lucide-react";
import api from "../../api";
import { getStoredLanguage, setStoredLanguage } from "../../i18n/language";
import { LOGIN_TEXT } from "../../i18n/translations";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();

  const [language, setLanguage] = useState(getStoredLanguage);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const t = useMemo(() => LOGIN_TEXT[language] || LOGIN_TEXT.vi, [language]);

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
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!email.trim()) {
      setMessage(t.requiredEmail);
      return;
    }

    if (!password.trim()) {
      setMessage(t.requiredPassword);
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

      if (!isStudentProfileReady(data.user)) {
        navigate("/complete-profile", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      setMessage(error.response?.data?.message || t.loginFailed);
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
                <p>Student Portal</p>
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

              {message && <p className="login-error">{message}</p>}

              <button className="login-button" type="submit" disabled={loading}>
                <span>{loading ? t.loading : t.button}</span>
                <ChevronRight size={20} />
              </button>
            </form>

            <div className="signup-text">
              {t.noAccount} <a href="#">{t.create}</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
