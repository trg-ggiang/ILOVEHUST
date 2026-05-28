import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  GraduationCap,
  User,
  IdCard,
  Mail,
  Phone,
  Calendar,
  MapPin,
  School,
  BookOpen,
  Layers,
  Users,
  Check,
  Camera,
  ChevronDown,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import api from "../../services/api";
import { getStoredLanguage, setStoredLanguage } from "../../i18n/language";
import { COMPLETE_PROFILE_TEXT } from "../../i18n/translations";

const I18N = COMPLETE_PROFILE_TEXT;

const COURSE_OPTIONS = ["general", "advanced", "research"];

function getSchoolYearFromAdmissionYear(admissionYear) {
  if (!admissionYear) {
    return null;
  }

  const currentYear = new Date().getFullYear();
  const parsed = Number(admissionYear);

  if (Number.isNaN(parsed)) {
    return null;
  }

  const calculated = currentYear - parsed + 1;
  return Math.max(1, Math.min(8, calculated));
}

function formatValue(value) {
  if (!value) {
    return "-";
  }
  return String(value);
}

function getGenderLabel(value, text) {
  if (value === "male") return text.genderMale;
  if (value === "female") return text.genderFemale;
  if (value === "other") return text.genderOther;
  return value;
}

export default function CompleteProfile() {
  const navigate = useNavigate();
  const [language, setLanguage] = useState(getStoredLanguage);
  const [loadingPage, setLoadingPage] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error");
  const [majors, setMajors] = useState([]);

  const [form, setForm] = useState({
    fullName: "",
    studentCode: "",
    email: "",
    phone: "",
    birthDate: "",
    gender: "",
    address: "",

    facultyId: "",
    majorName: "",
    course: "",
    className: "",
    admissionYear: "",
    schoolYear: "",
  });

  const t = useMemo(() => I18N[language] || I18N.vi, [language]);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= currentYear - 10; year -= 1) {
      years.push(String(year));
    }
    return years;
  }, []);

  useEffect(() => {
    setStoredLanguage(language);
  }, [language]);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        const [meResponse, majorsResponse] = await Promise.all([
          api.get("/auth/me"),
          api.get("/majors"),
        ]);

        const user = meResponse.data?.user;
        if (!user) {
          navigate("/login", { replace: true });
          return;
        }

        if (user.role !== 1) {
          navigate("/dashboard", { replace: true });
          return;
        }

        if (!mounted) {
          return;
        }

        const majorList = majorsResponse.data?.majors || [];
        const selectedMajor = majorList.find((major) => major.id === user.majorId);

        setMajors(majorList);
        setForm((prev) => ({
          ...prev,
          fullName: user.fullName && user.fullName !== "Admin" ? user.fullName : "",
          studentCode: user.studentCode || "",
          email: user.email || "",
          phone: user.phone || "",
          facultyId: user.majorId ? String(user.majorId) : "",
          majorName: selectedMajor?.majorName || "",
          schoolYear: user.schoolYear ? String(user.schoolYear) : "",
        }));
      } catch (error) {
        if (!mounted) {
          return;
        }

        if (error.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
          return;
        }

        setMessage(error.response?.data?.message || t.updateFailed);
        setMessageType("error");
      } finally {
        if (mounted) {
          setLoadingPage(false);
        }
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [navigate, t.updateFailed]);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (message) {
      setMessage("");
    }
  }

  function updateFaculty(value) {
    const selectedMajor = majors.find((major) => String(major.id) === value);

    setForm((prev) => ({
      ...prev,
      facultyId: value,
      majorName: selectedMajor?.majorName || prev.majorName,
    }));

    if (message) {
      setMessage("");
    }
  }

  function validateStep1() {
    if (!form.fullName.trim()) {
      setMessage(t.requiredFullName);
      return false;
    }
    if (!form.studentCode.trim()) {
      setMessage(t.requiredStudentCode);
      return false;
    }
    if (!form.email.trim()) {
      setMessage(t.requiredEmail);
      return false;
    }
    if (!form.phone.trim()) {
      setMessage(t.requiredPhone);
      return false;
    }
    if (!form.birthDate) {
      setMessage(t.requiredBirthDate);
      return false;
    }
    if (!form.gender) {
      setMessage(t.requiredGender);
      return false;
    }
    return true;
  }

  function validateStep2() {
    if (!form.facultyId) {
      setMessage(t.requiredFaculty);
      return false;
    }
    if (!form.majorName.trim()) {
      setMessage(t.requiredMajor);
      return false;
    }
    if (!form.course) {
      setMessage(t.requiredCourse);
      return false;
    }
    if (!form.className.trim()) {
      setMessage(t.requiredClass);
      return false;
    }
    if (!form.admissionYear) {
      setMessage(t.requiredAdmissionYear);
      return false;
    }
    return true;
  }

  function handleNext() {
    setMessage("");

    if (step === 1 && !validateStep1()) {
      setMessageType("error");
      return;
    }

    if (step === 2 && !validateStep2()) {
      setMessageType("error");
      return;
    }

    setStep((prev) => Math.min(3, prev + 1));
  }

  function handleBack() {
    setMessage("");
    setStep((prev) => Math.max(1, prev - 1));
  }

  async function handleComplete() {
    setMessage("");
    setMessageType("error");
    setSubmitting(true);

    try {
      const derivedSchoolYear = getSchoolYearFromAdmissionYear(form.admissionYear);
      const bio = [
        `gender:${form.gender || ""}`,
        `birthDate:${form.birthDate || ""}`,
        `address:${form.address || ""}`,
        `major:${form.majorName || ""}`,
        `course:${form.course || ""}`,
        `class:${form.className || ""}`,
        `admissionYear:${form.admissionYear || ""}`,
      ].join(" | ");

      const response = await api.put("/students/me/profile", {
        fullName: form.fullName.trim(),
        studentCode: form.studentCode.trim(),
        phone: form.phone.trim() || null,
        majorId: Number(form.facultyId),
        schoolYear: form.schoolYear ? Number(form.schoolYear) : derivedSchoolYear,
        bio,
      });

      const user = response.data?.user;
      if (user?.fullName) {
        localStorage.setItem("fullName", user.fullName);
      }

      setMessageType("success");
      setMessage(response.data?.message || t.updateSuccess);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setMessageType("error");
      setMessage(error.response?.data?.message || t.updateFailed);
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingPage) {
    return (
      <div className="cp-page cp-loading-page">
        <div className="cp-loading-box">{t.loadingData}</div>
      </div>
    );
  }

  const stepItems = [
    { title: t.step1, subtitle: t.step1Sub },
    { title: t.step2, subtitle: t.step2Sub },
    { title: t.step3, subtitle: t.step3Sub },
  ];

  return (
    <div className="cp-page">
      <div className="cp-shell">
        <div className="cp-brand-row">
          <div className="cp-brand-icon">
            <GraduationCap size={16} />
          </div>
          <strong>I Love Hust</strong>
          <div className="cp-lang-switch">
            <button
              type="button"
              className={language === "ja" ? "active" : ""}
              onClick={() => setLanguage("ja")}
            >
              JA
            </button>
            <button
              type="button"
              className={language === "vi" ? "active" : ""}
              onClick={() => setLanguage("vi")}
            >
              VI
            </button>
          </div>
        </div>

        <h1 className="cp-title">{t.pageTitle}</h1>
        <p className="cp-subtitle">{t.pageSubtitle}</p>

        <div className="cp-stepper">
          {stepItems.map((item, index) => {
            const stepNumber = index + 1;
            const isDone = step > stepNumber;
            const isCurrent = step === stepNumber;

            return (
              <div className="cp-stepper-unit" key={item.title}>
                <div className={`cp-step-bubble ${isDone ? "done" : ""} ${isCurrent ? "current" : ""}`}>
                  {isDone ? <Check size={14} /> : stepNumber}
                </div>
                <strong>{item.title}</strong>
                <span>{item.subtitle}</span>

                {index < stepItems.length - 1 && (
                  <div className={`cp-step-line ${step > stepNumber ? "active" : ""}`}></div>
                )}
              </div>
            );
          })}
        </div>

        <div className="cp-card">
          {step === 1 && (
            <>
              <div className="cp-section-head">
                <h2>{t.basicInfo}</h2>
                <p>{t.basicInfoDesc}</p>
              </div>

              <div className="cp-avatar-wrap">
                <div className="cp-avatar-circle">
                  <User size={44} />
                </div>
                <button className="cp-avatar-edit" type="button" aria-label={t.editAvatarAria}>
                  <Camera size={14} />
                </button>
              </div>

              <div className="cp-grid">
                <div className="cp-field">
                  <label>{t.fullName} *</label>
                  <div className="cp-input-wrap">
                    <User size={16} />
                    <input
                      value={form.fullName}
                      onChange={(e) => updateField("fullName", e.target.value)}
                      placeholder={t.placeholderName}
                    />
                  </div>
                </div>

                <div className="cp-field">
                  <label>{t.studentCode} *</label>
                  <div className="cp-input-wrap">
                    <IdCard size={16} />
                    <input
                      value={form.studentCode}
                      onChange={(e) => updateField("studentCode", e.target.value)}
                      placeholder={t.placeholderStudentCode}
                    />
                  </div>
                </div>

                <div className="cp-field">
                  <label>{t.email} *</label>
                  <div className="cp-input-wrap">
                    <Mail size={16} />
                    <input
                      value={form.email}
                      onChange={(e) => updateField("email", e.target.value)}
                    />
                  </div>
                </div>

                <div className="cp-field">
                  <label>{t.phone} *</label>
                  <div className="cp-input-wrap">
                    <Phone size={16} />
                    <input
                      value={form.phone}
                      onChange={(e) => updateField("phone", e.target.value)}
                      placeholder={t.placeholderPhone}
                    />
                  </div>
                </div>

                <div className="cp-field">
                  <label>{t.birthDate} *</label>
                  <div className="cp-input-wrap">
                    <Calendar size={16} />
                    <input
                      type="date"
                      value={form.birthDate}
                      onChange={(e) => updateField("birthDate", e.target.value)}
                    />
                  </div>
                </div>

                <div className="cp-field">
                  <label>{t.gender} *</label>
                  <div className="cp-input-wrap">
                    <Users size={16} />
                    <select
                      value={form.gender}
                      onChange={(e) => updateField("gender", e.target.value)}
                    >
                      <option value="">{t.choose}</option>
                      <option value="male">{t.genderMale}</option>
                      <option value="female">{t.genderFemale}</option>
                      <option value="other">{t.genderOther}</option>
                    </select>
                    <ChevronDown size={18} className="cp-select-arrow" />
                  </div>
                </div>

                <div className="cp-field cp-span-all">
                  <label>{t.address}</label>
                  <div className="cp-input-wrap cp-textarea-wrap">
                    <MapPin size={16} />
                    <textarea
                      value={form.address}
                      onChange={(e) => updateField("address", e.target.value)}
                      placeholder={t.placeholderAddress}
                    ></textarea>
                  </div>
                </div>
              </div>

              {message && <p className={`cp-message ${messageType}`}>{message}</p>}

              <div className="cp-actions single">
                <button type="button" className="cp-btn primary" onClick={handleNext}>
                  {t.next} <ChevronRight size={16} />
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div className="cp-section-head">
                <h2>{t.academicInfo}</h2>
                <p>{t.academicInfoDesc}</p>
              </div>

              <div className="cp-grid">
                <div className="cp-field">
                  <label>{t.faculty} *</label>
                  <div className="cp-input-wrap">
                    <School size={16} />
                    <select
                      value={form.facultyId}
                      onChange={(e) => updateFaculty(e.target.value)}
                    >
                      <option value="">{t.choose}</option>
                      {majors.map((major) => (
                        <option key={major.id} value={major.id}>
                          {major.majorCode} - {major.majorName}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={18} className="cp-select-arrow" />
                  </div>
                </div>

                <div className="cp-field">
                  <label>{t.major} *</label>
                  <div className="cp-input-wrap">
                    <BookOpen size={16} />
                    <input
                      value={form.majorName}
                      onChange={(e) => updateField("majorName", e.target.value)}
                      placeholder={t.placeholderMajor}
                    />
                  </div>
                </div>

                <div className="cp-field">
                  <label>{t.course} *</label>
                  <div className="cp-input-wrap">
                    <Layers size={16} />
                    <select
                      value={form.course}
                      onChange={(e) => updateField("course", e.target.value)}
                    >
                      <option value="">{t.choose}</option>
                      {COURSE_OPTIONS.map((option) => (
                        <option key={option} value={option}>
                          {t.courseOptions[option]}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={18} className="cp-select-arrow" />
                  </div>
                </div>

                <div className="cp-field">
                  <label>{t.className} *</label>
                  <div className="cp-input-wrap">
                    <Users size={16} />
                    <input
                      value={form.className}
                      onChange={(e) => updateField("className", e.target.value)}
                      placeholder={t.placeholderClass}
                    />
                  </div>
                </div>

                <div className="cp-field cp-span-all">
                  <label>{t.admissionYear} *</label>
                  <div className="cp-input-wrap">
                    <Calendar size={16} />
                    <select
                      value={form.admissionYear}
                      onChange={(e) => {
                        const value = e.target.value;
                        updateField("admissionYear", value);
                        updateField("schoolYear", String(getSchoolYearFromAdmissionYear(value) || ""));
                      }}
                    >
                      <option value="">{t.choose}</option>
                      {yearOptions.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={18} className="cp-select-arrow" />
                  </div>
                </div>
              </div>

              <div className="cp-warning-box">
                <AlertCircle size={18} />
                <div>
                  <strong>{t.warnTitle}</strong>
                  <p>{t.warnText}</p>
                </div>
              </div>

              {message && <p className={`cp-message ${messageType}`}>{message}</p>}

              <div className="cp-actions">
                <button type="button" className="cp-btn secondary" onClick={handleBack}>
                  {t.back}
                </button>
                <button type="button" className="cp-btn primary" onClick={handleNext}>
                  {t.next} <ChevronRight size={16} />
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="cp-confirm-top">
                <div className="cp-confirm-icon">
                  <Check size={26} />
                </div>
                <h2>{t.confirmTitle}</h2>
                <p>{t.confirmDesc}</p>
              </div>

              <div className="cp-review-box">
                <h3>{t.basicSection}</h3>
                <div className="cp-review-grid">
                  <div>
                    <span>{t.pFullName}</span>
                    <p>{formatValue(form.fullName)}</p>
                  </div>
                  <div>
                    <span>{t.pStudentCode}</span>
                    <p>{formatValue(form.studentCode)}</p>
                  </div>
                  <div>
                    <span>{t.pEmail}</span>
                    <p>{formatValue(form.email)}</p>
                  </div>
                  <div>
                    <span>{t.pPhone}</span>
                    <p>{formatValue(form.phone)}</p>
                  </div>
                  <div>
                    <span>{t.pBirthDate}</span>
                    <p>{formatValue(form.birthDate)}</p>
                  </div>
                  <div>
                    <span>{t.pGender}</span>
                    <p>{formatValue(getGenderLabel(form.gender, t))}</p>
                  </div>
                  <div className="cp-review-span-all">
                    <span>{t.pAddress}</span>
                    <p>{formatValue(form.address)}</p>
                  </div>
                </div>
              </div>

              <div className="cp-review-box">
                <h3>{t.academicSection}</h3>
                <div className="cp-review-grid">
                  <div>
                    <span>{t.pFaculty}</span>
                    <p>{formatValue(majors.find((m) => String(m.id) === form.facultyId)?.majorCode)}</p>
                  </div>
                  <div>
                    <span>{t.pMajor}</span>
                    <p>{formatValue(form.majorName)}</p>
                  </div>
                  <div>
                    <span>{t.pCourse}</span>
                    <p>
                      {formatValue(
                        t.courseOptions[form.course]
                      )}
                    </p>
                  </div>
                  <div>
                    <span>{t.pClassName}</span>
                    <p>{formatValue(form.className)}</p>
                  </div>
                  <div>
                    <span>{t.pAdmissionYear}</span>
                    <p>{formatValue(form.admissionYear)}</p>
                  </div>
                </div>
              </div>

              {message && <p className={`cp-message ${messageType}`}>{message}</p>}

              <div className="cp-actions">
                <button type="button" className="cp-btn secondary" onClick={handleBack}>
                  {t.back}
                </button>
                <button
                  type="button"
                  className="cp-btn success"
                  onClick={handleComplete}
                  disabled={submitting}
                >
                  {submitting ? t.loading : t.complete}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="cp-support-row">
          {t.support} <button type="button">{t.contact}</button>
        </div>
      </div>
    </div>
  );
}




