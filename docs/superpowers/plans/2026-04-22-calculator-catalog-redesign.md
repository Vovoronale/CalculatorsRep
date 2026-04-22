# Calculator Catalog Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the homepage into a light, catalog-first interface that helps users find calculators by task type quickly while keeping the author page separate.

**Architecture:** Keep the existing Next.js route structure and calculator behavior, but simplify the homepage information architecture around a compact header, hero, top-level category selector, and primary calculator list. Replace the dark panel-heavy shell with a light editorial utility system shared with the `/author` page.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest, Testing Library, global CSS

---

## Chunk 1: Tests And Content Contracts

### Task 1: Update homepage tests to describe the new catalog-first structure

**Files:**
- Modify: `I:\CalculatorsRep\components\calculator-shell.test.tsx`
- Reference: `I:\CalculatorsRep\docs\superpowers\specs\2026-04-22-calculator-catalog-redesign-design.md`

- [ ] **Step 1: Write the failing homepage expectations**

Add assertions for:
- hero heading with catalog-first wording
- category selector rendered near the top
- calculator list items still present
- absence of homepage project showcase and author teaser sections
- `/author` link still present

- [ ] **Step 2: Run the focused homepage test to verify it fails**

Run: `npm test -- components/calculator-shell.test.tsx`
Expected: FAIL because the current shell still renders the old dark multi-section layout.

- [ ] **Step 3: Commit**

```bash
git add components/calculator-shell.test.tsx
git commit -m "test: cover catalog-first homepage redesign"
```

### Task 2: Adjust shared content records for the new homepage copy

**Files:**
- Modify: `I:\CalculatorsRep\lib\site-content.ts`

- [ ] **Step 1: Rewrite homepage copy to match the approved catalog positioning**

Define:
- new hero title
- new hero description
- category selector label/help text
- footer/service copy

- [ ] **Step 2: Run the focused homepage test**

Run: `npm test -- components/calculator-shell.test.tsx`
Expected: still FAIL, but now because rendering and styles still reflect the old structure.

- [ ] **Step 3: Commit**

```bash
git add lib/site-content.ts
git commit -m "content: rewrite homepage catalog copy"
```

## Chunk 2: Homepage Structure

### Task 3: Recompose the calculator shell around the new information architecture

**Files:**
- Modify: `I:\CalculatorsRep\components\calculator-shell.tsx`

- [ ] **Step 1: Implement the minimal structural changes**

Update the shell to render:
- compact top bar
- hero / quick-entry block
- top-level category selector instead of dominant sidebar
- main calculator catalog as the primary content
- minimal footer only

Remove homepage-only rendering for:
- project categories section
- author teaser block

- [ ] **Step 2: Run the homepage and author tests**

Run: `npm test -- components/calculator-shell.test.tsx app/author/page.test.tsx`
Expected: homepage test PASS, author page test still PASS.

- [ ] **Step 3: Refactor markup names if needed while keeping tests green**

- [ ] **Step 4: Commit**

```bash
git add components/calculator-shell.tsx
git commit -m "feat: simplify homepage into calculator catalog"
```

## Chunk 3: Visual System

### Task 4: Rewrite global styles into the approved editorial utility direction

**Files:**
- Modify: `I:\CalculatorsRep\app\globals.css`

- [ ] **Step 1: Implement the light visual system**

Apply:
- light background and dark text
- restrained accent color
- compact top bar
- calm hero composition
- horizontal or wrapped category selector
- list-first calculator rows
- quiet footer

Remove:
- dark gradients
- blur/glass panel styling
- dominant sidebar styling
- unnecessary shadows

- [ ] **Step 2: Align the `/author` page styling with the same system**

Keep the author page separate, but ensure it inherits the same typography, spacing, and light-theme structure.

- [ ] **Step 3: Run focused tests**

Run: `npm test -- components/calculator-shell.test.tsx app/author/page.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add app/globals.css
git commit -m "style: apply editorial catalog visual system"
```

## Chunk 4: Verification

### Task 5: Run full verification and compare against the spec

**Files:**
- Reference: `I:\CalculatorsRep\docs\superpowers\specs\2026-04-22-calculator-catalog-redesign-design.md`

- [ ] **Step 1: Re-read the spec and confirm the homepage no longer mixes catalog and author content**

- [ ] **Step 2: Run the full test suite**

Run: `npm test`
Expected: PASS

- [ ] **Step 3: Run typecheck**

Run: `npm run typecheck`
Expected: PASS

- [ ] **Step 4: Run production build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 5: Prepare handoff summary with changed files and any residual UX risks**
