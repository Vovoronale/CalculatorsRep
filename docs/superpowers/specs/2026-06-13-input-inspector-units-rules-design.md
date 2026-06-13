# Input Inspector Units And Rules Design

## Purpose

This design extends the shared calculator object inspector with a documented quality standard and a central unit vocabulary. The goal is to make migrated calculator inputs consistent, explainable, and easier to maintain without forcing a full migration of every native calculator at once.

The first iteration applies to the already partially migrated pilot calculators:

- `soil-design-resistance`
- `cassoon-load-distribution`

Other native calculators may keep their current forms until they are migrated deliberately.

## Scope

Included:

- add a separate inspector rules document, expected at `docs/input-inspector-rules.md`;
- add a central physical quantity and unit registry, expected at `lib/calculator-units.ts`;
- extend numeric input schema fields so they can declare a universal `quantity`;
- let `InputSchemaForm` resolve unit choices from the central registry when `quantity` is present;
- migrate `soil-design-resistance` and `cassoon-load-distribution` from local unit arrays to universal `quantity` declarations where practical;
- improve field descriptions for the two pilot calculators;
- keep local tests for the shared form and the two pilot schemas.

Not included:

- a general schema audit framework;
- migration of all native calculators;
- a separate structured `references` field for normative links;
- persistence of selected display units in calculator values, query params, or reports;
- changes to calculation kernels, report formula strings, report step order, normative scans, or result rendering.

## Unit Model

The schema should describe the physical type of a numeric value through a universal `quantity` instead of repeating unit arrays in every calculator.

Example field:

```ts
{
  id: "foundationWidthM",
  kind: "number",
  quantity: "length",
  baseUnit: "m",
  defaultDisplayUnit: "m"
}
```

`lib/calculator-units.ts` exports the `CalculatorInputQuantity` union, the central registry, and a resolver used by `InputSchemaForm`. The registry defines the allowed display units and conversion factors for each quantity.

Force-based engineering units must be named explicitly as `kgf`/`tf` instead of `kg`/`ton` in unit ids. Labels may use local engineering notation such as `кгс/см²` and `тс/м²`. This avoids ambiguity between mass and force.

The initial registry contract is:

| Quantity | Base unit | Display units and `factorToBase` |
|---|---:|---|
| `length` | `m` | `m`: 1; `cm`: 0.01; `mm`: 0.001 |
| `diameter` | `mm` | `mm`: 1; `cm`: 10; `m`: 1000 |
| `area` | `mm2` | `mm2`: 1; `cm2`: 100; `m2`: 1000000 |
| `force` | `kn` | `kn`: 1; `n`: 0.001 |
| `linearLoad` | `kn-m` | `kn-m`: 1; `n-mm`: 1 |
| `surfaceLoad` | `kn-m2` | `kn-m2`: 1; `kpa`: 1; `n-m2`: 0.001; `kgf-m2`: 0.00980665; `tf-m2`: 9.80665 |
| `pressure` | `kpa` | `kpa`: 1; `mpa`: 1000; `kgf-cm2`: 98.0665; `tf-m2`: 9.80665 |
| `unitWeight` | `kn-m3` | `kn-m3`: 1; `n-m3`: 0.001; `kgf-m3`: 0.00980665; `tf-m3`: 9.80665 |
| `angle` | `deg` | `deg`: 1; `rad`: 180 / π |
| `coefficient` | none | no display units; no unit combobox |

`linearLoad` uses mechanically equivalent force-per-length units. `1 Н/мм = 1 кН/м`, therefore `n-mm` has `factorToBase: 1`.

`coefficient` is a semantic quantity for dimensionless numbers. It resolves to no units and must not render a unit combobox.

The rules document must explain how to add a new quantity or unit: choose a stable id, define the base unit, define labels, define exact or explicitly approximated `factorToBase`, add tests for exact conversion behavior, and only add calculator-local unit lists when a real engineering constraint requires a narrower set.

## Unit Resolution

`InputSchemaForm` resolves units in this order:

1. if a field defines `displayUnits`, use that local list;
2. otherwise, if a field defines `quantity`, load units from the central registry;
3. otherwise, render no unit combobox.

This preserves compatibility with existing schemas and allows gradual migration.

A field should not normally define both `quantity` and `displayUnits`. This combination is allowed only for a documented calculator-specific restriction, such as deliberately exposing a subset of a universal quantity. In that case, the local units must use the same base unit and conversion semantics as the quantity registry.

The unit resolver must fail with a clear error in tests/development when:

- `quantity` is unknown;
- `baseUnit` is present and differs from the registry base unit for the quantity;
- `defaultDisplayUnit` is present and is not in the resolved unit list;
- a local `displayUnits` override is combined with `quantity` but does not include the declared `defaultDisplayUnit`.

If a resolved unit list has one unit, the unit combobox remains visible but disabled/read-only. This makes the unit explicit without implying that the user can choose another unit.

Changing a display unit remains presentation-only. Calculator values stay in base units, and `onValuesChange` emits only normalized base calculator values.

## Field Descriptions

The inspector does not get a separate `references` model. Field-level help remains in `description`, and that description is where normative references belong when they are relevant.

For migrated calculator fields, `description` should explain:

- what the user enters or selects;
- the display unit and the base calculation unit when the value is dimensional;
- when the field is shown, if visibility is conditional and technically important;
- whether the value is directly entered by the user or used to select a table/normative coefficient;
- the normative clause, formula, table, note, or source when the field participates in a normative rule;
- for manual modes, that the user accepts the value according to the relevant norm or table.

Descriptions must not merely repeat `name`.

## Field Naming And Notation

Each migrated field has a short readable `name`. Boolean field names should be phrased as questions, for example `Є підвал?`.

Fields that appear in diagrams, report formulas, or report explanations as input variables should have `prefix`. The prefix is the user-facing formula notation, not the internal field id.

For the pilot calculators:

- `cassoon-load-distribution` should expose prefixes for `lk`, `ld`, and `q`;
- `soil-design-resistance` should expose prefixes for key input values such as `γc1`, `γc2`, `L`, `H`, `IL`, `φ11`, `γ11`, `γ′11`, `c11`, `b`, `d`, `d1`, and basement-related inputs used in report formulas.

## Pilot Updates

### Cassoon Load Distribution

The inspector should use `quantity: "length"` for spans and `quantity: "surfaceLoad"` for the full slab load. Field descriptions should explain span normalization (`lk <= ld`), the meaning of the full uniformly distributed load, the base units, and the normative/source context for the coefficient calculation.

The diagram and report may continue to display base units in this iteration because selected display units are not persisted outside the form.

### Soil Design Resistance

The inspector should use central quantities for length, angle, unit weight, pressure, and dimensionless coefficients. Existing automatic/manual mode visibility stays unchanged.

Descriptions should be filled for the important fields used by DBN formulas and tables, including manual `γc1`/`γc2`, `L/H`, soil type, `IL`, strength characteristics, foundation geometry, basement inputs, and strength source.

Manual mode descriptions should state that the user accepts values manually according to the relevant DBN table or rule.

## Tests

This iteration keeps minimum tests local rather than introducing a reusable audit framework.

Required tests:

- unit registry tests verify that the initial quantities exist and contain the exact base units, unit ids, and conversion factors listed in this spec;
- unit resolver tests verify clear failures for unknown quantities, mismatched `baseUnit`, invalid `defaultDisplayUnit`, and incompatible local overrides;
- `InputSchemaForm` tests verify that `quantity` resolves units from the registry, converts values through the resolved unit, and renders a disabled/read-only combobox for a single available unit;
- `cassoon-load-distribution` local tests verify that `lk`, `ld`, and `q` have `prefix`, `description`, and `quantity`;
- `soil-design-resistance` local tests verify that key fields have `prefix`, `description`, and `quantity`, and that `hasBasement` is named as a question;
- existing calculation and report tests remain authoritative for formulas, report captions, warnings, errors, and normative report behavior.

## Compatibility

The shared form and schemas remain backward-compatible with existing `displayUnits`. Calculators not yet migrated do not need to change.

Calculator kernels continue to receive base values and remain responsible for engineering validation. Inspector validation remains early UI guidance only.

## Future Work

After several calculators have migrated, a later design may introduce reusable schema audit helpers. That future audit can enforce the rules centrally once enough patterns are stable.
