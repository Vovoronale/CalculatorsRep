# Report Formula KaTeX Renderer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render native calculator report formulas through a shared plain-text-to-LaTeX pipeline while preserving each original `formula` string as the canonical source for tests, accessibility, titles, and copy workflows.

**Architecture:** Add a small shared notation dictionary, a controlled-syntax formula parser, and a `ReportFormula` React component that calls `katex.renderToString`. Migrate `soil-design-resistance` first because it has the richest current report formula set, including table Е.8 interpolation and `formulas?: string[]`.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest, Testing Library, KaTeX.

---

## Source Specs

- Canonical design: `docs/superpowers/specs/2026-06-09-report-formula-katex-renderer-design.md`
- Report wording constraints: `docs/calculation-reporting-guide.md`
- First migrated calculator report contract: `docs/superpowers/specs/2026-06-09-soil-design-resistance-report-contract.md`

The original `formula` and `formulas` strings must not be changed to satisfy rendering. If a report string needs to change, update and re-approve the relevant report contract first.

## File Structure

- Create `lib/report-notation.ts`: shared symbol metadata and symbol-to-LaTeX conversion helpers.
- Create `lib/report-formula-parser.ts`: parse controlled plain-text report formulas and produce sanitized LaTeX lines.
- Create `lib/report-formula-parser.test.ts`: parser unit tests for supported formulas and fallback cases.
- Create `components/calculators/report-formula.tsx`: React renderer that preserves `aria-label`/`title`, renders KaTeX for supported formulas, and falls back to plain text.
- Create `components/calculators/report-formula.test.tsx`: UI tests for accessibility preservation, KaTeX markup, and fallback behavior.
- Modify `components/calculators/soil-design-resistance-calculator.tsx`: remove local formula symbol renderer for report formulas and delegate formula rendering to `ReportFormula`; keep `RichText` for captions, notes, and normative links.
- Modify `app/layout.tsx`: import KaTeX CSS once.
- Modify `app/globals.css`: add shared `.report-formula` styles and keep existing `.soil-resistance-equation` compatibility if tests or CSS still reference it.
- Modify `components/calculator-shell.test.tsx`: assert the migrated soil report still exposes exact plain-text formula labels and now contains KaTeX markup.
- Modify `package.json` and lockfile: add `katex`.
- Modify `docs/calculation-reporting-guide.md`: document the shared renderer rule.

## Task 1: Add KaTeX Dependency

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Install dependency**

Run:

```bash
npm install katex
```

Expected: `package.json` gains `"katex": "^0.16.x"` under `dependencies`, and `package-lock.json` is updated.

- [ ] **Step 2: Verify install**

Run:

```bash
npm ls katex
```

Expected: output includes `katex@0.16`.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add katex dependency"
```

## Task 2: Shared Notation Dictionary

**Files:**
- Create: `lib/report-notation.ts`
- Test: `lib/report-formula-parser.test.ts`

- [ ] **Step 1: Create parser test scaffold with notation expectations**

Create `lib/report-formula-parser.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { reportSymbolToLatex } from "./report-notation";

describe("reportSymbolToLatex", () => {
  it("maps shared engineering notation to LaTeX", () => {
    expect(reportSymbolToLatex("Mγ")).toBe("M_{\\gamma}");
    expect(reportSymbolToLatex("Mγ,a")).toBe("M_{\\gamma,a}");
    expect(reportSymbolToLatex("Mq")).toBe("M_q");
    expect(reportSymbolToLatex("Mc")).toBe("M_c");
    expect(reportSymbolToLatex("φ11")).toBe("\\varphi_{11}");
    expect(reportSymbolToLatex("φa")).toBe("\\varphi_a");
    expect(reportSymbolToLatex("γc1")).toBe("\\gamma_{c1}");
    expect(reportSymbolToLatex("γ′11")).toBe("\\gamma'_{11}");
    expect(reportSymbolToLatex("As,min,1")).toBe("A_{s,min,1}");
    expect(reportSymbolToLatex("db,input")).toBe("d_{b,input}");
    expect(reportSymbolToLatex("L/H")).toBe("\\frac{L}{H}");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- lib/report-formula-parser.test.ts
```

Expected: FAIL because `lib/report-notation.ts` does not exist.

- [ ] **Step 3: Add notation module**

Create `lib/report-notation.ts`:

```ts
const GREEK_TO_LATEX: Record<string, string> = {
  "γ": "\\gamma",
  "φ": "\\varphi",
  "Ø": "\\varnothing",
  "Σ": "\\Sigma",
  "λ": "\\lambda",
  "σ": "\\sigma",
};

const NAMED_SYMBOLS: Record<string, string> = {
  "Mγ": "M_{\\gamma}",
  "Mγ,a": "M_{\\gamma,a}",
  "Mγ,b": "M_{\\gamma,b}",
  "Mq": "M_q",
  "Mq,a": "M_{q,a}",
  "Mq,b": "M_{q,b}",
  "Mc": "M_c",
  "Mc,a": "M_{c,a}",
  "Mc,b": "M_{c,b}",
  "φ11": "\\varphi_{11}",
  "φa": "\\varphi_a",
  "φb": "\\varphi_b",
  "γc1": "\\gamma_{c1}",
  "γc2": "\\gamma_{c2}",
  "γ11": "\\gamma_{11}",
  "γ′11": "\\gamma'_{11}",
  "γcf": "\\gamma_{cf}",
  "As": "A_s",
  "As,min": "A_{s,min}",
  "As,min,1": "A_{s,min,1}",
  "As,min,2": "A_{s,min,2}",
  "As,prov": "A_{s,prov}",
  "Ast": "A_{st}",
  "Ast,min": "A_{st,min}",
  "db": "d_b",
  "db,input": "d_{b,input}",
  "d1": "d_1",
  "hs": "h_s",
  "hcf": "h_{cf}",
  "IL": "I_L",
  "L/H": "\\frac{L}{H}",
  "kz": "k_z",
  "z0": "z_0",
  "qmax": "q_{max}",
  "qmin": "q_{min}",
  "lb,rqd": "l_{b,rqd}",
  "lb,min": "l_{b,min}",
  "lb,req": "l_{b,req}",
  "fctm": "f_{ctm}",
  "fyk": "f_{yk}",
  "bt": "b_t",
};

export function reportSymbolToLatex(symbol: string): string {
  const named = NAMED_SYMBOLS[symbol];
  if (named) return named;

  const greek = GREEK_TO_LATEX[symbol];
  if (greek) return greek;

  return symbol.replace(/[γφØΣλσ]/g, (match) => GREEK_TO_LATEX[match] ?? match);
}

export function isKnownReportSymbol(symbol: string): boolean {
  return symbol in NAMED_SYMBOLS || symbol in GREEK_TO_LATEX;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm test -- lib/report-formula-parser.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/report-notation.ts lib/report-formula-parser.test.ts
git commit -m "feat: add shared report notation"
```

## Task 3: Formula Parser

**Files:**
- Create: `lib/report-formula-parser.ts`
- Modify: `lib/report-formula-parser.test.ts`

- [ ] **Step 1: Add failing parser tests**

Append to `lib/report-formula-parser.test.ts`:

```ts
import { parseReportFormula } from "./report-formula-parser";

describe("parseReportFormula", () => {
  it("renders table E8 interpolation formulas as separate LaTeX lines with fractions", () => {
    const formula =
      "Mγ = Mγ,a + (Mγ,b - Mγ,a) * (φ11 - φa) / (φb - φa) = 1.15 + (1.24 - 1.15) * (30.01 - 30) / (31 - 30) = 1.15; Mq = Mq,a + (Mq,b - Mq,a) * (φ11 - φa) / (φb - φa) = 5.59 + (5.95 - 5.59) * (30.01 - 30) / (31 - 30) = 5.59; Mc = Mc,a + (Mc,b - Mc,a) * (φ11 - φa) / (φb - φa) = 7.95 + (8.24 - 7.95) * (30.01 - 30) / (31 - 30) = 7.95";

    const result = parseReportFormula(formula);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.lines).toHaveLength(3);
    expect(result.lines[0].latex).toContain("M_{\\gamma}");
    expect(result.lines[0].latex).toContain("\\frac{\\varphi_{11} - \\varphi_a}{\\varphi_b - \\varphi_a}");
    expect(result.lines[1].latex).toContain("M_q");
    expect(result.lines[2].latex).toContain("M_c");
  });

  it("renders the R formula with brackets, multiplication, symbols, and units", () => {
    const formula =
      "R = γc1 * γc2 / k * [Mγ * kz * b * γ11 + Mq * d1 * γ′11 + (Mq - 1) * db * γ′11 + Mc * c11] = 1.4 * 1.2 / 1.1 * [1.15 * 1 * 2 * 18 + 5.59 * 1.5 * 19 + (5.59 - 1) * 0 * 19 + 7.95 * 10] = 433.61 кПа";

    const result = parseReportFormula(formula);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.lines[0].latex).toContain("R");
    expect(result.lines[0].latex).toContain("\\gamma_{c1}");
    expect(result.lines[0].latex).toContain("\\left[");
    expect(result.lines[0].latex).toContain("\\right]");
    expect(result.lines[0].latex).toContain("\\text{кПа}");
  });

  it("keeps explanatory suffixes as text", () => {
    const result = parseReportFormula("k = 1.0, оскільки характеристики ґрунту прийняті за прямими випробуваннями");

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.reason);
    expect(result.lines[0].latex).toBe("k = 1.0\\text{, оскільки характеристики ґрунту прийняті за прямими випробуваннями}");
  });

  it("renders min max and comparison implication operators", () => {
    const minMax = parseReportFormula("As,min = max(As,min,1; As,min,2) = max(219.62 мм²; 195 мм²) = 219.62 мм²");
    const comparison = parseReportFormula("d1 <= d => 1 <= 1.5");

    expect(minMax.ok).toBe(true);
    expect(comparison.ok).toBe(true);
    if (!minMax.ok || !comparison.ok) throw new Error("Expected supported formulas");
    expect(minMax.lines[0].latex).toContain("\\max");
    expect(minMax.lines[0].latex).toContain("A_{s,min}");
    expect(comparison.lines[0].latex).toContain("\\le");
    expect(comparison.lines[0].latex).toContain("\\Rightarrow");
  });

  it("returns fallback for unsupported prose formulas", () => {
    const result = parseReportFormula("Приймаємо значення з таблиці без математичного виразу");

    expect(result).toEqual({
      ok: false,
      reason: "Formula does not start with a supported mathematical token.",
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- lib/report-formula-parser.test.ts
```

Expected: FAIL because `parseReportFormula` does not exist.

- [ ] **Step 3: Add parser implementation**

Create `lib/report-formula-parser.ts`:

```ts
import { reportSymbolToLatex } from "./report-notation";

export type ParsedFormulaLine = {
  source: string;
  latex: string;
};

export type ParseReportFormulaResult =
  | { ok: true; lines: ParsedFormulaLine[] }
  | { ok: false; reason: string };

const MATH_START_PATTERN = /^(?:[-+()\[]|\d|[A-Za-zА-Яа-яІіЇїЄєҐґØΣλσγφ][A-Za-zА-Яа-яІіЇїЄєҐґ0-9_,./′-]*)/u;
const SYMBOL_PATTERN = /[A-Za-zА-Яа-яІіЇїЄєҐґØΣλσγφ][A-Za-zА-Яа-яІіЇїЄєҐґ0-9_,.′/-]*/gu;
const UNIT_PATTERN = /\s(кПа|м|т\/м²|кг\/см²|мм²|см²|МПа|кН|кН\/м²|мм)$/u;
const EXPLANATORY_SUFFIX_PATTERNS = [", оскільки", " - умова виконується", " - умова не виконується"];

function splitStatements(formula: string): string[] {
  return formula
    .split("; ")
    .map((line) => line.trim())
    .filter(Boolean);
}

function splitExplanatorySuffix(line: string): { math: string; suffix: string } {
  for (const marker of EXPLANATORY_SUFFIX_PATTERNS) {
    const index = line.indexOf(marker);
    if (index !== -1) {
      return {
        math: line.slice(0, index).trim(),
        suffix: line.slice(index),
      };
    }
  }

  return { math: line, suffix: "" };
}

function escapeLatexText(text: string): string {
  return text.replace(/\\/g, "\\textbackslash{}").replace(/[{}]/g, (match) => `\\${match}`);
}

function convertUnits(latex: string): string {
  return latex.replace(UNIT_PATTERN, (_match, unit: string) => `\\ \\text{${escapeLatexText(unit)}}`);
}

function convertSymbols(latex: string): string {
  return latex.replace(SYMBOL_PATTERN, (symbol) => {
    if (/^\d/.test(symbol)) return symbol;
    if (["min", "max"].includes(symbol)) return `\\${symbol}`;
    if (["pi"].includes(symbol)) return "\\pi";
    return reportSymbolToLatex(symbol);
  });
}

function convertFractions(latex: string): string {
  return latex.replace(
    /\(([^()]+)\)\s*\/\s*\(([^()]+)\)/g,
    (_match, numerator: string, denominator: string) => `\\frac{${numerator.trim()}}{${denominator.trim()}}`,
  );
}

function convertOperators(latex: string): string {
  return latex
    .replace(/<=/g, "\\le")
    .replace(/>=/g, "\\ge")
    .replace(/=>/g, "\\Rightarrow")
    .replace(/\*/g, "\\cdot")
    .replace(/\[/g, "\\left[")
    .replace(/\]/g, "\\right]");
}

function convertFunctionSeparators(latex: string): string {
  return latex.replace(/\\(min|max)\(([^)]+)\)/g, (_match, fn: string, body: string) => {
    const args = body.replace(/;\s*/g, ";\\ ");
    return `\\${fn}\\left(${args}\\right)`;
  });
}

function lineToLatex(source: string): string {
  const { math, suffix } = splitExplanatorySuffix(source);
  let latex = math;

  latex = convertSymbols(latex);
  latex = convertFractions(latex);
  latex = convertOperators(latex);
  latex = convertFunctionSeparators(latex);
  latex = convertUnits(latex);

  if (suffix) {
    latex += `\\text{${escapeLatexText(suffix)}}`;
  }

  return latex;
}

export function parseReportFormula(formula: string): ParseReportFormulaResult {
  const trimmed = formula.trim();

  if (!MATH_START_PATTERN.test(trimmed)) {
    return {
      ok: false,
      reason: "Formula does not start with a supported mathematical token.",
    };
  }

  const lines = splitStatements(trimmed);

  if (lines.length === 0) {
    return {
      ok: false,
      reason: "Formula is empty.",
    };
  }

  return {
    ok: true,
    lines: lines.map((source) => ({
      source,
      latex: lineToLatex(source),
    })),
  };
}
```

- [ ] **Step 4: Run parser tests**

Run:

```bash
npm test -- lib/report-formula-parser.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/report-formula-parser.ts lib/report-formula-parser.test.ts
git commit -m "feat: parse report formulas to latex"
```

## Task 4: Shared ReportFormula Component

**Files:**
- Create: `components/calculators/report-formula.tsx`
- Create: `components/calculators/report-formula.test.tsx`

- [ ] **Step 1: Add failing UI tests**

Create `components/calculators/report-formula.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReportFormula } from "./report-formula";

describe("ReportFormula", () => {
  it("preserves the exact original formula as aria-label and title", () => {
    const formula = "γc1 = 1.4; γc2 = 1.2";

    render(<ReportFormula formula={formula} />);

    const element = screen.getByLabelText(formula);
    expect(element).toHaveAttribute("title", formula);
  });

  it("renders supported formulas with KaTeX markup", () => {
    render(<ReportFormula formula="Mγ = Mγ,a + (Mγ,b - Mγ,a) * (φ11 - φa) / (φb - φa) = 1.15" />);

    const element = screen.getByLabelText(
      "Mγ = Mγ,a + (Mγ,b - Mγ,a) * (φ11 - φa) / (φb - φa) = 1.15",
    );
    expect(element.querySelector(".katex")).toBeInTheDocument();
    expect(element.textContent).toContain("M");
  });

  it("renders unsupported formulas as fallback text without throwing", () => {
    const formula = "Приймаємо значення з таблиці без математичного виразу";

    render(<ReportFormula formula={formula} />);

    const element = screen.getByLabelText(formula);
    expect(element).toHaveClass("report-formula--fallback");
    expect(element).toHaveTextContent(formula);
    expect(element.querySelector(".katex")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm test -- components/calculators/report-formula.test.tsx
```

Expected: FAIL because `ReportFormula` does not exist.

- [ ] **Step 3: Add component**

Create `components/calculators/report-formula.tsx`:

```tsx
"use client";

import katex from "katex";
import { useMemo } from "react";

import { parseReportFormula } from "@/lib/report-formula-parser";

type ReportFormulaProps = {
  formula: string;
  className?: string;
};

function joinClassNames(...classNames: Array<string | undefined | false>): string {
  return classNames.filter(Boolean).join(" ");
}

export function ReportFormula({ formula, className }: ReportFormulaProps) {
  const parsed = useMemo(() => parseReportFormula(formula), [formula]);

  if (!parsed.ok) {
    return (
      <div
        className={joinClassNames("report-formula", "report-formula--fallback", className)}
        aria-label={formula}
        title={formula}
      >
        {formula}
      </div>
    );
  }

  return (
    <div className={joinClassNames("report-formula", className)} aria-label={formula} title={formula}>
      {parsed.lines.map((line) => (
        <div
          key={line.source}
          className="report-formula__line"
          dangerouslySetInnerHTML={{
            __html: katex.renderToString(line.latex, {
              displayMode: true,
              throwOnError: false,
              strict: "ignore",
              trust: false,
            }),
          }}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run component tests**

Run:

```bash
npm test -- components/calculators/report-formula.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/calculators/report-formula.tsx components/calculators/report-formula.test.tsx
git commit -m "feat: add shared report formula renderer"
```

## Task 5: Global KaTeX Styling

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Add CSS import**

In `app/layout.tsx`, add the KaTeX import before the local globals import:

```ts
import "katex/dist/katex.min.css";

import "./globals.css";
```

- [ ] **Step 2: Add shared report formula styles**

Append near existing calculator formula styles in `app/globals.css`:

```css
.report-formula {
  margin-block: 0.45rem;
  overflow-x: auto;
  color: var(--color-text);
  line-height: 1.55;
  scrollbar-width: thin;
}

.report-formula__line {
  width: max-content;
  max-width: 100%;
  min-width: 100%;
}

.report-formula .katex-display {
  margin: 0.25rem 0;
  text-align: left;
}

.report-formula .katex {
  font-size: 1.02rem;
}

.report-formula--fallback {
  font-family: var(--font-mono);
  white-space: pre-wrap;
}

.soil-resistance-equation.report-formula {
  margin-block: 0.45rem;
}
```

- [ ] **Step 3: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx app/globals.css
git commit -m "style: add report formula katex styles"
```

## Task 6: Migrate Soil Report Formulas

**Files:**
- Modify: `components/calculators/soil-design-resistance-calculator.tsx`
- Modify: `components/calculator-shell.test.tsx`

- [ ] **Step 1: Add failing shell assertion for KaTeX rendering**

In the existing soil design resistance shell test in `components/calculator-shell.test.tsx`, add assertions near the report formula checks:

```tsx
const rFormula = screen.getByLabelText(
  "R = γc1 * γc2 / k * [Mγ * kz * b * γ11 + Mq * d1 * γ′11 + (Mq - 1) * db * γ′11 + Mc * c11] = 1 * 1 / 1 * [1.15 * 1 * 1 * 17.1 + 5.59 * 1.2 * 16.6 + (5.59 - 1) * 0 * 16.6 + 7.95 * 4] = 162.82 кПа",
);
expect(rFormula.querySelector(".katex")).toBeInTheDocument();
expect(rFormula).toHaveClass("soil-resistance-equation");
expect(rFormula).toHaveAttribute(
  "title",
  "R = γc1 * γc2 / k * [Mγ * kz * b * γ11 + Mq * d1 * γ′11 + (Mq - 1) * db * γ′11 + Mc * c11] = 1 * 1 / 1 * [1.15 * 1 * 1 * 17.1 + 5.59 * 1.2 * 16.6 + (5.59 - 1) * 0 * 16.6 + 7.95 * 4] = 162.82 кПа",
);
```

- [ ] **Step 2: Run shell test to verify it fails**

Run:

```bash
npm test -- components/calculator-shell.test.tsx
```

Expected: FAIL because soil formulas still render through local rich text without `.katex`.

- [ ] **Step 3: Replace local formula rendering**

In `components/calculators/soil-design-resistance-calculator.tsx`:

1. Add import:

```ts
import { ReportFormula } from "./report-formula";
```

2. Remove `SYMBOLS`, `SYMBOL_PATTERN`, `isFormulaBoundary`, and `renderFormulaText` only if no non-formula text still uses them.

3. Keep `RichText` for captions, notes, warnings, and normative links, but change plain text slices to render as ordinary text:

```tsx
function RichText({ text }: { text: string }) {
  const linkPattern = new RegExp(
    NORM_LINKS.map((link) => link.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
    "g",
  );
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(linkPattern)) {
    if (match.index === undefined) continue;

    if (match.index > lastIndex) {
      nodes.push(<span key={`text:${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>);
    }

    const link = NORM_LINKS.find((item) => item.text === match[0]);
    if (link) {
      nodes.push(
        <a key={`${link.id}:${match.index}`} href={`#${link.id}`}>
          {link.text}
        </a>,
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(<span key={`text:${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }

  return <>{nodes}</>;
}
```

4. Replace `ReportStepFormulas` body with:

```tsx
function ReportStepFormulas({ step }: { step: SoilDesignResistanceReportStep }) {
  const formulas = [
    ...(step.formula ? [step.formula] : []),
    ...(step.formulas ?? []),
  ];

  if (formulas.length === 0) return null;

  return (
    <>
      {formulas.map((formula) => (
        <ReportFormula key={formula} formula={formula} className="soil-resistance-equation" />
      ))}
    </>
  );
}
```

- [ ] **Step 4: Run shell test**

Run:

```bash
npm test -- components/calculator-shell.test.tsx
```

Expected: PASS. Existing exact `aria-label` assertions must still pass.

- [ ] **Step 5: Run soil library tests**

Run:

```bash
npm test -- lib/soil-design-resistance.test.ts
```

Expected: PASS. These tests prove report strings stayed canonical.

- [ ] **Step 6: Commit**

```bash
git add components/calculators/soil-design-resistance-calculator.tsx components/calculator-shell.test.tsx
git commit -m "feat: render soil report formulas with katex"
```

## Task 7: Documentation Update

**Files:**
- Modify: `docs/calculation-reporting-guide.md`

- [ ] **Step 1: Update mathematical formula renderer guidance**

In `docs/calculation-reporting-guide.md`, update the formula rendering section to include:

```md
Plain-text `formula` remains the only canonical formula field in report steps. Do not add `formulaLatex`, `formulaDisplay`, or duplicated formula variants.

UI rendering should use `components/calculators/report-formula.tsx`. The component parses the controlled plain-text formula style into LaTeX and renders supported formulas with KaTeX. Unsupported formulas must fall back to the original plain-text string without breaking the page.

Every rendered formula must preserve the exact original `formula` string in `aria-label` and `title`, so tests, accessibility, and copy workflows continue to use the agreed report contract text.
```

- [ ] **Step 2: Run docs grep check**

Run:

```bash
rg -n "formulaLatex|formulaDisplay|ReportFormula|report-formula" docs components lib
```

Expected: `formulaLatex` and `formulaDisplay` appear only in the spec/design as disallowed examples, and `ReportFormula` appears in the shared component plus migrated soil calculator.

- [ ] **Step 3: Commit**

```bash
git add docs/calculation-reporting-guide.md
git commit -m "docs: document shared report formula renderer"
```

## Task 8: Final Verification

**Files:**
- All changed files from previous tasks

- [ ] **Step 1: Run focused tests**

Run:

```bash
npm test -- lib/report-formula-parser.test.ts components/calculators/report-formula.test.tsx lib/soil-design-resistance.test.ts components/calculator-shell.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run full test suite**

Run:

```bash
npm test
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

Expected: PASS.

- [ ] **Step 5: Visual smoke check**

Run:

```bash
npm run dev
```

Open `http://localhost:3000`, select the soil design resistance calculator, and verify:

- formulas render as engineering math, not monospace code blocks;
- table Е.8 interpolation shows vertical fractions;
- long formulas scroll horizontally on mobile width instead of overlapping text;
- unsupported formula strings, if any, remain visible as plain text;
- normative links in captions and notes still work.

- [ ] **Step 6: Commit verification-only fixes if needed**

If any verification step requires a small fix, make the fix, rerun the failed command, and commit:

```bash
git add <changed-files>
git commit -m "fix: stabilize report formula rendering"
```

## Self-Review

- Spec coverage: The plan covers one canonical `formula` field, shared notation, parser, KaTeX renderer, fallback behavior, soil Е.8 interpolation, CSS, accessibility preservation, dependency setup, and docs. Broad migration to `cassoon`, `minimum`, and `foundation` is intentionally excluded from this first plan because each calculator has its own local rendering quirks and can be migrated after the shared renderer is proven on `soil-design-resistance`.
- Placeholder scan: No implementation step uses placeholder language or asks the worker to invent missing test content.
- Type consistency: The shared parser exports `parseReportFormula`, `ParsedFormulaLine`, and `ParseReportFormulaResult`; the component imports only `parseReportFormula`; calculator migration imports only `ReportFormula`.
