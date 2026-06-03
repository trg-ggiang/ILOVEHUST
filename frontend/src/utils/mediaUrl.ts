import { getApiOrigin } from "./apiUrl";

function getLocalBackendOrigin() {
  if (typeof window === "undefined") return "";

  const { protocol, hostname, port } = window.location;
  const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";
  if (!isLocalHost || port === "5000") return "";

  return `${protocol}//${hostname}:5000`;
}

function getSocketOrigin() {
  const socketUrl = import.meta.env.VITE_SOCKET_URL || "";
  if (!/^https?:\/\//i.test(socketUrl)) return "";

  try {
    return new URL(socketUrl).origin;
  } catch {
    return "";
  }
}

function getMediaOrigin() {
  return getApiOrigin() || getSocketOrigin() || getLocalBackendOrigin();
}

export function resolveMediaUrl(value) {
  const url = String(value || "").trim();
  if (!url) return "";
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  if (!url.startsWith("/")) return url;

  return `${getMediaOrigin()}${url}`;
}
