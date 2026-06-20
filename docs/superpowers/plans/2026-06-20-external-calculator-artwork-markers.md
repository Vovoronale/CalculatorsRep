# External Calculator Artwork and Markers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Use the supplied ArmCon and BeamCalc artwork and distinguish embedded and external calculator rows with color-coded upper-right link markers.

**Architecture:** Keep access-mode signaling code-native in the catalog table so artwork remains reusable and untouched. Preserve the existing artwork-path resolver, replace only the two approved PNG files, and exclude those slugs from deterministic generated artwork so regeneration cannot overwrite official product icons.

**Tech Stack:** Next.js, React, TypeScript, Vitest, Lucide React, CSS, Sharp, Windows ICO decoding.

---

### Task 1: Render access-mode markers

**Files:**
- Modify: `components/calculator-shell.test.tsx`
- Modify: `components/calculator-shell.tsx`
- Modify: `app/globals.css`

- [x] **Step 1: Write failing catalog marker tests**

Extend the category-table tests to assert:

```ts
expect(embedRow.querySelector(".calculator-table__access-marker--embed")).toBeInTheDocument();
expect(externalRow.querySelector(".calculator-table__access-marker--external")).toBeInTheDocument();
expect(nativeRow.querySelector(".calculator-table__access-marker")).not.toBeInTheDocument();
```

- [x] **Step 2: Run the focused component tests and verify failure**

Run: `npm test -- components/calculator-shell.test.tsx`

Expected: FAIL because the access-marker elements do not exist.

- [x] **Step 3: Add the artwork wrapper and conditional marker**

Wrap the existing image with `calculator-table__artwork`, and render:

```tsx
{calculator.displayMode === "embed" || calculator.displayMode === "external" ? (
  <span
    className={`calculator-table__access-marker calculator-table__access-marker--${calculator.displayMode}`}
    aria-hidden
  >
    <ExternalLink size={10} />
  </span>
) : null}
```

Add shared positioning, a 16 px square, and the approved blue/orange mode variants. Keep the current image size rules unchanged.

- [x] **Step 4: Run the focused tests and verify pass**

Run: `npm test -- components/calculator-shell.test.tsx`

Expected: PASS.

### Task 2: Convert and protect supplied ICO artwork

**Files:**
- Modify: `public/calculator-icons/armcon.png`
- Modify: `public/calculator-icons/livebeamcalculator.png`
- Modify: `scripts/generate-construction-urban-icons.mjs`
- Modify: `lib/calculators.test.ts`

- [x] **Step 1: Add asset dimension assertions**

Read each PNG IHDR with Node filesystem APIs and assert that ArmCon and LiveBeamCalculator are 512 x 512 PNG files.

- [x] **Step 2: Convert the approved ICO frames**

Extract the flat 256 px PNG frame from `ArmCON_Icon5.ico`. Decode the 256 px BeamCalc ICO frame through `System.Drawing.Icon`, preserve transparency, and resize both to 512 x 512 with Sharp using high-quality interpolation.

- [x] **Step 3: Exclude official icons from generated definitions**

Remove `armcon` and `livebeamcalculator` from `scripts/generate-construction-urban-icons.mjs` so regeneration writes the remaining 12 generated PNG files and leaves official artwork untouched.

- [x] **Step 4: Regenerate and verify assets**

Run:

```bash
node scripts/generate-construction-urban-icons.mjs
npm test -- lib/calculators.test.ts lib/calculator-artwork.test.ts
```

Expected: generator reports 12 generated icons; tests pass and both official PNGs remain 512 x 512.

### Task 3: Visual and project verification

**Files:**
- No production files unless QA reveals a concrete mismatch.

- [x] **Step 1: Inspect source and final icons at native and rendered sizes**

Create temporary comparison sheets for the ICO source, 512 px PNG, and 44 px render. Use `view_image` to verify faithful artwork, transparency, and legibility.

- [x] **Step 2: Verify desktop and mobile catalog states in Browser/IAB**

Verify a category with `embed`, `external`, and `native` rows. Check blue/orange/no-marker behavior, no clipping, no overflow, clean console, and a working details interaction.

- [x] **Step 3: Run full repository checks**

Run:

```bash
npm test
npm run typecheck
npm run build
```

Expected: all commands exit successfully.

- [x] **Step 4: Remove temporary QA files and inspect the final diff**

Run `git diff --check` and `git status --short`. Keep unrelated user files untouched.
