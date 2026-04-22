import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CalculatorShell } from "@/components/calculator-shell";
import { getCalculatorBySlug } from "@/lib/calculators";

describe("CalculatorShell", () => {
  it("renders the redesigned homepage content on the catalog route", () => {
    render(<CalculatorShell selectedCategory="beton" />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Каталог будівельних калькуляторів для швидкого підбору інструмента.",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Іванейко Володимир")).toBeInTheDocument();
    expect(screen.getByText("Оберіть тип задачі")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Бетон" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.queryByRole("link", { name: "GitHub" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Про автора" })).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Про автора" })[0]).toHaveAttribute(
      "href",
      "/author",
    );
    expect(
      screen.getByRole("link", { name: "Калькулятор об'єму бетону" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Калькулятор стрічкового фундаменту" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Бетон" })).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Інженерні продукти та напрями" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Особистий бренд, продукти і AI-напрям у construction." }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("contentinfo"),
    ).toHaveTextContent("Окрема сторінка з професійним профілем, продуктами і напрямами роботи.");
    expect(screen.getAllByRole("link", { name: "CadEE.pro" })[0]).toHaveAttribute(
      "href",
      "https://cadee.pro",
    );
  });

  it("renders an iframe for embedded calculators", () => {
    const calculator = getCalculatorBySlug("concrete-volume");

    if (!calculator) {
      throw new Error("Expected test calculator to exist");
    }

    render(<CalculatorShell selectedCalculator={calculator} />);

    expect(
      screen.getByTitle("Калькулятор об'єму бетону"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Відкрити інструмент" })).toHaveAttribute(
      "href",
      calculator.openUrl,
    );
  });

  it("renders the external fallback panel without iframe when embed is disabled", () => {
    const calculator = getCalculatorBySlug("strip-foundation");

    if (!calculator) {
      throw new Error("Expected test calculator to exist");
    }

    render(<CalculatorShell selectedCalculator={calculator} />);

    expect(
      screen.getByText(
        "Цей інструмент відкривається на окремій сторінці, щоб зберегти повний функціонал розрахунку.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByTitle("Калькулятор стрічкового фундаменту"),
    ).not.toBeInTheDocument();
  });
});
