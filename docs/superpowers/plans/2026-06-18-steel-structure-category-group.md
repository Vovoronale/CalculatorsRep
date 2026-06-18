# Steel Structure Category And Group Implementation Plan

**Goal:** Build the native `steel-structure-category-group` calculator from the confirmed report contract.

**Architecture:** Store the 155-entry catalog and normative lookup tables in a declarative data module. Keep all engineering validation, table 5.1 profile evaluation, А.1/А.2 calculations, steel resistance, table Г.1 compatibility, and report construction in a framework-independent core. Build a thin dynamic `InputSchemaForm` adapter with controlled display units, then register the new category and calculator through the existing catalog and shell paths.

**Tech Stack:** TypeScript, React 19, Next.js App Router, Vitest, Testing Library, existing native report/DOCX/input-inspector components.

---

## Source Of Truth

- Confirmed contract: `docs/superpowers/specs/2026-06-18-steel-structure-category-group-report-contract.md`
- Secondary design: `docs/superpowers/specs/2026-06-18-steel-structure-category-group-design.md`
- Native report guide: `docs/calculation-reporting-guide.md`
- Input inspector rules: `docs/input-inspector-rules.md`

The contract controls all labels, options, mappings, formulas, captions, notes,
warnings, errors, defaults, and category placement. Do not restate or adjust a
formula in code/tests without updating and reconfirming the contract first.

## File Map

Create:

```text
lib/steel-structure-category-group-data.ts
lib/steel-structure-category-group-data.test.ts
lib/steel-structure-category-group.ts
lib/steel-structure-category-group.test.ts
components/calculators/steel-structure-category-group-calculator.tsx
components/calculators/steel-structure-category-group-calculator.test.tsx
```

Modify:

```text
lib/calculator-units.ts
lib/calculator-units.test.ts
components/calculators/input-schema-form.tsx
components/calculators/input-schema-form.test.tsx
lib/calculators.ts
lib/calculators.test.ts
lib/icons.ts
components/calculator-shell.tsx
components/calculator-shell.test.tsx
data/content.json
app/globals.css (only focused calculator styles if required)
```

## Task 1: Normative Data Catalog

**Files:**
- Create `lib/steel-structure-category-group-data.test.ts`
- Create `lib/steel-structure-category-group-data.ts`

- [ ] Write failing integrity tests before the data module exists.

Assert:

```text
18 unique section IDs
155 unique structure IDs
per-section counts: 19,7,8,10,13,7,10,11,5,11,12,6,7,4,11,8,2,4
every entry belongs to a real section
every entry has source position/text, label, А.1 categories, and non-empty profile list
every profile is default or p1-p9/p6a/p6b
manual hoist/manual crane-beam entries are Б/II
default entry a1-03-03 is А/III and static
20 supported strength classes
every table Г.5 option has a unique stable ID, label, class, standard family, product applicability, and thickness bounds
table Г.1 has one cell for every supported class and group 1-4
```

- [ ] Run the focused test and confirm failure:

```bash
npm test -- lib/steel-structure-category-group-data.test.ts
```

- [ ] Implement the declarative data module.

Export:

```ts
STEEL_STRUCTURE_SECTIONS
STEEL_STRUCTURE_CATALOG
STEEL_STRUCTURE_SECTION_COUNTS
STEEL_GRADE_STANDARD_OPTIONS
TABLE_G1_MATRIX
TABLE_51_PROFILE_METADATA
getSteelStructureEntry(id)
getSteelStructuresForSection(sectionId)
getSteelGradeOptions(steelClass, productType)
```

Copy all 155 labels/categories/mappings and every canonical Г.5 option from the
contract. Do not compute profiles from label text. Encode explicit product and
thickness restrictions so filtering and validation share the same records.

- [ ] Run the data tests green.

## Task 2: Shared Inspector Unit Support

**Files:**
- Modify `lib/calculator-units.ts`
- Modify `lib/calculator-units.test.ts`
- Modify `components/calculators/input-schema-form.tsx`
- Modify `components/calculators/input-schema-form.test.tsx`

- [ ] Add failing registry tests for `thickness`:

```text
quantity: thickness
baseUnit: mm
units: mm factor 1, cm factor 10, m factor 1000
```

- [ ] Add failing component tests for optional controlled unit state:

```tsx
displayUnits={{ thickness: "cm" }}
onDisplayUnitsChange={handler}
```

Verify the field renders the controlled unit, converts display/base values with
the existing helpers, calls the handler on unit changes, and leaves current
uncontrolled behavior unchanged when the props are omitted.

- [ ] Implement `CalculatorInputQuantity | "thickness"` and the registry entry.

- [ ] Extend `InputSchemaFormProps` with optional:

```ts
displayUnits?: Record<string, string>;
onDisplayUnitsChange?: (displayUnits: Record<string, string>) => void;
```

Use an internal unit map only when `displayUnits` is absent. Route unit changes
through the callback in controlled mode. Do not change existing calculator APIs
or default rendering.

- [ ] Run focused shared tests:

```bash
npm test -- lib/calculator-units.test.ts components/calculators/input-schema-form.test.tsx
```

## Task 3: Calculation Core Tests

**Files:**
- Create `lib/steel-structure-category-group.test.ts`
- Create in Task 4: `lib/steel-structure-category-group.ts`

- [ ] Write failing tests organized by normative block.

Catalog/default example:

```text
a1-03-03, СС2, tensile yes, adverse weld no
S1=0, S2=11, S3,base=1, S4=7, S5=2
Stot,base=21, initial group=3
```

Table A.2 and groups:

- all values for `S1-S5`;
- boundaries `18/19/22/23/26/27`;
- `alpha = 0.2` gives III, values immediately above 0.2 and below 0.5 give II, `0.5` gives I;
- no tensile stress preserves `S3,base`;
- thickness corrections at 20/40 mm and above;
- every technology `+1` and their additive sum;
- static compression success/failure;
- raw corrections below `-4` and above `+4` clamp exactly.

Steel:

- `С245 — ДСТУ 8539` gives `Ryn=245`, `gamma_m=1.025`, `Ry≈239.024390 MPa`;
- representative `gamma_m=1.05` and `1.10` records;
- every Г.5 product/thickness boundary;
- every table Г.1 class/group cell;
- footnote `a`, footnote `b`, and note-3 overrides at 5/8/10 mm;
- incompatibility sets `valid=false` without deleting category/group values.

Table 5.1:

- each profile `p1-p9`, including all p7/p9 subrows;
- p4 `lambda=60` boundary;
- p6 static/Ryn/bolt/friction conditions;
- allowed note-2 and note-3 products;
- non-combinable alternatives select the minimum;
- no applicable profile returns `1.0`;
- p9 above 80 mm warns and falls back safely.

Report and validation:

- exact 12-step key order;
- exact representative captions/formulas from the contract;
- conditional manual-hoist note;
- selected display units appear in stress/thickness report items;
- invalid structure/section, non-positive thickness, invalid stresses, and grade mismatch return stable errors with no non-finite formulas.

- [ ] Run the test and confirm failure:

```bash
npm test -- lib/steel-structure-category-group.test.ts
```

## Task 4: Calculation Core Implementation

**Files:**
- Create `lib/steel-structure-category-group.ts`

- [ ] Define input, qualifier, values, step, and report types from the design spec.

- [ ] Implement small pure helpers:

```text
scoreResponsibility
scorePurposeCategory
scoreStressCategory
scoreTensileStress
scoreAdverseWeldEffect
groupForTotal
resolveSteelGrade
resolveGammaM
resolveTableG1Compatibility
evaluateTable51Profile
resolveGammaC
formatReportNumber
convertBaseValueForReport
```

- [ ] Implement table 5.1 evaluators as an explicit switch/object keyed by profile.

Each evaluator receives the selected catalog entry plus normalized input and
returns applicability/value/source reasons. The core must verify that evaluated
profiles appear on the entry; ignore injected qualifier values for unmapped
profiles.

- [ ] Implement validation before formulas.

Return stable steps and avoid divisions when required values are invalid. Keep
categories/groups visible for a later table Г.1 failure, as required by the
contract.

- [ ] Build the exact 12 report steps from the contract.

Use plain-text formula fields only. Let `ReportFormula` safely fall back for
unsupported constructs such as `clamp`; do not add duplicate LaTeX fields.

- [ ] Run core and data tests green:

```bash
npm test -- lib/steel-structure-category-group-data.test.ts lib/steel-structure-category-group.test.ts
```

## Task 5: Dynamic Native Calculator UI

**Files:**
- Create `components/calculators/steel-structure-category-group-calculator.test.tsx`
- Create `components/calculators/steel-structure-category-group-calculator.tsx`
- Modify `app/globals.css` only if needed

- [ ] Write failing UI/schema tests.

Cover:

```text
default section 3 and a1-03-03
section change filters the second selector and resets structureId
explicit A.1 static/dynamic entries update load type
steel class/product changes filter and reset grade/standard
candidate profiles show only their agreed conditional fields
all field descriptions include exact table/clause/figure/note references
dimensioned fields use pressure or thickness quantities with per-field units
controlled unit changes reach the core/report
invalid dependencies show inspector errors rather than stale options
default summary shows А/III, initial group 3, refined group 3, gamma_c=1.0, Ry≈239.02 MPa, and allowed С245
report has 12 steps and DOCX action
```

- [ ] Implement a dynamic schema builder:

```ts
export function buildSteelStructureCategoryGroupInputSchema(
  values: CalculatorInputValues,
): CalculatorInputSchema
```

Keep all engineering decisions in the core/data modules. The schema builder may
select fields/options from profile metadata, but must not calculate `gamma_c`,
scores, groups, `Ry`, or compatibility.

- [ ] Implement controlled dependency normalization in the calculator adapter.

When a parent changes, update the parent and dependent defaults in one state
transition. Preserve unrelated values. Normalize form strings from base units
to the typed numeric core input.

- [ ] Implement layout and export.

Use navigation groups from the design, `NativeCalculatorLayout`, `NativeReport`,
`ReportDocxButton`, and a normative references section. Build DOCX from the same
report steps; no diagram/figure is required. Add only scoped summary/reference
CSS if existing native styles are insufficient.

- [ ] Run UI tests green:

```bash
npm test -- components/calculators/steel-structure-category-group-calculator.test.tsx
```

## Task 6: Category And Calculator Registration

**Files:**
- Modify `lib/calculators.ts`
- Modify `lib/calculators.test.ts`
- Modify `lib/icons.ts`
- Modify `components/calculator-shell.tsx`
- Modify `components/calculator-shell.test.tsx`
- Modify `data/content.json`

- [ ] Add failing registry tests for:

```text
CategorySlug includes stalevi-konstruktsiyi
category parent is konstruktsiyi
category title is Сталеві конструкції
category icon resolves to Hammer
calculator uses nativeCalculator steel-structure-category-group
main category is stalevi-konstruktsiyi
extra categories contain normy-perevirky and dovidkovi-tablytsi
openUrl is /calculator/steel-structure-category-group
```

- [ ] Add a failing `CalculatorShell` smoke test for the calculator report heading.

- [ ] Register the category in `data/content.json` near the other structural child categories and add the `CategorySlug`/icon fallback.

Use category copy:

```text
title: Сталеві конструкції
note: Класифікація, нормативні перевірки та розрахункові параметри сталевих конструкцій.
icon: Hammer
```

- [ ] Add the calculator entry using the confirmed title, slug, categories, native mode, `Новий` label, `Native` tool, and ДБН standard. SEO copy must describe table A.1 categories, А.1/А.2 groups, `gamma_c`, and table Г.1 validation without claiming support for unlisted analogues or tubes.

- [ ] Add the native union case, component import, and shell switch case.

- [ ] Run registration tests green:

```bash
npm test -- lib/calculators.test.ts components/calculator-shell.test.tsx
```

## Task 7: Full Verification

- [ ] Run focused feature tests together:

```bash
npm test -- lib/steel-structure-category-group-data.test.ts lib/steel-structure-category-group.test.ts components/calculators/steel-structure-category-group-calculator.test.tsx lib/calculators.test.ts components/calculator-shell.test.tsx
```

- [ ] Run the full suite:

```bash
npm run test
```

- [ ] Run required project checks:

```bash
npm run typecheck
npm run build
```

- [ ] Start the development server and inspect:

```text
http://localhost:3000/calculator/steel-structure-category-group
```

Verify desktop and mobile:

- both selectors and all 18 sections;
- a direct `default` profile and representative p1/p4/p7/p9 profiles;
- dependent field resets;
- independent unit selectors and report units;
- initial/refined result summary;
- p9 thickness warning;
- table Г.1 incompatibility error with preserved report;
- DOCX action and normative references;
- no overflow from long Ukrainian option labels.

## Task 8: Final Contract Audit

- [ ] Compare implementation constants and tests back to the confirmed contract.

Re-run automated assertions for:

```text
18 sections
155 unique entries
155/155 explicit mapping coverage
12 report steps
manual options Б/II
all required captions/formulas/errors
```

- [ ] Inspect `git status --short` and `git diff --stat`; ensure no unrelated user changes were modified or reverted.

- [ ] Do not commit unless the user explicitly requests a commit.
