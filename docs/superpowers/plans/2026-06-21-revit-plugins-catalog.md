# Revit Plugins Catalog Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a visible `Revit плагіни` category to the calculator catalog with `Revit Screenshot Plugin` linking directly to its existing internal product page.

**Architecture:** Keep category and item content JSON-driven. Extend the catalog model with a `product` display mode and one canonical href helper, then use the helper in the directory table and global search while excluding product items from calculator route generation and calculator sitemap entries.

**Tech Stack:** Next.js App Router, React, TypeScript, JSON content, Vitest, Testing Library.

---

## Chunk 1: Catalog model and routing

### Task 1: Define the Revit category and product catalog item

**Files:**
- Modify: `lib/calculators.test.ts`
- Modify: `data/content.json`
- Modify: `lib/calculators.ts`
- Modify: `lib/icons.ts`

- [ ] Add failing tests that require `revit-plaginy` after the thermal categories, require exactly one `revit-screenshot-plugin` item, and require its `product` mode, `/products/revit-screenshot` href, and `Revit 2024–2026` version text.
- [ ] Add failing tests for `getCalculatorCatalogHref()` and `calculatorPageCalculators`, requiring product items to resolve to `openUrl` and remain absent from calculator page generation.
- [ ] Run `npm test -- lib/calculators.test.ts` and confirm failures are caused by the missing category, item, mode, and helpers.
- [ ] Add the category and item to `data/content.json`, extend `CategorySlug` and `DisplayMode`, export `getCalculatorCatalogHref()` and `calculatorPageCalculators`, and register the `Box` fallback icon.
- [ ] Re-run `npm test -- lib/calculators.test.ts` and confirm it passes.
- [ ] Commit with `feat: add Revit plugins catalog data`.

### Task 2: Use canonical product routing

**Files:**
- Modify: `components/calculator-shell.test.tsx`
- Create: `components/search-input.test.tsx`
- Modify: `components/calculator-shell.tsx`
- Modify: `components/search-input.tsx`
- Modify: `app/calculator/[slug]/page.tsx`
- Modify: `app/sitemap.ts`
- Modify: `app/sitemap.test.ts`

- [ ] Add a failing directory test that renders `CalculatorShell` with `selectedCategory="revit-plaginy"`, finds the Revit row, requires `href="/products/revit-screenshot"`, and requires no embed/external access marker.
- [ ] Add a failing search test that enters `Revit Screenshot` and requires the result href to be `/products/revit-screenshot`.
- [ ] Extend the sitemap test to require the product URL only once and no `/calculator/revit-screenshot-plugin` URL.
- [ ] Run the focused tests and confirm the routing expectations fail against the current implementation.
- [ ] Use `getCalculatorCatalogHref()` in the directory table and search results.
- [ ] Use `calculatorPageCalculators` in `generateStaticParams()` and calculator sitemap generation.
- [ ] Re-run the focused tests and confirm they pass.
- [ ] Commit with `feat: link Revit plugin from calculator catalog`.

## Chunk 2: Verification and integration

### Task 3: Verify and publish

**Files:**
- Verify only unless a failure identifies an in-scope defect.

- [ ] Run `npm test` and confirm all test files pass.
- [ ] Run `npm run typecheck` and confirm exit code 0.
- [ ] Run `npm run build` and confirm the static export includes `/products/revit-screenshot` and does not include `/calculator/revit-screenshot-plugin`.
- [ ] Run the dev server and verify desktop and mobile catalog behavior: the `Revit плагіни` category shows count 1, its table contains the plugin, and clicking the item opens the internal product page in the current tab without console errors.
- [ ] Review `git diff origin/main...HEAD` and confirm only the approved catalog change and its documentation are present.
- [ ] Merge the branch to `main`, push `main`, monitor the deployment, and verify the production catalog and product navigation.
