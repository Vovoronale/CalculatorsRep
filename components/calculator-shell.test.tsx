import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CalculatorShell } from "@/components/calculator-shell";
import { getCalculatorBySlug } from "@/lib/calculators";

describe("CalculatorShell", () => {
  it("renders the redesigned homepage content on the catalog route", () => {
    render(<CalculatorShell selectedCategory="beton" />);

    expect(screen.getByRole("heading", { name: "Бетон" })).toBeInTheDocument();
    expect(screen.getByText("Іванейко Володимир")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "GitHub" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Про автора" })).toHaveAttribute(
      "href",
      "/author",
    );
    expect(
      screen.getByRole("link", { name: "Калькулятор об'єму бетону" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Калькулятор стрічкового фундаменту" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Інженерні продукти та напрями" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Електротехнічні розрахунки" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Розрахунок електричних навантажень будівель" }),
    ).toHaveAttribute("href", "https://pc.dbnassistant.com");
    expect(screen.getByRole("link", { name: "NormControl" })).toHaveAttribute(
      "href",
      "https://nc.dbnassistant.com",
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
