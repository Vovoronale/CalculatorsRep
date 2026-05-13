import { getConcreteByClass } from "@/lib/materials/concrete";
import { getRebarByClass } from "@/lib/materials/rebar";

export type MinimumReinforcementStructureType = "beam" | "slab";

export const MINIMUM_REINFORCEMENT_NOTATION = {
  structureType: "тип конструкції",
  concreteClass: "клас бетону",
  rebarClass: "клас арматури",
  sectionHeight: "h",
  tensileZoneWidth: "bt",
  reinforcementCentroidDistance: "a_s",
  rebarDiameter: "Øs",
  effectiveDepth: "d",
  concreteMeanTensileStrength: "fctm",
  rebarYieldStrength: "fyk",
  minimumReinforcementAreaFirst: "As,min,1",
  minimumReinforcementAreaSecond: "As,min,2",
  minimumReinforcementArea: "As,min",
} as const;

export type MinimumReinforcementInput = {
  structureType: MinimumReinforcementStructureType;
  concreteClass: string;
  rebarClass: string;
  sectionHeightMm: number;
  tensileZoneWidthMm?: number;
  reinforcementCentroidDistanceMm: number;
  rebarDiameterMm: number;
};

export type NormalizedMinimumReinforcementInput = Required<MinimumReinforcementInput>;

export type MinimumReinforcementValues = {
  fctmMPa: number;
  fykMPa: number;
  effectiveDepthMm: number;
  minimumAreaFirstMm2: number;
  minimumAreaFirstCm2: number;
  minimumAreaSecondMm2: number;
  minimumAreaSecondCm2: number;
  minimumAreaMm2: number;
  minimumAreaCm2: number;
};

export type MinimumReinforcementReportStep = {
  key:
    | "inputs"
    | "fctm"
    | "fyk"
    | "eurocode-fyk-check"
    | "slab-strip-width"
    | "effective-depth"
    | "as-min-1"
    | "as-min-2"
    | "as-min";
  caption: string;
  formula?: string;
  items?: string[];
};

export type MinimumReinforcementReport = {
  input: NormalizedMinimumReinforcementInput;
  valid: boolean;
  eurocodeApplicable: boolean;
  errors: string[];
  warnings: string[];
  values: MinimumReinforcementValues | null;
  steps: MinimumReinforcementReportStep[];
};

const DEFAULT_SLAB_WIDTH_MM = 1000;

export function isEurocodeRebarStrengthApplicable(fykMPa: number): boolean {
  return fykMPa >= 400 && fykMPa <= 600;
}

export function getEffectiveDepthMm(
  sectionHeightMm: number,
  reinforcementCentroidDistanceMm: number,
): number {
  return sectionHeightMm - reinforcementCentroidDistanceMm;
}

export function getMinimumAreaFirstMm2(
  fctmMPa: number,
  fykMPa: number,
  btMm: number,
  dMm: number,
): number {
  return 0.26 * (fctmMPa / fykMPa) * btMm * dMm;
}

export function getMinimumAreaSecondMm2(btMm: number, dMm: number): number {
  return 0.0013 * btMm * dMm;
}

export function convertMm2ToCm2(areaMm2: number): number {
  return areaMm2 / 100;
}

export function formatMinimumReinforcementNumber(
  value: number,
  maximumFractionDigits = 2,
): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
    minimumFractionDigits: 0,
    useGrouping: false,
  }).format(value);
}

function formatAreaMm2(value: number): string {
  return formatMinimumReinforcementNumber(value, 1);
}

function formatAreaCm2(value: number): string {
  return formatMinimumReinforcementNumber(value, 2);
}

function normalizeInput(
  input: MinimumReinforcementInput,
): NormalizedMinimumReinforcementInput {
  return {
    ...input,
    tensileZoneWidthMm:
      input.tensileZoneWidthMm ??
      (input.structureType === "slab" ? DEFAULT_SLAB_WIDTH_MM : 0),
  };
}

function isPositiveFinite(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function getInputItems(input: NormalizedMinimumReinforcementInput): string[] {
  return [
    `тип конструкції: ${input.structureType === "beam" ? "балка" : "плита"}`,
    `клас бетону: ${input.concreteClass}`,
    `клас арматури: ${input.rebarClass}`,
    `h = ${formatMinimumReinforcementNumber(input.sectionHeightMm)} мм`,
    `bt = ${formatMinimumReinforcementNumber(input.tensileZoneWidthMm)} мм`,
    `a_s = ${formatMinimumReinforcementNumber(input.reinforcementCentroidDistanceMm)} мм`,
    `Øs = ${formatMinimumReinforcementNumber(input.rebarDiameterMm)} мм`,
  ];
}

function getValidationErrors(input: NormalizedMinimumReinforcementInput): string[] {
  const errors: string[] = [];

  if (!isPositiveFinite(input.sectionHeightMm)) {
    errors.push("h має бути більше 0.");
  }

  if (!isPositiveFinite(input.tensileZoneWidthMm)) {
    errors.push("bt має бути більше 0.");
  }

  if (!isPositiveFinite(input.reinforcementCentroidDistanceMm)) {
    errors.push("a_s має бути більше 0.");
  }

  if (!isPositiveFinite(input.rebarDiameterMm)) {
    errors.push("Øs має бути більше 0.");
  }

  if (
    isPositiveFinite(input.sectionHeightMm) &&
    isPositiveFinite(input.reinforcementCentroidDistanceMm) &&
    input.reinforcementCentroidDistanceMm >= input.sectionHeightMm
  ) {
    errors.push("a_s має бути менше h.");
  }

  if (!getConcreteByClass(input.concreteClass)) {
    errors.push("Оберіть клас бетону з довідника.");
  }

  if (!getRebarByClass(input.rebarClass)) {
    errors.push("Оберіть клас арматури з довідника.");
  }

  return errors;
}

export function getMinimumReinforcementReport(
  rawInput: MinimumReinforcementInput,
): MinimumReinforcementReport {
  const input = normalizeInput(rawInput);
  const errors = getValidationErrors(input);
  const baseSteps: MinimumReinforcementReportStep[] = [
    {
      key: "inputs",
      caption: "Вихідні дані, задані користувачем:",
      items: getInputItems(input),
    },
  ];

  if (errors.length > 0) {
    return {
      input,
      valid: false,
      eurocodeApplicable: false,
      errors,
      warnings: [],
      values: null,
      steps: baseSteps,
    };
  }

  const concrete = getConcreteByClass(input.concreteClass);
  const rebar = getRebarByClass(input.rebarClass);

  if (!concrete || !rebar) {
    return {
      input,
      valid: false,
      eurocodeApplicable: false,
      errors,
      warnings: [],
      values: null,
      steps: baseSteps,
    };
  }

  const fctmMPa = concrete.fctmMPa;
  const fykMPa = rebar.yieldStrengthMPa;
  const eurocodeApplicable = isEurocodeRebarStrengthApplicable(fykMPa);
  const effectiveDepthMm = getEffectiveDepthMm(
    input.sectionHeightMm,
    input.reinforcementCentroidDistanceMm,
  );
  const minimumAreaFirstMm2 = getMinimumAreaFirstMm2(
    fctmMPa,
    fykMPa,
    input.tensileZoneWidthMm,
    effectiveDepthMm,
  );
  const minimumAreaSecondMm2 = getMinimumAreaSecondMm2(
    input.tensileZoneWidthMm,
    effectiveDepthMm,
  );
  const minimumAreaMm2 = Math.max(minimumAreaFirstMm2, minimumAreaSecondMm2);
  const values: MinimumReinforcementValues = {
    fctmMPa,
    fykMPa,
    effectiveDepthMm,
    minimumAreaFirstMm2,
    minimumAreaFirstCm2: convertMm2ToCm2(minimumAreaFirstMm2),
    minimumAreaSecondMm2,
    minimumAreaSecondCm2: convertMm2ToCm2(minimumAreaSecondMm2),
    minimumAreaMm2,
    minimumAreaCm2: convertMm2ToCm2(minimumAreaMm2),
  };
  const warnings = eurocodeApplicable
    ? []
    : [
        `Розрахунок за Eurocode 2 не виконується: fyk = ${formatMinimumReinforcementNumber(
          fykMPa,
        )} МПа виходить за межі 400...600 МПа згідно з п. 3.2.2(3)P EN 1992-1-1.`,
      ];
  const structureLabel = input.structureType === "beam" ? "балки" : "плити";
  const steps: MinimumReinforcementReportStep[] = [
    ...baseSteps,
    {
      key: "fctm",
      caption:
        "Визначення середньої міцності бетону на осьовий розтяг fctm за класом бетону (табл. 3.1 ДБН В.2.6-98:2009 / табл. 3.1 EN 1992-1-1):",
      formula: `fctm = ${formatMinimumReinforcementNumber(fctmMPa)} МПа (${input.concreteClass})`,
    },
    {
      key: "fyk",
      caption:
        "Визначення характеристичної границі плинності арматури fyk за класом арматури (табл. 5 ДСТУ 3760:2006 / п. 3.2.2, додаток C EN 1992-1-1):",
      formula: `fyk = ${formatMinimumReinforcementNumber(fykMPa)} МПа (${input.rebarClass})`,
    },
    {
      key: "eurocode-fyk-check",
      caption:
        "Перевірка застосовності класу арматури для розрахунку за Eurocode 2 (п. 3.2.2(3)P EN 1992-1-1):",
      formula: `400 <= ${formatMinimumReinforcementNumber(fykMPa)} <= 600 - умова ${
        eurocodeApplicable ? "виконується" : "не виконується"
      }`,
    },
  ];

  if (input.structureType === "slab") {
    steps.push({
      key: "slab-strip-width",
      caption:
        "Прийняття розрахункової ширини смуги плити bt (п. 8.3.1.1 ДСТУ Б В.2.6-156:2010 / п. 9.3.1.1 EN 1992-1-1):",
      formula: `bt = ${formatMinimumReinforcementNumber(input.tensileZoneWidthMm)} мм`,
    });
  }

  steps.push(
    {
      key: "effective-depth",
      caption: `Визначення робочої висоти ${structureLabel} d за геометрією перерізу (п. 4.4.1.1, 4.4.1.2 ДБН В.2.6-98:2009):`,
      formula: `d = h - a_s = ${formatMinimumReinforcementNumber(
        input.sectionHeightMm,
      )} - ${formatMinimumReinforcementNumber(
        input.reinforcementCentroidDistanceMm,
      )} = ${formatMinimumReinforcementNumber(effectiveDepthMm)} мм`,
    },
    {
      key: "as-min-1",
      caption:
        "Визначення першої складової мінімальної площі армування As,min,1 (п. 8.2.1.1 ДСТУ Б В.2.6-156:2010 / п. 9.2.1.1(1), формула 9.1N EN 1992-1-1):",
      formula: `As,min,1 = 0.26 * fctm / fyk * bt * d = 0.26 * ${formatMinimumReinforcementNumber(
        fctmMPa,
      )} / ${formatMinimumReinforcementNumber(fykMPa)} * ${formatMinimumReinforcementNumber(
        input.tensileZoneWidthMm,
      )} * ${formatMinimumReinforcementNumber(effectiveDepthMm)} = ${formatAreaMm2(
        minimumAreaFirstMm2,
      )} мм² = ${formatAreaCm2(values.minimumAreaFirstCm2)} см²`,
    },
    {
      key: "as-min-2",
      caption:
        "Визначення другої складової мінімальної площі армування As,min,2 (п. 8.2.1.1 ДСТУ Б В.2.6-156:2010 / п. 9.2.1.1(1), формула 9.1N EN 1992-1-1):",
      formula: `As,min,2 = 0.0013 * bt * d = 0.0013 * ${formatMinimumReinforcementNumber(
        input.tensileZoneWidthMm,
      )} * ${formatMinimumReinforcementNumber(effectiveDepthMm)} = ${formatAreaMm2(
        minimumAreaSecondMm2,
      )} мм² = ${formatAreaCm2(values.minimumAreaSecondCm2)} см²`,
    },
    {
      key: "as-min",
      caption:
        "Визначення мінімальної площі армування As,min як більшого зі значень As,min,1 та As,min,2 (п. 8.2.1.1 ДСТУ Б В.2.6-156:2010 / п. 9.2.1.1(1), формула 9.1N EN 1992-1-1):",
      formula: `As,min = max(As,min,1; As,min,2) = max(${formatAreaMm2(
        minimumAreaFirstMm2,
      )}; ${formatAreaMm2(minimumAreaSecondMm2)}) = ${formatAreaMm2(
        minimumAreaMm2,
      )} мм² = ${formatAreaCm2(values.minimumAreaCm2)} см²`,
    },
  );

  return {
    input,
    valid: true,
    eurocodeApplicable,
    errors,
    warnings,
    values,
    steps,
  };
}
