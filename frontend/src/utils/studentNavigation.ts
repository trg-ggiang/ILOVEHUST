export const STUDENT_ROUTE_BY_MENU_KEY = Object.freeze({
  home: "/dashboard",
  grades: "/grades",
  forum: "/forum",
  messages: "/messages",
  tasks: "/tasks",
  schedule: "/schedule",
  stats: "/statistics",
  settings: "/settings",
});

export function clearStudentSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  localStorage.removeItem("fullName");
}

export function handleStudentMenuNavigation(key, navigate, currentKey) {
  if (key === "logout") {
    clearStudentSession();
    navigate("/login", { replace: true });
    return true;
  }

  const route = STUDENT_ROUTE_BY_MENU_KEY[key];
  if (!route) return false;

  if (key !== currentKey) {
    navigate(route);
  }

  return true;
}
