import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

function buildProxyHeaders(request: NextRequest) {
  const headers = new Headers(request.headers);

  headers.delete("host");
  headers.delete("content-length");
  headers.delete("accept-encoding");
  headers.delete("origin");
  headers.delete("referer");
  headers.delete("connection");

  return headers;
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
  let backendResponse: Response;

  try {
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
    return NextResponse.json(
      {
        success: false,
        message: "API proxy request failed",
        error: error instanceof Error ? error.message : "Unknown proxy error",
      },
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
