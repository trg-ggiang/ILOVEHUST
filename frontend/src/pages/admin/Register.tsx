import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ChevronRight,
  GraduationCap,
  Lock,
  Mail,
  Phone,
  Shield,
  Sparkles,
  User,
  Users,
} from "lucide-react";
import api from "../../api";
import { getStoredLanguage, setStoredLanguage } from "../../i18n/language";
import { REGISTER_TEXT } from "../../i18n/translations";
import "./Login.css";

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export default function Register() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState(getStoredLanguage);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [focusedField, setFocusedField] = useState(null);
  const [message, setMessage] = useState({ key: "", text: "" });
  const [loading, setLoading] = useState(false);

  const t = useMemo(() => REGISTER_TEXT[language] || REGISTER_TEXT.vi, [language]);
  const displayMessage = message.key ? t[message.key] : message.text;

  function handleLanguageChange(value) {
    setLanguage(value);
    setStoredLanguage(value);
    setMessage((current) => (current.key ? current : { key: "", text: "" }));
  }

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function handleRegister(event) {
    event.preventDefault();
    setMessage({ key: "", text: "" });

    const fullName = form.fullName.trim();
    const email = form.email.trim().toLowerCase();
    const phone = form.phone.trim();

    if (!fullName) {
      setMessage({ key: "requiredFullName", text: "" });
      return;
    }

    if (!email) {
      setMessage({ key: "requiredEmail", text: "" });
      return;
    }

    if (!isValidEmail(email)) {
      setMessage({ key: "invalidEmail", text: "" });
      return;
    }

    if (!form.password) {
      setMessage({ key: "requiredPassword", text: "" });
      return;
    }

    if (form.password.length < 8) {
      setMessage({ key: "weakPassword", text: "" });
      return;
    }

    if (!form.confirmPassword) {
      setMessage({ key: "requiredConfirmPassword", text: "" });
      return;
    }

    if (form.password !== form.confirmPassword) {
      setMessage({ key: "passwordMismatch", text: "" });
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/auth/register", {
        fullName,
        email,
        phone,
        password: form.password,
        preferredLanguage: language,
      });
      const data = response.data;

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", String(data.user.role));
      localStorage.setItem("fullName", data.user.fullName || fullName);
      setStoredLanguage(data.user.preferredLanguage || language);

      navigate("/complete-profile", { replace: true });
    } catch (error) {
      setMessage({ key: "", text: error.response?.data?.message || t.registerFailed });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page register-page">
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
          <div className="login-form-wrap register-form-wrap">
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
              <h2>{t.register}</h2>
              <p>{t.subtitle}</p>
            </div>

            <form onSubmit={handleRegister} className="login-form" noValidate>
              <div className="form-group">
                <label>{t.fullName}</label>
                <div className="input-box">
                  <User size={20} className={focusedField === "fullName" ? "focused" : ""} />
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(event) => updateField("fullName", event.target.value)}
                    onFocus={() => setFocusedField("fullName")}
                    onBlur={() => setFocusedField(null)}
                    placeholder={t.fullNamePlaceholder}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{t.email}</label>
                <div className="input-box">
                  <Mail size={20} className={focusedField === "email" ? "focused" : ""} />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => updateField("email", event.target.value)}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="student@ilovehust.local"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{t.phoneOptional}</label>
                <div className="input-box">
                  <Phone size={20} className={focusedField === "phone" ? "focused" : ""} />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(event) => updateField("phone", event.target.value)}
                    onFocus={() => setFocusedField("phone")}
                    onBlur={() => setFocusedField(null)}
                    placeholder="0912345678"
                  />
                </div>
              </div>

              <div className="register-password-grid">
                <div className="form-group">
                  <label>{t.password}</label>
                  <div className="input-box">
                    <Lock size={20} className={focusedField === "password" ? "focused" : ""} />
                    <input
                      type="password"
                      value={form.password}
                      onChange={(event) => updateField("password", event.target.value)}
                      onFocus={() => setFocusedField("password")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="********"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>{t.confirmPassword}</label>
                  <div className="input-box">
                    <Lock size={20} className={focusedField === "confirmPassword" ? "focused" : ""} />
                    <input
                      type="password"
                      value={form.confirmPassword}
                      onChange={(event) => updateField("confirmPassword", event.target.value)}
                      onFocus={() => setFocusedField("confirmPassword")}
                      onBlur={() => setFocusedField(null)}
                      placeholder="********"
                    />
                  </div>
                </div>
              </div>

              {displayMessage && <p className="login-error">{displayMessage}</p>}

              <button className="login-button" type="submit" disabled={loading}>
                <span>{loading ? t.loading : t.button}</span>
                <ChevronRight size={20} />
              </button>
            </form>

            <div className="signup-text">
              {t.haveAccount} <Link to="/login">{t.login}</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
