# Foundation Base Pressure Uplift Actions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the visible no-tension solver explanation with an engineering report sequence that shows the uplift scheme, zero-pressure-line dimensions, uplift area, and uplift share as explicit actions.

**Architecture:** Keep the existing numerical contact solution as an internal way to locate the zero-pressure line. Expose report values as engineering quantities: negative corner points, `c1`, `c2`, `A_lift`, `P_lift`, and final contact stresses. Render the report as action-oriented notes plus formulas.

**Tech Stack:** Next.js App Router, TypeScript, Vitest, existing native report formula renderer.

---

### Task 1: Contract

**Files:**
- Modify: `docs/superpowers/specs/2026-06-15-foundation-base-pressure-report-contract.md`

- [x] Replace the visible `p0`, `ax`, `ay` report block with action-oriented report rules.
- [x] Add exact formulas for one-corner triangular uplift:
  `A_lift = c1 * c2 / 2`
  `P_lift = A_lift / A * 100`
- [x] Add exact formulas for two-corner trapezoidal uplift:
  `A_lift = (c1 + c2) / 2 * b`
  `P_lift = A_lift / A * 100`

### Task 2: RED Tests

**Files:**
- Modify: `lib/foundation-base-pressure.test.ts`

- [x] Add a failing test for the two-corner example requiring:
  - no visible `p0`, `ax`, `ay`;
  - negative corners `3` and `4`;
  - trapezoid text;
  - `A_lift = (c1 + c2) / 2 * b = ... м²`;
  - `P_lift = A_lift / A * 100 = ...%`.
- [x] Add a failing test for the one-corner example requiring:
  - negative corner `4`;
  - triangle text;
  - `A_lift = c1 * c2 / 2 = ... м²`;
  - `P_lift = A_lift / A * 100 = ...%`.

### Task 3: Implementation

**Files:**
- Modify: `lib/foundation-base-pressure.ts`

- [x] Add `upliftAreaM2` to uplift result variants with uplift.
- [x] Derive negative corner point numbers from `σ1...σ4 < 0`.
- [x] Replace the visible contact-model step with explicit action steps.
- [x] Render `c1`, `c2`, `A_lift`, `P_lift`, and final contact stresses with numeric substitutions.

### Task 4: Verification

**Commands:**
- `npm test -- lib/foundation-base-pressure.test.ts components/calculators/foundation-base-pressure-calculator.test.tsx`
- `npm test`
- `npm run typecheck`
- `npm run build`

- [x] Verify the report in the in-app browser at `http://localhost:3000/calculator/foundation-base-pressure`.
- [x] Commit the completed changes.
