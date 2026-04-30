import React from "react";
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CalculatorShell } from "@/components/calculator-shell";
import { getCalculatorBySlug } from "@/lib/calculators";

describe("CalculatorShell", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the engineering shell with a left catalog rail on the homepage", () => {
    render(<CalculatorShell />);

    const rail = screen.getByRole("complementary", { name: "Каталог калькуляторів" });
    const workspace = screen.getByRole("main");

    expect(rail).toBeInTheDocument();
    expect(workspace).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Інженерні розрахунки для проектування",
      }),
    ).toBeInTheDocument();
    expect(within(rail).getByText("Іванейко Володимир")).toBeInTheDocument();
    expect(within(rail).getByText("Напрями розрахунків")).toBeInTheDocument();
    expect(within(rail).getByRole("button", { name: "Теплотехніка" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
    expect(
      within(rail).queryByRole("link", { name: "Огороджувальна конструкція" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "GitHub" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Про автора" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Про автора" })[0]).toHaveAttribute(
      "href",
      "/author",
    );
    expect(
      within(workspace).getAllByRole("link", { name: "Огороджувальна конструкція" }).length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      within(workspace).getAllByText("Вбудований розрахунок").length,
    ).toBeGreaterThanOrEqual(1);
    expect(
      within(workspace).getByRole("link", { name: "Про автора" }),
    ).toHaveAttribute("href", "/author");
    expect(
      screen.queryByRole("heading", { name: "Інженерні продукти та напрями" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toHaveTextContent(
      "Платформа виросла з практики проектування, нормативної роботи та прикладних цифрових сервісів.",
    );
  });

  it("keeps the left rail visible and renders an iframe for embedded calculators", () => {
    const calculator = getCalculatorBySlug("cadee-external");

    if (!calculator) {
      throw new Error("Expected test calculator to exist");
    }

    render(<CalculatorShell selectedCalculator={calculator} />);

    const rail = screen.getByRole("complementary", { name: "Каталог калькуляторів" });

    expect(
      within(rail).getByRole("link", { name: "Огороджувальна конструкція" }),
    ).toHaveAttribute("aria-current", "page");
    expect(
      screen.getByRole("heading", { level: 2, name: "Огороджувальна конструкція" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Вбудований розрахунок").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByTitle("Огороджувальна конструкція")).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /Відкрити окремо/ })[0],
    ).toHaveAttribute("href", calculator.openUrl);
  });
});
