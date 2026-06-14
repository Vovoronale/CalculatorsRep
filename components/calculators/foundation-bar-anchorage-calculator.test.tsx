import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import type { CalculatorInputField } from "@/lib/calculator-input-schema";
import { getFoundationBarAnchorageReport } from "@/lib/foundation-bar-anchorage";

import {
  FOUNDATION_BAR_ANCHORAGE_INPUT_SCHEMA,
  FoundationBarAnchorageCalculator,
  buildFoundationBarAnchorageDocxReport,
} from "./foundation-bar-anchorage-calculator";

function findSchemaField(id: string): CalculatorInputField {
  for (const group of FOUNDATION_BAR_ANCHORAGE_INPUT_SCHEMA.groups) {
    const field = group.fields.find((item) => item.id === id);
    if (field) return field;
  }
  throw new Error(`Missing schema field ${id}`);
}

describe("FOUNDATION_BAR_ANCHORAGE_INPUT_SCHEMA", () => {
  it("defines grouped inspector metadata and conditional beam/slab fields", () => {
    expect(FOUNDATION_BAR_ANCHORAGE_INPUT_SCHEMA.groups.map((group) => group.id)).toEqual([
      "foundation-anchorage-materials",
      "foundation-anchorage-geometry",
      "foundation-anchorage-loads",
      "foundation-anchorage-reinforcement",
      "foundation-anchorage-bond",
      "foundation-anchorage-cover",
      "foundation-anchorage-transverse",
    ]);
    expect(findSchemaField("barCount")).toMatchObject({
      kind: "number",
      showWhen: { fieldId: "structureType", equals: "beam" },
    });
    expect(findSchemaField("barSpacingForAreaMm")).toMatchObject({
      kind: "number",
      showWhen: { fieldId: "structureType", equals: "slab" },
    });
    expect(findSchemaField("footingLengthMm")).toMatchObject({
      kind: "number",
      baseUnit: "mm",
      defaultDisplayUnit: "mm",
      prefix: { text: "L", ariaLabel: "L" },
    });
    expect(findSchemaField("axialLoadKn")).toMatchObject({
      kind: "number",
      prefix: { text: "N", ariaLabel: "N" },
    });
  });
});

describe("FoundationBarAnchorageCalculator", () => {
  it("renders with shared native report layout and DOCX", () => {
    render(createElement(FoundationBarAnchorageCalculator));

    expect(screen.getByLabelText("Калькулятор анкерування арматури фундаменту")).toHaveClass(
      "native-calculator",
    );
    expect(screen.getByRole("textbox", { name: "Довжина фундаменту" })).toHaveValue(
      "3000",
    );
    expect(screen.getByRole("heading", { name: "Позначення величин" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Покроковий звіт" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Завантажити DOCX" })).toBeInTheDocument();
    expect(screen.getByLabelText(/lb >= lb,req/)).toHaveAttribute("title");
  });
});

describe("foundation anchorage DOCX export", () => {
  it("maps the report to DOCX with a diagram figure", () => {
    const report = getFoundationBarAnchorageReport({
      structureType: "beam",
      concreteClass: "C30/37",
      rebarClass: "A500C",
      footingLengthMm: 3000,
      footingWidthMm: 2000,
      footingHeightMm: 600,
      pedestalWidthMm: 400,
      availableAnchorageLengthMm: 700,
      axialLoadKn: 1000,
      momentKnM: 100,
      shearKn: 50,
      shearHeightM: 0.5,
      barDiameterMm: 16,
      barCount: 4,
      barSpacingForAreaMm: 150,
      barAngle: "horizontal",
      slipForm: false,
      anchorageShape: "straight",
      coverBottomMm: 50,
      coverSideMm: 60,
      barSpacingMm: 150,
      transverseRebarAreaMm2: 300,
      kScheme: "0.05",
      weldedTransverseRebar: false,
      transversePressureMPa: 0,
    });

    const docxReport = buildFoundationBarAnchorageDocxReport(
      report,
      new Date("2026-06-14"),
    );

    expect(docxReport.fileBaseName).toBe(
      "ankeruvannia-armatury-fundamentu-2026-06-14",
    );
    expect(docxReport.steps.map((step) => step.key)).toEqual(
      report.steps.map((step) => step.key),
    );
    expect(docxReport.steps.find((step) => step.key === "final-check")?.formula).toBe(
      report.steps.find((step) => step.key === "final-check")?.formula,
    );
    expect(docxReport.figures?.[0]?.svg).toContain("<svg");
  });
});
