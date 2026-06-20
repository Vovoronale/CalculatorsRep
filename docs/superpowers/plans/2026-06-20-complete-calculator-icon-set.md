# Complete Calculator Icon Set Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a coherent 512 px PNG icon for every registered calculator and enlarge all generated badge text by exactly 50%.

**Architecture:** Keep official ArmCon and LiveBeamCalculator PNGs immutable, and generate the other 42 assets from an explicit definition registry. Make the catalog path resolver uniformly return PNG, validate generator coverage against `data/content.json`, and keep access-mode markers as independent UI overlays.

**Tech Stack:** Next.js, TypeScript, Vitest, SVG markup, Sharp rasterization, Browser/IAB.

---

### Task 1: Require complete PNG and generator coverage

**Files:**
- Modify: `lib/calculator-artwork.ts`
- Modify: `lib/calculator-artwork.test.ts`
- Modify: `lib/calculators.test.ts`

- [ ] **Step 1: Write failing tests for all-PNG paths and 42 generated definitions**

Assert that an existing thermal calculator resolves to PNG, every calculator artwork path ends in `.png`, the generator contains every registered slug except `armcon` and `livebeamcalculator`, and the badge helper defaults are `87` and `51` px.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- lib/calculator-artwork.test.ts lib/calculators.test.ts`

Expected: FAIL because thermal paths still resolve to SVG, 30 PNGs are absent, generator coverage is incomplete, and badge type defaults remain 58/34.

- [ ] **Step 3: Simplify the artwork resolver to PNG-only paths**

Implement:

```ts
export function getCalculatorArtworkPath(slug: string): string {
  return `/calculator-icons/${slug}.png`;
}
```

- [ ] **Step 4: Keep focused tests red only for missing generator/assets**

Run the focused tests again and confirm path assertions pass while generator/asset assertions remain red.

### Task 2: Extend the deterministic generator

**Files:**
- Modify: `scripts/generate-construction-urban-icons.mjs`
- Create: 30 PNG files under `public/calculator-icons/`
- Modify: 12 existing generated PNG files under `public/calculator-icons/`

- [ ] **Step 1: Raise generated badge typography to 87/51 px**

Update the main and subscript helper defaults and adjust baselines/notation-aware widths only where required to prevent clipping.

- [ ] **Step 2: Add approved direction palettes**

Add the eight new fills from the design spec while preserving the five existing direction treatments.

- [ ] **Step 3: Add 30 explicit icon definitions**

Implement every `slug`, silhouette, notation, and palette from `docs/superpowers/specs/2026-06-20-complete-calculator-icon-set-design.md`. Each definition uses one dominant subject and one badge.

- [ ] **Step 4: Generate all 42 deterministic PNG files**

Run: `node scripts/generate-construction-urban-icons.mjs`

Expected: `Generated 42 calculator icons at 512x512.` Official ArmCon and LiveBeam hashes remain unchanged.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run: `npm test -- lib/calculator-artwork.test.ts lib/calculators.test.ts components/calculator-shell.test.tsx`

Expected: PASS.

### Task 3: Visual asset QA

**Files:**
- Modify generator definitions only if QA reveals a concrete visual defect.

- [ ] **Step 1: Build grouped contact sheets**

Create temporary sheets for thermal/floors, bridges, utilities/AI, and the existing construction set. Show each icon at 256 px and a nearest-neighbor enlargement of its real 44 px render.

- [ ] **Step 2: Inspect all 44 icons with `view_image`**

Check exact badge text, 50% type increase, category colors, clipping, silhouette distinction, and official icon preservation. Repair and regenerate any defects.

- [ ] **Step 3: Verify source and output inventory mechanically**

Confirm 44 calculator slugs resolve to 44 existing 512 x 512 PNGs, the generator defines 42 unique slugs, and no temporary asset becomes project-referenced.

### Task 4: Browser and repository verification

**Files:**
- No production changes unless rendered QA identifies a defect.

- [ ] **Step 1: Verify representative category families in Browser/IAB**

Inspect desktop and mobile views for envelope structures, thermal bridges, construction, standards, utilities, and AI. Confirm images load, badges remain readable, markers remain visible, and no horizontal overflow occurs.

- [ ] **Step 2: Exercise one details interaction**

Expand and collapse a catalog row, confirming the artwork and marker remain stable.

- [ ] **Step 3: Run full checks**

Run:

```bash
npm test
npm run typecheck
npm run build
```

Expected: all commands exit successfully.

- [ ] **Step 4: Clean temporary QA artifacts and inspect the final diff**

Run `git diff --check` and `git status --short`. Keep only planned source, tests, documentation, and PNG files.
