import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";

import type { CalculatorInputField } from "@/lib/calculator-input-schema";
import { getFoundationBasePressureReport } from "@/lib/foundation-base-pressure";

import {
  FOUNDATION_BASE_PRESSURE_INPUT_SCHEMA,
  FoundationBasePressureCalculator,
  buildFoundationBasePressureDocxReport,
} from "./foundation-base-pressure-calculator";

afterEach(cleanup);

function findSchemaField(id: string): CalculatorInputField {
  for (const group of FOUNDATION_BASE_PRESSURE_INPUT_SCHEMA.groups) {
    const field = group.fields.find((item) => item.id === id);
    if (field) return field;
  }
  throw new Error(`Missing schema field ${id}`);
}

describe("FOUNDATION_BASE_PRESSURE_INPUT_SCHEMA", () => {
  it("uses the agreed default example values", () => {
    expect(findSchemaField("verticalForceT")).toMatchObject({
      defaultValue: "26",
      prefix: { text: "N", ariaLabel: "N" },
    });
    expect(findSchemaField("momentXTm")).toMatchObject({
      defaultValue: "2",
      prefix: { text: "M", subscript: "x", ariaLabel: "Mx" },
    });
    expect(findSchemaField("foundationLengthM")).toMatchObject({
      defaultValue: "2.4",
      quantity: "length",
      baseUnit: "m",
      defaultDisplayUnit: "m",
    });
    expect(findSchemaField("soilAndFoundationUnitWeightTM3")).toMatchObject({
      defaultValue: "2",
      prefix: { text: "γ", ariaLabel: "γ" },
    });
  });
});

describe("FoundationBasePressureCalculator", () => {
  it("renders the calculator with report, DOCX action, and pressure epure", () => {
    render(createElement(FoundationBasePressureCalculator));

    expect(
      screen.getByLabelText("Калькулятор напружень під підошвою фундаменту"),
    ).toHaveClass("native-calculator");
    expect(
      screen.getByRole("heading", { name: "Епюра тиску під підошвою" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Покроковий звіт" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Завантажити DOCX" })).toBeInTheDocument();
    expect(screen.getByLabelText("p_avg")).toBeInTheDocument();
    expect(screen.getByText(/10.02 т\/м²/)).toBeInTheDocument();
    expect(screen.getAllByText(/σ1 = 27.73 т\/м²/).length).toBeGreaterThan(0);
    expect(screen.getByLabelText("P_lift")).toBeInTheDocument();
    expect(screen.getAllByText(/20.2%/).length).toBeGreaterThan(0);
  });

  it("rejects malformed numeric text without keeping calculated output", () => {
    render(createElement(FoundationBasePressureCalculator));

    const input = screen.getByRole("textbox", { name: "Вертикальна сила" });
    fireEvent.change(input, {
      target: { value: "10abc" },
    });

    expect(input.closest(".input-schema-field")).toHaveAttribute("data-invalid", "true");
    expect(
      screen.getByRole("button", { name: "Показати помилку поля Вертикальна сила" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/10\.02 т\/м²/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Завантажити DOCX" })).not.toBeInTheDocument();
  });
});

describe("foundation base pressure DOCX export", () => {
  it("maps report steps and diagram to DOCX", () => {
    const report = getFoundationBasePressureReport({
      verticalForceT: 26,
      momentXTm: 2,
      shearYT: 0.5,
      momentYTm: 9.7,
      shearXT: 9,
      foundationLengthM: 2.4,
      foundationWidthM: 1.8,
      embedmentDepthM: 2,
      loadApplicationHeightM: 1.6,
      soilAndFoundationUnitWeightTM3: 2,
    });
    const docxReport = buildFoundationBasePressureDocxReport(
      report,
      new Date("2026-06-15"),
    );

    expect(docxReport.fileBaseName).toBe(
      "napruzhennia-pid-pidoshvoiu-fundamentu-2026-06-15",
    );
    expect(docxReport.steps.map((step) => step.key)).toEqual(
      report.steps.map((step) => step.key),
    );
    expect(docxReport.figures?.[0]?.svg).toContain("<svg");
  });

  it("labels point numbers and contact stresses at the matching diagram corners", () => {
    const report = getFoundationBasePressureReport({
      verticalForceT: 26,
      momentXTm: 2,
      shearYT: 0.5,
      momentYTm: 9.7,
      shearXT: 9,
      foundationLengthM: 2.4,
      foundationWidthM: 1.8,
      embedmentDepthM: 2,
      loadApplicationHeightM: 1.6,
      soilAndFoundationUnitWeightTM3: 2,
    });
    const docxReport = buildFoundationBasePressureDocxReport(
      report,
      new Date("2026-06-15"),
    );
    const svg = docxReport.figures?.[0]?.svg ?? "";

    expect(svg).toContain('data-point-label="1"');
    expect(svg).toContain('data-point-label="2"');
    expect(svg).toContain('data-point-label="3"');
    expect(svg).toContain('data-point-label="4"');
    expect(svg).toContain('data-stress-label="1"');
    expect(svg).toContain('data-stress-label="2"');
    expect(svg).not.toContain('data-stress-label="3"');
    expect(svg).not.toContain('data-stress-label="4"');
    expect(svg).toContain('data-axis="x"');
    expect(svg).toContain('data-axis="y"');
    expect(svg).toContain('data-axis-label="x"');
    expect(svg).toContain('data-axis-label="y"');
    expect(svg).toContain('x1="124" y1="285" x2="196" y2="285"');
    expect(svg).toContain('x1="124" y1="285" x2="124" y2="213"');
    expect(svg).toContain('x="410" y="82"');
    expect(svg).toContain('x="410" y="324"');
    expect(svg).not.toContain('x="420" y="116"');
  });
});
