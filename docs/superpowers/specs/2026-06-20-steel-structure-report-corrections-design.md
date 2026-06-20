# Steel Structure Report Corrections Design

Date: 2026-06-20
Status: Approved design, pending written-spec review

## Goal

Correct the steel structure category/group report so that its calculations, formulas, and language are suitable for delivery to an engineering user. The canonical report wording is the 2026-06-20 revision in [2026-06-18-steel-structure-category-group-report-contract.md](2026-06-18-steel-structure-category-group-report-contract.md).

## Scope

- Correct the comparison sign in the static-compression check.
- Do not apply the static-compression reduction when tensile stress exists.
- Explain why `σ_dyn = 0` for a static load.
- Extend the shared formula parser to render `α`, absolute values, and the required subscripts correctly.
- Replace program diagnostics with user-facing engineering conclusions.
- Apply mathematical indices, decimal commas, Ukrainian score declension, and verbal definitions of stress symbols.
- Expand the table Г.1 result into an auditable check using group, product type, thickness, service condition, and the applicable cell or note.
- Rename the report to `Розрахунок категорій і групи сталевої конструкції` and remove the duplicate report title.
- Add reusable report-writing rules to `docs/calculation-reporting-guide.md`.

## Excluded

This revision does not add an object/author/date block, compact input table, summary table, or page numbering. It does not replace calculated `R_y = 239,02 МПа` with a rounded or tabular `240 МПа`; that requires a separate normative decision covering every supported steel option.

## Architecture

The calculation core remains responsible for applicability, comparisons, score adjustments, localized report strings, and the table Г.1 audit data. React continues to render the core's report steps without duplicating engineering logic.

The shared plain-text formula parser gains support for `α` at the tokenizer/start-pattern and notation-conversion boundaries. Both KaTeX and DOCX continue to consume the same canonical formula strings.

The report-step shape may gain an explicit normative-basis field only if the implementation can introduce it without duplicating text across web and DOCX. Otherwise, the normative basis is a normal report item with consistent styling in both outputs.

## Data Flow

1. Normalize calculator inputs and display units.
2. Determine whether each A.2 check applies before calculating its adjustment.
3. Calculate values in base units.
4. Select the comparison operator from the calculated result.
5. Format numbers with decimal commas and scores with Ukrainian declension.
6. Build user-facing report steps from factual inputs and normative decisions.
7. Render identical step content in the web report and DOCX export.

## Testing

Use TDD for every behavior change.

- Parser test: the exact step 7 formula renders through KaTeX without fallback/error markup and retains its `aria-label`.
- Core tests: tensile/static, no-tensile/static with both comparison outcomes, and dynamic branches.
- Text tests: no internal profile codes or diagnostic phrases; exact approved wording for steps 6, 9, and 10.
- Localization tests: decimal commas, mathematical identifiers, and representative score forms `1 бал`, `2 бали`, `11 балів`, `21 бал`.
- Table Г.1 tests: allowed and forbidden cases include all row-selection parameters and the cell/note reference.
- Export tests: the revised title appears once and the step 7 formula is emitted as valid DOCX math.
- Final verification: targeted Vitest suites, full tests, `npm run typecheck`, `npm run build`, browser inspection, and DOCX inspection.

## Error Handling

Existing validation behavior remains stable. A non-applicable normative reduction produces an explanatory report result, not an error. Invalid steel compatibility remains an error while the calculated report stays visible.
