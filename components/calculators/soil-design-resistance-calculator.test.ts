import { afterEach } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import type { CalculatorInputField } from "@/lib/calculator-input-schema";

import {
  SOIL_INPUT_SCHEMA,
  SoilDesignResistanceCalculator,
} from "./soil-design-resistance-calculator";

afterEach(() => {
  cleanup();
});

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

describe("SoilDesignResistanceCalculator diagrams", () => {
  it("renders the no-basement foundation diagram by default", () => {
    const { container } = render(createElement(SoilDesignResistanceCalculator));
    const diagram = container.querySelector(
      "svg[role='img'][aria-label*='Схема фундаменту без підвалу']",
    );

    expect(diagram).not.toBeNull();
    expect(diagram?.textContent).toContain("b=1 м");
    expect(diagram?.textContent).toContain("d1=1.2 м");
    expect(diagram?.textContent).toContain("R=162.8 кПа");
    expect(screen.getByText("Позначення величин")).toBeInTheDocument();
  });

  it("renders the basement foundation diagram after enabling basement mode", () => {
    const { container } = render(createElement(SoilDesignResistanceCalculator));

    fireEvent.click(screen.getByRole("checkbox", { name: /є підвал/i }));
    const diagram = container.querySelector(
      "svg[role='img'][aria-label*='Схема фундаменту з підвалом']",
    );

    expect(diagram).not.toBeNull();
    expect(diagram?.textContent).toContain("b=1 м");
    expect(diagram?.textContent).toContain("dB=0 м");
    expect(diagram?.textContent).toContain("h_cf=0.2 м");
  });
});
