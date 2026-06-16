# Input Inspector Calculator Action Design

## Status

Approved for implementation planning.

## Goal

Add one optional calculator-action button to any field rendered by the shared
`InputSchemaForm` inspector. The inspector must stay generic: it renders the
button and reports the click, while each native calculator decides what the
action means.

## Field Metadata

Every calculator input field may define:

```ts
calculatorAction?: {
  label: string;
};
```

The action is intentionally specialized:

- at most one calculator-action button per field;
- available for every field kind: `number`, `text`, `select`, `checkbox`,
  `radio`, and `derived`;
- rendered on the right side of the inspector row;
- always shown with the calculator icon;
- uses `label` as the accessible name and tooltip text.

Fields without `calculatorAction` keep the current inspector rendering.

## Form Callback

`InputSchemaForm` receives an optional callback:

```ts
onFieldCalculatorAction?: (event: {
  fieldId: string;
  field: CalculatorInputField;
  values: CalculatorInputValues;
}) => void;
```

When the user clicks the right-side calculator button, the form calls this
callback with the field id, the full field metadata, and the current form
values.

The callback does not return a value. The owning calculator component remains
responsible for opening another calculator, showing a modal, launching a helper
flow, and applying any resulting value through its normal `values` state.

If a field has `calculatorAction` but `onFieldCalculatorAction` is not provided,
the button is not rendered. This avoids inactive controls.

## Rendering

The existing left-side inspector actions remain reserved for help and error
controls. The new calculator action is a separate right-side action zone.

Desktop rows add a narrow column after the value/control area. Mobile rows keep
the action close to the edited value without causing text overlap or layout
shift.

The right action button uses a lucide calculator icon and the same compact icon
button language as the existing inspector controls.

## Responsibility Boundaries

`InputSchemaForm` must not know about:

- calculator slugs;
- catalog routing;
- modal implementations;
- handoff payloads between calculators;
- how returned values are written back.

Those decisions belong to the individual native calculator component that owns
the schema and state.

## Tests

Add focused tests for the shared inspector:

- a field with `calculatorAction` renders a right-side calculator button when
  `onFieldCalculatorAction` is provided;
- clicking the button calls the callback with `fieldId`, `field`, and current
  `values`;
- a field with `calculatorAction` does not render an inactive button when the
  callback is absent;
- existing help and error buttons still render and work independently.

Add CSS expectations where existing layout tests already assert inspector row
columns and mobile behavior.
