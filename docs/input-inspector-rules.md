# Input Inspector Rules

This document defines the quality rules for calculators migrated to the shared `InputSchemaForm` object inspector.

## Scope

These rules apply to migrated native calculators only. Older calculators may keep their current forms until they are migrated deliberately.

## Field Metadata

Each migrated field must have a short readable `name`.

Use `prefix` when the value appears in a diagram, report formula, report text, or normative explanation as an input variable. `prefix` is the user-facing notation, not the TypeScript field id.

Boolean field names should be questions, for example `Є підвал?`.

Use `description` for field-level help when the user needs to know what the value means, where it comes from, or when it is used. Descriptions must not merely repeat `name`.

## Descriptions

A useful `description` explains:

- what the user enters or selects;
- the display unit and the base calculation unit for dimensional values;
- when the field is shown, if visibility is conditional and technically important;
- whether the value is entered directly or used to select a table/normative coefficient;
- the normative clause, formula, table, note, or source when relevant;
- for manual modes, that the user accepts the value manually according to the relevant norm or table.

Do not add a separate `references` field. Normative links and references belong in `description` when they are relevant.

## Units

Dimensional number fields should use `quantity`, `baseUnit`, and `defaultDisplayUnit`.

Prefer central quantities from `lib/calculator-units.ts`:

- `length`
- `diameter`
- `area`
- `force`
- `linearLoad`
- `surfaceLoad`
- `pressure`
- `unitWeight`
- `angle`
- `coefficient`

Use `quantity: "coefficient"` for dimensionless coefficients. It intentionally renders no unit combobox.

Only use local `displayUnits` when a calculator needs a documented subset or exception. If a field defines both `quantity` and `displayUnits`, the local units must use the same base-unit semantics as the central registry.

## Unit Ids

Unit ids are ASCII and hyphenated. Denominator-style ids use the suffix after the hyphen as the denominator:

- `kn-m2` means `kN/m²`
- `kn-m3` means `kN/m³`
- `kgf-cm2` means `kgf/cm²`
- `kgf-m3` means `kgf/m³`
- `tf-m2` means `tf/m²`
- `tf-m3` means `tf/m³`
- `n-mm` means `N/mm`
- `rad` means radians

Use `kgf` and `tf` in ids for force-based engineering units. Do not use `kg` or `ton` ids when the value means kilogram-force or tonne-force.

## Adding A Quantity Or Unit

When adding a new quantity or unit:

1. Add the quantity or unit to `lib/calculator-units.ts`.
2. Choose one base unit for the quantity.
3. Define labels and `factorToBase` values.
4. Use exact conversion factors when exact; otherwise document the engineering approximation.
5. Add or update `lib/calculator-units.test.ts` to verify the exact registry contract.
6. Use the quantity from calculator schemas instead of duplicating local unit arrays.

## Tests

Migrated calculators should have local tests that verify:

- dimensional fields have `quantity`, `baseUnit`, and `defaultDisplayUnit`;
- single-unit quantities render a disabled/read-only unit combobox;
- dimensionless coefficients do not render a unit combobox;
- boolean fields are named as questions;
- diagram/report input variables have matching `prefix` values in the inspector;
- important fields have meaningful descriptions.
