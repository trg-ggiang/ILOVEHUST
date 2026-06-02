import { getApiOrigin } from "./apiUrl";

export function resolveMediaUrl(value) {
  const url = String(value || "").trim();
  if (!url) return "";
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  if (!url.startsWith("/")) return url;

  return `${getApiOrigin()}${url}`;
}
