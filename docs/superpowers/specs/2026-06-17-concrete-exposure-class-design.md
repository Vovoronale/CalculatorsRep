# Design Spec: Concrete Exposure Class Calculator

Date: 2026-06-17
Project: `construction-calculators-hub`
Status: Awaiting user review

## Context

The project needs a standalone native calculator for determining environmental exposure classes for concrete and reinforced concrete elements:

```text
Калькулятор класу впливу середовища (клас експлуатації)
```

This calculator is logically used before the future concrete cover durability calculator. It determines the full set of environmental exposure classes and returns one governing class from `X0/XC/XD/XS` for the durability cover table.

The agreed report text, display rules, formula strings, warnings, errors, and handoff parameters are captured separately in [`2026-06-17-concrete-exposure-class-report-contract.md`](2026-06-17-concrete-exposure-class-report-contract.md). Implementation plans, tests, and code must treat that file as the source of truth.

Normative references must remain flexible before final release. The current design references DBN V.2.6-98 and DSTU ENV/EN 206 class concepts, but the catalog and UI must remind users to verify the currently valid standard before applying the result in a project.

## Goals

- Add a standalone native calculator for environmental exposure class selection.
- Produce a Ukrainian step-by-step report through the existing `NativeReport` model.
- Return:
  - `exposure_classes`;
  - `governing_cover_exposure_class`;
  - `additional_durability_requirements`;
  - `warnings`;
  - `errors`;
  - `valid`.
- Preserve `XF` and `XA` as additional durability requirements.
- Do not pass `XF` or `XA` as the main `exposureClass` into the cover durability calculator.
- Support query-parameter prefill when opened from the future concrete cover durability calculator.
- Support a return link that fills the `exposureClass` select in the future cover durability calculator.
- Keep all engineering logic in `lib/concrete-exposure-class.ts`, outside React UI.

## Non-Goals

- Do not calculate `XA1/XA2/XA3` from chemical concentrations in the first version.
- Do not calculate concrete composition, frost resistance, water tightness, or air entrainment requirements.
- Do not implement the concrete cover durability calculator in this spec.
- Do not implement the fire cover calculator in this spec.
- Do not create a multi-step wizard in the first version.
- Do not make `environment_location` a separate input in the first version; use direct engineering condition fields instead.

## Architecture

Expected files:

```text
lib/concrete-exposure-class.ts
lib/concrete-exposure-class.test.ts
components/calculators/concrete-exposure-class-calculator.tsx
components/calculators/concrete-exposure-class-calculator.test.tsx
lib/calculators.ts
components/calculator-shell.tsx
data/content.json
app/globals.css
components/calculator-shell.test.tsx
```

The calculation module exports:

```ts
export type ConcreteExposureClassInput = {
  elementName: string;
  elementType: ConcreteExposureElementType;
  reinforcementPresence: ReinforcementPresence;
  carbonationMoistureCondition: CarbonationMoistureCondition;
  chlorideSource: ChlorideSource;
  chlorideMoistureCondition: ChlorideMoistureCondition;
  freezeThawRisk: FreezeThawRisk;
  chemicalAttackRisk: ChemicalAttackRisk;
  hasSoilOrGroundwaterAnalysis: boolean;
  currentExposureClass?: CoverExposureClass;
};
```

The report module shape follows the native calculator pattern:

```ts
export type ConcreteExposureClassReportStep = {
  key: string;
  caption: string;
  items?: string[];
  notes?: string[];
  formula?: string;
  formulas?: string[];
};

export type ConcreteExposureClassReport = {
  input: ConcreteExposureClassInput;
  valid: boolean;
  errors: string[];
  warnings: string[];
  values: ConcreteExposureClassValues | null;
  steps: ConcreteExposureClassReportStep[];
};
```

## Input UI

Use the shared `InputSchemaForm` with these groups:

```text
Елемент
Корозія арматури
Хлориди
Мороз і хімічна агресія
```

Fields:

```text
Назва елемента
Тип елемента
Армування або металеві закладні
Вологісний режим для карбонізації
Джерело хлоридів
Вологісний режим для хлоридів
Морозний вплив
Хімічна агресія
Є аналіз ґрунту або води
```

Conditional UI:

- Show `Вологісний режим для хлоридів` only when `chloride_source != none`.
- Show `Є аналіз ґрунту або води` only when `chemical_attack_risk != none`.
- If `currentExposureClass` is provided from query params, show it near the summary and in the input step.

## Calculation Flow

1. Build the input step from user data and prefilled query data.
2. Check whether X0 can be accepted.
3. Determine XC from reinforcement presence and carbonation moisture condition.
4. Determine XD from deicing salts and chloride moisture condition.
5. Determine XS from sea-related chloride source and chloride moisture condition.
6. Determine XF from freeze-thaw risk.
7. Determine XA from chemical attack choice and analysis availability.
8. Build the full `exposure_classes` array.
9. Select `governing_cover_exposure_class` by rank from `X0/XC/XD/XS`.
10. Build additional durability requirements for `XF` and `XA`.
11. Build the conclusion step and optional return link.

The exact report text and rule tables live in the report contract.

## Governing Class Selection

Use rank-based selection for the first version:

```text
X0 = 0
XC1 = 1
XC2 = 2
XC3 = 2
XC4 = 3
XD1 = 4
XS1 = 4
XD2 = 5
XS2 = 5
XD3 = 6
XS3 = 6
```

Tie order:

```text
X0, XC1, XC2, XC3, XC4, XD1, XS1, XD2, XS2, XD3, XS3
```

Future improvement: after the concrete cover durability calculator exists, it may choose the governing class by the actual `cmin,dur` table value for the selected reinforcement type and structural class. This first version intentionally uses the agreed rank table.

## Handoff With Future Calculator 1

The future concrete cover durability calculator will have:

```text
select "Клас впливу середовища"
button "Визначити клас"
```

The button opens:

```text
/calculator/concrete-exposure-class?returnTo=/calculator/concrete-cover-durability&returnField=exposureClass&returnLabel=Розрахунок захисного шару&elementName=<...>&elementType=<...>&reinforcementPresence=<...>&currentExposureClass=<...>
```

The exposure class calculator pre-fills shared fields:

```text
elementName -> element_name
elementType -> element_type
reinforcementPresence -> reinforcement_presence
currentExposureClass -> current class note
```

When the result is valid, it returns through:

```text
<returnTo>?<returnField>=<governing_cover_exposure_class>&sourceExposureClasses=<exposure_classes>&sourceCalculator=concrete-exposure-class
```

The future concrete cover durability calculator then:

- fills its `exposureClass` select;
- shows a note that the class was accepted from the exposure class calculator;
- optionally shows the full class set from `sourceExposureClasses`.

## Validation And Error Handling

Rules:

- Invalid query params are ignored and replaced with defaults.
- Invalid option values return validation errors through the calculation core.
- `exposure_classes` must not contain placeholders such as `not_defined`.
- `XA_unknown` must not be inserted into `exposure_classes`.
- If no exposure class can be determined, set `valid = false`.
- If reinforced concrete has no `X0/XC/XD/XS` candidate, set `valid = false`.
- If plain concrete without metal has no cover candidate, return `X0` with the agreed warning.

Warnings:

- Chemical attack unknown requires soil or water analysis.
- XA selected without soil or groundwater analysis is treated as a user-selected preliminary class.
- Normative references must be verified before final project use.

## UI Structure

Follow the existing native calculator layout:

- compact summary with:
  - full exposure classes;
  - governing class for cover calculation;
  - warnings if present;
- input form in the left/control area;
- report in the main area;
- return/use button near the result and near the report conclusion;
- DOCX export can be added later if desired, because the report uses the shared native report model.

No diagram is required for this calculator.

## Catalog Registration

Proposed registration:

```text
slug: concrete-exposure-class
nativeCalculator: concrete-exposure-class
title: Клас впливу середовища для бетону
mainCategory: zalizobeton
extraCategories: ["beton", "normy-perevirky", "normatyvni-obgruntuvannya"]
displayMode: native
accessLabel: Вбудований розрахунок
openUrl: /calculator/concrete-exposure-class
standard: ДБН В.2.6-98:2009 / ДСТУ ENV 206:2018
```

Suggested use cases:

```text
Визначення XC, XD, XS для захисного шару
Додаткові вимоги XF та XA
Передача exposure_class у розрахунок захисного шару
```

Suggested tags:

```text
залізобетон
довговічність
exposure class
```

## Tests

Required coverage:

- X0 is accepted only for plain concrete without metal and without XF/XA.
- Reinforced dry/permanently wet element returns XC1.
- `wet_rarely_dry` returns XC2.
- `moderate_or_high_humidity` returns XC3.
- `cyclic_wet_dry` returns XC4.
- Deicing salts with `moderate_humidity` returns XD1.
- Deicing salts with `wet_rarely_dry` returns XD2.
- Deicing salts with `cyclic_wet_dry` or `splash_or_spray` returns XD3.
- Airborne sea salts returns XS1.
- Sea water with `permanently_submerged` or `wet_rarely_dry` returns XS2.
- Sea water with `cyclic_wet_dry` or `splash_or_spray` returns XS3.
- Freeze-thaw mappings return XF1-XF4.
- XA labels and warnings match the contract.
- Full class order is stable and duplicates are removed.
- `XA_unknown` is not added to `exposure_classes`.
- Governing class rank selection matches the contract.
- Report step order and representative formulas match the contract.
- Query params prefill shared fields.
- Return link uses `returnTo`, `returnField`, and `sourceExposureClasses`.
- Registry and shell render the new native calculator.

## Verification

After implementation:

```bash
npm run test
npm run typecheck
npm run build
```

