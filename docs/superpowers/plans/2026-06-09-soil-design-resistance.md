# Soil Design Resistance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a native calculator for `Розрахунковий опір ґрунту основи` with an agreed DBN appendix Е report and MQN-compatible default result.

**Architecture:** Put all engineering logic, DBN tables, validation, interpolation, formatting, and report construction in `lib/soil-design-resistance.ts`. Keep React in `components/calculators/soil-design-resistance-calculator.tsx` responsible only for state, input normalization, conditional fields, mathematical rendering, and report display. Register the calculator through the existing native-calculator path in `lib/calculators.ts`, `components/calculator-shell.tsx`, and `data/content.json`.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest, Testing Library, existing `MathNotation` component, existing catalog/content JSON loader.

---

## Canonical References

- Design spec: `docs/superpowers/specs/2026-06-09-soil-design-resistance-design.md`
- Report contract: `docs/superpowers/specs/2026-06-09-soil-design-resistance-report-contract.md`
- Native calculator guide: `docs/calculation-reporting-guide.md`
- Local DBN source: `docs/DBN/dbn_V.2.1-10-2009.pdf`
- MQN example: `https://www.mqn.com.ua/foundations-R.php`

The report contract is authoritative for report captions, display conditions, and formula strings. Do not change report wording during implementation unless the contract is updated first.

## File Map

- Create `lib/soil-design-resistance.ts`: DBN table data, input/report types, interpolation helpers, validation, warnings, result values, report steps, formatting.
- Create `lib/soil-design-resistance.test.ts`: unit tests for table Е.7 mapping, `γc2` interpolation, table Е.8 interpolation, `k`, `kz`, `d1/db`, formula Е.1, warnings, invalid input, report order and exact formula strings.
- Create `components/calculators/soil-design-resistance-calculator.tsx`: UI form, dynamic fields, result summary, report rendering, normative references.
- Modify `lib/calculators.ts`: add `soil-design-resistance` to the `nativeCalculator` union.
- Modify `components/calculator-shell.tsx`: import and render `SoilDesignResistanceCalculator`.
- Modify `components/calculator-shell.test.tsx`: smoke test for rendered native calculator and catalog detail behavior.
- Modify `data/content.json`: add catalog entry.
- Modify `app/globals.css`: calculator-specific layout and report styles, following existing native calculator classes.

## Task 1: Core Types, Tables, and Numeric Helpers

**Files:**
- Create: `lib/soil-design-resistance.ts`
- Create: `lib/soil-design-resistance.test.ts`

- [ ] **Step 1: Write failing tests for table constants and interpolation helpers**

Create `lib/soil-design-resistance.test.ts` with:

```ts
import { describe, expect, it } from "vitest";

import {
  DBN_E8_COEFFICIENTS,
  formatSoilDesignResistanceNumber,
  getLinearInterpolation,
  getMGammaMqMc,
  getTableE7Coefficients,
  getKz,
  type SoilDesignResistanceInput,
} from "@/lib/soil-design-resistance";

const baseInput: SoilDesignResistanceInput = {
  calculationMode: "manual-e7",
  structuralScheme: "rigid",
  buildingLengthM: 24,
  buildingHeightM: 6,
  soilType: "medium-sand",
  liquidityIndex: 0,
  gammaC1Manual: 1,
  gammaC2Manual: 1,
  phi11Deg: 30,
  gamma11KnM3: 17.1,
  gammaPrime11KnM3: 16.6,
  c11KPa: 4,
  strengthSource: "direct-testing",
  foundationWidthM: 1,
  foundationDepthM: 1.2,
  hasBasement: false,
  embedmentDepthD1M: 1.2,
  basementDepthInputM: 0,
  soilLayerAboveFootingHsM: 0,
  basementFloorThicknessHcfM: 0,
  basementFloorUnitWeightGammaCfKnM3: 0,
};

describe("soil design resistance table helpers", () => {
  it("formats numbers with stable engineering output", () => {
    expect(formatSoilDesignResistanceNumber(162.82, 1)).toBe("162.8");
    expect(formatSoilDesignResistanceNumber(16.282, 1)).toBe("16.3");
    expect(formatSoilDesignResistanceNumber(1.6282, 1)).toBe("1.6");
  });

  it("interpolates linearly", () => {
    expect(getLinearInterpolation(1.2, 1.4, 1.5, 4, 2.75)).toBeCloseTo(1.3, 10);
  });

  it("contains the DBN table E8 row for phi11 = 30 degrees", () => {
    expect(DBN_E8_COEFFICIENTS[30]).toEqual({
      phiDeg: 30,
      mGamma: 1.15,
      mQ: 5.59,
      mC: 7.95,
    });
  });

  it("returns exact table E8 coefficients for integer phi11", () => {
    expect(getMGammaMqMc(30)).toEqual({
      phiA: 30,
      phiB: 30,
      exact: true,
      mGamma: 1.15,
      mQ: 5.59,
      mC: 7.95,
    });
  });

  it("interpolates table E8 coefficients for non-integer phi11", () => {
    const result = getMGammaMqMc(30.5);

    expect(result.exact).toBe(false);
    expect(result.phiA).toBe(30);
    expect(result.phiB).toBe(31);
    expect(result.mGamma).toBeCloseTo(1.195, 10);
    expect(result.mQ).toBeCloseTo(5.77, 10);
    expect(result.mC).toBeCloseTo(8.095, 10);
  });

  it("maps actual soil type to table E7 coefficients", () => {
    expect(
      getTableE7Coefficients({
        ...baseInput,
        calculationMode: "automatic",
        structuralScheme: "rigid",
        soilType: "medium-sand",
        buildingLengthM: 24,
        buildingHeightM: 6,
      }),
    ).toMatchObject({
      gammaC1: 1.4,
      gammaC2: 1.2,
      tableRow:
        "Великоуламкові з піщаним заповнювачем і піщані, крім дрібних і пилуватих",
      gammaC2Source: "rigid-large",
    });
  });

  it("interpolates gammaC2 for rigid schemes when 1.5 < L/H < 4", () => {
    const result = getTableE7Coefficients({
      ...baseInput,
      calculationMode: "automatic",
      structuralScheme: "rigid",
      soilType: "small-sand",
      buildingLengthM: 8.25,
      buildingHeightM: 3,
    });

    expect(result.lengthHeightRatio).toBeCloseTo(2.75, 10);
    expect(result.gammaC1).toBe(1.3);
    expect(result.gammaC2).toBeCloseTo(1.2, 10);
    expect(result.gammaC2AtRatio15).toBe(1.3);
    expect(result.gammaC2AtRatio4).toBe(1.1);
    expect(result.gammaC2Source).toBe("rigid-interpolated");
  });

  it("sets gammaC2 to 1.0 for flexible structural schemes", () => {
    expect(
      getTableE7Coefficients({
        ...baseInput,
        calculationMode: "automatic",
        structuralScheme: "flexible",
        soilType: "dusty-sand-saturated",
      }),
    ).toMatchObject({
      gammaC1: 1.1,
      gammaC2: 1,
      gammaC2Source: "flexible",
    });
  });

  it("sets loose sand coefficients to 1.0", () => {
    expect(
      getTableE7Coefficients({
        ...baseInput,
        calculationMode: "automatic",
        soilType: "loose-sand",
      }),
    ).toMatchObject({
      gammaC1: 1,
      gammaC2: 1,
      tableRow: "Пухкі піски",
      gammaC2Source: "loose-sand",
    });
  });

  it("computes kz from foundation width", () => {
    expect(getKz(9.99)).toEqual({ kz: 1, source: "narrow" });
    expect(getKz(20)).toEqual({ kz: 0.6, source: "wide" });
  });
});
```

- [ ] **Step 2: Run the failing tests**

Run:

```bash
npm run test -- lib/soil-design-resistance.test.ts
```

Expected: fail with module/export errors because `lib/soil-design-resistance.ts` does not exist.

- [ ] **Step 3: Create core helper implementation**

Create `lib/soil-design-resistance.ts` with:

```ts
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

function getTableE7Row(input: Pick<SoilDesignResistanceInput, "soilType" | "liquidityIndex">) {
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
    return { ...exact, phiA: phi11Deg, phiB: phi11Deg, exact: true };
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
  return { kz: 8 / foundationWidthM + 0.2, source: "wide" as const };
}
```

- [ ] **Step 4: Run the tests again**

Run:

```bash
npm run test -- lib/soil-design-resistance.test.ts
```

Expected: PASS for the helper tests.

- [ ] **Step 5: Commit core helpers**

Run:

```bash
git add lib/soil-design-resistance.ts lib/soil-design-resistance.test.ts
git commit -m "Add soil design resistance table helpers"
```

## Task 2: Report Core and Formula Contract Tests

**Files:**
- Modify: `lib/soil-design-resistance.ts`
- Modify: `lib/soil-design-resistance.test.ts`

- [ ] **Step 1: Add failing tests for report values, warnings, and exact agreed formulas**

Append to `lib/soil-design-resistance.test.ts`:

```ts
import { getSoilDesignResistanceReport } from "@/lib/soil-design-resistance";

describe("soil design resistance report", () => {
  it("reproduces the MQN default example", () => {
    const report = getSoilDesignResistanceReport(baseInput);

    expect(report.valid).toBe(true);
    expect(report.values?.soilDesignResistanceKPa).toBeCloseTo(162.82, 2);
    expect(report.values?.soilDesignResistanceTonM2).toBeCloseTo(16.282, 3);
    expect(report.values?.soilDesignResistanceKgCm2).toBeCloseTo(1.6282, 4);
    expect(report.steps.map((step) => step.key)).toEqual([
      "inputs",
      "gamma-c",
      "k",
      "m-coefficients",
      "kz",
      "d1",
      "d1-check",
      "r",
      "unit-conversion",
    ]);
    expect(report.steps.find((step) => step.key === "r")?.formula).toBe(
      "R = γc1 * γc2 / k * [Mγ * kz * b * γ11 + Mq * d1 * γ′11 + (Mq - 1) * db * γ′11 + Mc * c11] = 1 * 1 / 1 * [1.15 * 1 * 1 * 17.1 + 5.59 * 1.2 * 16.6 + (5.59 - 1) * 0 * 16.6 + 7.95 * 4] = 162.82 кПа",
    );
    expect(report.steps.find((step) => step.key === "unit-conversion")?.formula).toBe(
      "R = 162.82 кПа = 16.3 т/м² = 1.6 кг/см²",
    );
  });

  it("builds automatic rigid interpolation report steps", () => {
    const report = getSoilDesignResistanceReport({
      ...baseInput,
      calculationMode: "automatic",
      structuralScheme: "rigid",
      soilType: "small-sand",
      buildingLengthM: 8.25,
      buildingHeightM: 3,
    });

    expect(report.steps.map((step) => step.key).slice(0, 4)).toEqual([
      "inputs",
      "length-height-ratio",
      "structural-scheme",
      "gamma-c",
    ]);
    expect(report.steps.find((step) => step.key === "length-height-ratio")?.formula).toBe(
      "L/H = L / H = 8.25 / 3 = 2.75",
    );
    expect(report.steps.find((step) => step.key === "structural-scheme")?.formula).toBe(
      "Конструктивна схема: жорстка; для ґрунту \"Пісок дрібний\", L/H = 2.75 коефіцієнт γc2 визначаємо інтерполяцією згідно з приміткою 3 до табл. Е.7; γc2 = γc2,1.5 + (γc2,4 - γc2,1.5) * (L/H - 1.5) / (4 - 1.5) = 1.3 + (1.1 - 1.3) * (2.75 - 1.5) / 2.5 = 1.2",
    );
  });

  it("builds basement d1 and db steps", () => {
    const report = getSoilDesignResistanceReport({
      ...baseInput,
      hasBasement: true,
      soilLayerAboveFootingHsM: 0.4,
      basementFloorThicknessHcfM: 0.2,
      basementFloorUnitWeightGammaCfKnM3: 22,
      gammaPrime11KnM3: 16,
      basementDepthInputM: 2.6,
      foundationDepthM: 1.2,
    });

    expect(report.steps.find((step) => step.key === "d1")?.formula).toBe(
      "d1 = hs + hcf * γcf / γ′11 = 0.4 + 0.2 * 22 / 16 = 0.68 м",
    );
    expect(report.steps.find((step) => step.key === "db")?.formula).toBe(
      "db = min(db,input; 2.0) = min(2.6; 2.0) = 2.0 м",
    );
  });

  it("applies note 6 when d1 is greater than d", () => {
    const report = getSoilDesignResistanceReport({
      ...baseInput,
      foundationDepthM: 1,
      embedmentDepthD1M: 1.5,
    });

    expect(report.warnings).toContain(
      "Оскільки d1 > d, у формулі (Е.1) прийнято d1 = d і db = 0 згідно з приміткою 6 до п. Е.4 ДБН В.2.1-10-2009.",
    );
    expect(report.steps.find((step) => step.key === "d1-check")?.formula).toBe(
      "d1 > d => 1.5 > 1; у формулі (Е.1) приймаємо d1 = d = 1 м, db = 0 м",
    );
  });

  it("returns stable invalid report without NaN formulas", () => {
    const report = getSoilDesignResistanceReport({
      ...baseInput,
      phi11Deg: 46,
      foundationWidthM: 0,
    });

    expect(report.valid).toBe(false);
    expect(report.values).toBeNull();
    expect(report.errors).toContain(
      "φ11 має бути в межах 0...45°, оскільки табл. Е.8 ДБН В.2.1-10-2009 містить значення тільки для цього діапазону.",
    );
    expect(report.errors).toContain("b має бути більше 0.");
    expect(report.steps).toHaveLength(1);
    expect(JSON.stringify(report.steps)).not.toContain("NaN");
  });
});
```

- [ ] **Step 2: Run the failing report tests**

Run:

```bash
npm run test -- lib/soil-design-resistance.test.ts
```

Expected: fail because `getSoilDesignResistanceReport` and report types are not implemented.

- [ ] **Step 3: Add report types, validation, values, warnings, and step generation**

Append and integrate this code into `lib/soil-design-resistance.ts` after the helper functions:

```ts
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
  formula?: string;
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
    `L = ${format(input.buildingLengthM)} м`,
    `H = ${format(input.buildingHeightM)} м`,
    `Тип ґрунту: ${SOIL_TYPE_LABELS[input.soilType]}`,
  ];

  if (soilUsesLiquidityIndex(input.soilType)) {
    items.push(`IL = ${format(input.liquidityIndex)}`);
  }

  items.push(
    `φ11 = ${format(input.phi11Deg)}°`,
    `γ11 = ${format(input.gamma11KnM3)} кН/м³`,
    `γ′11 = ${format(input.gammaPrime11KnM3)} кН/м³`,
    `c11 = ${format(input.c11KPa)} кПа`,
    `Спосіб визначення φ11 і c11: ${
      input.strengthSource === "direct-testing"
        ? "визначені безпосередніми випробуваннями"
        : "прийняті за таблицями В.1-В.2"
    }`,
    `b = ${format(input.foundationWidthM)} м`,
    `d = ${format(input.foundationDepthM)} м`,
    `Підвал: ${input.hasBasement ? "є підвал" : "немає підвалу"}`,
  );

  if (input.hasBasement) {
    items.push(
      `db,input = ${format(input.basementDepthInputM)} м`,
      `hs = ${format(input.soilLayerAboveFootingHsM)} м`,
      `hcf = ${format(input.basementFloorThicknessHcfM)} м`,
      `γcf = ${format(input.basementFloorUnitWeightGammaCfKnM3)} кН/м³`,
    );
  } else {
    items.push(`d1 = ${format(input.embedmentDepthD1M)} м`);
  }

  if (input.calculationMode === "manual-e7") {
    items.push(`γc1 = ${format(input.gammaC1Manual ?? 0)}`);
    items.push(`γc2 = ${format(input.gammaC2Manual ?? 0)}`);
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
    let structuralFormula =
      "Конструктивна схема: гнучка; γc2 = 1.0 згідно з приміткою 2 до табл. Е.7";

    if (input.structuralScheme === "rigid" && tableE7.gammaC2Source === "rigid-small") {
      structuralFormula = `Конструктивна схема: жорстка; для ґрунту "${soilLabel}"${ilText}, L/H = ${format(
        values.lengthHeightRatio,
      )} <= 1.5 приймаємо γc2 = ${format(values.gammaC2)} за графою "1,5 і менше" табл. Е.7`;
    }
    if (input.structuralScheme === "rigid" && tableE7.gammaC2Source === "rigid-large") {
      structuralFormula = `Конструктивна схема: жорстка; для ґрунту "${soilLabel}"${ilText}, L/H = ${format(
        values.lengthHeightRatio,
      )} >= 4 приймаємо γc2 = ${format(values.gammaC2)} за графою "4 і більше" табл. Е.7`;
    }
    if (
      input.structuralScheme === "rigid" &&
      tableE7.gammaC2Source === "rigid-interpolated"
    ) {
      structuralFormula = `Конструктивна схема: жорстка; для ґрунту "${soilLabel}"${ilText}, L/H = ${format(
        values.lengthHeightRatio,
      )} коефіцієнт γc2 визначаємо інтерполяцією згідно з приміткою 3 до табл. Е.7; γc2 = γc2,1.5 + (γc2,4 - γc2,1.5) * (L/H - 1.5) / (4 - 1.5) = ${format(
        tableE7.gammaC2AtRatio15 ?? 0,
      )} + (${format(tableE7.gammaC2AtRatio4 ?? 0)} - ${format(
        tableE7.gammaC2AtRatio15 ?? 0,
      )}) * (${format(values.lengthHeightRatio)} - 1.5) / 2.5 = ${format(
        values.gammaC2,
      )}`;
    }

    steps.push({
      key: "structural-scheme",
      caption:
        "Конструктивна схема споруди згідно з примітками 1-3 до табл. Е.7 ДБН В.2.1-10-2009:",
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
        : `Для ґрунту "${SOIL_TYPE_LABELS[input.soilType]}"${
            soilUsesLiquidityIndex(input.soilType)
              ? `, IL = ${format(input.liquidityIndex)}`
              : ""
          }, за рядком "${tableE7.tableRow}" приймаємо γc1 = ${format(
            values.gammaC1,
          )}; γc2 = ${format(values.gammaC2)} за результатом пункту "Конструктивна схема споруди"`,
  });

  steps.push({
    key: "k",
    caption:
      "Визначення коефіцієнта k за способом визначення φ11 і c11 згідно з п. Е.4 ДБН В.2.1-10-2009:",
    formula:
      input.strengthSource === "direct-testing"
        ? "k = 1.0, оскільки φ11 і c11 визначені безпосередніми випробуваннями"
        : "k = 1.1, оскільки φ11 і c11 прийняті за таблицями В.1-В.2",
  });

  steps.push({
    key: "m-coefficients",
    caption:
      "Визначення коефіцієнтів Mγ, Mq, Mc за кутом внутрішнього тертя φ11 згідно з табл. Е.8 ДБН В.2.1-10-2009:",
    formula: m.exact
      ? `φ11 = ${format(input.phi11Deg)}°; за табл. Е.8 приймаємо Mγ = ${format(
          values.mGamma,
        )}; Mq = ${format(values.mQ)}; Mc = ${format(values.mC)}`
      : `φ11 = ${format(input.phi11Deg)}° знаходиться між φa = ${
          m.phiA
        }° і φb = ${m.phiB}°; коефіцієнти визначаємо лінійною інтерполяцією за табл. Е.8; Mγ = Mγ,a + (Mγ,b - Mγ,a) * (φ11 - φa) / (φb - φa) = ${format(
          DBN_E8_COEFFICIENTS[m.phiA].mGamma,
        )} + (${format(DBN_E8_COEFFICIENTS[m.phiB].mGamma)} - ${format(
          DBN_E8_COEFFICIENTS[m.phiA].mGamma,
        )}) * (${format(input.phi11Deg)} - ${m.phiA}) / (${m.phiB} - ${
          m.phiA
        }) = ${format(values.mGamma)}; Mq = Mq,a + (Mq,b - Mq,a) * (φ11 - φa) / (φb - φa) = ${format(
          DBN_E8_COEFFICIENTS[m.phiA].mQ,
        )} + (${format(DBN_E8_COEFFICIENTS[m.phiB].mQ)} - ${format(
          DBN_E8_COEFFICIENTS[m.phiA].mQ,
        )}) * (${format(input.phi11Deg)} - ${m.phiA}) / (${m.phiB} - ${
          m.phiA
        }) = ${format(values.mQ)}; Mc = Mc,a + (Mc,b - Mc,a) * (φ11 - φa) / (φb - φa) = ${format(
          DBN_E8_COEFFICIENTS[m.phiA].mC,
        )} + (${format(DBN_E8_COEFFICIENTS[m.phiB].mC)} - ${format(
          DBN_E8_COEFFICIENTS[m.phiA].mC,
        )}) * (${format(input.phi11Deg)} - ${m.phiA}) / (${m.phiB} - ${
          m.phiA
        }) = ${format(values.mC)}`,
  });

  steps.push({
    key: "kz",
    caption:
      "Визначення коефіцієнта kz за шириною підошви фундаменту b згідно з п. Е.4 ДБН В.2.1-10-2009:",
    formula:
      kz.source === "narrow"
        ? `b = ${format(input.foundationWidthM)} м < 10 м; kz = 1.0`
        : `kz = z0 / b + 0.2 = 8 / ${format(input.foundationWidthM)} + 0.2 = ${format(values.kz)}`,
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
        )}; у формулі (Е.1) приймаємо d1 = d = ${format(
          embedmentDepthCalcD1M,
        )} м, db = 0 м`
      : `d1 <= d => ${format(embedmentDepthRawD1M)} <= ${format(
          input.foundationDepthM,
        )} - умова виконується; у формулі (Е.1) приймаємо d1 = ${format(
          embedmentDepthCalcD1M,
        )} м, db = ${format(basementDepthCalcDbM)} м`,
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
```

- [ ] **Step 4: Run report tests**

Run:

```bash
npm run test -- lib/soil-design-resistance.test.ts
```

Expected: PASS. If an exact formula string fails, update implementation to match `docs/superpowers/specs/2026-06-09-soil-design-resistance-report-contract.md`, not the test expectation.

- [ ] **Step 5: Commit report core**

Run:

```bash
git add lib/soil-design-resistance.ts lib/soil-design-resistance.test.ts
git commit -m "Add soil design resistance report core"
```

## Task 3: Catalog Registration

**Files:**
- Modify: `lib/calculators.ts`
- Modify: `components/calculator-shell.tsx`
- Modify: `data/content.json`
- Modify: `lib/calculators.test.ts`

- [ ] **Step 1: Add failing catalog tests**

Append to `lib/calculators.test.ts`:

```ts
  it("registers the soil design resistance native calculator", () => {
    const calculator = getCalculatorBySlug("soil-design-resistance");

    expect(calculator).toMatchObject({
      slug: "soil-design-resistance",
      title: "Розрахунковий опір ґрунту основи",
      shortDescription:
        "Обчислення розрахункового опору ґрунту основи R за додатком Е ДБН В.2.1-10-2009.",
      mainCategory: "fundamenty",
      extraCategories: ["perevirka-dbn", "normatyvni-obgruntuvannya"],
      displayMode: "native",
      nativeCalculator: "soil-design-resistance",
      accessLabel: "Нативний розрахунок",
      openUrl: "/calculator/soil-design-resistance",
      standard: "ДБН В.2.1-10-2009, додаток Е",
    });
  });
```

Modify the existing `places each calculator in exactly one primary category without extra category duplication` test to allow this calculator's deliberate extra categories:

```ts
  it("places calculators in valid categories without accidental extra category duplication", () => {
    const categorySlugs = new Set(calculatorCategories.map((category) => category.slug));

    for (const calculator of calculators) {
      expect(categorySlugs.has(calculator.mainCategory), calculator.slug).toBe(true);
      for (const extraCategory of calculator.extraCategories) {
        expect(categorySlugs.has(extraCategory), `${calculator.slug}:${extraCategory}`).toBe(true);
      }
    }

    expect(
      calculators
        .filter((calculator) => calculator.slug !== "soil-design-resistance")
        .flatMap((calculator) => calculator.extraCategories),
    ).toHaveLength(0);
  });
```

Modify the existing `allows empty prepared subcategories while keeping top-level categories populated` test so the newly populated DBN-check category is explicit:

```ts
  it("allows empty prepared subcategories while keeping top-level categories populated", () => {
    const topLevelCategories = calculatorCategories.filter((category) => !category.parentSlug);

    for (const category of topLevelCategories) {
      expect(getCalculatorsForCategory(category.slug).length, category.slug).toBeGreaterThan(0);
    }

    expect(getCalculatorsForCategory("perevirka-dbn").map((calculator) => calculator.slug)).toEqual([
      "soil-design-resistance",
    ]);
    expect(getCalculatorsForCategory("asystenty-pidhotovky-poyasnen")).toHaveLength(0);
  });
```

Modify category-count expectations in `components/calculator-shell.test.tsx` after the calculator is registered:

```tsx
    expect(
      within(rail).getByRole("button", { name: "Розгорнути Конструкції" }),
    ).toHaveAttribute("aria-expanded", "false");
```

In `components/calculator-shell.test.tsx`, change the existing category click from:

```tsx
    await user.click(screen.getByRole("link", { name: "Конструкції 6" }));
```

to:

```tsx
    await user.click(screen.getByRole("link", { name: "Конструкції 7" }));
```

- [ ] **Step 2: Run the failing catalog tests**

Run:

```bash
npm run test -- lib/calculators.test.ts
```

Expected: fail because the calculator is not registered.

- [ ] **Step 3: Register the native calculator type**

Modify the `nativeCalculator` union in `lib/calculators.ts`:

```ts
  nativeCalculator?:
    | "rebar-area-bars"
    | "rebar-characteristics"
    | "concrete-characteristics"
    | "minimum-reinforcement-area"
    | "foundation-bar-anchorage"
    | "cassoon-load-distribution"
    | "soil-design-resistance";
```

- [ ] **Step 4: Add the content JSON entry**

Add this object to `data/content.json` inside `calculators`, near other `fundamenty` calculators and with an `order` that places it near foundation tools:

```json
{
  "slug": "soil-design-resistance",
  "title": "Розрахунковий опір ґрунту основи",
  "shortDescription": "Обчислення розрахункового опору ґрунту основи R за додатком Е ДБН В.2.1-10-2009.",
  "description": "Нативний розрахунок визначає R за формулою (Е.1) додатка Е ДБН В.2.1-10-2009 з табличними коефіцієнтами, інтерполяцією та покроковим звітом.",
  "mainCategory": "fundamenty",
  "extraCategories": ["perevirka-dbn", "normatyvni-obgruntuvannya"],
  "displayMode": "native",
  "nativeCalculator": "soil-design-resistance",
  "accessLabel": "Нативний розрахунок",
  "openUrl": "/calculator/soil-design-resistance",
  "order": 53,
  "seoTitle": "Розрахунковий опір ґрунту основи R за ДБН В.2.1-10-2009",
  "seoDescription": "Обчислення розрахункового опору ґрунту основи R за додатком Е ДБН В.2.1-10-2009 з покроковим звітом.",
  "standard": "ДБН В.2.1-10-2009, додаток Е",
  "editorialLabel": "Новий",
  "useCases": [
    "Попереднє визначення R для фундаментів",
    "Перевірка середнього тиску під підошвою",
    "Підготовка розрахункового звіту за ДБН"
  ],
  "tags": ["фундаменти", "ґрунт", "ДБН"],
  "tools": ["ДБН В.2.1-10-2009"],
  "icon": "Layers"
}
```

- [ ] **Step 5: Add a temporary shell fallback for registration**

In `components/calculator-shell.tsx`, add the case before the default branch even before the real UI exists:

```tsx
    case "soil-design-resistance":
      return (
        <div className="detail-external">
          <h3 className="detail-external__title">Розрахунковий опір ґрунту основи</h3>
          <p className="detail-external__desc">
            Локальний калькулятор буде додано наступним кроком.
          </p>
        </div>
      );
```

Task 4 will replace this fallback with the real component.

- [ ] **Step 6: Run catalog tests**

Run:

```bash
npm run test -- lib/calculators.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit registration**

Run:

```bash
git add lib/calculators.ts components/calculator-shell.tsx data/content.json lib/calculators.test.ts
git commit -m "Register soil design resistance calculator"
```

## Task 4: Calculator UI and Mathematical Report Rendering

**Files:**
- Create: `components/calculators/soil-design-resistance-calculator.tsx`
- Modify: `components/calculator-shell.tsx`
- Modify: `components/calculator-shell.test.tsx`

- [ ] **Step 1: Add failing UI smoke test**

Append to `components/calculator-shell.test.tsx` after the foundation anchorage native calculator test:

```tsx
  it("renders the native soil design resistance calculator with the agreed report", async () => {
    const user = userEvent.setup();
    const calculator = getCalculatorBySlug("soil-design-resistance");

    if (!calculator) {
      throw new Error("Expected native soil design resistance calculator to exist");
    }

    render(<CalculatorShell selectedCalculator={calculator} />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "Розрахунковий опір ґрунту основи",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Калькулятор розрахункового опору ґрунту основи"),
    ).toBeInTheDocument();
    expect(screen.getByText("R = 162.8 кПа")).toBeInTheDocument();
    expect(screen.getByText("16.3 т/м²")).toBeInTheDocument();
    expect(screen.getByText("1.6 кг/см²")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /^Умови роботи/ })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /^Характеристики ґрунту/ })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /^Геометрія/ })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: /^Підвал/ })).toBeInTheDocument();
    expect(
      screen.getByLabelText(
        "R = γc1 * γc2 / k * [Mγ * kz * b * γ11 + Mq * d1 * γ′11 + (Mq - 1) * db * γ′11 + Mc * c11] = 1 * 1 / 1 * [1.15 * 1 * 1 * 17.1 + 5.59 * 1.2 * 16.6 + (5.59 - 1) * 0 * 16.6 + 7.95 * 4] = 162.82 кПа",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Нормативні пункти" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "п. Е.4 ДБН В.2.1-10-2009, формула (Е.1)" }),
    ).toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Спосіб розрахунку" }),
      "automatic",
    );

    expect(screen.queryByRole("spinbutton", { name: "γc1" })).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Тип ґрунту" })).toHaveValue("medium-sand");
    expect(screen.getByRole("spinbutton", { name: "L" })).toBeInTheDocument();
    expect(
      screen.getByLabelText("L/H = L / H = 24 / 6 = 4"),
    ).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run the failing UI test**

Run:

```bash
npm run test -- components/calculator-shell.test.tsx -t "soil design resistance"
```

Expected: fail because the real UI component does not exist and the shell still renders the temporary fallback.

- [ ] **Step 3: Create the calculator component**

Create `components/calculators/soil-design-resistance-calculator.tsx` with:

```tsx
"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import {
  formatSoilDesignResistanceNumber,
  getSoilDesignResistanceReport,
  SOIL_TYPE_LABELS,
  type SoilCalculationMode,
  type SoilDesignResistanceReportStep,
  type SoilStrengthSource,
  type SoilStructuralScheme,
  type SoilType,
} from "@/lib/soil-design-resistance";

import { MathNotation } from "./math-notation";

const SYMBOLS = {
  "γc1": { base: "γ", subscript: "c1", ariaLabel: "γc1" },
  "γc2": { base: "γ", subscript: "c2", ariaLabel: "γc2" },
  "γ11": { base: "γ", subscript: "11", ariaLabel: "γ11" },
  "γ′11": { base: "γ′", subscript: "11", ariaLabel: "γ′11" },
  "γcf": { base: "γ", subscript: "cf", ariaLabel: "γcf" },
  "φ11": { base: "φ", subscript: "11", ariaLabel: "φ11" },
  "c11": { base: "c", subscript: "11", ariaLabel: "c11" },
  "Mγ": { base: "M", subscript: "γ", ariaLabel: "Mγ" },
  Mq: { base: "M", subscript: "q", ariaLabel: "Mq" },
  Mc: { base: "M", subscript: "c", ariaLabel: "Mc" },
  "γc2,1.5": { base: "γ", subscript: "c2,1.5", ariaLabel: "γc2,1.5" },
  "γc2,4": { base: "γ", subscript: "c2,4", ariaLabel: "γc2,4" },
  "db,input": { base: "d", subscript: "b,input", ariaLabel: "db,input" },
  "L/H": { base: "L/H", ariaLabel: "L/H" },
  kz: { base: "k", subscript: "z", ariaLabel: "kz" },
  z0: { base: "z", subscript: "0", ariaLabel: "z0" },
  d1: { base: "d", subscript: "1", ariaLabel: "d1" },
  db: { base: "d", subscript: "b", ariaLabel: "db" },
  hs: { base: "h", subscript: "s", ariaLabel: "hs" },
  hcf: { base: "h", subscript: "cf", ariaLabel: "hcf" },
  IL: { base: "I", subscript: "L", ariaLabel: "IL" },
  R: { base: "R", ariaLabel: "R" },
  L: { base: "L", ariaLabel: "L" },
  H: { base: "H", ariaLabel: "H" },
  b: { base: "b", ariaLabel: "b" },
  d: { base: "d", ariaLabel: "d" },
  k: { base: "k", ariaLabel: "k" },
} as const;

const SYMBOL_PATTERN = new RegExp(
  Object.keys(SYMBOLS)
    .sort((left, right) => right.length - left.length)
    .map((symbol) => symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|"),
  "g",
);

const NORM_LINKS = [
  { text: "п. 7.7.1", id: "norm-dbn-7-7-1" },
  { text: "п. Е.4", id: "norm-dbn-e-4" },
  { text: "формула (Е.1)", id: "norm-dbn-e-1" },
  { text: "формулою (Е.2)", id: "norm-dbn-e-2" },
  { text: "приміткою 6", id: "norm-dbn-e-4-note-6" },
  { text: "приміткою 7", id: "norm-dbn-e-4-note-7" },
  { text: "п. Е.5", id: "norm-dbn-e-5" },
  { text: "табл. Е.7", id: "norm-dbn-table-e-7" },
  { text: "табл. Е.8", id: "norm-dbn-table-e-8" },
] as const;

const NORMATIVE_REFERENCES = [
  {
    id: "norm-dbn-7-7-1",
    title: "п. 7.7.1 ДБН В.2.1-10-2009",
    summary: "Визначення розрахункового опору R виконують за додатком Е.",
  },
  {
    id: "norm-dbn-e-4",
    title: "п. Е.4 ДБН В.2.1-10-2009",
    summary: "Пункт задає формулу для R та пояснює коефіцієнти і глибини d1, db.",
  },
  {
    id: "norm-dbn-e-1",
    title: "п. Е.4 ДБН В.2.1-10-2009, формула (Е.1)",
    summary:
      "R визначається через γc1, γc2, k, Mγ, Mq, Mc, kz, b, γ11, γ′11, d1, db і c11.",
  },
  {
    id: "norm-dbn-e-2",
    title: "формула (Е.2) ДБН В.2.1-10-2009",
    summary: "Для підвалу приведена глибина d1 визначається через hs, hcf, γcf та γ′11.",
  },
  {
    id: "norm-dbn-e-4-note-6",
    title: "примітка 6 до п. Е.4",
    summary: "Якщо d1 > d, у формулі (Е.1) приймають d1 = d і db = 0.",
  },
  {
    id: "norm-dbn-e-4-note-7",
    title: "примітка 7 до п. Е.4",
    summary: "Для пухких пісків значення R потрібно уточнювати за випробуваннями штампами.",
  },
  {
    id: "norm-dbn-e-5",
    title: "п. Е.5 ДБН В.2.1-10-2009",
    summary: "Пункт визначає підхід до розрахункових характеристик ґрунту для другого граничного стану.",
  },
  {
    id: "norm-dbn-table-e-7",
    title: "табл. Е.7 ДБН В.2.1-10-2009",
    summary: "Таблиця задає γc1 і γc2 залежно від типу ґрунту, конструктивної схеми і L/H.",
  },
  {
    id: "norm-dbn-table-e-8",
    title: "табл. Е.8 ДБН В.2.1-10-2009",
    summary: "Таблиця задає Mγ, Mq і Mc залежно від φ11.",
  },
] as const;

function parseNumberInput(value: string): number {
  return Number.parseFloat(value.replace(",", "."));
}

function isFormulaBoundary(value: string | undefined): boolean {
  return !value || !/[A-Za-zА-Яа-яІіЇїЄєҐґ0-9_,.′]/.test(value);
}

function renderFormulaText(text: string) {
  const parts: Array<string | keyof typeof SYMBOLS> = [];
  let lastIndex = 0;

  for (const match of text.matchAll(SYMBOL_PATTERN)) {
    if (match.index === undefined) continue;
    if (
      !isFormulaBoundary(text[match.index - 1]) ||
      !isFormulaBoundary(text[match.index + match[0].length])
    ) {
      continue;
    }
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(match[0] as keyof typeof SYMBOLS);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));

  return parts.map((part, index) => {
    if (part in SYMBOLS) {
      const symbol = SYMBOLS[part as keyof typeof SYMBOLS];
      return (
        <MathNotation
          key={`${part}:${index}`}
          base={symbol.base}
          subscript={"subscript" in symbol ? symbol.subscript : undefined}
          ariaLabel={symbol.ariaLabel}
        />
      );
    }
    return <span key={`${part}:${index}`}>{part}</span>;
  });
}

function CaptionText({ text }: { text: string }) {
  const pattern = new RegExp(
    NORM_LINKS.map((link) => link.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
    "g",
  );
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    if (match.index === undefined) continue;
    if (match.index > lastIndex) {
      nodes.push(<span key={`text:${lastIndex}`}>{renderFormulaText(text.slice(lastIndex, match.index))}</span>);
    }
    const link = NORM_LINKS.find((item) => item.text === match[0]);
    if (link) nodes.push(<a key={`${link.id}:${match.index}`} href={`#${link.id}`}>{link.text}</a>);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(<span key={`text:${lastIndex}`}>{renderFormulaText(text.slice(lastIndex))}</span>);
  }

  return <>{nodes}</>;
}

function NumberField({
  label,
  value,
  onChange,
  min = "0",
  step = "0.01",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  step?: string;
}) {
  return (
    <label className="soil-resistance-field">
      <span>{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min={min}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function ReportStepFormula({ step }: { step: SoilDesignResistanceReportStep }) {
  if (!step.formula) return null;
  return (
    <div className="soil-resistance-equation" aria-label={step.formula} title={step.formula}>
      {renderFormulaText(step.formula)}
    </div>
  );
}

export function SoilDesignResistanceCalculator() {
  const [calculationMode, setCalculationMode] = useState<SoilCalculationMode>("manual-e7");
  const [structuralScheme, setStructuralScheme] = useState<SoilStructuralScheme>("rigid");
  const [buildingLength, setBuildingLength] = useState("24");
  const [buildingHeight, setBuildingHeight] = useState("6");
  const [soilType, setSoilType] = useState<SoilType>("medium-sand");
  const [liquidityIndex, setLiquidityIndex] = useState("0");
  const [gammaC1Manual, setGammaC1Manual] = useState("1");
  const [gammaC2Manual, setGammaC2Manual] = useState("1");
  const [phi11, setPhi11] = useState("30");
  const [gamma11, setGamma11] = useState("17.1");
  const [gammaPrime11, setGammaPrime11] = useState("16.6");
  const [c11, setC11] = useState("4");
  const [strengthSource, setStrengthSource] = useState<SoilStrengthSource>("direct-testing");
  const [foundationWidth, setFoundationWidth] = useState("1");
  const [foundationDepth, setFoundationDepth] = useState("1.2");
  const [hasBasement, setHasBasement] = useState(false);
  const [embedmentDepthD1, setEmbedmentDepthD1] = useState("1.2");
  const [basementDepthInput, setBasementDepthInput] = useState("0");
  const [soilLayerAboveFootingHs, setSoilLayerAboveFootingHs] = useState("0");
  const [basementFloorThicknessHcf, setBasementFloorThicknessHcf] = useState("0");
  const [basementFloorUnitWeightGammaCf, setBasementFloorUnitWeightGammaCf] = useState("0");

  const report = useMemo(
    () =>
      getSoilDesignResistanceReport({
        calculationMode,
        structuralScheme,
        buildingLengthM: parseNumberInput(buildingLength),
        buildingHeightM: parseNumberInput(buildingHeight),
        soilType,
        liquidityIndex: parseNumberInput(liquidityIndex),
        gammaC1Manual: parseNumberInput(gammaC1Manual),
        gammaC2Manual: parseNumberInput(gammaC2Manual),
        phi11Deg: parseNumberInput(phi11),
        gamma11KnM3: parseNumberInput(gamma11),
        gammaPrime11KnM3: parseNumberInput(gammaPrime11),
        c11KPa: parseNumberInput(c11),
        strengthSource,
        foundationWidthM: parseNumberInput(foundationWidth),
        foundationDepthM: parseNumberInput(foundationDepth),
        hasBasement,
        embedmentDepthD1M: parseNumberInput(embedmentDepthD1),
        basementDepthInputM: parseNumberInput(basementDepthInput),
        soilLayerAboveFootingHsM: parseNumberInput(soilLayerAboveFootingHs),
        basementFloorThicknessHcfM: parseNumberInput(basementFloorThicknessHcf),
        basementFloorUnitWeightGammaCfKnM3: parseNumberInput(basementFloorUnitWeightGammaCf),
      }),
    [
      calculationMode,
      structuralScheme,
      buildingLength,
      buildingHeight,
      soilType,
      liquidityIndex,
      gammaC1Manual,
      gammaC2Manual,
      phi11,
      gamma11,
      gammaPrime11,
      c11,
      strengthSource,
      foundationWidth,
      foundationDepth,
      hasBasement,
      embedmentDepthD1,
      basementDepthInput,
      soilLayerAboveFootingHs,
      basementFloorThicknessHcf,
      basementFloorUnitWeightGammaCf,
    ],
  );

  return (
    <div className="soil-resistance-calculator" aria-label="Калькулятор розрахункового опору ґрунту основи">
      {report.valid && report.values ? (
        <div className="soil-resistance-summary" aria-live="polite">
          <p>R = {formatSoilDesignResistanceNumber(report.values.soilDesignResistanceKPa, 1)} кПа</p>
          <p>{formatSoilDesignResistanceNumber(report.values.soilDesignResistanceTonM2, 1)} т/м²</p>
          <p>{formatSoilDesignResistanceNumber(report.values.soilDesignResistanceKgCm2, 1)} кг/см²</p>
        </div>
      ) : null}

      <div className="soil-resistance-form">
        <fieldset className="soil-resistance-group">
          <legend>Умови роботи</legend>
          <label className="soil-resistance-field">
            <span>Спосіб розрахунку</span>
            <select value={calculationMode} onChange={(event) => setCalculationMode(event.target.value as SoilCalculationMode)}>
              <option value="manual-e7">вручну за табл. Е.7</option>
              <option value="automatic">автоматично за характеристиками ґрунту</option>
            </select>
          </label>
          {calculationMode === "manual-e7" ? (
            <>
              <NumberField label="γc1" value={gammaC1Manual} onChange={setGammaC1Manual} />
              <NumberField label="γc2" value={gammaC2Manual} onChange={setGammaC2Manual} />
            </>
          ) : (
            <>
              <label className="soil-resistance-field">
                <span>Конструктивна схема споруди</span>
                <select value={structuralScheme} onChange={(event) => setStructuralScheme(event.target.value as SoilStructuralScheme)}>
                  <option value="rigid">жорстка</option>
                  <option value="flexible">гнучка</option>
                </select>
              </label>
              <p className="soil-resistance-help">
                Жорстка конструктивна схема: конструкції спеціально пристосовані до сприйняття зусиль від деформацій основ (примітка 1 до табл. Е.7 ДБН В.2.1-10-2009).
              </p>
              {structuralScheme === "rigid" ? (
                <>
                  <NumberField label="L" value={buildingLength} onChange={setBuildingLength} />
                  <NumberField label="H" value={buildingHeight} onChange={setBuildingHeight} />
                </>
              ) : null}
              <label className="soil-resistance-field">
                <span>Тип ґрунту</span>
                <select value={soilType} onChange={(event) => setSoilType(event.target.value as SoilType)}>
                  {Object.entries(SOIL_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              {soilType === "coarse-with-clayey-fill" || soilType === "clayey-soil" ? (
                <NumberField label="IL" value={liquidityIndex} onChange={setLiquidityIndex} min="-10" />
              ) : null}
            </>
          )}
        </fieldset>

        <fieldset className="soil-resistance-group">
          <legend>Характеристики ґрунту</legend>
          <NumberField label="φ11" value={phi11} onChange={setPhi11} />
          <NumberField label="γ11" value={gamma11} onChange={setGamma11} />
          <NumberField label="γ′11" value={gammaPrime11} onChange={setGammaPrime11} />
          <NumberField label="c11" value={c11} onChange={setC11} />
          <label className="soil-resistance-field">
            <span>Спосіб визначення φ11 і c11</span>
            <select value={strengthSource} onChange={(event) => setStrengthSource(event.target.value as SoilStrengthSource)}>
              <option value="direct-testing">визначені безпосередніми випробуваннями</option>
              <option value="appendix-b-tables">прийняті за таблицями В.1-В.2</option>
            </select>
          </label>
        </fieldset>

        <fieldset className="soil-resistance-group">
          <legend>Геометрія</legend>
          <NumberField label="b" value={foundationWidth} onChange={setFoundationWidth} />
          <NumberField label="d" value={foundationDepth} onChange={setFoundationDepth} />
        </fieldset>

        <fieldset className="soil-resistance-group">
          <legend>Підвал</legend>
          <label className="soil-resistance-toggle">
            <input type="checkbox" checked={hasBasement} onChange={(event) => setHasBasement(event.target.checked)} />
            <span>є підвал</span>
          </label>
          {hasBasement ? (
            <>
              <NumberField label="db,input" value={basementDepthInput} onChange={setBasementDepthInput} />
              <NumberField label="hs" value={soilLayerAboveFootingHs} onChange={setSoilLayerAboveFootingHs} />
              <NumberField label="hcf" value={basementFloorThicknessHcf} onChange={setBasementFloorThicknessHcf} />
              <NumberField label="γcf" value={basementFloorUnitWeightGammaCf} onChange={setBasementFloorUnitWeightGammaCf} />
            </>
          ) : (
            <NumberField label="d1" value={embedmentDepthD1} onChange={setEmbedmentDepthD1} />
          )}
        </fieldset>
      </div>

      {report.errors.length > 0 ? (
        <div className="soil-resistance-errors" role="alert">
          <ul>{report.errors.map((error) => <li key={error}>{error}</li>)}</ul>
        </div>
      ) : null}
      {report.warnings.length > 0 ? (
        <div className="soil-resistance-warning" role="status">
          {report.warnings.map((warning) => <p key={warning}>{warning}</p>)}
        </div>
      ) : null}

      <section className="soil-resistance-report" aria-labelledby="soil-resistance-report-title">
        <h3 id="soil-resistance-report-title">Покроковий звіт</h3>
        <ol className="soil-resistance-report__steps">
          {report.steps.map((step) => (
            <li key={step.key} className="soil-resistance-report__step">
              <p className="soil-resistance-report__caption"><CaptionText text={step.caption} /></p>
              {step.items ? (
                <ul className="soil-resistance-report__items">
                  {step.items.map((item) => <li key={item}>{renderFormulaText(item)}</li>)}
                </ul>
              ) : null}
              <ReportStepFormula step={step} />
            </li>
          ))}
        </ol>
      </section>

      <section className="soil-resistance-norms" aria-labelledby="soil-resistance-norms-title">
        <h3 id="soil-resistance-norms-title">Нормативні пункти</h3>
        <div className="soil-resistance-norms__list">
          {NORMATIVE_REFERENCES.map((reference) => (
            <article key={reference.id} id={reference.id} className="soil-resistance-norm">
              <h4>{reference.title}</h4>
              <p>{reference.summary}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Wire the component into the shell**

Modify `components/calculator-shell.tsx` imports:

```tsx
import { SoilDesignResistanceCalculator } from "@/components/calculators/soil-design-resistance-calculator";
```

Replace the temporary `soil-design-resistance` case with:

```tsx
    case "soil-design-resistance":
      return <SoilDesignResistanceCalculator />;
```

- [ ] **Step 5: Run the UI smoke test**

Run:

```bash
npm run test -- components/calculator-shell.test.tsx -t "soil design resistance"
```

Expected: PASS.

- [ ] **Step 6: Run focused typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Commit UI implementation**

Run:

```bash
git add components/calculators/soil-design-resistance-calculator.tsx components/calculator-shell.tsx components/calculator-shell.test.tsx
git commit -m "Add soil design resistance calculator UI"
```

## Task 5: Styling and Full Verification

**Files:**
- Modify: `app/globals.css`
- Modify: `components/calculator-shell.test.tsx`

- [ ] **Step 1: Add failing CSS structure test**

Append to `components/calculator-shell.test.tsx`:

```tsx
  it("styles the soil design resistance calculator as a compact native report", () => {
    const css = readFileSync("app/globals.css", "utf8");

    expect(css).toMatch(/\.soil-resistance-form\s*{[\s\S]*?grid-template-columns:\s*minmax\(0,\s*1fr\);/);
    expect(css).toMatch(/\.soil-resistance-equation\s*{[\s\S]*?font-family:\s*var\(--font-mono\)/);
    expect(css).toMatch(/\.soil-resistance-summary\s*{[\s\S]*?display:\s*grid/);
  });
```

- [ ] **Step 2: Run the failing CSS test**

Run:

```bash
npm run test -- components/calculator-shell.test.tsx -t "soil design resistance calculator as a compact native report"
```

Expected: fail because CSS selectors do not exist.

- [ ] **Step 3: Add CSS**

Append to `app/globals.css`:

```css
.soil-resistance-calculator {
  display: grid;
  gap: 1rem;
}

.soil-resistance-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
}

.soil-resistance-summary p {
  margin: 0;
  font-weight: 700;
}

.soil-resistance-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
}

.soil-resistance-group {
  display: grid;
  gap: 0.75rem;
  margin: 0;
  padding: 1rem;
  border: 1px solid var(--border);
  border-radius: 8px;
}

.soil-resistance-group legend {
  padding: 0 0.25rem;
  font-weight: 700;
}

.soil-resistance-field {
  display: grid;
  gap: 0.35rem;
}

.soil-resistance-field input,
.soil-resistance-field select {
  width: 100%;
}

.soil-resistance-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.soil-resistance-help {
  margin: 0;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.soil-resistance-errors,
.soil-resistance-warning {
  padding: 0.85rem 1rem;
  border-radius: 8px;
}

.soil-resistance-errors {
  border: 1px solid color-mix(in srgb, #b42318 42%, var(--border));
  background: color-mix(in srgb, #b42318 8%, var(--surface));
}

.soil-resistance-warning {
  border: 1px solid color-mix(in srgb, #b7791f 42%, var(--border));
  background: color-mix(in srgb, #b7791f 8%, var(--surface));
}

.soil-resistance-report,
.soil-resistance-norms {
  display: grid;
  gap: 0.75rem;
}

.soil-resistance-report__steps,
.soil-resistance-report__items,
.soil-resistance-norms__list {
  display: grid;
  gap: 0.75rem;
}

.soil-resistance-report__step,
.soil-resistance-norm {
  padding: 0.9rem 0;
  border-bottom: 1px solid var(--border);
}

.soil-resistance-report__caption {
  margin: 0 0 0.45rem;
  font-weight: 650;
}

.soil-resistance-equation {
  font-family: var(--font-mono);
  line-height: 1.7;
  overflow-wrap: anywhere;
}
```

- [ ] **Step 4: Run CSS and UI tests**

Run:

```bash
npm run test -- components/calculator-shell.test.tsx -t "soil design resistance"
```

Expected: PASS.

- [ ] **Step 5: Run all tests**

Run:

```bash
npm run test
```

Expected: PASS.

- [ ] **Step 6: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 7: Run production build**

Run:

```bash
npm run build
```

Expected: PASS and static export completes.

- [ ] **Step 8: Commit styling and verification fixes**

Run:

```bash
git add app/globals.css components/calculator-shell.test.tsx
git commit -m "Style soil design resistance calculator"
```

## Task 6: Browser Verification

**Files:**
- No source edits unless a verified browser issue is found.

- [ ] **Step 1: Start the dev server**

Run:

```bash
npm run dev
```

Expected: Next.js dev server starts on `http://localhost:3000`. If port 3000 is busy, use the next available port shown by Next.js.

- [ ] **Step 2: Open the calculator in the in-app browser**

Use the Browser plugin to open:

```text
http://localhost:3000/calculator/soil-design-resistance
```

Expected: the page renders the native calculator, not an iframe or fallback message.

- [ ] **Step 3: Verify default result and dynamic fields visually**

Check:

- summary shows `R = 162.8 кПа`, `16.3 т/м²`, `1.6 кг/см²`
- manual mode shows `γc1` and `γc2`
- switching to automatic mode hides manual `γc1`, `γc2`
- automatic rigid mode shows `L`, `H`, and `L/H` report step
- selecting a soil type that uses `IL` shows the `IL` field
- enabling basement shows `db,input`, `hs`, `hcf`, `γcf`
- report formulas wrap without overlapping surrounding content
- normative links navigate to the `Нормативні пункти` section

- [ ] **Step 4: Fix browser-only layout or interaction issues**

If the browser check finds a concrete issue, make the smallest targeted edit and add a test when possible. Then rerun:

```bash
npm run test -- components/calculator-shell.test.tsx -t "soil design resistance"
npm run typecheck
npm run build
```

Expected: all pass after the fix.

- [ ] **Step 5: Commit browser fixes if any**

If Step 4 changed files, run:

```bash
git add components/calculators/soil-design-resistance-calculator.tsx app/globals.css components/calculator-shell.test.tsx
git commit -m "Fix soil design resistance browser issues"
```

If Step 4 made no changes, do not create an empty commit.

## Final Verification Checklist

- [ ] `npm run test` passes.
- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] Browser check confirms the default MQN result and dynamic fields.
- [ ] Report strings match `docs/superpowers/specs/2026-06-09-soil-design-resistance-report-contract.md`.
- [ ] `docs/DBN/` remains uncommitted unless the user explicitly asks to track the local PDF.
