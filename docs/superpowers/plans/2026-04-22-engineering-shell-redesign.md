# Engineering Shell Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the site into a strict engineering shell with a persistent left calculator rail and a route-specific right working area.

**Architecture:** Keep the existing Next.js routes and calculator data model, but recompose `CalculatorShell` into a two-column shell shared by the homepage and calculator detail routes. Align `/author` to the same shell language, preserve hash-based category switching on the homepage, and replace the current panel-heavy visuals with a light technical system driven by typography, dividers, and spacing.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest, Testing Library, global CSS

---

## Chunk 1: Behavioral Contracts

### Task 1: Redefine homepage and calculator detail expectations

**Files:**
- Modify: `I:\CalculatorsRep\components\calculator-shell.test.tsx`
- Reference: `I:\CalculatorsRep\docs\superpowers\specs\2026-04-22-engineering-shell-redesign-design.md`

- [ ] **Step 1: Write the failing homepage shell test**

Add assertions for:
- left rail landmark and right content landmark
- category label and category list in the left rail
- calculator links rendered in the left rail for the active category
- homepage right panel heading and active category heading
- secondary `/author` link in the main content area
- absence of old card-oriented headings that no longer belong to the homepage

- [ ] **Step 2: Write the failing calculator detail shell expectations**

Add assertions for:
- active calculator link shown in the left rail
- calculator title and description in the right content area
- `iframe` preserved for embedded tools
- external fallback preserved for non-embedded tools

- [ ] **Step 3: Run focused shell tests to verify RED**

Run: `npm test -- components/calculator-shell.test.tsx`
Expected: FAIL because the current markup still uses the old centered shell and does not expose the approved left-rail structure.

- [ ] **Step 4: Commit**

```bash
git add components/calculator-shell.test.tsx
git commit -m "test: define engineering shell behavior"
```

### Task 2: Extend author-page tests to the new shared shell

**Files:**
- Modify: `I:\CalculatorsRep\app\author\page.test.tsx`
- Reference: `I:\CalculatorsRep\docs\superpowers\specs\2026-04-22-engineering-shell-redesign-design.md`

- [ ] **Step 1: Write the failing author shell assertions**

Add assertions for:
- shared left rail visible on `/author`
- author content rendered in the right content area
- project category headings still present
- assistant links still present

- [ ] **Step 2: Run focused author test to verify RED**

Run: `npm test -- app/author/page.test.tsx`
Expected: FAIL because the current author page is a standalone layout outside the shared shell.

- [ ] **Step 3: Commit**

```bash
git add app/author/page.test.tsx
git commit -m "test: cover author page engineering shell"
```

## Chunk 2: Shared Data And Shell Composition

### Task 3: Adjust shared content records for the engineering shell

**Files:**
- Modify: `I:\CalculatorsRep\lib\site-content.ts`

- [ ] **Step 1: Add the copy required by the new shell**

Define:
- left-rail descriptive copy
- right-panel homepage intro copy
- author CTA copy suited to the new layout
- any renamed labels for category or calculator sections

- [ ] **Step 2: Run focused tests**

Run: `npm test -- components/calculator-shell.test.tsx app/author/page.test.tsx`
Expected: still FAIL, but with layout-level failures rather than missing content strings.

- [ ] **Step 3: Commit**

```bash
git add lib/site-content.ts
git commit -m "content: adapt copy for engineering shell"
```

### Task 4: Recompose `CalculatorShell` around the left rail

**Files:**
- Modify: `I:\CalculatorsRep\components\calculator-shell.tsx`

- [ ] **Step 1: Implement the minimal homepage shell to satisfy the new tests**

Render:
- shared shell wrapper
- left rail with brand, utility navigation, categories, and calculators for the active category
- right content area for homepage intro and active-category list

- [ ] **Step 2: Run shell tests**

Run: `npm test -- components/calculator-shell.test.tsx`
Expected: homepage assertions PASS, detail assertions may still need follow-up.

- [ ] **Step 3: Extend the shell for calculator detail mode**

Ensure the left rail remains visible and active states reflect the selected calculator while the right panel renders detail content.

- [ ] **Step 4: Run shell tests again**

Run: `npm test -- components/calculator-shell.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/calculator-shell.tsx
git commit -m "feat: build shared engineering calculator shell"
```

### Task 5: Align `/author` with the shared shell

**Files:**
- Modify: `I:\CalculatorsRep\app\author\page.tsx`

- [ ] **Step 1: Implement the minimal author page inside the shared shell language**

Render:
- shared left rail via a reusable shell composition or equivalent structure
- author content in the right panel
- existing categories and assistant links preserved

- [ ] **Step 2: Run focused author test**

Run: `npm test -- app/author/page.test.tsx`
Expected: PASS

- [ ] **Step 3: Run shell regression tests**

Run: `npm test -- components/calculator-shell.test.tsx app/author/page.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add app/author/page.tsx
git commit -m "feat: move author page into engineering shell"
```

## Chunk 3: Visual System

### Task 6: Rewrite global styles for the engineering layout

**Files:**
- Modify: `I:\CalculatorsRep\app\globals.css`

- [ ] **Step 1: Replace the old panel-heavy system with the new engineering palette and spacing**

Add styles for:
- shell grid
- sticky left rail
- technical category selectors
- left-rail calculator list
- open right content region
- author sections inside the new shell

Remove or replace:
- soft panel surfaces as the default structure
- chip-heavy category treatment
- card-first homepage composition

- [ ] **Step 2: Run focused UI tests**

Run: `npm test -- components/calculator-shell.test.tsx app/author/page.test.tsx`
Expected: PASS

- [ ] **Step 3: Refactor class names only if tests stay green**

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "style: apply engineering shell visual system"
```

## Chunk 4: Final Verification

### Task 7: Verify routes, types, and build output

**Files:**
- Reference: `I:\CalculatorsRep\docs\superpowers\specs\2026-04-22-engineering-shell-redesign-design.md`

- [ ] **Step 1: Re-read the spec and compare acceptance criteria to the implementation**

- [ ] **Step 2: Run all tests**

Run: `npm test`
Expected: PASS

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Run production build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 5: Prepare handoff summary with changed files, verification results, and residual UX risks**
