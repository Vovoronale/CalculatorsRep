import type { CalculatorInputDisplayUnit } from "./calculator-input-schema";

export type CalculatorInputQuantity =
  | "length"
  | "diameter"
  | "thickness"
  | "area"
  | "force"
  | "linearLoad"
  | "surfaceLoad"
  | "pressure"
  | "unitWeight"
  | "angle"
  | "coefficient";

export type CalculatorUnitRegistryEntry = {
  baseUnit?: string;
  units: CalculatorInputDisplayUnit[];
};

export const CALCULATOR_UNIT_REGISTRY: Record<
  CalculatorInputQuantity,
  CalculatorUnitRegistryEntry
> = {
  length: {
    baseUnit: "m",
    units: [
      { value: "m", label: "м", factorToBase: 1 },
      { value: "cm", label: "см", factorToBase: 0.01 },
      { value: "mm", label: "мм", factorToBase: 0.001 },
    ],
  },
  diameter: {
    baseUnit: "mm",
    units: [
      { value: "mm", label: "мм", factorToBase: 1 },
      { value: "cm", label: "см", factorToBase: 10 },
      { value: "m", label: "м", factorToBase: 1000 },
    ],
  },
  thickness: {
    baseUnit: "mm",
    units: [
      { value: "mm", label: "мм", factorToBase: 1 },
      { value: "cm", label: "см", factorToBase: 10 },
      { value: "m", label: "м", factorToBase: 1000 },
    ],
  },
  area: {
    baseUnit: "mm2",
    units: [
      { value: "mm2", label: "мм²", factorToBase: 1 },
      { value: "cm2", label: "см²", factorToBase: 100 },
      { value: "m2", label: "м²", factorToBase: 1000000 },
    ],
  },
  force: {
    baseUnit: "kn",
    units: [
      { value: "kn", label: "кН", factorToBase: 1 },
      { value: "n", label: "Н", factorToBase: 0.001 },
    ],
  },
  linearLoad: {
    baseUnit: "kn-m",
    units: [
      { value: "kn-m", label: "кН/м", factorToBase: 1 },
      { value: "n-mm", label: "Н/мм", factorToBase: 1 },
    ],
  },
  surfaceLoad: {
    baseUnit: "kn-m2",
    units: [
      { value: "kn-m2", label: "кН/м²", factorToBase: 1 },
      { value: "kpa", label: "кПа", factorToBase: 1 },
      { value: "n-m2", label: "Н/м²", factorToBase: 0.001 },
      { value: "kgf-m2", label: "кгс/м²", factorToBase: 0.00980665 },
      { value: "tf-m2", label: "тс/м²", factorToBase: 9.80665 },
    ],
  },
  pressure: {
    baseUnit: "kpa",
    units: [
      { value: "kpa", label: "кПа", factorToBase: 1 },
      { value: "mpa", label: "МПа", factorToBase: 1000 },
      { value: "kgf-cm2", label: "кгс/см²", factorToBase: 98.0665 },
      { value: "tf-m2", label: "тс/м²", factorToBase: 9.80665 },
    ],
  },
  unitWeight: {
    baseUnit: "kn-m3",
    units: [
      { value: "kn-m3", label: "кН/м³", factorToBase: 1 },
      { value: "n-m3", label: "Н/м³", factorToBase: 0.001 },
      { value: "kgf-m3", label: "кгс/м³", factorToBase: 0.00980665 },
      { value: "tf-m3", label: "тс/м³", factorToBase: 9.80665 },
    ],
  },
  angle: {
    baseUnit: "deg",
    units: [
      { value: "deg", label: "°", factorToBase: 1 },
      { value: "rad", label: "рад", factorToBase: 180 / Math.PI },
    ],
  },
  coefficient: {
    units: [],
  },
};

export type CalculatorUnitResolutionInput = {
  id: string;
  quantity?: string;
  baseUnit?: string;
  defaultDisplayUnit?: string;
  displayUnits?: CalculatorInputDisplayUnit[];
};

function isCalculatorInputQuantity(value: string): value is CalculatorInputQuantity {
  return Object.prototype.hasOwnProperty.call(CALCULATOR_UNIT_REGISTRY, value);
}

function validateDefaultDisplayUnit(
  field: Pick<CalculatorUnitResolutionInput, "id" | "defaultDisplayUnit">,
  units: CalculatorInputDisplayUnit[],
) {
  if (!field.defaultDisplayUnit) return;

  if (units.some((unit) => unit.value === field.defaultDisplayUnit)) return;

  throw new Error(
    `Field '${field.id}' uses defaultDisplayUnit '${field.defaultDisplayUnit}', but available units are: ${units
      .map((unit) => unit.value)
      .join(", ")}.`,
  );
}

export function resolveCalculatorInputUnits(
  field: CalculatorUnitResolutionInput,
): CalculatorInputDisplayUnit[] | undefined {
  if (!field.quantity) {
    if (!field.displayUnits) return undefined;
    validateDefaultDisplayUnit(field, field.displayUnits);
    return field.displayUnits;
  }

  if (!isCalculatorInputQuantity(field.quantity)) {
    throw new Error(`Field '${field.id}' uses unknown quantity '${field.quantity}'.`);
  }

  const registryEntry = CALCULATOR_UNIT_REGISTRY[field.quantity];

  if (field.baseUnit && !registryEntry.baseUnit) {
    throw new Error(
      `Field '${field.id}' uses baseUnit '${field.baseUnit}', but quantity '${field.quantity}' does not use a baseUnit.`,
    );
  }

  if (field.baseUnit && field.baseUnit !== registryEntry.baseUnit) {
    throw new Error(
      `Field '${field.id}' uses baseUnit '${field.baseUnit}', but quantity '${field.quantity}' uses baseUnit '${registryEntry.baseUnit}'.`,
    );
  }

  if (field.displayUnits) {
    validateDefaultDisplayUnit(field, field.displayUnits);
    return field.displayUnits;
  }

  validateDefaultDisplayUnit(field, registryEntry.units);
  return registryEntry.units;
}
