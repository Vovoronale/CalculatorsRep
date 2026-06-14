export type SoilCalculationMode = "automatic" | "manual-e7";
export type SoilStructuralScheme = "rigid" | "flexible";
export type SoilStrengthSource = "direct-testing" | "appendix-b-tables";
export type SoilType =
  | "coarse-with-sandy-fill"
  | "coarse-with-clayey-fill"
  | "gravelly-sand"
  | "coarse-sand"
  | "medium-sand"
  | "loose-sand"
  | "small-sand"
  | "dusty-sand-low-moisture"
  | "dusty-sand-medium-moisture"
  | "dusty-sand-saturated"
  | "clayey-soil";

export type SoilDesignResistanceInput = {
  calculationMode: SoilCalculationMode;
  structuralScheme: SoilStructuralScheme;
  buildingLengthM: number;
  buildingHeightM: number;
  soilType: SoilType;
  liquidityIndex: number;
  gammaC1Manual?: number;
  gammaC2Manual?: number;
  phi11Deg: number;
  gamma11KnM3: number;
  gammaPrime11KnM3: number;
  c11KPa: number;
  strengthSource: SoilStrengthSource;
  foundationWidthM: number;
  foundationDepthM: number;
  hasBasement: boolean;
  embedmentDepthD1M: number;
  basementDepthInputM: number;
  soilLayerAboveFootingHsM: number;
  basementFloorThicknessHcfM: number;
  basementFloorUnitWeightGammaCfKnM3: number;
};

export const SOIL_DESIGN_RESISTANCE_NOTATION = {
  calculationMode: "спосіб розрахунку",
  structuralScheme: "конструктивна схема споруди",
  buildingLength: "L",
  buildingHeight: "H",
  lengthHeightRatio: "L/H",
  soilType: "тип ґрунту",
  liquidityIndex: "IL",
  phi11: "φ11",
  gamma11: "γ11",
  gammaPrime11: "γ′11",
  c11: "c11",
  strengthSource: "спосіб визначення φ11 і c11",
  gammaC1: "γc1",
  gammaC2: "γc2",
  k: "k",
  mGamma: "Mγ",
  mQ: "Mq",
  mC: "Mc",
  foundationWidth: "b",
  foundationDepth: "d",
  kz: "kz",
  z0: "z0",
  hasBasement: "підвал",
  basementDepthInput: "db,input",
  basementDepth: "db",
  soilLayerAboveFooting: "hs",
  basementFloorThickness: "hcf",
  basementFloorUnitWeight: "γcf",
  embedmentDepth: "d1",
  soilDesignResistance: "R",
} as const;

export const SOIL_TYPE_LABELS: Record<SoilType, string> = {
  "coarse-with-sandy-fill": "Великоуламковий з піщаним заповнювачем",
  "coarse-with-clayey-fill": "Великоуламковий з глинистим заповнювачем",
  "gravelly-sand": "Пісок гравелистий",
  "coarse-sand": "Пісок крупний",
  "medium-sand": "Пісок середньої крупності",
  "loose-sand": "Пісок пухкий",
  "small-sand": "Пісок дрібний",
  "dusty-sand-low-moisture": "Пісок пилуватий малого ступеня вологості",
  "dusty-sand-medium-moisture": "Пісок пилуватий середнього ступеня вологості",
  "dusty-sand-saturated": "Пісок пилуватий, насичений водою",
  "clayey-soil": "Глинистий ґрунт",
};

export type SoilTableE7Row = {
  rowKey:
    | "coarse-sandy-and-non-small-non-dusty-sands"
    | "small-sands"
    | "dusty-sands-low-medium-moisture"
    | "dusty-sands-saturated"
    | "clayey-il-le-025"
    | "clayey-il-025-05"
    | "clayey-il-gt-05"
    | "loose-sand";
  tableRow: string;
  gammaC1: number;
  gammaC2RigidRatio4: number;
  gammaC2RigidRatio15: number;
};

const TABLE_E7_ROWS: Record<SoilTableE7Row["rowKey"], SoilTableE7Row> = {
  "coarse-sandy-and-non-small-non-dusty-sands": {
    rowKey: "coarse-sandy-and-non-small-non-dusty-sands",
    tableRow:
      "Великоуламкові з піщаним заповнювачем і піщані, крім дрібних і пилуватих",
    gammaC1: 1.4,
    gammaC2RigidRatio4: 1.2,
    gammaC2RigidRatio15: 1.4,
  },
  "small-sands": {
    rowKey: "small-sands",
    tableRow: "Піски дрібні",
    gammaC1: 1.3,
    gammaC2RigidRatio4: 1.1,
    gammaC2RigidRatio15: 1.3,
  },
  "dusty-sands-low-medium-moisture": {
    rowKey: "dusty-sands-low-medium-moisture",
    tableRow: "Піски пилуваті малого і середнього ступеня вологості",
    gammaC1: 1.25,
    gammaC2RigidRatio4: 1,
    gammaC2RigidRatio15: 1.2,
  },
  "dusty-sands-saturated": {
    rowKey: "dusty-sands-saturated",
    tableRow: "Піски пилуваті, насичені водою",
    gammaC1: 1.1,
    gammaC2RigidRatio4: 1,
    gammaC2RigidRatio15: 1.2,
  },
  "clayey-il-le-025": {
    rowKey: "clayey-il-le-025",
    tableRow:
      "Глинисті, а також великоуламкові з глинистим заповнювачем з показником текучості ґрунту або заповнювача IL <= 0.25",
    gammaC1: 1.25,
    gammaC2RigidRatio4: 1,
    gammaC2RigidRatio15: 1.1,
  },
  "clayey-il-025-05": {
    rowKey: "clayey-il-025-05",
    tableRow: "Те саме при 0.25 < IL <= 0.5",
    gammaC1: 1.2,
    gammaC2RigidRatio4: 1,
    gammaC2RigidRatio15: 1.1,
  },
  "clayey-il-gt-05": {
    rowKey: "clayey-il-gt-05",
    tableRow: "Те саме при IL > 0.5",
    gammaC1: 1.1,
    gammaC2RigidRatio4: 1,
    gammaC2RigidRatio15: 1,
  },
  "loose-sand": {
    rowKey: "loose-sand",
    tableRow: "Пухкі піски",
    gammaC1: 1,
    gammaC2RigidRatio4: 1,
    gammaC2RigidRatio15: 1,
  },
};

export const DBN_E8_COEFFICIENTS = [
  [0, 0, 1, 3.14],
  [1, 0.01, 1.06, 3.23],
  [2, 0.03, 1.12, 3.32],
  [3, 0.04, 1.18, 3.41],
  [4, 0.06, 1.25, 3.51],
  [5, 0.08, 1.32, 3.61],
  [6, 0.1, 1.39, 3.71],
  [7, 0.12, 1.47, 3.82],
  [8, 0.14, 1.55, 3.93],
  [9, 0.16, 1.64, 4.05],
  [10, 0.18, 1.73, 4.17],
  [11, 0.21, 1.83, 4.29],
  [12, 0.23, 1.94, 4.42],
  [13, 0.26, 2.05, 4.55],
  [14, 0.29, 2.17, 4.69],
  [15, 0.32, 2.3, 4.84],
  [16, 0.36, 2.43, 4.99],
  [17, 0.39, 2.57, 5.15],
  [18, 0.43, 2.73, 5.31],
  [19, 0.47, 2.89, 5.48],
  [20, 0.51, 3.06, 5.66],
  [21, 0.56, 3.24, 5.84],
  [22, 0.61, 3.44, 6.04],
  [23, 0.66, 3.65, 6.24],
  [24, 0.72, 3.87, 6.45],
  [25, 0.78, 4.11, 6.67],
  [26, 0.84, 4.37, 6.9],
  [27, 0.91, 4.64, 7.14],
  [28, 0.98, 4.93, 7.4],
  [29, 1.06, 5.25, 7.67],
  [30, 1.15, 5.59, 7.95],
  [31, 1.24, 5.95, 8.24],
  [32, 1.34, 6.34, 8.55],
  [33, 1.44, 6.76, 8.88],
  [34, 1.55, 7.22, 9.22],
  [35, 1.68, 7.71, 9.58],
  [36, 1.81, 8.24, 9.97],
  [37, 1.95, 8.81, 10.37],
  [38, 2.11, 9.44, 10.8],
  [39, 2.28, 10.11, 11.25],
  [40, 2.46, 10.85, 11.73],
  [41, 2.66, 11.64, 12.24],
  [42, 2.88, 12.51, 12.79],
  [43, 3.12, 13.46, 13.37],
  [44, 3.38, 14.5, 13.98],
  [45, 3.66, 15.64, 14.64],
].reduce(
  (accumulator, [phiDeg, mGamma, mQ, mC]) => ({
    ...accumulator,
    [phiDeg]: { phiDeg, mGamma, mQ, mC },
  }),
  {} as Record<number, { phiDeg: number; mGamma: number; mQ: number; mC: number }>,
);

export function formatSoilDesignResistanceNumber(
  value: number,
  maximumFractionDigits = 2,
): string {
  const displayValue = Number.isFinite(value) ? value + Number.EPSILON : value;

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
    minimumFractionDigits: 0,
    useGrouping: false,
  }).format(displayValue);
}

export function getLinearInterpolation(
  valueA: number,
  valueB: number,
  xA: number,
  xB: number,
  x: number,
): number {
  return valueA + ((valueB - valueA) * (x - xA)) / (xB - xA);
}

function getTableE7Row(
  input: Pick<SoilDesignResistanceInput, "soilType" | "liquidityIndex">,
): SoilTableE7Row {
  if (input.soilType === "loose-sand") return TABLE_E7_ROWS["loose-sand"];
  if (
    input.soilType === "coarse-with-sandy-fill" ||
    input.soilType === "gravelly-sand" ||
    input.soilType === "coarse-sand" ||
    input.soilType === "medium-sand"
  ) {
    return TABLE_E7_ROWS["coarse-sandy-and-non-small-non-dusty-sands"];
  }
  if (input.soilType === "small-sand") return TABLE_E7_ROWS["small-sands"];
  if (
    input.soilType === "dusty-sand-low-moisture" ||
    input.soilType === "dusty-sand-medium-moisture"
  ) {
    return TABLE_E7_ROWS["dusty-sands-low-medium-moisture"];
  }
  if (input.soilType === "dusty-sand-saturated") {
    return TABLE_E7_ROWS["dusty-sands-saturated"];
  }
  if (input.liquidityIndex <= 0.25) return TABLE_E7_ROWS["clayey-il-le-025"];
  if (input.liquidityIndex <= 0.5) return TABLE_E7_ROWS["clayey-il-025-05"];
  return TABLE_E7_ROWS["clayey-il-gt-05"];
}

export function getTableE7Coefficients(input: SoilDesignResistanceInput) {
  if (input.calculationMode === "manual-e7") {
    return {
      gammaC1: input.gammaC1Manual ?? Number.NaN,
      gammaC2: input.gammaC2Manual ?? Number.NaN,
      tableRow: "Коефіцієнти введені користувачем за табл. Е.7",
      gammaC2Source: "manual" as const,
      lengthHeightRatio: input.buildingLengthM / input.buildingHeightM,
    };
  }

  const tableRow = getTableE7Row(input);
  const lengthHeightRatio = input.buildingLengthM / input.buildingHeightM;

  if (input.soilType === "loose-sand") {
    return {
      gammaC1: 1,
      gammaC2: 1,
      tableRow: tableRow.tableRow,
      gammaC2Source: "loose-sand" as const,
      lengthHeightRatio,
      gammaC2AtRatio15: 1,
      gammaC2AtRatio4: 1,
    };
  }

  if (input.structuralScheme === "flexible") {
    return {
      gammaC1: tableRow.gammaC1,
      gammaC2: 1,
      tableRow: tableRow.tableRow,
      gammaC2Source: "flexible" as const,
      lengthHeightRatio,
      gammaC2AtRatio15: tableRow.gammaC2RigidRatio15,
      gammaC2AtRatio4: tableRow.gammaC2RigidRatio4,
    };
  }

  if (lengthHeightRatio <= 1.5) {
    return {
      gammaC1: tableRow.gammaC1,
      gammaC2: tableRow.gammaC2RigidRatio15,
      tableRow: tableRow.tableRow,
      gammaC2Source: "rigid-small" as const,
      lengthHeightRatio,
      gammaC2AtRatio15: tableRow.gammaC2RigidRatio15,
      gammaC2AtRatio4: tableRow.gammaC2RigidRatio4,
    };
  }

  if (lengthHeightRatio >= 4) {
    return {
      gammaC1: tableRow.gammaC1,
      gammaC2: tableRow.gammaC2RigidRatio4,
      tableRow: tableRow.tableRow,
      gammaC2Source: "rigid-large" as const,
      lengthHeightRatio,
      gammaC2AtRatio15: tableRow.gammaC2RigidRatio15,
      gammaC2AtRatio4: tableRow.gammaC2RigidRatio4,
    };
  }

  return {
    gammaC1: tableRow.gammaC1,
    gammaC2: getLinearInterpolation(
      tableRow.gammaC2RigidRatio15,
      tableRow.gammaC2RigidRatio4,
      1.5,
      4,
      lengthHeightRatio,
    ),
    tableRow: tableRow.tableRow,
    gammaC2Source: "rigid-interpolated" as const,
    lengthHeightRatio,
    gammaC2AtRatio15: tableRow.gammaC2RigidRatio15,
    gammaC2AtRatio4: tableRow.gammaC2RigidRatio4,
  };
}

export function getMGammaMqMc(phi11Deg: number) {
  const exact = DBN_E8_COEFFICIENTS[phi11Deg];
  if (exact) {
    return {
      phiA: phi11Deg,
      phiB: phi11Deg,
      exact: true,
      mGamma: exact.mGamma,
      mQ: exact.mQ,
      mC: exact.mC,
    };
  }

  const phiA = Math.floor(phi11Deg);
  const phiB = Math.ceil(phi11Deg);
  const rowA = DBN_E8_COEFFICIENTS[phiA];
  const rowB = DBN_E8_COEFFICIENTS[phiB];

  return {
    phiA,
    phiB,
    exact: false,
    mGamma: getLinearInterpolation(rowA.mGamma, rowB.mGamma, phiA, phiB, phi11Deg),
    mQ: getLinearInterpolation(rowA.mQ, rowB.mQ, phiA, phiB, phi11Deg),
    mC: getLinearInterpolation(rowA.mC, rowB.mC, phiA, phiB, phi11Deg),
  };
}

export function getKz(foundationWidthM: number) {
  if (foundationWidthM < 10) return { kz: 1, source: "narrow" as const };
  return {
    kz: Number.parseFloat((8 / foundationWidthM + 0.2).toFixed(12)),
    source: "wide" as const,
  };
}

export type SoilDesignResistanceValues = {
  lengthHeightRatio: number;
  gammaC1: number;
  gammaC2: number;
  k: number;
  mGamma: number;
  mQ: number;
  mC: number;
  kz: number;
  embedmentDepthRawD1M: number;
  basementDepthRawDbM: number;
  embedmentDepthCalcD1M: number;
  basementDepthCalcDbM: number;
  soilDesignResistanceKPa: number;
  soilDesignResistanceTonM2: number;
  soilDesignResistanceKgCm2: number;
};

export type SoilDesignResistanceReportStep = {
  key:
    | "inputs"
    | "length-height-ratio"
    | "structural-scheme"
    | "gamma-c"
    | "k"
    | "m-coefficients"
    | "kz"
    | "d1"
    | "d1-check"
    | "db"
    | "r"
    | "unit-conversion";
  caption: string;
  notes?: string[];
  formula?: string;
  formulas?: string[];
  items?: string[];
};

export type SoilDesignResistanceReport = {
  input: SoilDesignResistanceInput;
  valid: boolean;
  errors: string[];
  warnings: string[];
  values: SoilDesignResistanceValues | null;
  steps: SoilDesignResistanceReportStep[];
};

function isPositiveFinite(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

function isNonNegativeFinite(value: number): boolean {
  return Number.isFinite(value) && value >= 0;
}

function soilUsesLiquidityIndex(soilType: SoilType): boolean {
  return soilType === "coarse-with-clayey-fill" || soilType === "clayey-soil";
}

function getValidationErrors(input: SoilDesignResistanceInput): string[] {
  const errors: string[] = [];

  if (!Number.isFinite(input.phi11Deg) || input.phi11Deg < 0 || input.phi11Deg > 45) {
    errors.push(
      "φ11 має бути в межах 0...45°, оскільки табл. Е.8 ДБН В.2.1-10-2009 містить значення тільки для цього діапазону.",
    );
  }
  if (!isPositiveFinite(input.foundationWidthM)) errors.push("b має бути більше 0.");
  if (!isPositiveFinite(input.foundationDepthM)) errors.push("d має бути більше 0.");
  if (!isPositiveFinite(input.gamma11KnM3)) errors.push("γ11 має бути більше 0.");
  if (!isPositiveFinite(input.gammaPrime11KnM3)) errors.push("γ′11 має бути більше 0.");
  if (!isNonNegativeFinite(input.c11KPa)) errors.push("c11 має бути не менше 0.");

  if (input.calculationMode === "automatic" && input.structuralScheme === "rigid") {
    if (!isPositiveFinite(input.buildingLengthM)) errors.push("L має бути більше 0.");
    if (!isPositiveFinite(input.buildingHeightM)) errors.push("H має бути більше 0.");
  }
  if (
    input.calculationMode === "automatic" &&
    soilUsesLiquidityIndex(input.soilType) &&
    !Number.isFinite(input.liquidityIndex)
  ) {
    errors.push("IL має бути числом.");
  }
  if (input.calculationMode === "manual-e7") {
    if (!isPositiveFinite(input.gammaC1Manual ?? Number.NaN)) {
      errors.push("γc1 має бути більше 0.");
    }
    if (!isPositiveFinite(input.gammaC2Manual ?? Number.NaN)) {
      errors.push("γc2 має бути більше 0.");
    }
  }
  if (!input.hasBasement && !isPositiveFinite(input.embedmentDepthD1M)) {
    errors.push("d1 має бути більше 0.");
  }
  if (input.hasBasement) {
    if (!isNonNegativeFinite(input.basementDepthInputM)) {
      errors.push("db,input має бути не менше 0.");
    }
    if (!isNonNegativeFinite(input.soilLayerAboveFootingHsM)) {
      errors.push("hs має бути не менше 0.");
    }
    if (!isNonNegativeFinite(input.basementFloorThicknessHcfM)) {
      errors.push("hcf має бути не менше 0.");
    }
    if (!isNonNegativeFinite(input.basementFloorUnitWeightGammaCfKnM3)) {
      errors.push("γcf має бути не менше 0.");
    }
    if (
      input.basementFloorThicknessHcfM > 0 &&
      !isPositiveFinite(input.basementFloorUnitWeightGammaCfKnM3)
    ) {
      errors.push("γcf має бути більше 0, якщо задано hcf > 0.");
    }
    if (
      input.basementFloorUnitWeightGammaCfKnM3 > 0 &&
      !isPositiveFinite(input.basementFloorThicknessHcfM)
    ) {
      errors.push("hcf має бути більше 0, якщо задано γcf > 0.");
    }
  }

  return errors;
}

function format(value: number, digits = 2): string {
  return formatSoilDesignResistanceNumber(value, digits);
}

function formatInputQuantity(
  name: string,
  symbol: string,
  value: string,
  unit?: string,
): string {
  return `${name}: ${symbol} = ${value}${unit ? ` ${unit}` : ""}`;
}

function getInputItems(input: SoilDesignResistanceInput): string[] {
  const items = [
    `Спосіб розрахунку: ${
      input.calculationMode === "manual-e7"
        ? "вручну за табл. Е.7"
        : "автоматично за характеристиками ґрунту"
    }`,
    `Конструктивна схема споруди: ${
      input.structuralScheme === "rigid" ? "жорстка" : "гнучка"
    }`,
    formatInputQuantity("Довжина споруди", "L", format(input.buildingLengthM), "м"),
    formatInputQuantity("Висота споруди", "H", format(input.buildingHeightM), "м"),
    `Тип ґрунту: ${SOIL_TYPE_LABELS[input.soilType]}`,
  ];

  if (soilUsesLiquidityIndex(input.soilType)) {
    items.push(
      formatInputQuantity("Показник текучості", "IL", format(input.liquidityIndex)),
    );
  }

  items.push(
    formatInputQuantity("Кут внутрішнього тертя", "φ11", `${format(input.phi11Deg)}°`),
    formatInputQuantity(
      "Питома вага ґрунту нижче підошви",
      "γ11",
      format(input.gamma11KnM3),
      "кН/м³",
    ),
    formatInputQuantity(
      "Осереднена питома вага вище підошви",
      "γ′11",
      format(input.gammaPrime11KnM3),
      "кН/м³",
    ),
    formatInputQuantity("Питоме зчеплення", "c11", format(input.c11KPa), "кПа"),
    `Спосіб визначення φ11 і c11: ${
      input.strengthSource === "direct-testing"
        ? "визначені безпосередніми випробуваннями"
        : "прийняті за таблицями В.1-В.2"
    }`,
    formatInputQuantity("Ширина підошви", "b", format(input.foundationWidthM), "м"),
    formatInputQuantity("Глибина закладання", "d", format(input.foundationDepthM), "м"),
    `Підвал: ${input.hasBasement ? "є підвал" : "немає підвалу"}`,
  );

  if (input.hasBasement) {
    items.push(
      formatInputQuantity(
        "Глибина підвалу",
        "db,input",
        format(input.basementDepthInputM),
        "м",
      ),
      formatInputQuantity(
        "Шар ґрунту над підошвою",
        "hs",
        format(input.soilLayerAboveFootingHsM),
        "м",
      ),
      formatInputQuantity(
        "Товщина підлоги підвалу",
        "hcf",
        format(input.basementFloorThicknessHcfM),
        "м",
      ),
      formatInputQuantity(
        "Питома вага підлоги підвалу",
        "γcf",
        format(input.basementFloorUnitWeightGammaCfKnM3),
        "кН/м³",
      ),
    );
  } else {
    items.push(
      formatInputQuantity(
        "Приведена глибина закладання",
        "d1",
        format(input.embedmentDepthD1M),
        "м",
      ),
    );
  }

  if (input.calculationMode === "manual-e7") {
    items.push(
      formatInputQuantity(
        "Коефіцієнт умов роботи 1",
        "γc1",
        format(input.gammaC1Manual ?? 0),
      ),
    );
    items.push(
      formatInputQuantity(
        "Коефіцієнт умов роботи 2",
        "γc2",
        format(input.gammaC2Manual ?? 0),
      ),
    );
  }

  return items;
}

function getK(input: SoilDesignResistanceInput): number {
  return input.strengthSource === "direct-testing" ? 1 : 1.1;
}

function getBasementDepthRaw(input: SoilDesignResistanceInput): number {
  return input.hasBasement ? Math.min(input.basementDepthInputM, 2) : 0;
}

function getEmbedmentDepthRaw(input: SoilDesignResistanceInput): number {
  if (!input.hasBasement) return input.embedmentDepthD1M;
  return (
    input.soilLayerAboveFootingHsM +
    (input.basementFloorThicknessHcfM *
      input.basementFloorUnitWeightGammaCfKnM3) /
      input.gammaPrime11KnM3
  );
}

export function getSoilDesignResistanceReport(
  input: SoilDesignResistanceInput,
): SoilDesignResistanceReport {
  const baseSteps: SoilDesignResistanceReportStep[] = [
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

  const tableE7 = getTableE7Coefficients(input);
  const m = getMGammaMqMc(input.phi11Deg);
  const kz = getKz(input.foundationWidthM);
  const k = getK(input);
  const embedmentDepthRawD1M = getEmbedmentDepthRaw(input);
  const basementDepthRawDbM = getBasementDepthRaw(input);
  const note6Applies = embedmentDepthRawD1M > input.foundationDepthM;
  const embedmentDepthCalcD1M = note6Applies
    ? input.foundationDepthM
    : embedmentDepthRawD1M;
  const basementDepthCalcDbM = note6Applies ? 0 : basementDepthRawDbM;
  const soilDesignResistanceKPa =
    (tableE7.gammaC1 * tableE7.gammaC2) /
    k *
    (m.mGamma * kz.kz * input.foundationWidthM * input.gamma11KnM3 +
      m.mQ * embedmentDepthCalcD1M * input.gammaPrime11KnM3 +
      (m.mQ - 1) * basementDepthCalcDbM * input.gammaPrime11KnM3 +
      m.mC * input.c11KPa);
  const values: SoilDesignResistanceValues = {
    lengthHeightRatio: tableE7.lengthHeightRatio,
    gammaC1: tableE7.gammaC1,
    gammaC2: tableE7.gammaC2,
    k,
    mGamma: m.mGamma,
    mQ: m.mQ,
    mC: m.mC,
    kz: kz.kz,
    embedmentDepthRawD1M,
    basementDepthRawDbM,
    embedmentDepthCalcD1M,
    basementDepthCalcDbM,
    soilDesignResistanceKPa,
    soilDesignResistanceTonM2: soilDesignResistanceKPa / 10,
    soilDesignResistanceKgCm2: soilDesignResistanceKPa / 100,
  };
  const warnings: string[] = [];

  if (input.soilType === "loose-sand") {
    warnings.push(
      "Для пухких пісків значення R, знайдене за формулою (Е.1) при γc1 = 1.0 та γc2 = 1.0, повинно уточнюватись за результатами випробувань штампами згідно з приміткою 7 до п. Е.4 ДБН В.2.1-10-2009.",
    );
  }
  if (input.calculationMode === "manual-e7") {
    warnings.push(
      "γc1 і γc2 прийняті користувачем вручну за табл. Е.7; перевірте відповідність обраних значень фактичному типу ґрунту, конструктивній схемі та L/H.",
    );
  }
  if (note6Applies) {
    warnings.push(
      "Оскільки d1 > d, у формулі (Е.1) прийнято d1 = d і db = 0 згідно з приміткою 6 до п. Е.4 ДБН В.2.1-10-2009.",
    );
  }

  const steps: SoilDesignResistanceReportStep[] = [...baseSteps];

  if (input.calculationMode === "automatic" && input.structuralScheme === "rigid") {
    steps.push({
      key: "length-height-ratio",
      caption:
        "Визначення відношення довжини споруди або її відсіку до висоти для табл. Е.7 ДБН В.2.1-10-2009:",
      formula: `L/H = L / H = ${format(input.buildingLengthM)} / ${format(
        input.buildingHeightM,
      )} = ${format(values.lengthHeightRatio)}`,
    });
  }

  if (input.calculationMode === "automatic") {
    const soilLabel = SOIL_TYPE_LABELS[input.soilType];
    const ilText = soilUsesLiquidityIndex(input.soilType)
      ? `, IL = ${format(input.liquidityIndex)}`
      : "";
    let structuralNotes = [
      "Конструктивна схема: гнучка. γc2 приймається згідно з приміткою 2 до табл. Е.7.",
    ];
    let structuralFormula = "γc2 = 1.0";

    if (input.structuralScheme === "rigid" && tableE7.gammaC2Source === "rigid-small") {
      structuralNotes = [`Конструктивна схема: жорстка. Для ґрунту "${soilLabel}"${ilText}, L/H = ${format(
        values.lengthHeightRatio,
      )} <= 1.5, тому γc2 приймається за графою "1,5 і менше" табл. Е.7.`];
      structuralFormula = `γc2 = ${format(values.gammaC2)}`;
    }
    if (input.structuralScheme === "rigid" && tableE7.gammaC2Source === "rigid-large") {
      structuralNotes = [`Конструктивна схема: жорстка. Для ґрунту "${soilLabel}"${ilText}, L/H = ${format(
        values.lengthHeightRatio,
      )} >= 4, тому γc2 приймається за графою "4 і більше" табл. Е.7.`];
      structuralFormula = `γc2 = ${format(values.gammaC2)}`;
    }
    if (
      input.structuralScheme === "rigid" &&
      tableE7.gammaC2Source === "rigid-interpolated"
    ) {
      structuralNotes = [`Конструктивна схема: жорстка. Для ґрунту "${soilLabel}"${ilText}, L/H = ${format(
        values.lengthHeightRatio,
      )} коефіцієнт γc2 визначається інтерполяцією згідно з приміткою 3 до табл. Е.7.`];
      structuralFormula = `γc2 = γc2,1.5 + (γc2,4 - γc2,1.5) * (L/H - 1.5) / (4 - 1.5) = ${format(
        tableE7.gammaC2AtRatio15 ?? 0,
      )} + (${format(tableE7.gammaC2AtRatio4 ?? 0)} - ${format(
        tableE7.gammaC2AtRatio15 ?? 0,
      )}) * (${format(values.lengthHeightRatio)} - 1.5) / 2.5 = ${format(
        values.gammaC2,
      )}`;
    }
    if (input.structuralScheme === "rigid" && tableE7.gammaC2Source === "loose-sand") {
      structuralNotes = [
        `Конструктивна схема: жорстка. Для ґрунту "${soilLabel}" коефіцієнт γc2 приймається за рядком табл. Е.7 для пухких пісків.`,
      ];
      structuralFormula = `γc2 = ${format(values.gammaC2)}`;
    }

    steps.push({
      key: "structural-scheme",
      caption:
        "Конструктивна схема споруди згідно з примітками 1-3 до табл. Е.7 ДБН В.2.1-10-2009:",
      notes: structuralNotes,
      formula: structuralFormula,
    });
  }

  steps.push({
    key: "gamma-c",
    caption:
      input.calculationMode === "manual-e7"
        ? "Прийняття коефіцієнтів умов роботи γc1 і γc2 користувачем за табл. Е.7 ДБН В.2.1-10-2009:"
        : "Визначення коефіцієнтів умов роботи γc1 і γc2 за фактичним типом ґрунту згідно з табл. Е.7 ДБН В.2.1-10-2009:",
    formula:
      input.calculationMode === "manual-e7"
        ? `γc1 = ${format(values.gammaC1)}; γc2 = ${format(values.gammaC2)}`
        : `γc1 = ${format(values.gammaC1)}; γc2 = ${format(values.gammaC2)}`,
    notes:
      input.calculationMode === "manual-e7"
        ? undefined
        : [
            `Для ґрунту "${SOIL_TYPE_LABELS[input.soilType]}"${
              soilUsesLiquidityIndex(input.soilType)
                ? `, IL = ${format(input.liquidityIndex)}`
                : ""
            } використовується рядок табл. Е.7: "${tableE7.tableRow}". Коефіцієнт γc2 приймається за результатом блоку "Конструктивна схема споруди".`,
          ],
  });

  steps.push({
    key: "k",
    caption:
      "Визначення коефіцієнта k за способом визначення φ11 і c11 згідно з п. Е.4 ДБН В.2.1-10-2009:",
    formula:
      input.strengthSource === "direct-testing"
        ? "k = 1.0"
        : "k = 1.1",
    notes: [
      input.strengthSource === "direct-testing"
        ? "φ11 і c11 визначені безпосередніми випробуваннями, тому згідно з п. Е.4 ДБН В.2.1-10-2009 приймається k = 1.0."
        : "φ11 і c11 прийняті за таблицями В.1-В.2, тому згідно з п. Е.4 ДБН В.2.1-10-2009 приймається k = 1.1.",
    ],
  });

  steps.push({
    key: "m-coefficients",
    caption:
      "Визначення коефіцієнтів Mγ, Mq, Mc за кутом внутрішнього тертя φ11 згідно з табл. Е.8 ДБН В.2.1-10-2009:",
    notes: m.exact
      ? [
          `Для φ11 = ${format(
            input.phi11Deg,
          )}° коефіцієнти Mγ, Mq, Mc приймаються за табл. Е.8 ДБН В.2.1-10-2009.`,
        ]
      : [
          `φ11 = ${format(input.phi11Deg)}° знаходиться між φa = ${
            m.phiA
          }° і φb = ${
            m.phiB
          }°. Коефіцієнти Mγ, Mq, Mc визначаються лінійною інтерполяцією за табл. Е.8 ДБН В.2.1-10-2009.`,
        ],
    formula: m.exact
      ? `Mγ = ${format(values.mGamma)}; Mq = ${format(values.mQ)}; Mc = ${format(
          values.mC,
        )}`
      : undefined,
    formulas: m.exact
      ? undefined
      : [
          `Mγ = Mγ,a + (Mγ,b - Mγ,a) * (φ11 - φa) / (φb - φa) = ${format(
            DBN_E8_COEFFICIENTS[m.phiA].mGamma,
          )} + (${format(DBN_E8_COEFFICIENTS[m.phiB].mGamma)} - ${format(
            DBN_E8_COEFFICIENTS[m.phiA].mGamma,
          )}) * (${format(input.phi11Deg)} - ${m.phiA}) / (${m.phiB} - ${
            m.phiA
          }) = ${format(values.mGamma)}`,
          `Mq = Mq,a + (Mq,b - Mq,a) * (φ11 - φa) / (φb - φa) = ${format(
            DBN_E8_COEFFICIENTS[m.phiA].mQ,
          )} + (${format(DBN_E8_COEFFICIENTS[m.phiB].mQ)} - ${format(
            DBN_E8_COEFFICIENTS[m.phiA].mQ,
          )}) * (${format(input.phi11Deg)} - ${m.phiA}) / (${m.phiB} - ${
            m.phiA
          }) = ${format(values.mQ)}`,
          `Mc = Mc,a + (Mc,b - Mc,a) * (φ11 - φa) / (φb - φa) = ${format(
            DBN_E8_COEFFICIENTS[m.phiA].mC,
          )} + (${format(DBN_E8_COEFFICIENTS[m.phiB].mC)} - ${format(
            DBN_E8_COEFFICIENTS[m.phiA].mC,
          )}) * (${format(input.phi11Deg)} - ${m.phiA}) / (${m.phiB} - ${
            m.phiA
          }) = ${format(values.mC)}`,
        ],
  });

  steps.push({
    key: "kz",
    caption:
      "Визначення коефіцієнта kz за шириною підошви фундаменту b згідно з п. Е.4 ДБН В.2.1-10-2009:",
    formula:
      kz.source === "narrow"
        ? "kz = 1.0"
        : `kz = z0 / b + 0.2 = 8 / ${format(input.foundationWidthM)} + 0.2 = ${format(
            values.kz,
          )}`,
    notes: [
      kz.source === "narrow"
        ? `Оскільки b = ${format(
            input.foundationWidthM,
          )} м < 10 м, згідно з п. Е.4 ДБН В.2.1-10-2009 приймається kz = 1.0.`
        : `Оскільки b = ${format(
            input.foundationWidthM,
          )} м >= 10 м, коефіцієнт kz визначається за залежністю з п. Е.4 ДБН В.2.1-10-2009.`,
    ],
  });

  steps.push({
    key: "d1",
    caption: input.hasBasement
      ? "Визначення приведеної глибини закладання d1 для споруди з підвалом згідно з формулою (Е.2) ДБН В.2.1-10-2009:"
      : "Глибина закладання d1 для безпідвальної споруди згідно з п. Е.4 ДБН В.2.1-10-2009:",
    formula: input.hasBasement
      ? `d1 = hs + hcf * γcf / γ′11 = ${format(
          input.soilLayerAboveFootingHsM,
        )} + ${format(input.basementFloorThicknessHcfM)} * ${format(
          input.basementFloorUnitWeightGammaCfKnM3,
        )} / ${format(input.gammaPrime11KnM3)} = ${format(embedmentDepthRawD1M)} м`
      : `d1 = ${format(embedmentDepthRawD1M)} м`,
  });

  steps.push({
    key: "d1-check",
    caption:
      "Перевірка умови d1 <= d згідно з приміткою 6 до п. Е.4 ДБН В.2.1-10-2009:",
    formula: note6Applies
      ? `d1 > d => ${format(embedmentDepthRawD1M)} > ${format(
          input.foundationDepthM,
        )}`
      : `d1 <= d => ${format(embedmentDepthRawD1M)} <= ${format(
          input.foundationDepthM,
        )}`,
    notes: [
      note6Applies
        ? `Умова d1 <= d не виконується. Згідно з приміткою 6 до п. Е.4 ДБН В.2.1-10-2009 для подальшого розрахунку за формулою (Е.1) приймаються d1 = d = ${format(
            embedmentDepthCalcD1M,
          )} м і db = 0 м.`
        : `Умова d1 <= d виконується. Для подальшого розрахунку за формулою (Е.1) приймаються d1 = ${format(
            embedmentDepthCalcD1M,
          )} м і db = ${format(basementDepthCalcDbM)} м.`,
    ],
  });

  if (input.hasBasement && !note6Applies) {
    steps.push({
      key: "db",
      caption:
        "Визначення розрахункової глибини підвалу db згідно з п. Е.4 ДБН В.2.1-10-2009:",
      formula:
        input.basementDepthInputM <= 2
          ? `db = ${format(basementDepthCalcDbM)} м`
          : `db = min(db,input; 2.0) = min(${format(
              input.basementDepthInputM,
            )}; 2.0) = 2.0 м`,
    });
  }

  steps.push({
    key: "r",
    caption:
      "Визначення розрахункового опору ґрунту основи R згідно з п. Е.4, формула (Е.1) ДБН В.2.1-10-2009:",
    formula: `R = γc1 * γc2 / k * [Mγ * kz * b * γ11 + Mq * d1 * γ′11 + (Mq - 1) * db * γ′11 + Mc * c11] = ${format(
      values.gammaC1,
    )} * ${format(values.gammaC2)} / ${format(values.k)} * [${format(
      values.mGamma,
    )} * ${format(values.kz)} * ${format(input.foundationWidthM)} * ${format(
      input.gamma11KnM3,
    )} + ${format(values.mQ)} * ${format(values.embedmentDepthCalcD1M)} * ${format(
      input.gammaPrime11KnM3,
    )} + (${format(values.mQ)} - 1) * ${format(
      values.basementDepthCalcDbM,
    )} * ${format(input.gammaPrime11KnM3)} + ${format(values.mC)} * ${format(
      input.c11KPa,
    )}] = ${format(values.soilDesignResistanceKPa)} кПа`,
  });

  steps.push({
    key: "unit-conversion",
    caption: "Переведення розрахункового опору R у додаткові одиниці:",
    formula: `R = ${format(values.soilDesignResistanceKPa)} кПа = ${format(
      values.soilDesignResistanceTonM2,
      1,
    )} т/м² = ${format(values.soilDesignResistanceKgCm2, 1)} кг/см²`,
  });

  return {
    input,
    valid: true,
    errors,
    warnings,
    values,
    steps,
  };
}
