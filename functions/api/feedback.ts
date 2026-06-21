import { sendFeedbackEmail } from "../../lib/feedback-resend";
import { validateFeedbackForm } from "../../lib/feedback";

type FeedbackFunctionContext = {
  request: Request;
  env: { RESEND_API_KEY?: string };
};

function json(
  status: number,
  body: { ok: boolean; message?: string },
  extraHeaders?: HeadersInit,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      ...extraHeaders,
    },
  });
}

export async function onRequest({ request, env }: FeedbackFunctionContext): Promise<Response> {
  if (request.method !== "POST") {
    return json(405, { ok: false, message: "Метод не підтримується." }, { Allow: "POST" });
  }

  const contentType = request.headers.get("Content-Type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data;")) {
    return json(415, { ok: false, message: "Непідтримуваний формат форми." });
  }

  const requestOrigin = request.headers.get("Origin");
  if (requestOrigin !== new URL(request.url).origin) {
    return json(403, { ok: false, message: "Запит відхилено." });
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return json(400, { ok: false, message: "Не вдалося прочитати форму." });
  }

  const validation = await validateFeedbackForm(form);
  if (!validation.ok) {
    if (validation.code === "honeypot") return json(200, { ok: true });

    const message =
      validation.code === "invalid-screenshot"
        ? "Скріншот має бути PNG, JPEG або WebP розміром до 5 МБ."
        : "Не вдалося перевірити форму. Спробуйте ще раз.";
    return json(400, { ok: false, message });
  }

  if (!env.RESEND_API_KEY) {
    return json(500, {
      ok: false,
      message: "Сервіс тимчасово недоступний. Спробуйте пізніше.",
    });
  }

  try {
    await sendFeedbackEmail({
      apiKey: env.RESEND_API_KEY,
      submission: validation.value,
    });
  } catch {
    return json(502, {
      ok: false,
      message: "Не вдалося надіслати повідомлення. Спробуйте ще раз.",
    });
  }

  return json(200, { ok: true });
}
