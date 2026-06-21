import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { FeedbackDialog } from "@/components/feedback-dialog";
import { MAX_SCREENSHOT_BYTES } from "@/lib/feedback";

describe("FeedbackDialog", () => {
  beforeEach(() => {
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      value: vi.fn(() => "blob:preview"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    document.body.style.overflow = "";
  });

  it("renders suggestion mode accessibly and restores focus after Escape", async () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <>
        <button type="button">Відкрити форму</button>
        <FeedbackDialog open={false} mode="suggestion" onClose={onClose} />
      </>,
    );
    const trigger = screen.getByRole("button", { name: "Відкрити форму" });
    trigger.focus();

    rerender(
      <>
        <button type="button">Відкрити форму</button>
        <FeedbackDialog open mode="suggestion" onClose={onClose} />
      </>,
    );

    expect(screen.getByRole("dialog", { name: "Запропонувати калькулятор" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Ім’я" })).toHaveFocus();
    expect(screen.getByRole("textbox", { name: "Email для відповіді" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Опишіть калькулятор" })).toBeInTheDocument();
    expect(screen.queryByText("Додати скріншот")).not.toBeInTheDocument();
    expect(screen.queryByText("Повідомити про помилку")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");

    await userEvent.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
    rerender(
      <>
        <button type="button">Відкрити форму</button>
        <FeedbackDialog open={false} mode="suggestion" onClose={onClose} />
      </>,
    );
    expect(trigger).toHaveFocus();
  });

  it("closes from the close control and backdrop", async () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <FeedbackDialog open mode="suggestion" onClose={onClose} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Закрити форму" }));
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(<FeedbackDialog open mode="suggestion" onClose={onClose} />);
    fireEvent.click(screen.getByRole("dialog", { name: "Запропонувати калькулятор" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("selects, previews, and removes one bug-report screenshot", async () => {
    render(
      <FeedbackDialog
        open
        mode="bug-report"
        onClose={() => undefined}
        calculatorContext={{
          calculatorName: "Опір ґрунту",
          pageUrl: "https://ivapps.pro/calculator/soil-design-resistance",
        }}
      />,
    );
    const file = new File([new Uint8Array([1, 2, 3])], "screen.png", {
      type: "image/png",
    });

    expect(screen.getByRole("dialog", { name: "Повідомити про помилку" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Опишіть, що сталося" })).toBeInTheDocument();
    const input = screen.getByLabelText("Вибрати скріншот");
    expect(input).toHaveAttribute("accept", ".png,.jpg,.jpeg,.webp");

    await userEvent.upload(input, file);

    expect(screen.getByRole("img", { name: "Попередній перегляд screen.png" })).toHaveAttribute(
      "src",
      "blob:preview",
    );
    expect(screen.getByText("screen.png")).toBeInTheDocument();
    expect(screen.getByText("3 Б")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Видалити скріншот" }));

    expect(screen.queryByText("screen.png")).not.toBeInTheDocument();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview");
  });

  it("accepts an image pasted from the clipboard", () => {
    render(
      <FeedbackDialog
        open
        mode="bug-report"
        onClose={() => undefined}
        calculatorContext={{ calculatorName: "Опір ґрунту", pageUrl: "https://ivapps.pro/x" }}
      />,
    );
    const file = new File([new Uint8Array([1])], "pasted.png", { type: "image/png" });

    fireEvent.paste(screen.getByRole("textbox", { name: "Опишіть, що сталося" }), {
      clipboardData: { files: [file] },
    });

    expect(screen.getByText("pasted.png")).toBeInTheDocument();
  });

  it("rejects unsupported and oversized screenshots without replacing a valid file", async () => {
    render(
      <FeedbackDialog
        open
        mode="bug-report"
        onClose={() => undefined}
        calculatorContext={{ calculatorName: "Опір ґрунту", pageUrl: "https://ivapps.pro/x" }}
      />,
    );
    const input = screen.getByLabelText("Вибрати скріншот");
    const valid = new File([new Uint8Array([1])], "valid.png", { type: "image/png" });
    await userEvent.upload(input, valid);

    fireEvent.change(input, {
      target: {
        files: [new File([new Uint8Array([1])], "notes.txt", { type: "text/plain" })],
      },
    });
    expect(screen.getByRole("alert")).toHaveTextContent("PNG, JPEG або WebP");
    expect(screen.getByText("valid.png")).toBeInTheDocument();

    fireEvent.change(input, {
      target: {
        files: [
          new File([new Uint8Array(MAX_SCREENSHOT_BYTES + 1)], "large.png", {
            type: "image/png",
          }),
        ],
      },
    });
    expect(screen.getByRole("alert")).toHaveTextContent("до 5 МБ");
    expect(screen.getByText("valid.png")).toBeInTheDocument();
  });

  it("submits suggestion multipart data and shows confirmation", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<FeedbackDialog open mode="suggestion" onClose={() => undefined} />);

    await userEvent.type(screen.getByRole("textbox", { name: "Ім’я" }), "Іван");
    await userEvent.type(
      screen.getByRole("textbox", { name: "Email для відповіді" }),
      "ivan@example.com",
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: "Опишіть калькулятор" }),
      "Калькулятор прогину балки",
    );
    const honeypot = document.querySelector<HTMLInputElement>('input[name="website"]');
    expect(honeypot).not.toBeNull();
    fireEvent.change(honeypot as HTMLInputElement, { target: { value: "bot-value" } });
    await userEvent.click(screen.getByRole("button", { name: "Надіслати пропозицію" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("/api/feedback");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toBeUndefined();
    expect(init?.body).toBeInstanceOf(FormData);
    const body = init?.body as FormData;
    expect(body.get("mode")).toBe("suggestion");
    expect(body.get("name")).toBe("Іван");
    expect(body.get("website")).toBe("bot-value");
    expect(Number(body.get("startedAt"))).toBeGreaterThan(0);
    expect(await screen.findByText("Дякуємо! Пропозицію надіслано.")).toBeInTheDocument();
  });

  it("preserves bug-report text and screenshot after a provider failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        new Response(JSON.stringify({ ok: false, message: "Не вдалося надіслати повідомлення." }), {
          status: 502,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    render(
      <FeedbackDialog
        open
        mode="bug-report"
        onClose={() => undefined}
        calculatorContext={{ calculatorName: "Опір ґрунту", pageUrl: "https://ivapps.pro/x" }}
      />,
    );
    await userEvent.type(screen.getByRole("textbox", { name: "Ім’я" }), "Олена");
    await userEvent.type(
      screen.getByRole("textbox", { name: "Email для відповіді" }),
      "olena@example.com",
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: "Опишіть, що сталося" }),
      "Результат не оновлюється",
    );
    await userEvent.upload(
      screen.getByLabelText("Вибрати скріншот"),
      new File([new Uint8Array([1])], "screen.png", { type: "image/png" }),
    );

    await userEvent.click(screen.getByRole("button", { name: "Надіслати повідомлення" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Не вдалося надіслати повідомлення.",
    );
    expect(screen.getByRole("textbox", { name: "Опишіть, що сталося" })).toHaveValue(
      "Результат не оновлюється",
    );
    expect(screen.getByText("screen.png")).toBeInTheDocument();
  });
});
