# Calculator Icon Column Heading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the visible and accessible `Іконка` heading from the calculator catalog table while preserving its icon column and images.

**Architecture:** Keep the existing four-column table structure and render the icon-column header as an empty `<th>`. Update the existing component test first so it proves the heading is absent and the icon image remains accessible.

**Tech Stack:** Next.js, React, TypeScript, Vitest, Testing Library

---

### Task 1: Remove the icon column heading

**Files:**
- Modify: `components/calculator-shell.test.tsx:81`
- Modify: `components/calculator-shell.tsx:297`

- [x] **Step 1: Write the failing test**

Replace the positive heading assertion with:

```tsx
expect(
  within(table).queryByRole("columnheader", { name: "Іконка" }),
).not.toBeInTheDocument();
```

Keep the existing image assertion later in the same test to cover preservation of the icon.

- [x] **Step 2: Run the focused test to verify it fails**

Run: `npm test -- components/calculator-shell.test.tsx -t "renders category-only navigation"`

Expected: FAIL because the table still contains a column header named `Іконка`.

- [x] **Step 3: Write the minimal implementation**

Change the icon-column heading to:

```tsx
<th className="calculator-table__image-heading" scope="col" />
```

- [x] **Step 4: Run verification**

Run: `npm test -- components/calculator-shell.test.tsx -t "renders category-only navigation"`

Expected: PASS.

Run: `npm run typecheck`

Expected: exit code 0.

Run: `npm run build`

Expected: exit code 0.

- [x] **Step 5: Review the diff**

Run: `git diff --check` and inspect the scoped diff for the two modified component files. Do not commit implementation changes unless requested.
