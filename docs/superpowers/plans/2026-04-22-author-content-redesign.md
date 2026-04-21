# Author Content Redesign Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rework the site content around Ivaneiko Volodymyr's personal brand while keeping the homepage calculator-first and adding a dedicated `/author` page.

**Architecture:** Keep the existing calculator shell and route structure, but replace flat content records with category-aware content objects for homepage projects and author-page assistants. Implement the author page as a dedicated route that reuses the site's visual language while carrying the stronger personal-brand narrative.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest, Testing Library

---

## Chunk 1: Data Model And Failing Tests

### Task 1: Add failing tests for the new homepage and author page behavior

**Files:**
- Modify: `I:\CalculatorsRep\components\calculator-shell.test.tsx`
- Create: `I:\CalculatorsRep\app\author\page.test.tsx`
- Reference: `I:\CalculatorsRep\docs\superpowers\specs\2026-04-22-author-content-redesign-design.md`

- [ ] **Step 1: Write the failing homepage test expectations**

Add expectations for:
- `Іванейко Володимир`
- absence of `GitHub`
- presence of `/author`
- project category headings
- electrical calculations project card

- [ ] **Step 2: Write the failing author page tests**

Add expectations for:
- hero text with `CTO / Head of AI R&D`
- categorized project sections
- `ШІ-асистенти` heading
- real assistant links from `dbnassistant.com`

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- components/calculator-shell.test.tsx app/author/page.test.tsx`
Expected: FAIL because the homepage copy, navigation, project structure, and `/author` route do not exist yet.

- [ ] **Step 4: Commit**

```bash
git add components/calculator-shell.test.tsx app/author/page.test.tsx
git commit -m "test: cover author content redesign"
```

### Task 2: Reshape content data for categorized projects and assistants

**Files:**
- Modify: `I:\CalculatorsRep\lib\site-content.ts`
- Modify: `I:\CalculatorsRep\lib\projects.ts`

- [ ] **Step 1: Write minimal content structures**

Add:
- rewritten site copy for homepage and author teaser
- categorized project data
- separate assistant data entries with real ChatGPT links

- [ ] **Step 2: Run focused tests**

Run: `npm test -- components/calculator-shell.test.tsx app/author/page.test.tsx`
Expected: still FAIL, but with rendering/layout-level failures instead of missing data assumptions.

- [ ] **Step 3: Commit**

```bash
git add lib/site-content.ts lib/projects.ts
git commit -m "feat: add categorized author content data"
```

## Chunk 2: Homepage Rendering

### Task 3: Update the calculator shell to render the new homepage content

**Files:**
- Modify: `I:\CalculatorsRep\components\calculator-shell.tsx`

- [ ] **Step 1: Implement minimal homepage rendering changes**

Update the shell to:
- use the new author name
- remove GitHub from navigation through content data
- render project categories instead of a flat project list
- replace the old footer-note content with a short author teaser and CTA to `/author`

- [ ] **Step 2: Run the focused tests**

Run: `npm test -- components/calculator-shell.test.tsx`
Expected: PASS

- [ ] **Step 3: Refactor names and markup if needed while keeping tests green**

- [ ] **Step 4: Commit**

```bash
git add components/calculator-shell.tsx
git commit -m "feat: redesign homepage author content"
```

## Chunk 3: Author Page

### Task 4: Build the dedicated author page

**Files:**
- Create: `I:\CalculatorsRep\app\author\page.tsx`

- [ ] **Step 1: Implement the minimal `/author` page**

Render:
- hero block with positioning
- narrative text
- work directions
- categorized project groups
- `ШІ-асистенти` cards with real links

- [ ] **Step 2: Run the focused tests**

Run: `npm test -- app/author/page.test.tsx`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/author/page.tsx
git commit -m "feat: add author profile page"
```

## Chunk 4: Styling And Full Verification

### Task 5: Extend shared styles for project categories and author page sections

**Files:**
- Modify: `I:\CalculatorsRep\app\globals.css`

- [ ] **Step 1: Add only the styles required by the new structures**

Support:
- categorized project groups
- author hero and sections
- assistants grid/cards
- responsive behavior for the new page

- [ ] **Step 2: Run test and build verification**

Run: `npm test`
Expected: PASS

Run: `npm run typecheck`
Expected: PASS

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "style: support author content redesign"
```

### Task 6: Final review against the spec

**Files:**
- Reference: `I:\CalculatorsRep\docs\superpowers\specs\2026-04-22-author-content-redesign-design.md`

- [ ] **Step 1: Re-read the spec and verify acceptance criteria one by one**

- [ ] **Step 2: Run final verification again before reporting status**

Run: `npm test && npm run typecheck && npm run build`
Expected: all commands succeed

- [ ] **Step 3: Prepare handoff summary with changed files and any residual risks**
