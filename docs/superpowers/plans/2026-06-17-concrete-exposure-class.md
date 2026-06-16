# Concrete Exposure Class Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the standalone native `concrete-exposure-class` calculator that determines environmental exposure classes and returns a governing `exposureClass` for the future concrete cover durability calculator.

**Architecture:** Put all engineering rules, validation, report step construction, warnings, and URL-safe result values in `lib/concrete-exposure-class.ts`. Build a thin React adapter in `components/calculators/concrete-exposure-class-calculator.tsx` using `InputSchemaForm`, `NativeCalculatorLayout`, and `NativeReport`. Register the calculator through the existing native calculator path in `data/content.json`, `lib/calculators.ts`, and `components/calculator-shell.tsx`.

**Tech Stack:** TypeScript, React 19, Next.js App Router, Vitest, Testing Library, existing native calculator components.

---

## Source Documents

- Report contract: `docs/superpowers/specs/2026-06-17-concrete-exposure-class-report-contract.md`
- Design spec: `docs/superpowers/specs/2026-06-17-concrete-exposure-class-design.md`
- Native calculator guide: `docs/calculation-reporting-guide.md`

The report contract is the source of truth for captions, formulas, display rules, warnings, errors, and handoff behavior. If this plan or the design spec differs from the report contract, update the plan or design to match the contract.

## File Map

- Create `lib/concrete-exposure-class.ts`: typed calculation core, rule mappings, report builder, label dictionaries, URL-safe output helpers.
- Create `lib/concrete-exposure-class.test.ts`: unit tests for rule mappings, report text, warnings, errors, stable ordering, and governing class rank.
- Create `components/calculators/concrete-exposure-class-calculator.tsx`: client UI, input schema, query-param prefill, return link, summary, and report rendering.
- Create `components/calculators/concrete-exposure-class-calculator.test.tsx`: UI schema, query-param prefill, conditional fields, result summary, and return-link tests.
- Modify `lib/calculators.ts`: add `"concrete-exposure-class"` to the `nativeCalculator` union.
- Modify `components/calculator-shell.tsx`: import and route the new native calculator.
- Modify `data/content.json`: add the calculator catalog entry.
- Modify `lib/calculators.test.ts`: registry and category assertions for the new calculator.
- Modify `components/calculator-shell.test.tsx`: shell smoke test that renders the new native calculator.
- Modify `app/globals.css`: only if the summary/return action needs small calculator-specific layout styling.

## Implementation Notes

Use these stable string unions in `lib/concrete-exposure-class.ts`:

```ts
export type CoverExposureClass =
  | "X0"
  | "XC1"
  | "XC2"
  | "XC3"
  | "XC4"
  | "XD1"
  | "XD2"
  | "XD3"
  | "XS1"
  | "XS2"
  | "XS3";

export type ExposureClass = CoverExposureClass | "XF1" | "XF2" | "XF3" | "XF4" | "XA1" | "XA2" | "XA3";

export type ConcreteExposureElementType =
  | "slab"
  | "beam"
  | "column"
  | "wall"
  | "foundation"
  | "retaining_wall"
  | "tank"
  | "other";

export type ReinforcementPresence =
  | "reinforced_or_embedded_metal"
  | "plain_concrete_without_metal";

export type CarbonationMoistureCondition =
  | "dry_or_permanently_wet"
  | "wet_rarely_dry"
  | "moderate_or_high_humidity"
  | "cyclic_wet_dry";

export type ChlorideSource =
  | "none"
  | "deicing_salts"
  | "airborne_sea_salts"
  | "sea_water";

export type ChlorideMoistureCondition =
  | "moderate_humidity"
  | "wet_rarely_dry"
  | "permanently_submerged"
  | "cyclic_wet_dry"
  | "splash_or_spray";

export type FreezeThawRisk =
  | "none"
  | "moderate_water_saturation_without_deicing"
  | "moderate_water_saturation_with_deicing"
  | "high_water_saturation_without_deicing"
  | "high_water_saturation_with_deicing_or_sea_water";

export type ChemicalAttackRisk =
  | "none"
  | "XA1"
  | "XA2"
  | "XA3"
  | "unknown_requires_analysis";
```

Use this default input:

```ts
export const DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT: ConcreteExposureClassInput = {
  elementName: "Елемент",
  elementType: "column",
  reinforcementPresence: "reinforced_or_embedded_metal",
  carbonationMoistureCondition: "dry_or_permanently_wet",
  chlorideSource: "none",
  chlorideMoistureCondition: "moderate_humidity",
  freezeThawRisk: "none",
  chemicalAttackRisk: "none",
  hasSoilOrGroundwaterAnalysis: false,
};
```

Use this report step key order:

```ts
[
  "inputs",
  "x0-check",
  "xc-carbonation",
  "xd-chlorides",
  "xs-marine-chlorides",
  "xf-freeze-thaw",
  "xa-chemical-attack",
  "class-set",
  "governing-cover-class",
  "additional-requirements",
  "conclusion",
]
```

---

### Task 1: Core Unit Tests

**Files:**
- Create: `lib/concrete-exposure-class.test.ts`
- Create in Task 2: `lib/concrete-exposure-class.ts`

- [ ] **Step 1: Write failing tests for the calculation core**

Create `lib/concrete-exposure-class.test.ts` with this content:

```ts
import { describe, expect, it } from "vitest";

import {
  DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT,
  getConcreteExposureClassReport,
  getConcreteExposureClassReturnUrl,
  type ConcreteExposureClassInput,
} from "@/lib/concrete-exposure-class";

function reportFor(input: Partial<ConcreteExposureClassInput>) {
  return getConcreteExposureClassReport({
    ...DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT,
    ...input,
  });
}

describe("getConcreteExposureClassReport", () => {
  it("returns XC1 for a reinforced dry or permanently wet element", () => {
    const report = reportFor({
      reinforcementPresence: "reinforced_or_embedded_metal",
      carbonationMoistureCondition: "dry_or_permanently_wet",
    });

    expect(report.valid).toBe(true);
    expect(report.values?.exposureClasses).toEqual(["XC1"]);
    expect(report.values?.governingCoverExposureClass).toBe("XC1");
    expect(report.steps.map((step) => step.key)).toEqual([
      "inputs",
      "x0-check",
      "xc-carbonation",
      "xd-chlorides",
      "xs-marine-chlorides",
      "xf-freeze-thaw",
      "xa-chemical-attack",
      "class-set",
      "governing-cover-class",
      "additional-requirements",
      "conclusion",
    ]);
    expect(report.steps.find((step) => step.key === "xc-carbonation")?.formula).toBe(
      "XC = f(carbonation_moisture_condition) = dry_or_permanently_wet => XC1",
    );
  });

  it("accepts X0 only for plain concrete without metal and without XF or XA", () => {
    const report = reportFor({
      reinforcementPresence: "plain_concrete_without_metal",
      freezeThawRisk: "none",
      chemicalAttackRisk: "none",
    });

    expect(report.valid).toBe(true);
    expect(report.values?.exposureClasses).toEqual(["X0"]);
    expect(report.values?.governingCoverExposureClass).toBe("X0");
    expect(report.steps.find((step) => step.key === "x0-check")?.formula).toBe(
      "X0 = plain_concrete_without_metal and XF = none and XA = none = true",
    );
  });

  it("maps carbonation moisture conditions to XC classes", () => {
    expect(reportFor({ carbonationMoistureCondition: "wet_rarely_dry" }).values?.exposureClasses).toContain("XC2");
    expect(reportFor({ carbonationMoistureCondition: "moderate_or_high_humidity" }).values?.exposureClasses).toContain("XC3");
    expect(reportFor({ carbonationMoistureCondition: "cyclic_wet_dry" }).values?.exposureClasses).toContain("XC4");
  });

  it("maps deicing salts to XD classes", () => {
    expect(
      reportFor({
        chlorideSource: "deicing_salts",
        chlorideMoistureCondition: "moderate_humidity",
      }).values?.exposureClasses,
    ).toContain("XD1");
    expect(
      reportFor({
        chlorideSource: "deicing_salts",
        chlorideMoistureCondition: "wet_rarely_dry",
      }).values?.exposureClasses,
    ).toContain("XD2");
    expect(
      reportFor({
        chlorideSource: "deicing_salts",
        chlorideMoistureCondition: "splash_or_spray",
      }).values?.exposureClasses,
    ).toContain("XD3");
  });

  it("maps marine chlorides to XS classes including wet rarely dry as XS2", () => {
    expect(reportFor({ chlorideSource: "airborne_sea_salts" }).values?.exposureClasses).toContain("XS1");
    expect(
      reportFor({
        chlorideSource: "sea_water",
        chlorideMoistureCondition: "permanently_submerged",
      }).values?.exposureClasses,
    ).toContain("XS2");
    expect(
      reportFor({
        chlorideSource: "sea_water",
        chlorideMoistureCondition: "wet_rarely_dry",
      }).values?.exposureClasses,
    ).toContain("XS2");
    expect(
      reportFor({
        chlorideSource: "sea_water",
        chlorideMoistureCondition: "cyclic_wet_dry",
      }).values?.exposureClasses,
    ).toContain("XS3");
  });

  it("maps freeze thaw risks to XF classes and adds requirements", () => {
    const report = reportFor({
      freezeThawRisk: "high_water_saturation_with_deicing_or_sea_water",
    });

    expect(report.values?.exposureClasses).toContain("XF4");
    expect(report.values?.additionalDurabilityRequirements).toContain(
      "Для класу XF необхідно перевірити вимоги до морозостійкості бетону, водонасичення, водонепроникності, повітровтягування та складу бетонної суміші.",
    );
  });

  it("maps XA classes, explains severity, and warns when analysis is absent", () => {
    const report = reportFor({
      chemicalAttackRisk: "XA2",
      hasSoilOrGroundwaterAnalysis: false,
    });

    expect(report.values?.exposureClasses).toContain("XA2");
    expect(report.warnings).toContain(
      "Клас XA прийнято за вибором користувача. Для остаточного призначення класу хімічної агресії потрібен аналіз ґрунту або води.",
    );
    expect(report.steps.find((step) => step.key === "xa-chemical-attack")?.formula).toBe(
      "XA = f(chemical_attack_risk; has_soil_or_groundwater_analysis) = XA2; false => XA2 — помірна хімічна агресія",
    );
  });

  it("keeps unknown XA out of exposure_classes and emits the agreed warning", () => {
    const report = reportFor({ chemicalAttackRisk: "unknown_requires_analysis" });

    expect(report.values?.exposureClasses).not.toContain("XA_unknown");
    expect(report.warnings).toContain("Для визначення класу XA потрібен аналіз ґрунту або води.");
    expect(report.steps.find((step) => step.key === "class-set")?.formula).toBe(
      "exposure_classes = union(XC1; XA_unknown) = [XC1]",
    );
  });

  it("keeps stable class order and selects governing cover class by rank", () => {
    const report = reportFor({
      carbonationMoistureCondition: "cyclic_wet_dry",
      chlorideSource: "deicing_salts",
      chlorideMoistureCondition: "splash_or_spray",
      freezeThawRisk: "high_water_saturation_with_deicing_or_sea_water",
    });

    expect(report.values?.exposureClasses).toEqual(["XC4", "XD3", "XF4"]);
    expect(report.values?.governingCoverExposureClass).toBe("XD3");
    expect(report.steps.find((step) => step.key === "governing-cover-class")?.formula).toBe(
      "governing_cover_exposure_class = max_rank(X0; XC; XD; XS) = max_rank([XC4, XD3]) = XD3",
    );
  });

  it("returns stable report text for the input and conclusion steps", () => {
    const report = reportFor({
      elementName: "Балка Б-1",
      elementType: "beam",
      currentExposureClass: "XC1",
      carbonationMoistureCondition: "cyclic_wet_dry",
    });

    expect(report.steps[0].caption).toBe(
      "Вихідні дані для визначення класу впливу середовища (ДБН В.2.6-98:2009, розділ 4.3-4.4; ДСТУ ENV 206:2018, класи впливу середовища):",
    );
    expect(report.steps[0].items).toContain("Назва елемента: Балка Б-1");
    expect(report.steps[0].items).toContain("Тип елемента: балка");
    expect(report.steps[0].items).toContain("Поточний клас у розрахунку захисного шару: XC1");
    expect(report.steps.at(-1)?.formula).toBe(
      "exposure_classes -> governing_cover_exposure_class = [XC4] -> XC4",
    );
  });
});

describe("getConcreteExposureClassReturnUrl", () => {
  it("uses returnTo and returnField when they are provided", () => {
    expect(
      getConcreteExposureClassReturnUrl({
        returnTo: "/calculator/concrete-cover-durability",
        returnField: "exposureClass",
        governingCoverExposureClass: "XD3",
        exposureClasses: ["XC4", "XD3", "XF4"],
      }),
    ).toBe(
      "/calculator/concrete-cover-durability?exposureClass=XD3&sourceExposureClasses=XC4%2CXD3%2CXF4&sourceCalculator=concrete-exposure-class",
    );
  });

  it("uses the future concrete cover durability calculator as the default return target", () => {
    expect(
      getConcreteExposureClassReturnUrl({
        governingCoverExposureClass: "XC1",
        exposureClasses: ["XC1"],
      }),
    ).toBe(
      "/calculator/concrete-cover-durability?exposureClass=XC1&sourceExposureClasses=XC1&sourceCalculator=concrete-exposure-class",
    );
  });
});
```

- [ ] **Step 2: Run the core tests and verify they fail**

Run:

```bash
npm run test -- lib/concrete-exposure-class.test.ts
```

Expected: FAIL with a module resolution error for `@/lib/concrete-exposure-class`.

- [ ] **Step 3: Commit the failing core tests**

Run:

```bash
git add lib/concrete-exposure-class.test.ts
git commit -m "test: define concrete exposure class rules"
```

Expected: commit succeeds with only `lib/concrete-exposure-class.test.ts` staged.

---

### Task 2: Core Implementation

**Files:**
- Create: `lib/concrete-exposure-class.ts`
- Test: `lib/concrete-exposure-class.test.ts`

- [ ] **Step 1: Create the calculation core**

Create `lib/concrete-exposure-class.ts`. Implement these exported values and functions:

```ts
export const CONCRETE_EXPOSURE_CLASS_SOURCE =
  "ДБН В.2.6-98:2009 / ДСТУ ENV 206:2018";

export type CoverExposureClass =
  | "X0"
  | "XC1"
  | "XC2"
  | "XC3"
  | "XC4"
  | "XD1"
  | "XD2"
  | "XD3"
  | "XS1"
  | "XS2"
  | "XS3";

export type ExposureClass =
  | CoverExposureClass
  | "XF1"
  | "XF2"
  | "XF3"
  | "XF4"
  | "XA1"
  | "XA2"
  | "XA3";

export type ConcreteExposureElementType =
  | "slab"
  | "beam"
  | "column"
  | "wall"
  | "foundation"
  | "retaining_wall"
  | "tank"
  | "other";

export type ReinforcementPresence =
  | "reinforced_or_embedded_metal"
  | "plain_concrete_without_metal";

export type CarbonationMoistureCondition =
  | "dry_or_permanently_wet"
  | "wet_rarely_dry"
  | "moderate_or_high_humidity"
  | "cyclic_wet_dry";

export type ChlorideSource =
  | "none"
  | "deicing_salts"
  | "airborne_sea_salts"
  | "sea_water";

export type ChlorideMoistureCondition =
  | "moderate_humidity"
  | "wet_rarely_dry"
  | "permanently_submerged"
  | "cyclic_wet_dry"
  | "splash_or_spray";

export type FreezeThawRisk =
  | "none"
  | "moderate_water_saturation_without_deicing"
  | "moderate_water_saturation_with_deicing"
  | "high_water_saturation_without_deicing"
  | "high_water_saturation_with_deicing_or_sea_water";

export type ChemicalAttackRisk =
  | "none"
  | "XA1"
  | "XA2"
  | "XA3"
  | "unknown_requires_analysis";

export type ConcreteExposureClassInput = {
  elementName: string;
  elementType: ConcreteExposureElementType;
  reinforcementPresence: ReinforcementPresence;
  carbonationMoistureCondition: CarbonationMoistureCondition;
  chlorideSource: ChlorideSource;
  chlorideMoistureCondition: ChlorideMoistureCondition;
  freezeThawRisk: FreezeThawRisk;
  chemicalAttackRisk: ChemicalAttackRisk;
  hasSoilOrGroundwaterAnalysis: boolean;
  currentExposureClass?: CoverExposureClass;
};

export type ConcreteExposureClassValues = {
  exposureClasses: ExposureClass[];
  governingCoverExposureClass: CoverExposureClass;
  additionalDurabilityRequirements: string[];
};

export type ConcreteExposureClassReportStep = {
  key:
    | "inputs"
    | "x0-check"
    | "xc-carbonation"
    | "xd-chlorides"
    | "xs-marine-chlorides"
    | "xf-freeze-thaw"
    | "xa-chemical-attack"
    | "class-set"
    | "governing-cover-class"
    | "additional-requirements"
    | "conclusion";
  caption: string;
  items?: string[];
  notes?: string[];
  formula?: string;
  formulas?: string[];
};

export type ConcreteExposureClassReport = {
  input: ConcreteExposureClassInput;
  valid: boolean;
  errors: string[];
  warnings: string[];
  values: ConcreteExposureClassValues | null;
  steps: ConcreteExposureClassReportStep[];
};

export const DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT: ConcreteExposureClassInput = {
  elementName: "Елемент",
  elementType: "column",
  reinforcementPresence: "reinforced_or_embedded_metal",
  carbonationMoistureCondition: "dry_or_permanently_wet",
  chlorideSource: "none",
  chlorideMoistureCondition: "moderate_humidity",
  freezeThawRisk: "none",
  chemicalAttackRisk: "none",
  hasSoilOrGroundwaterAnalysis: false,
};
```

Add dictionaries with these labels:

```ts
const ELEMENT_TYPE_LABELS: Record<ConcreteExposureElementType, string> = {
  slab: "плита",
  beam: "балка",
  column: "колона",
  wall: "стіна",
  foundation: "фундамент",
  retaining_wall: "підпірна стіна",
  tank: "резервуар",
  other: "інший елемент",
};
```

Implement these helpers:

```ts
function addUnique<T>(items: T[], item: T | null): void;
function getX0Class(input: ConcreteExposureClassInput): "X0" | null;
function getXcClass(input: ConcreteExposureClassInput): "XC1" | "XC2" | "XC3" | "XC4" | null;
function getXdClass(input: ConcreteExposureClassInput): "XD1" | "XD2" | "XD3" | null;
function getXsClass(input: ConcreteExposureClassInput): "XS1" | "XS2" | "XS3" | null;
function getXfClass(input: ConcreteExposureClassInput): "XF1" | "XF2" | "XF3" | "XF4" | null;
function getXaClass(input: ConcreteExposureClassInput): "XA1" | "XA2" | "XA3" | null;
function getGoverningCoverExposureClass(classes: ExposureClass[]): CoverExposureClass | null;
function buildAdditionalRequirements(classes: ExposureClass[], input: ConcreteExposureClassInput): string[];
```

Use these rank constants:

```ts
const COVER_EXPOSURE_RANK: Record<CoverExposureClass, number> = {
  X0: 0,
  XC1: 1,
  XC2: 2,
  XC3: 2,
  XC4: 3,
  XD1: 4,
  XS1: 4,
  XD2: 5,
  XS2: 5,
  XD3: 6,
  XS3: 6,
};

const COVER_EXPOSURE_ORDER: CoverExposureClass[] = [
  "X0",
  "XC1",
  "XC2",
  "XC3",
  "XC4",
  "XD1",
  "XS1",
  "XD2",
  "XS2",
  "XD3",
  "XS3",
];

const EXPOSURE_CLASS_OUTPUT_ORDER: ExposureClass[] = [
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
  "XF1",
  "XF2",
  "XF3",
  "XF4",
  "XA1",
  "XA2",
  "XA3",
];
```

Implement `getConcreteExposureClassReport(input)` so it:

- calculates X0, XC, XD, XS, XF, and XA according to the report contract;
- keeps `XA_unknown` only in formula text and warnings, not in `exposureClasses`;
- sorts classes with `EXPOSURE_CLASS_OUTPUT_ORDER`;
- returns the exact captions and formulas from the contract;
- returns the agreed warnings and errors;
- returns `values: null` only when no governing cover class can be produced for a reinforced element;
- returns `X0` with the agreed warning for plain concrete without a cover candidate.

Implement `getConcreteExposureClassReturnUrl(input)` with this signature:

```ts
export function getConcreteExposureClassReturnUrl({
  returnTo = "/calculator/concrete-cover-durability",
  returnField = "exposureClass",
  governingCoverExposureClass,
  exposureClasses,
}: {
  returnTo?: string;
  returnField?: string;
  governingCoverExposureClass: CoverExposureClass;
  exposureClasses: ExposureClass[];
}): string;
```

The implementation must create `URLSearchParams`, set the selected field to the governing class, set `sourceExposureClasses` to comma-joined classes, and set `sourceCalculator` to `concrete-exposure-class`.

- [ ] **Step 2: Run the core tests**

Run:

```bash
npm run test -- lib/concrete-exposure-class.test.ts
```

Expected: PASS.

- [ ] **Step 3: Commit the core implementation**

Run:

```bash
git add lib/concrete-exposure-class.ts lib/concrete-exposure-class.test.ts
git commit -m "feat: add concrete exposure class core"
```

Expected: commit succeeds with the core module and core tests only.

---

### Task 3: UI Schema And Query Prefill Tests

**Files:**
- Create: `components/calculators/concrete-exposure-class-calculator.test.tsx`
- Create in Task 4: `components/calculators/concrete-exposure-class-calculator.tsx`

- [ ] **Step 1: Write failing UI tests**

Create `components/calculators/concrete-exposure-class-calculator.test.tsx` with this content:

```tsx
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import type { CalculatorInputField } from "@/lib/calculator-input-schema";

import {
  CONCRETE_EXPOSURE_CLASS_INPUT_SCHEMA,
  ConcreteExposureClassCalculator,
  getConcreteExposureClassInitialValues,
} from "./concrete-exposure-class-calculator";

function findSchemaField(id: string): CalculatorInputField {
  for (const group of CONCRETE_EXPOSURE_CLASS_INPUT_SCHEMA.groups) {
    const field = group.fields.find((item) => item.id === id);
    if (field) return field;
  }
  throw new Error(`Missing schema field ${id}`);
}

afterEach(() => {
  window.history.replaceState(null, "", "/");
});

describe("CONCRETE_EXPOSURE_CLASS_INPUT_SCHEMA", () => {
  it("defines the agreed input fields and conditional chloride and analysis fields", () => {
    expect(CONCRETE_EXPOSURE_CLASS_INPUT_SCHEMA.groups.map((group) => group.title)).toEqual([
      "Елемент",
      "Корозія арматури",
      "Хлориди",
      "Мороз і хімічна агресія",
    ]);
    expect(findSchemaField("elementName")).toMatchObject({
      kind: "text",
      name: "Назва елемента",
      defaultValue: "Елемент",
    });
    expect(findSchemaField("chlorideMoistureCondition")).toMatchObject({
      name: "Вологісний режим для хлоридів",
      showWhen: { fieldId: "chlorideSource", notEquals: "none" },
    });
    expect(findSchemaField("hasSoilOrGroundwaterAnalysis")).toMatchObject({
      name: "Є аналіз ґрунту або води",
      showWhen: { fieldId: "chemicalAttackRisk", notEquals: "none" },
    });
  });

  it("uses readable XA labels in the chemical attack options", () => {
    const field = findSchemaField("chemicalAttackRisk");

    if (field.kind !== "select") {
      throw new Error("chemicalAttackRisk must be a select field");
    }

    expect(field.options.map((option) => option.label)).toEqual([
      "Немає ознак хімічної агресії",
      "XA1 — слабка хімічна агресія",
      "XA2 — помірна хімічна агресія",
      "XA3 — сильна хімічна агресія",
      "Невідомо — потрібен аналіз ґрунту або води",
    ]);
  });
});

describe("getConcreteExposureClassInitialValues", () => {
  it("prefills shared fields from calculator 1 query parameters", () => {
    window.history.pushState(
      {},
      "",
      "/calculator/concrete-exposure-class?elementName=%D0%91%D0%B0%D0%BB%D0%BA%D0%B0%20%D0%91-1&elementType=beam&reinforcementPresence=reinforced_or_embedded_metal&currentExposureClass=XC1&returnTo=%2Fcalculator%2Fconcrete-cover-durability&returnField=exposureClass&returnLabel=%D0%A0%D0%BE%D0%B7%D1%80%D0%B0%D1%85%D1%83%D0%BD%D0%BE%D0%BA%20%D0%B7%D0%B0%D1%85%D0%B8%D1%81%D0%BD%D0%BE%D0%B3%D0%BE%20%D1%88%D0%B0%D1%80%D1%83",
    );

    expect(getConcreteExposureClassInitialValues()).toMatchObject({
      elementName: "Балка Б-1",
      elementType: "beam",
      reinforcementPresence: "reinforced_or_embedded_metal",
      currentExposureClass: "XC1",
    });
  });
});

describe("ConcreteExposureClassCalculator", () => {
  it("renders result summary, report, and default return link", () => {
    render(<ConcreteExposureClassCalculator />);

    expect(
      screen.getByLabelText("Калькулятор класу впливу середовища для бетону"),
    ).toHaveClass("native-calculator");
    expect(screen.getByText("Повний набір класів: XC1")).toBeInTheDocument();
    expect(screen.getByText("Для розрахунку захисного шару прийнято: XC1")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Покроковий звіт" })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Використати в розрахунку захисного шару" }),
    ).toHaveAttribute(
      "href",
      "/calculator/concrete-cover-durability?exposureClass=XC1&sourceExposureClasses=XC1&sourceCalculator=concrete-exposure-class",
    );
  });

  it("shows conditional chloride field and updates governing class", async () => {
    const user = userEvent.setup();

    render(<ConcreteExposureClassCalculator />);

    expect(
      screen.queryByRole("combobox", { name: "Вологісний режим для хлоридів" }),
    ).not.toBeInTheDocument();

    await user.selectOptions(screen.getByRole("combobox", { name: "Джерело хлоридів" }), "deicing_salts");
    await user.selectOptions(
      screen.getByRole("combobox", { name: "Вологісний режим для хлоридів" }),
      "splash_or_spray",
    );

    expect(screen.getByText("Повний набір класів: XC1, XD3")).toBeInTheDocument();
    expect(screen.getByText("Для розрахунку захисного шару прийнято: XD3")).toBeInTheDocument();
  });

  it("prefills from query params and returns to calculator 1", () => {
    window.history.pushState(
      {},
      "",
      "/calculator/concrete-exposure-class?elementName=%D0%91%D0%B0%D0%BB%D0%BA%D0%B0%20%D0%91-1&elementType=beam&reinforcementPresence=reinforced_or_embedded_metal&currentExposureClass=XC1&returnTo=%2Fcalculator%2Fconcrete-cover-durability&returnField=exposureClass&returnLabel=%D0%A0%D0%BE%D0%B7%D1%80%D0%B0%D1%85%D1%83%D0%BD%D0%BE%D0%BA%20%D0%B7%D0%B0%D1%85%D0%B8%D1%81%D0%BD%D0%BE%D0%B3%D0%BE%20%D1%88%D0%B0%D1%80%D1%83",
    );

    render(<ConcreteExposureClassCalculator />);

    expect(screen.getByRole("textbox", { name: "Назва елемента" })).toHaveValue("Балка Б-1");
    expect(screen.getByRole("combobox", { name: "Тип елемента" })).toHaveValue("beam");
    expect(screen.getByText("Поточний клас у розрахунку захисного шару: XC1")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Повернути клас XC1 у розрахунок захисного шару" }),
    ).toHaveAttribute(
      "href",
      "/calculator/concrete-cover-durability?exposureClass=XC1&sourceExposureClasses=XC1&sourceCalculator=concrete-exposure-class",
    );
  });

  it("shows XA warning after selecting unknown chemical attack", async () => {
    const user = userEvent.setup();

    render(<ConcreteExposureClassCalculator />);

    await user.selectOptions(
      screen.getByRole("combobox", { name: "Хімічна агресія" }),
      "unknown_requires_analysis",
    );

    expect(screen.getByText("Для визначення класу XA потрібен аналіз ґрунту або води.")).toBeInTheDocument();
    const report = screen.getByRole("region", { name: "Покроковий звіт" });
    expect(within(report).getByText(/XA не призначається остаточно/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the UI tests and verify they fail**

Run:

```bash
npm run test -- components/calculators/concrete-exposure-class-calculator.test.tsx
```

Expected: FAIL with a module resolution error for `./concrete-exposure-class-calculator`.

- [ ] **Step 3: Commit the failing UI tests**

Run:

```bash
git add components/calculators/concrete-exposure-class-calculator.test.tsx
git commit -m "test: define concrete exposure class UI"
```

Expected: commit succeeds with only the UI test file staged.

---

### Task 4: UI Component Implementation

**Files:**
- Create: `components/calculators/concrete-exposure-class-calculator.tsx`
- Test: `components/calculators/concrete-exposure-class-calculator.test.tsx`

- [ ] **Step 1: Create the UI component**

Create `components/calculators/concrete-exposure-class-calculator.tsx` with:

```tsx
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT,
  getConcreteExposureClassReport,
  getConcreteExposureClassReturnUrl,
  type CarbonationMoistureCondition,
  type ChemicalAttackRisk,
  type ChlorideMoistureCondition,
  type ChlorideSource,
  type ConcreteExposureElementType,
  type ConcreteExposureClassInput,
  type CoverExposureClass,
  type FreezeThawRisk,
  type ReinforcementPresence,
} from "@/lib/concrete-exposure-class";
import {
  getDefaultInputSchemaValues,
  type CalculatorInputSchema,
  type CalculatorInputValues,
} from "@/lib/calculator-input-schema";

import { InputSchemaForm } from "./input-schema-form";
import { NativeCalculatorLayout } from "./native-calculator-layout";
import { NativeReport } from "./native-report";

export const CONCRETE_EXPOSURE_CLASS_INPUT_SCHEMA: CalculatorInputSchema = {
  groups: [
    {
      id: "concrete-exposure-element",
      title: "Елемент",
      fields: [
        {
          id: "elementName",
          kind: "text",
          name: "Назва елемента",
          defaultValue: DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.elementName,
          description: "Назва елемента для звіту та передачі між калькуляторами.",
        },
        {
          id: "elementType",
          kind: "select",
          name: "Тип елемента",
          defaultValue: DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.elementType,
          options: [
            { value: "slab", label: "Плита" },
            { value: "beam", label: "Балка" },
            { value: "column", label: "Колона" },
            { value: "wall", label: "Стіна" },
            { value: "foundation", label: "Фундамент" },
            { value: "retaining_wall", label: "Підпірна стіна" },
            { value: "tank", label: "Резервуар" },
            { value: "other", label: "Інший елемент" },
          ],
        },
      ],
    },
    {
      id: "concrete-exposure-corrosion",
      title: "Корозія арматури",
      fields: [
        {
          id: "reinforcementPresence",
          kind: "select",
          name: "Армування або металеві закладні",
          defaultValue: DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.reinforcementPresence,
          options: [
            { value: "reinforced_or_embedded_metal", label: "Залізобетон або бетон з металевими закладними" },
            { value: "plain_concrete_without_metal", label: "Бетон без арматури і металевих закладних" },
          ],
        },
        {
          id: "carbonationMoistureCondition",
          kind: "select",
          name: "Вологісний режим для карбонізації",
          defaultValue: DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.carbonationMoistureCondition,
          options: [
            { value: "dry_or_permanently_wet", label: "Сухо або постійно мокро" },
            { value: "wet_rarely_dry", label: "Волого, рідко сухо" },
            { value: "moderate_or_high_humidity", label: "Помірна або висока вологість" },
            { value: "cyclic_wet_dry", label: "Циклічне зволоження і висихання" },
          ],
        },
      ],
    },
    {
      id: "concrete-exposure-chlorides",
      title: "Хлориди",
      fields: [
        {
          id: "chlorideSource",
          kind: "select",
          name: "Джерело хлоридів",
          defaultValue: DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.chlorideSource,
          options: [
            { value: "none", label: "Немає" },
            { value: "deicing_salts", label: "Протиожеледні солі" },
            { value: "airborne_sea_salts", label: "Морські солі в повітрі" },
            { value: "sea_water", label: "Морська вода" },
          ],
        },
        {
          id: "chlorideMoistureCondition",
          kind: "select",
          name: "Вологісний режим для хлоридів",
          defaultValue: DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.chlorideMoistureCondition,
          showWhen: { fieldId: "chlorideSource", notEquals: "none" },
          options: [
            { value: "moderate_humidity", label: "Помірна вологість" },
            { value: "wet_rarely_dry", label: "Волого, рідко сухо" },
            { value: "permanently_submerged", label: "Постійне занурення" },
            { value: "cyclic_wet_dry", label: "Циклічне зволоження і висихання" },
            { value: "splash_or_spray", label: "Бризки або розпилення" },
          ],
        },
      ],
    },
    {
      id: "concrete-exposure-freeze-chemical",
      title: "Мороз і хімічна агресія",
      fields: [
        {
          id: "freezeThawRisk",
          kind: "select",
          name: "Морозний вплив",
          defaultValue: DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.freezeThawRisk,
          options: [
            { value: "none", label: "Немає" },
            { value: "moderate_water_saturation_without_deicing", label: "Помірне водонасичення без солей" },
            { value: "moderate_water_saturation_with_deicing", label: "Помірне водонасичення з солями" },
            { value: "high_water_saturation_without_deicing", label: "Високе водонасичення без солей" },
            { value: "high_water_saturation_with_deicing_or_sea_water", label: "Високе водонасичення з солями або морською водою" },
          ],
        },
        {
          id: "chemicalAttackRisk",
          kind: "select",
          name: "Хімічна агресія",
          defaultValue: DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.chemicalAttackRisk,
          options: [
            { value: "none", label: "Немає ознак хімічної агресії" },
            { value: "XA1", label: "XA1 — слабка хімічна агресія" },
            { value: "XA2", label: "XA2 — помірна хімічна агресія" },
            { value: "XA3", label: "XA3 — сильна хімічна агресія" },
            { value: "unknown_requires_analysis", label: "Невідомо — потрібен аналіз ґрунту або води" },
          ],
        },
        {
          id: "hasSoilOrGroundwaterAnalysis",
          kind: "checkbox",
          name: "Є аналіз ґрунту або води",
          defaultValue: DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT.hasSoilOrGroundwaterAnalysis,
          showWhen: { fieldId: "chemicalAttackRisk", notEquals: "none" },
        },
      ],
    },
  ],
};
```

Add parsing helpers:

```ts
function isCoverExposureClass(value: string | null): value is CoverExposureClass {
  return ["X0", "XC1", "XC2", "XC3", "XC4", "XD1", "XD2", "XD3", "XS1", "XS2", "XS3"].includes(value ?? "");
}

function getSearchParam(name: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
}

export function getConcreteExposureClassInitialValues(): CalculatorInputValues {
  const values = getDefaultInputSchemaValues(CONCRETE_EXPOSURE_CLASS_INPUT_SCHEMA);
  const elementName = getSearchParam("elementName");
  const elementType = getSearchParam("elementType");
  const reinforcementPresence = getSearchParam("reinforcementPresence");
  const currentExposureClass = getSearchParam("currentExposureClass");

  if (elementName) values.elementName = elementName;
  if (["slab", "beam", "column", "wall", "foundation", "retaining_wall", "tank", "other"].includes(elementType ?? "")) {
    values.elementType = elementType as ConcreteExposureElementType;
  }
  if (["reinforced_or_embedded_metal", "plain_concrete_without_metal"].includes(reinforcementPresence ?? "")) {
    values.reinforcementPresence = reinforcementPresence as ReinforcementPresence;
  }
  if (isCoverExposureClass(currentExposureClass)) {
    values.currentExposureClass = currentExposureClass;
  }

  return values;
}
```

Add `inputFromValues(values)` that casts schema values into `ConcreteExposureClassInput`. Use the union types from the core module and keep defaults for missing values.

Render `ConcreteExposureClassCalculator` with:

- `NativeCalculatorLayout`;
- `InputSchemaForm`;
- result summary text exactly:
  - `Повний набір класів: <classes>`;
  - `Для розрахунку захисного шару прийнято: <governing>`;
- warnings from `report.warnings`;
- `NativeReport` with `titleId="concrete-exposure-class-report-title"` and `title="Покроковий звіт"`;
- a `Link` whose text is:
  - `Повернути клас <governing> у розрахунок захисного шару` when `returnTo` exists;
  - `Використати в розрахунку захисного шару` otherwise.

- [ ] **Step 2: Run the UI tests**

Run:

```bash
npm run test -- components/calculators/concrete-exposure-class-calculator.test.tsx lib/concrete-exposure-class.test.ts
```

Expected: PASS.

- [ ] **Step 3: Commit the UI component**

Run:

```bash
git add components/calculators/concrete-exposure-class-calculator.tsx components/calculators/concrete-exposure-class-calculator.test.tsx
git commit -m "feat: add concrete exposure class UI"
```

Expected: commit succeeds with the UI component and UI tests.

---

### Task 5: Catalog And Shell Registration

**Files:**
- Modify: `lib/calculators.ts`
- Modify: `components/calculator-shell.tsx`
- Modify: `data/content.json`
- Modify: `lib/calculators.test.ts`
- Modify: `components/calculator-shell.test.tsx`

- [ ] **Step 1: Add failing registry and shell tests**

In `lib/calculators.test.ts`, update the extra category duplication expectation to include:

```ts
{
  slug: "concrete-exposure-class",
  extraCategories: ["beton", "normy-perevirky", "normatyvni-obgruntuvannya"],
},
```

Add this test near the existing native calculator registration tests:

```ts
it("registers the concrete exposure class calculator as a native reinforced concrete calculator", () => {
  const calculator = getCalculatorBySlug("concrete-exposure-class");

  expect(calculator).toMatchObject({
    title: "Клас впливу середовища для бетону",
    shortDescription:
      "Визначення XC, XD, XS, XF та XA для бетонного або залізобетонного елемента з передачею керівного класу в розрахунок захисного шару.",
    mainCategory: "zalizobeton",
    extraCategories: ["beton", "normy-perevirky", "normatyvni-obgruntuvannya"],
    displayMode: "native",
    nativeCalculator: "concrete-exposure-class",
    icon: "ShieldCheck",
    standard: "ДБН В.2.6-98:2009 / ДСТУ ENV 206:2018",
  });
});
```

In `components/calculator-shell.test.tsx`, add:

```tsx
it("renders the native concrete exposure class calculator", () => {
  const calculator = getCalculatorBySlug("concrete-exposure-class");

  if (!calculator) {
    throw new Error("Expected native concrete exposure class calculator to exist");
  }

  render(<CalculatorShell selectedCalculator={calculator} />);

  expect(
    screen.getByRole("heading", {
      level: 1,
      name: "Клас впливу середовища для бетону",
    }),
  ).toBeInTheDocument();
  expect(
    screen.getByLabelText("Калькулятор класу впливу середовища для бетону"),
  ).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Покроковий звіт" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run registry and shell tests and verify they fail**

Run:

```bash
npm run test -- lib/calculators.test.ts components/calculator-shell.test.tsx
```

Expected: FAIL because the calculator is not registered yet.

- [ ] **Step 3: Register the calculator**

Modify `lib/calculators.ts` and add `"concrete-exposure-class"` to `nativeCalculator`.

Modify `components/calculator-shell.tsx`:

```tsx
import { ConcreteExposureClassCalculator } from "@/components/calculators/concrete-exposure-class-calculator";
```

Add the switch case:

```tsx
case "concrete-exposure-class":
  return <ConcreteExposureClassCalculator />;
```

Modify `data/content.json` and add this calculator object near the other reinforced concrete or concrete calculators:

```json
{
  "slug": "concrete-exposure-class",
  "title": "Клас впливу середовища для бетону",
  "shortDescription": "Визначення XC, XD, XS, XF та XA для бетонного або залізобетонного елемента з передачею керівного класу в розрахунок захисного шару.",
  "description": "Калькулятор визначає повний набір класів впливу середовища та окремий керівний клас X0/XC/XD/XS для подальшого розрахунку захисного шару бетону за довговічністю.",
  "mainCategory": "zalizobeton",
  "extraCategories": ["beton", "normy-perevirky", "normatyvni-obgruntuvannya"],
  "displayMode": "native",
  "nativeCalculator": "concrete-exposure-class",
  "accessLabel": "Вбудований розрахунок",
  "openUrl": "/calculator/concrete-exposure-class",
  "order": 47,
  "seoContent": {
    "task": "Визначити класи впливу середовища для бетонного або залізобетонного елемента і передати керівний клас у розрахунок захисного шару.",
    "applications": [
      "Вибір класу XC для корозії внаслідок карбонізації",
      "Вибір класів XD або XS при дії хлоридів",
      "Фіксація додаткових вимог XF та XA"
    ],
    "inputParameters": [
      "Тип елемента і наявність арматури або металевих закладних",
      "Вологісний режим для карбонізації",
      "Джерело хлоридів і вологісний режим для хлоридів",
      "Морозний вплив і хімічна агресія"
    ],
    "formulas": [
      "exposure_classes = union(X0; XC; XD; XS; XF; XA)",
      "governing_cover_exposure_class = max_rank(X0; XC; XD; XS)"
    ],
    "example": "Для зовнішньої залізобетонної балки під дощем без солей калькулятор визначає XC4 та XF1, а в розрахунок захисного шару передає XC4.",
    "limitations": [
      "Клас XA у першій версії приймається за вибором користувача або позначається як такий, що потребує аналізу ґрунту чи води.",
      "Актуальність нормативних документів потрібно перевірити перед застосуванням у проекті."
    ],
    "standards": ["ДБН В.2.6-98:2009", "ДСТУ ENV 206:2018"]
  },
  "standard": "ДБН В.2.6-98:2009 / ДСТУ ENV 206:2018",
  "editorialLabel": "Новий",
  "useCases": [
    "Визначення XC, XD, XS для захисного шару",
    "Додаткові вимоги XF та XA",
    "Передача exposure_class у розрахунок захисного шару"
  ],
  "tags": ["залізобетон", "довговічність", "exposure class"],
  "tools": ["Native"],
  "icon": "ShieldCheck"
}
```

If another calculator already uses `order: 47`, choose the next available integer in the local ordering and update the registry test only for content fields, not for exact order.

- [ ] **Step 4: Run registry and shell tests**

Run:

```bash
npm run test -- lib/calculators.test.ts components/calculator-shell.test.tsx components/calculators/concrete-exposure-class-calculator.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit registration**

Run:

```bash
git add lib/calculators.ts components/calculator-shell.tsx data/content.json lib/calculators.test.ts components/calculator-shell.test.tsx
git commit -m "feat: register concrete exposure class calculator"
```

Expected: commit succeeds with registration and shell changes.

---

### Task 6: Styling And Full Verification

**Files:**
- Modify if needed: `app/globals.css`
- Test: existing calculator tests

- [ ] **Step 1: Check the rendered component for existing layout fit**

Run:

```bash
npm run test -- components/calculators/concrete-exposure-class-calculator.test.tsx
```

Expected: PASS.

If the summary action needs spacing, add a small class in `app/globals.css`:

```css
.concrete-exposure-class-summary {
  display: grid;
  gap: 0.35rem;
}

.concrete-exposure-class-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
```

Add those classes to the component summary wrapper and action wrapper. Do not change shared layout classes unless a test or screenshot shows a real issue.

- [ ] **Step 2: Run targeted tests**

Run:

```bash
npm run test -- lib/concrete-exposure-class.test.ts components/calculators/concrete-exposure-class-calculator.test.tsx lib/calculators.test.ts components/calculator-shell.test.tsx
```

Expected: PASS.

- [ ] **Step 3: Run full test suite**

Run:

```bash
npm run test
```

Expected: PASS.

- [ ] **Step 4: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 5: Run production build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 6: Start local dev server for visual verification**

Run:

```bash
npm run dev
```

Expected: Next.js starts and prints a local URL, normally `http://localhost:3000`.

- [ ] **Step 7: Verify in browser**

Open:

```text
http://localhost:3000/calculator/concrete-exposure-class
```

Check:

- the calculator page renders without an iframe;
- default result is `XC1`;
- selecting deicing salts and splash/spray produces `XD3`;
- selecting unknown chemical attack shows the XA warning;
- report step order matches the contract;
- the return link uses `/calculator/concrete-cover-durability` and includes `exposureClass`.

- [ ] **Step 8: Commit styling and verification adjustments**

If `app/globals.css` changed, run:

```bash
git add app/globals.css components/calculators/concrete-exposure-class-calculator.tsx
git commit -m "style: polish concrete exposure class calculator"
```

If no styling changed, do not create an empty commit.

---

## Plan Self-Review

- Spec coverage: Tasks cover the standalone calculator, core mappings, report steps, XA warnings, no `not_defined`/`XA_unknown` class leakage, rank-based governing class, prefill from calculator 1, return link, catalog registration, and verification.
- Placeholder scan: This plan contains no red-flag markers and no vague implementation instructions. The only conditional step is the CSS change, and it includes the exact CSS to add if needed.
- Type consistency: The plan uses `elementName`, `elementType`, `reinforcementPresence`, `currentExposureClass`, `returnTo`, `returnField`, `returnLabel`, `exposureClasses`, and `governingCoverExposureClass` consistently across core, UI, and handoff.
