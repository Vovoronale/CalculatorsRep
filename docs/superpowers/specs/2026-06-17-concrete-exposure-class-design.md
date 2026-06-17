# Design Spec: Concrete Exposure Class Calculator

Date: 2026-06-17
Project: `construction-calculators-hub`
Status: Secondary design spec; report contract controls implementation

## Context

The project has a standalone native calculator for determining environmental exposure classes for concrete and reinforced concrete elements:

```text
Клас впливу середовища для бетону
```

The calculator is used before the future concrete cover durability calculator. It determines the full set of exposure classes and returns one governing class from `X0/XC/XD/XS` for the durability cover table.

The report text, UI labels, display rules, formula strings, warnings, errors, and handoff parameters are captured separately in [`2026-06-17-concrete-exposure-class-report-contract.md`](2026-06-17-concrete-exposure-class-report-contract.md). Implementation plans, tests, and code must treat that file as the source of truth after it is confirmed by the user and marked `Agreed source of truth`.

This design spec is intentionally secondary. If this document differs from the report contract, update this document to match the contract before writing an implementation plan.

## Problem

The current calculator uses informal input labels such as generic moisture buckets. This does not match DBN table 4.1, which uses formal row language, including:

```text
дуже сухий повітряно-вологісний режим (RH <= 30 %)
сухий повітряно-вологісний режим (30 % < RH <= 60 %)
помірний повітряно-вологісний режим (60 % < RH <= 75 %)
```

The current draft implementation also misattributes `XF` to table 4.1(a), `XA` to table 4.1(b), and describes `XS1-XS3` as DBN table 4.1 rows. The revised design must be row-driven and explicit about normative sources.

## Goals

- Replace informal environmental-condition fields with formal DBN row selections.
- Produce a Ukrainian step-by-step report through the existing `NativeReport` model.
- Return:
  - `exposure_classes`;
  - `governing_cover_exposure_class`;
  - `dbn_minimum_concrete_classes`;
  - `additional_durability_requirements`;
  - `warnings`;
  - `errors`;
  - `valid`.
- Preserve `XF` and `XA` as visible exposure classes and additional durability requirements.
- Do not pass `XF` or `XA` as the main `exposureClass` into the cover durability calculator.
- Keep `XS1-XS3` as a separate DSTU ENV/EN 206 block because DBN cover tables group `XD/XS`, while the provided DBN table 4.1 does not list `XS` rows.
- Support query-parameter prefill when opened from the future concrete cover durability calculator.
- Support a return link that fills the `exposureClass` select in the future cover durability calculator.
- Keep engineering logic in `lib/concrete-exposure-class.ts`, outside React UI.

## Non-Goals

- Do not calculate concrete composition.
- Do not calculate frost-resistance or water-tightness grades from tables 4.1(a) and 4.1(b) in this pass.
- Do not calculate XA aggressiveness from chemical concentrations.
- Do not implement the concrete cover durability calculator in this spec.
- Do not implement the fire cover calculator in this spec.
- Do not create a multi-step wizard in this pass.

## Architecture

Expected files:

```text
docs/superpowers/specs/2026-06-17-concrete-exposure-class-report-contract.md
docs/superpowers/specs/2026-06-17-concrete-exposure-class-design.md
lib/concrete-exposure-class.ts
lib/concrete-exposure-class.test.ts
components/calculators/concrete-exposure-class-calculator.tsx
components/calculators/concrete-exposure-class-calculator.test.tsx
components/calculator-shell.test.tsx
lib/calculators.test.ts
data/content.json
```

The calculation module remains the authority for:

- typed input unions;
- DBN table 4.1 row data;
- report step construction;
- warning/error construction;
- governing cover class selection;
- return URL generation.

The React component remains a thin adapter:

- renders `InputSchemaForm`;
- converts schema values into calculation input;
- renders summary, warnings, `NativeReport`, DOCX action, and normative references;
- contains no engineering selection logic.

## Input UI

Use the shared `InputSchemaForm` with these groups:

```text
Елемент
X0/XC
Хлориди
Мороз і хімічна агресія
```

Fields:

```text
Назва елемента
Тип елемента
Армування або металеві закладні
Клас X0/XC за таблицею 4.1 ДБН
Хлориди не з морської води XD за таблицею 4.1 ДБН
Хлориди морського походження XS за ДСТУ ENV/EN 206
Поперемінне заморожування-відтавання XF за таблицею 4.1 ДБН
Хімічні та біологічні дії XA за таблицею 4.1 ДБН
Є підтвердження агресивності середовища за ДСТУ Б В.2.6-145
```

Option labels, exact values, display rules, and report wording are defined only in the report contract.

## Calculation Flow

1. Build the input step from user data and prefilled query data.
2. Determine the selected `X0/XC` row from DBN table 4.1.
3. Determine optional `XD` row from DBN table 4.1.
4. Determine optional `XS` class from DSTU ENV/EN 206.
5. Determine optional `XF` row from DBN table 4.1.
6. Determine optional `XA` row from DBN table 4.1 and confirmation state from DSTU B V.2.6-145.
7. Build the full `exposure_classes` array.
8. Build `dbn_minimum_concrete_classes` from selected DBN table 4.1 rows, excluding `XS`.
9. Select `governing_cover_exposure_class` by rank from `X0/XC/XD/XS`.
10. Build additional durability requirements for `XF` and `XA`.
11. Build the conclusion step and optional return link.

## Governing Class Selection

Use rank-based selection for this calculator:

```text
X0 = 0
XC1 = 1
XC2 = 2
XC3 = 2
XC4 = 3
XD1 = 4
XS1 = 4
XD2 = 5
XS2 = 5
XD3 = 6
XS3 = 6
```

Tie order:

```text
X0, XC1, XC2, XC3, XC4, XD1, XS1, XD2, XS2, XD3, XS3
```

Future improvement: after the concrete cover durability calculator exists, it may choose the governing class by the actual `cmin,dur` table value for the selected reinforcement type and structural class.

## Handoff With Future Calculator

The future concrete cover durability calculator will have:

```text
select "Клас впливу середовища"
button "Визначити клас"
```

The button opens:

```text
/calculator/concrete-exposure-class?returnTo=/calculator/concrete-cover-durability&returnField=exposureClass&returnLabel=Розрахунок захисного шару&elementName=<...>&elementType=<...>&reinforcementPresence=<...>&currentExposureClass=<...>
```

The exposure class calculator pre-fills shared fields:

```text
elementName -> element_name
elementType -> element_type
reinforcementPresence -> reinforcement_presence
currentExposureClass -> current class note
```

When the result is valid, it returns through:

```text
<returnTo>?<returnField>=<governing_cover_exposure_class>&sourceExposureClasses=<exposure_classes>&sourceCalculator=concrete-exposure-class
```

## Validation And Error Handling

Rules:

- Invalid query params are ignored and replaced with defaults.
- Invalid option values return validation errors through the calculation core.
- `exposure_classes` must not contain placeholders such as `none`, `not_defined`, or `XA_unknown`.
- If `xa_exposure_row = unknown_requires_classification`, keep that state in warnings and additional requirements, not in `exposure_classes`.
- If no cover candidate from `X0/XC/XD/XS` exists, set `valid = false`.
- Normative references must be verified before final project use.

## UI Structure

Follow the existing native calculator layout:

- compact summary with full exposure classes and governing class;
- warnings if present;
- input form in the left/control area;
- report in the main area;
- DOCX export action;
- normative references section;
- return/use button near the result.

No diagram is required for this calculator.

## Catalog Copy

Catalog copy should avoid claiming that `XS` is a DBN table 4.1 row.

Suggested standard:

```text
ДБН В.2.6-98:2009, табл. 4.1 / ДСТУ ENV/EN 206 для XS
```

Suggested use cases:

```text
Вибір формальних рядків X0/XC, XD, XF та XA за таблицею 4.1 ДБН
Фіксація XS для морських хлоридів за ДСТУ ENV/EN 206
Передача керівного X0/XC/XD/XS у розрахунок захисного шару
```

## Tests

Required coverage:

- UI schema exposes formal row-driven fields and does not expose the old shared informal `moistureCondition` model.
- X0 label includes `дуже сухий повітряно-вологісний режим (RH <= 30 %)`.
- XC1 label includes `30 % < RH <= 60 %`.
- XC3 label includes `60 % < RH <= 75 %`.
- XD1 label includes `RH > 75 %`.
- XF and XA report captions reference DBN table 4.1.
- Normative references explain that 4.1(a)/4.1(b) are frost/water-tightness tables, not exposure-class mapping tables.
- XS report caption references DSTU ENV/EN 206 and notes that XS is not a DBN table 4.1 row in the provided PDF.
- DBN minimum concrete classes are reported for selected DBN rows and exclude XS.
- Full class order is stable and duplicates are removed.
- `XA_unknown` is not added to `exposure_classes`.
- Governing class rank selection matches the contract.
- Report step order and representative formulas match the contract.
- Query params prefill shared fields.
- Return link uses `returnTo`, `returnField`, and `sourceExposureClasses`.
- Registry and shell still render the native calculator.

## Verification

After implementation:

```bash
npm run test -- lib/concrete-exposure-class.test.ts components/calculators/concrete-exposure-class-calculator.test.tsx lib/calculators.test.ts components/calculator-shell.test.tsx
npm run typecheck
npm run build
```
