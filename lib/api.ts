import type { ApiResponse } from "@/lib/types";
import { clearTokens, getRefreshToken, setAccessToken, setTokens } from "@/lib/auth";
import { getLocaleHeaders } from "@/lib/locale";
import { safeGetItem, safeSessionGetItem } from "@/lib/storage";

type ApiFetchOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: HeadersInit;
  params?: Record<string, string | number | boolean | Array<string | number | boolean> | undefined>;
  cache?: RequestCache;
  next?: { revalidate?: number };
  signal?: AbortSignal;
  retryOnCsrf?: boolean;
  retryOnAuth?: boolean;
  skipAuth?: boolean;
  allowGuest?: boolean;
  suppressError?: boolean;
  suppressErrorStatus?: number[];
  retries?: number;
  retryDelay?: number;
  timeout?: number;
};

const PUBLIC_API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
const INTERNAL_API_BASE_URL = (process.env.NEXT_INTERNAL_API_BASE_URL || "").replace(/\/$/, "");
const FALLBACK_SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "") || null;

let pendingRefresh: Promise<string | null> | null = null;

function ensureTrailingSlash(path: string) {
  if (!path.endsWith("/")) {
    return `${path}/`;
  }
  return path;
}

function toPathBase(urlString: string) {
  try {
    const parsed = new URL(urlString);
    return parsed.pathname.replace(/\/$/, "") || "/api";
  } catch {
    return urlString;
  }
}

function parseProxyMode(value: string): boolean | null {
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) return true;
  if (["0", "false", "no", "off"].includes(normalized)) return false;
  return null;
}

function shouldProxyPublicApi(currentOrigin?: string) {
  if (!PUBLIC_API_BASE_URL || PUBLIC_API_BASE_URL.startsWith("/")) return false;

  const proxyMode = parseProxyMode(process.env.NEXT_PUBLIC_API_USE_PROXY || "");
  if (proxyMode !== null) {
    return proxyMode;
  }

  if (!currentOrigin) return false;

  try {
    return new URL(PUBLIC_API_BASE_URL).origin !== currentOrigin;
  } catch {
    return false;
  }
}

function getClientApiBaseUrl(currentOrigin?: string) {
  if (!PUBLIC_API_BASE_URL) return "";
  if (PUBLIC_API_BASE_URL.startsWith("/")) return PUBLIC_API_BASE_URL;
  if (shouldProxyPublicApi(currentOrigin)) {
    return toPathBase(PUBLIC_API_BASE_URL);
  }
  return PUBLIC_API_BASE_URL;
}

function getApiBaseUrl() {
  if (typeof window === "undefined") {
    return INTERNAL_API_BASE_URL || PUBLIC_API_BASE_URL;
  }
  return getClientApiBaseUrl(window.location.origin);
}

export function getBrowserApiBaseUrl() {
  if (typeof window === "undefined") {
    return PUBLIC_API_BASE_URL;
  }
  return getClientApiBaseUrl(window.location.origin);
}

export function getBrowserApiOrigin() {
  if (typeof window === "undefined") {
    return "";
  }

  if (!PUBLIC_API_BASE_URL || PUBLIC_API_BASE_URL.startsWith("/")) {
    return window.location.origin;
  }

  if (shouldProxyPublicApi(window.location.origin)) {
    return window.location.origin;
  }

  try {
    return new URL(PUBLIC_API_BASE_URL).origin;
  } catch {
    return window.location.origin;
  }
}

function buildUrl(path: string, params?: ApiFetchOptions["params"]) {
  const normalizedPath = ensureTrailingSlash(path.startsWith("/") ? path : `/${path}`);
  const base = getApiBaseUrl();
  if (!base) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not set");
  }
  if (base.startsWith("/") && typeof window === "undefined" && !FALLBACK_SITE_URL) {
    throw new Error(
      "NEXT_PUBLIC_SITE_URL must be set when using relative API base URLs on the server. " +
      "Set it to your deployment's origin (e.g., https://example.com)."
    );
  }
  const url =
    base.startsWith("/")
      ? new URL(
          `${base}${normalizedPath}`,
          typeof window !== "undefined" ? window.location.origin : FALLBACK_SITE_URL!
        )
      : new URL(`${base}${normalizedPath}`);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      if (Array.isArray(value)) {
        value.forEach((item) => url.searchParams.append(key, String(item)));
      } else {
        url.searchParams.set(key, String(value));
      }
    });
  }
  return url;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = `${base64}${"=".repeat((4 - (base64.length % 4)) % 4)}`;
    const decoded = window.atob(padded);
    const payload = JSON.parse(decoded);
    if (payload && typeof payload === "object") {
      return payload as Record<string, unknown>;
    }
  } catch {
    return null;
  }
  return null;
}

function isAccessTokenExpired(token: string, skewSeconds = 15) {
  const payload = decodeJwtPayload(token);
  const exp = payload?.exp;
  if (typeof exp !== "number") return false;
  const now = Math.floor(Date.now() / 1000);
  return exp <= now + skewSeconds;
}

function getAccessToken() {
  if (typeof window === "undefined") return null;
  return (
    safeGetItem("bunoraa:access_token") ||
    safeSessionGetItem("bunoraa:access_token")
  );
}

function getCookie(name: string) {
  if (typeof document === "undefined") return "";
  const value = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return value ? decodeURIComponent(value.split("=")[1] || "") : "";
}

function setCookie(name: string, value: string) {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; samesite=Strict; HttpOnly${secure}`;
}

function extractErrorMessage(json: unknown): string | null {
  if (!json) return null;
  if (typeof json === "string" && json.trim()) return json.trim();
  if (Array.isArray(json) && json.length > 0) {
    return String(json[0]);
  }
  if (typeof json !== "object") return null;
  const record = json as Record<string, unknown>;
  if (typeof record.message === "string" && record.message.trim()) return record.message.trim();
  if (typeof record.error === "string" && record.error.trim()) return record.error.trim();
  if (typeof record.detail === "string" && record.detail.trim()) return record.detail.trim();
  if (Array.isArray(record.non_field_errors) && record.non_field_errors.length) {
    return String(record.non_field_errors[0]);
  }

  const humanize = (value: string) =>
    value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());

  const pickFieldError = (errors: Record<string, unknown>) => {
    for (const [key, value] of Object.entries(errors)) {
      if (!key) continue;
      if (Array.isArray(value) && value.length) {
        const message = String(value[0]);
        return key === "non_field_errors" ? message : `${humanize(key)}: ${message}`;
      }
      if (typeof value === "string" && value.trim()) {
        return key === "non_field_errors"
          ? value.trim()
          : `${humanize(key)}: ${value.trim()}`;
      }
    }
    return null;
  };

  if (record.errors && typeof record.errors === "object") {
    const errors = record.errors as Record<string, unknown>;
    const fieldMessage = pickFieldError(errors);
    if (fieldMessage) return fieldMessage;
  }

  const fieldMessage = pickFieldError(record);
  if (fieldMessage) return fieldMessage;

  for (const value of Object.values(record)) {
    if (Array.isArray(value) && value.length) return String(value[0]);
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

export class ApiError extends Error {
  status: number;
  data?: unknown;
  path?: string;
  isDynamicError?: boolean;

  constructor(message: string, status: number, data?: unknown, path?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
    this.path = path;
  }
}

async function parseJsonSafe(response: Response) {
  try {
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return { _text: text };
    }
  } catch {
    return null;
  }
}

async function refreshAccessToken() {
  if (typeof window === "undefined") return null;
  const refresh = getRefreshToken();
  if (!refresh || !getApiBaseUrl()) return null;

  if (pendingRefresh) return pendingRefresh;

  pendingRefresh = (async () => {
    try {
      const response = await fetch(buildUrl("/auth/token/refresh/"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest",
        },
        credentials: "include",
        body: JSON.stringify({ refresh }),
      });

      if (!response.ok) return null;

      const json = await parseJsonSafe(response);
      const jsonData = json && typeof json === "object" && "data" in json ? json.data : json;
      const access = jsonData?.access || null;
      const newRefresh = jsonData?.refresh || null;
      if (access) {
        if (newRefresh) {
          setTokens(access, newRefresh);
        } else {
          setAccessToken(access);
        }
        return access;
      }
      return null;
    } catch {
      return null;
    } finally {
      pendingRefresh = null;
    }
  })();

  return pendingRefresh;
}

let _defaultReqCounter = 0;

function generateRequestId(): string {
  return `req-${++_defaultReqCounter}`;
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<ApiResponse<T>> {
  const {
    method = "GET",
    body,
    headers,
    params,
    next,
    cache,
    signal,
    retryOnCsrf = true,
    retryOnAuth = true,
    skipAuth = false,
    allowGuest = false,
    suppressError = false,
    suppressErrorStatus = [],
    timeout = 30000,
  } = options;

  const url = buildUrl(path, params);

  // Apply request timeout via AbortSignal
  const timeoutSignal = typeof AbortSignal !== "undefined" && AbortSignal.timeout
    ? AbortSignal.timeout(timeout)
    : null;
  const combinedSignal = signal && timeoutSignal
    ? AbortSignal.any([signal, timeoutSignal])
    : (signal || timeoutSignal);
  let token = skipAuth ? null : getAccessToken();
  if (!skipAuth && token && typeof window !== "undefined" && isAccessTokenExpired(token)) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      token = refreshed;
    } else {
      clearTokens();
      token = null;
    }
  }
  const csrfToken = getCookie("csrftoken");
  const localeHeaders = getLocaleHeaders();
  const isFormData =
    typeof FormData !== "undefined" && body instanceof FormData;

  const requestId = generateRequestId();

  const init: RequestInit & { next?: { revalidate?: number } } = {
    method,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      "X-Request-ID": requestId,
      ...(csrfToken ? { "X-CSRFToken": csrfToken } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...localeHeaders,
      ...headers,
    },
    credentials: "include",
    body:
      body && method !== "GET"
        ? isFormData
          ? body
          : JSON.stringify(body)
        : undefined,
    cache,
    signal: combinedSignal,
  };

  if (next) {
    init.next = next;
  }

  const controller = new AbortController();
  const timeoutTimer = setTimeout(() => controller.abort(), timeout);
  
  const response = await fetch(url, init);
  clearTimeout(timeoutTimer);

  const json = await parseJsonSafe(response);

  if (!response.ok) {
    if (response.status === 401 && retryOnAuth && typeof window !== "undefined") {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return apiFetch<T>(path, { ...options, retryOnAuth: false });
      }
      clearTokens();
      if (allowGuest && !skipAuth) {
        return apiFetch<T>(path, {
          ...options,
          skipAuth: true,
          retryOnAuth: false,
        });
      }
    }
    const newToken = json?.meta?.new_csrf_token;
    if (response.status === 403 && newToken && retryOnCsrf && typeof window !== "undefined") {
      setCookie("csrftoken", newToken);
      return apiFetch<T>(path, { ...options, retryOnCsrf: false });
    }
    const rawText =
      json &&
      typeof json === "object" &&
      "_text" in json &&
      typeof (json as { _text?: unknown })._text === "string"
        ? String((json as { _text?: string })._text)
        : "";
    const safeText = rawText && !rawText.includes("<") ? rawText.trim() : "";
    const extracted = extractErrorMessage(json);
    const message = extracted || safeText || response.statusText || "Request failed";
    const shouldSuppress =
      suppressError || (suppressErrorStatus && suppressErrorStatus.includes(response.status));
    
    if (typeof window !== "undefined" && !shouldSuppress) {
      const path = url.toString();
      console.error("API error", path, response.status, message, json);
    }

    const error = new ApiError(message, response.status, json, url.toString());
    
    // Check for Next.js dynamic usage error to avoid build noise
    if (message.includes("Dynamic server usage")) {
      error.isDynamicError = true;
    }
    
    throw error;
  }

  if (json && typeof json === "object" && "data" in json) {
    return json as ApiResponse<T>;
  }

  if (json && typeof json === "object" && "_text" in json) {
    return {
      success: true,
      message: "OK",
      data: (json as { _text: string })._text as T,
      meta: null,
    };
  }

  if (json && typeof json === "object" && Array.isArray((json as { results?: unknown }).results)) {
    const resultJson = json as {
      results: T;
      count?: number;
      next?: string | null;
      previous?: string | null;
    };
    const pageSize = Array.isArray(resultJson.results) ? resultJson.results.length : 0;
    const pageParam = url.searchParams.get("page");
    const page = pageParam ? Number(pageParam) || 1 : 1;
    return {
      success: true,
      message: "OK",
      data: resultJson.results,
      meta: {
        pagination: {
          count: resultJson.count ?? pageSize,
          next: resultJson.next ?? null,
          previous: resultJson.previous ?? null,
          page,
          page_size: pageSize,
          total_pages:
            resultJson.count && pageSize > 0
              ? Math.max(1, Math.ceil(resultJson.count / pageSize))
              : 1,
        },
      },
    };
  }

  return {
    success: true,
    message: "OK",
    data: json as T,
    meta: null,
  };
}
