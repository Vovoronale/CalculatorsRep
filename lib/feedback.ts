export type FeedbackMode = "suggestion" | "bug-report";

export const MIN_COMPLETION_MS = 3_000;
export const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;

const LIMITS = {
  name: 100,
  email: 254,
  message: 5_000,
  calculatorName: 200,
  pageUrl: 2_048,
} as const;

export type FeedbackSubmission =
  | {
      mode: "suggestion";
      name: string;
      email: string;
      message: string;
    }
  | {
      mode: "bug-report";
      name: string;
      email: string;
      message: string;
      calculatorName: string;
      pageUrl: string;
      screenshot?: File;
    };

export type FeedbackValidationResult =
  | { ok: true; value: FeedbackSubmission }
  | { ok: false; code: string };

function text(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function hasLength(value: string, max: number): boolean {
  return value.length > 0 && value.length <= max;
}

function isEmail(value: string): boolean {
  return (
    hasLength(value, LIMITS.email) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  );
}

function isHttpUrl(value: string): boolean {
  if (!hasLength(value, LIMITS.pageUrl)) return false;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function matches(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

async function isValidScreenshot(file: File): Promise<boolean> {
  if (file.size === 0 || file.size > MAX_SCREENSHOT_BYTES) return false;

  const extension = file.name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] ?? "";
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isPng = matches(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const isJpeg = matches(bytes, [0xff, 0xd8, 0xff]);
  const isWebp =
    matches(bytes, [0x52, 0x49, 0x46, 0x46]) &&
    matches(bytes, [0x57, 0x45, 0x42, 0x50], 8);

  if (file.type === "image/png") return extension === ".png" && isPng;
  if (file.type === "image/jpeg") {
    return (extension === ".jpg" || extension === ".jpeg") && isJpeg;
  }
  if (file.type === "image/webp") return extension === ".webp" && isWebp;
  return false;
}

export async function validateFeedbackForm(
  form: FormData,
  now = Date.now(),
): Promise<FeedbackValidationResult> {
  const mode = text(form, "mode");
  if (mode !== "suggestion" && mode !== "bug-report") {
    return { ok: false, code: "invalid-mode" };
  }

  if (text(form, "website")) return { ok: false, code: "honeypot" };

  const startedAt = Number(text(form, "startedAt"));
  if (!Number.isFinite(startedAt) || startedAt <= 0 || startedAt > now) {
    return { ok: false, code: "invalid-timing" };
  }
  if (now - startedAt < MIN_COMPLETION_MS) {
    return { ok: false, code: "too-fast" };
  }

  const name = text(form, "name");
  if (!hasLength(name, LIMITS.name)) return { ok: false, code: "invalid-name" };

  const email = text(form, "email").toLowerCase();
  if (!isEmail(email)) return { ok: false, code: "invalid-email" };

  const message = text(form, "message");
  if (!hasLength(message, LIMITS.message)) {
    return { ok: false, code: "invalid-message" };
  }

  const screenshotValue = form.get("screenshot");
  const screenshot = screenshotValue instanceof File ? screenshotValue : undefined;

  if (mode === "suggestion") {
    if (screenshot) return { ok: false, code: "unexpected-screenshot" };
    return { ok: true, value: { mode, name, email, message } };
  }

  const calculatorName = text(form, "calculatorName");
  if (!hasLength(calculatorName, LIMITS.calculatorName)) {
    return { ok: false, code: "invalid-calculator" };
  }

  const pageUrl = text(form, "pageUrl");
  if (!isHttpUrl(pageUrl)) return { ok: false, code: "invalid-page-url" };

  if (screenshot && !(await isValidScreenshot(screenshot))) {
    return { ok: false, code: "invalid-screenshot" };
  }

  return {
    ok: true,
    value: {
      mode,
      name,
      email,
      message,
      calculatorName,
      pageUrl,
      ...(screenshot ? { screenshot } : {}),
    },
  };
}
