# Design Spec: Steel Structure Category And Group Calculator

Date: 2026-06-18
Project: `construction-calculators-hub`
Status: Secondary design spec; confirmed report contract controls implementation

## Context

Build a native calculator for determining the purpose category, stress-state
category, initial group, refined group, working-condition coefficient, steel
design resistance, and steel/group compatibility under ДБН В.2.6-198:2014.

The confirmed source of truth is
[`2026-06-18-steel-structure-category-group-report-contract.md`](2026-06-18-steel-structure-category-group-report-contract.md).
It controls all UI labels, 155 atomic table A.1 options, table 5.1 mappings,
defaults, formulas, report captions, notes, warnings, and errors. This design is
secondary; resolve any difference in favor of the contract.

## Goals

- Provide two dependent selectors for the 18 table A.1 sections and 155 atomic elements.
- Determine categories from table A.1 without text matching or heuristic inference.
- Calculate `S1-S5`, `Stot,base`, the initial group, clause A.2 refinements, and `Stot,A2`.
- Determine `Ryn`, `gamma_m`, and `Ry` from the selected strength class and table Г.5 source row.
- Determine `gamma_c` through the explicit 155-entry table 5.1 mapping and guided conditional inputs.
- Validate the selected steel against the refined group under table Г.1.
- Produce the exact 12-step report and DOCX export defined by the contract.
- Add the `Сталеві конструкції` catalog category under `Конструкції`.

## Non-Goals

- Do not classify structures absent from table A.1 by analogy.
- Do not support tube-grade rows from table Г.1.
- Do not select a steel class for the user or optimize material choice.
- Do not calculate section resistance, stability, weld resistance, or actual stresses.
- Do not add a diagram or multi-step wizard.
- Do not alter the confirmed contract wording during implementation.

## Architecture

Use three ownership layers:

```text
lib/steel-structure-category-group-data.ts
  immutable normative catalogs, labels, table matrices, and profile metadata

lib/steel-structure-category-group.ts
  typed input, validation, calculations, table/profile evaluation, report builder

components/calculators/steel-structure-category-group-calculator.tsx
  dynamic inspector schema, dependency resets, display-unit state, rendering
```

The data module is warranted because the confirmed catalog contains 155 atomic
entries plus steel-grade and table 5.1 metadata. It must remain declarative and
contain no React code. The calculation core must never derive profiles by
searching Ukrainian labels.

## Public Types And Interfaces

The data module exports stable unions and catalogs:

```ts
export type SteelStructureSectionId = `a1-section-${number}`;
export type SteelStructureId = `a1-${string}`;
export type PurposeCategory = "А" | "Б" | "В";
export type StressCategory = "I" | "II" | "III";
export type Table51Profile =
  | "default"
  | "p1"
  | "p2"
  | "p3"
  | "p4"
  | "p5"
  | "p6a"
  | "p6b"
  | "p7"
  | "p8"
  | "p9";

export type SteelStructureCatalogEntry = {
  id: SteelStructureId;
  sectionId: SteelStructureSectionId;
  sourcePosition: string;
  sourceText: string;
  label: string;
  purposeCategory: PurposeCategory;
  stressCategory: StressCategory;
  table51Profiles: Table51Profile[];
  mappingQualifier?: string;
  inferredLoadType?: "static" | "dynamic";
};
```

The calculation core exports:

```ts
export type SteelStructureCategoryGroupInput = {
  sectionId: SteelStructureSectionId;
  structureId: SteelStructureId;
  responsibilityClass: "CC1" | "CC2" | "CC3";
  loadType: "static" | "dynamic";
  hasTensileStress: boolean;
  hasAdverseWeldEffect: boolean;
  serviceCondition: "heated" | "unheated" | "open_air";
  productType: "section" | "long" | "sheet" | "universal_plate" | "cold_formed";
  steelClass: SteelStrengthClass;
  steelGradeStandardId: string;
  thicknessMm: number;
  sigmaDynKpa?: number;
  sigmaSumKpa?: number;
  sigmaCKpa?: number;
  hasGuillotineEdges: boolean;
  hasUnaccountedColdWork: boolean;
  hasHighInitialStress: boolean;
  table51: Table51QualifierInput;
  displayUnits: {
    thickness: string;
    sigmaDyn: string;
    sigmaSum: string;
    sigmaC: string;
  };
};

export type SteelStructureCategoryGroupReport = {
  input: SteelStructureCategoryGroupInput;
  valid: boolean;
  errors: string[];
  warnings: string[];
  values: SteelStructureCategoryGroupValues | null;
  steps: SteelStructureCategoryGroupReportStep[];
};
```

Keep `Table51QualifierInput` as a typed object with optional properties matching
the contract field IDs. Validate only qualifiers visible for the selected
entry's profiles.

## Input Inspector And Units

Build the schema dynamically from current values:

- Section options are fixed; structure options are filtered by `sectionId`.
- Steel grade/standard options are filtered by class and product type.
- Table 5.1 groups contain only fields required by the selected entry profiles.
- When a controlling select changes, reset invalid dependent values before calculation.
- Fields inferred by an unambiguous mapping remain visible as derived/read-only values where useful.

Extend `InputSchemaForm` with optional controlled display-unit props:

```ts
displayUnits?: Record<string, string>;
onDisplayUnitsChange?: (displayUnits: Record<string, string>) => void;
```

Without these props, retain the existing internal-state behavior so all current
calculators remain unchanged. With them, the steel calculator can pass selected
units into the report core. Add `thickness` to the central unit registry with
base `mm` and `mm/cm/m` display units.

## Calculation Flow

1. Resolve the selected catalog entry and verify it belongs to the selected section.
2. Add the input report step using only visible conditional data.
3. Read table A.1 categories and source position directly from the entry.
4. Calculate `S1-S5`, `Stot,base`, and initial group.
5. Resolve the selected table Г.5 source, validate product/thickness applicability, choose `gamma_m`, and calculate `Ry`.
6. Evaluate only the entry's explicit table 5.1 profiles, including allowed products from notes 2-3; otherwise use note 5.
7. Determine `alpha` and `S3,A2`, or preserve `S3,base` when tensile stress is absent.
8. Calculate thickness and technology corrections.
9. Check static compression with the calculated `Ry` and `gamma_c`.
10. Sum raw corrections, clamp to `[-4, +4]`, and calculate the refined group.
11. Validate steel compatibility against table Г.1 without changing the group.
12. Build the fixed-order conclusion and summary.

All report strings and formulas come from the confirmed contract. Use explicit
formatters for points, stresses, coefficients, and decimal-comma source text;
never allow `NaN` or `Infinity` into a step.

## Table 5.1 Evaluation

Each profile is a pure evaluator returning:

```ts
type Table51ProfileResult = {
  profile: Table51Profile;
  applicable: boolean;
  value?: number;
  sourceSubrow?: string;
  reasons: string[];
};
```

Evaluate profile conditions exactly as specified in the contract. Build the
final coefficient by:

- using a single applicable value;
- multiplying only combinations expressly allowed by notes 2-3;
- choosing the lowest non-combinable alternative;
- falling back to `1.0` under note 5;
- warning for a position-9 support plate thicker than 80 mm.

Do not encode table 5.1 applicability in UI-only logic. The core revalidates all
qualifiers independently.

## Steel Data And Compatibility

Represent each table Г.5 option as a stable record containing class, label,
standard family, allowed product types, and optional thickness bounds. Resolve
`Ryn` from the class numeric value and `gamma_m` from table 7.2 metadata.

Represent table Г.1 as an exhaustive class-by-group matrix plus explicit
footnote evaluators. Empty cells for `С345К` are not permission. A failed check
adds the contract error and sets `valid = false`, while preserving values and
steps.

## UI Structure

Use `NativeCalculatorLayout` with navigation groups:

```text
Конструкція
Чинники А.2
Сталь
Умови γc
Звіт
Норми
```

The summary shows categories, initial/refined groups, `gamma_c`, `Ry`, and table
Г.1 status. Render `NativeReport`, `ReportDocxButton`, and a normative references
section. No custom diagram is needed.

## Catalog Registration

Add category:

```text
slug: stalevi-konstruktsiyi
parentSlug: konstruktsiyi
title: Сталеві конструкції
icon: Hammer
```

Register calculator:

```text
slug: steel-structure-category-group
nativeCalculator: steel-structure-category-group
title: Категорії та групи сталевих конструкцій
mainCategory: stalevi-konstruktsiyi
extraCategories: [normy-perevirky, dovidkovi-tablytsi]
displayMode: native
standard: ДБН В.2.6-198:2014
```

## Error Handling

- Return stable input/category steps when later material data is invalid.
- Preserve calculated categories/groups for table Г.1 incompatibility.
- Treat an invalid section/structure relationship as an error.
- Treat non-finite or out-of-range numeric values according to the contract.
- Incomplete visible table 5.1 qualifiers make that profile inapplicable and add field validation; they never silently satisfy it.
- Keep the contract warning for position-9 thickness above 80 mm.

## Tests

- Catalog integrity: 18 sections, 155 unique entries, expected per-section counts, explicit profile/fallback, corrected manual options as `Б/II`.
- Table A.2: every score and all four group boundaries.
- Clause A.2: alpha boundaries, no-tension behavior, every positive correction, static reduction, and clamp limits.
- Table 5.1: every profile/subrow, note-2/note-3 products, forbidden combinations, fallback, and thick support-plate warning.
- Steel: every Г.5 option mapping, table 7.2 `gamma_m` families, `Ry`, all Г.1 class/group cells and footnotes.
- Report: exact 12-step order and representative canonical formulas/errors.
- Inspector: dependent lists, conditional fields, precise descriptions, controlled units, and reset behavior.
- Integration: native shell render, summary, DOCX mapping, category/registry metadata.

## Verification

```bash
npm run test
npm run typecheck
npm run build
```

Visually inspect `/calculator/steel-structure-category-group` on desktop and a
mobile viewport, including switching sections, table 5.1 profiles, units, and a
table Г.1 incompatibility.
