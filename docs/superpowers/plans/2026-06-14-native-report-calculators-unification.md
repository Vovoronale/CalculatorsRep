# Native Report Calculators Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `cassoon-load-distribution`, `minimum-reinforcement-area`, and `foundation-bar-anchorage` to the same report-calculator UI, formula renderer, input inspector, and DOCX workflow used by `soil-design-resistance`.

**Architecture:** Add shared native-report UI components and a shared DOCX step mapper, then migrate each calculator onto those primitives without changing calculation kernels or agreed plain-text report formulas. Keep calculator-specific diagrams, summaries, normative content, and parsing local to each calculator.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest, Testing Library, KaTeX `ReportFormula`, existing `InputSchemaForm`, existing browser DOCX pipeline.

---

## File Structure

- Create `components/calculators/native-calculator-layout.tsx`: shared outer frame, input menu, controls slot, diagram slot, status blocks.
- Create `components/calculators/native-report.tsx`: shared report renderer using `ReportFormula`.
- Create `components/calculators/native-report-docx.ts`: shared mapper from report steps to `DocxReportDocument`.
- Create `components/calculators/native-calculator-layout.test.tsx`: component tests for shared layout and report rendering.
- Modify `app/globals.css`: add generic `native-*` classes matching the soil calculator visual pattern.
- Modify `components/calculators/cassoon-load-distribution-calculator.tsx`: use shared layout/report/DOCX.
- Modify `components/calculators/cassoon-load-distribution-calculator.test.ts`: add DOCX mapping and shared UI tests.
- Modify `components/calculators/minimum-reinforcement-calculator.tsx`: add schema, use shared layout/report/DOCX.
- Modify `lib/minimum-reinforcement.test.ts`: keep calculation tests unchanged unless exact UI-only behavior is moved.
- Create or modify `components/calculators/minimum-reinforcement-calculator.test.tsx`: schema, DOCX, and UI tests.
- Modify `components/calculators/foundation-bar-anchorage-calculator.tsx`: add schema, use shared layout/report/DOCX.
- Create or modify `components/calculators/foundation-bar-anchorage-calculator.test.tsx`: schema, DOCX, and UI tests.
- Modify `components/calculator-shell.test.tsx`: add smoke assertions for shared native report UI on the three migrated calculators.

## Task 1: Shared Native Report UI

**Files:**

- Create: `components/calculators/native-calculator-layout.test.tsx`
- Create: `components/calculators/native-calculator-layout.tsx`
- Create: `components/calculators/native-report.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Write failing shared UI tests**

Create `components/calculators/native-calculator-layout.test.tsx`:

```tsx
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NativeCalculatorLayout } from "./native-calculator-layout";
import { NativeReport } from "./native-report";

describe("NativeCalculatorLayout", () => {
  it("renders the shared input shell, menu links, summary, diagram, warnings, and errors", () => {
    render(
      <NativeCalculatorLayout
        ariaLabel="Тестовий калькулятор"
        navLinks={[
          { href: "#inputs", label: "Ввід" },
          { href: "#report", label: "Звіт" },
        ]}
        summary={<p>R = 120 кПа</p>}
        controls={<div id="inputs">controls</div>}
        diagramTitle="Позначення величин"
        diagrams={<figure><figcaption>diagram</figcaption></figure>}
        errors={["Помилка"]}
        warnings={["Попередження"]}
      >
        <section id="report">report</section>
      </NativeCalculatorLayout>,
    );

    const calculator = screen.getByLabelText("Тестовий калькулятор");
    expect(calculator).toHaveClass("native-calculator");
    expect(within(calculator).getByText("Ввід")).toBeInTheDocument();
    expect(within(calculator).getByRole("link", { name: "Звіт" })).toHaveAttribute("href", "#report");
    expect(within(calculator).getByText("R = 120 кПа")).toBeInTheDocument();
    expect(within(calculator).getByRole("heading", { name: "Позначення величин" })).toBeInTheDocument();
    expect(within(calculator).getByRole("alert")).toHaveTextContent("Помилка");
    expect(within(calculator).getByText("Попередження")).toBeInTheDocument();
  });
});

describe("NativeReport", () => {
  it("renders captions, items, notes, and formulas with exact formula metadata", () => {
    render(
      <NativeReport
        titleId="test-report-title"
        title="Покроковий звіт"
        steps={[
          {
            key: "r",
            caption: "Визначення R:",
            items: ["b = 1 м"],
            notes: ["Примітка"],
            formula: "R = 120 кПа",
          },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { name: "Покроковий звіт" })).toBeInTheDocument();
    expect(screen.getByText("Визначення R:")).toBeInTheDocument();
    expect(screen.getByText("b = 1 м")).toBeInTheDocument();
    expect(screen.getByText("Примітка")).toBeInTheDocument();
    expect(screen.getByLabelText("R = 120 кПа")).toHaveAttribute("title", "R = 120 кПа");
  });
});
```

- [ ] **Step 2: Run shared UI tests to verify RED**

Run:

```bash
npm run test -- components/calculators/native-calculator-layout.test.tsx
```

Expected: FAIL because `native-calculator-layout.tsx` and `native-report.tsx` do not exist.

- [ ] **Step 3: Implement shared layout and report**

Create `components/calculators/native-calculator-layout.tsx` with exports:

```tsx
"use client";

import type { ReactNode } from "react";

export type NativeCalculatorNavLink = {
  href: string;
  label: string;
};

type NativeCalculatorLayoutProps = {
  ariaLabel: string;
  navLinks: NativeCalculatorNavLink[];
  summary?: ReactNode;
  controls: ReactNode;
  diagramTitle?: string;
  diagrams?: ReactNode;
  errors?: string[];
  warnings?: string[];
  children?: ReactNode;
};

function StatusBlock({
  kind,
  messages,
}: {
  kind: "warning" | "error";
  messages?: string[];
}) {
  if (!messages?.length) return null;

  return (
    <div
      className={`native-calculator__status native-calculator__status--${kind}`}
      role={kind === "error" ? "alert" : "status"}
    >
      {kind === "error" ? (
        <ul>
          {messages.map((message) => (
            <li key={message}>{message}</li>
          ))}
        </ul>
      ) : (
        messages.map((message) => <p key={message}>{message}</p>)
      )}
    </div>
  );
}

export function NativeCalculatorLayout({
  ariaLabel,
  navLinks,
  summary,
  controls,
  diagramTitle = "Позначення величин",
  diagrams,
  errors,
  warnings,
  children,
}: NativeCalculatorLayoutProps) {
  const diagramTitleId = "native-calculator-diagrams-title";

  return (
    <div className="native-calculator" aria-label={ariaLabel}>
      <div className="native-calculator__input-shell">
        <aside className="native-calculator__menu" aria-label="Меню вводу">
          <p className="native-calculator__menu-label">Ввід</p>
          <nav className="native-calculator__menu-links" aria-label="Розділи вводу">
            {navLinks.map((link) => (
              <a href={link.href} key={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
          {summary ? <div className="native-calculator__summary">{summary}</div> : null}
        </aside>

        <div className="native-calculator__controls">{controls}</div>

        {diagrams ? (
          <section className="native-calculator__diagrams" aria-labelledby={diagramTitleId}>
            <div className="native-report__head">
              <h3 id={diagramTitleId}>{diagramTitle}</h3>
            </div>
            {diagrams}
          </section>
        ) : null}
      </div>

      <StatusBlock kind="error" messages={errors} />
      <StatusBlock kind="warning" messages={warnings} />
      {children}
    </div>
  );
}
```

Create `components/calculators/native-report.tsx`:

```tsx
"use client";

import type { ReactNode } from "react";

import { ReportFormula } from "./report-formula";

export type NativeReportStep = {
  key: string;
  caption: string;
  items?: string[];
  notes?: string[];
  formula?: string;
  formulas?: string[];
};

type NativeReportProps = {
  titleId: string;
  title: string;
  steps: NativeReportStep[];
  actions?: ReactNode;
  renderText?: (text: string) => ReactNode;
};

export function NativeReport({
  titleId,
  title,
  steps,
  actions,
  renderText = (text) => text,
}: NativeReportProps) {
  return (
    <section className="native-report" aria-labelledby={titleId}>
      <div className="native-report__head">
        <h3 id={titleId}>{title}</h3>
        {actions}
      </div>
      <ol className="native-report__steps">
        {steps.map((step) => {
          const formulas = [
            ...(step.formula ? [step.formula] : []),
            ...(step.formulas ?? []),
          ];

          return (
            <li key={step.key} className="native-report__step">
              <p className="native-report__caption">{renderText(step.caption)}</p>
              {step.items?.length ? (
                <ul className="native-report__items">
                  {step.items.map((item) => (
                    <li key={item}>{renderText(item)}</li>
                  ))}
                </ul>
              ) : null}
              {step.notes?.length ? (
                <div className="native-report__notes">
                  {step.notes.map((note) => (
                    <p key={note}>{renderText(note)}</p>
                  ))}
                </div>
              ) : null}
              {formulas.map((formula) => (
                <ReportFormula
                  className="native-report__formula"
                  formula={formula}
                  key={formula}
                />
              ))}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
```

- [ ] **Step 4: Add generic CSS classes**

Add shared styles to `app/globals.css` near the soil resistance styles. Use the soil calculator values as the source of truth:

```css
.native-calculator {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 16px;
  border: 1px solid color-mix(in srgb, var(--accent) 22%, var(--border));
  border-radius: var(--radius-md);
  background: color-mix(in srgb, var(--accent) 4%, var(--surface));
}

.native-calculator__input-shell {
  display: grid;
  grid-template-areas: "menu controls diagram";
  grid-template-columns: minmax(120px, 150px) minmax(470px, 1fr) minmax(400px, 500px);
  gap: 12px;
  align-items: start;
}

.native-calculator__menu {
  grid-area: menu;
  position: sticky;
  top: 68px;
  display: grid;
  gap: 8px;
  min-width: 0;
  border: 1px solid color-mix(in srgb, var(--accent) 20%, var(--border));
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--accent) 4%, var(--bg));
  box-shadow: var(--shadow-sm);
  padding: 9px;
}
```

Add the remaining shared styles in the same block:

```css
.native-calculator__menu-label {
  margin: 0;
  color: var(--text-subtle);
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.08em;
  line-height: 1.2;
  text-transform: uppercase;
}

.native-calculator__menu-links {
  display: grid;
  gap: 5px;
}

.native-calculator__menu-links a {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  color: var(--text);
  font-size: 12px;
  font-weight: 800;
  line-height: 1.25;
  padding: 7px 8px;
  text-decoration: none;
}

.native-calculator__menu-links a:hover,
.native-calculator__menu-links a:focus-visible {
  border-color: color-mix(in srgb, var(--accent) 36%, var(--border));
  background: color-mix(in srgb, var(--accent) 10%, var(--surface));
  color: var(--accent);
}

.native-calculator__controls {
  grid-area: controls;
  display: grid;
  gap: 12px;
  min-width: 0;
}

.native-calculator__diagrams {
  grid-area: diagram;
  position: sticky;
  top: 68px;
  display: grid;
  gap: 10px;
  min-width: 0;
  border: 1px solid color-mix(in srgb, var(--accent) 18%, var(--border));
  border-radius: var(--radius-sm);
  background: color-mix(in srgb, var(--accent) 3%, var(--bg));
  box-shadow: var(--shadow-sm);
  padding: 10px;
}

.native-calculator__summary,
.native-calculator__status {
  border-radius: var(--radius-sm);
  font-size: 12px;
  line-height: 1.5;
  padding: 9px 10px;
}

.native-calculator__summary {
  display: grid;
  gap: 4px;
  border: 1px solid color-mix(in srgb, var(--accent) 26%, var(--border));
  background: color-mix(in srgb, var(--accent) 8%, var(--surface));
  color: var(--text);
  box-shadow: var(--shadow-sm);
}

.native-calculator__status--warning {
  border: 1px solid color-mix(in srgb, #f97316 34%, var(--border));
  background: color-mix(in srgb, #f97316 10%, var(--bg));
  color: var(--text);
}

.native-calculator__status--error {
  border: 1px solid color-mix(in srgb, #b91c1c 34%, var(--border));
  background: color-mix(in srgb, #b91c1c 9%, var(--bg));
  color: var(--text);
}

.native-calculator__summary p,
.native-calculator__status p,
.native-calculator__status ul {
  margin: 0;
}

.native-calculator__status ul {
  padding-left: 18px;
}

.native-report,
.native-norms {
  display: grid;
  gap: 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
  padding: 12px;
}

.native-report__head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.native-report__head h3 {
  margin: 0;
  color: var(--text);
  font-size: 14px;
  line-height: 1.3;
}

.native-report__steps,
.native-norms__list {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
}

.native-report__step,
.native-norm {
  display: grid;
  gap: 8px;
  min-width: 0;
  border-bottom: 1px solid var(--border);
  padding-bottom: 10px;
}

.native-report__step {
  counter-increment: report-step;
}

.native-report__step:last-child,
.native-norm:last-child {
  border-bottom: 0;
  padding-bottom: 0;
}

.native-report__caption {
  margin: 0;
  color: var(--text);
  font-size: 13px;
  font-weight: 800;
  line-height: 1.5;
}

.native-report__caption::before {
  content: counter(report-step) ". ";
  color: var(--accent);
}

.native-report__items {
  display: grid;
  gap: 4px;
  margin: 0;
  padding-left: 18px;
  color: var(--text-muted);
  font-size: 12px;
  line-height: 1.45;
}

.native-report__notes {
  display: grid;
  gap: 6px;
  color: var(--text-muted);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.5;
}

.native-report__notes p {
  margin: 0;
}

.native-report__formula.report-formula {
  margin-block: 0.45rem;
  border-radius: 0;
  background: transparent;
  font-family: var(--font-sans), sans-serif;
  font-size: 13px;
  font-weight: 600;
  padding: 0;
  white-space: normal;
}

@media (max-width: 1320px) {
  .native-calculator__input-shell {
    grid-template-areas:
      "menu menu"
      "controls diagram";
    grid-template-columns: minmax(0, 1fr) minmax(280px, 340px);
  }

  .native-calculator__menu,
  .native-calculator__diagrams {
    position: static;
  }

  .native-calculator__menu-links {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}

@media (max-width: 1100px) {
  .native-calculator__input-shell {
    grid-template-columns: minmax(0, 1fr) minmax(240px, 260px);
  }
}

@media (max-width: 760px) {
  .native-calculator__input-shell {
    grid-template-areas:
      "menu"
      "controls"
      "diagram";
    grid-template-columns: 1fr;
  }

  .native-calculator__menu-links {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .native-calculator {
    padding: 12px;
  }
}
```

- [ ] **Step 5: Run shared tests to verify GREEN**

Run:

```bash
npm run test -- components/calculators/native-calculator-layout.test.tsx
```

Expected: PASS.

## Task 2: Shared DOCX Mapping

**Files:**

- Create: `components/calculators/native-report-docx.ts`
- Create: `components/calculators/native-report-docx.test.ts`

- [ ] **Step 1: Write failing DOCX mapper test**

Create `components/calculators/native-report-docx.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { buildNativeDocxReport } from "./native-report-docx";

describe("buildNativeDocxReport", () => {
  it("maps report steps without mutating formula fields", () => {
    const report = buildNativeDocxReport({
      title: "Покроковий звіт",
      fileBaseName: "test-report",
      steps: [
        {
          key: "r",
          caption: "Caption",
          items: ["item"],
          notes: ["note"],
          formula: "R = 120 кПа",
          formulas: ["R = 12 т/м²"],
        },
      ],
    });

    expect(report).toEqual({
      title: "Покроковий звіт",
      fileBaseName: "test-report",
      steps: [
        {
          key: "r",
          caption: "Caption",
          items: ["item"],
          notes: ["note"],
          formula: "R = 120 кПа",
          formulas: ["R = 12 т/м²"],
        },
      ],
    });
  });
});
```

- [ ] **Step 2: Run DOCX mapper test to verify RED**

Run:

```bash
npm run test -- components/calculators/native-report-docx.test.ts
```

Expected: FAIL because `native-report-docx.ts` does not exist.

- [ ] **Step 3: Implement DOCX mapper**

Create `components/calculators/native-report-docx.ts`:

```ts
import type { DocxReportDocument, DocxReportFigure } from "@/lib/report-docx/types";

import type { NativeReportStep } from "./native-report";

type BuildNativeDocxReportInput = {
  title: string;
  fileBaseName: string;
  figures?: DocxReportFigure[];
  steps: NativeReportStep[];
};

export function buildNativeDocxReport({
  title,
  fileBaseName,
  figures,
  steps,
}: BuildNativeDocxReportInput): DocxReportDocument {
  return {
    title,
    fileBaseName,
    ...(figures?.length ? { figures } : {}),
    steps: steps.map((step) => ({
      key: step.key,
      caption: step.caption,
      ...(step.items ? { items: [...step.items] } : {}),
      ...(step.notes ? { notes: [...step.notes] } : {}),
      ...(step.formula ? { formula: step.formula } : {}),
      ...(step.formulas ? { formulas: [...step.formulas] } : {}),
    })),
  };
}

export function formatDocxFileDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
```

- [ ] **Step 4: Run DOCX mapper test to verify GREEN**

Run:

```bash
npm run test -- components/calculators/native-report-docx.test.ts
```

Expected: PASS.

## Task 3: Migrate Cassoon Load Distribution

**Files:**

- Modify: `components/calculators/cassoon-load-distribution-calculator.test.ts`
- Modify: `components/calculators/cassoon-load-distribution-calculator.tsx`
- Modify: `components/calculator-shell.test.tsx`

- [ ] **Step 1: Write failing cassoon UI and DOCX tests**

Extend `components/calculators/cassoon-load-distribution-calculator.test.ts`:

```ts
import { render, screen } from "@testing-library/react";
import { createElement } from "react";

import { getCassoonLoadDistributionReport } from "@/lib/cassoon-load-distribution";
import {
  CassoonLoadDistributionCalculator,
  buildCassoonLoadDistributionDocxReport,
} from "./cassoon-load-distribution-calculator";

it("maps cassoon report to DOCX", () => {
  const report = getCassoonLoadDistributionReport({
    shortSpanM: 3,
    longSpanM: 6,
    totalLoadKnM2: 10,
    loadUnit: "kn-m2",
  });

  const docxReport = buildCassoonLoadDistributionDocxReport(report, new Date("2026-06-14"));

  expect(docxReport.fileBaseName).toBe("rozpodil-navantazhennia-kesonna-plita-2026-06-14");
  expect(docxReport.steps.map((step) => step.key)).toEqual(report.steps.map((step) => step.key));
  expect(docxReport.steps.find((step) => step.key === "loads")?.formula).toBe(
    report.steps.find((step) => step.key === "loads")?.formula,
  );
  expect(docxReport.figures?.[0]?.svg).toContain("<svg");
});

it("renders cassoon with the shared native report layout", () => {
  render(createElement(CassoonLoadDistributionCalculator));

  expect(screen.getByLabelText("Калькулятор коефіцієнтів c1 і c2 для розподілу навантаження")).toHaveClass("native-calculator");
  expect(screen.getByRole("heading", { name: "Позначення величин" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Покроковий звіт" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Завантажити DOCX" })).toBeInTheDocument();
  expect(screen.getByLabelText(/qk = c1 \* q/)).toHaveAttribute("title");
});
```

- [ ] **Step 2: Run cassoon tests to verify RED**

Run:

```bash
npm run test -- components/calculators/cassoon-load-distribution-calculator.test.ts
```

Expected: FAIL because `buildCassoonLoadDistributionDocxReport` and shared layout usage do not exist.

- [ ] **Step 3: Implement cassoon migration**

In `components/calculators/cassoon-load-distribution-calculator.tsx`:

- import `NativeCalculatorLayout`, `NativeReport`, `ReportDocxButton`, and DOCX helpers;
- export `buildCassoonLoadDistributionDocxReport(report, date = new Date())`;
- replace the top-level hand-written layout with `NativeCalculatorLayout`;
- replace report markup with `NativeReport`.

The report block should look like:

```tsx
const docxReport = useMemo(
  () => buildCassoonLoadDistributionDocxReport(report),
  [report],
);

<NativeReport
  titleId="cassoon-load-report-title"
  title="Покроковий звіт"
  steps={report.steps}
  renderText={(text) => <FormulaText text={text} />}
  actions={<ReportDocxButton report={docxReport} />}
/>
```

- [ ] **Step 4: Run cassoon tests to verify GREEN**

Run:

```bash
npm run test -- components/calculators/cassoon-load-distribution-calculator.test.ts
```

Expected: PASS.

## Task 4: Migrate Minimum Reinforcement

**Files:**

- Create or modify: `components/calculators/minimum-reinforcement-calculator.test.tsx`
- Modify: `components/calculators/minimum-reinforcement-calculator.tsx`

- [ ] **Step 1: Write failing minimum schema, UI, and DOCX tests**

Create `components/calculators/minimum-reinforcement-calculator.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import type { CalculatorInputField } from "@/lib/calculator-input-schema";
import { getMinimumReinforcementReport } from "@/lib/minimum-reinforcement";
import {
  MINIMUM_REINFORCEMENT_INPUT_SCHEMA,
  MinimumReinforcementCalculator,
  buildMinimumReinforcementDocxReport,
} from "./minimum-reinforcement-calculator";

function findSchemaField(id: string): CalculatorInputField {
  for (const group of MINIMUM_REINFORCEMENT_INPUT_SCHEMA.groups) {
    const field = group.fields.find((item) => item.id === id);
    if (field) return field;
  }
  throw new Error(`Missing schema field ${id}`);
}

describe("MINIMUM_REINFORCEMENT_INPUT_SCHEMA", () => {
  it("defines complete inspector metadata", () => {
    expect(findSchemaField("sectionHeightMm")).toMatchObject({
      kind: "number",
      quantity: "length",
      baseUnit: "mm",
      defaultDisplayUnit: "mm",
      prefix: { text: "h", ariaLabel: "h" },
    });
    expect(findSchemaField("tensileZoneWidthMm")).toMatchObject({
      kind: "number",
      quantity: "length",
      prefix: { text: "b", subscript: "t", ariaLabel: "bt" },
    });
    expect(findSchemaField("reinforcementCentroidDistanceMm")).toMatchObject({
      kind: "number",
      prefix: { text: "a", subscript: "s", ariaLabel: "a_s" },
    });
    expect(findSchemaField("rebarDiameterMm")).toMatchObject({
      kind: "number",
      prefix: { text: "Ø", subscript: "s", ariaLabel: "Øs" },
    });
  });
});

describe("MinimumReinforcementCalculator", () => {
  it("renders with shared native report layout and DOCX", () => {
    render(createElement(MinimumReinforcementCalculator));

    expect(screen.getByLabelText("Калькулятор мінімальної площі армування")).toHaveClass("native-calculator");
    expect(screen.getByRole("textbox", { name: "Висота перерізу" })).toHaveValue("500");
    expect(screen.getByRole("heading", { name: "Позначення величин" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Покроковий звіт" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Завантажити DOCX" })).toBeInTheDocument();
    expect(screen.getByLabelText(/As,min = max/)).toHaveAttribute("title");
  });
});

describe("minimum reinforcement DOCX export", () => {
  it("maps the report to DOCX with a diagram figure", () => {
    const report = getMinimumReinforcementReport({
      structureType: "beam",
      concreteClass: "C30/37",
      rebarClass: "A500C",
      sectionHeightMm: 500,
      tensileZoneWidthMm: 1000,
      reinforcementCentroidDistanceMm: 50,
      rebarDiameterMm: 16,
    });

    const docxReport = buildMinimumReinforcementDocxReport(report, new Date("2026-06-14"));

    expect(docxReport.fileBaseName).toBe("minimalne-armuvannia-2026-06-14");
    expect(docxReport.steps.map((step) => step.key)).toEqual(report.steps.map((step) => step.key));
    expect(docxReport.steps.find((step) => step.key === "as-min")?.formula).toBe(
      report.steps.find((step) => step.key === "as-min")?.formula,
    );
    expect(docxReport.figures?.[0]?.svg).toContain("<svg");
  });
});
```

- [ ] **Step 2: Run minimum tests to verify RED**

Run:

```bash
npm run test -- components/calculators/minimum-reinforcement-calculator.test.tsx
```

Expected: FAIL because schema, shared layout, and DOCX builder are not implemented.

- [ ] **Step 3: Implement minimum migration**

In `components/calculators/minimum-reinforcement-calculator.tsx`:

- export `MINIMUM_REINFORCEMENT_INPUT_SCHEMA`;
- replace individual state fields with `inputValues`;
- use `getDefaultInputSchemaValues`;
- parse values into `getMinimumReinforcementReport`;
- keep rebar handoff summary behavior;
- build the diagram from parsed values;
- render with `NativeCalculatorLayout` and `NativeReport`.

The schema must include:

```ts
export const MINIMUM_REINFORCEMENT_INPUT_SCHEMA: CalculatorInputSchema = {
  groups: [
    {
      id: "minimum-reinforcement-inputs",
      title: "Вихідні дані",
      fields: [
        { id: "structureType", kind: "select", name: "Тип конструкції", defaultValue: "beam", options: [{ value: "beam", label: "Балка" }, { value: "slab", label: "Плита" }] },
        { id: "concreteClass", kind: "select", name: "Клас бетону", defaultValue: "C30/37", options: concreteClassOptions },
        { id: "rebarClass", kind: "select", name: "Клас арматури", defaultValue: "A500C", options: rebarClassOptions },
        { id: "sectionHeightMm", kind: "number", prefix: { text: "h", ariaLabel: "h" }, name: "Висота перерізу", defaultValue: "500", min: 0, step: "1", quantity: "length", baseUnit: "mm", defaultDisplayUnit: "mm" },
        { id: "tensileZoneWidthMm", kind: "number", prefix: { text: "b", subscript: "t", ariaLabel: "bt" }, name: "Ширина розтягнутої зони", defaultValue: "1000", min: 0, step: "1", quantity: "length", baseUnit: "mm", defaultDisplayUnit: "mm" },
        { id: "reinforcementCentroidDistanceMm", kind: "number", prefix: { text: "a", subscript: "s", ariaLabel: "a_s" }, name: "Відстань до центра арматури", defaultValue: "50", min: 0, step: "1", quantity: "length", baseUnit: "mm", defaultDisplayUnit: "mm" },
        { id: "rebarDiameterMm", kind: "number", prefix: { text: "Ø", subscript: "s", ariaLabel: "Øs" }, name: "Діаметр стрижня", defaultValue: "16", min: 0, step: "1", quantity: "length", baseUnit: "mm", defaultDisplayUnit: "mm" },
      ],
    },
  ],
};
```

- [ ] **Step 4: Run minimum tests to verify GREEN**

Run:

```bash
npm run test -- components/calculators/minimum-reinforcement-calculator.test.tsx lib/minimum-reinforcement.test.ts
```

Expected: PASS.

## Task 5: Migrate Foundation Bar Anchorage

**Files:**

- Create or modify: `components/calculators/foundation-bar-anchorage-calculator.test.tsx`
- Modify: `components/calculators/foundation-bar-anchorage-calculator.tsx`

- [ ] **Step 1: Write failing foundation schema, UI, and DOCX tests**

Create `components/calculators/foundation-bar-anchorage-calculator.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";

import type { CalculatorInputField } from "@/lib/calculator-input-schema";
import { getFoundationBarAnchorageReport } from "@/lib/foundation-bar-anchorage";
import {
  FOUNDATION_BAR_ANCHORAGE_INPUT_SCHEMA,
  FoundationBarAnchorageCalculator,
  buildFoundationBarAnchorageDocxReport,
} from "./foundation-bar-anchorage-calculator";

function findSchemaField(id: string): CalculatorInputField {
  for (const group of FOUNDATION_BAR_ANCHORAGE_INPUT_SCHEMA.groups) {
    const field = group.fields.find((item) => item.id === id);
    if (field) return field;
  }
  throw new Error(`Missing schema field ${id}`);
}

describe("FOUNDATION_BAR_ANCHORAGE_INPUT_SCHEMA", () => {
  it("defines grouped inspector metadata and conditional beam/slab fields", () => {
    expect(FOUNDATION_BAR_ANCHORAGE_INPUT_SCHEMA.groups.map((group) => group.id)).toEqual([
      "foundation-anchorage-materials",
      "foundation-anchorage-geometry",
      "foundation-anchorage-loads",
      "foundation-anchorage-reinforcement",
      "foundation-anchorage-bond",
      "foundation-anchorage-cover",
      "foundation-anchorage-transverse",
    ]);
    expect(findSchemaField("barCount")).toMatchObject({
      kind: "number",
      showWhen: { fieldId: "structureType", equals: "beam" },
    });
    expect(findSchemaField("barSpacingForAreaMm")).toMatchObject({
      kind: "number",
      showWhen: { fieldId: "structureType", equals: "slab" },
    });
    expect(findSchemaField("footingLengthMm")).toMatchObject({
      kind: "number",
      quantity: "length",
      prefix: { text: "L", ariaLabel: "L" },
    });
    expect(findSchemaField("axialLoadKn")).toMatchObject({
      kind: "number",
      prefix: { text: "N", ariaLabel: "N" },
    });
  });
});

describe("FoundationBarAnchorageCalculator", () => {
  it("renders with shared native report layout and DOCX", () => {
    render(createElement(FoundationBarAnchorageCalculator));

    expect(screen.getByLabelText("Калькулятор анкерування арматури фундаменту")).toHaveClass("native-calculator");
    expect(screen.getByRole("textbox", { name: "Довжина фундаменту" })).toHaveValue("3000");
    expect(screen.getByRole("heading", { name: "Позначення величин" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Покроковий звіт" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Завантажити DOCX" })).toBeInTheDocument();
    expect(screen.getByLabelText(/lb >= lb,req/)).toHaveAttribute("title");
  });
});

describe("foundation anchorage DOCX export", () => {
  it("maps the report to DOCX with a diagram figure", () => {
    const report = getFoundationBarAnchorageReport({
      structureType: "beam",
      concreteClass: "C30/37",
      rebarClass: "A500C",
      footingLengthMm: 3000,
      footingWidthMm: 2000,
      footingHeightMm: 600,
      pedestalWidthMm: 400,
      availableAnchorageLengthMm: 700,
      axialLoadKn: 1000,
      momentKnM: 100,
      shearKn: 50,
      shearHeightM: 0.5,
      barDiameterMm: 16,
      barCount: 4,
      barSpacingForAreaMm: 150,
      barAngle: "horizontal",
      slipForm: false,
      anchorageShape: "straight",
      coverBottomMm: 50,
      coverSideMm: 60,
      barSpacingMm: 150,
      transverseRebarAreaMm2: 300,
      kScheme: "0.05",
      weldedTransverseRebar: false,
      transversePressureMPa: 0,
    });

    const docxReport = buildFoundationBarAnchorageDocxReport(report, new Date("2026-06-14"));

    expect(docxReport.fileBaseName).toBe("ankeruvannia-armatury-fundamentu-2026-06-14");
    expect(docxReport.steps.map((step) => step.key)).toEqual(report.steps.map((step) => step.key));
    expect(docxReport.steps.find((step) => step.key === "final-check")?.formula).toBe(
      report.steps.find((step) => step.key === "final-check")?.formula,
    );
    expect(docxReport.figures?.[0]?.svg).toContain("<svg");
  });
});
```

- [ ] **Step 2: Run foundation tests to verify RED**

Run:

```bash
npm run test -- components/calculators/foundation-bar-anchorage-calculator.test.tsx
```

Expected: FAIL because schema, shared layout, and DOCX builder are not implemented.

- [ ] **Step 3: Implement foundation migration**

In `components/calculators/foundation-bar-anchorage-calculator.tsx`:

- export `FOUNDATION_BAR_ANCHORAGE_INPUT_SCHEMA`;
- replace individual state fields with `inputValues`;
- keep current defaults exactly;
- use `showWhen` for `barCount` and `barSpacingForAreaMm`;
- preserve derived effective depth and bond height either as local derived values or `derived` schema fields;
- render current `FoundationGeometryDiagram` in the shared diagram slot;
- render report with `NativeReport`;
- add `ReportDocxButton`;
- keep normative references under `NativeNormReferences` or a `native-norms` section.

- [ ] **Step 4: Run foundation tests to verify GREEN**

Run:

```bash
npm run test -- components/calculators/foundation-bar-anchorage-calculator.test.tsx lib/foundation-bar-anchorage.test.ts
```

Expected: PASS.

## Task 6: CalculatorShell Smoke Coverage

**Files:**

- Modify: `components/calculator-shell.test.tsx`

- [ ] **Step 1: Write failing shell smoke test**

Add one parameterized test:

```tsx
it.each([
  ["cassoon-load-distribution", "Калькулятор коефіцієнтів c1 і c2 для розподілу навантаження"],
  ["minimum-reinforcement-area", "Калькулятор мінімальної площі армування"],
  ["foundation-bar-anchorage", "Калькулятор анкерування арматури фундаменту"],
])("renders %s with the shared report calculator shell", (slug, ariaLabel) => {
  const calculator = getCalculatorBySlug(slug);
  if (!calculator) throw new Error(`Expected ${slug} to exist`);

  render(<CalculatorShell selectedCalculator={calculator} />);

  expect(screen.getByLabelText(ariaLabel)).toHaveClass("native-calculator");
  expect(screen.getByRole("heading", { name: "Позначення величин" })).toBeInTheDocument();
  expect(screen.getByRole("heading", { name: "Покроковий звіт" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Завантажити DOCX" })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run shell test to verify RED/GREEN status**

Run:

```bash
npm run test -- components/calculator-shell.test.tsx
```

Expected after prior tasks: PASS. If it fails, fix the specific migrated calculator without changing calculation kernels.

## Task 7: Final Verification

**Files:**

- Modify only files touched in Tasks 1-6 when a verification command identifies a specific failure in those files.
- Do not edit `lib/cassoon-load-distribution.ts`, `lib/minimum-reinforcement.ts`, or `lib/foundation-bar-anchorage.ts` during final verification unless an existing calculation test reveals a regression introduced by the UI migration.

- [ ] **Step 1: Run focused tests**

Run:

```bash
npm run test -- components/calculators/native-calculator-layout.test.tsx components/calculators/native-report-docx.test.ts components/calculators/cassoon-load-distribution-calculator.test.ts components/calculators/minimum-reinforcement-calculator.test.tsx components/calculators/foundation-bar-anchorage-calculator.test.tsx components/calculator-shell.test.tsx
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

Expected: PASS.

- [ ] **Step 5: Inspect git status**

Run:

```bash
git status --short
```

Expected: only files touched by this migration are modified.
