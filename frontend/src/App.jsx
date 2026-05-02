import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/admin/Login";
import Dashboard from "./pages/student/Dashboard";
import CompleteProfile from "./pages/student/CompleteProfile";
import GradesPage from "./pages/student/Grades";
import ForumPage from "./pages/student/Forum";
import MessagesPage from "./pages/student/Messages";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/grades" element={<GradesPage />} />
        <Route path="/forum" element={<ForumPage />} />
        <Route path="/messages" element={<MessagesPage />} />
        <Route path="/complete-profile" element={<CompleteProfile />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

