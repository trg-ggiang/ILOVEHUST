import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Check, IdCard, Mail, Phone, Save, User } from "lucide-react";
import api from "../../api";
import {
  getStoredLanguage,
  getStoredSidebarState,
  setStoredLanguage,
  setStoredSidebarState,
} from "../../i18n/language";
import { STUDENT_COMMON_TEXT } from "../../i18n/translations";
import StudentHeader from "../../components/student/StudentHeader";
import StudentTaskbar from "../../components/student/StudentTaskbar";
import { handleStudentMenuNavigation } from "../../utils/studentNavigation";

export default function SettingsPage() {
  const navigate = useNavigate();
  const avatarInputRef = useRef(null);
  const [language, setLanguage] = useState(getStoredLanguage);
  const [sidebarOpen, setSidebarOpen] = useState(getStoredSidebarState);
  const [majors, setMajors] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const commonText = useMemo(() => STUDENT_COMMON_TEXT[language] || STUDENT_COMMON_TEXT.vi, [language]);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    studentCode: "",
    majorId: "",
    schoolYear: "",
    bio: "",
  });

  useEffect(() => {
    setStoredLanguage(language);
  }, [language]);

  useEffect(() => {
    setStoredSidebarState(sidebarOpen);
  }, [sidebarOpen]);

  useEffect(() => {
    let mounted = true;

    async function loadSettings() {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login", { replace: true });
        return;
      }

      try {
        setLoading(true);
        const [meResponse, majorsResponse] = await Promise.all([
          api.get("/auth/me"),
          api.get("/majors"),
        ]);
        if (!mounted) return;

        const user = meResponse.data?.user;
        if (!user || user.role !== 1) {
          navigate("/login", { replace: true });
          return;
        }

        setMajors(majorsResponse.data?.majors || []);
        setAvatarUrl(user.avatarUrl || "");
        setAvatarPreview(user.avatarUrl || "");
        setForm({
          fullName: user.fullName || "",
          email: user.email || "",
          phone: user.phone || "",
          studentCode: user.studentCode || "",
          majorId: user.majorId ? String(user.majorId) : "",
          schoolYear: user.schoolYear ? String(user.schoolYear) : "",
          bio: user.bio || "",
        });
      } catch {
        if (!mounted) return;
        setMessageType("error");
        setMessage("Không thể tải thông tin cài đặt.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSettings();
    return () => {
      mounted = false;
    };
  }, [navigate]);

  function handleMenuClick(key) {
    handleStudentMenuNavigation(key, navigate, "settings");
  }

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setMessage("");
  }

  function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessageType("error");
      setMessage("Vui lòng chọn file ảnh.");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setMessage("");
  }

  async function handleUploadAvatar() {
    if (!avatarFile) return avatarUrl;

    const formData = new FormData();
    formData.append("avatar", avatarFile);

    setUploadingAvatar(true);
    try {
      const response = await api.post("/students/me/avatar", formData);
      const nextAvatarUrl = response.data?.avatarUrl || "";
      setAvatarUrl(nextAvatarUrl);
      setAvatarPreview(nextAvatarUrl);
      if (nextAvatarUrl) {
        localStorage.setItem("avatarUrl", nextAvatarUrl);
      }
      setAvatarFile(null);
      return nextAvatarUrl;
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  async function handleSave(event) {
    event.preventDefault();
    setMessage("");
    setMessageType("error");

    if (!form.fullName.trim()) {
      setMessage("Họ tên không được để trống.");
      return;
    }

    if (!form.email.trim()) {
      setMessage("Email không được để trống.");
      return;
    }

    if (!form.majorId) {
      setMessage("Vui lòng chọn ngành học.");
      return;
    }

    try {
      setSaving(true);
      await handleUploadAvatar();
      const response = await api.put("/students/me/profile", {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        studentCode: form.studentCode.trim() || null,
        majorId: Number(form.majorId),
        schoolYear: form.schoolYear ? Number(form.schoolYear) : null,
        bio: form.bio.trim() || null,
      });

      const user = response.data?.user;
      if (user?.fullName) {
        localStorage.setItem("fullName", user.fullName);
      }
      if (user?.avatarUrl) {
        localStorage.setItem("avatarUrl", user.avatarUrl);
        setAvatarUrl(user.avatarUrl);
        setAvatarPreview(user.avatarUrl);
      }

      setMessageType("success");
      setMessage("Đã lưu thay đổi.");
    } catch (error) {
      setMessageType("error");
      setMessage(error.response?.data?.message || "Không thể lưu cài đặt.");
    } finally {
      setSaving(false);
    }
  }

  const initial = form.fullName.trim().charAt(0).toUpperCase() || "?";

  return (
    <div className={`student-layout settings-layout ${sidebarOpen ? "" : "sidebar-collapsed"}`}>
      <StudentTaskbar
        language={language}
        activeKey="settings"
        onMenuClick={handleMenuClick}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <StudentHeader
        fullName={form.fullName || localStorage.getItem("fullName") || commonText.fallbackName}
        studentCode={form.studentCode}
        avatarUrl={avatarPreview || avatarUrl}
        language={language}
        onLanguageChange={setLanguage}
        onToggleSidebar={() => setSidebarOpen((current) => !current)}
      />

      <main className={`student-main page-fade-in ${sidebarOpen ? "" : "expanded"}`}>
        <section className="student-main-content settings-content">
          <div className="settings-head">
            <div>
              <h1>Cài đặt tài khoản</h1>
              <p>Cập nhật thông tin cá nhân và ảnh đại diện của bạn.</p>
            </div>
          </div>

          <form className="settings-card" onSubmit={handleSave}>
            {loading ? (
              <p className="settings-loading">Đang tải thông tin...</p>
            ) : (
              <>
                <section className="settings-avatar-section">
                  <div className="settings-avatar">
                    {avatarPreview ? <img src={avatarPreview} alt={form.fullName || "Avatar"} /> : <span>{initial}</span>}
                  </div>
                  <div>
                    <h2>Ảnh đại diện</h2>
                    <p>Chọn ảnh rõ mặt, dung lượng tối đa 5MB.</p>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="settings-file-input"
                      onChange={handleAvatarChange}
                    />
                    <button type="button" className="settings-secondary-btn" onClick={() => avatarInputRef.current?.click()}>
                      <Camera size={17} />
                      Chọn ảnh
                    </button>
                  </div>
                </section>

                <section className="settings-form-grid">
                  <label className="settings-field">
                    <span>Họ tên</span>
                    <div>
                      <User size={17} />
                      <input value={form.fullName} onChange={(event) => updateField("fullName", event.target.value)} />
                    </div>
                  </label>

                  <label className="settings-field">
                    <span>Mã sinh viên</span>
                    <div>
                      <IdCard size={17} />
                      <input value={form.studentCode} onChange={(event) => updateField("studentCode", event.target.value)} />
                    </div>
                  </label>

                  <label className="settings-field">
                    <span>Email</span>
                    <div>
                      <Mail size={17} />
                      <input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} />
                    </div>
                  </label>

                  <label className="settings-field">
                    <span>Số điện thoại</span>
                    <div>
                      <Phone size={17} />
                      <input value={form.phone} onChange={(event) => updateField("phone", event.target.value)} />
                    </div>
                  </label>

                  <label className="settings-field">
                    <span>Ngành học</span>
                    <div>
                      <select value={form.majorId} onChange={(event) => updateField("majorId", event.target.value)}>
                        <option value="">Chọn ngành học</option>
                        {majors.map((major) => (
                          <option key={major.id} value={major.id}>
                            {major.majorCode} - {major.majorName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </label>

                  <label className="settings-field">
                    <span>Năm học</span>
                    <div>
                      <input
                        type="number"
                        min="1"
                        max="8"
                        value={form.schoolYear}
                        onChange={(event) => updateField("schoolYear", event.target.value)}
                      />
                    </div>
                  </label>

                  <label className="settings-field settings-span-all">
                    <span>Giới thiệu</span>
                    <textarea
                      value={form.bio}
                      onChange={(event) => updateField("bio", event.target.value)}
                      placeholder="Viết vài dòng ngắn về bạn..."
                    />
                  </label>
                </section>

                {message ? (
                  <p className={`settings-message ${messageType}`}>
                    {messageType === "success" ? <Check size={16} /> : null}
                    {message}
                  </p>
                ) : null}

                <div className="settings-actions">
                  <button type="submit" className="settings-save-btn" disabled={saving || uploadingAvatar}>
                    <Save size={18} />
                    {saving || uploadingAvatar ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
              </>
            )}
          </form>
        </section>
      </main>
    </div>
  );
}
