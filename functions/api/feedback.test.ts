// @vitest-environment node

import { afterEach, describe, expect, it, vi } from "vitest";

import { onRequest } from "@/functions/api/feedback";
import { MIN_COMPLETION_MS } from "@/lib/feedback";

const ENDPOINT = "https://ivapps.pro/api/feedback";

function validForm(overrides: Record<string, string> = {}) {
  const form = new FormData();
  Object.entries({
    mode: "suggestion",
    name: "Іван",
    email: "ivan@example.com",
    message: "Калькулятор прогину балки",
    website: "",
    startedAt: String(Date.now() - MIN_COMPLETION_MS - 1_000),
    ...overrides,
  }).forEach(([key, value]) => form.set(key, value));
  return form;
}

function request(
  body: BodyInit = validForm(),
  init: { method?: string; origin?: string; contentType?: string } = {},
) {
  const headers = new Headers({ Origin: init.origin ?? "https://ivapps.pro" });
  if (init.contentType) headers.set("Content-Type", init.contentType);
  return new Request(ENDPOINT, {
    method: init.method ?? "POST",
    headers,
    ...(init.method === "GET" ? {} : { body }),
  });
}

function context(req: Request, apiKey: string | undefined = "re_private_key") {
  return { request: req, env: { RESEND_API_KEY: apiKey } };
}

describe("feedback Pages Function", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends a valid same-origin multipart submission", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: "mail_1" }), {
      status: 200,
    }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await onRequest(context(request()));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns neutral success for a honeypot without calling Resend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await onRequest(
      context(request(validForm({ website: "spam.example" }))),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects a too-fast submission without calling Resend", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await onRequest(
      context(request(validForm({ startedAt: String(Date.now()) }))),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      message: "Не вдалося перевірити форму. Спробуйте ще раз.",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    [request(undefined, { method: "GET" }), 405],
    [request("{}", { contentType: "application/json" }), 415],
    [request(validForm(), { origin: "https://attacker.example" }), 403],
  ])("rejects invalid request boundaries", async (req, status) => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await onRequest(context(req));

    expect(response.status).toBe(status);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns a safe configuration error when the secret is missing", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await onRequest({ request: request(), env: {} });
    const body = await response.text();

    expect(response.status).toBe(500);
    expect(body).toContain("Сервіс тимчасово недоступний");
    expect(body).not.toContain("RESEND_API_KEY");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns a safe provider error without leaking response details or the key", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("provider-secret-detail", { status: 422 })),
    );

    const response = await onRequest(context(request()));
    const body = await response.text();

    expect(response.status).toBe(502);
    expect(body).toContain("Не вдалося надіслати повідомлення");
    expect(body).not.toMatch(/provider-secret-detail|re_private_key/);
  });
});
