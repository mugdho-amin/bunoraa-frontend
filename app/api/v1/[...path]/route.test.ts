import { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

describe("API proxy route", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_INTERNAL_API_BASE_URL", "https://api.example.test/api/v1");
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.test/api/v1");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("forwards session, auth, CSRF, and tracing headers to the upstream API", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          "content-type": "application/json",
          "set-cookie": "sessionid=next-session; Path=/; HttpOnly; SameSite=Lax",
        },
      })
    );
    vi.stubGlobal("fetch", fetchMock);

    const request = new NextRequest("https://bunoraa.test/api/v1/commerce/cart/add/", {
      method: "POST",
      headers: {
        authorization: "Bearer access-token",
        cookie: "sessionid=django-session; csrftoken=csrf-token",
        "content-type": "application/json",
        "x-csrftoken": "csrf-token",
        "x-request-id": "req-123",
        "x-requested-with": "XMLHttpRequest",
      },
      body: JSON.stringify({ product_id: "product-id", quantity: 1 }),
    });

    const response = await POST(request);
    const [, init] = fetchMock.mock.calls[0];

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/commerce/cart/add/",
      expect.objectContaining({ method: "POST" })
    );
    expect(init.headers).toMatchObject({
      authorization: "Bearer access-token",
      cookie: "sessionid=django-session; csrftoken=csrf-token",
      "content-type": "application/json",
      "x-csrftoken": "csrf-token",
      "x-request-id": "req-123",
      "x-requested-with": "XMLHttpRequest",
    });
    expect(response.headers.get("set-cookie")).toContain("sessionid=next-session");
  });
});
