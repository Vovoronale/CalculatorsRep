# Report DOCX Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build browser-side DOCX export for the native report model and connect the first button to `soil-design-resistance`.

**Architecture:** Add a reusable `lib/report-docx` layer that converts calculator report steps into a `docx` `Document`, using a shared arithmetic parser for Word equations and browser helpers for SVG-to-PNG plus file download. The soil calculator adds only an adapter and a button; calculation logic and existing report strings stay unchanged.

**Tech Stack:** Next.js static export, React 19, TypeScript strict mode, Vitest, Testing Library, `docx`.

---

## File Structure

- Create `lib/report-docx/types.ts`: shared report export contract.
- Create `lib/report-docx/math-parser.ts`: arithmetic tokenizer/parser and exact fallback result.
- Create `lib/report-docx/math-parser.test.ts`: parser coverage.
- Create `lib/report-docx/math-docx.ts`: AST-to-Word-equation conversion.
- Create `lib/report-docx/math-docx.test.ts`: conversion smoke tests that do not snapshot binary DOCX.
- Create `lib/report-docx/document.ts`: `DocxReportDocument` to `docx` `Document` builder.
- Create `lib/report-docx/document.test.ts`: builder smoke tests.
- Create `lib/report-docx/browser.ts`: browser-only SVG conversion, Blob packaging, and download.
- Create `components/calculators/report-docx-button.tsx`: reusable client button.
- Modify `components/calculators/soil-design-resistance-calculator.tsx`: expose current SVG generation through an adapter and render the button near `Покроковий звіт`.
- Modify `components/calculators/soil-design-resistance-calculator.test.ts`: adapter and button tests.
- Modify `components/calculator-shell.test.tsx`: shell-level button presence check.
- Modify `docs/calculation-reporting-guide.md`: document DOCX export contract for future calculators.
- Modify `package.json` and `package-lock.json`: add `docx`.

## Task 1: Dependency And Shared Types

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `lib/report-docx/types.ts`

- [ ] **Step 1: Install DOCX dependency**

Run:

```bash
npm install docx
```

Expected: `package.json` gains `docx` under `dependencies`, and `package-lock.json` is updated.

- [ ] **Step 2: Create shared export types**

Create `lib/report-docx/types.ts`:

```ts
export type DocxReportStep = {
  key: string;
  caption: string;
  items?: string[];
  notes?: string[];
  formula?: string;
  formulas?: string[];
};

export type DocxReportFigure = {
  key: string;
  caption?: string;
  svg?: string;
  pngData?: ArrayBuffer;
  widthPx: number;
  heightPx: number;
};

export type DocxReportDocument = {
  title: string;
  fileBaseName: string;
  figures?: DocxReportFigure[];
  steps: DocxReportStep[];
};
```

- [ ] **Step 3: Verify types compile**

Run:

```bash
npm run typecheck
```

Expected: PASS or only failures caused by later unimplemented files if this task has been combined with another task during inline execution.

- [ ] **Step 4: Commit dependency and types**

```bash
git add package.json package-lock.json lib/report-docx/types.ts
git commit -m "feat: add report docx export types"
```

## Task 2: Arithmetic Formula Parser

**Files:**
- Create: `lib/report-docx/math-parser.test.ts`
- Create: `lib/report-docx/math-parser.ts`

- [ ] **Step 1: Write parser tests**

Create tests covering:

```ts
import { describe, expect, it } from "vitest";

import { parseDocxFormula } from "./math-parser";

describe("parseDocxFormula", () => {
  it("parses equality chains with symbols, units, and multiplication", () => {
    const result = parseDocxFormula(
      "R = γc1 * γc2 / k * [Mγ * kz * b * γ11 + Mc * c11] = 162.82 кПа",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.statements).toHaveLength(1);
    expect(result.statements[0].source).toBe(
      "R = γc1 * γc2 / k * [Mγ * kz * b * γ11 + Mc * c11] = 162.82 кПа",
    );
  });

  it("parses arithmetic precedence, powers, functions, and semicolon-separated formulas", () => {
    const result = parseDocxFormula(
      "As,1 = pi * Ø^2 / 4 = 78.54 мм²; lb,min = max(0.3 * lb,rqd; 10 * Ø; 100) = 100 мм",
    );

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.statements).toHaveLength(2);
  });

  it("parses comparisons and implication", () => {
    const result = parseDocxFormula("d1 <= d => 1.2 <= 1.2 - умова виконується");

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.statements[0].suffix).toBe(" - умова виконується");
  });

  it("falls back for prose that is not a formula", () => {
    const result = parseDocxFormula("Приймаємо значення з таблиці без математичного виразу");

    expect(result).toEqual({
      ok: false,
      reason: "Formula does not contain a supported mathematical operator.",
    });
  });
});
```

- [ ] **Step 2: Run failing parser tests**

Run:

```bash
npm test -- lib/report-docx/math-parser.test.ts
```

Expected: FAIL because `math-parser.ts` does not exist.

- [ ] **Step 3: Implement parser**

Create a focused tokenizer and recursive-descent parser in `lib/report-docx/math-parser.ts` with these exported types and function:

```ts
export type DocxFormulaNode =
  | { type: "number"; value: string }
  | { type: "symbol"; value: string; base: string; subscript?: string }
  | { type: "unit"; value: string; expression: DocxFormulaNode }
  | { type: "unary"; operator: "+" | "-"; argument: DocxFormulaNode }
  | { type: "binary"; operator: "+" | "-" | "*" | "/" | "^"; left: DocxFormulaNode; right: DocxFormulaNode }
  | { type: "group"; bracket: "round" | "square"; expression: DocxFormulaNode }
  | { type: "function"; name: "min" | "max" | "sqrt" | "abs"; args: DocxFormulaNode[] }
  | { type: "chain"; operators: string[]; parts: DocxFormulaNode[] };

export type DocxFormulaStatement = {
  source: string;
  expression: DocxFormulaNode;
  suffix?: string;
};

export type ParseDocxFormulaResult =
  | { ok: true; statements: DocxFormulaStatement[] }
  | { ok: false; reason: string };

export function parseDocxFormula(formula: string): ParseDocxFormulaResult;
```

Implementation rules:

- split `; ` outside parentheses/brackets
- strip deterministic suffixes such as ` - умова виконується`, ` - умова не виконується`, and `, оскільки`
- tokenize known units before symbol tokens
- parse `^` tighter than `*` and `/`, which are tighter than `+` and `-`
- parse chain operators `=`, `<`, `<=`, `>`, `>=`, `=>` at the top level
- classify subscripts with `splitSymbol("γc1") -> { base: "γ", subscript: "c1" }`, `splitSymbol("As,min") -> { base: "A", subscript: "s,min" }`
- return fallback if no supported operator is present

- [ ] **Step 4: Run parser tests**

Run:

```bash
npm test -- lib/report-docx/math-parser.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit parser**

```bash
git add lib/report-docx/math-parser.ts lib/report-docx/math-parser.test.ts
git commit -m "feat: parse report formulas for docx"
```

## Task 3: Word Equation Conversion

**Files:**
- Create: `lib/report-docx/math-docx.test.ts`
- Create: `lib/report-docx/math-docx.ts`

- [ ] **Step 1: Write conversion tests**

Create tests that assert stable conversion metadata, not full XML snapshots:

```ts
import { describe, expect, it } from "vitest";

import { parseDocxFormula } from "./math-parser";
import { createDocxMathParagraphs, getDocxFormulaRenderMode } from "./math-docx";

describe("math-docx", () => {
  it("creates Word math paragraphs for parsed formulas", () => {
    const result = parseDocxFormula("R = γc1 * γc2 / k = 162.82 кПа");
    if (!result.ok) throw new Error(result.reason);

    const paragraphs = createDocxMathParagraphs(result.statements);

    expect(paragraphs).toHaveLength(1);
    expect(getDocxFormulaRenderMode(result.statements)).toBe("math");
  });

  it("creates one paragraph per semicolon-separated formula", () => {
    const result = parseDocxFormula("γc1 = 1.4; γc2 = 1.2");
    if (!result.ok) throw new Error(result.reason);

    expect(createDocxMathParagraphs(result.statements)).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run failing conversion tests**

Run:

```bash
npm test -- lib/report-docx/math-docx.test.ts
```

Expected: FAIL because `math-docx.ts` does not exist.

- [ ] **Step 3: Implement AST-to-docx conversion**

Create `lib/report-docx/math-docx.ts`.

Required exports:

```ts
import { Math as DocxMath, MathFraction, MathRun, MathText, Paragraph } from "docx";
import type { DocxFormulaNode, DocxFormulaStatement } from "./math-parser";

export function getDocxFormulaRenderMode(statements: DocxFormulaStatement[]): "math" {
  return "math";
}

export function createDocxMathParagraphs(statements: DocxFormulaStatement[]): Paragraph[];
```

Implement node conversion:

- `number` -> `new MathRun(value)`
- `symbol` with subscript -> subscript math component if available from `docx`; otherwise `new MathRun(`${base}_${subscript}`)` as a temporary internal fallback
- `binary "/"` -> `new MathFraction({ numerator, denominator })`
- `binary "^"` -> superscript math component if available from `docx`; otherwise text fallback inside math
- `binary "*"` -> left, `new MathText(" · ")`, right
- `chain` -> parts separated by `MathText(" = ")`, `MathText(" <= ")`, or matching comparison text
- `group` -> bracket text, children, bracket text
- `function` -> function name, `(`, arguments separated by `; `, `)`
- `unit` -> expression, `MathText(" " + unit)`

- [ ] **Step 4: Run conversion tests**

Run:

```bash
npm test -- lib/report-docx/math-docx.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit conversion**

```bash
git add lib/report-docx/math-docx.ts lib/report-docx/math-docx.test.ts
git commit -m "feat: render report formulas as docx math"
```

## Task 4: DOCX Builder And Browser Bridge

**Files:**
- Create: `lib/report-docx/document.test.ts`
- Create: `lib/report-docx/document.ts`
- Create: `lib/report-docx/browser.ts`

- [ ] **Step 1: Write document builder tests**

Create `lib/report-docx/document.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { buildReportDocxDocument, getFormulaRenderPlan } from "./document";
import type { DocxReportDocument } from "./types";

const documentModel: DocxReportDocument = {
  title: "Покроковий звіт",
  fileBaseName: "test-report",
  steps: [
    {
      key: "r",
      caption: "Визначення R (формула Е.1):",
      items: ["b = 1 м"],
      notes: ["Примітка"],
      formula: "R = γc1 * γc2 / k = 162.82 кПа",
    },
  ],
};

describe("buildReportDocxDocument", () => {
  it("builds a docx document from report steps", () => {
    expect(() => buildReportDocxDocument(documentModel)).not.toThrow();
  });

  it("plans fallback text for unsupported formulas", () => {
    expect(getFormulaRenderPlan("Приймаємо значення з таблиці")).toEqual({
      mode: "text",
      text: "Приймаємо значення з таблиці",
    });
  });
});
```

- [ ] **Step 2: Run failing builder tests**

Run:

```bash
npm test -- lib/report-docx/document.test.ts
```

Expected: FAIL because `document.ts` does not exist.

- [ ] **Step 3: Implement document builder**

Create `lib/report-docx/document.ts`:

```ts
import {
  AlignmentType,
  Document,
  HeadingLevel,
  ImageRun,
  Paragraph,
  TextRun,
} from "docx";

import { createDocxMathParagraphs } from "./math-docx";
import { parseDocxFormula } from "./math-parser";
import type { DocxReportDocument, DocxReportFigure, DocxReportStep } from "./types";

export type FormulaRenderPlan =
  | { mode: "math"; paragraphs: Paragraph[] }
  | { mode: "text"; text: string };

export function getFormulaRenderPlan(formula: string): FormulaRenderPlan;
export function buildReportDocxDocument(report: DocxReportDocument): Document;
```

Builder rules:

- document title uses `HeadingLevel.TITLE`
- add optional figures before the `Покроковий звіт` heading
- render steps as numbered paragraphs with captions
- render `items` as bullet paragraphs
- render `notes` as italic or subdued text paragraphs
- render formulas through `getFormulaRenderPlan`
- fallback formulas use exact plain text

- [ ] **Step 4: Implement browser helpers**

Create `lib/report-docx/browser.ts`:

```ts
import { Packer } from "docx";

import { buildReportDocxDocument } from "./document";
import type { DocxReportDocument, DocxReportFigure } from "./types";

export async function svgToPngArrayBuffer(svg: string, widthPx: number, heightPx: number): Promise<ArrayBuffer>;
export async function prepareReportFigures(figures: DocxReportFigure[] = []): Promise<DocxReportFigure[]>;
export async function downloadReportDocx(report: DocxReportDocument): Promise<void>;
```

Download rules:

- convert `svg` figures to `pngData`
- call `Packer.toBlob(buildReportDocxDocument(preparedReport))`
- create an object URL
- click a temporary `<a download="${fileBaseName}.docx">`
- revoke the object URL

- [ ] **Step 5: Run builder tests**

Run:

```bash
npm test -- lib/report-docx/document.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit builder and browser bridge**

```bash
git add lib/report-docx/document.ts lib/report-docx/document.test.ts lib/report-docx/browser.ts
git commit -m "feat: build browser docx reports"
```

## Task 5: Soil Adapter And Export Button

**Files:**
- Create: `components/calculators/report-docx-button.tsx`
- Modify: `components/calculators/soil-design-resistance-calculator.tsx`
- Modify: `components/calculators/soil-design-resistance-calculator.test.ts`
- Modify: `components/calculator-shell.test.tsx`

- [ ] **Step 1: Add failing soil adapter and button tests**

Extend `components/calculators/soil-design-resistance-calculator.test.ts`:

```ts
import { getSoilDesignResistanceReport } from "@/lib/soil-design-resistance";

import { buildSoilDesignResistanceDocxReport } from "./soil-design-resistance-calculator";

it("maps the soil report to the universal DOCX report contract", () => {
  const report = getSoilDesignResistanceReport({
    calculationMode: "manual-e7",
    structuralScheme: "rigid",
    buildingLengthM: 8.25,
    buildingHeightM: 3,
    soilType: "medium-sand",
    liquidityIndex: 0.3,
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
    basementDepthInputM: 1.5,
    soilLayerAboveFootingHsM: 0.4,
    basementFloorThicknessHcfM: 0.2,
    basementFloorUnitWeightGammaCfKnM3: 22,
  });

  const docxReport = buildSoilDesignResistanceDocxReport(report);

  expect(docxReport.title).toBe("Покроковий звіт");
  expect(docxReport.fileBaseName).toMatch(/^rozrakhunkovyi-opir-gruntu-\d{4}-\d{2}-\d{2}$/);
  expect(docxReport.steps.map((step) => step.key)).toEqual(report.steps.map((step) => step.key));
  expect(docxReport.steps.find((step) => step.key === "r")?.formula).toBe(
    report.steps.find((step) => step.key === "r")?.formula,
  );
  expect(docxReport.figures?.[0]?.svg).toContain("<svg");
});

it("shows a DOCX download button in the report section", () => {
  render(createElement(SoilDesignResistanceCalculator));

  expect(screen.getByRole("button", { name: "Завантажити DOCX" })).toBeInTheDocument();
});
```

Extend `components/calculator-shell.test.tsx` in the soil report test:

```ts
expect(screen.getByRole("button", { name: "Завантажити DOCX" })).toBeInTheDocument();
```

- [ ] **Step 2: Run failing UI tests**

Run:

```bash
npm test -- components/calculators/soil-design-resistance-calculator.test.ts components/calculator-shell.test.tsx
```

Expected: FAIL because the adapter and button do not exist.

- [ ] **Step 3: Implement reusable button**

Create `components/calculators/report-docx-button.tsx`:

```tsx
"use client";

import { Download } from "lucide-react";
import { useState } from "react";

import { downloadReportDocx } from "@/lib/report-docx/browser";
import type { DocxReportDocument } from "@/lib/report-docx/types";

type ReportDocxButtonProps = {
  report: DocxReportDocument;
};

export function ReportDocxButton({ report }: ReportDocxButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  async function handleClick() {
    setStatus("loading");
    try {
      await downloadReportDocx(report);
      setStatus("idle");
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  }

  return (
    <div className="report-docx-action">
      <button type="button" className="report-docx-action__button" onClick={handleClick} disabled={status === "loading"}>
        <Download aria-hidden="true" size={16} />
        {status === "loading" ? "Готуємо DOCX..." : "Завантажити DOCX"}
      </button>
      {status === "error" ? (
        <p className="report-docx-action__error">Не вдалося сформувати DOCX. Спробуйте ще раз.</p>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 4: Implement soil adapter**

In `components/calculators/soil-design-resistance-calculator.tsx`:

- export `buildSoilDesignResistanceDocxReport(report)`
- reuse the existing `getSoilFoundationScene` and `buildScene` path to generate the same SVG
- strip only no data; preserve exact step strings
- render `<ReportDocxButton report={docxReport} />` next to the `Покроковий звіт` heading

- [ ] **Step 5: Add CSS for button**

Add compact styles near existing report styles in `app/globals.css`:

```css
.report-docx-action {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
}

.report-docx-action__button {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.report-docx-action__error {
  margin: 0;
  color: #b42318;
}
```

- [ ] **Step 6: Run UI tests**

Run:

```bash
npm test -- components/calculators/soil-design-resistance-calculator.test.ts components/calculator-shell.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit adapter and UI**

```bash
git add components/calculators/report-docx-button.tsx components/calculators/soil-design-resistance-calculator.tsx components/calculators/soil-design-resistance-calculator.test.ts components/calculator-shell.test.tsx app/globals.css
git commit -m "feat: export soil report as docx"
```

## Task 6: Documentation And Full Verification

**Files:**
- Modify: `docs/calculation-reporting-guide.md`

- [ ] **Step 1: Update reporting guide**

Add a short DOCX section stating:

```markdown
## DOCX export

Native calculators that support report export should map their existing `report.steps` into the universal `DocxReportDocument` contract from `lib/report-docx/types.ts`.

The canonical formula source remains the plain-text `formula` or `formulas` string in each report step. Do not add duplicate calculator fields for DOCX formulas. Unsupported formulas must fall back to exact plain text instead of blocking document generation.

For diagrams, pass controlled SVG or PNG data through `DocxReportFigure`. Browser export converts SVG to PNG before embedding because static Cloudflare Pages deployment has no server-side document generation.
```

- [ ] **Step 2: Run targeted tests**

Run:

```bash
npm test -- lib/report-docx/math-parser.test.ts lib/report-docx/math-docx.test.ts lib/report-docx/document.test.ts components/calculators/soil-design-resistance-calculator.test.ts components/calculator-shell.test.tsx
```

Expected: PASS.

- [ ] **Step 3: Run full verification**

Run:

```bash
npm test
npm run typecheck
npm run build
```

Expected: PASS.

- [ ] **Step 4: Commit docs and verification fixes**

```bash
git add docs/calculation-reporting-guide.md
git commit -m "docs: document docx report export"
```

If verification requires small fixes in implementation files, include those files in this commit with the docs.

## Self-Review

Spec coverage:

- Browser-only DOCX generation is covered by Task 4.
- Universal export contract is covered by Task 1.
- Broad arithmetic parser is covered by Task 2.
- Word-native equations are covered by Task 3.
- SVG-to-PNG figure handling is covered by Task 4 and Task 5.
- `soil-design-resistance` pilot UI is covered by Task 5.
- Reporting guide update is covered by Task 6.

Placeholder scan:

- No unresolved placeholder markers or open implementation placeholders are used.

Type consistency:

- `DocxReportDocument`, `DocxReportStep`, and `DocxReportFigure` names match the design spec.
- `parseDocxFormula`, `createDocxMathParagraphs`, `buildReportDocxDocument`, and `downloadReportDocx` are consistently named across tasks.
