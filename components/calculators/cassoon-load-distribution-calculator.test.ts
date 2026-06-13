import { describe, expect, it } from "vitest";

import type { CalculatorInputField } from "@/lib/calculator-input-schema";

import { CASSOON_INPUT_SCHEMA } from "./cassoon-load-distribution-calculator";

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
