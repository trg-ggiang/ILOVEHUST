export function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL || "/api";
}

export function getApiOrigin() {
  const apiBaseUrl = getApiBaseUrl();

  if (!/^https?:\/\//i.test(apiBaseUrl)) return "";

  try {
    return new URL(apiBaseUrl).origin;
  } catch {
    return "";
  }
}

export function getApiUrl(path) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getApiBaseUrl().replace(/\/$/, "")}${normalizedPath}`;
}
