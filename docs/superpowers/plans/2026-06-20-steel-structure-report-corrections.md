# Steel Structure Report Corrections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correct the steel-structure category/group calculation report, remove program diagnostics, and produce stable mathematical output in web and DOCX.

**Architecture:** Keep engineering logic and canonical Ukrainian report strings in `lib/steel-structure-category-group.ts`. Extend the shared notation/parser only for the missing Greek alpha symbol. Keep the existing report-step shape: each complete caption includes its applicability explanation and normative reference.

**Tech Stack:** TypeScript, React 19, Next.js App Router, Vitest, Testing Library, KaTeX, docx.

**Canonical source:** `docs/superpowers/specs/2026-06-18-steel-structure-category-group-report-contract.md`

---

## File Structure

- Modify `lib/report-notation.ts`: map Greek `α` to LaTeX.
- Modify `lib/report-formula-parser.ts`: recognize `α` at formula start and inside symbols.
- Modify `lib/report-formula-parser.test.ts`: verify step 7 parsing and decimal commas.
- Modify `components/calculators/report-formula.test.tsx`: verify KaTeX output without fallback/error markup.
- Modify `lib/steel-structure-category-group.ts`: applicability, localization, table audit, and all canonical report strings.
- Modify `lib/steel-structure-category-group.test.ts`: exact report, boundary, and branch tests.
- Modify `components/calculators/steel-structure-category-group-calculator.tsx`: final report/DOCX title.
- Modify `components/calculators/steel-structure-category-group-calculator.test.tsx`: rendered title and forbidden-text assertions.
- Modify `components/calculators/steel-structure-category-group-calculator.test.tsx`: web title and `buildSteelStructureCategoryGroupDocxReport()` title coverage.

### Task 1: Render Alpha And Indexed Steel Symbols

**Files:**
- Modify: `lib/report-notation.ts`
- Modify: `lib/report-formula-parser.ts`
- Test: `lib/report-formula-parser.test.ts`
- Test: `components/calculators/report-formula.test.tsx`

- [x] **Step 1: Write failing parser tests**

Add tests using the exact canonical formula:

```ts
it("renders the steel stress-ratio formula with alpha and absolute values", () => {
  const result = parseReportFormula(
    "α = |σ_dyn| / |σ_sum| = 0 / 100 = 0",
  );

  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.reason);
  expect(result.lines[0].latex).toContain("\\alpha");
  expect(result.lines[0].latex).toContain("\\sigma_{dyn}");
  expect(result.lines[0].latex).toContain("\\sigma_{sum}");
  expect(result.lines[0].latex).toContain("\\frac{|\\sigma_{dyn}|}{|\\sigma_{sum}|}");
});

it("preserves decimal commas in steel formulas", () => {
  const result = parseReportFormula("R_y = 245 / 1,025 = 239,02 МПа");
  expect(result.ok).toBe(true);
  if (!result.ok) throw new Error(result.reason);
  expect(result.lines[0].latex).toContain("1,025");
  expect(result.lines[0].latex).toContain("239,02\\ \\text{МПа}");
});
```

Add a component test that renders the alpha formula and asserts `.katex` exists while `.report-formula--fallback` and `.katex-error` do not.

- [x] **Step 2: Run tests and confirm RED**

Run:

```powershell
npm test -- lib/report-formula-parser.test.ts components/calculators/report-formula.test.tsx
```

Expected: alpha test fails because `α` is absent from the parser start/symbol patterns and notation map.

- [x] **Step 3: Add minimal alpha support**

Add to `GREEK_TO_LATEX`:

```ts
"α": "\\alpha",
```

Add `α` to `baseToLatex`, generic-symbol patterns, `MATH_START_PATTERN`, and `SYMBOL_PATTERN` wherever the existing Greek set currently contains `λσγφ`.

- [x] **Step 4: Run tests and confirm GREEN**

Run the Task 1 command and expect all targeted tests to pass without KaTeX warnings.

- [x] **Step 5: Commit**

```powershell
git add lib/report-notation.ts lib/report-formula-parser.ts lib/report-formula-parser.test.ts components/calculators/report-formula.test.tsx
git commit -m "Fix steel report formula rendering"
```

### Task 2: Localize Values And Fix Compression Applicability

**Files:**
- Modify: `lib/steel-structure-category-group.ts`
- Test: `lib/steel-structure-category-group.test.ts`

- [x] **Step 1: Write failing localization and applicability tests**

Add exact tests for:

```ts
expect(defaultReport.values?.adjustments.compression).toBe(0);
expect(defaultCompressionStep?.formulas).toBeUndefined();
expect(defaultCompressionStep?.resultItems).toEqual([
  "Зменшення показника для статичного стиску не застосовується, оскільки в конструкції наявні розтягувальні напруження. Прийнято ΔS_compression = 0 балів.",
]);
```

Create no-tension static cases at `90_000` and `100_000` kPa and assert the comparison strings contain `≤` and `>` respectively. Assert `-4` only for the passing no-tension case.

Add a score-declension table test:

```ts
expect([1, 2, 11, 21, 22, 111].map(formatScoreForReport)).toEqual([
  "1 бал", "2 бали", "11 балів", "21 бал", "22 бали", "111 балів",
]);
```

- [x] **Step 2: Run core tests and confirm RED**

```powershell
npm test -- lib/steel-structure-category-group.test.ts
```

Expected: default compression is `-4` for 90 MPa despite tension; existing strings use fixed `≤`, decimal dots, and incorrect declension.

- [x] **Step 3: Implement report-format helpers**

Export a focused helper for testability:

```ts
export function formatScoreForReport(value: number): string {
  const absolute = Math.abs(value);
  const lastTwo = absolute % 100;
  const last = absolute % 10;
  const noun = lastTwo >= 11 && lastTwo <= 14
    ? "балів"
    : last === 1
      ? "бал"
      : last >= 2 && last <= 4
        ? "бали"
        : "балів";
  return `${format(value)} ${noun}`;
}
```

Change numeric `format()` to return decimal commas with `replace(".", ",")` after rounding.

- [x] **Step 4: Implement the applicability predicate and dynamic comparison**

Use:

```ts
const compressionApplicable = input.loadType === "static" && !input.hasTensileStress;
const compressionPasses = compressionApplicable &&
  (input.sigmaCKpa ?? Number.POSITIVE_INFINITY) <= sigmaLimitKpa;
const compression = compressionPasses ? -4 : 0;
```

Build step 9 with three branches: tensile stress, dynamic load, and applicable static compression. In the applicable branch choose `≤` only when `compressionPasses`, otherwise `>`.

- [x] **Step 5: Run core tests and confirm GREEN**

Run the Task 2 test command. Expect all compression and localization cases to pass.

- [x] **Step 6: Commit**

```powershell
git add lib/steel-structure-category-group.ts lib/steel-structure-category-group.test.ts
git commit -m "Fix steel compression report logic"
```

### Task 3: Rewrite The Twelve User-Facing Steps

**Files:**
- Modify: `lib/steel-structure-category-group.ts`
- Test: `lib/steel-structure-category-group.test.ts`

- [x] **Step 1: Replace old expectations with canonical exact strings**

Assert all 12 captions equal the contract captions and end in `:`. Add forbidden-text coverage:

```ts
const reportText = JSON.stringify(report.steps);
for (const forbidden of [
  "Режим визначення γc",
  "Кандидатні позиції",
  "за погодженою матрицею",
  "p6a",
  "обмежити(",
  "Вибрана конструкція",
  "Вихідний рядок таблиці",
  "=>",
]) {
  expect(reportText).not.toContain(forbidden);
}
```

Assert the default step 6 text, step 7 definitions and `σ_dyn = 0`, indexed step 8 symbols, exact step 10 prose, and conclusion wording from the contract.

- [x] **Step 2: Run core tests and confirm RED**

Run the core test file. Expected: old diagnostics and program identifiers remain.

- [x] **Step 3: Add gamma-c applicability descriptions**

Add a switch that returns user-facing facts without exposing profile IDs:

```ts
function describeGammaProfile(result: ProfileValue, input: SteelStructureCategoryGroupInput): string {
  switch (result.profile) {
    case "p1": return "балка або стиснутий елемент ферми перекриття; тимчасове навантаження не перевищує вагу перекриття";
    case "p2": return "колона громадської споруди або опорний елемент водонапірної башти";
    case "p3": return "колона одноповерхової виробничої споруди з мостовим краном";
    case "p4": return "стиснутий основний елемент решітки зварної ферми зі складеним тавровим перерізом при перевірці стійкості та λ ≥ 60";
    case "p5": return "затяжка, тяга, відтяжка або підвіска з непослабленим перерізом при перевірці міцності";
    case "p6a": return "суцільна балка або колона при статичному навантаженні; переріз послаблений отворами для болтів; з’єднання не є фрикційним";
    case "p6b": return "стрижнева конструкція покриття або перекриття при статичному навантаженні; переріз послаблений отворами для болтів; з’єднання не є фрикційним";
    case "p7": return "стиснутий елемент просторової решітчастої конструкції з обраним профілем і способом приєднання";
    case "p8": return "елемент плоскої ферми або інший стиснутий елемент з одиночного кутика, прикріпленого однією полицею";
    case "p9": return `опорна плита завтовшки ${format(input.thicknessMm)} мм при статичному навантаженні`;
    default: return "спеціальні умови таблиці 5.1 не встановлені";
  }
}
```

Use the exact default main-beam sentence. For table/manual modes use the contract's accepted-value/responsibility sentences.

- [x] **Step 4: Rewrite all step strings from the canonical contract**

Use underscored canonical symbols (`S_tot,base`, `S_3,A2`, `ΔS_guillotine`, `σ_sum`, `σ_c`, `σ_dyn`) in formulas and report items. Use `formatScoreForReport()` everywhere a score is printed. Keep captions inline with the normative source.

- [x] **Step 5: Run core tests and confirm GREEN**

Run the core test file and expect all exact report assertions to pass.

- [x] **Step 6: Commit**

```powershell
git add lib/steel-structure-category-group.ts lib/steel-structure-category-group.test.ts
git commit -m "Rewrite steel report for engineering users"
```

### Task 4: Add The Table G.1 Audit Path

**Files:**
- Modify: `lib/steel-structure-category-group.ts`
- Test: `lib/steel-structure-category-group.test.ts`

- [x] **Step 1: Write failing table-audit tests**

For default C245/group 3 assert step 11 contains product type `Фасонний`, thickness `10 мм`, service condition `Опалювана споруда`, matrix cell `+`, group 3, and `застосування ... допускається`. Add a forbidden C245/group 4 case and a `+b` conditional case.

- [x] **Step 2: Run core tests and confirm RED**

Expected: current evaluator returns only a boolean and cannot report the selected cell/note.

- [x] **Step 3: Replace the boolean helper with an assessment**

```ts
type SteelCompatibilityAssessment = {
  allowed: boolean;
  cell: string;
  reference: string;
  note: string | null;
};
```

Return explicit assessments for special note 3 cases and for matrix cells `+`, `+a`, `+b`, and `-`. Keep `values.steelAllowed = assessment.allowed` for compatibility.

- [x] **Step 4: Build the audited step 11 text**

Populate the exact input items and result sentence from the contract. Put the matrix cell/group/steel or applicable note reference directly in the caption's final source clause.

- [x] **Step 5: Run core tests and confirm GREEN**

Run the core test file and expect all G.1 branches to pass.

- [x] **Step 6: Commit**

```powershell
git add lib/steel-structure-category-group.ts lib/steel-structure-category-group.test.ts
git commit -m "Explain steel compatibility audit path"
```

### Task 5: Update Web And DOCX Titles

**Files:**
- Modify: `components/calculators/steel-structure-category-group-calculator.tsx`
- Test: `components/calculators/steel-structure-category-group-calculator.test.tsx`

- [x] **Step 1: Write failing title tests**

Expect the rendered heading and generated DOCX report title to equal:

```text
Розрахунок категорій і групи сталевої конструкції
```

Assert no heading named `Покроковий звіт` is rendered by this calculator.

- [x] **Step 2: Run component tests and confirm RED**

```powershell
npm test -- components/calculators/steel-structure-category-group-calculator.test.tsx
```

- [x] **Step 3: Use one title constant**

Add:

```ts
const REPORT_TITLE = "Розрахунок категорій і групи сталевої конструкції";
```

Pass it to both `NativeReport` and `buildNativeDocxReport`. Do not alter the shared DOCX document heading behavior for unrelated calculators.

- [x] **Step 4: Run component tests and confirm GREEN**

Run the Task 5 command and expect all tests to pass.

- [x] **Step 5: Commit**

```powershell
git add components/calculators/steel-structure-category-group-calculator.tsx components/calculators/steel-structure-category-group-calculator.test.tsx
git commit -m "Rename steel calculation report"
```

### Task 6: Full Verification And Visual Inspection

**Files:**
- Verify only unless a test exposes a defect.

- [x] **Step 1: Run targeted suites**

```powershell
npm test -- lib/report-formula-parser.test.ts components/calculators/report-formula.test.tsx lib/steel-structure-category-group.test.ts components/calculators/steel-structure-category-group-calculator.test.tsx
```

Expected: all targeted tests pass with no warnings.

- [x] **Step 2: Run the full required checks**

```powershell
npm test
npm run typecheck
npm run build
```

Expected: all commands exit 0.

- [x] **Step 3: Inspect the browser report**

Run `npm run dev`, open the steel calculator, and verify the default report: one new title, 12 ordered captions with inline sources, no red/fallback KaTeX in step 7, no compression formula when tension exists, and no forbidden diagnostic text.

- [x] **Step 4: Inspect exported DOCX**

Generate DOCX from the default report and verify title, step order, alpha/absolute-value formula, indexed symbols, decimal commas, and comparison branches.

- [x] **Step 5: Record verification evidence**

Update this plan's checkboxes as tasks complete. Do not claim success without the fresh command results from Steps 1–4.
