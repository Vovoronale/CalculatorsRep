import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it } from "vitest";

import type { CalculatorInputField } from "@/lib/calculator-input-schema";
import { getCassoonLoadDistributionReport } from "@/lib/cassoon-load-distribution";

import {
  CASSOON_INPUT_SCHEMA,
  CassoonLoadDistributionCalculator,
  buildCassoonLoadDistributionDocxReport,
} from "./cassoon-load-distribution-calculator";

afterEach(cleanup);

function findSchemaField(id: string): CalculatorInputField {
  for (const group of CASSOON_INPUT_SCHEMA.groups) {
    const field = group.fields.find((item) => item.id === id);
    if (field) return field;
  }
  throw new Error(`Missing schema field ${id}`);
}

function expectTextDescription(field: CalculatorInputField, pattern: RegExp) {
  expect(field.description).toBeTruthy();
  expect(field.description).toMatch(pattern);
}

describe("CASSOON_INPUT_SCHEMA", () => {
  it("defines complete inspector metadata from the central unit registry", () => {
    const shortSpan = findSchemaField("shortSpanM");
    const longSpan = findSchemaField("longSpanM");
    const totalLoad = findSchemaField("totalLoadKnM2");

    expect(shortSpan).toMatchObject({
      kind: "number",
      quantity: "length",
      baseUnit: "m",
      defaultDisplayUnit: "m",
      prefix: { text: "l", subscript: "k", ariaLabel: "lk" },
    });
    expect(longSpan).toMatchObject({
      kind: "number",
      quantity: "length",
      baseUnit: "m",
      defaultDisplayUnit: "m",
      prefix: { text: "l", subscript: "d", ariaLabel: "ld" },
    });
    expect(totalLoad).toMatchObject({
      kind: "number",
      quantity: "surfaceLoad",
      baseUnit: "kn-m2",
      defaultDisplayUnit: "kn-m2",
      prefix: { text: "q", ariaLabel: "q" },
    });

    for (const field of [shortSpan, longSpan, totalLoad]) {
      expect(field).not.toHaveProperty("displayUnits");
    }

    expectTextDescription(shortSpan, /нормалізує lk <= ld/);
    expectTextDescription(longSpan, /нормалізує lk <= ld/);
    expectTextDescription(totalLoad, /Ліновіч/);
  });
});

describe("cassoon load distribution DOCX export", () => {
  it("maps cassoon report to DOCX", () => {
    const report = getCassoonLoadDistributionReport({
      shortSpanM: 3,
      longSpanM: 6,
      totalLoadKnM2: 10,
      loadUnit: "kn-m2",
    });

    const docxReport = buildCassoonLoadDistributionDocxReport(
      report,
      new Date("2026-06-14"),
    );

    expect(docxReport.fileBaseName).toBe(
      "rozpodil-navantazhennia-kesonna-plita-2026-06-14",
    );
    expect(docxReport.steps.map((step) => step.key)).toEqual(
      report.steps.map((step) => step.key),
    );
    expect(docxReport.steps.find((step) => step.key === "loads")?.formula).toBe(
      report.steps.find((step) => step.key === "loads")?.formula,
    );
    expect(docxReport.figures?.[0]?.svg).toContain("<svg");
  });
});

describe("CassoonLoadDistributionCalculator", () => {
  it("renders cassoon with the shared native report layout", () => {
    render(createElement(CassoonLoadDistributionCalculator));

    expect(
      screen.getByLabelText(
        "Калькулятор коефіцієнтів c1 і c2 для розподілу навантаження",
      ),
    ).toHaveClass("native-calculator");
    expect(screen.getByRole("heading", { name: "Позначення величин" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Покроковий звіт" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Завантажити DOCX" })).toBeInTheDocument();
    expect(screen.getByLabelText(/qk = c1 \* q/)).toHaveAttribute("title");
  });

  it("rejects malformed numeric text without keeping calculated output", () => {
    render(createElement(CassoonLoadDistributionCalculator));

    const input = screen.getByRole("textbox", { name: "Короткий проліт" });
    fireEvent.change(input, {
      target: { value: "10abc" },
    });

    expect(input.closest(".input-schema-field")).toHaveAttribute("data-invalid", "true");
    expect(
      screen.getByRole("button", { name: "Показати помилку поля Короткий проліт" }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/qk = c1 \* q/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Завантажити DOCX" })).not.toBeInTheDocument();
  });
});
