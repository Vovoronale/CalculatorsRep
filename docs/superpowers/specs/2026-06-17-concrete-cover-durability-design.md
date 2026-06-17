# Design Spec: Concrete Cover Durability Calculator

## Status

Approved report contract exists. This design is ready for user review before
implementation planning.

## Goal

Build a native calculator for the minimum and nominal concrete cover for
reinforcement according to ДБН В.2.6-98:2009, section 4.4. The calculator must
follow the same architecture and UX pattern as `soil-design-resistance`, but the
first version is temporarily without a drawing.

The report text, UI labels, display conditions, formulas, warnings, errors, and
handoff parameters are captured in
[`2026-06-17-concrete-cover-durability-report-contract.md`](2026-06-17-concrete-cover-durability-report-contract.md).
Implementation plans, tests, and code must treat that contract as the source of
truth. This design intentionally does not restate formulas as canonical text.

## User Experience

The calculator appears as a native calculator page in the existing catalog. It
uses the shared dense input inspector, the native calculator layout, the shared
step-by-step report, mathematical formula rendering, and DOCX export pattern.

The first screen contains the working input groups and the live result summary:

- element and exposure context;
- bond-cover inputs for `cmin,b`;
- construction class inputs for automatic table 4.5 mode or manual `S`;
- durability adjustment fields;
- nominal cover deviation `Δcdev`;
- result summary with `cmin` and `cnom`.

The `Клас впливу середовища` field uses the existing inspector calculator
action: only the calculator icon is visible, with hint/title/aria-label
`Розрахувати клас впливу`. Clicking it opens `concrete-exposure-class` with
query parameters documented in the report contract. When the exposure calculator
returns, this calculator fills the exposure class and keeps the source class set
for audit text.

## Scope

In scope:

- Ordinary and prestressed reinforcement durability tables.
- `cmin,b` modes from table 4.2, including aggregate-size note.
- Automatic and manual construction class `S`.
- Full durability adjustment inputs.
- `cmin`, `cnom`, validation messages, warnings, normative references, and DOCX
  report export.
- Catalog registration and SEO content for the native calculator.
- Query-param handoff from and to `concrete-exposure-class`.

Out of scope for the first implementation:

- Drawing or section diagram.
- Fire-resistance cover calculation.
- Replacing the standalone `concrete-exposure-class` calculator.
- Server-side document generation.

## Architecture

Add a pure calculation core in `lib/concrete-cover-durability.ts`. It owns:

- typed input and output models;
- table data for ДБН В.2.6-98:2009 tables 4.3, 4.4, and 4.5;
- bond-cover mode calculations;
- construction class derivation;
- validation;
- report step construction from the report contract;
- formatting helpers and URL-safe handoff helpers.

Add unit tests in `lib/concrete-cover-durability.test.ts` for table lookups,
class grouping, construction class changes, validation, warnings, and exact
report strings from the contract.

Add a thin React adapter in
`components/calculators/concrete-cover-durability-calculator.tsx`. It owns:

- `InputSchemaForm` schema and conditional fields;
- query-param prefill and return handling;
- calculator action click behavior for exposure class;
- summary, warning/error rendering, `NativeReport`, DOCX action, and normative
  references;
- a DOCX adapter that maps the same report steps to the shared report-docx
  contract.

Register the calculator in:

- `lib/calculators.ts`;
- `components/calculator-shell.tsx`;
- `data/content.json`;
- relevant catalog, sitemap, and shell tests.

## Data Flow

1. The UI stores inspector values as strings/booleans.
2. The component normalizes values into the core input type.
3. The core validates input and returns a stable report for both valid and
   invalid inputs.
4. When valid, the core computes `cmin,b`, construction class `S`, `cmin,dur`,
   durability-adjusted cover, `cmin`, `cnom`, warnings, and result summary.
5. React renders only the core result; engineering logic does not live in the UI.
6. DOCX export consumes the same report object and no duplicate formula source.

## Handoff

The cover calculator opens the exposure class calculator through the existing
right-side inspector action. The exact query parameters and return behavior are
defined in the report contract.

Returned values are validated before use:

- only known `X0`, `XC`, `XD`, and `XS` cover classes are accepted;
- unknown values are ignored and the current/default exposure class remains;
- `sourceExposureClasses` is kept only as audit text;
- `returnTo` must point to a local calculator route.

## Error Handling

Validation text and invalid-report behavior are defined in the report contract.
The UI shows field-level inspector validation where possible and also shows the
report-level error list. Invalid results must never display `NaN` or `Infinity`
formulas.

## Testing

The implementation plan must include failing tests before code changes:

- core table values for ordinary and prestressed reinforcement;
- exposure class grouping;
- automatic `S` class changes and clamp behavior;
- `cmin,b` modes and aggregate-size increase;
- `cmin`, `cnom`, warning when `cnom > 45 мм`;
- exact report captions, formulas, notes, validation messages, and step order
  from the contract;
- UI smoke test through `CalculatorShell`;
- inspector calculator action for the exposure class field;
- query-param prefill and return behavior;
- DOCX adapter mapping.

Final verification must run:

```bash
npm run test
npm run typecheck
npm run build
```

## Files

Expected implementation files:

```text
docs/superpowers/specs/2026-06-17-concrete-cover-durability-report-contract.md
docs/superpowers/specs/2026-06-17-concrete-cover-durability-design.md
lib/concrete-cover-durability.ts
lib/concrete-cover-durability.test.ts
components/calculators/concrete-cover-durability-calculator.tsx
components/calculators/concrete-cover-durability-calculator.test.tsx
lib/calculators.ts
components/calculator-shell.tsx
components/calculator-shell.test.tsx
data/content.json
app/sitemap.test.ts
app/globals.css
```

## Self-Review

- The report contract is explicitly referenced as the canonical source.
- Formula strings are not duplicated in this design as source-of-truth text.
- The design stays within one native calculator and one existing handoff target.
- Temporary no-drawing scope is explicit.
- Validation, warnings, and handoff behavior are delegated to the contract.
- No implementation plan or code changes are included in this document.
