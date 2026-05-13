import { getConcreteByClass } from "@/lib/materials/concrete";
import { getRebarAreaSquareMillimeters, getRebarByClass } from "@/lib/materials/rebar";

export type FoundationAnchorageStructureType = "beam" | "slab";
export type FoundationAnchorageBarAngle = "horizontal" | "inclined";
export type FoundationAnchorageShape = "straight" | "bend";
export type FoundationAnchorageKScheme = "0" | "0.05" | "0.1";

export const FOUNDATION_BAR_ANCHORAGE_NOTATION = {
  structureType: "тип конструкції",
  concreteClass: "клас бетону",
  rebarClass: "клас арматури",
  footingLength: "L",
  footingWidth: "B",
  footingHeight: "h",
  effectiveDepth: "d",
  pedestalWidth: "b",
  availableAnchorageLength: "lb",
  axialLoad: "N",
  moment: "M",
  shear: "Q",
  shearHeight: "hQ",
  shearMoment: "MQ",
  totalMoment: "Mtot",
  eccentricity: "e",
  meanSoilPressure: "qm",
  maximumSoilPressure: "qmax",
  minimumSoilPressure: "qmin",
  criticalDistance: "x",
  soilPressureAtX: "qx",
  soilResultant: "R",
  externalLeverArm: "ze",
  internalLeverArm: "zi",
  tensileForce: "Fs",
  barDiameter: "Ø",
  singleBarArea: "As,1",
  providedArea: "As,prov",
  steelStress: "sigma_sd",
  concreteDesignTensileStrength: "fctd",
  bondConditionFactor: "eta1",
  diameterFactor: "eta2",
  bondStress: "fbd",
  basicRequiredAnchorageLength: "lb,rqd",
  concreteDistance: "cd",
  alpha1: "alpha1",
  alpha2: "alpha2",
  alpha3: "alpha3",
  alpha4: "alpha4",
  alpha5: "alpha5",
  alpha235: "alpha235",
  transverseRebarMinimumArea: "ΣAst,min",
  transverseRebarArea: "ΣAst",
  transverseRebarInfluence: "lambda",
  transverseRebarSchemeFactor: "K",
  designAnchorageLength: "lbd",
  minimumAnchorageLength: "lb,min",
  requiredAnchorageLength: "lb,req",
} as const;

export const FOUNDATION_BAR_ANCHORAGE_NORMATIVE_REFERENCES = [
  {
    id: "norm-dstu-8-8-2-4",
    label: "п. 8.8.2.4",
    title: "п. 8.8.2.4 ДСТУ Б В.2.6-156:2010",
    summary:
      "Зусилля розтягу в арматурі визначається з умов рівноваги з урахуванням похилих тріщин; зусилля на відстані x повинно анкеруватись у бетоні в межах такої ж відстані x від грані фундаменту.",
  },
  {
    id: "norm-dstu-8-8-2-5",
    label: "п. 8.8.2.5",
    title: "п. 8.8.2.5 ДСТУ Б В.2.6-156:2010, формула (8.13)",
    summary:
      "Сила розтягу для анкерування визначається як Fs = R * ze / zi.",
  },
  {
    id: "norm-dstu-8-8-2-6",
    label: "п. 8.8.2.6",
    title: "п. 8.8.2.6 ДСТУ Б В.2.6-156:2010",
    summary:
      "Для спрощення приймається ze = 0.15b, а zi = 0.9d.",
  },
  {
    id: "norm-dstu-8-8-2-7",
    label: "п. 8.8.2.7",
    title: "п. 8.8.2.7 ДСТУ Б В.2.6-156:2010",
    summary:
      "Можлива зона анкерування для прямих стрижнів позначена як lb; якщо довжина недостатня, застосовують загин або анкерні пристрої.",
  },
  {
    id: "norm-dstu-8-8-2-8",
    label: "п. 8.8.2.8",
    title: "п. 8.8.2.8 ДСТУ Б В.2.6-156:2010",
    summary:
      "Для прямих стрижнів без анкерування на кінцях можна приймати xmin = h / 2.",
  },
  {
    id: "norm-dstu-7-2-2-2",
    label: "п. 7.2.2.2",
    title: "п. 7.2.2.2 ДСТУ Б В.2.6-156:2010, формула (7.2)",
    summary:
      "Граничне напруження зчеплення для стрижнів періодичного профілю визначається як fbd = 2.25 * eta1 * eta2 * fctd.",
  },
  {
    id: "norm-dstu-7-2-3-2",
    label: "п. 7.2.3.2",
    title: "п. 7.2.3.2 ДСТУ Б В.2.6-156:2010, формула (7.3)",
    summary:
      "Необхідна базова довжина анкерування визначається як lb,rqd = (Ø / 4) * (sigma_sd / fbd).",
  },
  {
    id: "norm-dstu-fig-7-3",
    label: "рис. 7.3",
    title: "рис. 7.3 ДСТУ Б В.2.6-156:2010",
    summary:
      "Рисунок задає визначення cd для прямих стрижнів і стрижнів із загином/гаком.",
  },
  {
    id: "norm-dstu-table-7-2",
    label: "табл. 7.2",
    title: "табл. 7.2 ДСТУ Б В.2.6-156:2010",
    summary:
      "Таблиця задає коефіцієнти alpha1...alpha5 для розрахункової довжини анкерування.",
  },
  {
    id: "norm-dstu-fig-7-4",
    label: "рис. 7.4",
    title: "рис. 7.4 ДСТУ Б В.2.6-156:2010",
    summary:
      "Рисунок задає значення K для балок і плит залежно від схеми поперечної арматури.",
  },
  {
    id: "norm-dstu-7-2-4-1",
    label: "п. 7.2.4.1",
    title: "п. 7.2.4.1 ДСТУ Б В.2.6-156:2010, формули (7.4)-(7.6)",
    summary:
      "Розрахункова довжина анкерування визначається через lb,rqd і коефіцієнти alpha1...alpha5; мінімальна довжина при розтягу дорівнює max(0.3 * lb,rqd; 10Ø; 100 мм).",
  },
  {
    id: "norm-en-1992-fig-8-2",
    label: "рис. 8.2 EN 1992-1-1",
    title: "рис. 8.2 EN 1992-1-1",
    summary:
      "Рисунок використовується для визначення добрих умов зчеплення залежно від висоти елемента, положення стрижня та нахилу стрижня.",
  },
] as const;

export type FoundationBarAnchorageInput = {
  structureType: FoundationAnchorageStructureType;
  concreteClass: string;
  rebarClass: string;
  footingLengthMm: number;
  footingWidthMm: number;
  footingHeightMm: number;
  effectiveDepthMm: number;
  pedestalWidthMm: number;
  availableAnchorageLengthMm: number;
  axialLoadKn: number;
  momentKnM: number;
  shearKn: number;
  shearHeightM: number;
  barDiameterMm: number;
  barCount?: number;
  barSpacingForAreaMm?: number;
  hBondMm: number;
  aBottomMm: number;
  barAngle: FoundationAnchorageBarAngle;
  slipForm: boolean;
  anchorageShape: FoundationAnchorageShape;
  coverBottomMm: number;
  coverSideMm: number;
  barSpacingMm: number;
  transverseRebarAreaMm2: number;
  kScheme: FoundationAnchorageKScheme;
  weldedTransverseRebar: boolean;
  transversePressureMPa: number;
};

export type FoundationBarAnchorageValues = {
  shearMomentKnM: number;
  totalMomentKnM: number;
  eccentricityM: number;
  meanSoilPressureKPa: number;
  maximumSoilPressureKPa: number;
  minimumSoilPressureKPa: number;
  criticalDistanceMm: number;
  soilPressureAtXKPa: number;
  soilResultantKn: number;
  externalLeverArmMm: number;
  internalLeverArmMm: number;
  tensileForceKn: number;
  singleBarAreaMm2: number;
  providedAreaMm2: number;
  steelStressMPa: number;
  fctdMPa: number;
  eta1: number;
  eta2: number;
  fbdMPa: number;
  basicRequiredAnchorageLengthMm: number;
  cdMm: number;
  alpha1: number;
  alpha2: number;
  transverseRebarMinimumAreaMm2: number;
  lambda: number;
  k: number;
  alpha3: number;
  alpha4: number;
  alpha5: number;
  alpha235: number;
  designAnchorageLengthMm: number;
  minimumAnchorageLengthMm: number;
  requiredAnchorageLengthMm: number;
  anchorageSufficient: boolean;
};

export type FoundationBarAnchorageReportStep = {
  key:
    | "inputs"
    | "shear-moment"
    | "total-moment"
    | "eccentricity"
    | "mean-soil-pressure"
    | "maximum-soil-pressure"
    | "minimum-soil-pressure"
    | "critical-distance"
    | "soil-pressure-at-x"
    | "soil-resultant"
    | "external-lever-arm"
    | "internal-lever-arm"
    | "tensile-force"
    | "single-bar-area"
    | "provided-area"
    | "steel-stress"
    | "fctd"
    | "eta1"
    | "eta2"
    | "fbd"
    | "lb-rqd"
    | "cd"
    | "alpha1"
    | "alpha2"
    | "ast-min"
    | "lambda"
    | "k"
    | "alpha3"
    | "alpha4"
    | "alpha5"
    | "alpha235"
    | "lbd"
    | "lb-min"
    | "lb-req"
    | "lb-available"
    | "final-check";
  caption: string;
  formula?: string;
  items?: string[];
};

export type FoundationBarAnchorageReport = {
  input: FoundationBarAnchorageInput;
  valid: boolean;
  errors: string[];
  warnings: string[];
  values: FoundationBarAnchorageValues | null;
  steps: FoundationBarAnchorageReportStep[];
};

export type GoodBondConditionInput = Pick<
  FoundationBarAnchorageInput,
  "hBondMm" | "aBottomMm" | "barAngle" | "slipForm"
>;

const ALPHA_CT = 1;
const GAMMA_C = 1.5;

export function formatFoundationAnchorageNumber(
  value: number,
  maximumFractionDigits = 2,
): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
    minimumFractionDigits: 0,
    useGrouping: false,
  }).format(value);
}

function formatFormulaNumber(value: number, maximumFractionDigits = 2): string {
  return formatFoundationAnchorageNumber(value, maximumFractionDigits);
}

function isPositiveFinite(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function isNonNegativeFinite(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function getInputItems(input: FoundationBarAnchorageInput): string[] {
  const reinforcementItem =
    input.structureType === "beam"
      ? `n = ${formatFormulaNumber(input.barCount ?? 0)}`
      : `s = ${formatFormulaNumber(input.barSpacingForAreaMm ?? 0)} мм`;

  return [
    `тип конструкції: ${input.structureType === "beam" ? "балка" : "плита"}`,
    `клас бетону: ${input.concreteClass}`,
    `клас арматури: ${input.rebarClass}`,
    `L = ${formatFormulaNumber(input.footingLengthMm)} мм`,
    `B = ${formatFormulaNumber(input.footingWidthMm)} мм`,
    `h = ${formatFormulaNumber(input.footingHeightMm)} мм`,
    `d = ${formatFormulaNumber(input.effectiveDepthMm)} мм`,
    `b = ${formatFormulaNumber(input.pedestalWidthMm)} мм`,
    `lb = ${formatFormulaNumber(input.availableAnchorageLengthMm)} мм`,
    `N = ${formatFormulaNumber(input.axialLoadKn)} кН`,
    `M = ${formatFormulaNumber(input.momentKnM)} кН*м`,
    `Q = ${formatFormulaNumber(input.shearKn)} кН`,
    `hQ = ${formatFormulaNumber(input.shearHeightM)} м`,
    `Ø = ${formatFormulaNumber(input.barDiameterMm)} мм`,
    reinforcementItem,
  ];
}

function getValidationErrors(input: FoundationBarAnchorageInput): string[] {
  const errors: string[] = [];

  if (!isPositiveFinite(input.footingLengthMm)) errors.push("L має бути більше 0.");
  if (!isPositiveFinite(input.footingWidthMm)) errors.push("B має бути більше 0.");
  if (!isPositiveFinite(input.footingHeightMm)) errors.push("h має бути більше 0.");
  if (!isPositiveFinite(input.effectiveDepthMm)) errors.push("d має бути більше 0.");
  if (!isPositiveFinite(input.pedestalWidthMm)) errors.push("b має бути більше 0.");
  if (!isPositiveFinite(input.availableAnchorageLengthMm)) {
    errors.push("lb має бути більше 0.");
  }
  if (!isPositiveFinite(input.axialLoadKn)) errors.push("N має бути більше 0.");
  if (!Number.isFinite(input.momentKnM)) errors.push("M має бути числом.");
  if (!Number.isFinite(input.shearKn)) errors.push("Q має бути числом.");
  if (!isNonNegativeFinite(input.shearHeightM)) errors.push("hQ має бути не менше 0.");
  if (!isPositiveFinite(input.barDiameterMm)) errors.push("Ø має бути більше 0.");
  if (input.structureType === "beam" && !isPositiveFinite(input.barCount ?? NaN)) {
    errors.push("n має бути більше 0.");
  }
  if (
    input.structureType === "slab" &&
    !isPositiveFinite(input.barSpacingForAreaMm ?? NaN)
  ) {
    errors.push("s має бути більше 0.");
  }
  if (!isPositiveFinite(input.hBondMm)) errors.push("hBond має бути більше 0.");
  if (!isNonNegativeFinite(input.aBottomMm)) errors.push("aBottom має бути не менше 0.");
  if (
    isNonNegativeFinite(input.aBottomMm) &&
    isPositiveFinite(input.hBondMm) &&
    input.aBottomMm > input.hBondMm
  ) {
    errors.push("aBottom має бути не більше hBond.");
  }
  if (!isPositiveFinite(input.coverBottomMm)) errors.push("c має бути більше 0.");
  if (!isPositiveFinite(input.coverSideMm)) errors.push("c1 має бути більше 0.");
  if (!isPositiveFinite(input.barSpacingMm)) errors.push("a має бути більше 0.");
  if (!isNonNegativeFinite(input.transverseRebarAreaMm2)) {
    errors.push("ΣAst має бути не менше 0.");
  }
  if (!isNonNegativeFinite(input.transversePressureMPa)) {
    errors.push("p має бути не менше 0.");
  }
  if (!getConcreteByClass(input.concreteClass)) {
    errors.push("Оберіть клас бетону з довідника.");
  }
  if (!getRebarByClass(input.rebarClass)) {
    errors.push("Оберіть клас арматури з довідника.");
  }

  return errors;
}

export function getGoodBondCondition(input: GoodBondConditionInput): boolean {
  if (input.slipForm) {
    return false;
  }

  if (input.barAngle === "inclined") {
    return true;
  }

  if (input.hBondMm <= 250) {
    return true;
  }

  if (input.hBondMm <= 600) {
    return input.aBottomMm <= 250;
  }

  return input.aBottomMm <= input.hBondMm - 300;
}

function getEta2(barDiameterMm: number): number {
  return barDiameterMm <= 32 ? 1 : (132 - barDiameterMm) / 100;
}

function getCdMm(input: FoundationBarAnchorageInput): number {
  if (input.anchorageShape === "straight") {
    return Math.min(input.barSpacingMm / 2, input.coverSideMm, input.coverBottomMm);
  }

  return Math.min(input.barSpacingMm / 2, input.coverSideMm);
}

function getAlpha1(input: FoundationBarAnchorageInput, cdMm: number): number {
  if (input.anchorageShape === "straight") {
    return 1;
  }

  return cdMm > 3 * input.barDiameterMm ? 0.7 : 1;
}

function getAlpha2(input: FoundationBarAnchorageInput, cdMm: number): number {
  const diameter = input.barDiameterMm;
  const offset = input.anchorageShape === "straight" ? diameter : 3 * diameter;

  return clamp(1 - (0.15 * (cdMm - offset)) / diameter, 0.7, 1);
}

function getKValue(kScheme: FoundationAnchorageKScheme): number {
  return Number.parseFloat(kScheme);
}

function getKDescription(k: number): string {
  if (k === 0.1) {
    return "поперечна арматура охоплює анкерований стрижень біля кінця";
  }

  if (k === 0.05) {
    return "поперечна арматура перетинає/утримує зону анкерування за середньою схемою";
  }

  return "поперечна арматура не охоплює анкерований стрижень або відсутня";
}

export function getFoundationBarAnchorageReport(
  input: FoundationBarAnchorageInput,
): FoundationBarAnchorageReport {
  const baseSteps: FoundationBarAnchorageReportStep[] = [
    {
      key: "inputs",
      caption: "Вихідні дані, задані користувачем:",
      items: getInputItems(input),
    },
  ];
  const errors = getValidationErrors(input);

  if (errors.length > 0) {
    return {
      input,
      valid: false,
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
      errors: ["Не вдалося отримати характеристики матеріалів."],
      warnings: [],
      values: null,
      steps: baseSteps,
    };
  }

  const footingLengthM = input.footingLengthMm / 1000;
  const footingWidthM = input.footingWidthMm / 1000;
  const criticalDistanceM = input.footingHeightMm / 2 / 1000;
  const shearMomentKnM = input.shearKn * input.shearHeightM;
  const totalMomentKnM = input.momentKnM + shearMomentKnM;
  const eccentricityM = totalMomentKnM / input.axialLoadKn;
  const meanSoilPressureKPa = input.axialLoadKn / (footingLengthM * footingWidthM);
  const pressureDeltaKPa =
    (6 * totalMomentKnM) / (footingWidthM * footingLengthM ** 2);
  const maximumSoilPressureKPa = meanSoilPressureKPa + pressureDeltaKPa;
  const minimumSoilPressureKPa = meanSoilPressureKPa - pressureDeltaKPa;
  const criticalDistanceMm = input.footingHeightMm / 2;
  const soilPressureAtXKPa =
    maximumSoilPressureKPa -
    ((maximumSoilPressureKPa - minimumSoilPressureKPa) * criticalDistanceM) /
      footingLengthM;
  const soilResultantKn =
    (footingWidthM * criticalDistanceM * (maximumSoilPressureKPa + soilPressureAtXKPa)) /
    2;
  const externalLeverArmMm = 0.15 * input.pedestalWidthMm;
  const internalLeverArmMm = 0.9 * input.effectiveDepthMm;
  const tensileForceKn = (soilResultantKn * externalLeverArmMm) / internalLeverArmMm;
  const singleBarAreaMm2 = getRebarAreaSquareMillimeters(input.barDiameterMm);
  const providedAreaMm2 =
    input.structureType === "beam"
      ? singleBarAreaMm2 * (input.barCount ?? 0)
      : (singleBarAreaMm2 * 1000) / (input.barSpacingForAreaMm ?? 1);
  const steelStressMPa = (tensileForceKn * 1000) / providedAreaMm2;
  const fctdMPa = (ALPHA_CT * concrete.fctk005MPa) / GAMMA_C;
  const eta1 = getGoodBondCondition(input) ? 1 : 0.7;
  const eta2 = getEta2(input.barDiameterMm);
  const fbdMPa = 2.25 * eta1 * eta2 * fctdMPa;
  const basicRequiredAnchorageLengthMm =
    (input.barDiameterMm / 4) * (steelStressMPa / fbdMPa);
  const cdMm = getCdMm(input);
  const alpha1 = getAlpha1(input, cdMm);
  const alpha2 = getAlpha2(input, cdMm);
  const transverseRebarMinimumAreaMm2 =
    input.structureType === "beam" ? 0.25 * providedAreaMm2 : 0;
  const lambda =
    (input.transverseRebarAreaMm2 - transverseRebarMinimumAreaMm2) / providedAreaMm2;
  const k = getKValue(input.kScheme);
  const alpha3 = clamp(1 - k * lambda, 0.7, 1);
  const alpha4 = input.weldedTransverseRebar ? 0.7 : 1;
  const alpha5 = clamp(1 - 0.04 * input.transversePressureMPa, 0.7, 1);
  const alpha235Raw = alpha2 * alpha3 * alpha5;
  const alpha235 = Math.max(alpha235Raw, 0.7);
  const designAnchorageLengthMm = alpha1 * alpha4 * alpha235 * basicRequiredAnchorageLengthMm;
  const minimumAnchorageLengthMm = Math.max(
    0.3 * basicRequiredAnchorageLengthMm,
    10 * input.barDiameterMm,
    100,
  );
  const requiredAnchorageLengthMm = Math.max(
    designAnchorageLengthMm,
    minimumAnchorageLengthMm,
  );
  const anchorageSufficient =
    input.availableAnchorageLengthMm >= requiredAnchorageLengthMm;
  const values: FoundationBarAnchorageValues = {
    shearMomentKnM,
    totalMomentKnM,
    eccentricityM,
    meanSoilPressureKPa,
    maximumSoilPressureKPa,
    minimumSoilPressureKPa,
    criticalDistanceMm,
    soilPressureAtXKPa,
    soilResultantKn,
    externalLeverArmMm,
    internalLeverArmMm,
    tensileForceKn,
    singleBarAreaMm2,
    providedAreaMm2,
    steelStressMPa,
    fctdMPa,
    eta1,
    eta2,
    fbdMPa,
    basicRequiredAnchorageLengthMm,
    cdMm,
    alpha1,
    alpha2,
    transverseRebarMinimumAreaMm2,
    lambda,
    k,
    alpha3,
    alpha4,
    alpha5,
    alpha235,
    designAnchorageLengthMm,
    minimumAnchorageLengthMm,
    requiredAnchorageLengthMm,
    anchorageSufficient,
  };
  const warnings: string[] = [];

  if (minimumSoilPressureKPa < 0) {
    warnings.push(
      "qmin < 0: епюра тиску має неповний контакт підошви з ґрунтом; цей калькулятор використовує спрощену лінійну епюру повного контакту.",
    );
  }

  if (steelStressMPa > rebar.yieldStrengthMPa) {
    warnings.push(
      `sigma_sd = ${formatFormulaNumber(
        steelStressMPa,
      )} МПа перевищує fyk = ${formatFormulaNumber(rebar.yieldStrengthMPa)} МПа.`,
    );
  }

  if (criticalDistanceMm > input.footingLengthMm) {
    warnings.push("x = h / 2 перевищує L; перевірте геометрію фундаменту.");
  }

  const providedAreaCaption =
    input.structureType === "beam"
      ? "Визначення сумарної площі анкерованої робочої арматури балки:"
      : "Визначення площі анкерованої робочої арматури на 1 м.п. плити:";
  const providedAreaFormula =
    input.structureType === "beam"
      ? `As,prov = n * As,1 = ${formatFormulaNumber(
          input.barCount ?? 0,
        )} * ${formatFormulaNumber(singleBarAreaMm2)} = ${formatFormulaNumber(
          providedAreaMm2,
        )} мм²`
      : `As,prov = As,1 * 1000 / s = ${formatFormulaNumber(
          singleBarAreaMm2,
        )} * 1000 / ${formatFormulaNumber(
          input.barSpacingForAreaMm ?? 0,
        )} = ${formatFormulaNumber(providedAreaMm2)} мм²/м.п.`;
  const alpha1Formula =
    input.anchorageShape === "straight"
      ? "alpha1 = 1.0 (пряме анкерування)"
      : cdMm > 3 * input.barDiameterMm
        ? `alpha1 = 0.7, оскільки cd = ${formatFormulaNumber(
            cdMm,
          )} мм > 3Ø = ${formatFormulaNumber(3 * input.barDiameterMm)} мм`
        : `alpha1 = 1.0, оскільки cd = ${formatFormulaNumber(
            cdMm,
          )} мм <= 3Ø = ${formatFormulaNumber(3 * input.barDiameterMm)} мм`;
  const alpha2Formula =
    input.anchorageShape === "straight"
      ? `alpha2 = min(max(1.0 - 0.15 * (cd - Ø) / Ø; 0.7); 1.0) = min(max(1.0 - 0.15 * (${formatFormulaNumber(
          cdMm,
        )} - ${formatFormulaNumber(
          input.barDiameterMm,
        )}) / ${formatFormulaNumber(input.barDiameterMm)}; 0.7); 1.0) = ${formatFormulaNumber(
          alpha2,
        )}`
      : `alpha2 = min(max(1.0 - 0.15 * (cd - 3Ø) / Ø; 0.7); 1.0) = min(max(1.0 - 0.15 * (${formatFormulaNumber(
          cdMm,
        )} - 3 * ${formatFormulaNumber(
          input.barDiameterMm,
        )}) / ${formatFormulaNumber(input.barDiameterMm)}; 0.7); 1.0) = ${formatFormulaNumber(
          alpha2,
        )}`;
  const steps: FoundationBarAnchorageReportStep[] = [
    ...baseSteps,
    {
      key: "shear-moment",
      caption: "Визначення додаткового моменту від поперечної сили Q за висотою її прикладання:",
      formula: `MQ = Q * hQ = ${formatFormulaNumber(input.shearKn)} * ${formatFormulaNumber(
        input.shearHeightM,
      )} = ${formatFormulaNumber(shearMomentKnM)} кН*м`,
    },
    {
      key: "total-moment",
      caption: "Визначення сумарного моменту на уступі фундаменту:",
      formula: `Mtot = M + MQ = ${formatFormulaNumber(
        input.momentKnM,
      )} + ${formatFormulaNumber(shearMomentKnM)} = ${formatFormulaNumber(
        totalMomentKnM,
      )} кН*м`,
    },
    {
      key: "eccentricity",
      caption: "Визначення ексцентриситету рівнодійної навантаження:",
      formula: `e = Mtot / N = ${formatFormulaNumber(
        totalMomentKnM,
      )} / ${formatFormulaNumber(input.axialLoadKn)} = ${formatFormulaNumber(
        eccentricityM,
        3,
      )} м`,
    },
    {
      key: "mean-soil-pressure",
      caption: "Визначення середнього тиску під підошвою фундаменту:",
      formula: `qm = N / (L * B) = ${formatFormulaNumber(
        input.axialLoadKn,
      )} / (${formatFormulaNumber(footingLengthM)} * ${formatFormulaNumber(
        footingWidthM,
      )}) = ${formatFormulaNumber(meanSoilPressureKPa)} кПа`,
    },
    {
      key: "maximum-soil-pressure",
      caption: "Визначення максимального крайового тиску ґрунту:",
      formula: `qmax = N / (L * B) + 6 * Mtot / (B * L^2) = ${formatFormulaNumber(
        maximumSoilPressureKPa,
      )} кПа`,
    },
    {
      key: "minimum-soil-pressure",
      caption: "Визначення мінімального крайового тиску ґрунту:",
      formula: `qmin = N / (L * B) - 6 * Mtot / (B * L^2) = ${formatFormulaNumber(
        minimumSoilPressureKPa,
      )} кПа`,
    },
    {
      key: "critical-distance",
      caption:
        "Визначення критичної відстані від грані фундаменту для прямих стрижнів без анкерування на кінцях згідно з п. 8.8.2.8 ДСТУ Б В.2.6-156:2010:",
      formula: `x = h / 2 = ${formatFormulaNumber(
        input.footingHeightMm,
      )} / 2 = ${formatFormulaNumber(criticalDistanceMm)} мм`,
    },
    {
      key: "soil-pressure-at-x",
      caption:
        "Визначення тиску ґрунту на відстані x від грані фундаменту за лінійною епюрою тиску:",
      formula: `qx = qmax - (qmax - qmin) * x / L = ${formatFormulaNumber(
        maximumSoilPressureKPa,
      )} - (${formatFormulaNumber(maximumSoilPressureKPa)} - ${formatFormulaNumber(
        minimumSoilPressureKPa,
      )}) * ${formatFormulaNumber(criticalDistanceMm)} / ${formatFormulaNumber(
        input.footingLengthMm,
      )} = ${formatFormulaNumber(soilPressureAtXKPa)} кПа`,
    },
    {
      key: "soil-resultant",
      caption:
        "Визначення результуючої тиску ґрунту R у межах відстані x від грані фундаменту згідно з п. 8.8.2.5 ДСТУ Б В.2.6-156:2010:",
      formula: `R = B * x * (qmax + qx) / 2 = ${formatFormulaNumber(
        footingWidthM,
      )} * ${formatFormulaNumber(criticalDistanceM)} * (${formatFormulaNumber(
        maximumSoilPressureKPa,
      )} + ${formatFormulaNumber(soilPressureAtXKPa)}) / 2 = ${formatFormulaNumber(
        soilResultantKn,
      )} кН`,
    },
    {
      key: "external-lever-arm",
      caption:
        "Визначення зовнішнього плеча пари ze за спрощеним припущенням п. 8.8.2.6 ДСТУ Б В.2.6-156:2010:",
      formula: `ze = 0.15 * b = 0.15 * ${formatFormulaNumber(
        input.pedestalWidthMm,
      )} = ${formatFormulaNumber(externalLeverArmMm)} мм`,
    },
    {
      key: "internal-lever-arm",
      caption:
        "Визначення внутрішнього плеча пари zi за спрощеним припущенням п. 8.8.2.6 ДСТУ Б В.2.6-156:2010:",
      formula: `zi = 0.9 * d = 0.9 * ${formatFormulaNumber(
        input.effectiveDepthMm,
      )} = ${formatFormulaNumber(internalLeverArmMm)} мм`,
    },
    {
      key: "tensile-force",
      caption:
        "Визначення сили розтягу Fs, яка повинна заанкеровуватись, згідно з п. 8.8.2.5 ДСТУ Б В.2.6-156:2010:",
      formula: `Fs = R * ze / zi = ${formatFormulaNumber(
        soilResultantKn,
      )} * ${formatFormulaNumber(externalLeverArmMm)} / ${formatFormulaNumber(
        internalLeverArmMm,
      )} = ${formatFormulaNumber(tensileForceKn)} кН`,
    },
    {
      key: "single-bar-area",
      caption: "Визначення площі одного анкерованого стрижня за діаметром арматури:",
      formula: `As,1 = pi * Ø^2 / 4 = pi * ${formatFormulaNumber(
        input.barDiameterMm,
      )}^2 / 4 = ${formatFormulaNumber(singleBarAreaMm2)} мм²`,
    },
    {
      key: "provided-area",
      caption: providedAreaCaption,
      formula: providedAreaFormula,
    },
    {
      key: "steel-stress",
      caption:
        "Визначення розрахункового напруження в арматурі в місці, від якого визначається довжина анкерування, згідно з п. 7.2.3.2 ДСТУ Б В.2.6-156:2010:",
      formula: `sigma_sd = Fs * 1000 / As,prov = ${formatFormulaNumber(
        tensileForceKn,
      )} * 1000 / ${formatFormulaNumber(providedAreaMm2)} = ${formatFormulaNumber(
        steelStressMPa,
      )} МПа`,
    },
    {
      key: "fctd",
      caption:
        "Визначення розрахункової міцності бетону на осьовий розтяг fctd за класом бетону згідно з табл. 3.1 ДБН В.2.6-98:2009:",
      formula: `fctd = alpha_ct * fctk,0.05 / gamma_c = ${formatFormulaNumber(
        ALPHA_CT,
      )} * ${formatFormulaNumber(concrete.fctk005MPa)} / ${formatFormulaNumber(
        GAMMA_C,
      )} = ${formatFormulaNumber(fctdMPa)} МПа`,
    },
    {
      key: "eta1",
      caption:
        "Визначення коефіцієнта eta1 умов зчеплення за положенням стрижня під час бетонування згідно з п. 7.2.2.2 ДСТУ Б В.2.6-156:2010 / рис. 8.2 EN 1992-1-1:",
      formula:
        eta1 === 1
          ? `eta1 = 1.0, оскільки hBond = ${formatFormulaNumber(
              input.hBondMm,
            )} мм, aBottom = ${formatFormulaNumber(
              input.aBottomMm,
            )} мм і стрижень знаходиться в зоні добрих умов зчеплення`
          : `eta1 = 0.7, оскільки hBond = ${formatFormulaNumber(
              input.hBondMm,
            )} мм, aBottom = ${formatFormulaNumber(
              input.aBottomMm,
            )} мм і стрижень знаходиться поза зоною добрих умов зчеплення`,
    },
    {
      key: "eta2",
      caption:
        "Визначення коефіцієнта eta2 за діаметром стрижня згідно з п. 7.2.2.2 ДСТУ Б В.2.6-156:2010:",
      formula:
        input.barDiameterMm <= 32
          ? "eta2 = 1.0"
          : `eta2 = (132 - Ø) / 100 = (132 - ${formatFormulaNumber(
              input.barDiameterMm,
            )}) / 100 = ${formatFormulaNumber(eta2)}`,
    },
    {
      key: "fbd",
      caption:
        "Визначення граничного напруження зчеплення fbd згідно з п. 7.2.2.2, формула (7.2) ДСТУ Б В.2.6-156:2010:",
      formula: `fbd = 2.25 * eta1 * eta2 * fctd = 2.25 * ${formatFormulaNumber(
        eta1,
      )} * ${formatFormulaNumber(eta2)} * ${formatFormulaNumber(
        fctdMPa,
      )} = ${formatFormulaNumber(fbdMPa)} МПа`,
    },
    {
      key: "lb-rqd",
      caption:
        "Визначення необхідної базової довжини анкерування lb,rqd згідно з п. 7.2.3.2, формула (7.3) ДСТУ Б В.2.6-156:2010:",
      formula: `lb,rqd = (Ø / 4) * (sigma_sd / fbd) = (${formatFormulaNumber(
        input.barDiameterMm,
      )} / 4) * (${formatFormulaNumber(steelStressMPa)} / ${formatFormulaNumber(
        fbdMPa,
      )}) = ${formatFormulaNumber(basicRequiredAnchorageLengthMm)} мм`,
    },
    {
      key: "cd",
      caption:
        "Визначення мінімальної відстані cd до грані бетону або сусіднього стрижня згідно з рис. 7.3 ДСТУ Б В.2.6-156:2010:",
      formula:
        input.anchorageShape === "straight"
          ? `cd = min(a / 2; c1; c) = min(${formatFormulaNumber(
              input.barSpacingMm,
            )} / 2; ${formatFormulaNumber(input.coverSideMm)}; ${formatFormulaNumber(
              input.coverBottomMm,
            )}) = ${formatFormulaNumber(cdMm)} мм`
          : `cd = min(a / 2; c1) = min(${formatFormulaNumber(
              input.barSpacingMm,
            )} / 2; ${formatFormulaNumber(input.coverSideMm)}) = ${formatFormulaNumber(
              cdMm,
            )} мм`,
    },
    {
      key: "alpha1",
      caption:
        "Визначення коефіцієнта alpha1 впливу форми стрижня згідно з табл. 7.2 ДСТУ Б В.2.6-156:2010:",
      formula: alpha1Formula,
    },
    {
      key: "alpha2",
      caption:
        "Визначення коефіцієнта alpha2 впливу захисного шару бетону згідно з табл. 7.2 ДСТУ Б В.2.6-156:2010:",
      formula: alpha2Formula,
    },
    {
      key: "ast-min",
      caption:
        "Визначення мінімальної площі поперечної арматури ΣAst,min вздовж зони анкерування згідно з приміткою до табл. 7.2 ДСТУ Б В.2.6-156:2010:",
      formula:
        input.structureType === "beam"
          ? `ΣAst,min = 0.25 * As = 0.25 * ${formatFormulaNumber(
              providedAreaMm2,
            )} = ${formatFormulaNumber(transverseRebarMinimumAreaMm2)} мм²`
          : "ΣAst,min = 0 мм²",
    },
    {
      key: "lambda",
      caption:
        "Визначення коефіцієнта lambda для впливу поперечної арматури згідно з табл. 7.2 ДСТУ Б В.2.6-156:2010:",
      formula: `lambda = (ΣAst - ΣAst,min) / As = (${formatFormulaNumber(
        input.transverseRebarAreaMm2,
      )} - ${formatFormulaNumber(
        transverseRebarMinimumAreaMm2,
      )}) / ${formatFormulaNumber(providedAreaMm2)} = ${formatFormulaNumber(
        lambda,
        3,
      )}`,
    },
    {
      key: "k",
      caption:
        "Визначення коефіцієнта K за схемою поперечної арматури згідно з рис. 7.4 ДСТУ Б В.2.6-156:2010:",
      formula: `K = ${formatFormulaNumber(k)} (${getKDescription(k)})`,
    },
    {
      key: "alpha3",
      caption:
        "Визначення коефіцієнта alpha3 впливу поперечної арматури, не привареної до основної, згідно з табл. 7.2 ДСТУ Б В.2.6-156:2010:",
      formula: `alpha3 = min(max(1.0 - K * lambda; 0.7); 1.0) = min(max(1.0 - ${formatFormulaNumber(
        k,
      )} * ${formatFormulaNumber(lambda, 3)}; 0.7); 1.0) = ${formatFormulaNumber(
        alpha3,
      )}`,
    },
    {
      key: "alpha4",
      caption:
        "Визначення коефіцієнта alpha4 впливу привареної поперечної арматури згідно з табл. 7.2 ДСТУ Б В.2.6-156:2010:",
      formula: input.weldedTransverseRebar
        ? "alpha4 = 0.7 (наявна приварена поперечна арматура вздовж розрахункової довжини анкерування)"
        : "alpha4 = 1.0 (приварена поперечна арматура вздовж розрахункової довжини анкерування відсутня)",
    },
    {
      key: "alpha5",
      caption:
        "Визначення коефіцієнта alpha5 впливу поперечного тиску згідно з табл. 7.2 ДСТУ Б В.2.6-156:2010:",
      formula: `alpha5 = min(max(1.0 - 0.04 * p; 0.7); 1.0) = min(max(1.0 - 0.04 * ${formatFormulaNumber(
        input.transversePressureMPa,
      )}; 0.7); 1.0) = ${formatFormulaNumber(alpha5)}`,
    },
    {
      key: "alpha235",
      caption:
        "Перевірка нижньої межі добутку alpha2 * alpha3 * alpha5 згідно з п. 7.2.4.1, формула (7.5) ДСТУ Б В.2.6-156:2010:",
      formula: `alpha235 = max(alpha2 * alpha3 * alpha5; 0.7) = max(${formatFormulaNumber(
        alpha2,
      )} * ${formatFormulaNumber(alpha3)} * ${formatFormulaNumber(
        alpha5,
      )}; 0.7) = max(${formatFormulaNumber(alpha235Raw)}; 0.7) = ${formatFormulaNumber(
        alpha235,
      )}`,
    },
    {
      key: "lbd",
      caption:
        "Визначення розрахункової довжини анкерування lbd згідно з п. 7.2.4.1, формула (7.4) ДСТУ Б В.2.6-156:2010 з урахуванням умови формули (7.5):",
      formula: `lbd = alpha1 * alpha4 * alpha235 * lb,rqd = ${formatFormulaNumber(
        alpha1,
      )} * ${formatFormulaNumber(alpha4)} * ${formatFormulaNumber(
        alpha235,
      )} * ${formatFormulaNumber(
        basicRequiredAnchorageLengthMm,
      )} = ${formatFormulaNumber(designAnchorageLengthMm)} мм`,
    },
    {
      key: "lb-min",
      caption:
        "Визначення мінімальної довжини анкерування lb,min при розтягу згідно з п. 7.2.4.1, формула (7.6) ДСТУ Б В.2.6-156:2010:",
      formula: `lb,min = max(0.3 * lb,rqd; 10 * Ø; 100) = max(0.3 * ${formatFormulaNumber(
        basicRequiredAnchorageLengthMm,
      )}; 10 * ${formatFormulaNumber(input.barDiameterMm)}; 100) = max(${formatFormulaNumber(
        0.3 * basicRequiredAnchorageLengthMm,
      )}; ${formatFormulaNumber(10 * input.barDiameterMm)}; 100) = ${formatFormulaNumber(
        minimumAnchorageLengthMm,
      )} мм`,
    },
    {
      key: "lb-req",
      caption: "Визначення необхідної довжини анкерування з урахуванням мінімального обмеження:",
      formula: `lb,req = max(lbd; lb,min) = max(${formatFormulaNumber(
        designAnchorageLengthMm,
      )}; ${formatFormulaNumber(
        minimumAnchorageLengthMm,
      )}) = ${formatFormulaNumber(requiredAnchorageLengthMm)} мм`,
    },
    {
      key: "lb-available",
      caption:
        "Фіксація доступної довжини анкерування lb за геометрією вузла згідно з п. 8.8.2.7 ДСТУ Б В.2.6-156:2010:",
      formula: `lb = ${formatFormulaNumber(input.availableAnchorageLengthMm)} мм`,
    },
    {
      key: "final-check",
      caption:
        "Перевірка достатності доступної довжини анкерування кінця стрижня згідно з п. 8.8.2.7 ДСТУ Б В.2.6-156:2010 та п. 7.2.4.1 ДСТУ Б В.2.6-156:2010:",
      formula: `lb >= lb,req => ${formatFormulaNumber(
        input.availableAnchorageLengthMm,
      )} >= ${formatFormulaNumber(requiredAnchorageLengthMm)} - умова ${
        anchorageSufficient ? "виконується" : "не виконується"
      }`,
    },
  ];

  return {
    input,
    valid: true,
    errors,
    warnings,
    values,
    steps,
  };
}
