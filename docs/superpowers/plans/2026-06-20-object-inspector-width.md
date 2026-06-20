# Object Inspector Width Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cap the native calculator inspector at 720px and replace its help button with a single combined error action whenever validation errors exist.

**Architecture:** Keep the shared `InputSchemaForm` as the owner of per-field action state and render exactly one contextual action per field. Apply the desktop width cap in the existing native calculator container query so narrow and stacked layouts retain their current fluid width.

**Tech Stack:** Next.js 15, React 19, TypeScript, CSS container queries, Vitest, Testing Library

---

### Task 1: Make help and error actions mutually exclusive

**Files:**
- Modify: `components/calculators/input-schema-form.test.tsx`
- Modify: `components/calculators/input-schema-form.tsx`

- [ ] **Step 1: Write the failing interaction test**

Add a test that renders a documented field with `validationErrors`, expects no `Показати опис поля ...` button, expects one `Показати помилку поля ...` button, clicks it, and verifies both the description and error text are visible.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- components/calculators/input-schema-form.test.tsx`

Expected: FAIL because the help and error buttons both render in the invalid row.

- [ ] **Step 3: Render one contextual action**

In `InputSchemaForm`, branch on `errors.length > 0`: render only `!` with `toggleDetails(field.id, "error")` for invalid fields; otherwise render the existing `?` when a description exists. Keep the current error-details block so error mode includes both description and validation messages.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- components/calculators/input-schema-form.test.tsx`

Expected: PASS with no warnings.

### Task 2: Cap the wide inspector column

**Files:**
- Modify: `components/calculator-shell.test.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Write the failing CSS contract test**

Add an assertion that the `@container (min-width: 1180px)` native calculator grid uses `minmax(470px, 720px)` for the controls column.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- components/calculator-shell.test.tsx`

Expected: FAIL because the controls column currently uses `minmax(470px, 1fr)`.

- [ ] **Step 3: Apply the desktop width cap**

Change the wide grid columns to `260px minmax(470px, 720px) minmax(320px, 420px)`. Do not change the base two-column layout or the `max-width: 819px` stacked layout.

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- components/calculator-shell.test.tsx`

Expected: PASS with no warnings.

### Task 3: Verify the complete change

**Files:**
- Verify: `components/calculators/input-schema-form.tsx`
- Verify: `app/globals.css`

- [ ] **Step 1: Run automated verification**

Run: `npm test`, `npm run typecheck`, and `npm run build`.

Expected: all commands exit successfully.

- [ ] **Step 2: Run browser QA**

Start `npm run dev`; use the in-app Browser to inspect a native calculator at a wide desktop viewport and a narrow/mobile viewport. Verify the inspector never exceeds 720px on the wide layout, the stacked layout remains fluid, and an invalid documented field shows only `!` and reveals both help and error text.

- [ ] **Step 3: Review the final diff**

Run: `git diff --check` and `git diff -- app/globals.css components/calculators/input-schema-form.tsx components/calculators/input-schema-form.test.tsx components/calculator-shell.test.tsx`.

Expected: no whitespace errors and only the scoped layout, interaction, and test changes.
