import type { CoverExposureClass } from "@/lib/concrete-exposure-class";

export type ConcreteCoverConstructionClass = "S1" | "S2" | "S3" | "S4" | "S5" | "S6";
export type ConcreteCoverReinforcementDurabilityType = "ordinary" | "prestressed";
export type ConcreteCoverBondMode =
  | "bar"
  | "strand"
  | "round-duct"
  | "rectangular-duct"
  | "pre-tensioned-wire"
  | "pre-tensioned-bar";
export type ConcreteCoverConstructionClassMode = "automatic" | "manual";
export type ConcreteCoverDesignWorkingLife = "50" | "100";

export type ConcreteCoverDurabilityInput = {
  elementName: string;
  exposureClass: CoverExposureClass;
  reinforcementDurabilityType: ConcreteCoverReinforcementDurabilityType;
  bondCoverMode: ConcreteCoverBondMode;
  barDiameterMm: number;
  strandEquivalentDiameterMm: number;
  roundDuctDiameterMm: number;
  rectangularDuctShortSideMm: number;
  rectangularDuctLongSideMm: number;
  preTensionedElementDiameterMm: number;
  aggregateMaxSizeMm: number;
  constructionClassMode: ConcreteCoverConstructionClassMode;
  manualConstructionClass: ConcreteCoverConstructionClass;
  designWorkingLife: ConcreteCoverDesignWorkingLife;
  concreteClass: string;
  isSlabElement: boolean;
  hasSpecialQualityControl: boolean;
  deltaCdurGammaMm: number;
  deltaCdurStMm: number;
  deltaCdurAddMm: number;
  deltaCdevMm: number;
  sourceExposureClasses?: string;
  sourceCalculator?: string;
};

export type ConcreteCoverDurabilityValues = {
  bondBaseCoverMm: number;
  bondCoverMm: number;
  constructionClass: ConcreteCoverConstructionClass;
  durabilityCoverMm: number;
  durabilityAdjustedCoverMm: number;
  minimumCoverMm: number;
  nominalCoverMm: number;
  durabilityTable: "4.3" | "4.4";
  durabilityColumn: string;
};

export type ConcreteCoverDurabilityReportStep = {
  key:
    | "inputs"
    | "bond-cover"
    | "construction-class"
    | "durability-cover"
    | "minimum-cover"
    | "nominal-cover"
    | "conclusion";
  caption: string;
  items?: string[];
  notes?: string[];
  formula?: string;
  formulas?: string[];
};

export type ConcreteCoverDurabilityReport = {
  input: ConcreteCoverDurabilityInput;
  valid: boolean;
  errors: string[];
  warnings: string[];
  values: ConcreteCoverDurabilityValues | null;
  steps: ConcreteCoverDurabilityReportStep[];
};

export const DEFAULT_CONCRETE_COVER_DURABILITY_INPUT: ConcreteCoverDurabilityInput = {
  elementName: "Елемент",
  exposureClass: "XC1",
  reinforcementDurabilityType: "ordinary",
  bondCoverMode: "bar",
  barDiameterMm: 16,
  strandEquivalentDiameterMm: 12.5,
  roundDuctDiameterMm: 50,
  rectangularDuctShortSideMm: 40,
  rectangularDuctLongSideMm: 80,
  preTensionedElementDiameterMm: 12,
  aggregateMaxSizeMm: 20,
  constructionClassMode: "automatic",
  manualConstructionClass: "S4",
  designWorkingLife: "50",
  concreteClass: "C30/37",
  isSlabElement: false,
  hasSpecialQualityControl: false,
  deltaCdurGammaMm: 0,
  deltaCdurStMm: 0,
  deltaCdurAddMm: 0,
  deltaCdevMm: 10,
};

const CONSTRUCTION_CLASSES: ConcreteCoverConstructionClass[] = [
  "S1",
  "S2",
  "S3",
  "S4",
  "S5",
  "S6",
];
const COVER_EXPOSURE_CLASSES: CoverExposureClass[] = [
  "X0",
  "XC1",
  "XC2",
  "XC3",
  "XC4",
  "XD1",
  "XD2",
  "XD3",
  "XS1",
  "XS2",
  "XS3",
];
const CONCRETE_CLASS_ORDER = [
  "C8/10",
  "C12/15",
  "C16/20",
  "C20/25",
  "C25/30",
  "C30/37",
  "C35/45",
  "C40/50",
  "C45/55",
  "C50/60",
];

const REINFORCEMENT_DURABILITY_TYPE_LABELS: Record<
  ConcreteCoverReinforcementDurabilityType,
  string
> = {
  ordinary: "звичайна",
  prestressed: "попередньо напружена",
};

const BOND_MODE_LABELS: Record<ConcreteCoverBondMode, string> = {
  bar: "роздільне розташування стрижнів",
  strand: "пасмо",
  "round-duct": "канал круглий",
  "rectangular-duct": "канал прямокутний",
  "pre-tensioned-wire": "напруження на упори: канат або гладкий дріт",
  "pre-tensioned-bar": "напруження на упори: стрижень періодичного профілю",
};

const CONSTRUCTION_CLASS_MODE_LABELS: Record<
  ConcreteCoverConstructionClassMode,
  string
> = {
  automatic: "автоматично за табл. 4.5",
  manual: "вручну",
};

const DESIGN_WORKING_LIFE_LABELS: Record<ConcreteCoverDesignWorkingLife, string> = {
  "50": "50 років",
  "100": "100 років",
};

const DURABILITY_COLUMNS: Record<CoverExposureClass, string> = {
  X0: "X0",
  XC1: "XC1",
  XC2: "XC2/XC3",
  XC3: "XC2/XC3",
  XC4: "XC4",
  XD1: "XD1/XS1",
  XS1: "XD1/XS1",
  XD2: "XD2/XS2",
  XS2: "XD2/XS2",
  XD3: "XD3/XS3",
  XS3: "XD3/XS3",
};

const TABLE_43: Record<ConcreteCoverConstructionClass, Record<string, number>> = {
  S1: {
    X0: 10,
    XC1: 10,
    "XC2/XC3": 10,
    XC4: 15,
    "XD1/XS1": 20,
    "XD2/XS2": 25,
    "XD3/XS3": 30,
  },
  S2: {
    X0: 10,
    XC1: 10,
    "XC2/XC3": 15,
    XC4: 20,
    "XD1/XS1": 25,
    "XD2/XS2": 30,
    "XD3/XS3": 35,
  },
  S3: {
    X0: 10,
    XC1: 10,
    "XC2/XC3": 20,
    XC4: 25,
    "XD1/XS1": 30,
    "XD2/XS2": 35,
    "XD3/XS3": 40,
  },
  S4: {
    X0: 10,
    XC1: 15,
    "XC2/XC3": 25,
    XC4: 30,
    "XD1/XS1": 35,
    "XD2/XS2": 40,
    "XD3/XS3": 45,
  },
  S5: {
    X0: 10,
    XC1: 20,
    "XC2/XC3": 30,
    XC4: 35,
    "XD1/XS1": 40,
    "XD2/XS2": 45,
    "XD3/XS3": 50,
  },
  S6: {
    X0: 20,
    XC1: 25,
    "XC2/XC3": 35,
    XC4: 40,
    "XD1/XS1": 45,
    "XD2/XS2": 50,
    "XD3/XS3": 55,
  },
};

const TABLE_44: Record<ConcreteCoverConstructionClass, Record<string, number>> = {
  S1: {
    X0: 10,
    XC1: 15,
    "XC2/XC3": 20,
    XC4: 25,
    "XD1/XS1": 30,
    "XD2/XS2": 35,
    "XD3/XS3": 40,
  },
  S2: {
    X0: 10,
    XC1: 15,
    "XC2/XC3": 25,
    XC4: 30,
    "XD1/XS1": 35,
    "XD2/XS2": 40,
    "XD3/XS3": 45,
  },
  S3: {
    X0: 10,
    XC1: 20,
    "XC2/XC3": 30,
    XC4: 35,
    "XD1/XS1": 40,
    "XD2/XS2": 45,
    "XD3/XS3": 50,
  },
  S4: {
    X0: 10,
    XC1: 25,
    "XC2/XC3": 35,
    XC4: 40,
    "XD1/XS1": 45,
    "XD2/XS2": 50,
    "XD3/XS3": 55,
  },
  S5: {
    X0: 15,
    XC1: 30,
    "XC2/XC3": 40,
    XC4: 45,
    "XD1/XS1": 50,
    "XD2/XS2": 55,
    "XD3/XS3": 60,
  },
  S6: {
    X0: 20,
    XC1: 35,
    "XC2/XC3": 45,
    XC4: 50,
    "XD1/XS1": 55,
    "XD2/XS2": 60,
    "XD3/XS3": 65,
  },
};

const TABLE_45_COLUMNS: Record<CoverExposureClass, string> = {
  X0: "X0",
  XC1: "XC1",
  XC2: "XC2/XC3",
  XC3: "XC2/XC3",
  XC4: "XC4",
  XD1: "XD1",
  XD2: "XD2/XS1",
  XS1: "XD2/XS1",
  XD3: "XD3/XS2/XS3",
  XS2: "XD3/XS2/XS3",
  XS3: "XD3/XS2/XS3",
};

const TABLE_45_CONCRETE_REDUCTION_MINIMUMS: Record<string, string> = {
  X0: "C30/37",
  XC1: "C30/37",
  "XC2/XC3": "C35/45",
  XC4: "C40/50",
  XD1: "C40/50",
  "XD2/XS1": "C40/50",
  "XD3/XS2/XS3": "C45/55",
};

function formatNumber(value: number): string {
  return Number.isInteger(value)
    ? String(value)
    : String(Number.parseFloat(value.toFixed(4)));
}

function classToIndex(value: ConcreteCoverConstructionClass): number {
  return CONSTRUCTION_CLASSES.indexOf(value);
}

function indexToClass(index: number): ConcreteCoverConstructionClass {
  return CONSTRUCTION_CLASSES[
    Math.min(Math.max(index, 0), CONSTRUCTION_CLASSES.length - 1)
  ];
}

function shiftClass(
  value: ConcreteCoverConstructionClass,
  delta: number,
): ConcreteCoverConstructionClass {
  return indexToClass(classToIndex(value) + delta);
}

function concreteClassRank(value: string): number {
  return CONCRETE_CLASS_ORDER.indexOf(value);
}

function concreteClassMeets(value: string, minimum: string): boolean {
  const valueRank = concreteClassRank(value);
  const minimumRank = concreteClassRank(minimum);
  return valueRank >= 0 && minimumRank >= 0 && valueRank >= minimumRank;
}

function isFiniteNumber(value: number): boolean {
  return Number.isFinite(value);
}

function isCoverExposureClass(value: string): value is CoverExposureClass {
  return COVER_EXPOSURE_CLASSES.includes(value as CoverExposureClass);
}

function validateInput(input: ConcreteCoverDurabilityInput): string[] {
  const errors: string[] = [];
  const pushPositive = (condition: boolean, message: string) => {
    if (!condition) errors.push(message);
  };

  if (!isCoverExposureClass(input.exposureClass)) {
    errors.push("Оберіть клас впливу середовища.");
  }
  if (
    input.constructionClassMode === "manual" &&
    !CONSTRUCTION_CLASSES.includes(input.manualConstructionClass)
  ) {
    errors.push("Оберіть клас конструкції S.");
  }
  if (input.bondCoverMode === "bar") {
    pushPositive(
      isFiniteNumber(input.barDiameterMm) && input.barDiameterMm > 0,
      "Укажіть додатне значення φ.",
    );
  }
  if (input.bondCoverMode === "strand") {
    pushPositive(
      isFiniteNumber(input.strandEquivalentDiameterMm) &&
        input.strandEquivalentDiameterMm > 0,
      "Укажіть додатне значення φp.",
    );
  }
  if (input.bondCoverMode === "round-duct") {
    pushPositive(
      isFiniteNumber(input.roundDuctDiameterMm) && input.roundDuctDiameterMm > 0,
      "Укажіть додатне значення dduct.",
    );
  }
  if (input.bondCoverMode === "rectangular-duct") {
    pushPositive(
      isFiniteNumber(input.rectangularDuctShortSideMm) &&
        input.rectangularDuctShortSideMm > 0,
      "Укажіть додатне значення aduct.",
    );
    pushPositive(
      isFiniteNumber(input.rectangularDuctLongSideMm) &&
        input.rectangularDuctLongSideMm > 0,
      "Укажіть додатне значення bduct.",
    );
  }
  if (
    input.bondCoverMode === "pre-tensioned-wire" ||
    input.bondCoverMode === "pre-tensioned-bar"
  ) {
    pushPositive(
      isFiniteNumber(input.preTensionedElementDiameterMm) &&
        input.preTensionedElementDiameterMm > 0,
      "Укажіть додатне значення dp.",
    );
  }
  pushPositive(
    isFiniteNumber(input.aggregateMaxSizeMm) && input.aggregateMaxSizeMm >= 0,
    "Dmax має бути не менше 0 мм.",
  );
  pushPositive(
    isFiniteNumber(input.deltaCdurGammaMm) && input.deltaCdurGammaMm >= 0,
    "Δcdur,γ має бути не менше 0 мм.",
  );
  pushPositive(
    isFiniteNumber(input.deltaCdurStMm) && input.deltaCdurStMm >= 0,
    "Δcdur,st має бути не менше 0 мм.",
  );
  pushPositive(
    isFiniteNumber(input.deltaCdurAddMm) && input.deltaCdurAddMm >= 0,
    "Δcdur,add має бути не менше 0 мм.",
  );
  pushPositive(
    isFiniteNumber(input.deltaCdevMm) && input.deltaCdevMm >= 0,
    "Δcdev має бути не менше 0 мм.",
  );

  return errors;
}

function buildInputStep(
  input: ConcreteCoverDurabilityInput,
): ConcreteCoverDurabilityReportStep {
  const items = [
    `Назва елемента: ${input.elementName}`,
    `Клас впливу середовища: ${input.exposureClass}`,
    `Тип арматурної сталі для довговічності: ${
      REINFORCEMENT_DURABILITY_TYPE_LABELS[input.reinforcementDurabilityType]
    }`,
    `Спосіб визначення cmin,b: ${BOND_MODE_LABELS[input.bondCoverMode]}`,
  ];

  if (input.bondCoverMode === "bar") {
    items.push(`Діаметр стрижня: φ = ${formatNumber(input.barDiameterMm)} мм`);
  }
  if (input.bondCoverMode === "strand") {
    items.push(
      `Еквівалентний діаметр пасма: φp = ${formatNumber(
        input.strandEquivalentDiameterMm,
      )} мм`,
    );
  }
  if (input.bondCoverMode === "round-duct") {
    items.push(
      `Діаметр круглого каналу: dduct = ${formatNumber(
        input.roundDuctDiameterMm,
      )} мм`,
    );
  }
  if (input.bondCoverMode === "rectangular-duct") {
    items.push(
      `Менша сторона прямокутного каналу: aduct = ${formatNumber(
        input.rectangularDuctShortSideMm,
      )} мм`,
      `Більша сторона прямокутного каналу: bduct = ${formatNumber(
        input.rectangularDuctLongSideMm,
      )} мм`,
    );
  }
  if (
    input.bondCoverMode === "pre-tensioned-wire" ||
    input.bondCoverMode === "pre-tensioned-bar"
  ) {
    items.push(
      `Діаметр елемента при напруженні на упори: dp = ${formatNumber(
        input.preTensionedElementDiameterMm,
      )} мм`,
    );
  }

  items.push(
    `Номінальний максимальний розмір заповнювача: Dmax = ${formatNumber(
      input.aggregateMaxSizeMm,
    )} мм`,
    `Спосіб визначення класу конструкції S: ${
      CONSTRUCTION_CLASS_MODE_LABELS[input.constructionClassMode]
    }`,
  );

  if (input.constructionClassMode === "manual") {
    items.push(`Клас конструкції вручну: S = ${input.manualConstructionClass}`);
  } else {
    items.push(
      `Розрахунковий строк експлуатації: ${
        DESIGN_WORKING_LIFE_LABELS[input.designWorkingLife]
      }`,
      `Клас міцності бетону: ${input.concreteClass}`,
      `Елемент має форму плити: ${input.isSlabElement ? "так" : "ні"}`,
      `Забезпечено спеціальний контроль якості виготовлення бетону: ${
        input.hasSpecialQualityControl ? "так" : "ні"
      }`,
    );
  }

  items.push(
    `Поправка на надійність при застосуванні добавок: Δcdur,γ = ${formatNumber(
      input.deltaCdurGammaMm,
    )} мм`,
    `Зменшення при застосуванні нержавіючої сталі: Δcdur,st = ${formatNumber(
      input.deltaCdurStMm,
    )} мм`,
    `Зменшення при додатковому захисті: Δcdur,add = ${formatNumber(
      input.deltaCdurAddMm,
    )} мм`,
    `Допуск на відхил: Δcdev = ${formatNumber(input.deltaCdevMm)} мм`,
  );

  const notes =
    input.sourceCalculator === "concrete-exposure-class" &&
    input.sourceExposureClasses
      ? [
          `Клас впливу середовища отримано з калькулятора визначення класу впливу; повний набір класів: ${input.sourceExposureClasses}.`,
        ]
      : undefined;

  return {
    key: "inputs",
    caption:
      "Вихідні дані для розрахунку захисного шару бетону (ДБН В.2.6-98:2009, розділ 4.4):",
    items,
    notes,
  };
}

function calculateBondCover(input: ConcreteCoverDurabilityInput): {
  baseCoverMm: number;
  coverMm: number;
  formula: string;
  formulas?: string[];
  notes?: string[];
} {
  let baseCoverMm: number;
  let formula: string;

  switch (input.bondCoverMode) {
    case "strand":
      baseCoverMm = input.strandEquivalentDiameterMm;
      formula = `cmin,b = φp = ${formatNumber(baseCoverMm)} мм`;
      break;
    case "round-duct":
      baseCoverMm = input.roundDuctDiameterMm;
      formula = `cmin,b = dduct = ${formatNumber(baseCoverMm)} мм`;
      break;
    case "rectangular-duct":
      baseCoverMm = Math.max(
        input.rectangularDuctShortSideMm,
        input.rectangularDuctLongSideMm / 2,
      );
      formula = `cmin,b = max(aduct; bduct / 2) = max(${formatNumber(
        input.rectangularDuctShortSideMm,
      )}; ${formatNumber(input.rectangularDuctLongSideMm)} / 2) = ${formatNumber(
        baseCoverMm,
      )} мм`;
      break;
    case "pre-tensioned-wire":
      baseCoverMm = 1.5 * input.preTensionedElementDiameterMm;
      formula = `cmin,b = 1.5 * dp = 1.5 * ${formatNumber(
        input.preTensionedElementDiameterMm,
      )} = ${formatNumber(baseCoverMm)} мм`;
      break;
    case "pre-tensioned-bar":
      baseCoverMm = 2.5 * input.preTensionedElementDiameterMm;
      formula = `cmin,b = 2.5 * dp = 2.5 * ${formatNumber(
        input.preTensionedElementDiameterMm,
      )} = ${formatNumber(baseCoverMm)} мм`;
      break;
    case "bar":
    default:
      baseCoverMm = input.barDiameterMm;
      formula = `cmin,b = φ = ${formatNumber(baseCoverMm)} мм`;
      break;
  }

  const coverMm = input.aggregateMaxSizeMm > 32 ? baseCoverMm + 5 : baseCoverMm;
  if (input.aggregateMaxSizeMm <= 32) {
    return { baseCoverMm, coverMm, formula };
  }

  return {
    baseCoverMm,
    coverMm,
    formula,
    formulas: [
      formula,
      `cmin,b = cmin,b,base + 5 = ${formatNumber(baseCoverMm)} + 5 = ${formatNumber(
        coverMm,
      )} мм`,
    ],
    notes: [
      `Оскільки Dmax = ${formatNumber(
        input.aggregateMaxSizeMm,
      )} мм > 32 мм, згідно з приміткою до табл. 4.2 cmin,b збільшується на 5 мм.`,
    ],
  };
}

function calculateConstructionClass(input: ConcreteCoverDurabilityInput): {
  constructionClass: ConcreteCoverConstructionClass;
  caption: string;
  formula?: string;
  formulas?: string[];
  notes: string[];
} {
  if (input.constructionClassMode === "manual") {
    return {
      constructionClass: input.manualConstructionClass,
      caption: "Прийняття класу конструкції S користувачем:",
      formula: `S = ${input.manualConstructionClass}`,
      notes: [],
    };
  }

  const notes = ["Для розрахункового строку експлуатації 50 років приймається S4."];
  const formulas = ["Sbase = S4"];
  let current: ConcreteCoverConstructionClass = "S4";
  let reductionStep = 2;

  if (input.designWorkingLife === "100") {
    notes.push("Розрахунковий строк експлуатації 100 років: збільшення на 2 класи.");
    const next = shiftClass(current, 2);
    formulas.push(`S1 = Sbase + 2 = ${current} + 2 = ${next}`);
    current = next;
  }

  const table45Column = TABLE_45_COLUMNS[input.exposureClass];
  const requiredConcreteClass = TABLE_45_CONCRETE_REDUCTION_MINIMUMS[table45Column];
  if (concreteClassMeets(input.concreteClass, requiredConcreteClass)) {
    notes.push(
      `Клас міцності бетону ${input.concreteClass} >= ${requiredConcreteClass}: зменшення на 1 клас.`,
    );
    const previous = current;
    current = shiftClass(current, -1);
    formulas.push(`S${reductionStep} = ${previous} - 1 = ${current}`);
    reductionStep += 1;
  }
  if (input.isSlabElement) {
    notes.push("Елемент має форму плити: зменшення на 1 клас.");
    const previous = current;
    current = shiftClass(current, -1);
    formulas.push(`S${reductionStep} = ${previous} - 1 = ${current}`);
    reductionStep += 1;
  }
  if (input.hasSpecialQualityControl) {
    notes.push(
      "Забезпечено спеціальний контроль якості виготовлення бетону: зменшення на 1 клас.",
    );
    const previous = current;
    current = shiftClass(current, -1);
    formulas.push(`S = ${previous} - 1 = ${current}`);
  }
  notes.push("Клас конструкції обмежується діапазоном S1...S6.");
  formulas.push(`S = clamp(${current}; S1; S6) = ${current}`);

  return {
    constructionClass: current,
    caption:
      "Визначення класу конструкції S за розрахунковим строком експлуатації та факторами впливу (п. 4.4.2.4.3, табл. 4.5 ДБН В.2.6-98:2009):",
    formulas,
    notes,
  };
}

function getDurabilityCover(
  reinforcementDurabilityType: ConcreteCoverReinforcementDurabilityType,
  constructionClass: ConcreteCoverConstructionClass,
  exposureClass: CoverExposureClass,
): {
  durabilityCoverMm: number;
  table: "4.3" | "4.4";
  column: string;
} {
  const column = DURABILITY_COLUMNS[exposureClass];
  const table = reinforcementDurabilityType === "ordinary" ? TABLE_43 : TABLE_44;
  const tableNumber = reinforcementDurabilityType === "ordinary" ? "4.3" : "4.4";

  return {
    durabilityCoverMm: table[constructionClass][column],
    table: tableNumber,
    column,
  };
}

function buildDurabilityCoverStep({
  input,
  constructionClass,
  durabilityCoverMm,
  durabilityTable,
  durabilityColumn,
}: {
  input: ConcreteCoverDurabilityInput;
  constructionClass: ConcreteCoverConstructionClass;
  durabilityCoverMm: number;
  durabilityTable: "4.3" | "4.4";
  durabilityColumn: string;
}): ConcreteCoverDurabilityReportStep {
  const tableUsage =
    input.reinforcementDurabilityType === "ordinary"
      ? "Тип арматурної сталі для довговічності = звичайна: використовується табл. 4.3."
      : "Тип арматурної сталі для довговічності = попередньо напружена: використовується табл. 4.4.";

  return {
    key: "durability-cover",
    caption:
      "Визначення мінімального захисного шару за умовами довговічності cmin,dur (п. 4.4.2.4.1, табл. 4.3 / п. 4.4.2.4.2, табл. 4.4 ДБН В.2.6-98:2009):",
    notes: [
      tableUsage,
      `Для класу конструкції ${constructionClass} і класу впливу середовища ${input.exposureClass} використовується графа "${durabilityColumn}".`,
    ],
    formula: `cmin,dur = табл. ${durabilityTable}[${constructionClass}; ${durabilityColumn}] = ${formatNumber(
      durabilityCoverMm,
    )} мм`,
  };
}

export function getConcreteCoverDurabilityReport(
  input: ConcreteCoverDurabilityInput,
): ConcreteCoverDurabilityReport {
  const errors = validateInput(input);
  const inputStep = buildInputStep(input);

  if (errors.length > 0) {
    return {
      input,
      valid: false,
      errors,
      warnings: [],
      values: null,
      steps: [inputStep],
    };
  }

  const bondCover = calculateBondCover(input);
  const constructionClass = calculateConstructionClass(input);
  const durabilityCover = getDurabilityCover(
    input.reinforcementDurabilityType,
    constructionClass.constructionClass,
    input.exposureClass,
  );
  const durabilityAdjustedCoverMm =
    durabilityCover.durabilityCoverMm +
    input.deltaCdurGammaMm -
    input.deltaCdurStMm -
    input.deltaCdurAddMm;
  const minimumCoverMm = Math.max(bondCover.coverMm, durabilityAdjustedCoverMm, 10);
  const nominalCoverMm = minimumCoverMm + input.deltaCdevMm;
  const warnings =
    nominalCoverMm > 45
      ? [
          `Номінальний захисний шар cnom = ${formatNumber(
            nominalCoverMm,
          )} мм > 45 мм. Згідно з п. 4.4.2.4.4 ДБН В.2.6-98:2009 необхідно передбачити конструктивне армування захисного шару.`,
        ]
      : [];
  const values: ConcreteCoverDurabilityValues = {
    bondBaseCoverMm: bondCover.baseCoverMm,
    bondCoverMm: bondCover.coverMm,
    constructionClass: constructionClass.constructionClass,
    durabilityCoverMm: durabilityCover.durabilityCoverMm,
    durabilityAdjustedCoverMm,
    minimumCoverMm,
    nominalCoverMm,
    durabilityTable: durabilityCover.table,
    durabilityColumn: durabilityCover.column,
  };

  return {
    input,
    valid: true,
    errors: [],
    warnings,
    values,
    steps: [
      inputStep,
      {
        key: "bond-cover",
        caption:
          "Визначення мінімального захисного шару за вимогами зчеплення cmin,b (п. 4.4.2.3, табл. 4.2 ДБН В.2.6-98:2009):",
        formula: bondCover.formula,
        formulas: bondCover.formulas,
        notes: bondCover.notes,
      },
      {
        key: "construction-class",
        caption: constructionClass.caption,
        formula: constructionClass.formula,
        formulas: constructionClass.formulas,
        notes: constructionClass.notes,
      },
      buildDurabilityCoverStep({
        input,
        constructionClass: constructionClass.constructionClass,
        durabilityCoverMm: durabilityCover.durabilityCoverMm,
        durabilityTable: durabilityCover.table,
        durabilityColumn: durabilityCover.column,
      }),
      {
        key: "minimum-cover",
        caption:
          "Визначення мінімального захисного шару cmin як більшого значення з вимог зчеплення та довговічності (п. 4.4.2.2, формула (4.2) ДБН В.2.6-98:2009):",
        formulas: [
          `cdur = cmin,dur + Δcdur,γ - Δcdur,st - Δcdur,add = ${formatNumber(
            durabilityCover.durabilityCoverMm,
          )} + ${formatNumber(input.deltaCdurGammaMm)} - ${formatNumber(
            input.deltaCdurStMm,
          )} - ${formatNumber(input.deltaCdurAddMm)} = ${formatNumber(
            durabilityAdjustedCoverMm,
          )} мм`,
          `cmin = max(cmin,b; cdur; 10 мм) = max(${formatNumber(
            bondCover.coverMm,
          )}; ${formatNumber(durabilityAdjustedCoverMm)}; 10) = ${formatNumber(
            minimumCoverMm,
          )} мм`,
        ],
        notes: [
          "За формулою (4.2) мінімальний захисний шар не може бути меншим ніж 10 мм.",
        ],
      },
      {
        key: "nominal-cover",
        caption:
          "Визначення номінального захисного шару cnom з урахуванням допустимого проектного відхилу (п. 4.4.3 ДБН В.2.6-98:2009):",
        formula: `cnom = cmin + Δcdev = ${formatNumber(
          minimumCoverMm,
        )} + ${formatNumber(input.deltaCdevMm)} = ${formatNumber(
          nominalCoverMm,
        )} мм`,
        notes:
          input.deltaCdevMm === 10
            ? [
                "Для Δcdev прийнято рекомендоване значення 10 мм згідно з приміткою до п. 4.4.3 ДБН В.2.6-98:2009.",
              ]
            : undefined,
      },
      {
        key: "conclusion",
        caption:
          "Висновок щодо мінімального та номінального захисного шару бетону (п. 4.4.2-4.4.3 ДБН В.2.6-98:2009):",
        formula: `cmin => cnom = ${formatNumber(minimumCoverMm)} мм => ${formatNumber(
          nominalCoverMm,
        )} мм`,
      },
    ],
  };
}

export function getConcreteCoverDurabilityReturnUrl({
  exposureClass,
  sourceExposureClasses,
  sourceCalculator,
}: {
  exposureClass: CoverExposureClass;
  sourceExposureClasses?: string;
  sourceCalculator?: string;
}): string {
  const params = new URLSearchParams();
  params.set("exposureClass", exposureClass);
  if (sourceExposureClasses) {
    params.set("sourceExposureClasses", sourceExposureClasses);
  }
  if (sourceCalculator) {
    params.set("sourceCalculator", sourceCalculator);
  }

  return `/calculator/concrete-cover-durability?${params.toString()}`;
}
