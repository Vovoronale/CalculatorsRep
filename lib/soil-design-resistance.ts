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
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
    minimumFractionDigits: 0,
    useGrouping: false,
  }).format(value);
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
