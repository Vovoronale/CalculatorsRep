# Object Inspector Width Design

Status: Approved

## Goal

Keep schema-driven calculator inputs comfortable to scan and edit on wide screens, and prevent the validation action from overflowing its table cell.

## Layout

- Cap the native calculator controls/inspector column at `720px` on layouts where the diagram appears beside it.
- Keep the column fluid below that limit so existing tablet and mobile layouts continue to use the available width.
- Preserve the existing rail, diagram, typography, spacing, colors, borders, and responsive stacking behavior.

## Field Action

- Each input row shows at most one help/error action.
- When a field has validation errors, show `!` instead of `?`.
- Activating `!` expands the field details and displays both the field description, when present, and all current validation errors.
- When a field has no validation errors, keep the existing `?` action and help-only behavior.
- Preserve accessible labels, `aria-controls`, and `aria-expanded` state for both variants.

## Verification

- Component tests cover the mutually exclusive `?` and `!` states and combined error details.
- CSS tests cover the `720px` inspector cap.
- Typecheck and production build pass.
- Browser QA checks a wide desktop viewport and a narrow/mobile viewport, including the error-button interaction.
