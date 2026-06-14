# Foundation Base Pressure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the native `foundation-base-pressure` calculator from the agreed report contract.

**Architecture:** Put all engineering math, validation, no-tension contact solving, report strings, and diagram data in `lib/foundation-base-pressure.ts`. Build a thin React adapter in `components/calculators/foundation-base-pressure-calculator.tsx` using `InputSchemaForm`, `NativeCalculatorLayout`, and `NativeReport`. Register the calculator through the existing catalog flow in `data/content.json`, `lib/calculators.ts`, and `components/calculator-shell.tsx`.

**Tech Stack:** TypeScript, React/Next.js App Router, Vitest, Testing Library, existing native report and input schema components.

---

## Source of Truth

- Contract: `docs/superpowers/specs/2026-06-15-foundation-base-pressure-report-contract.md`
- Design: `docs/superpowers/specs/2026-06-15-foundation-base-pressure-design.md`

The implementation must preserve the agreed formulas and default examples from the contract.

## Files

- Create: `lib/foundation-base-pressure.ts`
- Create: `lib/foundation-base-pressure.test.ts`
- Create: `components/calculators/foundation-base-pressure-calculator.tsx`
- Create: `components/calculators/foundation-base-pressure-calculator.test.tsx`
- Modify: `components/calculator-shell.tsx`
- Modify: `lib/calculators.ts`
- Modify: `data/content.json`
- Modify: `app/globals.css`
- Modify: `components/calculator-shell.test.tsx` to assert that the new native calculator renders through `CalculatorShell`.

## Task 1: Core Calculation Library

**Files:**
- Create: `lib/foundation-base-pressure.test.ts`
- Create: `lib/foundation-base-pressure.ts`

- [ ] **Step 1: Write failing core tests**

Create `lib/foundation-base-pressure.test.ts` with tests for:

```ts
import { describe, expect, it } from "vitest";

import {
  DEFAULT_FOUNDATION_BASE_PRESSURE_INPUT,
  getFoundationBasePressureReport,
} from "@/lib/foundation-base-pressure";

describe("foundation base pressure calculator", () => {
  it("reproduces the two-corner uplift example", () => {
    const report = getFoundationBasePressureReport(
      DEFAULT_FOUNDATION_BASE_PRESSURE_INPUT,
    );

    expect(report.valid).toBe(true);
    expect(report.values).toMatchObject({
      selfWeightT: expect.closeTo(17.28, 6),
      totalVerticalForceT: expect.closeTo(43.28, 6),
      areaM2: expect.closeTo(4.32, 6),
      sectionModulusWyM3: expect.closeTo(1.728, 6),
      sectionModulusWxM3: expect.closeTo(1.296, 6),
      baseMomentXTm: expect.closeTo(2.8, 6),
      baseMomentYTm: expect.closeTo(24.1, 6),
      eccentricityXM: expect.closeTo(0.5568, 4),
      eccentricityYM: expect.closeTo(0.0647, 4),
      noUpliftCornerStressesTM2: [
        expect.closeTo(26.13, 2),
        expect.closeTo(21.8, 2),
        expect.closeTo(-1.77, 2),
        expect.closeTo(-6.09, 2),
      ],
      uplift: {
        type: "two-corners",
        c1M: expect.closeTo(0.2781, 4),
        c2M: expect.closeTo(0.6927, 4),
        upliftSharePercent: expect.closeTo(20.2, 1),
        contactStressesTM2: [
          expect.closeTo(27.73, 2),
          expect.closeTo(22.31, 2),
        ],
      },
    });
    expect(report.steps.map((step) => step.key)).toContain("uplift-two-corners");
    expect(report.steps.find((step) => step.key === "uplift-two-corners")?.formula).toBe(
      "P_lift = (c1 + c2) / 2 * b * 1 / (b * l) * 100 = (0.2781 + 0.6927) / 2 * 1.80 * 1 / (1.80 * 2.40) * 100 = 20.2%",
    );
  });

  it("reproduces the one-corner uplift example", () => {
    const report = getFoundationBasePressureReport({
      ...DEFAULT_FOUNDATION_BASE_PRESSURE_INPUT,
      momentXTm: 9,
    });

    expect(report.valid).toBe(true);
    expect(report.values?.noUpliftCornerStressesTM2).toEqual([
      expect.closeTo(31.53, 2),
      expect.closeTo(16.4, 2),
      expect.closeTo(3.63, 2),
      expect.closeTo(-11.49, 2),
    ]);
    expect(report.values?.uplift).toMatchObject({
      type: "one-corner",
      c1M: expect.closeTo(1.734, 4),
      c2M: expect.closeTo(1.3427, 4),
      upliftSharePercent: expect.closeTo(26.9, 1),
      contactStressesTM2: [
        expect.closeTo(36.39, 2),
        expect.closeTo(15.7, 2),
        expect.closeTo(0.76, 2),
      ],
    });
    expect(report.steps.find((step) => step.key === "uplift-one-corner")?.formula).toBe(
      "P_lift = c1 * c2 / (2 * b * l) * 100 = 1.7340 * 1.3427 / (2 * 1.80 * 2.40) * 100 = 26.9%",
    );
  });

  it("returns final corner stresses when uplift is absent", () => {
    const report = getFoundationBasePressureReport({
      ...DEFAULT_FOUNDATION_BASE_PRESSURE_INPUT,
      momentXTm: 0,
      momentYTm: 0,
      shearXT: 0,
      shearYT: 0,
    });

    expect(report.valid).toBe(true);
    expect(report.values?.uplift).toMatchObject({ type: "none" });
    expect(report.warnings).toEqual([]);
  });

  it("validates dimensions and avoids non-finite formulas", () => {
    const report = getFoundationBasePressureReport({
      ...DEFAULT_FOUNDATION_BASE_PRESSURE_INPUT,
      foundationLengthM: 0,
    });

    expect(report.valid).toBe(false);
    expect(report.errors).toEqual(["l має бути більше 0."]);
    expect(JSON.stringify(report.steps)).not.toContain("NaN");
  });
});
```

- [ ] **Step 2: Run failing core tests**

Run:

```bash
npm test -- lib/foundation-base-pressure.test.ts
```

Expected: FAIL because `@/lib/foundation-base-pressure` does not exist.

- [ ] **Step 3: Implement the core library**

Create `lib/foundation-base-pressure.ts` with:

- input/report/value types;
- `DEFAULT_FOUNDATION_BASE_PRESSURE_INPUT`;
- numeric formatting helpers matching the contract;
- validation;
- rectangular clipping by the positive pressure half-plane;
- exact polygon integration by triangulation;
- damped Newton solver for `p0`, `ax`, `ay`;
- classification for one-corner and two-corner uplift;
- report step generation using exact contract text.

Coordinate convention:

```text
x: 0..l
y: 0..b
σ1 at (l, b)
σ2 at (l, 0)
σ3 at (0, b)
σ4 at (0, 0)
x_R = l / 2 + ex
y_R = b / 2 + ey
```

Use solver tolerance:

```text
equilibriumTolerance = 1e-6 for force/moment residuals in core
displayed equilibrium values round with the same formatter as report values
```

- [ ] **Step 4: Run core tests green**

Run:

```bash
npm test -- lib/foundation-base-pressure.test.ts
```

Expected: PASS.

## Task 2: Native React Calculator

**Files:**
- Create: `components/calculators/foundation-base-pressure-calculator.test.tsx`
- Create: `components/calculators/foundation-base-pressure-calculator.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Write failing UI tests**

Create `components/calculators/foundation-base-pressure-calculator.test.tsx` with tests for schema defaults, rendering through shared native layout, DOCX mapping, and diagram labels:

```ts
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import type { CalculatorInputField } from "@/lib/calculator-input-schema";
import { getFoundationBasePressureReport } from "@/lib/foundation-base-pressure";

import {
  FOUNDATION_BASE_PRESSURE_INPUT_SCHEMA,
  FoundationBasePressureCalculator,
  buildFoundationBasePressureDocxReport,
} from "./foundation-base-pressure-calculator";

function findSchemaField(id: string): CalculatorInputField {
  for (const group of FOUNDATION_BASE_PRESSURE_INPUT_SCHEMA.groups) {
    const field = group.fields.find((item) => item.id === id);
    if (field) return field;
  }
  throw new Error(`Missing schema field ${id}`);
}

describe("FOUNDATION_BASE_PRESSURE_INPUT_SCHEMA", () => {
  it("uses the agreed default example values", () => {
    expect(findSchemaField("verticalForceT")).toMatchObject({
      defaultValue: "26",
      prefix: { text: "N", ariaLabel: "N" },
    });
    expect(findSchemaField("momentXTm")).toMatchObject({
      defaultValue: "2",
      prefix: { text: "M", subscript: "x", ariaLabel: "Mx" },
    });
    expect(findSchemaField("foundationLengthM")).toMatchObject({
      defaultValue: "2.4",
      quantity: "length",
      baseUnit: "m",
      defaultDisplayUnit: "m",
    });
    expect(findSchemaField("soilAndFoundationUnitWeightTM3")).toMatchObject({
      defaultValue: "2",
      prefix: { text: "γ", ariaLabel: "γ" },
    });
  });
});

describe("FoundationBasePressureCalculator", () => {
  it("renders the calculator with report, DOCX action, and pressure epure", () => {
    render(createElement(FoundationBasePressureCalculator));

    expect(
      screen.getByLabelText("Калькулятор напружень під підошвою фундаменту"),
    ).toHaveClass("native-calculator");
    expect(screen.getByRole("heading", { name: "Епюра тиску під підошвою" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Покроковий звіт" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Завантажити DOCX" })).toBeInTheDocument();
    expect(screen.getByText(/σ1 = 27.73 т\\/м²/)).toBeInTheDocument();
    expect(screen.getByText(/P_lift = 20.2%/)).toBeInTheDocument();
  });
});

describe("foundation base pressure DOCX export", () => {
  it("maps report steps and diagram to DOCX", () => {
    const report = getFoundationBasePressureReport({
      verticalForceT: 26,
      momentXTm: 2,
      shearYT: 0.5,
      momentYTm: 9.7,
      shearXT: 9,
      foundationLengthM: 2.4,
      foundationWidthM: 1.8,
      embedmentDepthM: 2,
      loadApplicationHeightM: 1.6,
      soilAndFoundationUnitWeightTM3: 2,
    });
    const docxReport = buildFoundationBasePressureDocxReport(
      report,
      new Date("2026-06-15"),
    );

    expect(docxReport.fileBaseName).toBe(
      "napruzhennia-pid-pidoshvoiu-fundamentu-2026-06-15",
    );
    expect(docxReport.steps.map((step) => step.key)).toEqual(
      report.steps.map((step) => step.key),
    );
    expect(docxReport.figures?.[0]?.svg).toContain("<svg");
  });
});
```

- [ ] **Step 2: Run failing UI tests**

Run:

```bash
npm test -- components/calculators/foundation-base-pressure-calculator.test.tsx
```

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the React component**

Create `components/calculators/foundation-base-pressure-calculator.tsx`:

- export `FOUNDATION_BASE_PRESSURE_INPUT_SCHEMA`;
- use `getDefaultInputSchemaValues`;
- parse comma/dot decimal strings;
- call `getFoundationBasePressureReport` in `useMemo`;
- render `NativeCalculatorLayout`;
- render `NativeReport` with `ReportDocxButton`;
- build a simple SVG epure diagram from report values;
- export `buildFoundationBasePressureDocxReport`.

Keep components at module scope, avoid nested component definitions inside render functions, and import directly from existing modules.

- [ ] **Step 4: Add scoped CSS**

Append focused classes to `app/globals.css`:

```css
.foundation-base-pressure-summary,
.foundation-base-pressure-source {
  color: var(--color-text-muted);
}

.foundation-base-pressure-diagram {
  margin: 0;
}

.foundation-base-pressure-diagram__canvas {
  overflow-x: auto;
}

.foundation-base-pressure-diagram__svg {
  display: block;
  max-width: 100%;
  height: auto;
}
```

- [ ] **Step 5: Run UI tests green**

Run:

```bash
npm test -- components/calculators/foundation-base-pressure-calculator.test.tsx
```

Expected: PASS.

## Task 3: Catalog Registration

**Files:**
- Modify: `lib/calculators.ts`
- Modify: `components/calculator-shell.tsx`
- Modify: `data/content.json`
- Modify: `components/calculator-shell.test.tsx` if existing shell coverage needs the new native case.

- [ ] **Step 1: Write failing registration test**

Add a small assertion to an existing calculator registry/shell test, or create a focused assertion in `components/calculator-shell.test.tsx`, that `/calculator/foundation-base-pressure` renders the new native calculator title/report.

Run:

```bash
npm test -- components/calculator-shell.test.tsx lib/calculators.test.ts
```

Expected: FAIL because the calculator is not registered.

- [ ] **Step 2: Register the native calculator**

Update:

```ts
// lib/calculators.ts
nativeCalculator?:
  | "rebar-area-bars"
  | "rebar-characteristics"
  | "concrete-characteristics"
  | "minimum-reinforcement-area"
  | "foundation-bar-anchorage"
  | "cassoon-load-distribution"
  | "soil-design-resistance"
  | "foundation-base-pressure";
```

Update `components/calculator-shell.tsx`:

```ts
import { FoundationBasePressureCalculator } from "@/components/calculators/foundation-base-pressure-calculator";
```

and:

```tsx
case "foundation-base-pressure":
  return <FoundationBasePressureCalculator />;
```

Add a `data/content.json` calculator entry:

```json
{
  "slug": "foundation-base-pressure",
  "title": "Напруження під підошвою фундаменту",
  "shortDescription": "Розрахунок крайових напружень під прямокутною підошвою фундаменту з урахуванням відриву.",
  "description": "Калькулятор визначає напруження по кутах підошви фундаменту, перевіряє появу відриву та будує контактну епюру тиску без розтягу за погодженою методикою.",
  "mainCategory": "fundamenty",
  "extraCategories": ["perevirka-dbn", "normatyvni-obgruntuvannya"],
  "displayMode": "native",
  "nativeCalculator": "foundation-base-pressure",
  "accessLabel": "Вбудований розрахунок",
  "openUrl": "/calculator/foundation-base-pressure",
  "order": 21.495,
  "seoTitle": "Напруження під підошвою фундаменту",
  "seoDescription": "Онлайн-розрахунок напружень під підошвою прямокутного фундаменту з перевіркою відриву та епюрою тиску.",
  "editorialLabel": "Новий",
  "useCases": ["Крайові напруження під підошвою", "Відрив підошви фундаменту", "Епюра тиску під фундаментом"],
  "tags": ["фундаменти", "напруження", "відрив підошви"],
  "tools": ["IVapps"],
  "icon": "Layers",
  "standard": "Методика визначення крайових напружень під прямокутною підошвою фундаменту"
}
```

- [ ] **Step 3: Run registration tests green**

Run:

```bash
npm test -- components/calculator-shell.test.tsx lib/calculators.test.ts
```

Expected: PASS.

## Task 4: Full Verification and Visual Check

**Files:**
- No source edits expected unless verification exposes issues.

- [ ] **Step 1: Run full tests**

Run:

```bash
npm test
```

Expected: PASS.

- [ ] **Step 2: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Run local dev server and inspect the page**

Run:

```bash
npm run dev
```

Open:

```text
http://localhost:3000/calculator/foundation-base-pressure
```

Verify:

- the calculator loads;
- report contains the default two-corner uplift example;
- diagram is nonblank and labels stresses/uplift dimensions;
- no obvious layout overlap on desktop width.

## Task 5: Commit

**Files:**
- All changed files from Tasks 1-4.

- [ ] **Step 1: Inspect status**

Run:

```bash
git status --short
git diff --stat
```

- [ ] **Step 2: Commit final changes**

Run:

```bash
git add -- .
git commit -m "feat: add foundation base pressure calculator"
```
