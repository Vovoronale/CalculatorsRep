import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CalculatorShell } from "@/components/calculator-shell";
import { getCalculatorBySlug } from "@/lib/calculators";

describe("CalculatorShell", () => {
  it("renders the selected category workspace on the catalog route", () => {
    render(<CalculatorShell selectedCategory="beton" />);

    expect(screen.getByRole("heading", { name: "Бетон" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "CadEE.pro" })).toHaveLength(2);
    expect(
      screen.getByRole("link", { name: "Калькулятор об'єму бетону" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Калькулятор стрічкового фундаменту" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Інші проєкти" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "NormControl" })).toHaveAttribute(
      "href",
      "https://nc.dbnassistant.com",
    );
    expect(screen.getByRole("link", { name: "OptCAD" })).toHaveAttribute(
      "href",
      "https://dbnassistant.com/author/",
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
    expect(screen.getByRole("link", { name: "Відкрити окремо" })).toHaveAttribute(
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
      screen.getByText("Цей калькулятор відкривається в окремій вкладці."),
    ).toBeInTheDocument();
    expect(
      screen.queryByTitle("Калькулятор стрічкового фундаменту"),
    ).not.toBeInTheDocument();
  });
});
