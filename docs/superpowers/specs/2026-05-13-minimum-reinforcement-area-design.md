# Design Spec: Minimum Reinforcement Area Calculator

Date: 2026-05-13
Project: `construction-calculators-hub`
Status: Approved for planning

## Context

The project needs a native calculator for the minimum reinforcement area of a reinforced concrete member. The calculator must generate a step-by-step report where every calculation line has an explanatory label, normative reference, symbolic formula, numeric substitution, and result.

The agreed normative basis is:

- `ДСТУ Б В.2.6-156:2010`
- `Eurocode 2 EN 1992-1-1`

The calculation uses one shared formula block because the minimum reinforcement expression is the same in the selected DSTU and Eurocode 2 references. Formula captions must mention both documents where applicable.

## Goals

- Add a native calculator for minimum reinforcement area.
- Support beams and slabs.
- Use selected concrete and reinforcement classes from existing material directories.
- Generate a full step-by-step report.
- Keep formula labels and symbols centralized in a dictionary so notation can be changed quickly.
- Render report formulas in mathematical notation, not as plain body text.
- Show final and intermediate reinforcement areas in `мм²` and `см²`.

## Non-goals

- No design of required reinforcement from loads or moments.
- No bar spacing or bar-count selection in this calculator.
- No calculation of nominal concrete cover.
- No automatic derivation of `a_s` from cover and bar arrangement.
- No PDF/DOCX export in the first implementation.

## User Inputs

The user sets:

- structure type: `балка` or `плита`
- concrete class
- reinforcement class
- `h` - beam height or slab thickness, mm
- `bt` - tensile zone width or design slab strip width, mm
- `a_s` - distance from the tensile concrete face to the center of working reinforcement, mm
- `Øs` - working reinforcement diameter, mm

For slabs, `bt = 1000 мм` by default, but the user can edit it.

## Notation Dictionary

The implementation must use a centralized notation dictionary for labels, formulas, and report output:

```ts
{
  structureType: "тип конструкції",
  concreteClass: "клас бетону",
  rebarClass: "клас арматури",
  sectionHeight: "h",
  tensileZoneWidth: "bt",
  reinforcementCentroidDistance: "a_s",
  rebarDiameter: "Øs",
  effectiveDepth: "d",
  concreteMeanTensileStrength: "fctm",
  rebarYieldStrength: "fyk",
  minimumReinforcementAreaFirst: "As,min,1",
  minimumReinforcementAreaSecond: "As,min,2",
  minimumReinforcementArea: "As,min"
}
```

## Report Order

Formula examples below define the exact mathematical content and plain-text accessibility/test representation. In the UI, formulas must be rendered in mathematical style with proper subscripts and symbols. For example, `As,min,2` should be displayed as `A` with subscript `s,min,2`, `fctm` as `f` with subscript `ctm`, and `fyk` as `f` with subscript `yk`.

### 1. User input summary

Caption:

`Вихідні дані, задані користувачем:`

The report lists all user inputs with units.

### 2. Concrete tensile strength

Caption:

`Визначення середньої міцності бетону на осьовий розтяг fctm за класом бетону (табл. 3.1 ДБН В.2.6-98:2009 / табл. 3.1 EN 1992-1-1):`

Formula line format:

`fctm = 2.9 МПа (C30/37)`

### 3. Reinforcement yield strength

Caption:

`Визначення характеристичної границі плинності арматури fyk за класом арматури (табл. 5 ДСТУ 3760:2006 / п. 3.2.2, додаток C EN 1992-1-1):`

Formula line format:

`fyk = 500 МПа (A500C)`

### 4. Eurocode 2 applicability check

Caption:

`Перевірка застосовності класу арматури для розрахунку за Eurocode 2 (п. 3.2.2(3)P EN 1992-1-1):`

Passing formula line:

`400 <= 500 <= 600 - умова виконується`

Failing formula line:

`400 <= 800 <= 600 - умова не виконується`

Warning text for failing cases:

`Розрахунок за Eurocode 2 не виконується: fyk = 800 МПа виходить за межі 400...600 МПа згідно з п. 3.2.2(3)P EN 1992-1-1.`

The DSTU calculation still runs if this check fails.

### 5. Slab strip width

Show this step only for slabs.

Caption:

`Прийняття розрахункової ширини смуги плити bt (п. 8.3.1.1 ДСТУ Б В.2.6-156:2010 / п. 9.3.1.1 EN 1992-1-1):`

Formula line format:

`bt = 1000 мм`

### 6. Effective depth

Caption:

`Визначення робочої висоти балки d за геометрією перерізу (п. 4.4.1.1, 4.4.1.2 ДБН В.2.6-98:2009):`

or

`Визначення робочої висоти плити d за геометрією перерізу (п. 4.4.1.1, 4.4.1.2 ДБН В.2.6-98:2009):`

Formula line format:

`d = h - a_s = 500 - 50 = 450 мм`

### 7. First minimum reinforcement component

Caption:

`Визначення першої складової мінімальної площі армування As,min,1 (п. 8.2.1.1 ДСТУ Б В.2.6-156:2010 / п. 9.2.1.1(1), формула 9.1N EN 1992-1-1):`

Formula line format:

`As,min,1 = 0.26 * fctm / fyk * bt * d = 0.26 * 2.9 / 500 * 1000 * 450 = 678.6 мм² = 6.79 см²`

### 8. Second minimum reinforcement component

Caption:

`Визначення другої складової мінімальної площі армування As,min,2 (п. 8.2.1.1 ДСТУ Б В.2.6-156:2010 / п. 9.2.1.1(1), формула 9.1N EN 1992-1-1):`

Formula line format:

`As,min,2 = 0.0013 * bt * d = 0.0013 * 1000 * 450 = 585 мм² = 5.85 см²`

### 9. Governing minimum reinforcement area

Caption:

`Визначення мінімальної площі армування As,min як більшого зі значень As,min,1 та As,min,2 (п. 8.2.1.1 ДСТУ Б В.2.6-156:2010 / п. 9.2.1.1(1), формула 9.1N EN 1992-1-1):`

Formula line format:

`As,min = max(As,min,1; As,min,2) = max(678.6; 585) = 678.6 мм² = 6.79 см²`

## Calculation Rules

- Base units are `мм` and `МПа`.
- `МПа = Н/мм²`, so reinforcement area results are computed in `мм²`.
- Areas are also shown in `см²` by dividing by `100`.
- `d = h - a_s`.
- `As,min,1 = 0.26 * fctm / fyk * bt * d`.
- `As,min,2 = 0.0013 * bt * d`.
- `As,min = max(As,min,1; As,min,2)`.
- Eurocode 2 reference is considered applicable only when `400 <= fyk <= 600`.

## UI Structure

The calculator should follow the existing native calculator style:

- input controls at the top
- live summary/result block
- report panel below the controls
- report steps rendered in the agreed order

The report must be visible in the calculator page without requiring export.

Formula rendering requirements:

- use the existing `MathNotation` component or an equivalent centralized renderer
- render subscripts for `A_s,min`, `A_s,min,1`, `A_s,min,2`, `f_ctm`, `f_yk`, `b_t`, `a_s`, and `Ø_s`
- keep formulas readable as calculation chains: symbolic expression, numeric substitution, and result
- keep a stable plain-text representation for tests and screen-reader labels
- keep notation values sourced from the notation dictionary rather than hard-coding symbols throughout the UI

## Validation

The calculator must validate:

- `h > 0`
- `bt > 0`
- `a_s > 0`
- `a_s < h`
- `Øs > 0`
- concrete class exists in the material directory
- reinforcement class exists in the material directory

Invalid inputs should keep the UI stable and show clear Ukrainian validation text.

## Tests

Required test coverage:

- material lookup for `fctm` and `fyk`
- `d = h - a_s`
- `As,min,1`
- `As,min,2`
- governing `As,min`
- conversion from `мм²` to `см²`
- Eurocode `fyk` applicability check
- report step order and formula strings for a representative beam
- slab default `bt = 1000 мм`
