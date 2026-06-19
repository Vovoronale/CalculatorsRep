# Площі прибудинкових майданчиків — Design Spec

Date: 2026-06-20
Calculator: `residential-yard-areas`
Status: Approved design pending written-spec review

## Canonical Report Contract

The canonical source for UI labels, descriptions, defaults, display conditions,
symbols, units, formulas, report captions, items, notes, warnings, errors,
normative-reference targets, and catalog metadata is:

[`2026-06-19-residential-yard-areas-report-contract.md`](2026-06-19-residential-yard-areas-report-contract.md)

The report contract has status `Agreed source of truth for report text and
formulas`. This design does not restate its formulas. If implementation requires
different report wording or mathematics, update the contract and obtain approval
before changing tests or code.

## Goal

Add a native calculator that determines the agreed areas of residential-yard
platforms under DBN B.2.2-12:2019 and the area of open guest parking under DBN
V.2.3-15:2007. The calculator evaluates the person-based and apartment-based
rates simultaneously and applies the agreed conservative governing rule from the
report contract.

The result must remain auditable: every adopted area identifies its governing
basis, every conditional normative choice is visible, and the report preserves
the exact 12-step structure.

## Scope

The calculator covers:

- children's play areas;
- adult recreation areas;
- physical-culture areas in full and reduced modes;
- open guest parking;
- temporary bicycle parking;
- above-ground, underground, and vacuum waste collection;
- pet-walking areas outside the residential-yard boundary;
- optional household-purpose areas;
- the subtotal inside the residential-yard boundary;
- the combined territorial planning indicator.

The calculator does not determine the minimum land parcel under table 6.3 and
does not verify actual placement, landscaping, insolation, access roads, fire
requirements, sanitary distances, technical conditions, or local planning
restrictions.

## Architecture

Use the same native-calculator separation already established in the repository.

### Calculation core

Create `lib/residential-yard-areas.ts` with:

- typed normalized input;
- normative constants used by the agreed formulas;
- unit normalization helpers or calls into the existing unit layer;
- pure validation;
- pure calculation of all intermediate and adopted values;
- governing-basis classification;
- construction of the stable 12-step report;
- stable warnings and errors from the report contract.

The core returns one report object containing normalized input, `valid`, errors,
warnings, safely computed values, and report steps. It never depends on React or
browser APIs.

### React UI

Create `components/calculators/residential-yard-areas-calculator.tsx` using the
existing `NativeCalculatorLayout`, input-schema form components, report renderer,
mathematical formula renderer, and DOCX export.

The component owns UI state and conditional-field resets, but contains no
normative arithmetic. Every displayed result comes from the calculation core.

### Registration

Register the calculator through the existing paths:

- `data/content.json` for the new root category and calculator content;
- `lib/calculators.ts` for the category slug union;
- `components/calculator-shell.tsx` for the native calculator component.

Do not duplicate the calculator into another catalog category.

## Data Flow

```text
InputSchemaForm
  -> normalize dimensioned manual inputs to base units
  -> residential-yard calculation core
  -> values + errors + warnings + 12 report steps
  -> result grid + NativeReport
  -> existing DOCX export
```

The core calculates and totals full-precision normalized values. Formatting is a
presentation concern and follows the report contract.

## Input UX

Group the form into four sections:

1. Building data: residents and apartment composition.
2. Physical-culture mode and its two conditional confirmations.
3. Waste-collection method and its conditional manual area.
4. Optional household-purpose areas and their conditional specific values.

Conditional fields are displayed only under the contract conditions. When a
controlling field changes, hidden dependent inputs reset to their defaults so
stale values cannot affect calculation or reappear unexpectedly.

Dimensioned manual inputs use the existing field-level `displayUnits` mechanism.
Define their conversion factors relative to `м²`, `м²/особу`, or
`м²/квартиру` directly on these fields. Do not add `ар` and `га` to the global
structural `area` registry, whose base unit is `мм²`. The core receives the
site-area fields normalized to square metres, and the report shows the original
input plus conversion when required.

## Result UX

The upper result area is a complete result grid, not a three-card summary. It
shows:

- each of the eight platform areas;
- guest-space count together with guest-parking area;
- the subtotal inside the residential-yard boundary;
- the combined territorial planning indicator.

Each applicable card shows the governing basis: residents, apartments, equal
parallel results, manual technical-condition value, or user-disabled optional
area. The pet-walking card is visibly marked as outside the residential-yard
boundary.

Below the grid, render the agreed 12-step report, DOCX action, and normative
references.

## Numeric Presentation

- Store and calculate normalized values at full precision.
- Do not add rounded intermediate display values.
- Display areas with at most two decimal places and no redundant trailing zeroes.
- Keep guest-space count integral and apply ceiling only where specified by the
  report contract.
- Display non-base manual inputs with their base-unit conversion.

## Error Handling

Validation belongs to the calculation core. Invalid input sets `valid = false`
and produces the exact contract errors. Conditional errors apply only while their
fields are active.

An invalid report still preserves:

- normalized input that can be represented safely;
- the stable 12-step order;
- every independently safe calculation;
- warnings and errors;
- finite formula substitutions only.

No UI or report path may emit `NaN`, `Infinity`, or an empty numeric
substitution.

## Normative References

Create local static scan assets for the five fragments listed in the report
contract. Use the provided current DBN B.2.2-12:2019 PDF and the official current
DBN V.2.3-15:2007 copy from the E-construction document card.

Each normative-reference article contains a collapsed `Скан фрагмента ДБН`
element with the agreed stable anchor. Internal links in field descriptions and
report content navigate to the target, open the fragment, and preserve all form
and report state.

## Catalog Presentation

Add the approved root category `Містобудування та благоустрій` with icon
`MapPinned`. Add `Площі прибудинкових майданчиків` with icon `LandPlot`, display
mode `native`, and no extra categories. Use the approved card description and
normative labels from the report contract.

## Testing Strategy

Use TDD for the implementation.

### Core tests

Cover:

- every normative coefficient and the exact 12-step order;
- resident-governed, apartment-governed, and equal-result branches;
- full and reduced physical-culture modes and each missing prerequisite;
- all three waste-collection methods;
- household-purpose areas disabled, enabled, at boundaries, and outside ranges;
- one-room-only, multi-room-only, and mixed guest-parking calculations;
- guest-space ceiling boundaries;
- square-metre, are, and hectare normalization;
- pet-area exclusion from the residential-yard subtotal and inclusion in the
  combined planning indicator;
- stable invalid reports and finite formulas.

The default regression case and expected outputs are the values recorded in the
approved design conversation and must be encoded as one exact test fixture.

### UI tests

Cover:

- every visible input has the canonical practical description and normative
  source;
- conditional visibility and dependency resets;
- unit controls and conversion display;
- the complete upper result grid;
- governing-basis labels;
- normative internal-link behavior;
- calculator-shell smoke rendering;
- DOCX report creation.

### Repository verification

Run:

```bash
npm run test
npm run typecheck
npm run build
```

Use `npm run dev` and the local browser for final visual verification of desktop
and narrow layouts, conditional interactions, report rendering, normative scans,
and state preservation across internal normative links.

## Approved Default Regression Case

The agreed default input is:

```text
100 residents
0 one-room apartments
40 two-or-more-room apartments
full physical-culture norm
above-ground waste collection
household-purpose platforms disabled
```

Its result fixture is:

```text
children: 70 m²
adult recreation: 20 m²
physical culture: 200 m²
guest parking: 6 spaces and 150 m²
bicycle parking: 10 m²
waste collection: 7.2 m²
household-purpose platforms: 0 m²
pet walking: 30 m²
inside-boundary subtotal: 457.2 m²
combined territorial planning indicator: 487.2 m²
```

## Implementation Boundary

Do not introduce a generic urban-planning rate engine in this implementation.
The selected design is a dedicated typed core. A generic engine should be
considered only after a second real calculator demonstrates shared requirements.

Do not refactor unrelated calculator infrastructure. Reuse the existing native
calculator, unit, report, DOCX, content, and catalog patterns.
