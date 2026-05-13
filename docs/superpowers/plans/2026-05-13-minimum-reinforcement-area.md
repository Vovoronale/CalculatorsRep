# Minimum Reinforcement Area Calculator Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a native calculator that determines minimum reinforcement area for beams and slabs and produces the agreed step-by-step report.

**Architecture:** Put all engineering logic, notation, validation, formatting, and report step generation in a focused library module. Keep the React component as a thin UI over that module, render formulas through a mathematical notation renderer, then register the native calculator through the existing calculator shell and JSON catalog.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest, Testing Library, existing material directories in `lib/materials`.

---

## Chunk 1: Calculation Core

### Task 1: Add Failing Tests For Calculation And Report Logic

**Files:**

- Create: `lib/minimum-reinforcement.test.ts`
- Read: `docs/superpowers/specs/2026-05-13-minimum-reinforcement-area-design.md`

- [ ] **Step 1: Write the failing tests**

Create `lib/minimum-reinforcement.test.ts` with tests for the representative beam and slab cases:

```ts
import { describe, expect, it } from "vitest";

import {
  getMinimumReinforcementReport,
  isEurocodeRebarStrengthApplicable,
} from "@/lib/minimum-reinforcement";

describe("minimum reinforcement calculator", () => {
  it("builds the agreed beam report with DSTU and Eurocode references", () => {
    const report = getMinimumReinforcementReport({
      structureType: "beam",
      concreteClass: "C30/37",
      rebarClass: "A500C",
      sectionHeightMm: 500,
      tensileZoneWidthMm: 1000,
      reinforcementCentroidDistanceMm: 50,
      rebarDiameterMm: 16,
    });

    expect(report.valid).toBe(true);
    expect(report.values).toMatchObject({
      fctmMPa: 2.9,
      fykMPa: 500,
      effectiveDepthMm: 450,
      minimumAreaFirstMm2: expect.closeTo(678.6, 1),
      minimumAreaSecondMm2: 585,
      minimumAreaMm2: expect.closeTo(678.6, 1),
      minimumAreaCm2: expect.closeTo(6.79, 2),
    });
    expect(report.steps.map((step) => step.key)).toEqual([
      "inputs",
      "fctm",
      "fyk",
      "eurocode-fyk-check",
      "effective-depth",
      "as-min-1",
      "as-min-2",
      "as-min",
    ]);
    expect(report.steps.find((step) => step.key === "as-min-2")?.formula).toBe(
      "As,min,2 = 0.0013 * bt * d = 0.0013 * 1000 * 450 = 585 мм² = 5.85 см²",
    );
  });

  it("adds the slab strip width step and defaults bt to 1000 mm", () => {
    const report = getMinimumReinforcementReport({
      structureType: "slab",
      concreteClass: "C30/37",
      rebarClass: "A500C",
      sectionHeightMm: 200,
      reinforcementCentroidDistanceMm: 30,
      rebarDiameterMm: 12,
    });

    expect(report.input.tensileZoneWidthMm).toBe(1000);
    expect(report.steps.map((step) => step.key)).toContain("slab-strip-width");
    expect(report.steps.find((step) => step.key === "slab-strip-width")?.formula).toBe(
      "bt = 1000 мм",
    );
  });

  it("marks Eurocode as not applicable outside the fyk range but keeps DSTU values", () => {
    const report = getMinimumReinforcementReport({
      structureType: "beam",
      concreteClass: "C30/37",
      rebarClass: "A800",
      sectionHeightMm: 500,
      tensileZoneWidthMm: 1000,
      reinforcementCentroidDistanceMm: 50,
      rebarDiameterMm: 16,
    });

    expect(isEurocodeRebarStrengthApplicable(800)).toBe(false);
    expect(report.valid).toBe(true);
    expect(report.eurocodeApplicable).toBe(false);
    expect(report.warnings).toContain(
      "Розрахунок за Eurocode 2 не виконується: fyk = 800 МПа виходить за межі 400...600 МПа згідно з п. 3.2.2(3)P EN 1992-1-1.",
    );
  });

  it("validates that a_s is smaller than h", () => {
    const report = getMinimumReinforcementReport({
      structureType: "beam",
      concreteClass: "C30/37",
      rebarClass: "A500C",
      sectionHeightMm: 50,
      tensileZoneWidthMm: 1000,
      reinforcementCentroidDistanceMm: 50,
      rebarDiameterMm: 16,
    });

    expect(report.valid).toBe(false);
    expect(report.errors).toContain("a_s має бути менше h.");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm run test -- lib/minimum-reinforcement.test.ts
```

Expected: FAIL because `@/lib/minimum-reinforcement` does not exist yet.

### Task 2: Implement Calculation Core

**Files:**

- Create: `lib/minimum-reinforcement.ts`
- Modify only if needed: `lib/materials/concrete.ts`
- Modify only if needed: `lib/materials/rebar.ts`

- [ ] **Step 1: Create the module structure**

Create `lib/minimum-reinforcement.ts` with:

```ts
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

export type MinimumReinforcementReportStep = {
  key: string;
  caption: string;
  formula?: string;
  items?: string[];
};
```

- [ ] **Step 2: Add pure helpers**

Implement:

```ts
export function isEurocodeRebarStrengthApplicable(fykMPa: number): boolean {
  return fykMPa >= 400 && fykMPa <= 600;
}

export function getEffectiveDepthMm(sectionHeightMm: number, reinforcementCentroidDistanceMm: number): number {
  return sectionHeightMm - reinforcementCentroidDistanceMm;
}

export function getMinimumAreaFirstMm2(fctmMPa: number, fykMPa: number, btMm: number, dMm: number): number {
  return 0.26 * (fctmMPa / fykMPa) * btMm * dMm;
}

export function getMinimumAreaSecondMm2(btMm: number, dMm: number): number {
  return 0.0013 * btMm * dMm;
}

export function convertMm2ToCm2(areaMm2: number): number {
  return areaMm2 / 100;
}
```

- [ ] **Step 3: Add formatting helpers**

Implement compact numeric formatting so report strings match the approved examples:

```ts
function formatNumber(value: number, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  }).format(value);
}

function formatAreaMm2(value: number): string {
  return formatNumber(value, 1);
}

function formatAreaCm2(value: number): string {
  return formatNumber(value, 2);
}
```

- [ ] **Step 4: Add validation and report generation**

Implement `getMinimumReinforcementReport(input)` so it:

- normalizes slab `tensileZoneWidthMm` to `1000` when omitted
- validates all numeric inputs
- reads `fctmMPa` from `getConcreteByClass(input.concreteClass)?.fctmMPa`
- reads `fykMPa` from `getRebarByClass(input.rebarClass)?.yieldStrengthMPa`
- computes `d`, `As,min,1`, `As,min,2`, `As,min`
- returns `steps` in the approved order
- returns Eurocode warning while preserving DSTU calculation when `fyk` is outside `400...600`
- keeps plain-text formula strings for tests, accessibility labels, and copyable report text

- [ ] **Step 5: Run core tests**

Run:

```bash
npm run test -- lib/minimum-reinforcement.test.ts
```

Expected: PASS.

## Chunk 2: Native Calculator UI

### Task 3: Add Component Tests Through CalculatorShell

**Files:**

- Modify: `components/calculator-shell.test.tsx`

- [ ] **Step 1: Add a failing shell test for the new native calculator**

Append a test that loads `minimum-reinforcement-area` through `getCalculatorBySlug` and asserts:

```ts
it("renders the native minimum reinforcement calculator with a step report", async () => {
  const user = userEvent.setup();
  const calculator = getCalculatorBySlug("minimum-reinforcement-area");

  if (!calculator) {
    throw new Error("Expected native minimum reinforcement calculator to exist");
  }

  render(<CalculatorShell selectedCalculator={calculator} />);

  expect(
    screen.getByRole("heading", { level: 2, name: "Мінімальна площа армування" }),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("Калькулятор мінімальної площі армування")).toBeInTheDocument();
  expect(screen.getByRole("combobox", { name: "Тип конструкції" })).toHaveValue("beam");
  expect(screen.getByRole("combobox", { name: "Клас бетону" })).toHaveValue("C30/37");
  expect(screen.getByRole("combobox", { name: "Клас арматури" })).toHaveValue("A500C");
  expect(
    screen.getByText(
      "As,min,2 = 0.0013 * bt * d = 0.0013 * 1000 * 450 = 585 мм² = 5.85 см²",
    ),
  ).toBeInTheDocument();

  await user.selectOptions(screen.getByRole("combobox", { name: "Тип конструкції" }), "slab");

  expect(screen.getByText("bt = 1000 мм")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the shell test to verify it fails**

Run:

```bash
npm run test -- components/calculator-shell.test.tsx
```

Expected: FAIL because the catalog entry and component do not exist yet.

### Task 4: Implement React Component

**Files:**

- Create: `components/calculators/minimum-reinforcement-calculator.tsx`
- Read: `components/calculators/rebar-characteristics-calculator.tsx`
- Read: `components/calculators/concrete-characteristics-calculator.tsx`
- Read: `components/calculators/math-notation.tsx`

- [ ] **Step 1: Add a mathematical formula renderer**

Inside `components/calculators/minimum-reinforcement-calculator.tsx`, add focused rendering helpers that turn report formulas into mathematical UI rather than plain text. Reuse `MathNotation` for symbols with subscripts:

```tsx
function FormulaSymbol({
  base,
  subscript,
  ariaLabel,
}: {
  base: string;
  subscript?: string;
  ariaLabel: string;
}) {
  return <MathNotation base={base} subscript={subscript} ariaLabel={ariaLabel} />;
}
```

Render the known formula steps from structured report values instead of showing only the raw formula string. Required mathematical symbols:

- `A` with subscript `s,min`
- `A` with subscript `s,min,1`
- `A` with subscript `s,min,2`
- `f` with subscript `ctm`
- `f` with subscript `yk`
- `b` with subscript `t`
- `a` with subscript `s`
- `Ø` with subscript `s`
- `d`
- `h`

Keep `step.formula` as `aria-label`, tooltip/title, or test-visible accessible text so tests can assert the approved plain-text chain.

- [ ] **Step 2: Build controlled inputs**

Create a client component with defaults:

- `structureType = "beam"`
- `concreteClass = "C30/37"`
- `rebarClass = "A500C"`
- `sectionHeightMm = "500"`
- `tensileZoneWidthMm = "1000"`
- `reinforcementCentroidDistanceMm = "50"`
- `rebarDiameterMm = "16"`

Use existing `getConcreteClasses()` and `getRebarClasses()` for select options.

- [ ] **Step 3: Generate report from the core module**

Use `useMemo` to call `getMinimumReinforcementReport()` from current inputs. Render:

- a summary result when valid
- validation errors when invalid
- warnings when present
- a report list where each step shows caption and formula/items

- [ ] **Step 4: Keep slab width behavior explicit**

When `structureType` changes to `slab`, keep the width input visible and default it to `1000` if empty. Do not hide `bt`, because the spec says users can edit it.

- [ ] **Step 5: Run component tests**

Run:

```bash
npm run test -- components/calculator-shell.test.tsx
```

Expected: still FAIL until shell registration is complete.

## Chunk 3: Catalog Registration And Styling

### Task 5: Register Native Calculator

**Files:**

- Modify: `lib/calculators.ts`
- Modify: `components/calculator-shell.tsx`
- Modify: `data/content.json`

- [ ] **Step 1: Extend the native calculator union**

In `lib/calculators.ts`, add `"minimum-reinforcement-area"` to `Calculator["nativeCalculator"]`.

- [ ] **Step 2: Import and render the component**

In `components/calculator-shell.tsx`:

- import `MinimumReinforcementCalculator`
- add switch case:

```tsx
case "minimum-reinforcement-area":
  return <MinimumReinforcementCalculator />;
```

- [ ] **Step 3: Add catalog JSON entry**

In `data/content.json`, add a native calculator entry near the other construction calculators:

```json
{
  "slug": "minimum-reinforcement-area",
  "title": "Мінімальна площа армування",
  "shortDescription": "Покроковий розрахунок As,min для балки або плити за ДСТУ Б В.2.6-156:2010 та Eurocode 2.",
  "description": "Калькулятор визначає мінімальну площу робочої арматури за класом бетону, класом арматури та геометрією перерізу. Звіт показує вихідні дані, матеріальні характеристики, перевірку Eurocode 2 і всі формули з нормативними посиланнями.",
  "mainCategory": "konstruktsiyi",
  "extraCategories": [],
  "displayMode": "native",
  "nativeCalculator": "minimum-reinforcement-area",
  "accessLabel": "Вбудований розрахунок",
  "openUrl": "/calculator/minimum-reinforcement-area",
  "order": 21.45,
  "seoTitle": "Мінімальна площа армування As,min",
  "seoDescription": "Онлайн-розрахунок мінімальної площі армування балки або плити за ДСТУ Б В.2.6-156:2010 та Eurocode 2.",
  "editorialLabel": "Новий",
  "useCases": ["As,min для балки", "As,min для плити", "Покроковий звіт"],
  "tags": ["армування", "As,min", "ДСТУ", "Eurocode 2"],
  "tools": ["IVapps"],
  "icon": "Ruler"
}
```

- [ ] **Step 4: Run shell tests**

Run:

```bash
npm run test -- components/calculator-shell.test.tsx
```

Expected: PASS.

### Task 6: Add Focused Styles

**Files:**

- Modify: `app/globals.css`

- [ ] **Step 1: Reuse existing native calculator visual language**

Add styles for:

- `.minimum-reinforcement-calculator`
- `.minimum-reinforcement-calculator__controls`
- `.minimum-reinforcement-field`
- `.minimum-reinforcement-summary`
- `.minimum-reinforcement-report`
- `.minimum-reinforcement-report__step`
- `.minimum-reinforcement-report__formula`
- `.minimum-reinforcement-equation` без рамки та заливки для формул звіту
- `.minimum-reinforcement-warning`
- `.minimum-reinforcement-errors`

Match the density and spacing of existing `.rebar-calculator` and `.concrete-calculator` sections.

- [ ] **Step 2: Add responsive behavior**

Ensure controls wrap cleanly on mobile and mathematical formula lines do not overflow their container. Use `overflow-x: auto` on formula blocks if needed. Keep subscripts legible and aligned with the existing `.math-notation` style.

- [ ] **Step 3: Run tests after styling**

Run:

```bash
npm run test -- components/calculator-shell.test.tsx
```

Expected: PASS.

## Chunk 4: Final Verification

### Task 7: Full Automated Verification

**Files:**

- No new files

- [ ] **Step 1: Run targeted tests**

Run:

```bash
npm run test -- lib/minimum-reinforcement.test.ts components/calculator-shell.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run full test suite**

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

Expected: PASS and static export completes.

### Task 8: Manual Browser Check

**Files:**

- No new files

- [ ] **Step 1: Start the dev server**

Run:

```bash
npm run dev
```

Expected: local Next.js server starts.

- [ ] **Step 2: Open the calculator**

Open:

```text
http://localhost:3000/calculator/minimum-reinforcement-area
```

Check:

- beam report renders with agreed captions
- slab report includes `bt = 1000 мм`
- changing concrete class updates `fctm`
- changing reinforcement class updates `fyk`
- selecting `A800` shows the Eurocode warning while preserving DSTU result
- validation appears when `a_s >= h`

- [ ] **Step 3: Stop dev server**

Stop the running dev server after the visual check.
