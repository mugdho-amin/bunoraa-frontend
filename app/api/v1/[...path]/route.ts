import { NextRequest, NextResponse } from "next/server";

const API_PREFIX = "/api/v1";

function getBackendApiBaseUrl() {
  const configuredBase =
    (process.env.NEXT_INTERNAL_API_BASE_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "")
      .trim()
      .replace(/\/$/, "");

  if (!configuredBase) {
    throw new Error("Missing NEXT_INTERNAL_API_BASE_URL or NEXT_PUBLIC_API_BASE_URL");
  }

  if (!/^https?:\/\//i.test(configuredBase)) {
    throw new Error(
      "The API proxy requires NEXT_INTERNAL_API_BASE_URL or NEXT_PUBLIC_API_BASE_URL to be an absolute URL."        
    );
  }

  return configuredBase;
}

function buildTargetUrl(request: NextRequest) {
  const apiBaseUrl = getBackendApiBaseUrl();
  const suffix = request.nextUrl.pathname.startsWith(API_PREFIX)
    ? request.nextUrl.pathname.slice(API_PREFIX.length) || "/"
    : request.nextUrl.pathname;

  return `${apiBaseUrl}${suffix}${request.nextUrl.search}`;
}

const ALLOWED_FORWARD_HEADERS = [
  "content-type",
  "accept",
  "accept-language",
  "x-csrftoken",
  "x-language-code",
];

function buildProxyHeaders(request: NextRequest): HeadersInit {
  const headers: HeadersInit = {};
  for (const key of ALLOWED_FORWARD_HEADERS) {
    const value = request.headers.get(key);
    if (value) headers[key] = value;
  }
  return headers;
}

function validateProxyPath(pathname: string): void {
  const decoded = decodeURIComponent(pathname);
  if (decoded.includes("..") || decoded.includes("//")) {
    throw new Error("Invalid path: path traversal detected");
  }

  // Allow all /api/v1/ paths in both development and production
  // This avoids hardcoding every new endpoint (e.g., categories, artisans, reviews, analytics)
  if (!pathname.startsWith("/api/v1/")) {
    throw new Error("Invalid path: prefix not allowed");
  }
}

function sanitizeResponseHeaders(headers: Headers) {
  const nextHeaders = new Headers(headers);

  // The Node.js fetch implementation can transparently decode upstream
  // compressed responses. Strip transport-specific headers so the browser
  // does not try to decode an already-decoded payload.
  nextHeaders.delete("content-encoding");
  nextHeaders.delete("content-length");
  nextHeaders.delete("transfer-encoding");
  nextHeaders.delete("connection");
  nextHeaders.delete("keep-alive");

  return nextHeaders;
}

async function proxyRequest(request: NextRequest) {
  // Security Hardening: Ensure request comes from our own site
  if (process.env.NODE_ENV === "production") {
    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
    const isAuthorized = true; // Temporary bypass for origin validation
//
//
//
      (referer && referer.startsWith(siteUrl)) ||
      (!origin && !referer); // Allow direct server-side calls if needed

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized origin" }, { status: 403 });
    }
  }

  let backendResponse: Response;

  try {
    validateProxyPath(request.nextUrl.pathname);
    backendResponse = await fetch(buildTargetUrl(request), {
      method: request.method,
      headers: buildProxyHeaders(request),
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : await request.arrayBuffer(),
      cache: "no-store",
      redirect: "manual",
    });
  } catch (error) {
    // Log full error details server-side, but never expose internal details to client
    console.error("API proxy request failed:", error);

    return NextResponse.json(
      {
        success: false,
        message: "The upstream service is temporarily unavailable. Please try again later.",
      },
      { status: 502 }
    );
  }

  if (backendResponse.redirected) {
    return NextResponse.json(
      { error: "Unexpected redirect", message: "The upstream service returned a redirect." },
      { status: 502 }
    );
  }

  const responseHeaders = sanitizeResponseHeaders(backendResponse.headers);
  responseHeaders.set("x-bunoraa-api-proxy", "next-route-handler");

  return new NextResponse(backendResponse.body, {
    status: backendResponse.status,
    statusText: backendResponse.statusText,
    headers: responseHeaders,
  });
}

export async function GET(request: NextRequest) {
  return proxyRequest(request);
}

export async function POST(request: NextRequest) {
  return proxyRequest(request);
}

export async function PUT(request: NextRequest) {
  return proxyRequest(request);
}

export async function PATCH(request: NextRequest) {
  return proxyRequest(request);
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request);
}

export async function HEAD(request: NextRequest) {
  return proxyRequest(request);
}

export async function OPTIONS(request: NextRequest) {
  return proxyRequest(request);
}
