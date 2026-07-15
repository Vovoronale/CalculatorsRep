import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";

import type { CalculatorInputField } from "@/lib/calculator-input-schema";
import { getMinimumReinforcementReport } from "@/lib/minimum-reinforcement";

import {
  MINIMUM_REINFORCEMENT_INPUT_SCHEMA,
  MinimumReinforcementCalculator,
  buildMinimumReinforcementDocxReport,
} from "./minimum-reinforcement-calculator";

afterEach(cleanup);

function findSchemaField(id: string): CalculatorInputField {
  for (const group of MINIMUM_REINFORCEMENT_INPUT_SCHEMA.groups) {
    const field = group.fields.find((item) => item.id === id);
    if (field) return field;
  }
  throw new Error(`Missing schema field ${id}`);
}

describe("MINIMUM_REINFORCEMENT_INPUT_SCHEMA", () => {
  it("defines complete inspector metadata with millimeter base values", () => {
    expect(findSchemaField("sectionHeightMm")).toMatchObject({
      kind: "number",
      baseUnit: "mm",
      defaultDisplayUnit: "mm",
      displayUnits: [
        { value: "mm", label: "мм", factorToBase: 1 },
        { value: "cm", label: "см", factorToBase: 10 },
        { value: "m", label: "м", factorToBase: 1000 },
      ],
      prefix: { text: "h", ariaLabel: "h" },
    });
    expect(findSchemaField("tensileZoneWidthMm")).toMatchObject({
      kind: "number",
      baseUnit: "mm",
      defaultDisplayUnit: "mm",
      prefix: { text: "b", subscript: "t", ariaLabel: "bt" },
    });
    expect(findSchemaField("reinforcementCentroidDistanceMm")).toMatchObject({
      kind: "number",
      baseUnit: "mm",
      defaultDisplayUnit: "mm",
      prefix: { text: "a", subscript: "s", ariaLabel: "a_s" },
    });
    expect(findSchemaField("rebarDiameterMm")).toMatchObject({
      kind: "number",
      baseUnit: "mm",
      defaultDisplayUnit: "mm",
      prefix: { text: "Ø", subscript: "s", ariaLabel: "Øs" },
    });
  });
});

describe("MinimumReinforcementCalculator", () => {
  it("renders with shared native report layout and DOCX", () => {
    render(createElement(MinimumReinforcementCalculator));

    expect(screen.getByLabelText("Калькулятор мінімальної площі армування")).toHaveClass(
      "native-calculator",
    );
    expect(screen.getByRole("textbox", { name: "Висота перерізу" })).toHaveValue("500");
    expect(screen.getByRole("heading", { name: "Позначення величин" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Покроковий звіт" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Завантажити DOCX" })).toBeInTheDocument();
    expect(screen.getByLabelText(/As,min = max/)).toHaveAttribute("title");
  });

  it("rejects malformed numeric text without keeping calculated output", () => {
    render(createElement(MinimumReinforcementCalculator));

    const input = screen.getByRole("textbox", { name: "Висота перерізу" });
    fireEvent.change(input, {
      target: { value: "10abc" },
    });

    expect(input.closest(".input-schema-field")).toHaveAttribute("data-invalid", "true");
    expect(
      screen.getByRole("button", { name: "Показати помилку поля Висота перерізу" }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/As,min = max/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Завантажити DOCX" })).not.toBeInTheDocument();
  });
});

describe("minimum reinforcement DOCX export", () => {
  it("maps the report to DOCX with a diagram figure", () => {
    const report = getMinimumReinforcementReport({
      structureType: "beam",
      concreteClass: "C30/37",
      rebarClass: "A500C",
      sectionHeightMm: 500,
      tensileZoneWidthMm: 1000,
      reinforcementCentroidDistanceMm: 50,
      rebarDiameterMm: 16,
    });

    const docxReport = buildMinimumReinforcementDocxReport(
      report,
      new Date("2026-06-14"),
    );

    expect(docxReport.fileBaseName).toBe("minimalne-armuvannia-2026-06-14");
    expect(docxReport.steps.map((step) => step.key)).toEqual(
      report.steps.map((step) => step.key),
    );
    expect(docxReport.steps.find((step) => step.key === "as-min")?.formula).toBe(
      report.steps.find((step) => step.key === "as-min")?.formula,
    );
    expect(docxReport.figures?.[0]?.svg).toContain("<svg");
  });
});
