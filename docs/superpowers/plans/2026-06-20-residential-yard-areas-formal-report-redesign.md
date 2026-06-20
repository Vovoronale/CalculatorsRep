# Residential Yard Areas Formal Report Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the residential-yard calculator report with the agreed formal 12-step report, numeric greenery verification, separate inside/outside totals, and one shared UI/DOCX summary table.

**Architecture:** Keep all calculations and report strings in the pure `lib/residential-yard-areas.ts` core. Extend the shared report and DOCX models only with optional table data and an optional DOCX step heading, so existing calculators retain their current output. Add explicit-parenthesized-index parsing to both formula renderers before using the new `S_(...)`, `N_(...)`, and `q_(...)` notation.

**Tech Stack:** TypeScript, React 19, Next.js App Router, Vitest, Testing Library, KaTeX, `docx`, JSZip.

## Global Constraints

- Canonical report copy and formulas: `docs/superpowers/specs/2026-06-19-residential-yard-areas-report-contract.md`.
- Approved design: `docs/superpowers/specs/2026-06-20-residential-yard-areas-design.md`.
- Use exact explicit indices such as `N_(осіб)`, `S_(фіз)`, and `S_(прибуд)` in public strings.
- The report and generated DOCX must not contain `користувач`, `калькулятор`, `алгоритм`, `ceil(`, or `Sтер`.
- Preserve the full physical-culture norm as the default.
- Do not modify normative scan assets, calculation rates, catalog registration, or unrelated calculators.
- Work in the current workspace and preserve unrelated dirty files.
- Before any implementation commit run the focused tests for that task; before final completion run `npm run test`, `npm run typecheck`, and `npm run build`.

---

### Task 1: Explicit Parenthesized Formula Indices

**Files:**
- Modify: `lib/report-notation.ts`
- Modify: `lib/report-formula-parser.ts`
- Modify: `lib/report-formula-parser.test.ts`
- Modify: `lib/report-docx/math-parser.ts`
- Modify: `lib/report-docx/math-parser.test.ts`

**Interfaces:**
- Consumes: formula strings containing `X_(index)` where `X` is an engineering symbol and `index` may contain Cyrillic text, commas, digits, or `+`.
- Produces: `reportSymbolToLatex("S_(прибуд)") === "S_{\\text{прибуд}}"` and DOCX symbol nodes with `base: "S"`, `subscript: "прибуд"`.

- [ ] **Step 1: Add failing KaTeX parser tests**

Add tests that assert:

```ts
expect(reportSymbolToLatex("S_(прибуд)")).toBe("S_{\\text{прибуд}}");
expect(reportSymbolToLatex("N_(2+)")).toBe("N_{\\text{2+}}");

const result = parseReportFormula(
  "S_(прибуд) = S_(діт) + S_(фіз) = 70 + 20 = 90 м²",
);
expect(result.ok).toBe(true);
if (!result.ok) throw new Error(result.reason);
expect(result.lines[0].latex).toContain("S_{\\text{прибуд}}");
expect(result.lines[0].latex).toContain("S_{\\text{діт}}");
```

- [ ] **Step 2: Run the KaTeX parser test and verify failure**

Run: `npx vitest run lib/report-formula-parser.test.ts`

Expected: FAIL because `_(...)` is not converted into a subscript.

- [ ] **Step 3: Implement explicit-index conversion for KaTeX**

In `lib/report-notation.ts`, recognize `base_(index)` before generic symbol handling and return:

```ts
const explicit = symbol.match(/^(.+)_\(([^)]+)\)$/u);
if (explicit) {
  const [, base, subscript] = explicit;
  return `${baseToLatex(base)}_{\\text{${subscript}}}`;
}
```

In `lib/report-formula-parser.ts`, protect complete explicit-index symbols with placeholders before the generic symbol pass, using a Unicode-aware pattern that includes Cyrillic index text. Restore the LaTeX values after generic conversion.

- [ ] **Step 4: Run the KaTeX parser test and verify pass**

Run: `npx vitest run lib/report-formula-parser.test.ts`

Expected: PASS.

- [ ] **Step 5: Add failing DOCX parser tests**

Add:

```ts
const result = parseDocxFormula(
  "N_(гост) = N_(2+) = 6; S_(прибуд) = 277,2 м²",
);
expect(result.ok).toBe(true);
if (!result.ok) throw new Error(result.reason);
expect(result.statements[0].expression).toMatchObject({
  type: "chain",
  parts: [
    { type: "symbol", base: "N", subscript: "гост" },
    { type: "symbol", base: "N", subscript: "2+" },
    { type: "number", value: "6" },
  ],
});
```

- [ ] **Step 6: Run the DOCX parser test and verify failure**

Run: `npx vitest run lib/report-docx/math-parser.test.ts`

Expected: FAIL on the `_(...)` token.

- [ ] **Step 7: Tokenize explicit indices as one DOCX symbol**

Before normal identifier scanning in `tokenize`, match a leading symbol followed by `_(` and the next `)`. Push one identifier token with the original value. Update `splitSymbol` to return the explicit base and index:

```ts
const explicit = value.match(/^(.+)_\(([^)]+)\)$/u);
if (explicit) {
  return { base: explicit[1], subscript: explicit[2] };
}
```

- [ ] **Step 8: Run both formula parser suites**

Run: `npx vitest run lib/report-formula-parser.test.ts lib/report-docx/math-parser.test.ts lib/report-docx/math-docx.test.ts`

Expected: PASS.

### Task 2: Numeric Greenery Input and Effective Physical-Culture Mode

**Files:**
- Modify: `lib/residential-yard-areas.ts`
- Modify: `lib/residential-yard-areas.test.ts`

**Interfaces:**
- Replaces: `hasRequiredLimitedUseGreenery: boolean`.
- Produces input: `limitedUseGreeneryAreaM2: number | null`.
- Produces values: `minimumLimitedUseGreeneryAreaM2: number`, `effectivePhysicalCultureMode: "full" | "reduced"`.
- Removes: `territorialNeedAreaM2`.

- [ ] **Step 1: Write failing core tests for valid threshold and fallback**

Cover exactly:

```ts
const validReduced = calculateResidentialYardAreas({
  ...DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT,
  physicalCultureMode: "reduced",
  hasSeparateLandscapedPhysicalCultureZone: true,
  limitedUseGreeneryAreaM2: 600,
});
expect(validReduced.minimumLimitedUseGreeneryAreaM2).toBe(600);
expect(validReduced.effectivePhysicalCultureMode).toBe("reduced");
expect(validReduced.physicalCulture.adoptedM2).toBe(20);
expect(validReduced.insideBoundaryAreaM2).toBe(277.2);

const fallback = calculateResidentialYardAreas({
  ...DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT,
  physicalCultureMode: "reduced",
  hasSeparateLandscapedPhysicalCultureZone: true,
  limitedUseGreeneryAreaM2: 599.99,
});
expect(fallback.effectivePhysicalCultureMode).toBe("full");
expect(fallback.physicalCulture.adoptedM2).toBe(200);
expect(fallback.insideBoundaryAreaM2).toBe(457.2);
expect(fallback).not.toHaveProperty("territorialNeedAreaM2");
```

- [ ] **Step 2: Run the core test and verify failure**

Run: `npx vitest run lib/residential-yard-areas.test.ts`

Expected: FAIL because the numeric input and effective mode do not exist.

- [ ] **Step 3: Implement the minimal calculation model**

Use:

```ts
const minimumLimitedUseGreeneryAreaM2 = multiply(6, input.residents);
const canUseReducedMode =
  input.physicalCultureMode === "reduced" &&
  input.hasSeparateLandscapedPhysicalCultureZone &&
  input.limitedUseGreeneryAreaM2 !== null &&
  Number.isFinite(input.limitedUseGreeneryAreaM2) &&
  input.limitedUseGreeneryAreaM2 >= minimumLimitedUseGreeneryAreaM2;
const effectivePhysicalCultureMode = canUseReducedMode ? "reduced" : "full";
```

Use `effectivePhysicalCultureMode` for rates. Delete the territorial sum from the value type and return object.

- [ ] **Step 4: Add exact validation tests**

Test empty/invalid greenery independently from insufficient valid greenery. Assert the contract strings verbatim and assert full-rate fallback in both cases.

- [ ] **Step 5: Implement validation ordering**

Only evaluate the threshold error after a finite nonnegative value exists. Keep the separate-zone error independent. Both errors apply only while reduced mode is selected.

- [ ] **Step 6: Run the core suite**

Run: `npx vitest run lib/residential-yard-areas.test.ts`

Expected: PASS for calculation and validation tests; report-string tests may still fail until Task 3.

### Task 3: Canonical 12-Step Report and Summary Table Data

**Files:**
- Modify: `lib/residential-yard-areas.ts`
- Modify: `lib/residential-yard-areas.test.ts`

**Interfaces:**
- Produces: exactly 12 `ResidentialYardAreasReportStep` objects in contract order.
- Adds optional `table: { columns: string[]; rows: string[][] }` to the report-step shape used by the core.

- [ ] **Step 1: Replace report expectations with contract-driven failing tests**

Assert:

```ts
expect(report.steps.map((step) => step.key)).toEqual([
  "inputs", "children", "adult-recreation", "physical-culture",
  "guest-parking", "bicycle-parking", "waste-collection", "pet-walking",
  "household-purpose", "inside-boundary-total", "summary", "conditions",
]);
expect(report.steps[0].items?.filter((item) => item.startsWith("Кількість мешканців"))).toHaveLength(1);
expect(report.steps.flatMap((step) => step.items ?? []).filter((item) => item.startsWith("Кількість мешканців"))).toHaveLength(1);
expect(JSON.stringify(report.steps)).not.toMatch(/користувач|калькулятор|алгоритм|ceil\(|Sтер/iu);
```

For the valid reduced fixture, assert the three agreed greenery rows, the `277,2 м²` inside total, `30 м²` pet row, exact four table headers, nine rows, and final conditions strings.

- [ ] **Step 2: Run and verify report tests fail**

Run: `npx vitest run lib/residential-yard-areas.test.ts`

Expected: FAIL on old step keys, copy, notation, and missing table.

- [ ] **Step 3: Centralize notation and formal basis labels**

Update `RESIDENTIAL_YARD_AREAS_NOTATION` to explicit public values such as:

```ts
residents: "N_(осіб)",
apartments: "N_(кв)",
children: "S_(діт)",
insideBoundary: "S_(прибуд)",
```

Map bases exactly to `Кількість мешканців`, `Кількість квартир`, `Кількість мешканців і кількість квартир`, `Містобудівні і технічні умови`, and `Проєктом не передбачено`.

- [ ] **Step 4: Rebuild the 12 report steps from the contract**

Use one input step, contract formulas with explicit indices, `⌈...⌉` for guest parking, the formal max-rule sentence only for dual-basis calculations, no per-step limitations, no territorial-total step, one summary table step, and one conditions step.

- [ ] **Step 5: Run the core suite and verify pass**

Run: `npx vitest run lib/residential-yard-areas.test.ts`

Expected: PASS.

### Task 4: Shared Semantic HTML and Native DOCX Tables

**Files:**
- Modify: `components/calculators/native-report.tsx`
- Modify: `components/calculators/native-report.test.tsx`
- Modify: `components/calculators/native-report-docx.ts`
- Modify: `components/calculators/native-report-docx.test.ts`
- Modify: `lib/report-docx/types.ts`
- Modify: `lib/report-docx/document.ts`
- Modify: `lib/report-docx/document.test.ts`
- Modify carefully: `app/globals.css`

**Interfaces:**
- Adds: `NativeReportTable` and `DocxReportTable` with `columns: string[]`, `rows: string[][]`.
- Adds: `DocxReportDocument.includeStepHeading?: boolean`, defaulting to `true`.

- [ ] **Step 1: Add failing semantic table test**

Render a step with four columns and one row. Assert `getByRole("table")`, four `columnheader` cells, and four row cells.

- [ ] **Step 2: Run and verify failure**

Run: `npx vitest run components/calculators/native-report.test.tsx`

Expected: FAIL because table data is unsupported.

- [ ] **Step 3: Implement semantic HTML table rendering**

Render `<table className="native-report__table">`, `<thead>`, `<tbody>`, `<th scope="col">`, and `<td>`. Pass every cell through `renderText` so normative links and indexed notation remain consistent.

- [ ] **Step 4: Add narrowly scoped responsive styles**

Append only `.native-report__table-wrap` and `.native-report__table` rules to the existing report section in `app/globals.css`; use horizontal overflow on small screens and do not touch unrelated current edits.

- [ ] **Step 5: Add failing DOCX adapter/document tests**

Assert the adapter copies table arrays without mutation. Pack a DOCX and inspect `word/document.xml` for `<w:tbl>`, the four headers, and a result row. Assert `includeStepHeading: false` omits `Покроковий звіт`, while the default model still includes it.

- [ ] **Step 6: Run and verify DOCX tests fail**

Run: `npx vitest run components/calculators/native-report-docx.test.ts lib/report-docx/document.test.ts`

Expected: FAIL because table and heading control are unsupported.

- [ ] **Step 7: Implement optional DOCX table and heading control**

Import `Table`, `TableCell`, `TableRow`, and width helpers from `docx`. Convert the shared table model into a header row plus body rows. Change children assembly to:

```ts
...(report.includeStepHeading === false
  ? []
  : [new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("Покроковий звіт")] })]),
```

Keep default behavior unchanged for every existing calculator.

- [ ] **Step 8: Run shared report and DOCX suites**

Run: `npx vitest run components/calculators/native-report.test.tsx components/calculators/native-report-docx.test.ts lib/report-docx/document.test.ts`

Expected: PASS.

### Task 5: Residential-Yard UI, Schema, Result Cards, and DOCX Wiring

**Files:**
- Modify: `components/calculators/residential-yard-areas-calculator.tsx`
- Modify: `components/calculators/residential-yard-areas-calculator.test.tsx`

**Interfaces:**
- Schema field: `limitedUseGreeneryAreaM2`, empty default, unit `м²`, reduced-mode display condition.
- DOCX title: `Розрахунок площ майданчиків у складі прибудинкової території`.
- DOCX option: `includeStepHeading: false`.

- [ ] **Step 1: Write failing schema and component tests**

Assert the numeric greenery field is hidden in full mode, appears empty in reduced mode, resets after returning to full, and has the exact approved description. Assert one report heading with the contract title and no `Покроковий звіт` heading.

Assert the result cards contain `S_(прибуд)` and `S_(твар)`, and do not contain `S_(тер)` or `Загальна територіальна потреба`.

- [ ] **Step 2: Run and verify component failure**

Run: `npx vitest run components/calculators/residential-yard-areas-calculator.test.tsx`

Expected: FAIL on old checkbox, title, symbols, and territorial card.

- [ ] **Step 3: Replace the checkbox with numeric input wiring**

Update `RESIDENTIAL_YARD_AREAS_INPUT_SCHEMA`, `inputFromValues`, `normalizeDependentValues`, initial units, and field-error mapping. Keep the input empty when reduced mode is first selected and reset it when hidden.

- [ ] **Step 4: Update cards and report/DOCX titles**

Use explicit indexed symbols in summary and cards. Delete the territorial-total card. Pass the report table through unchanged and set `includeStepHeading: false` in `buildResidentialYardAreasDocxReport`.

- [ ] **Step 5: Add the valid reduced interaction test**

Enter `100` residents, select reduced mode, enable the separate zone, enter `600` m², and assert `S_(прибуд) = 277,2 м²`, the summary table row, and `S_(твар) = 30 м²` outside the boundary.

- [ ] **Step 6: Add the fallback interaction test**

Enter `599` m² and assert the exact threshold error, exact fallback sentence, and full-norm `S_(прибуд) = 457,2 м²`.

- [ ] **Step 7: Run focused calculator suites**

Run: `npx vitest run lib/residential-yard-areas.test.ts components/calculators/residential-yard-areas-calculator.test.tsx components/calculators/native-report.test.tsx components/calculators/native-report-docx.test.ts lib/report-docx/document.test.ts lib/report-formula-parser.test.ts lib/report-docx/math-parser.test.ts`

Expected: PASS.

### Task 6: Full Regression and Production Verification

**Files:**
- Verify all files changed in Tasks 1–5.

**Interfaces:**
- Produces: a type-safe static Next.js export with identical UI and DOCX report data.

- [ ] **Step 1: Scan generated report fixtures for forbidden text**

Run: `rg -n "погоджене консервативне|підтверджено користувачем|не передбачені користувачем|площу приймає користувач|калькулятор не перевіряє|ceil\\(|Sтер" lib/residential-yard-areas.ts components/calculators/residential-yard-areas-calculator.tsx`

Expected: no matches.

- [ ] **Step 2: Run the complete test suite**

Run: `npm run test`

Expected: PASS.

- [ ] **Step 3: Run TypeScript verification**

Run: `npm run typecheck`

Expected: PASS with exit code 0.

- [ ] **Step 4: Run production build**

Run: `npm run build`

Expected: PASS and static export completes.

- [ ] **Step 5: Review the final diff**

Run: `git diff --check` and `git status --short`.

Expected: no whitespace errors; only scoped implementation files plus pre-existing unrelated user changes are present.
