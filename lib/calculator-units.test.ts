import { describe, expect, it } from "vitest";

import {
  CALCULATOR_UNIT_REGISTRY,
  resolveCalculatorInputUnits,
} from "@/lib/calculator-units";
import type { CalculatorInputDisplayUnit } from "@/lib/calculator-input-schema";

function expectRegistryEntry(
  quantity: keyof typeof CALCULATOR_UNIT_REGISTRY,
  expected: {
    baseUnit?: string;
    units: CalculatorInputDisplayUnit[];
  },
) {
  expect(CALCULATOR_UNIT_REGISTRY[quantity]?.baseUnit).toBe(expected.baseUnit);
  expect(
    CALCULATOR_UNIT_REGISTRY[quantity]?.units.map(({ value, label, factorToBase }) => ({
      value,
      label,
      factorToBase,
    })),
  ).toEqual(expected.units);
}

describe("calculator unit registry", () => {
  it("defines the approved calculator input unit registry", () => {
    expectRegistryEntry("length", {
      baseUnit: "m",
      units: [
        { value: "m", label: "м", factorToBase: 1 },
        { value: "cm", label: "см", factorToBase: 0.01 },
        { value: "mm", label: "мм", factorToBase: 0.001 },
      ],
    });
    expectRegistryEntry("diameter", {
      baseUnit: "mm",
      units: [
        { value: "mm", label: "мм", factorToBase: 1 },
        { value: "cm", label: "см", factorToBase: 10 },
        { value: "m", label: "м", factorToBase: 1000 },
      ],
    });
    expectRegistryEntry("area", {
      baseUnit: "mm2",
      units: [
        { value: "mm2", label: "мм²", factorToBase: 1 },
        { value: "cm2", label: "см²", factorToBase: 100 },
        { value: "m2", label: "м²", factorToBase: 1000000 },
      ],
    });
    expectRegistryEntry("force", {
      baseUnit: "kn",
      units: [
        { value: "kn", label: "кН", factorToBase: 1 },
        { value: "n", label: "Н", factorToBase: 0.001 },
      ],
    });
    expectRegistryEntry("linearLoad", {
      baseUnit: "kn-m",
      units: [
        { value: "kn-m", label: "кН/м", factorToBase: 1 },
        { value: "n-mm", label: "Н/мм", factorToBase: 1 },
      ],
    });
    expectRegistryEntry("surfaceLoad", {
      baseUnit: "kn-m2",
      units: [
        { value: "kn-m2", label: "кН/м²", factorToBase: 1 },
        { value: "kpa", label: "кПа", factorToBase: 1 },
        { value: "n-m2", label: "Н/м²", factorToBase: 0.001 },
        { value: "kgf-m2", label: "кгс/м²", factorToBase: 0.00980665 },
        { value: "tf-m2", label: "тс/м²", factorToBase: 9.80665 },
      ],
    });
    expectRegistryEntry("pressure", {
      baseUnit: "kpa",
      units: [
        { value: "kpa", label: "кПа", factorToBase: 1 },
        { value: "mpa", label: "МПа", factorToBase: 1000 },
        { value: "kgf-cm2", label: "кгс/см²", factorToBase: 98.0665 },
        { value: "tf-m2", label: "тс/м²", factorToBase: 9.80665 },
      ],
    });
    expectRegistryEntry("unitWeight", {
      baseUnit: "kn-m3",
      units: [
        { value: "kn-m3", label: "кН/м³", factorToBase: 1 },
        { value: "n-m3", label: "Н/м³", factorToBase: 0.001 },
        { value: "kgf-m3", label: "кгс/м³", factorToBase: 0.00980665 },
        { value: "tf-m3", label: "тс/м³", factorToBase: 9.80665 },
      ],
    });
    expectRegistryEntry("angle", {
      baseUnit: "deg",
      units: [
        { value: "deg", label: "°", factorToBase: 1 },
        { value: "rad", label: "рад", factorToBase: 180 / Math.PI },
      ],
    });
    expectRegistryEntry("coefficient", {
      units: [],
    });
  });
});

describe("resolveCalculatorInputUnits", () => {
  it("resolves length units from the central registry", () => {
    expect(
      resolveCalculatorInputUnits({
        id: "spanM",
        quantity: "length",
        baseUnit: "m",
        defaultDisplayUnit: "cm",
      }),
    ).toBe(CALCULATOR_UNIT_REGISTRY.length.units);
  });

  it("resolves coefficient fields to an empty unit list", () => {
    expect(
      resolveCalculatorInputUnits({
        id: "coefficient",
        quantity: "coefficient",
      }),
    ).toEqual([]);
  });

  it("throws a clear error for an unknown quantity", () => {
    expect(() =>
      resolveCalculatorInputUnits({
        id: "spanM",
        quantity: "distance",
      }),
    ).toThrow("Field 'spanM' uses unknown quantity 'distance'.");
  });

  it("throws a clear error when field baseUnit differs from the registry baseUnit", () => {
    expect(() =>
      resolveCalculatorInputUnits({
        id: "spanM",
        quantity: "length",
        baseUnit: "mm",
      }),
    ).toThrow(
      "Field 'spanM' uses baseUnit 'mm', but quantity 'length' uses baseUnit 'm'.",
    );
  });

  it("throws a clear error when coefficient is configured with baseUnit", () => {
    expect(() =>
      resolveCalculatorInputUnits({
        id: "mu",
        quantity: "coefficient",
        baseUnit: "m",
      }),
    ).toThrow(
      "Field 'mu' uses baseUnit 'm', but quantity 'coefficient' does not use a baseUnit.",
    );
  });

  it("throws a clear error when defaultDisplayUnit is not in registry units", () => {
    expect(() =>
      resolveCalculatorInputUnits({
        id: "spanM",
        quantity: "length",
        baseUnit: "m",
        defaultDisplayUnit: "ft",
      }),
    ).toThrow(
      "Field 'spanM' uses defaultDisplayUnit 'ft', but available units are: m, cm, mm.",
    );
  });

  it("allows local unit overrides when the defaultDisplayUnit is internally consistent", () => {
    const displayUnits = [{ value: "ft", label: "ft", factorToBase: 0.3048 }];

    expect(
      resolveCalculatorInputUnits({
        id: "spanM",
        quantity: "length",
        baseUnit: "m",
        defaultDisplayUnit: "ft",
        displayUnits,
      }),
    ).toBe(displayUnits);
  });

  it("validates local unit defaultDisplayUnit when quantity is omitted", () => {
    const displayUnits = [{ value: "ft", label: "ft", factorToBase: 0.3048 }];

    expect(
      resolveCalculatorInputUnits({
        id: "spanM",
        defaultDisplayUnit: "ft",
        displayUnits,
      }),
    ).toBe(displayUnits);
  });

  it("returns undefined when quantity and local displayUnits are omitted", () => {
    expect(resolveCalculatorInputUnits({ id: "plainNumber" })).toBeUndefined();
  });

  it("throws a clear error when a local override defaultDisplayUnit is invalid", () => {
    expect(() =>
      resolveCalculatorInputUnits({
        id: "spanM",
        quantity: "length",
        baseUnit: "m",
        defaultDisplayUnit: "yd",
        displayUnits: [{ value: "ft", label: "ft", factorToBase: 0.3048 }],
      }),
    ).toThrow(
      "Field 'spanM' uses defaultDisplayUnit 'yd', but available units are: ft.",
    );
  });

  it("validates quantity and baseUnit before returning local unit overrides", () => {
    expect(() =>
      resolveCalculatorInputUnits({
        id: "spanM",
        quantity: "length",
        baseUnit: "mm",
        defaultDisplayUnit: "ft",
        displayUnits: [{ value: "ft", label: "ft", factorToBase: 0.3048 }],
      }),
    ).toThrow(
      "Field 'spanM' uses baseUnit 'mm', but quantity 'length' uses baseUnit 'm'.",
    );
  });
});
