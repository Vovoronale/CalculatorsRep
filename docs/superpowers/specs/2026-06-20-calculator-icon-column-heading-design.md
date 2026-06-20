# Calculator Icon Column Heading Design

## Status

Approved design.

## Scope

Remove the visible `Іконка` heading from the calculator catalog table while
keeping the icon column and every calculator icon unchanged.

## Design

- Keep the existing icon-column `<th>` so the table retains its four-column
  structure and current layout.
- Render that heading cell without text or an accessible label.
- Do not change icon images, row content, column sizing, responsive behavior,
  or any other table heading.

## Verification

Update the existing calculator-shell test to assert that the `Іконка` column
heading is absent while calculator icon images remain available by their
existing accessible names.
