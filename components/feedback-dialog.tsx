"use client";

import { ImagePlus, X } from "lucide-react";
import {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type ClipboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

import { MAX_SCREENSHOT_BYTES, type FeedbackMode } from "@/lib/feedback";

type FeedbackDialogProps = {
  open: boolean;
  mode: FeedbackMode;
  onClose: () => void;
  calculatorContext?: { calculatorName: string; pageUrl: string };
};

type SubmitState = "idle" | "submitting" | "success" | "error";

const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const ALLOWED_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function fileError(file: File): string | null {
  const lowerName = file.name.toLowerCase();
  const hasAllowedExtension = ALLOWED_EXTENSIONS.some((extension) =>
    lowerName.endsWith(extension),
  );
  if (!ALLOWED_IMAGE_TYPES.has(file.type) || !hasAllowedExtension) {
    return "Оберіть скріншот у форматі PNG, JPEG або WebP.";
  }
  if (file.size === 0 || file.size > MAX_SCREENSHOT_BYTES) {
    return "Розмір скріншота має бути до 5 МБ.";
  }
  return null;
}

export function FeedbackDialog({
  open,
  mode,
  onClose,
  calculatorContext,
}: FeedbackDialogProps) {
  const nameRef = useRef<HTMLInputElement>(null);
  const previousActive = useRef<HTMLElement | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [startedAt, setStartedAt] = useState(0);
  const [screenshot, setScreenshotState] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const releasePreview = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  };

  const setScreenshot = (file: File | null) => {
    releasePreview();
    setScreenshotState(file);
    if (file) {
      const url = URL.createObjectURL(file);
      previewUrlRef.current = url;
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  useEffect(() => {
    return () => releasePreview();
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    previousActive.current = document.activeElement as HTMLElement | null;
    setName("");
    setEmail("");
    setMessage("");
    setStartedAt(Date.now());
    setScreenshot(null);
    setAttachmentError(null);
    setSubmitState("idle");
    setSubmitError(null);

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    nameRef.current?.focus();

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
      previousActive.current?.focus?.();
    };
  }, [open, mode, onClose]);

  if (!open) return null;

  const isBugReport = mode === "bug-report";
  const title = isBugReport ? "Повідомити про помилку" : "Запропонувати калькулятор";

  const acceptScreenshot = (file: File | undefined) => {
    if (!file) return;
    const error = fileError(file);
    if (error) {
      setAttachmentError(error);
      return;
    }
    setAttachmentError(null);
    setScreenshot(file);
  };

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    acceptScreenshot(event.target.files?.[0]);
    event.target.value = "";
  };

  const onPaste = (event: ClipboardEvent<HTMLElement>) => {
    const file = Array.from(event.clipboardData.files).find((item) =>
      item.type.startsWith("image/"),
    );
    if (file) {
      event.preventDefault();
      acceptScreenshot(file);
    }
  };

  const onZoneKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      document.getElementById("feedback-screenshot")?.click();
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitState === "submitting") return;

    setSubmitState("submitting");
    setSubmitError(null);

    const form = new FormData();
    form.set("mode", mode);
    form.set("name", name);
    form.set("email", email);
    form.set("message", message);
    form.set("website", "");
    form.set("startedAt", String(startedAt));
    if (isBugReport) {
      form.set("calculatorName", calculatorContext?.calculatorName ?? "");
      form.set("pageUrl", calculatorContext?.pageUrl ?? "");
      if (screenshot) form.set("screenshot", screenshot);
    }

    try {
      const response = await fetch("/api/feedback", { method: "POST", body: form });
      const result = (await response.json().catch(() => null)) as
        | { ok?: boolean; message?: string }
        | null;
      if (!response.ok || !result?.ok) {
        throw new Error(result?.message || "Не вдалося надіслати повідомлення. Спробуйте ще раз.");
      }
      setSubmitState("success");
    } catch (error) {
      setSubmitState("error");
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Не вдалося надіслати повідомлення. Спробуйте ще раз.",
      );
    }
  };

  return (
    <div
      className="feedback-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="feedback-dialog-title"
      onClick={onClose}
    >
      <section className="feedback-dialog" onClick={(event) => event.stopPropagation()}>
        <header className="feedback-dialog__header">
          <div>
            <p className="feedback-dialog__eyebrow">IVapps.pro</p>
            <h2 id="feedback-dialog-title">{title}</h2>
          </div>
          <button
            type="button"
            className="feedback-dialog__close"
            aria-label="Закрити форму"
            onClick={onClose}
          >
            <X size={18} aria-hidden />
          </button>
        </header>

        {submitState === "success" ? (
          <div className="feedback-dialog__success" aria-live="polite">
            <p>
              {isBugReport
                ? "Дякуємо! Повідомлення про помилку надіслано."
                : "Дякуємо! Пропозицію надіслано."}
            </p>
            <button type="button" className="cta-button" onClick={onClose}>
              Закрити
            </button>
          </div>
        ) : (
          <form className="feedback-form" onSubmit={onSubmit}>
            <label className="feedback-form__field">
              <span>Ім’я</span>
              <input
                ref={nameRef}
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={100}
                required
                autoComplete="name"
              />
            </label>

            <label className="feedback-form__field">
              <span>Email для відповіді</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                maxLength={254}
                required
                autoComplete="email"
              />
            </label>

            <label className="feedback-form__field">
              <span>{isBugReport ? "Опишіть, що сталося" : "Опишіть калькулятор"}</span>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                maxLength={5_000}
                rows={6}
                required
              />
            </label>

            <label className="feedback-form__honeypot" aria-hidden="true">
              Website
              <input name="website" type="text" tabIndex={-1} autoComplete="off" />
            </label>

            {isBugReport ? (
              <div
                className="feedback-screenshot"
                data-testid="feedback-screenshot-zone"
                tabIndex={0}
                onPaste={onPaste}
                onKeyDown={onZoneKeyDown}
              >
                <div className="feedback-screenshot__prompt">
                  <ImagePlus size={20} aria-hidden />
                  <div>
                    <strong>Додати скріншот</strong>
                    <p>Вставте через Ctrl+V або виберіть PNG, JPEG чи WebP до 5 МБ.</p>
                  </div>
                  <label className="feedback-screenshot__select">
                    Вибрати файл
                    <input
                      id="feedback-screenshot"
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp"
                      aria-label="Вибрати скріншот"
                      onChange={onFileChange}
                    />
                  </label>
                </div>

                {screenshot && previewUrl ? (
                  <div className="feedback-screenshot__preview">
                    <img src={previewUrl} alt={`Попередній перегляд ${screenshot.name}`} />
                    <div>
                      <strong>{screenshot.name}</strong>
                      <span>{formatBytes(screenshot.size)}</span>
                    </div>
                    <button
                      type="button"
                      aria-label="Видалити скріншот"
                      onClick={() => {
                        setAttachmentError(null);
                        setScreenshot(null);
                      }}
                    >
                      <X size={16} aria-hidden />
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}

            {attachmentError ? <p role="alert">{attachmentError}</p> : null}
            {submitState === "error" && submitError ? <p role="alert">{submitError}</p> : null}

            <div className="feedback-form__actions">
              <button type="button" className="cta-button cta-button--ghost" onClick={onClose}>
                Скасувати
              </button>
              <button type="submit" className="cta-button" disabled={submitState === "submitting"}>
                {submitState === "submitting"
                  ? "Надсилання…"
                  : isBugReport
                    ? "Надіслати повідомлення"
                    : "Надіслати пропозицію"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
