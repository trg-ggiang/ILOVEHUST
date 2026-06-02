function getApiOrigin() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "/api";

  if (!/^https?:\/\//i.test(apiBaseUrl)) return "";

  try {
    return new URL(apiBaseUrl).origin;
  } catch {
    return "";
  }
}

export function resolveMediaUrl(value) {
  const url = String(value || "").trim();
  if (!url) return "";
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  if (!url.startsWith("/")) return url;

  return `${getApiOrigin()}${url}`;
}
