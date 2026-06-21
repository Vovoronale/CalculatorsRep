import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { IVappsTopbar } from "@/components/ivapps-topbar";

describe("IVappsTopbar feedback", () => {
  afterEach(() => {
    cleanup();
    document.body.style.overflow = "";
  });

  it("opens suggestion mode from a button and restores focus on close", async () => {
    render(<IVappsTopbar />);

    expect(
      screen.queryByRole("link", { name: "Запропонувати калькулятор" }),
    ).not.toBeInTheDocument();
    const trigger = screen.getByRole("button", { name: "Запропонувати калькулятор" });

    await userEvent.click(trigger);

    expect(screen.getByRole("dialog", { name: "Запропонувати калькулятор" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Повідомити про помилку" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Закрити форму" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
