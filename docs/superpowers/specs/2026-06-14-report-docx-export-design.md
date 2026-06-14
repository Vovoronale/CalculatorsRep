# Report DOCX Export Design

Date: 2026-06-14
Status: Approved design, pending written spec review

## Goal

Add a universal browser-side DOCX export system for native calculator reports.

The first connected calculator is `soil-design-resistance`, but the DOCX generation layer must be reusable by other native calculators that expose a structured step-by-step report.

The exported DOCX must contain the same report content that the site shows in the `Покроковий звіт` block:

- report heading
- optional figures that support the report context
- report steps in the same order
- step captions
- step items
- step notes
- step formulas

The DOCX should use a Word-native report layout. It does not need to be a pixel-perfect copy of the website UI.

## Deployment Constraint

The site is a static Next.js export deployed to Cloudflare Pages.

DOCX generation must run in the user's browser. Do not add API routes, server-side rendering, server workers, or backend document generation for this feature.

## Non-Goals

- Do not generate PDF in this phase.
- Do not include normative scan images from the `Нормативні посилання` section in the first version.
- Do not make a pixel-perfect Word copy of the website CSS.
- Do not duplicate report formula fields such as `formulaLatex`, `formulaDocx`, or calculator-specific DOCX formula strings.
- Do not connect all native calculators in the first implementation. The first rollout connects only `soil-design-resistance`.

## Selected Approach

Use a universal export model:

```text
calculator report
-> DocxReportDocument
-> DOCX builder
-> Blob
-> browser download
```

Each calculator maps its existing report into the shared `DocxReportDocument` contract. The DOCX builder knows only the shared contract and does not import calculator-specific calculation modules.

This keeps document generation reusable, testable, and independent of React DOM structure.

## Architecture

Add focused modules under `lib/report-docx/`:

```text
lib/report-docx/types.ts
lib/report-docx/math-parser.ts
lib/report-docx/math-docx.ts
lib/report-docx/document.ts
lib/report-docx/browser.ts
```

Add a reusable UI component:

```text
components/calculators/report-docx-button.tsx
```

Connect the pilot in:

```text
components/calculators/soil-design-resistance-calculator.tsx
```

### Module Responsibilities

`types.ts` defines the shared export contract:

```ts
export type DocxReportDocument = {
  title: string;
  fileBaseName: string;
  figures?: DocxReportFigure[];
  steps: DocxReportStep[];
};

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
```

`math-parser.ts` parses controlled plain-text arithmetic formulas into an AST.

`math-docx.ts` converts the formula AST into Word equation components from the `docx` package.

`document.ts` builds the Word document from `DocxReportDocument`.

`browser.ts` owns browser-only operations:

- converting SVG strings to PNG image data
- calling `Packer.toBlob`
- triggering file download

`report-docx-button.tsx` manages user interaction, loading state, and error display.

## Data Flow

For `soil-design-resistance`:

```text
getSoilDesignResistanceReport(input)
-> current report.steps
-> soil DOCX adapter
-> DocxReportDocument
-> ReportDocxButton
-> buildReportDocx()
-> download .docx
```

The adapter must preserve:

- the step order from `report.steps`
- exact `caption` strings
- exact `items` strings
- exact `notes` strings
- exact `formula` and `formulas` strings

The adapter may add the current foundation SVG diagram as an optional figure before the step list.

## Formula Model

The canonical source stays the existing plain-text formula string from each report step.

Do not add duplicate formula representations to calculation modules.

DOCX export parses the canonical plain-text formula and attempts to render it as a true Word equation. If a formula cannot be parsed safely, the exporter inserts the exact plain-text formula as normal text and continues generating the document.

## Arithmetic Parser Scope

The parser should support broad basic arithmetic used by engineering reports:

- integer and decimal numbers
- symbols with subscripts, for example `As,min`, `γc1`, `γ′11`, `db,input`, `φ11`
- operators `+`, `-`, `*`, `/`, `^`
- parentheses `(...)`
- bracket groups `[...]`
- equality chains such as `A = formula = substitution = result unit`
- comparisons `<`, `<=`, `>`, `>=`
- implication `=>`
- multiple formulas split by `; `
- functions `min(...)`, `max(...)`, `sqrt(...)`, `abs(...)`
- trailing units such as `кПа`, `м`, `мм²`, `см²`, `т/м²`, `кг/см²`

The parser is broad for arithmetic, not for arbitrary prose. If a formula includes prose after the mathematical expression, the implementation should separate the math part from the prose when this can be done deterministically. If separation is unsafe, use the plain-text fallback.

## Word Equation Mapping

Use the math primitives from the `docx` package where possible:

- `Math`
- `MathRun`
- `MathText`
- `MathFraction`
- `MathSuperScript`
- `MathSubScript`
- `MathSubSuperScript`

Mapping examples:

```text
As,min -> A with subscript s,min
γc1 -> γ with subscript c1
db,input -> d with subscript b,input
x^2 -> x with superscript 2
a / b -> fraction when the parser identifies a clear arithmetic division
* -> centered multiplication dot or Word math multiplication text
<= -> <= as Word math comparison text
=> -> implication arrow text
```

The document should prefer readable Word equations over visual imitation of KaTeX.

## Figure Handling

For `soil-design-resistance`, include the same SVG foundation diagram that the user sees near the report context.

The browser helper converts SVG to PNG before embedding:

```text
SVG string
-> Blob URL
-> Image
-> canvas
-> PNG ArrayBuffer
-> ImageRun
```

If figure conversion fails, DOCX generation continues without the figure.

The first implementation uses PNG because it is more reliable in Word than SVG embedding.

## DOCX Layout

The Word document should be a clean engineering report:

- title paragraph
- optional figure with caption
- heading `Покроковий звіт`
- numbered list of report steps
- caption text at the start of each step
- bullet list for `items`
- note paragraphs for `notes`
- Word equation paragraphs for parsed formulas
- plain-text formula paragraphs for fallback formulas

The layout should be readable and stable in Word. It does not need to duplicate the website's card borders, colors, spacing, or responsive behavior.

## UX

In the `soil-design-resistance` calculator, add a button near the `Покроковий звіт` heading:

```text
Завантажити DOCX
```

Button states:

- normal: `Завантажити DOCX`
- generating: `Готуємо DOCX...`, disabled
- error: show `Не вдалося сформувати DOCX. Спробуйте ще раз.`

The report can be exported even when the calculation is invalid, because invalid reports still expose stable `errors`, `warnings`, and `steps`.
The DOCX export includes the available `Покроковий звіт` content. Validation messages that are shown outside that report block are not added to the DOCX unless a calculator already represents them inside report steps.

Pilot filename:

```text
rozrakhunkovyi-opir-gruntu-YYYY-MM-DD.docx
```

## Error Handling

Formula parse failure:

- use exact plain-text fallback
- do not block document generation

Figure conversion failure:

- omit the figure
- do not block document generation

Full DOCX generation failure:

- do not download a corrupt file
- show the user-facing error message
- log the technical cause with `console.error`

## Testing

Add focused tests for the parser:

- arithmetic precedence
- symbols and subscripts
- fractions and divisions
- powers
- `min`, `max`, `sqrt`, `abs`
- equality chains
- comparisons and implication
- multiple formulas split by `; `
- fallback for prose-heavy strings

Add DOCX builder tests:

- builds a document from a minimal `DocxReportDocument`
- includes step captions, items, notes, and formulas
- uses fallback text for unsupported formulas without throwing
- accepts figure records without requiring DOM conversion in unit tests

Add `soil-design-resistance` adapter/UI tests:

- adapter preserves report step order
- adapter preserves exact formula strings
- adapter includes the SVG figure record
- calculator UI shows the DOCX button in the report section
- button enters disabled loading state during generation

Final verification before implementation completion:

```bash
npm test
npm run typecheck
npm run build
```

## Rollout

Phase 1:

- implement universal DOCX export modules
- connect only `soil-design-resistance`
- verify generated DOCX manually in Word or another DOCX viewer when possible

Phase 2:

- connect other native calculators through small adapters
- extend the arithmetic parser only when real report formulas require it
- update `docs/calculation-reporting-guide.md` with the DOCX export contract

## Open Decisions

No open product decisions remain for the first implementation.

Implementation details that may be decided during planning:

- exact `docx` style names
- exact equation paragraph spacing
- exact helper names
- whether the shared arithmetic AST should replace the current KaTeX parser later
