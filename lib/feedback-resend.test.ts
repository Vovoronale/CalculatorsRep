// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { buildResendEmail, sendFeedbackEmail } from "@/lib/feedback-resend";
import type { FeedbackSubmission } from "@/lib/feedback";

const suggestion: FeedbackSubmission = {
  mode: "suggestion",
  name: "Іван",
  email: "ivan@example.com",
  message: "Калькулятор прогину балки",
};

describe("buildResendEmail", () => {
  it("builds the exact calculator suggestion envelope", async () => {
    await expect(buildResendEmail(suggestion)).resolves.toEqual({
      from: "IVapps feedback <suggestions@ivapps.pro>",
      to: ["ivapps.pro@gmail.com"],
      reply_to: "ivan@example.com",
      subject: "Пропозиція нового калькулятора",
      text: [
        "Тип: Пропозиція калькулятора",
        "Ім’я: Іван",
        "Email: ivan@example.com",
        "",
        "Опис:",
        "Калькулятор прогину балки",
      ].join("\n"),
    });
  });

  it("includes calculator context and a base64 screenshot for a bug report", async () => {
    const screenshot = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], "screen.png", {
      type: "image/png",
    });
    const bugReport: FeedbackSubmission = {
      mode: "bug-report",
      name: "Олена",
      email: "olena@example.com",
      message: "Результат не оновлюється",
      calculatorName: "Опір ґрунту",
      pageUrl: "https://ivapps.pro/calculator/soil-design-resistance",
      screenshot,
    };

    const payload = await buildResendEmail(bugReport);

    expect(payload).toMatchObject({
      from: "IVapps feedback <suggestions@ivapps.pro>",
      to: ["ivapps.pro@gmail.com"],
      reply_to: "olena@example.com",
      subject: "Помилка в калькуляторі: Опір ґрунту",
      attachments: [
        {
          filename: "screen.png",
          content: Buffer.from([0x89, 0x50, 0x4e, 0x47]).toString("base64"),
        },
      ],
    });
    expect(payload.text).toContain("Калькулятор: Опір ґрунту");
    expect(payload.text).toContain(
      "Сторінка: https://ivapps.pro/calculator/soil-design-resistance",
    );
    expect(payload.text).toContain("Результат не оновлюється");
  });
});

describe("sendFeedbackEmail", () => {
  it("posts the built message to Resend with server authorization", async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ id: "email_1" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }));

    await sendFeedbackEmail({
      apiKey: "re_private_key",
      submission: suggestion,
      fetchImpl: fetchImpl as typeof fetch,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init).toMatchObject({
      method: "POST",
      headers: {
        Authorization: "Bearer re_private_key",
        "Content-Type": "application/json",
      },
    });
    expect(JSON.parse(String(init?.body))).toMatchObject({
      subject: "Пропозиція нового калькулятора",
      reply_to: "ivan@example.com",
    });
  });

  it("throws a generic error without exposing provider details or the key", async () => {
    const fetchImpl = vi.fn(async () => new Response("provider-secret-detail", {
      status: 422,
    }));

    const promise = sendFeedbackEmail({
      apiKey: "re_private_key",
      submission: suggestion,
      fetchImpl: fetchImpl as typeof fetch,
    });

    await expect(promise).rejects.toThrow("Feedback email provider rejected the request");
    await expect(promise).rejects.not.toThrow(/provider-secret-detail|re_private_key/);
  });
});
