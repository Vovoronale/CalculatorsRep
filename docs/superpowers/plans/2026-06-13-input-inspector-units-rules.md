# Input Inspector Units And Rules Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a documented inspector quality standard and a central quantity/unit registry, then migrate the existing `soil-design-resistance` and `cassoon-load-distribution` inspector schemas to use it.

**Architecture:** Keep calculator kernels unchanged. Add a focused `lib/calculator-units.ts` registry/resolver, extend the existing `lib/calculator-input-schema.ts` numeric field contract with `quantity`, and let `InputSchemaForm` resolve units before rendering. Pilot calculators only change schema metadata and descriptions.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest, Testing Library.

---

**Spec:** `docs/superpowers/specs/2026-06-13-input-inspector-units-rules-design.md`

**Unit-id convention:** unit ids use hyphenated ASCII tokens. In denominator-style ids, `kn-m2` means `kN/m²`, `kn-m3` means `kN/m³`, `kgf-cm2` means `kgf/cm²`, and `tf-m2` means `tf/m²`. These ids are not multiplication notation.

**Current constraints:**

- Do not change formulas, report captions, report step order, normative scans, or calculation outputs.
- Do not migrate other native calculators.
- Do not add a generic schema audit framework in this iteration.
- Leave unrelated working tree changes alone, especially `.codex-dev-server.log`.

## File Structure

- Create `lib/calculator-units.ts`: owns `CalculatorInputQuantity`, the central unit registry, and `resolveCalculatorInputUnits()`.
- Create `lib/calculator-units.test.ts`: verifies registry contract and resolver failures.
- Modify `lib/calculator-input-schema.ts`: adds optional `quantity` to number fields and imports the quantity type.
- Modify `components/calculators/input-schema-form.tsx`: resolves units through the new helper instead of reading only `field.displayUnits`.
- Modify `components/calculators/input-schema-form.test.tsx`: adds form tests for registry-backed quantity units, single-unit read-only combobox, and `coefficient` no-combobox behavior.
- Modify `components/calculators/cassoon-load-distribution-calculator.tsx`: exports `CASSOON_INPUT_SCHEMA`, replaces local unit arrays with `quantity`, and fills stronger descriptions.
- Modify `components/calculators/soil-design-resistance-calculator.tsx`: exports `SOIL_INPUT_SCHEMA`, replaces local unit arrays with `quantity`, marks dimensionless fields as `coefficient`, and fills stronger descriptions.
- Create `components/calculators/cassoon-load-distribution-calculator.test.ts`: local metadata checks for the cassoon inspector schema.
- Create `components/calculators/soil-design-resistance-calculator.test.ts`: local metadata checks for the soil inspector schema.
- Keep `components/calculator-shell.test.tsx` focused on integration behavior; do not add new schema-audit responsibility there.
- Create `docs/input-inspector-rules.md`: documents rules for future calculators and unit additions.

## Chunk 1: Unit Registry And Rules Document

### Task 1: Add Central Unit Registry

**Files:**
- Create: `lib/calculator-units.ts`
- Create: `lib/calculator-units.test.ts`

- [ ] **Step 1: Write failing registry contract tests**

Create `lib/calculator-units.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import {
  CALCULATOR_UNIT_REGISTRY,
  resolveCalculatorInputUnits,
} from "./calculator-units";

describe("calculator unit registry", () => {
  it("defines the agreed quantity base units and conversion factors", () => {
    expect(CALCULATOR_UNIT_REGISTRY.length.baseUnit).toBe("m");
    expect(CALCULATOR_UNIT_REGISTRY.length.units).toEqual([
      { value: "m", label: "м", factorToBase: 1 },
      { value: "cm", label: "см", factorToBase: 0.01 },
      { value: "mm", label: "мм", factorToBase: 0.001 },
    ]);

    expect(CALCULATOR_UNIT_REGISTRY.diameter.baseUnit).toBe("mm");
    expect(CALCULATOR_UNIT_REGISTRY.diameter.units).toEqual([
      { value: "mm", label: "мм", factorToBase: 1 },
      { value: "cm", label: "см", factorToBase: 10 },
      { value: "m", label: "м", factorToBase: 1000 },
    ]);

    expect(CALCULATOR_UNIT_REGISTRY.area.baseUnit).toBe("mm2");
    expect(CALCULATOR_UNIT_REGISTRY.area.units).toEqual([
      { value: "mm2", label: "мм²", factorToBase: 1 },
      { value: "cm2", label: "см²", factorToBase: 100 },
      { value: "m2", label: "м²", factorToBase: 1000000 },
    ]);

    expect(CALCULATOR_UNIT_REGISTRY.force.baseUnit).toBe("kn");
    expect(CALCULATOR_UNIT_REGISTRY.force.units).toEqual([
      { value: "kn", label: "кН", factorToBase: 1 },
      { value: "n", label: "Н", factorToBase: 0.001 },
    ]);

    expect(CALCULATOR_UNIT_REGISTRY.linearLoad.baseUnit).toBe("kn-m");
    expect(CALCULATOR_UNIT_REGISTRY.linearLoad.units).toEqual([
      { value: "kn-m", label: "кН/м", factorToBase: 1 },
      { value: "n-mm", label: "Н/мм", factorToBase: 1 },
    ]);

    expect(CALCULATOR_UNIT_REGISTRY.surfaceLoad.baseUnit).toBe("kn-m2");
    expect(CALCULATOR_UNIT_REGISTRY.surfaceLoad.units).toEqual([
      { value: "kn-m2", label: "кН/м²", factorToBase: 1 },
      { value: "kpa", label: "кПа", factorToBase: 1 },
      { value: "n-m2", label: "Н/м²", factorToBase: 0.001 },
      { value: "kgf-m2", label: "кгс/м²", factorToBase: 0.00980665 },
      { value: "tf-m2", label: "тс/м²", factorToBase: 9.80665 },
    ]);

    expect(CALCULATOR_UNIT_REGISTRY.pressure.baseUnit).toBe("kpa");
    expect(CALCULATOR_UNIT_REGISTRY.pressure.units).toEqual([
      { value: "kpa", label: "кПа", factorToBase: 1 },
      { value: "mpa", label: "МПа", factorToBase: 1000 },
      { value: "kgf-cm2", label: "кгс/см²", factorToBase: 98.0665 },
      { value: "tf-m2", label: "тс/м²", factorToBase: 9.80665 },
    ]);

    expect(CALCULATOR_UNIT_REGISTRY.unitWeight.baseUnit).toBe("kn-m3");
    expect(CALCULATOR_UNIT_REGISTRY.unitWeight.units).toEqual([
      { value: "kn-m3", label: "кН/м³", factorToBase: 1 },
    ]);

    expect(CALCULATOR_UNIT_REGISTRY.angle.baseUnit).toBe("deg");
    expect(CALCULATOR_UNIT_REGISTRY.angle.units).toEqual([
      { value: "deg", label: "°", factorToBase: 1 },
    ]);

    expect(CALCULATOR_UNIT_REGISTRY.coefficient.baseUnit).toBeUndefined();
    expect(CALCULATOR_UNIT_REGISTRY.coefficient.units).toEqual([]);
  });

  it("resolves units by quantity and validates base/default unit compatibility", () => {
    expect(
      resolveCalculatorInputUnits({
        id: "spanM",
        quantity: "length",
        baseUnit: "m",
        defaultDisplayUnit: "cm",
      }),
    ).toEqual(CALCULATOR_UNIT_REGISTRY.length.units);

    expect(
      resolveCalculatorInputUnits({
        id: "gammaC1",
        quantity: "coefficient",
      }),
    ).toEqual([]);

    expect(() =>
      resolveCalculatorInputUnits({
        id: "badQuantity",
        quantity: "unknown",
      }),
    ).toThrow("Unknown calculator input quantity 'unknown' for field 'badQuantity'.");

    expect(() =>
      resolveCalculatorInputUnits({
        id: "badBase",
        quantity: "length",
        baseUnit: "mm",
      }),
    ).toThrow("Field 'badBase' uses baseUnit 'mm', but quantity 'length' uses baseUnit 'm'.");

    expect(() =>
      resolveCalculatorInputUnits({
        id: "badCoefficientBase",
        quantity: "coefficient",
        baseUnit: "m",
      }),
    ).toThrow("Field 'badCoefficientBase' uses baseUnit 'm', but quantity 'coefficient' does not use a baseUnit.");

    expect(() =>
      resolveCalculatorInputUnits({
        id: "badDefault",
        quantity: "length",
        baseUnit: "m",
        defaultDisplayUnit: "kpa",
      }),
    ).toThrow("Field 'badDefault' uses defaultDisplayUnit 'kpa', which is not available for quantity 'length'.");
  });

  it("allows local overrides only when their defaults are internally consistent", () => {
    const localUnits = [{ value: "m", label: "м", factorToBase: 1 }];

    expect(
      resolveCalculatorInputUnits({
        id: "restrictedLength",
        quantity: "length",
        baseUnit: "m",
        defaultDisplayUnit: "m",
        displayUnits: localUnits,
      }),
    ).toEqual(localUnits);

    expect(() =>
      resolveCalculatorInputUnits({
        id: "badOverride",
        quantity: "length",
        baseUnit: "m",
        defaultDisplayUnit: "cm",
        displayUnits: localUnits,
      }),
    ).toThrow("Field 'badOverride' uses defaultDisplayUnit 'cm', which is not available in its local displayUnits.");

    expect(() =>
      resolveCalculatorInputUnits({
        id: "badOverrideBase",
        quantity: "length",
        baseUnit: "mm",
        defaultDisplayUnit: "m",
        displayUnits: localUnits,
      }),
    ).toThrow("Field 'badOverrideBase' uses baseUnit 'mm', but quantity 'length' uses baseUnit 'm'.");
  });
});
```

- [ ] **Step 2: Run registry tests and verify they fail**

Run:

```bash
npm run test -- lib/calculator-units.test.ts
```

Expected: FAIL because `lib/calculator-units.ts` does not exist.

- [ ] **Step 3: Implement the registry and resolver**

Create `lib/calculator-units.ts`:

```ts
import type { CalculatorInputDisplayUnit } from "./calculator-input-schema";

export type CalculatorInputQuantity =
  | "length"
  | "diameter"
  | "area"
  | "force"
  | "linearLoad"
  | "surfaceLoad"
  | "pressure"
  | "unitWeight"
  | "angle"
  | "coefficient";

export type CalculatorUnitRegistryEntry = {
  baseUnit?: string;
  units: CalculatorInputDisplayUnit[];
};

export const CALCULATOR_UNIT_REGISTRY: Record<
  CalculatorInputQuantity,
  CalculatorUnitRegistryEntry
> = {
  length: {
    baseUnit: "m",
    units: [
      { value: "m", label: "м", factorToBase: 1 },
      { value: "cm", label: "см", factorToBase: 0.01 },
      { value: "mm", label: "мм", factorToBase: 0.001 },
    ],
  },
  diameter: {
    baseUnit: "mm",
    units: [
      { value: "mm", label: "мм", factorToBase: 1 },
      { value: "cm", label: "см", factorToBase: 10 },
      { value: "m", label: "м", factorToBase: 1000 },
    ],
  },
  area: {
    baseUnit: "mm2",
    units: [
      { value: "mm2", label: "мм²", factorToBase: 1 },
      { value: "cm2", label: "см²", factorToBase: 100 },
      { value: "m2", label: "м²", factorToBase: 1000000 },
    ],
  },
  force: {
    baseUnit: "kn",
    units: [
      { value: "kn", label: "кН", factorToBase: 1 },
      { value: "n", label: "Н", factorToBase: 0.001 },
    ],
  },
  linearLoad: {
    baseUnit: "kn-m",
    units: [
      { value: "kn-m", label: "кН/м", factorToBase: 1 },
      { value: "n-mm", label: "Н/мм", factorToBase: 1 },
    ],
  },
  surfaceLoad: {
    baseUnit: "kn-m2",
    units: [
      { value: "kn-m2", label: "кН/м²", factorToBase: 1 },
      { value: "kpa", label: "кПа", factorToBase: 1 },
      { value: "n-m2", label: "Н/м²", factorToBase: 0.001 },
      { value: "kgf-m2", label: "кгс/м²", factorToBase: 0.00980665 },
      { value: "tf-m2", label: "тс/м²", factorToBase: 9.80665 },
    ],
  },
  pressure: {
    baseUnit: "kpa",
    units: [
      { value: "kpa", label: "кПа", factorToBase: 1 },
      { value: "mpa", label: "МПа", factorToBase: 1000 },
      { value: "kgf-cm2", label: "кгс/см²", factorToBase: 98.0665 },
      { value: "tf-m2", label: "тс/м²", factorToBase: 9.80665 },
    ],
  },
  unitWeight: {
    baseUnit: "kn-m3",
    units: [{ value: "kn-m3", label: "кН/м³", factorToBase: 1 }],
  },
  angle: {
    baseUnit: "deg",
    units: [{ value: "deg", label: "°", factorToBase: 1 }],
  },
  coefficient: {
    units: [],
  },
};

export type CalculatorUnitResolutionInput = {
  id: string;
  quantity?: string;
  baseUnit?: string;
  defaultDisplayUnit?: string;
  displayUnits?: CalculatorInputDisplayUnit[];
};

function assertDefaultUnitIsAvailable(
  field: CalculatorUnitResolutionInput,
  units: CalculatorInputDisplayUnit[],
  source: "quantity" | "local displayUnits",
): void {
  if (!field.defaultDisplayUnit) return;
  if (units.some((unit) => unit.value === field.defaultDisplayUnit)) return;

  if (source === "local displayUnits") {
    throw new Error(
      `Field '${field.id}' uses defaultDisplayUnit '${field.defaultDisplayUnit}', which is not available in its local displayUnits.`,
    );
  }

  throw new Error(
    `Field '${field.id}' uses defaultDisplayUnit '${field.defaultDisplayUnit}', which is not available for quantity '${field.quantity}'.`,
  );
}

export function resolveCalculatorInputUnits(
  field: CalculatorUnitResolutionInput,
): CalculatorInputDisplayUnit[] | undefined {
  if (!field.quantity) {
    if (field.displayUnits) {
      assertDefaultUnitIsAvailable(field, field.displayUnits, "local displayUnits");
      return field.displayUnits;
    }
    return undefined;
  }

  const quantity = field.quantity as CalculatorInputQuantity;
  const entry = CALCULATOR_UNIT_REGISTRY[quantity];

  if (!entry) {
    throw new Error(`Unknown calculator input quantity '${field.quantity}' for field '${field.id}'.`);
  }

  if (field.baseUnit && !entry.baseUnit) {
    throw new Error(
      `Field '${field.id}' uses baseUnit '${field.baseUnit}', but quantity '${quantity}' does not use a baseUnit.`,
    );
  }

  if (field.baseUnit && entry.baseUnit && field.baseUnit !== entry.baseUnit) {
    throw new Error(
      `Field '${field.id}' uses baseUnit '${field.baseUnit}', but quantity '${quantity}' uses baseUnit '${entry.baseUnit}'.`,
    );
  }

  if (field.displayUnits) {
    assertDefaultUnitIsAvailable(field, field.displayUnits, "local displayUnits");
    return field.displayUnits;
  }

  assertDefaultUnitIsAvailable(field, entry.units, "quantity");
  return entry.units;
}
```

- [ ] **Step 4: Run registry tests and verify they pass**

Run:

```bash
npm run test -- lib/calculator-units.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit unit registry**

Run:

```bash
npm run typecheck
npm run build
git add lib/calculator-units.ts lib/calculator-units.test.ts
git commit -m "feat: add calculator unit registry"
```

Expected: `typecheck` and `build` PASS before the commit.

### Task 2: Document Inspector Rules

**Files:**
- Create: `docs/input-inspector-rules.md`

- [ ] **Step 1: Create rules document**

Create `docs/input-inspector-rules.md` with this content:

```md
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
- `tf-m2` means `tf/m²`
- `n-mm` means `N/mm`

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
```

- [ ] **Step 2: Commit rules document**

Run:

```bash
npm run typecheck
npm run build
git add docs/input-inspector-rules.md
git commit -m "docs: add input inspector rules"
```

Expected: `typecheck` and `build` PASS before the commit.

## Chunk 2: Schema And Form Quantity Resolution

### Task 3: Extend Schema Model For Quantity

**Files:**
- Modify: `lib/calculator-input-schema.ts`

- [ ] **Step 1: Add type import and field property**

Modify `lib/calculator-input-schema.ts`:

```ts
import type { CalculatorInputQuantity } from "./calculator-units";
```

Add this property to `CalculatorNumberInputField`:

```ts
  quantity?: CalculatorInputQuantity;
```

- [ ] **Step 2: Run typecheck and verify current consumers still compile**

Run:

```bash
npm run typecheck
```

Expected: PASS. Existing schemas that only use `displayUnits` remain valid.

### Task 4: Teach InputSchemaForm To Resolve Quantity Units

**Files:**
- Modify: `components/calculators/input-schema-form.test.tsx`
- Modify: `components/calculators/input-schema-form.tsx`

- [ ] **Step 1: Write failing form tests for quantity resolution and coefficient behavior**

In `components/calculators/input-schema-form.test.tsx`, update the main `spanM` fixture to use `quantity` instead of local `displayUnits`:

```ts
{
  id: "spanM",
  kind: "number",
  prefix: { text: "l", subscript: "k", ariaLabel: "lk" },
  name: "Короткий проліт",
  defaultValue: "3",
  min: 0,
  step: "0.1",
  description: "Короткий проліт у вибраних одиницях.",
  quantity: "length",
  baseUnit: "m",
  defaultDisplayUnit: "m",
}
```

Add this test inside the existing `describe("InputSchemaForm", ...)` block:

```ts
it("resolves display units from field quantity", async () => {
  const user = userEvent.setup();
  const onValuesChange = vi.fn();

  render(
    <StatefulInputSchemaForm
      initialValues={{ ...defaultValues, spanM: "1.25" }}
      onValuesChange={onValuesChange}
    />,
  );

  const unitSelect = screen.getByRole("combobox", { name: "Одиниця Короткий проліт" });
  expect(unitSelect).toHaveValue("m");
  expect(within(unitSelect).getByRole("option", { name: "м" })).toHaveValue("m");
  expect(within(unitSelect).getByRole("option", { name: "см" })).toHaveValue("cm");
  expect(within(unitSelect).getByRole("option", { name: "мм" })).toHaveValue("mm");

  await user.selectOptions(unitSelect, "cm");

  expect(screen.getByRole("textbox", { name: "Короткий проліт" })).toHaveValue("125");
  expect(onValuesChange).not.toHaveBeenCalled();

  await user.clear(screen.getByRole("textbox", { name: "Короткий проліт" }));
  await user.type(screen.getByRole("textbox", { name: "Короткий проліт" }), "126,5");

  expect(onValuesChange).toHaveBeenLastCalledWith({
    ...defaultValues,
    spanM: "1.265",
  });
});
```

Add a single-unit quantity test:

```ts
it("renders a single registry unit as a read-only combobox", () => {
  const singleUnitSchema: CalculatorInputSchema = {
    groups: [
      {
        id: "single-unit",
        title: "Single unit",
        fields: [
          {
            id: "gammaKnM3",
            kind: "number",
            name: "Питома вага",
            defaultValue: "18",
            quantity: "unitWeight",
            baseUnit: "kn-m3",
            defaultDisplayUnit: "kn-m3",
          },
        ],
      },
    ],
  };

  render(
    <InputSchemaForm
      schema={singleUnitSchema}
      values={{ gammaKnM3: "18" }}
      onValuesChange={vi.fn()}
    />,
  );

  const unitSelect = screen.getByRole("combobox", { name: "Одиниця Питома вага" });
  expect(unitSelect).toBeDisabled();
  expect(unitSelect).toHaveAttribute("aria-readonly", "true");
  expect(unitSelect).toHaveValue("kn-m3");
});
```

Add the reviewer-advised coefficient test:

```ts
it("does not render a unit combobox for coefficient quantity", () => {
  const coefficientSchema: CalculatorInputSchema = {
    groups: [
      {
        id: "coefficient",
        title: "Coefficient",
        fields: [
          {
            id: "gammaC1",
            kind: "number",
            name: "Коефіцієнт умов роботи",
            defaultValue: "1",
            quantity: "coefficient",
          },
        ],
      },
    ],
  };

  render(
    <InputSchemaForm
      schema={coefficientSchema}
      values={{ gammaC1: "1" }}
      onValuesChange={vi.fn()}
    />,
  );

  expect(screen.getByRole("textbox", { name: "Коефіцієнт умов роботи" })).toHaveValue("1");
  expect(screen.queryByRole("combobox", { name: "Одиниця Коефіцієнт умов роботи" })).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run form tests and verify they fail**

Run:

```bash
npm run test -- components/calculators/input-schema-form.test.tsx
```

Expected: FAIL because `InputSchemaForm` still reads only `field.displayUnits`.

- [ ] **Step 3: Implement unit resolution in the form**

Modify imports in `components/calculators/input-schema-form.tsx`:

```ts
import { resolveCalculatorInputUnits } from "@/lib/calculator-units";
```

Add a helper:

```ts
function getFieldDisplayUnits(field: CalculatorNumberInputField): CalculatorInputDisplayUnit[] | undefined {
  const units = resolveCalculatorInputUnits(field);
  return units && units.length > 0 ? units : undefined;
}
```

Update `getInitialDisplayUnits()`:

```ts
if (field.kind === "number") {
  const units = getFieldDisplayUnits(field);
  if (units?.length) {
    unitsByField[field.id] = field.defaultDisplayUnit ?? units[0].value;
  }
}
```

Use a variable name that does not collide with the existing `units` object; for example:

```ts
const unitsByField: Record<string, string> = {};
```

Update `getSelectedDisplayUnit()`:

```ts
const units = getFieldDisplayUnits(field);
if (!units?.length) return undefined;
const selectedUnit = displayUnits[field.id] ?? field.defaultDisplayUnit ?? units[0].value;
return units.find((unit) => unit.value === selectedUnit) ?? units[0];
```

Update the number renderer to use resolved units:

```ts
if (field.kind === "number") {
  const resolvedUnits = getFieldDisplayUnits(field);
  const selectedUnit = getSelectedDisplayUnit(field, displayUnits);
  const value = values[field.id] ?? field.defaultValue;
  const displayValue = selectedUnit
    ? convertBaseNumberToDisplay(value, selectedUnit)
    : String(value);

  return (
    <>
      <input
        id={fieldId}
        type="text"
        inputMode="decimal"
        value={displayValue}
        onChange={(event) =>
          setValue(
            field.id,
            selectedUnit
              ? convertDisplayNumberToBase(event.target.value, selectedUnit)
              : event.target.value,
          )
        }
        aria-label={field.name}
      />
      {resolvedUnits?.length ? (
        <select
          className="input-schema-field__unit"
          disabled={resolvedUnits.length === 1}
          aria-readonly={resolvedUnits.length === 1 ? "true" : undefined}
          value={selectedUnit?.value ?? resolvedUnits[0].value}
          onChange={(event) =>
            setDisplayUnits((current) => ({
              ...current,
              [field.id]: event.target.value,
            }))
          }
          aria-label={`Одиниця ${field.name}`}
        >
          {resolvedUnits.map((unit) => (
            <option key={unit.value} value={unit.value}>
              {unit.label}
            </option>
          ))}
        </select>
      ) : null}
    </>
  );
}
```

- [ ] **Step 4: Run form and registry tests**

Run:

```bash
npm run test -- lib/calculator-units.test.ts components/calculators/input-schema-form.test.tsx
npm run typecheck
npm run build
```

Expected: targeted tests, `typecheck`, and `build` PASS.

- [ ] **Step 5: Commit schema/form quantity support**

Run:

```bash
git add lib/calculator-input-schema.ts components/calculators/input-schema-form.tsx components/calculators/input-schema-form.test.tsx
git commit -m "feat: resolve inspector units by quantity"
```

## Chunk 3: Pilot Calculator Metadata Migration

### Task 5: Migrate Cassoon Inspector Metadata

**Files:**
- Modify: `components/calculators/cassoon-load-distribution-calculator.tsx`
- Create: `components/calculators/cassoon-load-distribution-calculator.test.ts`

- [ ] **Step 1: Write failing cassoon schema metadata test**

Create `components/calculators/cassoon-load-distribution-calculator.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import type { CalculatorInputField } from "@/lib/calculator-input-schema";

import { CASSOON_INPUT_SCHEMA } from "./cassoon-load-distribution-calculator";

function findSchemaField(id: string): CalculatorInputField {
  for (const group of CASSOON_INPUT_SCHEMA.groups) {
    const field = group.fields.find((item) => item.id === id);
    if (field) return field;
  }
  throw new Error(`Missing schema field ${id}`);
}

function expectTextDescription(field: CalculatorInputField, pattern: RegExp) {
  expect(field.description).toBeTruthy();
  expect(field.description).toMatch(pattern);
}

describe("CASSOON_INPUT_SCHEMA", () => {
  it("defines complete inspector metadata from the central unit registry", () => {
    const shortSpan = findSchemaField("shortSpanM");
    const longSpan = findSchemaField("longSpanM");
    const totalLoad = findSchemaField("totalLoadKnM2");

    expect(shortSpan).toMatchObject({
      kind: "number",
      quantity: "length",
      baseUnit: "m",
      defaultDisplayUnit: "m",
      prefix: { text: "l", subscript: "k", ariaLabel: "lk" },
    });
    expect(longSpan).toMatchObject({
      kind: "number",
      quantity: "length",
      baseUnit: "m",
      defaultDisplayUnit: "m",
      prefix: { text: "l", subscript: "d", ariaLabel: "ld" },
    });
    expect(totalLoad).toMatchObject({
      kind: "number",
      quantity: "surfaceLoad",
      baseUnit: "kn-m2",
      defaultDisplayUnit: "kn-m2",
      prefix: { text: "q", ariaLabel: "q" },
    });

    for (const field of [shortSpan, longSpan, totalLoad]) {
      expect(field).not.toHaveProperty("displayUnits");
    }

    expectTextDescription(shortSpan, /нормалізує lk <= ld/);
    expectTextDescription(longSpan, /нормалізує lk <= ld/);
    expectTextDescription(totalLoad, /Ліновіч/);
  });
});
```

- [ ] **Step 2: Run the cassoon metadata test and verify it fails**

Run:

```bash
npm run test -- components/calculators/cassoon-load-distribution-calculator.test.ts
```

Expected: FAIL because `CASSOON_INPUT_SCHEMA` is not exported and/or still uses local `displayUnits`.

- [ ] **Step 3: Update cassoon schema**

In `components/calculators/cassoon-load-distribution-calculator.tsx`:

Remove local `LENGTH_DISPLAY_UNITS` and `LOAD_DISPLAY_UNITS` constants if unused after migration.

Export the schema:

```ts
export const CASSOON_INPUT_SCHEMA: CalculatorInputSchema = {
```

Update fields:

```ts
{
  id: "shortSpanM",
  kind: "number",
  prefix: { text: "l", subscript: "k", ariaLabel: "lk" },
  name: "Короткий проліт",
  defaultValue: "3",
  min: 0,
  step: "0.1",
  description:
    "Короткий або перший введений проліт. Інспектор передає значення в базовій одиниці м; розрахунок нормалізує lk <= ld перед визначенням коефіцієнтів за методикою Ліновіча.",
  quantity: "length",
  baseUnit: "m",
  defaultDisplayUnit: "m",
}
```

Replace `longSpanM` with:

```ts
{
  id: "longSpanM",
  kind: "number",
  prefix: { text: "l", subscript: "d", ariaLabel: "ld" },
  name: "Довгий проліт",
  defaultValue: "6",
  min: 0,
  step: "0.1",
  description:
    "Довгий або другий введений проліт. Інспектор передає значення в базовій одиниці м; розрахунок нормалізує lk <= ld перед визначенням коефіцієнтів за методикою Ліновіча.",
  quantity: "length",
  baseUnit: "m",
  defaultDisplayUnit: "m",
}
```

Update `totalLoadKnM2`:

```ts
{
  id: "totalLoadKnM2",
  kind: "number",
  prefix: { text: "q", ariaLabel: "q" },
  name: "Повне навантаження",
  defaultValue: "10",
  min: 0,
  step: "0.1",
  description:
    "Повне рівномірно розподілене навантаження q на плиту. Інспектор передає значення в базовій одиниці кН/м²; далі q розподіляється між напрямами lk і ld за формулами Ліновіча.",
  quantity: "surfaceLoad",
  baseUnit: "kn-m2",
  defaultDisplayUnit: "kn-m2",
}
```

- [ ] **Step 4: Run cassoon focused tests**

Run:

```bash
npm run test -- components/calculators/cassoon-load-distribution-calculator.test.ts
npm run test -- components/calculator-shell.test.tsx -t "cassoon"
npm run typecheck
npm run build
```

Expected: focused metadata test, cassoon integration tests, `typecheck`, and `build` PASS.

- [ ] **Step 5: Commit cassoon migration**

Run:

```bash
git add components/calculators/cassoon-load-distribution-calculator.tsx components/calculators/cassoon-load-distribution-calculator.test.ts
git commit -m "feat: migrate cassoon inspector units to quantity"
```

### Task 6: Migrate Soil Inspector Metadata

**Files:**
- Modify: `components/calculators/soil-design-resistance-calculator.tsx`
- Create: `components/calculators/soil-design-resistance-calculator.test.ts`

- [ ] **Step 1: Write failing soil schema metadata test**

Create `components/calculators/soil-design-resistance-calculator.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import type { CalculatorInputField } from "@/lib/calculator-input-schema";

import { SOIL_INPUT_SCHEMA } from "./soil-design-resistance-calculator";

function findSchemaField(id: string): CalculatorInputField {
  for (const group of SOIL_INPUT_SCHEMA.groups) {
    const field = group.fields.find((item) => item.id === id);
    if (field) return field;
  }
  throw new Error(`Missing schema field ${id}`);
}

function expectTextDescription(field: CalculatorInputField, pattern: RegExp) {
  expect(field.description).toBeTruthy();
  expect(field.description).toMatch(pattern);
}

describe("SOIL_INPUT_SCHEMA", () => {
  it("defines complete inspector metadata for key fields", () => {
    const expected = [
      ["gammaC1Manual", "coefficient", { text: "γ", subscript: "c1", ariaLabel: "γc1" }],
      ["gammaC2Manual", "coefficient", { text: "γ", subscript: "c2", ariaLabel: "γc2" }],
      ["buildingLengthM", "length", { text: "L", ariaLabel: "L" }],
      ["buildingHeightM", "length", { text: "H", ariaLabel: "H" }],
      ["liquidityIndex", "coefficient", { text: "I", subscript: "L", ariaLabel: "IL" }],
      ["phi11Deg", "angle", { text: "φ", subscript: "11", ariaLabel: "φ11" }],
      ["gamma11KnM3", "unitWeight", { text: "γ", subscript: "11", ariaLabel: "γ11" }],
      ["gammaPrime11KnM3", "unitWeight", { text: "γ′", subscript: "11", ariaLabel: "γ′11" }],
      ["c11KPa", "pressure", { text: "c", subscript: "11", ariaLabel: "c11" }],
      ["foundationWidthM", "length", { text: "b", ariaLabel: "b" }],
      ["foundationDepthM", "length", { text: "d", ariaLabel: "d" }],
      ["embedmentDepthD1M", "length", { text: "d", subscript: "1", ariaLabel: "d1" }],
      ["basementDepthInputM", "length", { text: "d", subscript: "b,input", ariaLabel: "db,input" }],
      ["soilLayerAboveFootingHsM", "length", { text: "h", subscript: "s", ariaLabel: "hs" }],
      ["basementFloorThicknessHcfM", "length", { text: "h", subscript: "cf", ariaLabel: "hcf" }],
      ["basementFloorUnitWeightGammaCfKnM3", "unitWeight", { text: "γ", subscript: "cf", ariaLabel: "γcf" }],
    ] as const;

    for (const [id, quantity, prefix] of expected) {
      const field = findSchemaField(id);
      expect(field).toMatchObject({
        kind: "number",
        quantity,
        prefix,
      });
      expect(field).not.toHaveProperty("displayUnits");
      expect(field.description, id).toBeTruthy();
      expect(field.description, id).not.toBe(field.name);
    }

    expect(findSchemaField("hasBasement")).toMatchObject({
      kind: "checkbox",
      name: "Є підвал?",
    });

    expectTextDescription(findSchemaField("gammaC1Manual"), /табл\. Е\.7/);
    expectTextDescription(findSchemaField("liquidityIndex"), /глинист/);
    expectTextDescription(findSchemaField("phi11Deg"), /табл\. Е\.8/);
    expectTextDescription(findSchemaField("strengthSource"), /п\. Е\.4/);
  });
});
```

- [ ] **Step 2: Run the soil metadata test and verify it fails**

Run:

```bash
npm run test -- components/calculators/soil-design-resistance-calculator.test.ts
```

Expected: FAIL because `SOIL_INPUT_SCHEMA` is not exported and several fields lack `quantity` or descriptions.

- [ ] **Step 3: Update soil schema constants**

In `components/calculators/soil-design-resistance-calculator.tsx`:

Remove these local unit constants if unused after migration: `SOIL_LENGTH_DISPLAY_UNITS`, `SOIL_ANGLE_DISPLAY_UNITS`, `SOIL_UNIT_WEIGHT_DISPLAY_UNITS`, and `SOIL_PRESSURE_DISPLAY_UNITS`.

Export the schema:

```ts
export const SOIL_INPUT_SCHEMA: CalculatorInputSchema = {
```

Apply these quantity mappings:

- `gammaC1Manual`, `gammaC2Manual`, `liquidityIndex`: `quantity: "coefficient"`
- `buildingLengthM`, `buildingHeightM`, `foundationWidthM`, `foundationDepthM`, `embedmentDepthD1M`, `basementDepthInputM`, `soilLayerAboveFootingHsM`, `basementFloorThicknessHcfM`: `quantity: "length"`, `baseUnit: "m"`, `defaultDisplayUnit: "m"`
- `phi11Deg`: `quantity: "angle"`, `baseUnit: "deg"`, `defaultDisplayUnit: "deg"`
- `gamma11KnM3`, `gammaPrime11KnM3`, `basementFloorUnitWeightGammaCfKnM3`: `quantity: "unitWeight"`, `baseUnit: "kn-m3"`, `defaultDisplayUnit: "kn-m3"`
- `c11KPa`: `quantity: "pressure"`, `baseUnit: "kpa"`, `defaultDisplayUnit: "kpa"`

Use these exact descriptions for the listed fields:

```ts
gammaC1Manual:
  "Коефіцієнт умов роботи γc1, який користувач приймає вручну за табл. Е.7 ДБН В.2.1-10-2009 у режимі ручного розрахунку.",
gammaC2Manual:
  "Коефіцієнт умов роботи γc2, який користувач приймає вручну за табл. Е.7 ДБН В.2.1-10-2009 у режимі ручного розрахунку.",
structuralScheme:
  "Конструктивна схема споруди використовується для вибору γc2 за примітками 1-3 до табл. Е.7 ДБН В.2.1-10-2009.",
buildingLengthM:
  "Довжина споруди або її відсіку L у базовій одиниці м; використовується у відношенні L/H для вибору γc2 за табл. Е.7 ДБН В.2.1-10-2009.",
buildingHeightM:
  "Висота споруди або її відсіку H у базовій одиниці м; використовується у відношенні L/H для вибору γc2 за табл. Е.7 ДБН В.2.1-10-2009.",
soilType:
  "Тип ґрунту визначає рядок табл. Е.7 ДБН В.2.1-10-2009 для автоматичного прийняття γc1 і γc2.",
liquidityIndex:
  "Показник текучості IL показується для глинистих ґрунтів або глинистого заповнювача і визначає рядок табл. Е.7 ДБН В.2.1-10-2009.",
phi11Deg:
  "Кут внутрішнього тертя φ11 у градусах; за ним визначаються Mγ, Mq і Mc за табл. Е.8 ДБН В.2.1-10-2009.",
gamma11KnM3:
  "Питома вага ґрунту нижче підошви γ11 у базовій одиниці кН/м³; входить до формули (Е.1) ДБН В.2.1-10-2009.",
gammaPrime11KnM3:
  "Осереднена питома вага ґрунту вище підошви γ′11 у базовій одиниці кН/м³; входить до формули (Е.1) і формули (Е.2) ДБН В.2.1-10-2009.",
c11KPa:
  "Питоме зчеплення c11 у базовій одиниці кПа; входить до формули (Е.1) ДБН В.2.1-10-2009.",
strengthSource:
  "Спосіб визначення φ11 і c11 впливає на коефіцієнт k за п. Е.4 ДБН В.2.1-10-2009.",
foundationWidthM:
  "Ширина підошви фундаменту b у базовій одиниці м; використовується у формулі (Е.1) та для визначення kz за п. Е.4 ДБН В.2.1-10-2009.",
foundationDepthM:
  "Глибина закладання d у базовій одиниці м; використовується для перевірки умови d1 <= d за приміткою 6 до п. Е.4 ДБН В.2.1-10-2009.",
embedmentDepthD1M:
  "Приведена глибина закладання d1 у базовій одиниці м для безпідвальної схеми; входить до формули (Е.1) ДБН В.2.1-10-2009.",
basementDepthInputM:
  "Глибина підвалу db,input у базовій одиниці м; використовується для визначення розрахункової глибини підвалу db за п. Е.4 ДБН В.2.1-10-2009.",
soilLayerAboveFootingHsM:
  "Шар ґрунту над підошвою hs у базовій одиниці м; входить до формули (Е.2) для d1 споруди з підвалом.",
basementFloorThicknessHcfM:
  "Товщина підлоги підвалу hcf у базовій одиниці м; входить до формули (Е.2) для d1 споруди з підвалом.",
basementFloorUnitWeightGammaCfKnM3:
  "Питома вага підлоги підвалу γcf у базовій одиниці кН/м³; входить до формули (Е.2) для d1 споруди з підвалом.",
```

Ensure every field listed in the metadata test has a non-empty `description`.

- [ ] **Step 4: Run soil focused tests**

Run:

```bash
npm run test -- components/calculators/soil-design-resistance-calculator.test.ts
npm run test -- components/calculator-shell.test.tsx -t "soil"
npm run typecheck
npm run build
```

Expected: focused metadata test, soil integration tests, `typecheck`, and `build` PASS.

- [ ] **Step 5: Commit soil migration**

Run:

```bash
git add components/calculators/soil-design-resistance-calculator.tsx components/calculators/soil-design-resistance-calculator.test.ts
git commit -m "feat: migrate soil inspector units to quantity"
```

## Chunk 4: Final Verification And Cleanup

### Task 7: Search For Obsolete Pilot Unit Arrays And Invalid Patterns

**Files:**
- Review only unless a search finds a real missed migration.

- [ ] **Step 1: Search for pilot-local display unit arrays**

Run:

```bash
rg -n "displayUnits|DISPLAY_UNITS" components/calculators/soil-design-resistance-calculator.tsx components/calculators/cassoon-load-distribution-calculator.tsx
```

Expected: no matches.

- [ ] **Step 2: Search for ambiguous unit ids in the new registry**

Run:

```bash
rg -n '"kg"|"ton"|kg-|ton-|-kg|-ton' lib/calculator-units.ts docs/input-inspector-rules.md docs/superpowers/specs/2026-06-13-input-inspector-units-rules-design.md
```

Expected: no matches. The registry should use `kgf` and `tf` where values mean force.

- [ ] **Step 3: Fix any scoped misses**

If either search finds a missed migration inside the scoped files, patch only the scoped file and rerun the relevant focused test. Do not refactor unrelated calculators.

### Task 8: Run Full Verification

**Files:**
- Review all changed files.

- [ ] **Step 1: Run full tests**

Run:

```bash
npm run test
```

Expected: PASS.

- [ ] **Step 2: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: PASS and static export completes.

- [ ] **Step 4: Inspect final diff**

Run:

```bash
git status --short
git diff --stat
git diff -- docs/input-inspector-rules.md lib/calculator-units.ts lib/calculator-units.test.ts lib/calculator-input-schema.ts components/calculators/input-schema-form.tsx components/calculators/input-schema-form.test.tsx components/calculators/cassoon-load-distribution-calculator.tsx components/calculators/cassoon-load-distribution-calculator.test.ts components/calculators/soil-design-resistance-calculator.tsx components/calculators/soil-design-resistance-calculator.test.ts components/calculator-shell.test.tsx
```

Expected: only intended files are changed. `.codex-dev-server.log` may still be dirty but should remain untouched and unstaged.

- [ ] **Step 5: Final commit if needed**

If Task 7 or Task 8 required additional fixes after the previous task commits, commit those scoped fixes:

```bash
git add docs/input-inspector-rules.md lib/calculator-units.ts lib/calculator-units.test.ts lib/calculator-input-schema.ts components/calculators/input-schema-form.tsx components/calculators/input-schema-form.test.tsx components/calculators/cassoon-load-distribution-calculator.tsx components/calculators/soil-design-resistance-calculator.tsx components/calculator-shell.test.tsx
git commit -m "chore: verify inspector units migration"
```

If there are no new fixes after prior commits, do not create an empty commit.
