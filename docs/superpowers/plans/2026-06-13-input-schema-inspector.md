# Input Schema Inspector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the shared calculator schema form into a dense property inspector with `prefix + name + value + display unit`, base-only calculator values, and comma/period decimal input.

**Architecture:** Keep calculator engineering logic in existing `lib/<calculator>.ts` files. Put schema types, visibility, defaults, parsing, unit conversion, and basic validation in `lib/calculator-input-schema.ts`; render rows and local display-unit state in `components/calculators/input-schema-form.tsx`; keep pilot calculator adapters thin and base-value oriented.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest, Testing Library, CSS in `app/globals.css`.

---

## Reference

- Design spec: `docs/superpowers/specs/2026-06-13-input-schema-inspector-design.md`
- Current shared schema: `lib/calculator-input-schema.ts`
- Current shared renderer: `components/calculators/input-schema-form.tsx`
- Current renderer tests: `components/calculators/input-schema-form.test.tsx`
- Pilot calculators:
  - `components/calculators/cassoon-load-distribution-calculator.tsx`
  - `components/calculators/soil-design-resistance-calculator.tsx`
- Integration tests: `components/calculator-shell.test.tsx`
- Styles: `app/globals.css`

## File Structure

- Modify `lib/calculator-input-schema.ts`: own schema contracts, default extraction, visibility, number parsing, display-unit conversion helpers, and basic validation.
- Modify `components/calculators/input-schema-form.tsx`: own local display-unit state and inspector row rendering.
- Modify `components/calculators/input-schema-form.test.tsx`: cover schema helpers and renderer behavior.
- Modify `app/globals.css`: implement 5-column desktop inspector and compact mobile rows.
- Modify `components/calculators/cassoon-load-distribution-calculator.tsx`: migrate schema to `prefix`/`name`, remove unit fields from form values, pass base units to report logic and diagram.
- Modify `components/calculators/soil-design-resistance-calculator.tsx`: migrate schema to `prefix`/`name` and base-value fields.
- Modify `components/calculator-shell.test.tsx`: update labels, roles, and CSS expectations for the inspector model.

---

### Task 1: Schema Types, Parsing, Units, And Validation

**Files:**
- Modify: `lib/calculator-input-schema.ts`
- Modify: `components/calculators/input-schema-form.test.tsx`

- [ ] **Step 1: Write failing schema tests**

Replace the schema test fixture in `components/calculators/input-schema-form.test.tsx` with a fixture using `name`, `prefix`, `text`, and `displayUnits`. Add these tests inside `describe("calculator input schema", ...)`:

```ts
const schema: CalculatorInputSchema = {
  groups: [
    {
      id: "geometry",
      title: "Геометрія",
      fields: [
        {
          id: "spanM",
          kind: "number",
          prefix: { text: "l", subscript: "k", ariaLabel: "lk" },
          name: "Короткий проліт",
          defaultValue: "3",
          min: 0,
          step: "0.1",
          description: "Короткий проліт у вибраних одиницях.",
          baseUnit: "m",
          defaultDisplayUnit: "m",
          displayUnits: [
            { value: "m", label: "м", factorToBase: 1 },
            { value: "cm", label: "см", factorToBase: 0.01 },
          ],
        },
        {
          id: "mode",
          kind: "select",
          name: "Режим",
          defaultValue: "auto",
          options: [
            { value: "auto", label: "Авто" },
            { value: "manual", label: "Вручну" },
          ],
        },
        {
          id: "manualFactor",
          kind: "number",
          name: "Коефіцієнт",
          defaultValue: "",
          min: 0,
          showWhen: { fieldId: "mode", equals: "manual" },
        },
        {
          id: "comment",
          kind: "text",
          name: "Коментар",
          defaultValue: "",
          required: true,
        },
      ],
    },
    {
      id: "options",
      title: "Опції",
      fields: [
        {
          id: "enabled",
          kind: "checkbox",
          name: "Увімкнути?",
          defaultValue: false,
        },
        {
          id: "variant",
          kind: "radio",
          name: "Варіант",
          defaultValue: "a",
          options: [
            { value: "a", label: "Item1" },
            { value: "b", label: "Item2" },
          ],
        },
        {
          id: "derived",
          kind: "derived",
          name: "Похідне",
          getValue: (values) => `${values.spanM} м`,
        },
      ],
    },
  ],
};

const defaultValues: CalculatorInputValues = {
  spanM: "3",
  mode: "auto",
  manualFactor: "",
  comment: "",
  enabled: false,
  variant: "a",
};

it("returns default base values without unit fields", () => {
  expect(getDefaultInputSchemaValues(schema)).toEqual(defaultValues);
});

it("converts display numbers to base values and back", () => {
  expect(convertDisplayNumberToBase("125,5", { value: "cm", label: "см", factorToBase: 0.01 })).toBe("1.255");
  expect(convertBaseNumberToDisplay("1.255", { value: "cm", label: "см", factorToBase: 0.01 })).toBe("125.5");
  expect(convertDisplayNumberToBase("12.5", { value: "m", label: "м", factorToBase: 1 })).toBe("12.5");
});

it("preserves invalid number drafts during conversion", () => {
  expect(convertDisplayNumberToBase("12,", { value: "cm", label: "см", factorToBase: 0.01 })).toBe("12,");
  expect(convertBaseNumberToDisplay("abc", { value: "cm", label: "см", factorToBase: 0.01 })).toBe("abc");
});

it("validates comma and period decimals, required text, min, max, and option membership", () => {
  expect(validateInputSchemaValues(schema, { ...defaultValues, spanM: "1,5", comment: "ok" }).spanM).toBeUndefined();
  expect(validateInputSchemaValues(schema, { ...defaultValues, spanM: "1.5", comment: "ok" }).spanM).toBeUndefined();

  const errors = validateInputSchemaValues(
    {
      groups: [
        {
          id: "checks",
          title: "Checks",
          fields: [
            {
              id: "depthM",
              kind: "number",
              name: "Глибина",
              defaultValue: "1",
              required: true,
              min: 0,
              max: 5,
            },
            {
              id: "kind",
              kind: "select",
              name: "Тип",
              defaultValue: "a",
              options: [{ value: "a", label: "A" }],
            },
            {
              id: "note",
              kind: "text",
              name: "Примітка",
              defaultValue: "",
              required: true,
            },
          ],
        },
      ],
    },
    { depthM: "-1", kind: "b", note: "" },
  );

  expect(errors).toEqual({
    depthM: ["Значення має бути не менше 0."],
    kind: ["Оберіть значення зі списку."],
    note: ["Заповніть поле."],
  });

  expect(validateInputSchemaValues(schema, { ...defaultValues, spanM: "abc", comment: "ok" }).spanM).toEqual([
    "Введіть числове значення.",
  ]);
});
```

- [ ] **Step 2: Run schema tests and verify they fail**

Run:

```bash
npm run test -- components/calculators/input-schema-form.test.tsx
```

Expected: FAIL with TypeScript/runtime errors for missing `name`, `prefix`, `text`, `displayUnits`, `convertDisplayNumberToBase`, or `convertBaseNumberToDisplay`.

- [ ] **Step 3: Implement schema model and helpers**

Update `lib/calculator-input-schema.ts` to this shape:

```ts
export type CalculatorInputPrimitiveValue = string | boolean;

export type CalculatorInputValues = Record<string, CalculatorInputPrimitiveValue>;

export type CalculatorInputOption = {
  value: string;
  label: string;
};

export type CalculatorInputNotation =
  | string
  | {
      text: string;
      subscript?: string;
      superscript?: string;
      ariaLabel: string;
    };

export type CalculatorInputDisplayUnit = {
  value: string;
  label: string;
  factorToBase: number;
};

export type CalculatorInputCondition =
  | {
      fieldId: string;
      equals: CalculatorInputPrimitiveValue;
    }
  | {
      fieldId: string;
      notEquals: CalculatorInputPrimitiveValue;
    }
  | {
      fieldId: string;
      in: CalculatorInputPrimitiveValue[];
    };

type BaseCalculatorInputField = {
  id: string;
  name: string;
  prefix?: CalculatorInputNotation;
  description?: string;
  required?: boolean;
  showWhen?: CalculatorInputCondition | CalculatorInputCondition[];
  hidden?: boolean;
};

export type CalculatorNumberInputField = BaseCalculatorInputField & {
  kind: "number";
  defaultValue: string;
  min?: number;
  max?: number;
  step?: string;
  baseUnit?: string;
  defaultDisplayUnit?: string;
  displayUnits?: CalculatorInputDisplayUnit[];
};

export type CalculatorTextInputField = BaseCalculatorInputField & {
  kind: "text";
  defaultValue: string;
};

export type CalculatorSelectInputField = BaseCalculatorInputField & {
  kind: "select";
  defaultValue: string;
  options: CalculatorInputOption[];
};

export type CalculatorCheckboxInputField = BaseCalculatorInputField & {
  kind: "checkbox";
  defaultValue: boolean;
};

export type CalculatorRadioInputField = BaseCalculatorInputField & {
  kind: "radio";
  defaultValue: string;
  options: CalculatorInputOption[];
};

export type CalculatorDerivedInputField = BaseCalculatorInputField & {
  kind: "derived";
  getValue: (values: CalculatorInputValues) => string;
};

export type CalculatorInputField =
  | CalculatorNumberInputField
  | CalculatorTextInputField
  | CalculatorSelectInputField
  | CalculatorCheckboxInputField
  | CalculatorRadioInputField
  | CalculatorDerivedInputField;

export type CalculatorInputGroup = {
  id: string;
  title: string;
  fields: CalculatorInputField[];
};

export type CalculatorInputSchema = {
  groups: CalculatorInputGroup[];
};

export type CalculatorInputValidationErrors = Record<string, string[]>;

export function parseCalculatorDecimal(value: CalculatorInputPrimitiveValue): number {
  if (typeof value === "boolean") return Number.NaN;
  const normalized = value.trim().replace(",", ".");
  if (normalized === "" || normalized.endsWith(".")) return Number.NaN;
  return Number(normalized);
}

function formatCalculatorDecimal(value: number): string {
  return Number.isInteger(value) ? String(value) : String(Number.parseFloat(value.toFixed(12)));
}

export function convertDisplayNumberToBase(
  value: string,
  unit: CalculatorInputDisplayUnit,
): string {
  const numericValue = parseCalculatorDecimal(value);
  if (!Number.isFinite(numericValue)) return value;
  return formatCalculatorDecimal(numericValue * unit.factorToBase);
}

export function convertBaseNumberToDisplay(
  value: CalculatorInputPrimitiveValue,
  unit: CalculatorInputDisplayUnit,
): string {
  const numericValue = parseCalculatorDecimal(value);
  if (!Number.isFinite(numericValue)) return String(value ?? "");
  return formatCalculatorDecimal(numericValue / unit.factorToBase);
}
```

Keep the existing `conditionMatches`, `getVisibleInputSchemaGroups`, and `getDefaultInputSchemaValues` behavior, but update references from `label` to `name` and skip `derived` fields in defaults. Add text validation:

```ts
function validateTextField(
  field: CalculatorTextInputField,
  values: CalculatorInputValues,
): string[] {
  const value = values[field.id];
  const isEmpty = value === undefined || value === "";
  return field.required && isEmpty ? ["Заповніть поле."] : [];
}
```

Update `validateInputSchemaValues`:

```ts
const fieldErrors =
  field.kind === "number"
    ? validateNumberField(field, values)
    : field.kind === "select" || field.kind === "radio"
      ? validateOptionField(field, values)
      : field.kind === "text"
        ? validateTextField(field, values)
        : [];
```

Use `parseCalculatorDecimal` inside `validateNumberField`.

- [ ] **Step 4: Run schema tests and verify they pass**

Run:

```bash
npm run test -- components/calculators/input-schema-form.test.tsx
```

Expected: schema tests PASS. Renderer tests may still fail because the component has not migrated to `name`/`prefix`.

- [ ] **Step 5: Commit Task 1**

Commit only the schema and tests touched in this task:

```bash
git add lib/calculator-input-schema.ts components/calculators/input-schema-form.test.tsx
git commit -m "feat: update calculator input schema model"
```

---

### Task 2: Renderer Inspector Rows And Unit Display State

**Files:**
- Modify: `components/calculators/input-schema-form.tsx`
- Modify: `components/calculators/input-schema-form.test.tsx`

- [ ] **Step 1: Write failing renderer tests**

Replace renderer expectations in `components/calculators/input-schema-form.test.tsx` with these cases:

```ts
describe("InputSchemaForm", () => {
  it("renders inspector groups, prefixes, names, units, controls, and derived values", () => {
    render(<InputSchemaForm schema={schema} values={defaultValues} onValuesChange={vi.fn()} />);

    expect(screen.getByRole("group", { name: "Геометрія" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Опції" })).toBeInTheDocument();
    expect(screen.getByText("Короткий проліт")).toBeInTheDocument();
    expect(screen.getByText("lk")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Короткий проліт" })).toHaveValue("3");
    expect(screen.getByRole("combobox", { name: "Одиниця Короткий проліт" })).toHaveValue("m");
    expect(screen.getByRole("checkbox", { name: "Увімкнути?" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "Item1" })).toBeChecked();
    expect(screen.getByText("3 м")).toBeInTheDocument();
  });

  it("updates number values as normalized base values and keeps invalid drafts", async () => {
    const user = userEvent.setup();
    const onValuesChange = vi.fn();

    render(<InputSchemaForm schema={schema} values={defaultValues} onValuesChange={onValuesChange} />);

    const input = screen.getByRole("textbox", { name: "Короткий проліт" });
    await user.clear(input);
    await user.type(input, "125,5");

    expect(onValuesChange).toHaveBeenLastCalledWith({
      ...defaultValues,
      spanM: "125.5",
    });

    await user.clear(input);
    await user.type(input, "abc");

    expect(onValuesChange).toHaveBeenLastCalledWith({
      ...defaultValues,
      spanM: "abc",
    });
  });

  it("changes display unit locally without emitting calculator values", async () => {
    const user = userEvent.setup();
    const onValuesChange = vi.fn();

    render(<InputSchemaForm schema={schema} values={{ ...defaultValues, spanM: "1.25" }} onValuesChange={onValuesChange} />);

    await user.selectOptions(screen.getByRole("combobox", { name: "Одиниця Короткий проліт" }), "cm");

    expect(screen.getByRole("textbox", { name: "Короткий проліт" })).toHaveValue("125");
    expect(onValuesChange).not.toHaveBeenCalled();

    await user.clear(screen.getByRole("textbox", { name: "Короткий проліт" }));
    await user.type(screen.getByRole("textbox", { name: "Короткий проліт" }), "126,5");

    expect(onValuesChange).toHaveBeenLastCalledWith({
      ...defaultValues,
      spanM: "1.265",
    });
  });

  it("updates select, text, checkbox, radio and renders conditional fields", async () => {
    const user = userEvent.setup();
    const onValuesChange = vi.fn();

    const { rerender } = render(
      <InputSchemaForm schema={schema} values={defaultValues} onValuesChange={onValuesChange} />,
    );

    await user.selectOptions(screen.getByRole("combobox", { name: "Режим" }), "manual");
    expect(onValuesChange).toHaveBeenLastCalledWith({ ...defaultValues, mode: "manual" });

    await user.type(screen.getByRole("textbox", { name: "Коментар" }), "abc");
    expect(onValuesChange).toHaveBeenLastCalledWith({ ...defaultValues, comment: "abc" });

    await user.click(screen.getByRole("checkbox", { name: "Увімкнути?" }));
    expect(onValuesChange).toHaveBeenLastCalledWith({ ...defaultValues, enabled: true });

    await user.click(screen.getByRole("radio", { name: "Item2" }));
    expect(onValuesChange).toHaveBeenLastCalledWith({ ...defaultValues, variant: "b" });

    rerender(
      <InputSchemaForm
        schema={schema}
        values={{ ...defaultValues, mode: "manual" }}
        onValuesChange={onValuesChange}
      />,
    );

    expect(screen.getByRole("textbox", { name: "Коефіцієнт" })).toBeInTheDocument();
  });

  it("opens inline help and field errors from row actions", async () => {
    const user = userEvent.setup();

    render(
      <InputSchemaForm
        schema={schema}
        values={defaultValues}
        onValuesChange={vi.fn()}
        validationErrors={{ spanM: ["Значення має бути не менше 0."] }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Показати опис поля Короткий проліт" }));
    expect(screen.getByText("Короткий проліт у вибраних одиницях.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Показати помилку поля Короткий проліт" }));
    const detail = screen.getByText("Значення має бути не менше 0.").closest(".input-schema-field__details");

    expect(detail).not.toBeNull();
    expect(within(detail as HTMLElement).getByText("Короткий проліт у вибраних одиницях.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run renderer tests and verify they fail**

Run:

```bash
npm run test -- components/calculators/input-schema-form.test.tsx
```

Expected: FAIL because renderer still uses `label`, `type="number"`, hidden unit fields, and no local unit display state.

- [ ] **Step 3: Implement renderer helpers**

In `components/calculators/input-schema-form.tsx`, update imports:

```ts
import {
  convertBaseNumberToDisplay,
  convertDisplayNumberToBase,
  getVisibleInputSchemaGroups,
  validateInputSchemaValues,
  type CalculatorInputDisplayUnit,
  type CalculatorInputField,
  type CalculatorInputNotation,
  type CalculatorInputSchema,
  type CalculatorInputValidationErrors,
  type CalculatorInputValues,
} from "@/lib/calculator-input-schema";
```

Replace label helpers with notation/name helpers:

```tsx
function getNotationText(prefix: CalculatorInputNotation): string {
  return typeof prefix === "string" ? prefix : prefix.ariaLabel;
}

function FieldPrefix({ prefix }: { prefix?: CalculatorInputNotation }) {
  if (!prefix) return null;
  if (typeof prefix === "string") return <>{prefix}</>;

  return (
    <MathNotation
      base={prefix.text}
      subscript={prefix.subscript}
      superscript={prefix.superscript}
      ariaLabel={prefix.ariaLabel}
    />
  );
}

function getInitialDisplayUnits(schema: CalculatorInputSchema): Record<string, string> {
  const units: Record<string, string> = {};

  for (const group of schema.groups) {
    for (const field of group.fields) {
      if (field.kind === "number" && field.displayUnits?.length) {
        units[field.id] = field.defaultDisplayUnit ?? field.displayUnits[0].value;
      }
    }
  }

  return units;
}

function getSelectedDisplayUnit(
  field: Extract<CalculatorInputField, { kind: "number" }>,
  displayUnits: Record<string, string>,
): CalculatorInputDisplayUnit | undefined {
  if (!field.displayUnits?.length) return undefined;
  const selectedUnit = displayUnits[field.id] ?? field.defaultDisplayUnit ?? field.displayUnits[0].value;
  return field.displayUnits.find((unit) => unit.value === selectedUnit) ?? field.displayUnits[0];
}
```

- [ ] **Step 4: Implement local unit state and controls**

Inside `InputSchemaForm`, add local state:

```tsx
const [displayUnits, setDisplayUnits] = useState<Record<string, string>>(() =>
  getInitialDisplayUnits(schema),
);
```

Update `setValue`:

```tsx
const setValue = (id: string, value: string | boolean) => {
  onValuesChange({
    ...values,
    [id]: value,
  });
};
```

Update `toggleDetails` so switching from help to error opens the requested mode:

```tsx
const toggleDetails = (fieldId: string, mode: "help" | "error") => {
  setExpandedDetails((current) => ({
    ...current,
    [fieldId]: current[fieldId] === mode ? "help" : mode,
  }));
};
```

Replace number control rendering with base/display conversion:

```tsx
if (field.kind === "number") {
  const selectedUnit = getSelectedDisplayUnit(field, displayUnits);
  const value = values[field.id] ?? field.defaultValue;
  const displayValue = selectedUnit ? convertBaseNumberToDisplay(value, selectedUnit) : String(value);

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
      {field.displayUnits?.length ? (
        <select
          className="input-schema-field__unit"
          value={selectedUnit?.value ?? field.displayUnits[0].value}
          onChange={(event) =>
            setDisplayUnits((current) => ({
              ...current,
              [field.id]: event.target.value,
            }))
          }
          aria-label={`Одиниця ${field.name}`}
        >
          {field.displayUnits.map((unit) => (
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

Add text rendering:

```tsx
if (field.kind === "text") {
  return (
    <input
      id={fieldId}
      type="text"
      value={String(values[field.id] ?? field.defaultValue)}
      onChange={(event) => setValue(field.id, event.target.value)}
      aria-label={field.name}
    />
  );
}
```

Update select, checkbox, and radio to use `field.name` for accessible labels.

- [ ] **Step 5: Implement inspector row markup**

Replace the row body with explicit cells:

```tsx
<div className="input-schema-field__actions">...</div>
<div
  className="input-schema-field__prefix"
  data-empty={field.prefix ? undefined : "true"}
  aria-label={field.prefix ? `Позначення ${getNotationText(field.prefix)}` : undefined}
>
  <FieldPrefix prefix={field.prefix} />
</div>
{field.kind === "checkbox" ? (
  <div className="input-schema-field__name">{field.name}</div>
) : (
  <label className="input-schema-field__name" htmlFor={`input-schema-${field.id}`}>
    {field.name}
  </label>
)}
<div className="input-schema-field__control">{renderFieldControl(field)}</div>
{detailsMode ? (
  <div className="input-schema-field__details" id={detailsId}>...</div>
) : null}
```

Use `field.name` in button aria-labels:

```tsx
aria-label={`Показати опис поля ${field.name}`}
aria-label={`Показати помилку поля ${field.name}`}
```

- [ ] **Step 6: Run renderer tests and verify they pass**

Run:

```bash
npm run test -- components/calculators/input-schema-form.test.tsx
```

Expected: PASS.

- [ ] **Step 7: Commit Task 2**

```bash
git add components/calculators/input-schema-form.tsx components/calculators/input-schema-form.test.tsx
git commit -m "feat: render calculator input inspector rows"
```

---

### Task 3: Dense Inspector CSS

**Files:**
- Modify: `app/globals.css`
- Modify: `components/calculator-shell.test.tsx`

- [ ] **Step 1: Write failing CSS expectations**

In `components/calculator-shell.test.tsx`, update the existing CSS expectations around `.input-schema-field` to assert the 5-column desktop grid and mobile compact layout:

```ts
expect(css).toMatch(
  /\.input-schema-field\s*{[\s\S]*?grid-template-columns:\s*2\.5rem\s+4\.25rem\s+minmax\(10rem,\s*0\.9fr\)\s+minmax\(12rem,\s*1fr\)\s+minmax\(4\.5rem,\s*auto\);/,
);
expect(css).toMatch(/\.input-schema-field__prefix\s*{[\s\S]*?justify-content:\s*center;/);
expect(css).toMatch(/\.input-schema-field__unit\s*{[\s\S]*?width:\s*100%;/);
expect(css).toMatch(
  /@media\s*\(max-width:\s*720px\)\s*{[\s\S]*?\.input-schema-field\s*{[\s\S]*?grid-template-columns:\s*2\.5rem\s+minmax\(0,\s*1fr\);/,
);
expect(css).toMatch(/\.input-schema-field__prefix\[data-empty="true"\]\s*{[\s\S]*?display:\s*none;/);
```

- [ ] **Step 2: Run CSS test and verify it fails**

Run:

```bash
npm run test -- components/calculator-shell.test.tsx
```

Expected: FAIL on the old 3-column grid and old class names.

- [ ] **Step 3: Update CSS**

Replace the current `.input-schema-*` block in `app/globals.css` with this inspector structure:

```css
.input-schema-form {
  display: grid;
  gap: 16px;
}

.input-schema-group {
  display: grid;
  gap: 0;
  margin: 0;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  overflow: hidden;
}

.input-schema-group legend {
  width: 100%;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border);
  background: var(--surface-2);
  color: var(--text);
  font-family: var(--font-display), sans-serif;
  font-size: 1rem;
  font-weight: 700;
  letter-spacing: 0;
  text-align: center;
}

.input-schema-group__rows {
  display: grid;
}

.input-schema-field {
  display: grid;
  grid-template-columns: 2.5rem 4.25rem minmax(10rem, 0.9fr) minmax(12rem, 1fr) minmax(4.5rem, auto);
  align-items: stretch;
  min-height: 44px;
  border-bottom: 1px solid var(--border);
}

.input-schema-field:last-child {
  border-bottom: 0;
}

.input-schema-field[data-invalid="true"] {
  background: color-mix(in srgb, var(--accent-soft) 55%, var(--surface));
}

.input-schema-field__actions,
.input-schema-field__prefix,
.input-schema-field__name,
.input-schema-field__control {
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 7px 9px;
}

.input-schema-field__actions,
.input-schema-field__prefix,
.input-schema-field__name {
  border-right: 1px solid var(--border);
}

.input-schema-field__actions {
  justify-content: center;
  gap: 4px;
}

.input-schema-field__prefix {
  justify-content: center;
  color: var(--text);
  font-family: var(--font-mono), monospace;
  font-size: 14px;
  font-weight: 700;
}

.input-schema-field__prefix[data-empty="true"] {
  color: transparent;
}

.input-schema-field__name {
  color: var(--text);
  font-size: 14px;
  font-weight: 600;
}

.input-schema-field__control {
  grid-column: 4 / 6;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(4.5rem, auto);
  gap: 8px;
}

.input-schema-field__control > select:not(.input-schema-field__unit),
.input-schema-field__control > output,
.input-schema-field__radio-group {
  grid-column: 1 / 3;
  width: 100%;
}

.input-schema-field input[type="text"],
.input-schema-field select {
  min-width: 0;
  height: 34px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg);
  color: var(--text);
  font-size: 14px;
}

.input-schema-field input[type="text"] {
  width: 100%;
  padding: 0 10px;
  text-align: right;
}

.input-schema-field select {
  padding: 0 28px 0 10px;
}

.input-schema-field__unit {
  width: 100%;
}

.input-schema-field__checkbox,
.input-schema-field__radio {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 34px;
  color: var(--text);
  font-size: 14px;
}

.input-schema-field__checkbox input,
.input-schema-field__radio input {
  width: 18px;
  height: 18px;
  accent-color: var(--accent);
}

.input-schema-field__radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 16px;
}

.input-schema-field output {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  color: var(--text);
  font-family: var(--font-mono), monospace;
  font-size: 14px;
}

.input-schema-field__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: 1px solid var(--border-strong);
  border-radius: 999px;
  background: var(--bg);
  color: var(--text-muted);
  font-family: var(--font-mono), monospace;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.input-schema-field__icon:hover,
.input-schema-field__icon:focus-visible {
  border-color: var(--accent);
  color: var(--accent);
}

.input-schema-field__icon--error {
  border-color: var(--accent);
  color: var(--accent);
}

.input-schema-field__details {
  grid-column: 3 / 6;
  display: grid;
  gap: 6px;
  padding: 0 12px 10px;
  color: var(--text-muted);
  font-size: 13px;
  line-height: 1.45;
}

.input-schema-field__details p,
.input-schema-field__details ul {
  margin: 0;
}

.input-schema-field__details ul {
  padding-left: 18px;
  color: var(--accent);
}

@media (max-width: 720px) {
  .input-schema-field {
    grid-template-columns: 2.5rem minmax(0, 1fr);
  }

  .input-schema-field__actions {
    grid-row: 1 / 3;
  }

  .input-schema-field__prefix,
  .input-schema-field__name {
    border-right: 0;
  }

  .input-schema-field__prefix {
    grid-column: 2 / 3;
    justify-content: flex-start;
    padding-bottom: 0;
  }

  .input-schema-field__prefix[data-empty="true"] {
    display: none;
  }

  .input-schema-field__name {
    grid-column: 2 / 3;
  }

  .input-schema-field__prefix:not([data-empty="true"]) + .input-schema-field__name {
    padding-top: 2px;
  }

  .input-schema-field__control {
    grid-column: 2 / 3;
    grid-template-columns: minmax(0, 1fr);
    padding-top: 0;
  }

  .input-schema-field__control > select:not(.input-schema-field__unit),
  .input-schema-field__control > output,
  .input-schema-field__radio-group {
    grid-column: 1 / 2;
  }

  .input-schema-field__details {
    grid-column: 2 / 3;
  }
}
```

- [ ] **Step 4: Run CSS tests**

Run:

```bash
npm run test -- components/calculator-shell.test.tsx
```

Expected: PASS or only fail on calculator-specific labels that are migrated in Tasks 4 and 5.

- [ ] **Step 5: Commit Task 3**

```bash
git add app/globals.css components/calculator-shell.test.tsx
git commit -m "style: add calculator input inspector layout"
```

---

### Task 4: Cassoon Calculator Migration

**Files:**
- Modify: `components/calculators/cassoon-load-distribution-calculator.tsx`
- Modify: `components/calculator-shell.test.tsx`

- [ ] **Step 1: Write failing Cassoon expectations**

In the Cassoon tests inside `components/calculator-shell.test.tsx`, update field lookups to human names and base-unit behavior:

```ts
expect(screen.getByText("Короткий проліт")).toBeInTheDocument();
expect(screen.getByText("Довгий проліт")).toBeInTheDocument();
expect(screen.getByText("Повне навантаження")).toBeInTheDocument();
expect(screen.getByText("lk")).toBeInTheDocument();
expect(screen.getByText("ld")).toBeInTheDocument();
expect(screen.getByText("q")).toBeInTheDocument();

const shortSpan = screen.getByRole("textbox", { name: "Короткий проліт" });
const shortSpanUnit = screen.getByRole("combobox", { name: "Одиниця Короткий проліт" });
await user.selectOptions(shortSpanUnit, "cm");
expect(shortSpan).toHaveValue("300");
await user.clear(shortSpan);
await user.type(shortSpan, "350,5");
expect(screen.getByText(/lk = 3\.505 м/)).toBeInTheDocument();
```

Remove assertions that expect hidden unit fields in form values or old accessible names like `q`.

- [ ] **Step 2: Run targeted Cassoon tests and verify they fail**

Run:

```bash
npm run test -- components/calculator-shell.test.tsx
```

Expected: FAIL because Cassoon schema still uses `label`, hidden unit fields, and old accessible names.

- [ ] **Step 3: Update Cassoon unit options and schema**

In `components/calculators/cassoon-load-distribution-calculator.tsx`, replace unit option builders:

```ts
const LENGTH_DISPLAY_UNITS = Object.entries(CASSOON_LOAD_DISTRIBUTION_LENGTH_UNITS).map(
  ([value, unit]) => ({
    value,
    label: unit.label,
    factorToBase: unit.toMeters,
  }),
);

const LOAD_DISPLAY_UNITS = Object.entries(CASSOON_LOAD_DISTRIBUTION_LOAD_UNITS).map(
  ([value, unit]) => ({
    value,
    label: unit.label,
    factorToBase: unit.toKnM2,
  }),
);
```

Update `CASSOON_INPUT_SCHEMA` fields:

```ts
{
  id: "shortSpanM",
  kind: "number",
  prefix: { text: "l", subscript: "k", ariaLabel: "lk" },
  name: "Короткий проліт",
  defaultValue: "3",
  min: 0,
  step: "0.1",
  description: "Короткий або перший введений проліт; розрахунок нормалізує lk <= ld.",
  baseUnit: "m",
  defaultDisplayUnit: "m",
  displayUnits: LENGTH_DISPLAY_UNITS,
},
{
  id: "longSpanM",
  kind: "number",
  prefix: { text: "l", subscript: "d", ariaLabel: "ld" },
  name: "Довгий проліт",
  defaultValue: "6",
  min: 0,
  step: "0.1",
  description: "Довгий або другий введений проліт; розрахунок нормалізує lk <= ld.",
  baseUnit: "m",
  defaultDisplayUnit: "m",
  displayUnits: LENGTH_DISPLAY_UNITS,
},
{
  id: "totalLoadKnM2",
  kind: "number",
  prefix: { text: "q", ariaLabel: "q" },
  name: "Повне навантаження",
  defaultValue: "10",
  min: 0,
  step: "0.1",
  description: "Повне рівномірно розподілене навантаження на плиту.",
  baseUnit: "kn-m2",
  defaultDisplayUnit: "kn-m2",
  displayUnits: LOAD_DISPLAY_UNITS,
},
```

Delete the hidden `shortSpanUnit`, `longSpanUnit`, and `loadUnit` schema fields.

- [ ] **Step 4: Update Cassoon adapter and display**

Replace old value reads:

```ts
const shortSpanM = String(inputValues.shortSpanM ?? "3");
const longSpanM = String(inputValues.longSpanM ?? "6");
const totalLoadKnM2 = String(inputValues.totalLoadKnM2 ?? "10");
const loadUnit: CassoonLoadDistributionLoadUnit = "kn-m2";
const selectedLoadUnit = CASSOON_LOAD_DISTRIBUTION_LOAD_UNITS[loadUnit];
```

Call the report with base values:

```ts
const report = getCassoonLoadDistributionReport({
  shortSpanM: parseNumberInput(shortSpanM),
  longSpanM: parseNumberInput(longSpanM),
  totalLoadKnM2: parseNumberInput(totalLoadKnM2),
  shortSpanUnit: "m",
  longSpanUnit: "m",
  loadUnit,
});
```

Pass base load units to diagram and summary:

```tsx
<CassoonLoadDiagram
  report={report}
  loadUnit="kn-m2"
/>
```

Keep report rendering, errors, warnings, source links, and formula rendering unchanged.

- [ ] **Step 5: Run Cassoon tests**

Run:

```bash
npm run test -- components/calculator-shell.test.tsx
```

Expected: Cassoon-related failures are fixed. Soil failures may remain until Task 5.

- [ ] **Step 6: Commit Task 4**

```bash
git add components/calculators/cassoon-load-distribution-calculator.tsx components/calculator-shell.test.tsx
git commit -m "feat: migrate cassoon inputs to inspector schema"
```

---

### Task 5: Soil Calculator Migration

**Files:**
- Modify: `components/calculators/soil-design-resistance-calculator.tsx`
- Modify: `components/calculator-shell.test.tsx`

- [ ] **Step 1: Write failing Soil expectations**

In the Soil tests inside `components/calculator-shell.test.tsx`, update field lookups to human names:

```ts
expect(screen.getByText("Коефіцієнт умов роботи 1")).toBeInTheDocument();
expect(screen.getByText("Коефіцієнт умов роботи 2")).toBeInTheDocument();
expect(screen.getByText("γc1")).toBeInTheDocument();
expect(screen.getByText("γc2")).toBeInTheDocument();

await user.selectOptions(screen.getByRole("combobox", { name: "Спосіб розрахунку" }), "automatic");
expect(screen.getByRole("textbox", { name: "Довжина споруди" })).toBeInTheDocument();
expect(screen.getByRole("textbox", { name: "Висота споруди" })).toBeInTheDocument();
expect(screen.getByRole("combobox", { name: "Тип ґрунту" })).toBeInTheDocument();

await user.click(screen.getByRole("checkbox", { name: "Є підвал?" }));
expect(screen.getByRole("textbox", { name: "Глибина підвалу" })).toBeInTheDocument();
expect(screen.queryByRole("textbox", { name: "Приведена глибина закладання" })).not.toBeInTheDocument();
```

Keep existing report, formula, warning, and norm-link assertions unchanged unless they reference old form labels.

- [ ] **Step 2: Run targeted Soil tests and verify they fail**

Run:

```bash
npm run test -- components/calculator-shell.test.tsx
```

Expected: FAIL because Soil schema still uses `label` and old accessible names.

- [ ] **Step 3: Update Soil schema field labels**

In `components/calculators/soil-design-resistance-calculator.tsx`, replace every `label` in `SOIL_INPUT_SCHEMA` with `name` and optional `prefix`. Use these mappings:

```ts
{
  id: "calculationMode",
  kind: "select",
  name: "Спосіб розрахунку",
  ...
}
{
  id: "gammaC1Manual",
  kind: "number",
  prefix: { text: "γ", subscript: "c1", ariaLabel: "γc1" },
  name: "Коефіцієнт умов роботи 1",
  ...
}
{
  id: "gammaC2Manual",
  kind: "number",
  prefix: { text: "γ", subscript: "c2", ariaLabel: "γc2" },
  name: "Коефіцієнт умов роботи 2",
  ...
}
{
  id: "structuralScheme",
  kind: "select",
  name: "Конструктивна схема споруди",
  ...
}
{
  id: "buildingLengthM",
  kind: "number",
  prefix: { text: "L", ariaLabel: "L" },
  name: "Довжина споруди",
  baseUnit: "m",
  ...
}
{
  id: "buildingHeightM",
  kind: "number",
  prefix: { text: "H", ariaLabel: "H" },
  name: "Висота споруди",
  baseUnit: "m",
  ...
}
{
  id: "soilType",
  kind: "select",
  name: "Тип ґрунту",
  ...
}
{
  id: "liquidityIndex",
  kind: "number",
  prefix: { text: "I", subscript: "L", ariaLabel: "IL" },
  name: "Показник текучості",
  ...
}
{
  id: "phi11Deg",
  kind: "number",
  prefix: { text: "φ", subscript: "11", ariaLabel: "φ11" },
  name: "Кут внутрішнього тертя",
  baseUnit: "deg",
  ...
}
{
  id: "gamma11KnM3",
  kind: "number",
  prefix: { text: "γ", subscript: "11", ariaLabel: "γ11" },
  name: "Питома вага ґрунту нижче підошви",
  baseUnit: "kn-m3",
  ...
}
{
  id: "gammaPrime11KnM3",
  kind: "number",
  prefix: { text: "γ′", subscript: "11", ariaLabel: "γ′11" },
  name: "Осереднена питома вага вище підошви",
  baseUnit: "kn-m3",
  ...
}
{
  id: "c11KPa",
  kind: "number",
  prefix: { text: "c", subscript: "11", ariaLabel: "c11" },
  name: "Питоме зчеплення",
  baseUnit: "kpa",
  ...
}
{
  id: "strengthSource",
  kind: "select",
  name: "Спосіб визначення φ11 і c11",
  ...
}
{
  id: "foundationWidthM",
  kind: "number",
  prefix: { text: "b", ariaLabel: "b" },
  name: "Ширина підошви",
  baseUnit: "m",
  ...
}
{
  id: "foundationDepthM",
  kind: "number",
  prefix: { text: "d", ariaLabel: "d" },
  name: "Глибина закладання",
  baseUnit: "m",
  ...
}
{
  id: "hasBasement",
  kind: "checkbox",
  name: "Є підвал?",
  ...
}
{
  id: "embedmentDepthD1M",
  kind: "number",
  prefix: { text: "d", subscript: "1", ariaLabel: "d1" },
  name: "Приведена глибина закладання",
  baseUnit: "m",
  ...
}
{
  id: "basementDepthInputM",
  kind: "number",
  prefix: { text: "d", subscript: "b,input", ariaLabel: "db,input" },
  name: "Глибина підвалу",
  baseUnit: "m",
  ...
}
{
  id: "soilLayerAboveFootingHsM",
  kind: "number",
  prefix: { text: "h", subscript: "s", ariaLabel: "hs" },
  name: "Шар ґрунту над підошвою",
  baseUnit: "m",
  ...
}
{
  id: "basementFloorThicknessHcfM",
  kind: "number",
  prefix: { text: "h", subscript: "cf", ariaLabel: "hcf" },
  name: "Товщина підлоги підвалу",
  baseUnit: "m",
  ...
}
{
  id: "basementFloorUnitWeightGammaCfKnM3",
  kind: "number",
  prefix: { text: "γ", subscript: "cf", ariaLabel: "γcf" },
  name: "Питома вага підлоги підвалу",
  baseUnit: "kn-m3",
  ...
}
```

Do not add display unit selectors to Soil in this task unless a field already has a clear alternate unit requirement. The approved design supports units, but migration can keep base unit display only for Soil.

- [ ] **Step 4: Run Soil tests**

Run:

```bash
npm run test -- components/calculator-shell.test.tsx
```

Expected: PASS or only fail on broad snapshots/regex expectations that still reference the old `.input-schema-field__label` class.

- [ ] **Step 5: Commit Task 5**

```bash
git add components/calculators/soil-design-resistance-calculator.tsx components/calculator-shell.test.tsx
git commit -m "feat: migrate soil inputs to inspector schema"
```

---

### Task 6: Full Verification And Cleanup

**Files:**
- Review: `lib/calculator-input-schema.ts`
- Review: `components/calculators/input-schema-form.tsx`
- Review: `components/calculators/cassoon-load-distribution-calculator.tsx`
- Review: `components/calculators/soil-design-resistance-calculator.tsx`
- Review: `components/calculator-shell.test.tsx`
- Review: `app/globals.css`

- [ ] **Step 1: Search for obsolete schema names**

Run:

```bash
rg -n "CalculatorInputLabel|label:\\s*\\{|unitFieldId|shortSpanUnit|longSpanUnit|input-schema-field__label|input\\[type=\"number\"\\]" lib components app
```

Expected: no references in the shared input schema, renderer, migrated calculator schemas, or input-schema CSS. References in calculation core types such as `lib/cassoon-load-distribution.ts` may remain because report logic still supports base-unit defaults.

- [ ] **Step 2: Run all tests**

Run:

```bash
npm run test
```

Expected: all Vitest files PASS.

- [ ] **Step 3: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS with no TypeScript errors.

- [ ] **Step 4: Run production build**

Run:

```bash
npm run build
```

Expected: PASS with static Next.js build output.

- [ ] **Step 5: Optional visual smoke check**

If a dev server is not running, start it:

```bash
npm run dev
```

Open these URLs:

```text
http://localhost:3000/calculator/cassoon-load-distribution
http://localhost:3000/calculator/soil-design-resistance
```

Expected:

- groups render as dense inspector blocks;
- desktop rows have stable actions, prefix, name, value, and unit areas;
- mobile rows collapse without empty prefix gaps;
- `?` and `!` details open inline;
- Cassoon unit changes recalculate the visible number and keep reports in base units;
- Soil manual/automatic and basement conditional fields still show/hide correctly.

- [ ] **Step 6: Commit final cleanup if needed**

If Step 1 found obsolete references and cleanup changed files, commit those cleanup edits:

```bash
git add lib components app
git commit -m "chore: clean up inspector schema migration"
```

If no cleanup edits were needed, do not create an empty commit.
