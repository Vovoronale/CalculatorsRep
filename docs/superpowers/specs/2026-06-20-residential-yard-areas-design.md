# Residential Yard Areas Formal Report Redesign

Date: 2026-06-20
Status: Approved

## Source of Truth

The exact Ukrainian report wording, formulas, conditional content, errors, and
summary rows are defined only in
`docs/superpowers/specs/2026-06-19-residential-yard-areas-report-contract.md`.
This design defines implementation boundaries and must not override that
contract.

## Goal

Produce one formal 12-step calculation report with a single title, one source
data section, an auditable greenery check for the reduced physical-culture norm,
separate totals for areas inside and outside the residential-yard boundary, and
identical UI and DOCX results.

## Calculation Core

Keep `lib/residential-yard-areas.ts` as a pure TypeScript core. Replace the
greenery boolean with the optional numeric `limitedUseGreeneryAreaM2` input and
calculate `minimumLimitedUseGreeneryAreaM2 = 6 * residents`. The input is empty
when reduced mode is first selected; a missing or invalid value gets the exact
contract error before the minimum-area comparison runs.

The core distinguishes the selected physical-culture mode from the effective
mode. The effective mode is reduced only when the separate landscaped zone is
provided and the actual greenery area meets the calculated minimum. If either
condition fails, the effective mode is full, full physical-culture rates are
used in every value and total, and the contract error is emitted. This preserves
auditable input while preventing an invalid reduction.

Remove the combined territorial total from the public value model. The model
retains only `insideBoundaryAreaM2` and the separate `petWalking.adoptedM2`.
All report notation uses the explicit parenthesized-index format from the
contract, such as `N_(осіб)`, `S_(фіз)`, and `S_(прибуд)`.

## Report Model

The core remains the sole producer of report content and numeric substitutions.
It builds exactly 12 stable steps for valid and invalid input. Source data are
listed only in step 1; later steps may include input values only inside formula
substitutions.

Extend the shared native report step type with an optional structured table:
column labels plus rows of string cells. `NativeReport` renders it as semantic
HTML, and `buildNativeDocxReport` maps the same table into the shared DOCX model.
The DOCX document renderer creates a native Word table. No second summary-data
builder is introduced.

## UI

Keep the full physical-culture norm as the default. In reduced mode, show the
existing separate-zone checkbox and the new numeric greenery-area field. Hidden
greenery input resets when the mode returns to full.

Remove the combined territorial result card. Keep the inside-boundary total and
the separately styled pet-walking result. Use the contract title for the report
section and DOCX document so only one report title is visible.

Update all affected field labels, descriptions, basis labels, errors, result
labels, and report phrases to formal wording. The selected reduced mode may
remain visible after failed validation because the report explicitly records
the full-norm fallback.

## DOCX

The DOCX adapter consumes the same report steps and table used by the UI. Its
title is the contract title. Formulas, errors represented in report steps,
summary values, row order, and location labels therefore match the rendered
report without a parallel transformation.

## Testing

Use TDD for each behavior change. Core tests cover:

- valid reduced mode at and above the greenery threshold;
- reduced mode below the threshold with full-rate fallback and exact error;
- reduced mode without the separate zone with full-rate fallback;
- default full mode and unchanged `Sприбуд = 457,2 м²`;
- valid reduced fixture with `Sприбуд = 277,2 м²` and separate `Sтвар = 30 м²`;
- removal of the combined territorial value;
- exact 12-step order, formulas, summary table, and centralized limitations;
- absence of the forbidden report tokens defined by the contract.

Component tests cover conditional numeric input, reset behavior, one title,
result cards, semantic summary table, fallback error display, and exact values.
DOCX-model and document tests cover title, table structure, identical numeric
cells, and forbidden-token absence.

Final verification runs focused Vitest suites, the complete test suite,
`npm run typecheck`, and `npm run build`.

## Scope

Do not change normative scan assets, unrelated calculators, general catalog
content, or the calculation rates beyond the agreed effective-mode selection.
Shared report and DOCX infrastructure changes are limited to optional table
support required by step 11.
