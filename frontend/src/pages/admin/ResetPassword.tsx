import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronRight, GraduationCap, Lock, Shield } from "lucide-react";
import api from "../../services/api";
import { getStoredLanguage, setStoredLanguage } from "../../i18n/language";
import { LOGIN_TEXT } from "../../i18n/translations";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const [language, setLanguage] = useState(getStoredLanguage);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const t = useMemo(() => LOGIN_TEXT[language] || LOGIN_TEXT.vi, [language]);
  const token = params.get("token") || "";

  function handleLanguageChange(value) {
    setLanguage(value);
    setStoredLanguage(value);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage("");
    setSuccess(false);

    if (!token) {
      setMessage(t.resetInvalid);
      return;
    }

    if (password.length < 8) {
      setMessage(t.weakPassword);
      return;
    }

    if (password !== confirmPassword) {
      setMessage(t.passwordMismatch);
      return;
    }

    try {
      setLoading(true);
      const response = await api.post("/auth/reset-password", {
        token,
        password,
        preferredLanguage: language,
      });
      setSuccess(true);
      setMessage(response.data?.message || t.resetSuccess);
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
              <span>{t.resetTitle}</span>
              <h2>{t.newPasswordTitle}</h2>
              <p>{t.newPasswordSubtitle}</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form" noValidate>
              <div className="form-group">
                <label>{t.password}</label>
                <div className="input-box">
                  <Lock size={20} />
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="********"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>{t.confirmPassword}</label>
                <div className="input-box">
                  <Lock size={20} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    placeholder="********"
                  />
                </div>
              </div>

              {message ? <p className={`login-error ${success ? "auth-success-message" : ""}`}>{message}</p> : null}

              <button className="login-button" type="submit" disabled={loading || success}>
                <span>{loading ? t.resettingPassword : t.resetPassword}</span>
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
