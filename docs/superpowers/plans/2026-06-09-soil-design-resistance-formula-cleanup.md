# Soil Design Resistance Formula Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separate explanatory report text from mathematical formula zones in the `soil-design-resistance` calculator report.

**Architecture:** `SoilDesignResistanceReportStep` supports explanatory `notes` before formulas and `formulas` for multiple equation lines. The UI renders notes as ordinary report text and renders each formula as an equation block with a mathematical `aria-label`.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest.

---

## Agreed Report Text Contract

The canonical text contract is `docs/superpowers/specs/2026-06-09-soil-design-resistance-report-contract.md`. Formula fields must contain only mathematical expressions; explanatory phrases such as normative references, table choices, interpolation descriptions, and condition outcomes must be placed in `notes`.

### Structural Scheme

- Flexible note: `Конструктивна схема: гнучка. γc2 приймається згідно з приміткою 2 до табл. Е.7.`
- Flexible formula: `γc2 = 1.0`
- Rigid interpolation note: `Конструктивна схема: жорстка. Для ґрунту "<тип ґрунту>"<, IL = ...>, L/H = ... коефіцієнт γc2 визначається інтерполяцією згідно з приміткою 3 до табл. Е.7.`
- Rigid interpolation formula: `γc2 = γc2,1.5 + (γc2,4 - γc2,1.5) * (L/H - 1.5) / (4 - 1.5) = ... + (... - ...) * (... - 1.5) / 2.5 = ...`

### Gamma Coefficients

- Automatic note: `Для ґрунту "<тип ґрунту>"<, IL = ...> використовується рядок табл. Е.7: "<рядок табл. Е.7>". Коефіцієнт γc2 приймається за результатом блоку "Конструктивна схема споруди".`
- Formula: `γc1 = ...; γc2 = ...`

### k, M, kz, d1 Check

- `k` notes explain the selected source of `φ11` and `c11`; formula is only `k = 1.0` or `k = 1.1`.
- Exact `Mγ, Mq, Mc` note references tab. Е.8; formula is only `Mγ = ...; Mq = ...; Mc = ...`.
- Interpolated `Mγ, Mq, Mc` note states the bracketing `φa`/`φb` and interpolation source; formulas are three separate mathematical rows.
- `kz` notes contain the `b < 10 м` or `b >= 10 м` condition; formula contains only `kz = ...`.
- `d1 <= d` notes contain whether the condition is satisfied and which values are accepted for formula (Е.1); formula contains only the inequality.

## Implementation Tasks

- [x] Add failing report tests for `notes`, `formula`, and `formulas` separation in `lib/soil-design-resistance.test.ts`.
- [x] Extend `SoilDesignResistanceReportStep` with `notes?: string[]` and `formulas?: string[]`.
- [x] Move agreed explanatory text from mixed formula strings into `notes`.
- [x] Update `components/calculators/soil-design-resistance-calculator.tsx` to render `notes` before equation blocks and render every entry of `formulas`.
- [x] Add CSS for `.soil-resistance-report__notes`.
- [x] Update UI smoke test to verify explanatory text is visible and clean formula `aria-label` remains mathematical.
- [x] Update the canonical report contract spec with the agreed text.

## Verification

- [x] `npm run test -- lib/soil-design-resistance.test.ts`
- [x] `npm run test -- components/calculator-shell.test.tsx -t "soil design resistance"`
- [x] `npm run typecheck`
- [x] `npm run test`
- [x] `npm run build`
