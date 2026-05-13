# Foundation Bar Anchorage Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a native calculator that checks available anchorage length for a foundation reinforcement bar and produces the approved step-by-step report.

**Architecture:** Put all engineering logic, notation, validation, formatting, normative reference metadata, and report generation in `lib/foundation-bar-anchorage.ts`. Keep `components/calculators/foundation-bar-anchorage-calculator.tsx` as a UI layer that groups inputs, renders report formulas, and provides the normative references tab. Register the native calculator through the existing calculator shell and JSON catalog.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, Testing Library.

---

## Chunk 1: Calculation Core

### Task 1: Core Tests And Implementation

**Files:**
- Create: `lib/foundation-bar-anchorage.test.ts`
- Create: `lib/foundation-bar-anchorage.ts`
- Read: `docs/superpowers/specs/2026-05-13-foundation-bar-anchorage-design.md`

- [ ] **Step 1: Write failing core tests**

Create tests for a representative beam case that assert:
- exact report step order
- `MQ`, `Mtot`, `qmax`, `qmin`, `x`, `qx`, `R`
- `ze`, `zi`, `Fs`
- `As,prov`, `sigma_sd`
- `eta1`, `eta2`, `fbd`, `lb,rqd`
- `cd`, `alpha1...alpha5`, `alpha235`
- `lbd`, `lb,min`, `lb,req`, final pass/fail
- warning when `qmin < 0`

- [ ] **Step 2: Run tests to verify RED**

Run: `npm run test -- lib/foundation-bar-anchorage.test.ts`

Expected: FAIL because `@/lib/foundation-bar-anchorage` does not exist.

- [ ] **Step 3: Implement calculation module**

Implement:
- input types and normalized input
- notation dictionary
- normative reference metadata
- numeric formatting helpers
- validation
- calculation helper functions
- `getFoundationBarAnchorageReport`

- [ ] **Step 4: Run core tests to verify GREEN**

Run: `npm run test -- lib/foundation-bar-anchorage.test.ts`

Expected: PASS.

## Chunk 2: Native UI And Registration

### Task 2: Shell Test, Component, Catalog

**Files:**
- Modify: `components/calculator-shell.test.tsx`
- Create: `components/calculators/foundation-bar-anchorage-calculator.tsx`
- Modify: `components/calculator-shell.tsx`
- Modify: `lib/calculators.ts`
- Modify: `data/content.json`
- Modify: `app/globals.css`

- [ ] **Step 1: Write failing shell/UI test**

Add a test that loads `foundation-bar-anchorage` through `getCalculatorBySlug`, renders `CalculatorShell`, asserts grouped controls, final summary, a known formula label, a clickable normative reference, and the normative tab content.

- [ ] **Step 2: Run shell test to verify RED**

Run: `npm run test -- components/calculator-shell.test.tsx`

Expected: FAIL because the calculator is not registered/rendered.

- [ ] **Step 3: Implement component and registration**

Add the native component, import it into `CalculatorShell`, add the native key union, add the JSON catalog entry, and add scoped CSS.

- [ ] **Step 4: Run UI tests to verify GREEN**

Run: `npm run test -- lib/foundation-bar-anchorage.test.ts components/calculator-shell.test.tsx`

Expected: PASS.

## Chunk 3: Verification

### Task 3: Full Project Checks

**Files:**
- No direct edits expected unless verification finds issues.

- [ ] **Step 1: Run typecheck**

Run: `npm run typecheck`

Expected: PASS.

- [ ] **Step 2: Run build**

Run: `npm run build`

Expected: PASS.
