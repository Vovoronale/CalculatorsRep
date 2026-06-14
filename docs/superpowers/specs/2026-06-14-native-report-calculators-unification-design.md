# Native report calculators unification design

Date: 2026-06-14

## Goal

Migrate the native calculators that have step-by-step calculation reports to the same user-facing pattern as the soil design resistance calculator.

Included calculators:

- `cassoon-load-distribution`
- `minimum-reinforcement-area`
- `foundation-bar-anchorage`

Excluded calculators:

- `rebar-area-bars`
- `rebar-characteristics`
- `concrete-characteristics`

The excluded calculators are table/reference style tools and do not need the full report workflow.

## Reference Pattern

`soil-design-resistance` is the visual and interaction reference.

The target pattern has:

- compact outer calculator frame;
- three-column first screen on desktop: navigation menu, input inspector, diagram;
- sticky left menu with short links to input sections and report sections;
- sticky diagram panel titled `Позначення величин`;
- result summary in the menu area;
- warning and error blocks below the input shell;
- report section titled `Покроковий звіт`;
- formulas rendered through the shared formula renderer;
- normative references section where the calculator has normative context;
- responsive fallback to two columns and then one column.

## Architecture

Add shared UI components for report calculators instead of keeping separate one-off layout and report markup in every calculator.

Planned shared pieces:

- `NativeCalculatorLayout`: outer frame, input shell, menu, controls slot, diagram slot, status blocks.
- `NativeCalculatorMenu`: label, anchor links, optional result summary.
- `NativeReport`: shared rendering of report steps with captions, items, notes, and formulas.
- `NativeNormReferences`: shared wrapper for calculator-specific normative reference content.
- `buildDocxReportFromSteps` helper or per-calculator builders using one shared mapping shape.

Existing calculator-specific calculation modules remain the source of truth:

- `lib/cassoon-load-distribution.ts`
- `lib/minimum-reinforcement.ts`
- `lib/foundation-bar-anchorage.ts`

The UI must not add engineering logic beyond parsing form values and calling the existing report functions.

## Input Inspector

All included calculators should use `InputSchemaForm`.

`cassoon-load-distribution` already has `CASSOON_INPUT_SCHEMA`; keep it and place it into the shared layout.

`minimum-reinforcement-area` needs `MINIMUM_REINFORCEMENT_INPUT_SCHEMA` with:

- structure type;
- concrete class;
- rebar class;
- section height `h`;
- tensile zone width `bt`;
- reinforcement centroid distance `a_s`;
- rebar diameter `Øs`.

`foundation-bar-anchorage` needs `FOUNDATION_BAR_ANCHORAGE_INPUT_SCHEMA` with groups matching the current form structure:

- construction and materials;
- foundation geometry;
- loads at pedestal;
- anchored reinforcement;
- bond conditions;
- anchorage shape and cover;
- transverse reinforcement and pressure.

Conditional behavior from the current UI must be preserved. For example, slab/beam fields must continue to show the correct area input mode and spacing inputs.

## Report Rendering

The canonical formula source remains the plain-text `formula` or `formulas` fields from `report.steps`.

All migrated calculators must render report formulas through `ReportFormula`.

Do not add duplicate `formulaLatex`, `formulaDisplay`, or calculator-local formula renderers for report steps.

The rendered formula element must preserve the exact formula string in `aria-label` and `title`.

Local summary labels and SVG labels may continue to use `MathNotation` or local notation helpers where needed.

## DOCX Export

All included calculators should show `Завантажити DOCX` in the report header.

DOCX export maps existing `report.steps` into `DocxReportDocument`.

Figures may be included where a controlled SVG diagram already exists:

- cassoon load distribution: slab/load distribution diagram;
- minimum reinforcement: reinforced concrete section diagram;
- foundation anchorage: foundation anchorage diagram.

If a formula is unsupported by the DOCX parser, export must fall back to exact plain text without blocking document generation.

## Calculator-Specific Notes

### Cassoon Load Distribution

Keep existing calculation behavior, schema, unit conversion, span normalization, diagram, warnings, and source link.

Move visual structure to the shared native report layout, render formulas through `NativeReport`, and add DOCX export.

### Minimum Reinforcement

Replace hand-written form controls with `InputSchemaForm`.

Keep the current diagram, recommended rebar handoff link, report order, formulas, warnings, and errors.

Render the report through `NativeReport` and add DOCX export.

### Foundation Bar Anchorage

Replace hand-written form controls with `InputSchemaForm`.

Keep current defaults, conditional fields, diagram, normative references, report order, formulas, warnings, and errors.

Render the report through `NativeReport` and add DOCX export.

This is the largest migration and should be implemented after the shared components and the smaller calculator migrations are passing.

## Styling

Introduce generic classes for the shared pattern:

- `native-calculator`
- `native-calculator__input-shell`
- `native-calculator__menu`
- `native-calculator__controls`
- `native-calculator__diagrams`
- `native-diagram`
- `native-report`
- `native-norms`

The existing soil resistance classes may remain for compatibility, but the shared classes should match the same visual density, spacing, borders, typography, sticky behavior, and responsive breakpoints.

Avoid nested cards. Sections should be framed only where the reference calculator already frames controls, diagrams, report, and norms.

## Tests

Use test-first implementation.

Required tests:

- schema metadata tests for minimum reinforcement and foundation anchorage;
- `CalculatorShell` smoke tests for the three migrated calculators showing input menu, diagram title, report title, and DOCX button;
- report formula rendering tests proving exact `aria-label` and `title` are preserved through the migrated report;
- DOCX mapping tests for the three migrated calculators;
- CSS/layout tests for the shared responsive grid classes.

Existing calculation tests should continue to pass unchanged unless a test is updated only to reflect the shared UI renderer.

## Non-Goals

Do not change calculation algorithms.

Do not change agreed plain-text formulas or normative captions unless a separate report contract update is approved.

Do not migrate table/reference calculators in this pass.

Do not replace existing SVGparametric diagrams with raster images.

