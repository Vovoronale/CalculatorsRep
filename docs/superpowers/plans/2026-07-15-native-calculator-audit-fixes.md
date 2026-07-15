# Native Calculator Audit Fixes Implementation Plan

> **For agentic workers:** REQUIRED: Use `superpowers:executing-plans` and complete tasks in order. This run is explicitly authorized by the user to execute inline in the current working directory without a worktree or subagents.

**Goal:** Correct the ten approved algorithm and frontend defects in the native calculators without changing unrelated calculator behavior.

**Architecture:** Keep validation and numerical safety in the TypeScript calculation cores, keep report construction deterministic and contract-driven, and make React components parse user input through the shared strict decimal parser. Treat `values: null` as the blocking-error boundary; retain finite values for reportable engineering failures. Preserve the current JSON-driven schemas and UI structure.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, Testing Library.

**Source of truth:**

- `docs/superpowers/specs/2026-07-15-native-calculator-audit-fixes-design.md`
- `docs/superpowers/specs/2026-06-15-foundation-base-pressure-report-contract.md`
- `docs/superpowers/specs/2026-07-15-foundation-bar-anchorage-report-contract.md`
- `docs/superpowers/specs/2026-06-17-concrete-exposure-class-report-contract.md`
- `docs/superpowers/specs/2026-06-19-residential-yard-areas-report-contract.md`

---

## Task 1: Foundation-base numerical safety

**Files:**

- Modify: `lib/foundation-base-pressure.test.ts`
- Modify: `lib/foundation-base-pressure.ts`

1. Add failing tests for `N_total <= 0`, `ex >= l / 2`, `ey >= b / 2`, and the approved inside-footprint/non-convergent case.
2. Add a valid uplift test that checks integrated force and both centered moments against the targets.
3. Run `npm test -- lib/foundation-base-pressure.test.ts` and confirm the new tests fail for the expected reasons.
4. Reject non-positive total vertical load before eccentricity division and reject boundary/outside resultants before solving.
5. Return convergence state and integrated resultants from the no-tension solver. Use centered moments based on the integrated force and enforce the approved relative residual tolerance independently for force and both moments.
6. On solver failure, return only the input step, exact contract error text, and `values: null`. Update the valid total-force and equilibrium report formulas to the approved text.
7. Re-run the targeted test file and keep all existing cases green.

## Task 2: Foundation-bar anchorage direction and bar-count validation

**Files:**

- Modify: `lib/foundation-bar-anchorage.test.ts`
- Modify: `lib/foundation-bar-anchorage.ts`

1. Add failing tests proving equal downstream results for representative positive and negative total moments and rejecting a fractional beam bar count.
2. Run `npm test -- lib/foundation-bar-anchorage.test.ts` and confirm RED.
3. Calculate `Mtot = |M + Q * h|`, use it for all downstream pressure/force checks, and emit the exact approved report formula.
4. Require beam `n` to be a positive integer with the exact approved error.
5. Re-run the targeted tests.

## Task 3: Steel factor pairing and concrete-exposure incompatibility

**Files:**

- Modify: `lib/steel-structure-category-group.test.ts`
- Modify: `lib/steel-structure-category-group.ts`
- Modify: `lib/concrete-exposure-class.test.ts`
- Modify: `lib/concrete-exposure-class.ts`

1. Add failing steel tests for `p9 × p3` and `p6 × p1` paired candidates.
2. Add a failing exposure test for `X0 + XS3` using the existing exact incompatibility warning.
3. Run both targeted test files and confirm RED.
4. Replace paired individual candidates with their product candidate while retaining every independent unpaired factor; then select the minimum candidate.
5. Include `XS` in the grouped X0 incompatibility condition.
6. Re-run both targeted files.

## Task 4: Strict numeric parsing in seven schema-driven calculators

**Files:**

- Modify: `components/calculators/cassoon-load-distribution-calculator.test.ts`
- Modify: `components/calculators/cassoon-load-distribution-calculator.tsx`
- Modify: `components/calculators/concrete-cover-durability-calculator.test.tsx`
- Modify: `components/calculators/concrete-cover-durability-calculator.tsx`
- Modify: `components/calculators/foundation-bar-anchorage-calculator.test.tsx`
- Modify: `components/calculators/foundation-bar-anchorage-calculator.tsx`
- Modify: `components/calculators/foundation-base-pressure-calculator.test.tsx`
- Modify: `components/calculators/foundation-base-pressure-calculator.tsx`
- Modify: `components/calculators/minimum-reinforcement-calculator.test.tsx`
- Modify: `components/calculators/minimum-reinforcement-calculator.tsx`
- Modify: `components/calculators/residential-yard-areas-calculator.test.tsx`
- Modify: `components/calculators/residential-yard-areas-calculator.tsx`
- Modify: `components/calculators/soil-design-resistance-calculator.test.ts`
- Modify: `components/calculators/soil-design-resistance-calculator.tsx`

1. Add one malformed-value interaction test per component using `10abc`; each must show an error and hide calculated output.
2. Run the seven component test files and confirm RED.
3. Replace permissive `parseFloat` conversions with `parseCalculatorDecimal`; propagate `NaN` rather than a valid fallback for malformed numeric text.
4. Gate summaries, calculated result cards, and DOCX actions on finite report values, not solely on `valid`.
5. Re-run the seven component test files.

## Task 5: Residential blocking errors versus reduced-mode fallback

**Files:**

- Modify: `lib/residential-yard-areas.test.ts`
- Modify: `lib/residential-yard-areas.ts`
- Modify: `components/calculators/residential-yard-areas-calculator.test.tsx`
- Modify: `components/calculators/residential-yard-areas-calculator.tsx`

1. Add failing core tests for a blocking negative/malformed input, each approved fallback-only error, and blocking-error precedence over fallback.
2. Add UI assertions that blocking errors hide result cards and DOCX while fallback-only applicability errors keep the full finite report and export action.
3. Run the two targeted test files and confirm RED.
4. Make report values nullable. Classify only the two exact reduced-mode applicability errors as nonblocking; every other validation error is blocking.
5. For blocking errors return exactly the raw input step, errors, `valid: false`, and `values: null`. Preserve full-rate finite calculations for fallback-only failures.
6. Gate frontend results and export on `report.values !== null`.
7. Re-run the targeted tests.

## Task 6: Rebar-area unit conversion and custom-column deduplication

**Files:**

- Modify: `lib/rebar-area-bars.test.ts`
- Modify: `lib/rebar-area-bars.ts`
- Modify or add: `components/calculators/rebar-area-bars-calculator.test.tsx`
- Modify: `components/calculators/rebar-area-bars-calculator.tsx`

1. Add failing core tests proving custom bar counts/spacings equal to presets are not duplicated.
2. Add failing component tests for `5 cm² → 500 mm² → 0.0005 m²`, reverse conversions, round trips, and preserving invalid/incomplete text during a unit change.
3. Run the targeted core/component tests and confirm RED.
4. Append custom columns only when the numeric value is absent from the preset list.
5. Convert the current finite area through square metres when changing units; otherwise change only the unit selector.
6. Re-run the targeted tests.

## Task 7: Regression and delivery verification

1. Review `git diff --check` and the full diff for unrelated changes, accidental snapshots, or report-contract drift.
2. Run `npm test -- --reporter=dot`.
3. Run `npm run typecheck`.
4. Run `npm run build`.
5. Start the static app and visually verify representative invalid/valid flows for foundation pressure, residential yard areas, and rebar-area units in a real browser.
6. Report the exact verification results and changed files.
