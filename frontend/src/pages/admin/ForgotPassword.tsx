import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, GraduationCap, Mail, Shield } from "lucide-react";
import api from "../../services/api";
import { getStoredLanguage, setStoredLanguage } from "../../i18n/language";
import { LOGIN_TEXT } from "../../i18n/translations";

export default function ForgotPassword() {
  const [language, setLanguage] = useState(getStoredLanguage);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const t = useMemo(() => LOGIN_TEXT[language] || LOGIN_TEXT.vi, [language]);

  function handleLanguageChange(value) {
    setLanguage(value);
    setStoredLanguage(value);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");

    if (!email.trim()) {
      setMessage(t.requiredEmail);
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/auth/forgot-password", {
        email: email.trim(),
        preferredLanguage: language,
      });
      setMessage(response.data?.message || t.resetEmailSent);
    } catch (error) {
      setMessage(error.response?.data?.message || t.resetFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-overlay"></div>
      <div className="floating-circle circle-one"></div>
      <div className="floating-circle circle-two"></div>

      <div className="login-card auth-narrow-card">
        <div className="login-right auth-full-panel">
          <div className="login-form-wrap">
            <div className="mobile-brand">
              <div><GraduationCap size={30} /></div>
              <section>
                <h1>I Love Hust</h1>
                <p>{t.portalSubtitle}</p>
              </section>
            </div>

            <div className="language-switch">
              <button type="button" className={language === "vi" ? "active" : ""} onClick={() => handleLanguageChange("vi")}>VI</button>
              <button type="button" className={language === "ja" ? "active" : ""} onClick={() => handleLanguageChange("ja")}>JA</button>
            </div>

            <div className="login-header">
              <span>{t.forgot}</span>
              <h2>{t.resetTitle}</h2>
              <p>{t.resetSubtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form" noValidate>
              <div className="form-group">
                <label>{t.email}</label>
                <div className="input-box">
                  <Mail size={20} />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="student@ilovehust.local"
                  />
                </div>
              </div>

              {message ? <p className="login-error auth-info-message">{message}</p> : null}

              <button className="login-button" type="submit" disabled={loading}>
                <span>{loading ? t.sendingReset : t.sendReset}</span>
                <ChevronRight size={20} />
              </button>
            </form>

            <div className="signup-text">
              <Shield size={16} />
              <Link to="/login">{t.backToLogin}</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
