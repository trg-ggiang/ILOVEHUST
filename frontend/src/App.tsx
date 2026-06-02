import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/admin/Login";
import Register from "./pages/admin/Register";
import ForgotPassword from "./pages/admin/ForgotPassword";
import ResetPassword from "./pages/admin/ResetPassword";
import AdminDashboard from "./pages/admin/AdminDashboard";
import Dashboard from "./pages/student/Dashboard";
import CompleteProfile from "./pages/student/CompleteProfile";
import GradesPage from "./pages/student/Grades";
import ForumPage from "./pages/student/Forum";
import MessagesPage from "./pages/student/Messages";
import SchedulePage from "./pages/student/Schedule";
import StatisticsPage from "./pages/student/Statistics";
import TasksPage from "./pages/student/Tasks";
import SettingsPage from "./pages/student/Settings";
import VietnamMap from "./pages/student/VietnamMap";

function App() {
  return (
      <BrowserRouter>
        <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/grades" element={<GradesPage />} />
        <Route path="/forum" element={<ForumPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/schedule" element={<SchedulePage />} />
        <Route path="/statistics" element={<StatisticsPage />} />
        <Route path="/stats" element={<StatisticsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route path="/vietnam-map" element={<VietnamMap />} />
      </Routes>
      </BrowserRouter>
  );
}

export default App;
