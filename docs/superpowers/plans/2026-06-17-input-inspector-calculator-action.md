# Input Inspector Calculator Action Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one optional right-side calculator icon action to any `InputSchemaForm` field and expose a generic click callback to the owning calculator.

**Architecture:** The field schema gets one optional `calculatorAction` metadata object. `InputSchemaForm` stays generic: it renders a right-side icon button only when both field metadata and a callback are present, then calls the callback with the field id, full field metadata, and current values. Individual native calculators remain responsible for deciding what the action does.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest, Testing Library, lucide-react.

---

## Files

- Modify: `lib/calculator-input-schema.ts`
  - Add `CalculatorInputCalculatorAction` metadata type.
  - Add optional `calculatorAction` to every field via `BaseCalculatorInputField`.
- Modify: `components/calculators/input-schema-form.tsx`
  - Import the lucide `Calculator` icon.
  - Add `onFieldCalculatorAction` prop and event type.
  - Render a right-side calculator button when enabled.
- Modify: `components/calculators/input-schema-form.test.tsx`
  - Add focused action rendering and callback tests.
- Modify: `app/globals.css`
  - Add the right-side action column and button layout.
  - Keep existing help/error actions on the left.
  - Update mobile and soil-resistance inspector overrides.
- Modify: `components/calculator-shell.test.tsx`
  - Update CSS expectations for the shared and soil-specific inspector grids.

---

### Task 1: Add Failing Inspector Action Tests

**Files:**
- Modify: `components/calculators/input-schema-form.test.tsx`

- [ ] **Step 1: Add a helper schema with calculator action metadata**

In `components/calculators/input-schema-form.test.tsx`, after `const defaultValues`, add:

```tsx
const schemaWithCalculatorAction: CalculatorInputSchema = {
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
          quantity: "length",
          baseUnit: "m",
          defaultDisplayUnit: "m",
          calculatorAction: {
            label: "Розрахувати короткий проліт",
          },
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
          calculatorAction: {
            label: "Підібрати режим",
          },
        },
        {
          id: "derived",
          kind: "derived",
          name: "Похідне",
          getValue: (values) => `${values.spanM} м`,
          calculatorAction: {
            label: "Перерахувати похідне",
          },
        },
      ],
    },
  ],
};
```

- [ ] **Step 2: Add failing callback and inactive-control tests**

In the `describe("InputSchemaForm", () => { ... })` block, after the existing render test, add:

```tsx
  it("renders right-side calculator actions and reports field clicks generically", async () => {
    const user = userEvent.setup();
    const onFieldCalculatorAction = vi.fn();

    render(
      <InputSchemaForm
        schema={schemaWithCalculatorAction}
        values={defaultValues}
        onValuesChange={vi.fn()}
        onFieldCalculatorAction={onFieldCalculatorAction}
      />,
    );

    const spanAction = screen.getByRole("button", {
      name: "Розрахувати короткий проліт",
    });

    expect(spanAction).toHaveAttribute("title", "Розрахувати короткий проліт");
    expect(spanAction.closest(".input-schema-field__calculator-action")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Підібрати режим" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Перерахувати похідне" })).toBeInTheDocument();

    await user.click(spanAction);

    expect(onFieldCalculatorAction).toHaveBeenCalledTimes(1);
    expect(onFieldCalculatorAction).toHaveBeenCalledWith({
      fieldId: "spanM",
      field: expect.objectContaining({
        id: "spanM",
        kind: "number",
        name: "Короткий проліт",
        calculatorAction: { label: "Розрахувати короткий проліт" },
      }),
      values: defaultValues,
    });
  });

  it("does not render inactive calculator action buttons without a handler", () => {
    render(
      <InputSchemaForm
        schema={schemaWithCalculatorAction}
        values={defaultValues}
        onValuesChange={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "Розрахувати короткий проліт" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Показати опис поля Короткий проліт" })).toBeInTheDocument();
  });
```

- [ ] **Step 3: Run tests to verify they fail**

Run:

```bash
npm run test -- components/calculators/input-schema-form.test.tsx
```

Expected: FAIL with TypeScript or render errors because `calculatorAction` and `onFieldCalculatorAction` are not implemented yet.

- [ ] **Step 4: Commit the failing tests**

```bash
git add components/calculators/input-schema-form.test.tsx
git commit -m "test: cover inspector calculator field actions"
```

---

### Task 2: Add Schema Metadata And Generic Callback

**Files:**
- Modify: `lib/calculator-input-schema.ts`
- Modify: `components/calculators/input-schema-form.tsx`
- Test: `components/calculators/input-schema-form.test.tsx`

- [ ] **Step 1: Add the action metadata type**

In `lib/calculator-input-schema.ts`, after `CalculatorInputCondition`, add:

```ts
export type CalculatorInputCalculatorAction = {
  label: string;
};
```

Then update `BaseCalculatorInputField`:

```ts
type BaseCalculatorInputField = {
  id: string;
  name: string;
  prefix?: CalculatorInputNotation;
  description?: string;
  required?: boolean;
  showWhen?: CalculatorInputCondition | CalculatorInputCondition[];
  hidden?: boolean;
  calculatorAction?: CalculatorInputCalculatorAction;
};
```

- [ ] **Step 2: Import the lucide calculator icon**

In `components/calculators/input-schema-form.tsx`, add the import:

```tsx
import { Calculator } from "lucide-react";
```

Keep the existing React import:

```tsx
import { useMemo, useState } from "react";
```

- [ ] **Step 3: Add the callback event type and prop**

In `components/calculators/input-schema-form.tsx`, replace `InputSchemaFormProps` with:

```tsx
export type InputSchemaFieldCalculatorActionEvent = {
  fieldId: string;
  field: CalculatorInputField;
  values: CalculatorInputValues;
};

type InputSchemaFormProps = {
  schema: CalculatorInputSchema;
  values: CalculatorInputValues;
  onValuesChange: (values: CalculatorInputValues) => void;
  validationErrors?: CalculatorInputValidationErrors;
  onFieldCalculatorAction?: (event: InputSchemaFieldCalculatorActionEvent) => void;
};
```

- [ ] **Step 4: Destructure the callback prop**

Update the `InputSchemaForm` function signature:

```tsx
export function InputSchemaForm({
  schema,
  values,
  onValuesChange,
  validationErrors,
  onFieldCalculatorAction,
}: InputSchemaFormProps) {
```

- [ ] **Step 5: Render the right-side calculator action**

Inside the field row render, after:

```tsx
<div className="input-schema-field__control">{renderFieldControl(field)}</div>
```

add:

```tsx
                  <div className="input-schema-field__calculator-action">
                    {field.calculatorAction && onFieldCalculatorAction ? (
                      <button
                        type="button"
                        className="input-schema-field__icon input-schema-field__icon--calculator"
                        aria-label={field.calculatorAction.label}
                        title={field.calculatorAction.label}
                        onClick={() =>
                          onFieldCalculatorAction({
                            fieldId: field.id,
                            field,
                            values,
                          })
                        }
                      >
                        <Calculator size={13} aria-hidden="true" strokeWidth={2.25} />
                      </button>
                    ) : null}
                  </div>
```

The `detailsMode` block remains after this new div.

- [ ] **Step 6: Run the inspector tests**

Run:

```bash
npm run test -- components/calculators/input-schema-form.test.tsx
```

Expected: PASS for behavior tests. Layout tests in `components/calculator-shell.test.tsx` may still fail until CSS is updated.

- [ ] **Step 7: Commit metadata and rendering**

```bash
git add lib/calculator-input-schema.ts components/calculators/input-schema-form.tsx components/calculators/input-schema-form.test.tsx
git commit -m "feat: add generic inspector calculator action"
```

---

### Task 3: Add Right-Side Action Layout

**Files:**
- Modify: `app/globals.css`
- Modify: `components/calculator-shell.test.tsx`

- [ ] **Step 1: Update shared CSS expectations first**

In `components/calculator-shell.test.tsx`, in `it("defines the shared dense input schema form layout", ...)`, replace the grid expectation with:

```ts
    expect(css).toMatch(
      /\.input-schema-field\s*{[\s\S]*?grid-template-columns:\s*1\.9rem\s+3\.5rem\s+minmax\(8\.5rem,\s*0\.85fr\)\s+minmax\(9rem,\s*1fr\)\s+4\.85rem\s+2\.15rem;/,
    );
```

After the existing `.input-schema-field__control` expectation, add:

```ts
    expect(css).toMatch(
      /\.input-schema-field__calculator-action\s*{[\s\S]*?justify-content:\s*center;/,
    );
```

Replace the mobile control expectation with one that allows the right action column:

```ts
    expect(css).toMatch(
      /@media\s*\(max-width:\s*720px\)\s*{[\s\S]*?\.input-schema-field\s*{[\s\S]*?grid-template-columns:\s*2\.5rem\s+minmax\(0,\s*1fr\)\s+2\.15rem;/,
    );
```

- [ ] **Step 2: Update soil-specific CSS expectations**

In `components/calculator-shell.test.tsx`, in `it("keeps soil resistance inspector fields stacked on narrow screens", ...)`, replace the mobile grid expectation with:

```ts
    expect(css).toMatch(
      /@media\s*\(max-width:\s*720px\)\s*{[\s\S]*?\.soil-resistance-controls\s+\.input-schema-field\s*{[\s\S]*?grid-template-columns:\s*2\.5rem\s+minmax\(0,\s*1fr\)\s+2\.15rem;/,
    );
```

In the same file, add this expectation to `it("defines the shared dense input schema form layout", ...)` or a new CSS-focused assertion:

```ts
    expect(css).toMatch(
      /\.soil-resistance-controls\s+\.input-schema-field\s*{[\s\S]*?grid-template-columns:\s*1\.65rem\s+3rem\s+minmax\(6\.7rem,\s*0\.8fr\)\s+minmax\(7\.5rem,\s*1fr\)\s+4\.4rem\s+2rem;/,
    );
```

- [ ] **Step 3: Run layout tests to verify failure**

Run:

```bash
npm run test -- components/calculator-shell.test.tsx
```

Expected: FAIL because `app/globals.css` still has the old five-column grids and no `.input-schema-field__calculator-action` rules.

- [ ] **Step 4: Update the shared desktop grid**

In `app/globals.css`, replace:

```css
.input-schema-field {
  display: grid;
  grid-template-columns: 1.9rem 3.5rem minmax(8.5rem, 0.85fr) minmax(9rem, 1fr) 4.85rem;
  align-items: stretch;
  min-height: 34px;
  border-bottom: 1px solid var(--border);
}
```

with:

```css
.input-schema-field {
  display: grid;
  grid-template-columns: 1.9rem 3.5rem minmax(8.5rem, 0.85fr) minmax(9rem, 1fr) 4.85rem 2.15rem;
  align-items: stretch;
  min-height: 34px;
  border-bottom: 1px solid var(--border);
}
```

- [ ] **Step 5: Include the right action in row cell layout**

In `app/globals.css`, replace:

```css
.input-schema-field__actions,
.input-schema-field__prefix,
.input-schema-field__name,
.input-schema-field__control {
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 3px 7px;
}
```

with:

```css
.input-schema-field__actions,
.input-schema-field__prefix,
.input-schema-field__name,
.input-schema-field__control,
.input-schema-field__calculator-action {
  display: flex;
  align-items: center;
  min-width: 0;
  padding: 3px 7px;
}
```

Replace:

```css
.input-schema-field__actions,
.input-schema-field__prefix,
.input-schema-field__name {
  border-right: 1px solid var(--border);
}
```

with:

```css
.input-schema-field__actions,
.input-schema-field__prefix,
.input-schema-field__name,
.input-schema-field__control {
  border-right: 1px solid var(--border);
}
```

After `.input-schema-field__actions`, add:

```css
.input-schema-field__calculator-action {
  justify-content: center;
}
```

- [ ] **Step 6: Add calculator icon styling**

After `.input-schema-field__icon--error`, add:

```css
.input-schema-field__icon--calculator {
  border-radius: 6px;
}
```

- [ ] **Step 7: Expand details across the new right column**

Replace:

```css
.input-schema-field__details {
  grid-column: 3 / 6;
```

with:

```css
.input-schema-field__details {
  grid-column: 3 / 7;
```

- [ ] **Step 8: Update mobile layout**

Inside `@media (max-width: 720px)`, replace:

```css
  .input-schema-field {
    grid-template-columns: 2.5rem minmax(0, 1fr);
  }
```

with:

```css
  .input-schema-field {
    grid-template-columns: 2.5rem minmax(0, 1fr) 2.15rem;
  }
```

Still inside the same media block, after the `.input-schema-field__actions` rule, add:

```css
  .input-schema-field__calculator-action {
    grid-column: 3 / 4;
    grid-row: 1 / 4;
    border-left: 1px solid var(--border);
  }
```

Replace all three mobile grid-column rules that use `2 / 3` for prefix, name, control, and details with `2 / 3` unchanged. Do not move field content into the action column.

- [ ] **Step 9: Update soil-resistance desktop and mobile overrides**

In `app/globals.css`, replace:

```css
.soil-resistance-controls .input-schema-field {
  grid-template-columns: 1.65rem 3rem minmax(6.7rem, 0.8fr) minmax(7.5rem, 1fr) 4.4rem;
}
```

with:

```css
.soil-resistance-controls .input-schema-field {
  grid-template-columns: 1.65rem 3rem minmax(6.7rem, 0.8fr) minmax(7.5rem, 1fr) 4.4rem 2rem;
}
```

Replace:

```css
.soil-resistance-controls .input-schema-field__actions,
.soil-resistance-controls .input-schema-field__prefix,
.soil-resistance-controls .input-schema-field__name,
.soil-resistance-controls .input-schema-field__control {
  padding-inline: 5px;
}
```

with:

```css
.soil-resistance-controls .input-schema-field__actions,
.soil-resistance-controls .input-schema-field__prefix,
.soil-resistance-controls .input-schema-field__name,
.soil-resistance-controls .input-schema-field__control,
.soil-resistance-controls .input-schema-field__calculator-action {
  padding-inline: 5px;
}
```

Inside the soil mobile media block, replace:

```css
  .soil-resistance-controls .input-schema-field {
    grid-template-columns: 2.5rem minmax(0, 1fr);
  }
```

with:

```css
  .soil-resistance-controls .input-schema-field {
    grid-template-columns: 2.5rem minmax(0, 1fr) 2.15rem;
  }
```

- [ ] **Step 10: Run layout tests**

Run:

```bash
npm run test -- components/calculator-shell.test.tsx
```

Expected: PASS.

- [ ] **Step 11: Run inspector tests again**

Run:

```bash
npm run test -- components/calculators/input-schema-form.test.tsx
```

Expected: PASS.

- [ ] **Step 12: Commit layout changes**

```bash
git add app/globals.css components/calculator-shell.test.tsx
git commit -m "style: add inspector calculator action column"
```

---

### Task 4: Verify Full Type Safety And Production Build

**Files:**
- Review only unless failures require fixes:
  - `lib/calculator-input-schema.ts`
  - `components/calculators/input-schema-form.tsx`
  - `app/globals.css`
  - `components/calculators/input-schema-form.test.tsx`
  - `components/calculator-shell.test.tsx`

- [ ] **Step 1: Run targeted tests**

Run:

```bash
npm run test -- components/calculators/input-schema-form.test.tsx components/calculator-shell.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run full test suite**

Run:

```bash
npm run test
```

Expected: PASS.

- [ ] **Step 3: Run TypeScript check**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Run production build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 5: Inspect final diff**

Run:

```bash
git diff --stat HEAD
git diff -- lib/calculator-input-schema.ts components/calculators/input-schema-form.tsx components/calculators/input-schema-form.test.tsx app/globals.css components/calculator-shell.test.tsx
```

Expected: only the generic inspector action implementation, tests, and CSS layout changes are present.

- [ ] **Step 6: Commit any verification fixes**

If the verification commands required small fixes, commit only those files:

```bash
git add lib/calculator-input-schema.ts components/calculators/input-schema-form.tsx components/calculators/input-schema-form.test.tsx app/globals.css components/calculator-shell.test.tsx
git commit -m "chore: verify inspector calculator actions"
```

If no fixes were needed, do not create an empty commit.

