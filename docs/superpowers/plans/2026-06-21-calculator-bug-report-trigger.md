# Calculator Bug-Report Trigger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a calculator-specific `Повідомити про помилку` button to the sticky workspace top bar and connect it to the existing bug-report dialog with calculator context.

**Architecture:** Keep ownership in `CalculatorShell`, which already knows the selected calculator and renders the workspace action slot. Add local dialog state, compose the report button with the existing embed action, and render the existing `FeedbackDialog` in `bug-report` mode using the calculator title and the absolute browser URL.

**Tech Stack:** Next.js 15, React 19, TypeScript, Lucide React, Vitest, Testing Library, CSS.

**Design source:** [`docs/superpowers/specs/2026-06-21-calculator-bug-report-trigger-design.md`](../specs/2026-06-21-calculator-bug-report-trigger-design.md)

---

## File structure

- Modify `components/calculator-shell.test.tsx`: specify trigger visibility, dialog opening, submitted calculator context, and coexistence with the embedded-calculator action.
- Modify `components/calculator-shell.tsx`: add report-dialog state, top-bar trigger, context capture, and the shared dialog instance.
- Modify `app/globals.css`: make the existing workspace action style render buttons consistently with links and preserve focus visibility.

### Task 1: Connect the calculator bug-report trigger

**Files:**
- Test: `components/calculator-shell.test.tsx`
- Modify: `components/calculator-shell.tsx`
- Modify: `app/globals.css`

- [x] **Step 1: Write failing shell interaction tests**

Add tests that render a selected native calculator and assert:

```tsx
expect(
  screen.getByRole("button", { name: "Повідомити про помилку" }),
).toBeInTheDocument();

await user.click(
  screen.getByRole("button", { name: "Повідомити про помилку" }),
);

expect(
  screen.getByRole("dialog", { name: "Повідомити про помилку" }),
).toBeInTheDocument();
```

Submit the form with a mocked same-origin `fetch` and assert the outgoing `FormData` contains:

```ts
expect(form.get("mode")).toBe("bug-report");
expect(form.get("calculatorName")).toBe(calculator.title);
expect(form.get("pageUrl")).toBe(window.location.href);
```

Add separate assertions that the catalog has no report trigger and an embedded calculator shows both `Відкрити окремо` and `Повідомити про помилку`.

- [x] **Step 2: Run the focused tests and verify RED**

Run:

```bash
npm test -- components/calculator-shell.test.tsx
```

Expected: the new assertions fail because the report trigger is not rendered by `CalculatorShell`.

- [x] **Step 3: Implement the minimal shell integration**

Import `MessageSquareWarning` and `FeedbackDialog`. Add state for the dialog and captured page URL:

```tsx
const [bugReportOpen, setBugReportOpen] = useState(false);
const [bugReportPageUrl, setBugReportPageUrl] = useState("");

const openBugReport = () => {
  setBugReportPageUrl(window.location.href);
  setBugReportOpen(true);
};
```

Compose the workspace actions in one container fragment:

```tsx
<>
  {selectedCalculator.displayMode === "embed" ? existingOpenAction : null}
  <button
    type="button"
    className="workspace-top-bar__action"
    onClick={openBugReport}
  >
    <MessageSquareWarning size={14} aria-hidden />
    Повідомити про помилку
  </button>
</>
```

Render the existing dialog beside `CalculatorModal`:

```tsx
<FeedbackDialog
  open={bugReportOpen}
  mode="bug-report"
  onClose={() => setBugReportOpen(false)}
  calculatorContext={
    selectedCalculator
      ? {
          calculatorName: selectedCalculator.title,
          pageUrl: bugReportPageUrl,
        }
      : undefined
  }
/>
```

Extend `.workspace-top-bar__action` with `cursor: pointer`, `font-family: inherit`, and a shared `:focus-visible` outline so the button and existing link remain visually consistent and keyboard-visible.

- [x] **Step 4: Run focused tests and verify GREEN**

Run:

```bash
npm test -- components/calculator-shell.test.tsx components/feedback-dialog.test.tsx
```

Expected: all shell and dialog tests pass.

- [x] **Step 5: Run repository verification**

Run:

```bash
npm test
npm run typecheck
npm run build
```

Expected: all tests pass, TypeScript reports no errors, and the static production export succeeds.

- [x] **Step 6: Verify the rendered interaction**

Run `npm run dev`, then use the in-app Browser on one native and one embedded calculator at desktop and mobile widths. Confirm:

- the target route and title are correct;
- meaningful content renders without a framework overlay;
- the console contains no relevant errors or warnings;
- the report button opens the named bug-report dialog;
- the embedded page keeps `Відкрити окремо` beside the report trigger;
- neither action clips or overlaps at mobile width.

- [x] **Step 7: Commit the implementation**

```bash
git add components/calculator-shell.tsx components/calculator-shell.test.tsx app/globals.css docs/superpowers/plans/2026-06-21-calculator-bug-report-trigger.md
git commit -m "Add calculator bug report trigger"
```
