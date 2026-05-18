export const LANGUAGE_STORAGE_KEY = "language";
export const SIDEBAR_STORAGE_KEY = "student_sidebar_open";
export const DEFAULT_LANGUAGE = "vi";

export function normalizeLanguage(language) {
  return language === "ja" ? "ja" : "vi";
}

export function getStoredLanguage() {
  return normalizeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY) || DEFAULT_LANGUAGE);
}

export function setStoredLanguage(language) {
  localStorage.setItem(LANGUAGE_STORAGE_KEY, normalizeLanguage(language));
}

export function getStoredSidebarState() {
  return localStorage.getItem(SIDEBAR_STORAGE_KEY) !== "0";
}

export function setStoredSidebarState(isOpen) {
  localStorage.setItem(SIDEBAR_STORAGE_KEY, isOpen ? "1" : "0");
}
