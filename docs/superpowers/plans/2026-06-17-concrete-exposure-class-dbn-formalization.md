# Concrete Exposure Class DBN Formalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace informal concrete exposure class inputs/report text with formal DBN table 4.1 row-driven fields and report steps, while keeping XS as a separate DSTU ENV/EN 206 block.

**Architecture:** The report contract at `docs/superpowers/specs/2026-06-17-concrete-exposure-class-report-contract.md` is the source of truth. `lib/concrete-exposure-class.ts` owns row data, class selection, minimum concrete classes, warnings, and report steps. `components/calculators/concrete-exposure-class-calculator.tsx` remains a thin schema/form/report adapter.

**Tech Stack:** TypeScript, React, Next.js App Router, Vitest, Testing Library, existing `InputSchemaForm`, `NativeReport`, and DOCX report helpers.

---

## Source Documents

- Contract: `docs/superpowers/specs/2026-06-17-concrete-exposure-class-report-contract.md`
- Design: `docs/superpowers/specs/2026-06-17-concrete-exposure-class-design.md`
- Guide: `docs/calculation-reporting-guide.md`

If this plan differs from the contract, follow the contract and update this plan.

## File Map

- Modify `lib/concrete-exposure-class.test.ts`: RED tests for formal DBN rows, RH labels, minimum concrete classes, XS separation, governing class.
- Modify `lib/concrete-exposure-class.ts`: row-driven types, DBN row dictionaries, report builder, values shape, warnings/errors.
- Modify `components/calculators/concrete-exposure-class-calculator.test.tsx`: RED tests for formal schema labels, normative references, UI summary.
- Modify `components/calculators/concrete-exposure-class-calculator.tsx`: row-driven schema and input parsing.
- Modify `data/content.json`, `lib/calculators.test.ts`: catalog copy no longer claims XS is DBN table 4.1.
- Run targeted tests, typecheck, and build.

## Task 1: Core RED Tests

**Files:**
- Modify: `lib/concrete-exposure-class.test.ts`
- Test: `lib/concrete-exposure-class.test.ts`

- [ ] **Step 1: Replace core tests with contract-driven expectations**

Use tests that assert:

```ts
expect(reportFor({ carbonationExposureRow: "X0" }).steps.find((step) => step.key === "x0-xc")?.items).toContain(
  "Характеристика середовища: Відсутнє поперемінно заморожування-відтавання, хімічні дії, стирання тощо. Дуже сухий повітряно-вологісний режим (RH <= 30 %).",
);
expect(reportFor({ carbonationExposureRow: "XC1" }).values?.exposureClasses).toEqual(["XC1"]);
expect(reportFor({ carbonationExposureRow: "XC3" }).steps.find((step) => step.key === "x0-xc")?.formula).toBe(
  "X0/XC = рядок таблиці 4.1: Помірний повітряно-вологісний режим (60 % < RH <= 75 %) або експлуатація в умовах епізодичного вологонасичення. => XC3",
);
```

Also test `XD1`, `XF4`, `XA3`, `XS2`, minimum concrete classes excluding XS, and the warning for `X0` with additional aggressive classes.

- [ ] **Step 2: Run core tests and verify RED**

Run:

```bash
npm run test -- lib/concrete-exposure-class.test.ts
```

Expected: FAIL because the production core still uses `moistureCondition`, old keys, and old report steps.

## Task 2: Core Implementation

**Files:**
- Modify: `lib/concrete-exposure-class.ts`
- Test: `lib/concrete-exposure-class.test.ts`

- [ ] **Step 1: Implement row-driven core**

Replace informal inputs with:

```ts
export type CarbonationExposureRow = "X0" | "XC1" | "XC2" | "XC3" | "XC4";
export type XdExposureRow = "none" | "XD1" | "XD2" | "XD3";
export type XsExposureRow = "none" | "XS1" | "XS2" | "XS3";
export type XfExposureRow = "none" | "XF1" | "XF2" | "XF3" | "XF4";
export type XaExposureRow = "none" | "XA1" | "XA2" | "XA3" | "unknown_requires_classification";
```

Add DBN row data dictionaries exactly from the contract, including RH ranges and minimum concrete classes.

- [ ] **Step 2: Run core tests and verify GREEN**

Run:

```bash
npm run test -- lib/concrete-exposure-class.test.ts
```

Expected: PASS.

## Task 3: UI RED Tests

**Files:**
- Modify: `components/calculators/concrete-exposure-class-calculator.test.tsx`
- Test: `components/calculators/concrete-exposure-class-calculator.test.tsx`

- [ ] **Step 1: Replace UI schema expectations**

Assert that visible fields include:

```text
Клас X0/XC за таблицею 4.1 ДБН
Хлориди не з морської води XD за таблицею 4.1 ДБН
Хлориди морського походження XS за ДСТУ ENV/EN 206
Поперемінне заморожування-відтавання XF за таблицею 4.1 ДБН
Хімічні та біологічні дії XA за таблицею 4.1 ДБН
```

Assert that old `moistureCondition`, `chlorideSource`, and `freezeThawRisk` fields are absent.

- [ ] **Step 2: Run UI tests and verify RED**

Run:

```bash
npm run test -- components/calculators/concrete-exposure-class-calculator.test.tsx
```

Expected: FAIL because UI still uses informal fields.

## Task 4: UI Implementation

**Files:**
- Modify: `components/calculators/concrete-exposure-class-calculator.tsx`
- Test: `components/calculators/concrete-exposure-class-calculator.test.tsx`

- [ ] **Step 1: Implement row-driven schema and parser**

Replace schema fields and casts to use the new core types. Keep query-param prefill for existing shared fields only: `elementName`, `elementType`, `reinforcementPresence`, `currentExposureClass`.

- [ ] **Step 2: Update normative references UI**

Render the four references from the contract:

```text
ДБН В.2.6-98:2009, розділ 4.3, таблиця 4.1
ДБН В.2.6-98:2009, таблиці 4.1(a) і 4.1(b)
ДСТУ ENV/EN 206, група XS
ДСТУ Б В.2.6-145
```

- [ ] **Step 3: Run UI and core tests**

Run:

```bash
npm run test -- lib/concrete-exposure-class.test.ts components/calculators/concrete-exposure-class-calculator.test.tsx
```

Expected: PASS.

## Task 5: Catalog And Registry Copy

**Files:**
- Modify: `data/content.json`
- Modify: `lib/calculators.test.ts`
- Test: `lib/calculators.test.ts`

- [ ] **Step 1: Update catalog tests**

Assert `standard` and SEO/use-case copy references DBN table 4.1 and DSTU ENV/EN 206 for XS without saying XS is table 4.1.

- [ ] **Step 2: Run registry tests and verify RED**

Run:

```bash
npm run test -- lib/calculators.test.ts
```

Expected: FAIL before catalog copy is updated.

- [ ] **Step 3: Update catalog copy**

Update `data/content.json` for the calculator entry.

- [ ] **Step 4: Run registry tests and verify GREEN**

Run:

```bash
npm run test -- lib/calculators.test.ts
```

Expected: PASS.

## Task 6: Verification

**Files:**
- Test all touched behavior.

- [ ] **Step 1: Run targeted tests**

```bash
npm run test -- lib/concrete-exposure-class.test.ts components/calculators/concrete-exposure-class-calculator.test.tsx lib/calculators.test.ts components/calculator-shell.test.tsx
```

- [ ] **Step 2: Run typecheck**

```bash
npm run typecheck
```

- [ ] **Step 3: Run build**

```bash
npm run build
```

- [ ] **Step 4: Browser smoke check**

Open:

```text
http://127.0.0.1:3000/calculator/concrete-exposure-class
```

Check that formal fields render, default report includes DBN table 4.1 wording, and selecting `XS` shows the DSTU ENV/EN 206 note.

## Plan Self-Review

- Spec coverage: covers formal row-driven UI, DBN 4.1 labels/RH, XS separation, minimum concrete classes, warnings, handoff, catalog copy, and verification.
- Placeholder scan: no TBD/TODO markers.
- Type consistency: uses `carbonationExposureRow`, `xdExposureRow`, `xsExposureRow`, `xfExposureRow`, `xaExposureRow`, and `hasChemicalAggressivenessConfirmation` consistently.
