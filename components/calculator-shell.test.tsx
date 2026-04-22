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
    render(<CalculatorShell selectedCategory="beton" />);

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
    expect(screen.getByRole("button", { name: "Бетон" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(within(rail).getByRole("link", { name: "Калькулятор об'єму бетону" })).toBeInTheDocument();
    expect(
      within(rail).getByRole("link", { name: "Калькулятор стрічкового фундаменту" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "GitHub" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Про автора" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Про автора" })[0]).toHaveAttribute(
      "href",
      "/author",
    );
    expect(within(workspace).getByRole("heading", { level: 2, name: "Бетон" })).toBeInTheDocument();
    expect(
      within(workspace).getByRole("link", { name: "Калькулятор об'єму бетону" }),
    ).toBeInTheDocument();
    expect(within(workspace).getByText("Вбудований розрахунок")).toBeInTheDocument();
    expect(
      within(workspace).getByRole("link", { name: "Про автора" }),
    ).toHaveAttribute("href", "/author");
    expect(
      screen.queryByRole("heading", { name: "Інженерні продукти та напрями" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Особистий бренд, продукти і AI-напрям у construction." }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("contentinfo"),
    ).toHaveTextContent(
      "Платформа виросла з практики проектування, нормативної роботи та прикладних цифрових сервісів.",
    );
    expect(screen.getAllByRole("link", { name: "CadEE.pro" })[0]).toHaveAttribute(
      "href",
      "https://cadee.pro",
    );
  });

  it("keeps the left rail visible and renders an iframe for embedded calculators", () => {
    const calculator = getCalculatorBySlug("concrete-volume");

    if (!calculator) {
      throw new Error("Expected test calculator to exist");
    }

    render(<CalculatorShell selectedCalculator={calculator} />);

    const rail = screen.getByRole("complementary", { name: "Каталог калькуляторів" });

    expect(within(rail).getByRole("link", { name: "Калькулятор об'єму бетону" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("heading", { level: 2, name: "Калькулятор об'єму бетону" })).toBeInTheDocument();
    expect(screen.getByText("Вбудований розрахунок")).toBeInTheDocument();
    expect(
      screen.getByTitle("Калькулятор об'єму бетону"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Відкрити окремо" })).toHaveAttribute(
      "href",
      calculator.openUrl,
    );
  });

  it("keeps the left rail visible and renders the external fallback when embed is disabled", () => {
    const calculator = getCalculatorBySlug("strip-foundation");

    if (!calculator) {
      throw new Error("Expected test calculator to exist");
    }

    render(<CalculatorShell selectedCalculator={calculator} />);

    const rail = screen.getByRole("complementary", { name: "Каталог калькуляторів" });

    expect(
      within(rail).getByRole("link", { name: "Калькулятор стрічкового фундаменту" }),
    ).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("Окремий інструмент")).toBeInTheDocument();
    expect(screen.getByText("Розрахунок відкривається в окремому вікні.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Перейти до інструмента" })).toHaveAttribute(
      "href",
      calculator.openUrl,
    );
    expect(
      screen.queryByTitle("Калькулятор стрічкового фундаменту"),
    ).not.toBeInTheDocument();
  });
});
