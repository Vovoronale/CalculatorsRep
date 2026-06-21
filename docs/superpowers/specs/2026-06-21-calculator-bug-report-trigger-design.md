# Calculator bug-report trigger design

**Status:** Agreed design

**Date:** 2026-06-21

## Goal

Add the missing calculator-level entry point for the existing `bug-report` feedback flow. The trigger must stay visible while a user works with any calculator and must supply the calculator context already required by `FeedbackDialog`.

## Placement and appearance

- Show the trigger only when `CalculatorShell` renders a selected calculator.
- Place it in the right-hand actions area of the sticky `WorkspaceTopBar`.
- Use the existing subdued `workspace-top-bar__action` treatment so reporting an error remains a secondary action.
- Render the `MessageSquareWarning` Lucide icon and the label `Повідомити про помилку`.
- For embedded calculators, keep the existing `Відкрити окремо` action and place the report trigger beside it.
- Do not add a floating action, a duplicate trigger below the calculator, or a catalog-level trigger.

## Interaction and data flow

1. Activating the trigger opens the existing `FeedbackDialog` in `bug-report` mode.
2. Pass `selectedCalculator.title` as `calculatorName`.
3. Pass the browser's current absolute URL as `pageUrl` when the trigger is activated.
4. Closing or successfully submitting the dialog returns the user to the calculator page through the dialog's existing focus-restoration behavior.
5. Reuse the existing screenshot, validation, submission, success, and error behavior without modification.

## Component changes

- `CalculatorShell` owns the boolean open state for the calculator bug-report dialog.
- `WorkspaceTopBar` receives both the existing embedded-calculator action, when applicable, and the new report button through its existing `actions` slot.
- One shared `FeedbackDialog` instance is rendered by `CalculatorShell` with `mode="bug-report"` and the selected calculator context.
- No changes are required to the Cloudflare Function, Resend integration, feedback validation, content JSON, or individual native calculator components.

## Responsive and accessibility behavior

- Keep the full text label at supported viewport sizes; the actions container may use its existing layout behavior.
- The trigger is a semantic `button` with an explicit `type="button"`.
- The icon is decorative and hidden from assistive technology.
- The existing dialog supplies its accessible name, keyboard close behavior, focus handling, and focus restoration.

## Testing and verification

- Add a `CalculatorShell` interaction test proving the trigger is present only for a selected calculator.
- Verify activation opens a dialog named `Повідомити про помилку` in bug-report mode.
- Verify the submitted `FormData` includes the selected calculator title and current absolute page URL.
- Verify an embedded calculator still renders its existing `Відкрити окремо` action beside the trigger.
- Run the focused tests, full test suite, typecheck, production build, and browser checks on desktop and mobile widths.

## Out of scope

- Changes to feedback fields, screenshot handling, email delivery, or anti-spam rules.
- Multiple reporting entry points per calculator page.
- A report trigger in the catalog, calculator cards, or global IVapps top bar.
- Capturing calculator input values or generated reports in the feedback payload.
