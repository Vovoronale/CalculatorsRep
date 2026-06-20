import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CalculatorShell } from "@/components/calculator-shell";
import { getCalculatorBySlug } from "@/lib/calculators";

describe("calculator support strip", () => {
  afterEach(() => {
    cleanup();
  });

  it.each([
    ["native", "rebar-area-bars"],
    ["embedded", "cadee-external"],
    ["external", "armcon"],
  ])("renders after the %s calculator interaction", (_mode, slug) => {
    const calculator = getCalculatorBySlug(slug);

    if (!calculator) {
      throw new Error(`Expected ${slug} calculator to exist`);
    }

    render(<CalculatorShell selectedCalculator={calculator} />);

    const supportLink = screen.getByRole("link", {
      name: "Подобається IVApps.pro? Підтримайте розвиток сервісу →",
    });

    expect(supportLink).toHaveAttribute("href", "/support");
    expect(supportLink).not.toHaveAttribute("target");

    const interaction =
      calculator.displayMode === "native"
        ? screen.getByLabelText("Калькулятор підбору арматури")
        : calculator.displayMode === "embed"
          ? screen.getByTitle(calculator.title)
          : screen.getByRole("link", { name: "Перейти до інструмента" });

    expect(
      interaction.compareDocumentPosition(supportLink) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
