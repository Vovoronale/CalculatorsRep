# Concrete Cover Durability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the native `concrete-cover-durability` calculator for `cmin` and `cnom` according to ДБН В.2.6-98:2009 section 4.4.

**Architecture:** Add a pure calculation/report core in `lib/concrete-cover-durability.ts`, a thin React adapter in `components/calculators/concrete-cover-durability-calculator.tsx`, and catalog registration through the existing native calculator path. The report contract at `docs/superpowers/specs/2026-06-17-concrete-cover-durability-report-contract.md` is the canonical source for visible report text and formulas.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest, Testing Library, lucide-react, shared `InputSchemaForm`, `NativeCalculatorLayout`, `NativeReport`, and browser DOCX export.

---

## Files

- Create: `lib/concrete-cover-durability.ts` - typed input, table data, validation, calculation, report building, and URL helpers.
- Create: `lib/concrete-cover-durability.test.ts` - core TDD coverage for tables, formulas, warnings, validation, and return URLs.
- Create: `components/calculators/concrete-cover-durability-calculator.tsx` - inspector schema, query-param prefill, exposure-class action, summary, report, DOCX adapter, and norms section.
- Create: `components/calculators/concrete-cover-durability-calculator.test.tsx` - UI schema, action, query-param return, conditional fields, summary, report, and DOCX adapter tests.
- Modify: `lib/calculators.ts` - add the native calculator literal.
- Modify: `components/calculator-shell.tsx` - import and render the new native calculator.
- Modify: `components/calculator-shell.test.tsx` - add shell smoke coverage.
- Modify: `lib/calculators.test.ts` - register catalog metadata expectations.
- Modify: `data/content.json` - add the calculator entry.
- Review only: `app/sitemap.test.ts` - existing loop should pass when the calculator is added.

## Reference Defaults

Use these defaults consistently in tests, schema, and the core:

```ts
export const DEFAULT_CONCRETE_COVER_DURABILITY_INPUT = {
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
} as const;
```

With those defaults the expected valid result is:

```text
cmin,b = 16 мм
S = S3
cmin,dur = 10 мм
cdur = 10 мм
cmin = 16 мм
cnom = 26 мм
```

---

### Task 1: Core Failing Tests

**Files:**
- Create: `lib/concrete-cover-durability.test.ts`

- [ ] **Step 1: Add core tests**

Create `lib/concrete-cover-durability.test.ts` with:

```ts
import { describe, expect, it } from "vitest";

import {
  DEFAULT_CONCRETE_COVER_DURABILITY_INPUT,
  getConcreteCoverDurabilityReport,
  getConcreteCoverDurabilityReturnUrl,
} from "@/lib/concrete-cover-durability";

describe("concrete cover durability", () => {
  it("calculates the default ordinary-reinforcement report from the contract", () => {
    const report = getConcreteCoverDurabilityReport({
      ...DEFAULT_CONCRETE_COVER_DURABILITY_INPUT,
    });

    expect(report.valid).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.warnings).toEqual([]);
    expect(report.values).toMatchObject({
      bondCoverMm: 16,
      constructionClass: "S3",
      durabilityCoverMm: 10,
      durabilityAdjustedCoverMm: 10,
      minimumCoverMm: 16,
      nominalCoverMm: 26,
    });
    expect(report.steps.map((step) => step.key)).toEqual([
      "inputs",
      "bond-cover",
      "construction-class",
      "durability-cover",
      "minimum-cover",
      "nominal-cover",
      "conclusion",
    ]);
    expect(report.steps[0].caption).toBe(
      "Вихідні дані для розрахунку захисного шару бетону (ДБН В.2.6-98:2009, розділ 4.4):",
    );
    expect(report.steps[1].formula).toBe("cmin,b = φ = 16 мм");
    expect(report.steps[2].caption).toBe(
      "Визначення класу конструкції S за розрахунковим строком експлуатації та факторами впливу (п. 4.4.2.4.3, табл. 4.5 ДБН В.2.6-98:2009):",
    );
    expect(report.steps[2].formulas).toContain("Sbase = S4");
    expect(report.steps[2].formulas).toContain("S2 = S4 - 1 = S3");
    expect(report.steps[2].formulas).toContain("S = clamp(S3; S1; S6) = S3");
    expect(report.steps[3].formula).toBe("cmin,dur = табл. 4.3[S3; XC1] = 10 мм");
    expect(report.steps[4].formulas).toEqual([
      "cdur = cmin,dur + Δcdur,γ - Δcdur,st - Δcdur,add = 10 + 0 - 0 - 0 = 10 мм",
      "cmin = max(cmin,b; cdur; 10 мм) = max(16; 10; 10) = 16 мм",
    ]);
    expect(report.steps[5].formula).toBe("cnom = cmin + Δcdev = 16 + 10 = 26 мм");
    expect(report.steps[6].formula).toBe("cmin => cnom = 16 мм => 26 мм");
  });

  it("uses table 4.4 for prestressed reinforcement", () => {
    const report = getConcreteCoverDurabilityReport({
      ...DEFAULT_CONCRETE_COVER_DURABILITY_INPUT,
      exposureClass: "XD3",
      reinforcementDurabilityType: "prestressed",
      constructionClassMode: "manual",
      manualConstructionClass: "S4",
      bondCoverMode: "strand",
      strandEquivalentDiameterMm: 15.2,
    });

    expect(report.valid).toBe(true);
    expect(report.values).toMatchObject({
      bondCoverMm: 15.2,
      constructionClass: "S4",
      durabilityCoverMm: 55,
      durabilityAdjustedCoverMm: 55,
      minimumCoverMm: 55,
      nominalCoverMm: 65,
    });
    expect(report.steps[1].formula).toBe("cmin,b = φp = 15.2 мм");
    expect(report.steps[2].caption).toBe("Прийняття класу конструкції S користувачем:");
    expect(report.steps[2].formula).toBe("S = S4");
    expect(report.steps[3].formula).toBe("cmin,dur = табл. 4.4[S4; XD3/XS3] = 55 мм");
  });

  it("adds 5 mm to cmin,b when aggregate is larger than 32 mm", () => {
    const report = getConcreteCoverDurabilityReport({
      ...DEFAULT_CONCRETE_COVER_DURABILITY_INPUT,
      aggregateMaxSizeMm: 40,
    });

    expect(report.valid).toBe(true);
    expect(report.values?.bondCoverMm).toBe(21);
    expect(report.steps[1].notes).toEqual([
      "Оскільки Dmax = 40 мм > 32 мм, згідно з приміткою до табл. 4.2 cmin,b збільшується на 5 мм.",
    ]);
    expect(report.steps[1].formulas).toEqual([
      "cmin,b = φ = 16 мм",
      "cmin,b = cmin,b,base + 5 = 16 + 5 = 21 мм",
    ]);
  });

  it("calculates every bond-cover mode from table 4.2", () => {
    expect(
      getConcreteCoverDurabilityReport({
        ...DEFAULT_CONCRETE_COVER_DURABILITY_INPUT,
        bondCoverMode: "round-duct",
        roundDuctDiameterMm: 60,
      }).steps[1].formula,
    ).toBe("cmin,b = dduct = 60 мм");
    expect(
      getConcreteCoverDurabilityReport({
        ...DEFAULT_CONCRETE_COVER_DURABILITY_INPUT,
        bondCoverMode: "rectangular-duct",
        rectangularDuctShortSideMm: 40,
        rectangularDuctLongSideMm: 90,
      }).steps[1].formula,
    ).toBe("cmin,b = max(aduct; bduct / 2) = max(40; 90 / 2) = 45 мм");
    expect(
      getConcreteCoverDurabilityReport({
        ...DEFAULT_CONCRETE_COVER_DURABILITY_INPUT,
        bondCoverMode: "pre-tensioned-wire",
        preTensionedElementDiameterMm: 12,
      }).steps[1].formula,
    ).toBe("cmin,b = 1.5 * dp = 1.5 * 12 = 18 мм");
    expect(
      getConcreteCoverDurabilityReport({
        ...DEFAULT_CONCRETE_COVER_DURABILITY_INPUT,
        bondCoverMode: "pre-tensioned-bar",
        preTensionedElementDiameterMm: 16,
      }).steps[1].formula,
    ).toBe("cmin,b = 2.5 * dp = 2.5 * 16 = 40 мм");
  });

  it("applies automatic construction class increases, reductions, and clamp", () => {
    const report = getConcreteCoverDurabilityReport({
      ...DEFAULT_CONCRETE_COVER_DURABILITY_INPUT,
      exposureClass: "XD3",
      designWorkingLife: "100",
      concreteClass: "C45/55",
      isSlabElement: true,
      hasSpecialQualityControl: true,
    });

    expect(report.values?.constructionClass).toBe("S3");
    expect(report.steps[2].formulas).toEqual([
      "Sbase = S4",
      "S1 = Sbase + 2 = S4 + 2 = S6",
      "S2 = S6 - 1 = S5",
      "S3 = S5 - 1 = S4",
      "S = S4 - 1 = S3",
      "S = clamp(S3; S1; S6) = S3",
    ]);
  });

  it("warns when nominal cover is greater than 45 mm", () => {
    const report = getConcreteCoverDurabilityReport({
      ...DEFAULT_CONCRETE_COVER_DURABILITY_INPUT,
      exposureClass: "XD3",
      constructionClassMode: "manual",
      manualConstructionClass: "S4",
    });

    expect(report.values?.nominalCoverMm).toBe(55);
    expect(report.warnings).toEqual([
      "Номінальний захисний шар cnom = 55 мм > 45 мм. Згідно з п. 4.4.2.4.4 ДБН В.2.6-98:2009 необхідно передбачити конструктивне армування захисного шару.",
    ]);
  });

  it("returns a stable invalid report without NaN formulas", () => {
    const report = getConcreteCoverDurabilityReport({
      ...DEFAULT_CONCRETE_COVER_DURABILITY_INPUT,
      barDiameterMm: 0,
      deltaCdevMm: -1,
    });

    expect(report.valid).toBe(false);
    expect(report.errors).toEqual([
      "Укажіть додатне значення φ.",
      "Δcdev має бути не менше 0 мм.",
    ]);
    expect(report.values).toBeNull();
    expect(report.steps).toHaveLength(1);
    expect(JSON.stringify(report.steps)).not.toContain("NaN");
    expect(JSON.stringify(report.steps)).not.toContain("Infinity");
  });

  it("builds return URLs from exposure-class calculator results", () => {
    expect(
      getConcreteCoverDurabilityReturnUrl({
        exposureClass: "XD3",
        sourceExposureClasses: "XC4,XD3,XF4",
        sourceCalculator: "concrete-exposure-class",
      }),
    ).toBe(
      "/calculator/concrete-cover-durability?exposureClass=XD3&sourceExposureClasses=XC4%2CXD3%2CXF4&sourceCalculator=concrete-exposure-class",
    );
  });
});
```

- [ ] **Step 2: Run the failing core tests**

Run:

```bash
npm run test -- lib/concrete-cover-durability.test.ts
```

Expected: FAIL because `lib/concrete-cover-durability.ts` does not exist.

- [ ] **Step 3: Commit the failing core tests**

```bash
git add lib/concrete-cover-durability.test.ts
git commit -m "test: cover concrete cover durability core"
```

---

### Task 2: Core Implementation

**Files:**
- Create: `lib/concrete-cover-durability.ts`
- Test: `lib/concrete-cover-durability.test.ts`

- [ ] **Step 1: Add the core types, tables, helpers, and report builder**

Create `lib/concrete-cover-durability.ts` with this structure and keep every visible caption, note, formula, warning, and error string aligned with the report contract:

```ts
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
```

Add constants for labels and table data:

```ts
const CONSTRUCTION_CLASSES: ConcreteCoverConstructionClass[] = ["S1", "S2", "S3", "S4", "S5", "S6"];
const CONCRETE_CLASS_ORDER = ["C8/10", "C12/15", "C16/20", "C20/25", "C25/30", "C30/37", "C35/45", "C40/50", "C45/55", "C50/60"];

const REINFORCEMENT_DURABILITY_TYPE_LABELS: Record<ConcreteCoverReinforcementDurabilityType, string> = {
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

const CONSTRUCTION_CLASS_MODE_LABELS: Record<ConcreteCoverConstructionClassMode, string> = {
  automatic: "автоматично за табл. 4.5",
  manual: "вручну",
};
```

Add table 4.3 and table 4.4 exactly as approved:

```ts
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
  S1: { X0: 10, XC1: 10, "XC2/XC3": 10, XC4: 15, "XD1/XS1": 20, "XD2/XS2": 25, "XD3/XS3": 30 },
  S2: { X0: 10, XC1: 10, "XC2/XC3": 15, XC4: 20, "XD1/XS1": 25, "XD2/XS2": 30, "XD3/XS3": 35 },
  S3: { X0: 10, XC1: 10, "XC2/XC3": 20, XC4: 25, "XD1/XS1": 30, "XD2/XS2": 35, "XD3/XS3": 40 },
  S4: { X0: 10, XC1: 15, "XC2/XC3": 25, XC4: 30, "XD1/XS1": 35, "XD2/XS2": 40, "XD3/XS3": 45 },
  S5: { X0: 10, XC1: 20, "XC2/XC3": 30, XC4: 35, "XD1/XS1": 40, "XD2/XS2": 45, "XD3/XS3": 50 },
  S6: { X0: 20, XC1: 25, "XC2/XC3": 35, XC4: 40, "XD1/XS1": 45, "XD2/XS2": 50, "XD3/XS3": 55 },
};

const TABLE_44: Record<ConcreteCoverConstructionClass, Record<string, number>> = {
  S1: { X0: 10, XC1: 15, "XC2/XC3": 20, XC4: 25, "XD1/XS1": 30, "XD2/XS2": 35, "XD3/XS3": 40 },
  S2: { X0: 10, XC1: 15, "XC2/XC3": 25, XC4: 30, "XD1/XS1": 35, "XD2/XS2": 40, "XD3/XS3": 45 },
  S3: { X0: 10, XC1: 20, "XC2/XC3": 30, XC4: 35, "XD1/XS1": 40, "XD2/XS2": 45, "XD3/XS3": 50 },
  S4: { X0: 10, XC1: 25, "XC2/XC3": 35, XC4: 40, "XD1/XS1": 45, "XD2/XS2": 50, "XD3/XS3": 55 },
  S5: { X0: 15, XC1: 30, "XC2/XC3": 40, XC4: 45, "XD1/XS1": 50, "XD2/XS2": 55, "XD3/XS3": 60 },
  S6: { X0: 20, XC1: 35, "XC2/XC3": 45, XC4: 50, "XD1/XS1": 55, "XD2/XS2": 60, "XD3/XS3": 65 },
};
```

Add table 4.5 grouping and helper functions:

```ts
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
  return Number.isInteger(value) ? String(value) : String(Number.parseFloat(value.toFixed(4)));
}

function classToIndex(value: ConcreteCoverConstructionClass): number {
  return CONSTRUCTION_CLASSES.indexOf(value);
}

function indexToClass(index: number): ConcreteCoverConstructionClass {
  return CONSTRUCTION_CLASSES[Math.min(Math.max(index, 0), CONSTRUCTION_CLASSES.length - 1)];
}

function shiftClass(value: ConcreteCoverConstructionClass, delta: number): ConcreteCoverConstructionClass {
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
```

Implement these internal functions:

```ts
function validateInput(input: ConcreteCoverDurabilityInput): string[] {
  const errors: string[] = [];
  const pushPositive = (condition: boolean, message: string) => {
    if (!condition) errors.push(message);
  };

  if (input.bondCoverMode === "bar") pushPositive(input.barDiameterMm > 0, "Укажіть додатне значення φ.");
  if (input.bondCoverMode === "strand") pushPositive(input.strandEquivalentDiameterMm > 0, "Укажіть додатне значення φp.");
  if (input.bondCoverMode === "round-duct") pushPositive(input.roundDuctDiameterMm > 0, "Укажіть додатне значення dduct.");
  if (input.bondCoverMode === "rectangular-duct") {
    pushPositive(input.rectangularDuctShortSideMm > 0, "Укажіть додатне значення aduct.");
    pushPositive(input.rectangularDuctLongSideMm > 0, "Укажіть додатне значення bduct.");
  }
  if (input.bondCoverMode === "pre-tensioned-wire" || input.bondCoverMode === "pre-tensioned-bar") {
    pushPositive(input.preTensionedElementDiameterMm > 0, "Укажіть додатне значення dp.");
  }
  if (!(input.aggregateMaxSizeMm >= 0)) errors.push("Dmax має бути не менше 0 мм.");
  if (!(input.deltaCdurGammaMm >= 0)) errors.push("Δcdur,γ має бути не менше 0 мм.");
  if (!(input.deltaCdurStMm >= 0)) errors.push("Δcdur,st має бути не менше 0 мм.");
  if (!(input.deltaCdurAddMm >= 0)) errors.push("Δcdur,add має бути не менше 0 мм.");
  if (!(input.deltaCdevMm >= 0)) errors.push("Δcdev має бути не менше 0 мм.");
  if (!DURABILITY_COLUMNS[input.exposureClass]) errors.push("Оберіть клас впливу середовища.");
  if (input.constructionClassMode === "manual" && !CONSTRUCTION_CLASSES.includes(input.manualConstructionClass)) {
    errors.push("Оберіть клас конструкції S.");
  }

  return errors;
}

function calculateBondCover(input: ConcreteCoverDurabilityInput): {
  baseCoverMm: number;
  coverMm: number;
  formulas: string[];
  notes: string[];
} {
  let baseCoverMm = 0;
  let baseFormula = "";

  if (input.bondCoverMode === "bar") {
    baseCoverMm = input.barDiameterMm;
    baseFormula = `cmin,b = φ = ${formatNumber(input.barDiameterMm)} мм`;
  } else if (input.bondCoverMode === "strand") {
    baseCoverMm = input.strandEquivalentDiameterMm;
    baseFormula = `cmin,b = φp = ${formatNumber(input.strandEquivalentDiameterMm)} мм`;
  } else if (input.bondCoverMode === "round-duct") {
    baseCoverMm = input.roundDuctDiameterMm;
    baseFormula = `cmin,b = dduct = ${formatNumber(input.roundDuctDiameterMm)} мм`;
  } else if (input.bondCoverMode === "rectangular-duct") {
    baseCoverMm = Math.max(input.rectangularDuctShortSideMm, input.rectangularDuctLongSideMm / 2);
    baseFormula = `cmin,b = max(aduct; bduct / 2) = max(${formatNumber(input.rectangularDuctShortSideMm)}; ${formatNumber(input.rectangularDuctLongSideMm)} / 2) = ${formatNumber(baseCoverMm)} мм`;
  } else if (input.bondCoverMode === "pre-tensioned-wire") {
    baseCoverMm = 1.5 * input.preTensionedElementDiameterMm;
    baseFormula = `cmin,b = 1.5 * dp = 1.5 * ${formatNumber(input.preTensionedElementDiameterMm)} = ${formatNumber(baseCoverMm)} мм`;
  } else {
    baseCoverMm = 2.5 * input.preTensionedElementDiameterMm;
    baseFormula = `cmin,b = 2.5 * dp = 2.5 * ${formatNumber(input.preTensionedElementDiameterMm)} = ${formatNumber(baseCoverMm)} мм`;
  }

  const notes: string[] = [];
  const formulas = [baseFormula];
  const coverMm = input.aggregateMaxSizeMm > 32 ? baseCoverMm + 5 : baseCoverMm;

  if (input.aggregateMaxSizeMm > 32) {
    notes.push(`Оскільки Dmax = ${formatNumber(input.aggregateMaxSizeMm)} мм > 32 мм, згідно з приміткою до табл. 4.2 cmin,b збільшується на 5 мм.`);
    formulas.push(`cmin,b = cmin,b,base + 5 = ${formatNumber(baseCoverMm)} + 5 = ${formatNumber(coverMm)} мм`);
  }

  return { baseCoverMm, coverMm, formulas, notes };
}
```

Implement construction class and report-step builders using the exact strings asserted in Task 1. For automatic construction class:

```ts
function calculateConstructionClass(input: ConcreteCoverDurabilityInput): {
  constructionClass: ConcreteCoverConstructionClass;
  caption: string;
  formulas: string[];
  notes: string[];
} {
  if (input.constructionClassMode === "manual") {
    return {
      constructionClass: input.manualConstructionClass,
      caption: "Прийняття класу конструкції S користувачем:",
      formulas: [`S = ${input.manualConstructionClass}`],
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
    notes.push(`Клас міцності бетону ${input.concreteClass} >= ${requiredConcreteClass}: зменшення на 1 клас.`);
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
    notes.push("Забезпечено спеціальний контроль якості виготовлення бетону: зменшення на 1 клас.");
    const previous = current;
    current = shiftClass(current, -1);
    formulas.push(`S = ${previous} - 1 = ${current}`);
  }
  notes.push("Клас конструкції обмежується діапазоном S1...S6.");
  formulas.push(`S = clamp(${current}; S1; S6) = ${current}`);

  return {
    constructionClass: current,
    caption: "Визначення класу конструкції S за розрахунковим строком експлуатації та факторами впливу (п. 4.4.2.4.3, табл. 4.5 ДБН В.2.6-98:2009):",
    formulas,
    notes,
  };
}
```

Build `getConcreteCoverDurabilityReport(input)` so invalid input returns only the input step plus errors. For valid input, push the seven steps in the order asserted by Task 1 and set the warning exactly when `nominalCoverMm > 45`.

- [ ] **Step 2: Add return URL helper**

Add:

```ts
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
  if (sourceExposureClasses) params.set("sourceExposureClasses", sourceExposureClasses);
  if (sourceCalculator) params.set("sourceCalculator", sourceCalculator);
  return `/calculator/concrete-cover-durability?${params.toString()}`;
}
```

- [ ] **Step 3: Run core tests**

Run:

```bash
npm run test -- lib/concrete-cover-durability.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit the core**

```bash
git add lib/concrete-cover-durability.ts lib/concrete-cover-durability.test.ts
git commit -m "feat: add concrete cover durability core"
```

---

### Task 3: UI Failing Tests

**Files:**
- Create: `components/calculators/concrete-cover-durability-calculator.test.tsx`

- [ ] **Step 1: Add UI tests**

Create `components/calculators/concrete-cover-durability-calculator.test.tsx` with:

```tsx
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  CONCRETE_COVER_DURABILITY_INPUT_SCHEMA,
  ConcreteCoverDurabilityCalculator,
  buildConcreteCoverDurabilityDocxReport,
  getConcreteCoverDurabilityInitialValues,
} from "./concrete-cover-durability-calculator";
import {
  DEFAULT_CONCRETE_COVER_DURABILITY_INPUT,
  getConcreteCoverDurabilityReport,
} from "@/lib/concrete-cover-durability";

function findSchemaField(id: string) {
  for (const group of CONCRETE_COVER_DURABILITY_INPUT_SCHEMA.groups) {
    const field = group.fields.find((item) => item.id === id);
    if (field) return field;
  }
  throw new Error(`Missing schema field ${id}`);
}

describe("ConcreteCoverDurabilityCalculator", () => {
  it("defines the exposure class field with an icon-only calculator action", () => {
    expect(findSchemaField("exposureClass")).toMatchObject({
      kind: "select",
      name: "Клас впливу середовища",
      calculatorAction: { label: "Розрахувати клас впливу" },
    });
  });

  it("renders the calculator with summary, report, docs action, and norms", () => {
    render(<ConcreteCoverDurabilityCalculator />);

    expect(
      screen.getByLabelText("Калькулятор захисного шару бетону для арматури"),
    ).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Елемент і середовище" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Клас впливу середовища" })).toHaveValue("XC1");
    expect(
      screen.getByRole("button", { name: "Розрахувати клас впливу" }),
    ).toHaveAttribute("title", "Розрахувати клас впливу");
    expect(screen.getByText("Мінімальний захисний шар: cmin = 16 мм")).toBeInTheDocument();
    expect(screen.getByText("Номінальний захисний шар для креслень: cnom = 26 мм")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Покроковий звіт" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Нормативні посилання" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Завантажити DOCX" })).toBeInTheDocument();
  });

  it("opens the exposure-class calculator through the inspector action", async () => {
    const originalLocation = window.location;
    const assign = vi.fn();
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, assign },
    });
    const user = userEvent.setup();

    render(<ConcreteCoverDurabilityCalculator />);
    await user.click(screen.getByRole("button", { name: "Розрахувати клас впливу" }));

    expect(assign).toHaveBeenCalledTimes(1);
    const targetUrl = assign.mock.calls[0]?.[0] as string;
    const url = new URL(targetUrl, "https://ivapps.pro");
    expect(url.pathname).toBe("/calculator/concrete-exposure-class");
    expect(url.searchParams.get("returnTo")).toBe("/calculator/concrete-cover-durability");
    expect(url.searchParams.get("returnField")).toBe("exposureClass");
    expect(url.searchParams.get("returnLabel")).toBe("Розрахунок захисного шару");
    expect(url.searchParams.get("elementName")).toBe("Елемент");
    expect(url.searchParams.get("elementType")).toBe("other");
    expect(url.searchParams.get("reinforcementPresence")).toBe("reinforced_or_embedded_metal");
    expect(url.searchParams.get("currentExposureClass")).toBe("XC1");

    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation,
    });
  });

  it("prefills exposure class and audit source from query parameters", () => {
    window.history.pushState(
      {},
      "",
      "/calculator/concrete-cover-durability?exposureClass=XD3&sourceExposureClasses=XC4%2CXD3%2CXF4&sourceCalculator=concrete-exposure-class",
    );

    const values = getConcreteCoverDurabilityInitialValues();

    expect(values.exposureClass).toBe("XD3");
    expect(values.sourceExposureClasses).toBe("XC4,XD3,XF4");
    expect(values.sourceCalculator).toBe("concrete-exposure-class");
  });

  it("shows conditional bond fields for the selected mode", async () => {
    const user = userEvent.setup();
    render(<ConcreteCoverDurabilityCalculator />);

    expect(screen.getByRole("textbox", { name: "Діаметр стрижня" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Менша сторона прямокутного каналу" })).not.toBeInTheDocument();

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Спосіб визначення cmin,b" }),
      "rectangular-duct",
    );

    expect(screen.getByRole("textbox", { name: "Менша сторона прямокутного каналу" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Більша сторона прямокутного каналу" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Діаметр стрижня" })).not.toBeInTheDocument();
  });

  it("maps the report to the universal DOCX report contract", () => {
    const report = getConcreteCoverDurabilityReport({
      ...DEFAULT_CONCRETE_COVER_DURABILITY_INPUT,
    });
    const docxReport = buildConcreteCoverDurabilityDocxReport(report, new Date("2026-06-17T00:00:00.000Z"));

    expect(docxReport).toMatchObject({
      title: "Покроковий звіт",
      fileBaseName: "zakhysnyi-shar-betonu-2026-06-17",
    });
    expect(docxReport.steps.map((step) => step.key)).toEqual(report.steps.map((step) => step.key));
    expect(docxReport.steps[5].formula).toBe("cnom = cmin + Δcdev = 16 + 10 = 26 мм");
  });
});
```

- [ ] **Step 2: Run the failing UI tests**

Run:

```bash
npm run test -- components/calculators/concrete-cover-durability-calculator.test.tsx
```

Expected: FAIL because the UI component does not exist.

- [ ] **Step 3: Commit the failing UI tests**

```bash
git add components/calculators/concrete-cover-durability-calculator.test.tsx
git commit -m "test: cover concrete cover durability UI"
```

---

### Task 4: UI Implementation

**Files:**
- Create: `components/calculators/concrete-cover-durability-calculator.tsx`
- Test: `components/calculators/concrete-cover-durability-calculator.test.tsx`

- [ ] **Step 1: Add the schema and query-param helpers**

Create `components/calculators/concrete-cover-durability-calculator.tsx`. Start with imports and exported schema:

```tsx
"use client";

import { useMemo, useState } from "react";

import {
  DEFAULT_CONCRETE_COVER_DURABILITY_INPUT,
  getConcreteCoverDurabilityReport,
  type ConcreteCoverBondMode,
  type ConcreteCoverConstructionClass,
  type ConcreteCoverConstructionClassMode,
  type ConcreteCoverDesignWorkingLife,
  type ConcreteCoverDurabilityInput,
  type ConcreteCoverDurabilityReport,
  type ConcreteCoverReinforcementDurabilityType,
} from "@/lib/concrete-cover-durability";
import type { CoverExposureClass, ReinforcementPresence } from "@/lib/concrete-exposure-class";
import {
  getDefaultInputSchemaValues,
  type CalculatorInputSchema,
  type CalculatorInputValues,
} from "@/lib/calculator-input-schema";

import { InputSchemaForm, type InputSchemaFieldCalculatorActionEvent } from "./input-schema-form";
import { NativeCalculatorLayout } from "./native-calculator-layout";
import { NativeReport } from "./native-report";
import { buildNativeDocxReport, formatDocxFileDate } from "./native-report-docx";
import { ReportDocxButton } from "./report-docx-button";
```

Define `MM_UNIT`, select options, and `CONCRETE_COVER_DURABILITY_INPUT_SCHEMA`. Use group ids:

```text
concrete-cover-context
concrete-cover-bond
concrete-cover-construction-class
concrete-cover-adjustments
```

The `exposureClass` field must include:

```ts
calculatorAction: { label: "Розрахувати клас впливу" }
```

The `deltaCdevMm` field description must exactly match the report contract.

- [ ] **Step 2: Add conversion and prefill helpers**

Add:

```tsx
function parseNumberInput(value: unknown): number {
  return Number.parseFloat(String(value ?? "").replace(",", "."));
}

function getSearchParam(name: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
}

function isCoverExposureClass(value: string | null): value is CoverExposureClass {
  return ["X0", "XC1", "XC2", "XC3", "XC4", "XD1", "XD2", "XD3", "XS1", "XS2", "XS3"].includes(value ?? "");
}

export function getConcreteCoverDurabilityInitialValues(): CalculatorInputValues {
  const values = getDefaultInputSchemaValues(CONCRETE_COVER_DURABILITY_INPUT_SCHEMA);
  const exposureClass = getSearchParam("exposureClass");
  const sourceExposureClasses = getSearchParam("sourceExposureClasses");
  const sourceCalculator = getSearchParam("sourceCalculator");

  if (isCoverExposureClass(exposureClass)) values.exposureClass = exposureClass;
  if (sourceExposureClasses) values.sourceExposureClasses = sourceExposureClasses;
  if (sourceCalculator === "concrete-exposure-class") values.sourceCalculator = sourceCalculator;

  return values;
}
```

Add `inputFromValues(values)` that maps every schema field to `ConcreteCoverDurabilityInput`, preserving `sourceExposureClasses` and `sourceCalculator` when present.

- [ ] **Step 3: Add DOCX adapter and exposure-class action URL**

Add:

```tsx
export function buildConcreteCoverDurabilityDocxReport(
  report: ConcreteCoverDurabilityReport,
  date = new Date(),
) {
  return buildNativeDocxReport({
    title: "Покроковий звіт",
    fileBaseName: `zakhysnyi-shar-betonu-${formatDocxFileDate(date)}`,
    steps: report.steps,
  });
}

function getExposureCalculatorUrl(values: CalculatorInputValues): string {
  const params = new URLSearchParams();
  params.set("returnTo", "/calculator/concrete-cover-durability");
  params.set("returnField", "exposureClass");
  params.set("returnLabel", "Розрахунок захисного шару");
  params.set("elementName", String(values.elementName ?? "Елемент"));
  params.set("elementType", "other");
  params.set("reinforcementPresence", "reinforced_or_embedded_metal" satisfies ReinforcementPresence);
  params.set("currentExposureClass", String(values.exposureClass ?? "XC1"));
  return `/calculator/concrete-exposure-class?${params.toString()}`;
}
```

Add action handler:

```tsx
function handleFieldCalculatorAction(event: InputSchemaFieldCalculatorActionEvent) {
  if (event.fieldId !== "exposureClass") return;
  window.location.assign(getExposureCalculatorUrl(event.values));
}
```

- [ ] **Step 4: Add component render**

Render with:

```tsx
export function ConcreteCoverDurabilityCalculator() {
  const [inputValues, setInputValues] = useState<CalculatorInputValues>(() =>
    getConcreteCoverDurabilityInitialValues(),
  );
  const input = useMemo(() => inputFromValues(inputValues), [inputValues]);
  const report = useMemo(() => getConcreteCoverDurabilityReport(input), [input]);
  const docxReport = useMemo(() => buildConcreteCoverDurabilityDocxReport(report), [report]);
  const resultSummary =
    report.valid && report.values ? (
      <div className="concrete-cover-durability-summary" aria-live="polite">
        <p>Мінімальний захисний шар: cmin = {report.values.minimumCoverMm} мм</p>
        <p>Номінальний захисний шар для креслень: cnom = {report.values.nominalCoverMm} мм</p>
      </div>
    ) : null;

  return (
    <NativeCalculatorLayout
      ariaLabel="Калькулятор захисного шару бетону для арматури"
      navLinks={[
        { href: "#concrete-cover-context", label: "Елемент" },
        { href: "#concrete-cover-bond", label: "Зчеплення" },
        { href: "#concrete-cover-construction-class", label: "Клас S" },
        { href: "#concrete-cover-adjustments", label: "Поправки" },
        { href: "#concrete-cover-durability-report-title", label: "Звіт" },
        { href: "#concrete-cover-durability-norms-title", label: "Норми" },
      ]}
      summary={resultSummary}
      controls={
        <InputSchemaForm
          schema={CONCRETE_COVER_DURABILITY_INPUT_SCHEMA}
          values={inputValues}
          onValuesChange={setInputValues}
          onFieldCalculatorAction={handleFieldCalculatorAction}
        />
      }
      errors={report.errors}
      warnings={report.warnings}
    >
      <NativeReport
        titleId="concrete-cover-durability-report-title"
        title="Покроковий звіт"
        steps={report.steps}
        actions={<ReportDocxButton report={docxReport} />}
      />
      <ConcreteCoverDurabilityNorms />
    </NativeCalculatorLayout>
  );
}
```

Add `ConcreteCoverDurabilityNorms()` with the exact normative items from the report contract.

- [ ] **Step 5: Run UI tests**

Run:

```bash
npm run test -- components/calculators/concrete-cover-durability-calculator.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit UI implementation**

```bash
git add components/calculators/concrete-cover-durability-calculator.tsx components/calculators/concrete-cover-durability-calculator.test.tsx
git commit -m "feat: add concrete cover durability UI"
```

---

### Task 5: Native Calculator Registration

**Files:**
- Modify: `lib/calculators.ts`
- Modify: `components/calculator-shell.tsx`
- Modify: `components/calculator-shell.test.tsx`
- Modify: `lib/calculators.test.ts`
- Modify: `data/content.json`
- Test: `lib/calculators.test.ts`
- Test: `components/calculator-shell.test.tsx`
- Test: `app/sitemap.test.ts`

- [ ] **Step 1: Add failing registration expectations**

In `lib/calculators.test.ts`, update the extra category expectation to include the new calculator:

```ts
      {
        slug: "concrete-cover-durability",
        extraCategories: ["beton", "normy-perevirky", "normatyvni-obgruntuvannya"],
      },
```

Add a registration test:

```ts
  it("registers the concrete cover durability calculator as a native reinforced concrete calculator", () => {
    const calculator = getCalculatorBySlug("concrete-cover-durability");

    expect(calculator).toMatchObject({
      title: "Захисний шар бетону для арматури",
      shortDescription:
        "Розрахунок мінімального та номінального захисного шару cmin і cnom за ДБН В.2.6-98:2009.",
      mainCategory: "zalizobeton",
      extraCategories: ["beton", "normy-perevirky", "normatyvni-obgruntuvannya"],
      displayMode: "native",
      nativeCalculator: "concrete-cover-durability",
      icon: "Shield",
      standard: "ДБН В.2.6-98:2009, п. 4.4",
    });
  });
```

In `components/calculator-shell.test.tsx`, add:

```tsx
  it("renders the native concrete cover durability calculator", () => {
    const calculator = getCalculatorBySlug("concrete-cover-durability");

    if (!calculator) {
      throw new Error("Expected native concrete cover durability calculator to exist");
    }

    render(<CalculatorShell selectedCalculator={calculator} />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Захисний шар бетону для арматури",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Калькулятор захисного шару бетону для арматури"),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Покроковий звіт" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Розрахувати клас впливу" })).toBeInTheDocument();
  });
```

- [ ] **Step 2: Run failing registration tests**

Run:

```bash
npm run test -- lib/calculators.test.ts components/calculator-shell.test.tsx app/sitemap.test.ts
```

Expected: FAIL because the calculator is not registered.

- [ ] **Step 3: Register the native calculator literal**

In `lib/calculators.ts`, add `"concrete-cover-durability"` to the `nativeCalculator` union after `"concrete-exposure-class"`.

- [ ] **Step 4: Register the shell component**

In `components/calculator-shell.tsx`, import:

```tsx
import { ConcreteCoverDurabilityCalculator } from "@/components/calculators/concrete-cover-durability-calculator";
```

Add the switch case:

```tsx
    case "concrete-cover-durability":
      return <ConcreteCoverDurabilityCalculator />;
```

- [ ] **Step 5: Add content entry**

In `data/content.json`, add this calculator near the existing concrete exposure class entry:

```json
{
  "slug": "concrete-cover-durability",
  "title": "Захисний шар бетону для арматури",
  "shortDescription": "Розрахунок мінімального та номінального захисного шару cmin і cnom за ДБН В.2.6-98:2009.",
  "description": "Нативний калькулятор визначає cmin,b за вимогами зчеплення, клас конструкції S, cmin,dur за таблицями 4.3/4.4, мінімальний cmin і номінальний cnom з урахуванням Δcdev.",
  "mainCategory": "zalizobeton",
  "extraCategories": ["beton", "normy-perevirky", "normatyvni-obgruntuvannya"],
  "displayMode": "native",
  "nativeCalculator": "concrete-cover-durability",
  "accessLabel": "Нативний розрахунок",
  "openUrl": "/calculator/concrete-cover-durability",
  "order": 32,
  "seoContent": {
    "task": "Розрахунок захисного шару бетону для арматури за ДБН В.2.6-98:2009, розділ 4.4.",
    "applications": ["Робочі креслення залізобетонних елементів", "Перевірка мінімального захисного шару", "Аудит cmin і cnom"],
    "inputParameters": ["Клас впливу середовища", "Тип арматури", "Діаметр або канал для cmin,b", "Клас конструкції S", "Поправки Δcdur і Δcdev"],
    "formulas": ["cmin = max(cmin,b; cmin,dur + Δcdur,γ - Δcdur,st - Δcdur,add; 10 мм)", "cnom = cmin + Δcdev"],
    "example": "Для XC1, звичайної арматури Ø16 мм, S3 і Δcdev = 10 мм калькулятор отримує cmin = 16 мм і cnom = 26 мм.",
    "limitations": ["Не виконує розрахунок вогнестійкості.", "Тимчасово без рисунку перерізу."],
    "standards": ["ДБН В.2.6-98:2009, п. 4.4"]
  },
  "standard": "ДБН В.2.6-98:2009, п. 4.4",
  "editorialLabel": "Новий",
  "useCases": ["Захисний шар арматури", "cmin і cnom", "Перевірка ДБН"],
  "tags": ["залізобетон", "захисний шар", "ДБН"],
  "tools": ["IVapps"],
  "icon": "Shield"
}
```

- [ ] **Step 6: Run registration tests**

Run:

```bash
npm run test -- lib/calculators.test.ts components/calculator-shell.test.tsx app/sitemap.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit registration**

```bash
git add lib/calculators.ts components/calculator-shell.tsx components/calculator-shell.test.tsx lib/calculators.test.ts data/content.json
git commit -m "feat: register concrete cover durability calculator"
```

---

### Task 6: Integrated Verification And Polish

**Files:**
- Review: `lib/concrete-cover-durability.ts`
- Review: `components/calculators/concrete-cover-durability-calculator.tsx`
- Review: `data/content.json`

- [ ] **Step 1: Run targeted tests**

Run:

```bash
npm run test -- lib/concrete-cover-durability.test.ts components/calculators/concrete-cover-durability-calculator.test.tsx lib/calculators.test.ts components/calculator-shell.test.tsx app/sitemap.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run full tests**

Run:

```bash
npm run test
```

Expected: PASS.

- [ ] **Step 3: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Run production build**

Run:

```bash
npm run build
```

Expected: PASS and static export includes `/calculator/concrete-cover-durability`.

- [ ] **Step 5: Inspect final diff**

Run:

```bash
git diff --stat HEAD
git diff -- lib/concrete-cover-durability.ts components/calculators/concrete-cover-durability-calculator.tsx data/content.json
```

Expected: only concrete-cover durability implementation, tests, and registration.

- [ ] **Step 6: Commit verification fixes**

If verification required changes, commit them:

```bash
git add lib/concrete-cover-durability.ts lib/concrete-cover-durability.test.ts components/calculators/concrete-cover-durability-calculator.tsx components/calculators/concrete-cover-durability-calculator.test.tsx lib/calculators.ts components/calculator-shell.tsx components/calculator-shell.test.tsx lib/calculators.test.ts data/content.json app/sitemap.test.ts
git commit -m "chore: verify concrete cover durability calculator"
```

If no files changed during verification, do not create an empty commit.

## Plan Self-Review

- Spec coverage: the plan covers the core, UI, inspector action, query-param handoff, DOCX adapter, catalog registration, sitemap loop, warnings, validation, and final verification.
- Source of truth: report strings and formulas are tested against exact strings from `2026-06-17-concrete-cover-durability-report-contract.md`.
- Type consistency: the plan uses `ConcreteCoverDurabilityInput`, `ConcreteCoverDurabilityReport`, `ConcreteCoverConstructionClass`, and `CoverExposureClass` consistently.
- Scope: the drawing remains out of scope; no task adds a diagram.
- Placeholder scan: searched for planning placeholders and found none.
