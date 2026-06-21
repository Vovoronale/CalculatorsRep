// @vitest-environment node

import { describe, expect, it } from "vitest";

import {
  MAX_SCREENSHOT_BYTES,
  MIN_COMPLETION_MS,
  validateFeedbackForm,
} from "@/lib/feedback";

const NOW = 1_750_000_010_000;

function suggestionForm(overrides: Record<string, string | File> = {}) {
  const form = new FormData();
  const values: Record<string, string | File> = {
    mode: "suggestion",
    name: " Іван ",
    email: "ivan@example.com",
    message: " Калькулятор прогину балки ",
    website: "",
    startedAt: String(NOW - MIN_COMPLETION_MS - 1_000),
    ...overrides,
  };

  Object.entries(values).forEach(([key, value]) => form.set(key, value));
  return form;
}

function imageFile(kind: "png" | "jpeg" | "webp", name?: string) {
  if (kind === "png") {
    return new File(
      [new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])],
      name ?? "screen.png",
      { type: "image/png" },
    );
  }
  if (kind === "jpeg") {
    return new File(
      [new Uint8Array([0xff, 0xd8, 0xff, 0xe0])],
      name ?? "screen.jpg",
      { type: "image/jpeg" },
    );
  }
  return new File(
    [new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50])],
    name ?? "screen.webp",
    { type: "image/webp" },
  );
}

describe("validateFeedbackForm", () => {
  it("normalizes a valid calculator suggestion", async () => {
    await expect(validateFeedbackForm(suggestionForm(), NOW)).resolves.toEqual({
      ok: true,
      value: {
        mode: "suggestion",
        name: "Іван",
        email: "ivan@example.com",
        message: "Калькулятор прогину балки",
      },
    });
  });

  it("rejects the honeypot without accepting the submission", async () => {
    await expect(
      validateFeedbackForm(suggestionForm({ website: "spam.example" }), NOW),
    ).resolves.toEqual({ ok: false, code: "honeypot" });
  });

  it("rejects submissions completed too quickly", async () => {
    await expect(
      validateFeedbackForm(
        suggestionForm({ startedAt: String(NOW - MIN_COMPLETION_MS + 1) }),
        NOW,
      ),
    ).resolves.toEqual({ ok: false, code: "too-fast" });
  });

  it.each([
    ["mode", "unknown", "invalid-mode"],
    ["name", "", "invalid-name"],
    ["name", "n".repeat(101), "invalid-name"],
    ["email", "not-an-email", "invalid-email"],
    ["email", `${"a".repeat(250)}@x.io`, "invalid-email"],
    ["message", "", "invalid-message"],
    ["message", "m".repeat(5_001), "invalid-message"],
    ["startedAt", "later", "invalid-timing"],
  ])("rejects invalid %s values", async (field, value, code) => {
    await expect(
      validateFeedbackForm(suggestionForm({ [field]: value }), NOW),
    ).resolves.toEqual({ ok: false, code });
  });

  it.each(["png", "jpeg", "webp"] as const)(
    "accepts a matching %s bug-report screenshot",
    async (kind) => {
      const form = suggestionForm({
        mode: "bug-report",
        message: "Після натискання результат не оновлюється",
        calculatorName: "Опір ґрунту",
        pageUrl: "https://ivapps.pro/calculator/soil-design-resistance",
        screenshot: imageFile(kind),
      });

      const result = await validateFeedbackForm(form, NOW);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toMatchObject({
          mode: "bug-report",
          calculatorName: "Опір ґрунту",
          pageUrl: "https://ivapps.pro/calculator/soil-design-resistance",
        });
        expect(result.value.mode === "bug-report" && result.value.screenshot).toBeInstanceOf(
          File,
        );
      }
    },
  );

  it("accepts a bug report without a screenshot", async () => {
    const result = await validateFeedbackForm(
      suggestionForm({
        mode: "bug-report",
        calculatorName: "Опір ґрунту",
        pageUrl: "http://localhost:3000/calculator/soil-design-resistance",
      }),
      NOW,
    );

    expect(result).toMatchObject({ ok: true, value: { mode: "bug-report" } });
  });

  it.each([
    [{ calculatorName: "" }, "invalid-calculator"],
    [{ calculatorName: "c".repeat(201) }, "invalid-calculator"],
    [{ pageUrl: "javascript:alert(1)" }, "invalid-page-url"],
    [{ pageUrl: "https://ivapps.pro/" + "x".repeat(2_100) }, "invalid-page-url"],
  ])("rejects invalid bug-report context", async (override, code) => {
    await expect(
      validateFeedbackForm(
        suggestionForm({
          mode: "bug-report",
          calculatorName: "Опір ґрунту",
          pageUrl: "https://ivapps.pro/calculator/soil-design-resistance",
          ...override,
        }),
        NOW,
      ),
    ).resolves.toEqual({ ok: false, code });
  });

  it("rejects a screenshot on a calculator suggestion", async () => {
    await expect(
      validateFeedbackForm(suggestionForm({ screenshot: imageFile("png") }), NOW),
    ).resolves.toEqual({ ok: false, code: "unexpected-screenshot" });
  });

  it("rejects a screenshot over 5 MB", async () => {
    const screenshot = new File(
      [new Uint8Array(MAX_SCREENSHOT_BYTES + 1)],
      "screen.png",
      { type: "image/png" },
    );

    await expect(
      validateFeedbackForm(
        suggestionForm({
          mode: "bug-report",
          calculatorName: "Опір ґрунту",
          pageUrl: "https://ivapps.pro/calculator/soil-design-resistance",
          screenshot,
        }),
        NOW,
      ),
    ).resolves.toEqual({ ok: false, code: "invalid-screenshot" });
  });

  it.each([
    [imageFile("png", "screen.jpg")],
    [new File([new Uint8Array([1, 2, 3])], "screen.png", { type: "image/png" })],
    [new File([new Uint8Array([0xff, 0xd8, 0xff])], "screen.jpg", { type: "image/png" })],
  ])("rejects mismatched screenshot metadata and signatures", async (screenshot) => {
    await expect(
      validateFeedbackForm(
        suggestionForm({
          mode: "bug-report",
          calculatorName: "Опір ґрунту",
          pageUrl: "https://ivapps.pro/calculator/soil-design-resistance",
          screenshot,
        }),
        NOW,
      ),
    ).resolves.toEqual({ ok: false, code: "invalid-screenshot" });
  });
});
