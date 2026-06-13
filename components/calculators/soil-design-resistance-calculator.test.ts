import { describe, expect, it } from "vitest";

import type { CalculatorInputField } from "@/lib/calculator-input-schema";

import { SOIL_INPUT_SCHEMA } from "./soil-design-resistance-calculator";

function findSchemaField(id: string): CalculatorInputField {
  for (const group of SOIL_INPUT_SCHEMA.groups) {
    const field = group.fields.find((item) => item.id === id);
    if (field) return field;
  }
  throw new Error(`Missing schema field ${id}`);
}

function expectTextDescription(field: CalculatorInputField, pattern: RegExp) {
  expect(field.description).toBeTruthy();
  expect(field.description).toMatch(pattern);
}

describe("SOIL_INPUT_SCHEMA", () => {
  it("defines complete inspector metadata for key fields", () => {
    const expected = [
      ["gammaC1Manual", "coefficient", { text: "γ", subscript: "c1", ariaLabel: "γc1" }],
      ["gammaC2Manual", "coefficient", { text: "γ", subscript: "c2", ariaLabel: "γc2" }],
      ["buildingLengthM", "length", { text: "L", ariaLabel: "L" }],
      ["buildingHeightM", "length", { text: "H", ariaLabel: "H" }],
      ["liquidityIndex", "coefficient", { text: "I", subscript: "L", ariaLabel: "IL" }],
      ["phi11Deg", "angle", { text: "φ", subscript: "11", ariaLabel: "φ11" }],
      ["gamma11KnM3", "unitWeight", { text: "γ", subscript: "11", ariaLabel: "γ11" }],
      ["gammaPrime11KnM3", "unitWeight", { text: "γ′", subscript: "11", ariaLabel: "γ′11" }],
      ["c11KPa", "pressure", { text: "c", subscript: "11", ariaLabel: "c11" }],
      ["foundationWidthM", "length", { text: "b", ariaLabel: "b" }],
      ["foundationDepthM", "length", { text: "d", ariaLabel: "d" }],
      ["embedmentDepthD1M", "length", { text: "d", subscript: "1", ariaLabel: "d1" }],
      ["basementDepthInputM", "length", { text: "d", subscript: "b,input", ariaLabel: "db,input" }],
      ["soilLayerAboveFootingHsM", "length", { text: "h", subscript: "s", ariaLabel: "hs" }],
      ["basementFloorThicknessHcfM", "length", { text: "h", subscript: "cf", ariaLabel: "hcf" }],
      ["basementFloorUnitWeightGammaCfKnM3", "unitWeight", { text: "γ", subscript: "cf", ariaLabel: "γcf" }],
    ] as const;

    for (const [id, quantity, prefix] of expected) {
      const field = findSchemaField(id);
      expect(field).toMatchObject({
        kind: "number",
        quantity,
        prefix,
      });
      expect(field).not.toHaveProperty("displayUnits");
      expect(field.description, id).toBeTruthy();
      expect(field.description, id).not.toBe(field.name);
    }

    expect(findSchemaField("hasBasement")).toMatchObject({
      kind: "checkbox",
      name: "Є підвал?",
    });

    expectTextDescription(findSchemaField("gammaC1Manual"), /табл\. Е\.7/);
    expectTextDescription(findSchemaField("liquidityIndex"), /глинист/);
    expectTextDescription(findSchemaField("phi11Deg"), /табл\. Е\.8/);
    expectTextDescription(findSchemaField("strengthSource"), /п\. Е\.4/);
  });
});
