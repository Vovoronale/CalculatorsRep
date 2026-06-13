# Universal Input Schema Inspector Design

## Purpose

`InputSchemaForm` becomes a shared schema-driven property inspector for native calculator inputs. It presents calculator task parameters as dense groups and rows, with a consistent structure:

- service actions
- optional formula/user-facing variable prefix
- short human-readable parameter name
- current value control
- optional display unit selector

The component controls UI presentation, basic validation, grouping, conditional visibility, descriptions, field-level help, and field-level error expansion. Calculation and report logic remains authoritative in each `lib/<calculator>.ts` module.

## Scope

This design updates the existing schema-driven input layer and migrates only these pilots:

- `CassoonLoadDistributionCalculator`
- `SoilDesignResistanceCalculator`

Other native calculators keep their current forms. Schemas remain TypeScript values with JSON-compatible shapes where practical. They are not moved into `data/content.json`.

## Approved Decisions

- Desktop uses a stable inspector grid with a prefix column for every row.
- Mobile hides empty prefixes and lays each row out compactly.
- Unit changes affect only the displayed number in the input component.
- `onValuesChange` returns only base calculator values, not selected display unit state.
- Number fields accept both comma and period decimal separators.
- Inline help and errors open under the row, not in floating popovers.

## Schema Model

The field model separates formula notation from user-facing names:

```ts
type CalculatorInputNotation =
  | string
  | {
      text: string;
      subscript?: string;
      superscript?: string;
      ariaLabel: string;
    };

type CalculatorInputFieldBase = {
  id: string;
  name: string;
  prefix?: CalculatorInputNotation;
  description?: string;
  required?: boolean;
  showWhen?: CalculatorInputCondition | CalculatorInputCondition[];
  hidden?: boolean;
};
```

`prefix` is the user-facing variable notation shown in formulas, diagrams, or report explanations. It is not the internal field id. If a variable notation is not useful to the user, `prefix` is omitted.

`name` is the short parameter label, such as `Довжина споруди`, `Висота поверху`, or `Розрахункове навантаження`. Boolean names should read as questions, such as `Є підвал?`.

Supported field kinds:

- `number`
- `text`
- `select`
- `checkbox`
- `radio`
- `derived`

`derived` remains a TypeScript-only v1 escape hatch because it uses a function. Other field shapes should stay serializable so they can later move to JSON.

## Units

Number fields can define display units:

```ts
type CalculatorInputDisplayUnit = {
  value: string;
  label: string;
  factorToBase: number;
};

type CalculatorNumberInputField = CalculatorInputFieldBase & {
  kind: "number";
  defaultValue: string;
  baseUnit?: string;
  defaultDisplayUnit?: string;
  displayUnits?: CalculatorInputDisplayUnit[];
  min?: number;
  max?: number;
  step?: string;
};
```

`defaultValue` is stored in the calculator base unit. `factorToBase` converts a displayed value into the base value:

```text
baseValue = displayValue * factorToBase
displayValue = baseValue / factorToBase
```

Changing the selected display unit updates only local component state and recalculates the visible number. It does not call `onValuesChange`, because the base calculator value did not change.

When the user edits a displayed number, the component parses the display value, converts it to the base unit, normalizes valid decimals to a period separator, and calls `onValuesChange` with only the base value:

```ts
onValuesChange({
  ...values,
  foundationWidthM: "1.25",
});
```

No `foundationWidthUnit` value is emitted.

## Number Input Parsing

Number controls render as:

```tsx
<input type="text" inputMode="decimal" />
```

This is required so users can enter either comma or period decimal separators. The parser accepts both `12.5` and `12,5`. Valid values emitted to calculator values use a period separator. Invalid or incomplete numeric input is emitted as the user's raw string so the controlled field can keep showing it; schema validation then marks the field as an invalid number.

Validation and conversions operate on base values.

## Layout

Desktop row layout:

```text
actions | prefix | name | value | unit
```

Rules:

- `actions` contains `?` and `!` buttons when available.
- `prefix` is a narrow stable column. It can be empty.
- `name` contains the human-readable parameter name.
- `value` contains the input/select/checkbox/radio/derived output.
- `unit` contains a unit select only when the field has display units.

Mobile row layout:

- rows collapse into a compact grid;
- empty prefixes take no visible space;
- non-empty prefixes appear before the field name;
- details expand inline below the row content;
- no floating popovers are used.

## Help And Error Details

If `description` exists, the row shows a `?` action. Clicking it opens the field description inline under the row.

If validation errors exist, the row shows a `!` action. Clicking it opens the field description plus the error list inline under the row. Errors explain what is wrong and how to fix the input when possible.

Field-level schema validation is early UI guidance only. Engineering and normative errors from the calculator report remain authoritative.

## Conditions

Conditional visibility remains serializable:

```ts
type CalculatorInputCondition =
  | { fieldId: string; equals: CalculatorInputPrimitiveValue }
  | { fieldId: string; notEquals: CalculatorInputPrimitiveValue }
  | { fieldId: string; in: CalculatorInputPrimitiveValue[] };
```

Arrays of conditions are interpreted as `AND`. Fields hidden by `showWhen` are not rendered and are not schema-validated.

## Validation

Schema validation covers only UI basics:

- required fields
- numeric parsing
- `min`
- `max`
- select/radio option membership

Text fields validate `required` only. Domain-specific constraints remain in calculator report logic.

Validation accepts decimal comma and decimal period. Validation messages are attached to field ids and displayed through the `!` action.

## Data Flow

`getDefaultInputSchemaValues(schema)` returns only base calculator values. It does not return unit selector state.

`InputSchemaForm` receives:

```ts
type InputSchemaFormProps = {
  schema: CalculatorInputSchema;
  values: CalculatorInputValues;
  onValuesChange: (values: CalculatorInputValues) => void;
  validationErrors?: CalculatorInputValidationErrors;
};
```

The component keeps local display-unit state keyed by field id. This state is purely presentational and resets according to the schema defaults when the form remounts.

Calculator adapters receive base values and pass typed inputs into existing report functions. They continue parsing defensively and treating report validation as authoritative.

## Cassoon Migration

Fields migrate from symbol-only labels to prefix plus name:

- `lk` prefix, `Короткий проліт` name
- `ld` prefix, `Довгий проліт` name
- `q` prefix, `Повне навантаження` name

Hidden unit fields are removed from schema values. Length and load fields define `displayUnits`. The adapter receives base meters and `кН/м²`.

The diagram, summary, source link, warnings, errors, and report rendering remain structurally unchanged. Because selected display units are no longer emitted, diagram and summary values use base units. A separate future design would be required if reports need read-only access to display preferences.

## Soil Migration

Formula symbols move to `prefix`, and labels become readable names. Examples:

- `γc1`: `Коефіцієнт умов роботи 1`
- `γc2`: `Коефіцієнт умов роботи 2`
- `L`: `Довжина споруди`
- `H`: `Висота споруди`
- `IL`: `Показник текучості`
- `φ11`: `Кут внутрішнього тертя`
- `γ11`: `Питома вага ґрунту нижче підошви`
- `c11`: `Питоме зчеплення`
- `b`: `Ширина підошви`
- `d`: `Глибина закладання`
- `d1`: `Приведена глибина закладання`
- `hasBasement`: `Є підвал?`

Manual and automatic mode visibility remains implemented through `showWhen`. Result summary, report, norm scans, rich text, and core report flow remain unchanged.

## Tests

Schema tests:

- default values contain base values and no unit fields;
- conditional fields appear and disappear through serializable rules;
- hidden conditional fields are not validated;
- required, numeric type, min, max, and option membership work;
- comma and period decimals both validate.

Renderer tests:

- group headers and inspector rows render;
- prefix, name, value, and unit cells render correctly;
- fields without prefix keep desktop grid structure;
- number editing emits normalized base values;
- changing display unit recalculates visible numbers and does not call `onValuesChange`;
- text, select, checkbox, and radio controls update values;
- conditional fields render according to `showWhen`;
- `?` opens descriptions;
- `!` opens descriptions plus errors.

Calculator shell tests:

- Cassoon still computes normalized spans and loads from base values;
- Soil manual and automatic modes still show and hide the same fields;
- reports, formulas, diagrams, summaries, warnings, and norm links remain functionally unchanged.

Final verification after implementation:

```bash
npm run test
npm run typecheck
npm run build
```
