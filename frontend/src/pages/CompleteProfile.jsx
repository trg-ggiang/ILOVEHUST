import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function CompleteProfile() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: "",
    studentCode: "",
    majorId: "",
    schoolYear: "",
    gpa: "",
    cpa: "",
    cttConnected: false,
  });

  const [majors, setMajors] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const checkUser = async () => {
      try {
        const response = await api.get("/auth/me");
        const user = response.data.user;

        if (user.role !== 1) {
          navigate("/dashboard", { replace: true });
          return;
        }

        if (user.profileCompleted) {
          navigate("/dashboard", { replace: true });
        }
      } catch (error) {
        localStorage.clear();
        navigate("/login", { replace: true });
      }
    };

    checkUser();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await api.patch("/users/profile", form);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setMessage(error.response?.data?.message || "Cập nhật thất bại");
    }
  };

  return (
    <div className="page-card">
      <h1 className="page-title">Complete your profile</h1>

      <form className="apple-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="fullName"
          placeholder="Họ tên"
          value={form.fullName}
          onChange={handleChange}
        />

        <input
          type="text"
          name="studentCode"
          placeholder="Mã số sinh viên"
          value={form.studentCode}
          onChange={handleChange}
        />

        <input
          type="number"
          name="majorId"
          placeholder="Major ID"
          value={form.majorId}
          onChange={handleChange}
        />

        <input
          type="number"
          name="schoolYear"
          placeholder="Sinh viên năm mấy"
          value={form.schoolYear}
          onChange={handleChange}
        />

        <input
          type="number"
          step="0.01"
          name="gpa"
          placeholder="GPA"
          value={form.gpa}
          onChange={handleChange}
        />

        <input
          type="number"
          step="0.01"
          name="cpa"
          placeholder="CPA"
          value={form.cpa}
          onChange={handleChange}
        />

        <label className="checkbox-row">
          <input
            type="checkbox"
            name="cttConnected"
            checked={form.cttConnected}
            onChange={handleChange}
          />
          Cho phép kết nối CTT
        </label>

        <button type="submit">Save Profile</button>
      </form>

      {message && <p className="form-message">{message}</p>}
    </div>
  );
}