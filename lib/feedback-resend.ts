import type { FeedbackSubmission } from "@/lib/feedback";

export type ResendEmailPayload = {
  from: string;
  to: string[];
  reply_to: string;
  subject: string;
  text: string;
  attachments?: Array<{ filename: string; content: string }>;
};

const FROM = "IVapps feedback <suggestions@ivapps.pro>";
const TO = "ivapps.pro@gmail.com";

function bytesToBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  let binary = "";

  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function safeFilename(filename: string): string {
  return filename.replace(/[\r\n"\\/]/g, "_");
}

export async function buildResendEmail(
  submission: FeedbackSubmission,
): Promise<ResendEmailPayload> {
  const common = {
    from: FROM,
    to: [TO],
    reply_to: submission.email,
  };

  if (submission.mode === "suggestion") {
    return {
      ...common,
      subject: "Пропозиція нового калькулятора",
      text: [
        "Тип: Пропозиція калькулятора",
        `Ім’я: ${submission.name}`,
        `Email: ${submission.email}`,
        "",
        "Опис:",
        submission.message,
      ].join("\n"),
    };
  }

  const payload: ResendEmailPayload = {
    ...common,
    subject: `Помилка в калькуляторі: ${submission.calculatorName}`,
    text: [
      "Тип: Повідомлення про помилку",
      `Ім’я: ${submission.name}`,
      `Email: ${submission.email}`,
      `Калькулятор: ${submission.calculatorName}`,
      `Сторінка: ${submission.pageUrl}`,
      "",
      "Опис:",
      submission.message,
    ].join("\n"),
  };

  if (submission.screenshot) {
    const bytes = new Uint8Array(await submission.screenshot.arrayBuffer());
    payload.attachments = [
      {
        filename: safeFilename(submission.screenshot.name),
        content: bytesToBase64(bytes),
      },
    ];
  }

  return payload;
}

export async function sendFeedbackEmail({
  apiKey,
  submission,
  fetchImpl = fetch,
}: {
  apiKey: string;
  submission: FeedbackSubmission;
  fetchImpl?: typeof fetch;
}): Promise<void> {
  const payload = await buildResendEmail(submission);
  const response = await fetchImpl("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Feedback email provider rejected the request");
  }
}
