# Design Spec: Foundation Bar Anchorage Length Check

Date: 2026-05-13
Project: `construction-calculators-hub`
Status: Approved for planning

## Context

The project needs a native calculator for checking whether the available anchorage length at the end of a foundation reinforcement bar is sufficient. The calculation follows the foundation force model in `ДСТУ Б В.2.6-156:2010`, clauses 8.8.2.4-8.8.2.8, and the anchorage length rules in clauses 7.2.2-7.2.4.

The calculator must be similar in structure and reporting quality to the existing minimum reinforcement area calculator:

- calculation logic in a focused `lib/*` module
- all formulas represented in a stable plain-text report
- React UI only collects inputs and renders the report
- every calculation step has a caption, a normative reference, a symbolic formula, numeric substitution, result, and units
- formulas in the UI are rendered with mathematical notation and accessible plain text

## Goals

- Add a native calculator for checking anchorage of a foundation reinforcement bar end.
- Support `балка` and `плита` modes for provided reinforcement area.
- Derive soil resultant `R` from foundation dimensions and actions `N`, `M`, `Q`.
- Convert `Q` to an additional moment by the specified height of application.
- Compute tensile force `Fs` according to the foundation model.
- Compute `sigma_sd`, `fbd`, `lb,rqd`, `lbd`, `lb,min`, `lb,req`.
- Determine `eta1`, `eta2`, and `alpha1...alpha5` from user-described geometric/detailing conditions, not from arbitrary manual coefficient entry.
- Show a final sufficient/insufficient anchorage verdict.
- Add a dedicated UI tab/bookmark with the text summaries of all normative clauses referenced by the calculation.
- Make clause references in report captions clickable links to that normative tab/bookmark.

## Non-goals

- No design of required reinforcement from moments.
- No geotechnical bearing capacity check.
- No automatic design of footing dimensions.
- No partial-contact soil pressure model when `qmin < 0`.
- No automatic extraction of `lbAvailable` from reinforcement detailing geometry in the first version.
- No PDF/DOCX export in the first implementation.

## Input Groups

Inputs must be grouped by engineering meaning in the UI.

### 1. Structure And Materials

- `structureType`: `балка` or `плита`
- `concreteClass`: selected from the existing concrete material directory
- `rebarClass`: selected from the existing reinforcement material directory

### 2. Foundation Geometry

- `L` - footing size in the checked direction, mm
- `B` - footing size perpendicular to the checked direction, mm
- `h` - footing height used for `x = h / 2`, mm
- `d` - effective depth used for `zi = 0.9d`, mm
- `b` - pedestal/column width in the checked direction used for `ze = 0.15b`, mm
- `lbAvailable` - available anchorage length by node geometry, mm

### 3. Actions At The Pedestal

- `N` - design vertical action, kN
- `M` - design moment at the pedestal, kN*m
- `Q` - design shear action, kN
- `hQ` - height for converting `Q` into additional moment, m

### 4. Working Reinforcement

- `diameter` - anchorage bar diameter `Ø`, mm
- for `балка`: `barCount` - number of anchored working bars `n`
- for `плита`: `barSpacing` - spacing of anchored working bars `s`, mm

### 5. Bond Conditions For `eta1`

- `hBond` - member height in the direction of concreting, mm
- `aBottom` - distance from the lower face/formwork to the anchored bar axis, mm
- `barAngle`: horizontal or inclined/vertical 45-90 degrees
- `slipForm`: whether concreting is performed in slip form

### 6. Anchorage Shape And Cover For `alpha1`, `cd`, `alpha2`

- `anchorageShape`: `straight` or `bend`
- `coverBottomC` - concrete cover to the lower face, mm
- `coverSideC1` - concrete cover to the side face, mm
- `barSpacingA` - distance between axes of adjacent anchored bars, mm

### 7. Transverse Reinforcement For `alpha3` And `alpha4`

- `transverseRebarAreaAst` - area of transverse reinforcement along the design anchorage length, mm2
- `kScheme` - transverse reinforcement scheme from figure 7.4: `K = 0`, `K = 0.05`, or `K = 0.1`
- `weldedTransverseRebar`: whether welded transverse reinforcement is present along the design anchorage length

### 8. Transverse Pressure For `alpha5`

- `transversePressureP` - transverse pressure along the design anchorage length, MPa
- default value: `0 MPa`

## Notation Dictionary

The implementation must use a centralized notation dictionary for labels, formulas, report output, and mathematical rendering:

```ts
{
  structureType: "тип конструкції",
  concreteClass: "клас бетону",
  rebarClass: "клас арматури",
  footingLength: "L",
  footingWidth: "B",
  footingHeight: "h",
  effectiveDepth: "d",
  pedestalWidth: "b",
  availableAnchorageLength: "lb",
  axialLoad: "N",
  moment: "M",
  shear: "Q",
  shearHeight: "hQ",
  shearMoment: "MQ",
  totalMoment: "Mtot",
  eccentricity: "e",
  meanSoilPressure: "qm",
  maximumSoilPressure: "qmax",
  minimumSoilPressure: "qmin",
  criticalDistance: "x",
  soilPressureAtX: "qx",
  soilResultant: "R",
  externalLeverArm: "ze",
  internalLeverArm: "zi",
  tensileForce: "Fs",
  barDiameter: "Ø",
  singleBarArea: "As,1",
  providedArea: "As,prov",
  steelStress: "sigma_sd",
  concreteDesignTensileStrength: "fctd",
  bondConditionFactor: "eta1",
  diameterFactor: "eta2",
  bondStress: "fbd",
  basicRequiredAnchorageLength: "lb,rqd",
  concreteDistance: "cd",
  alpha1: "alpha1",
  alpha2: "alpha2",
  alpha3: "alpha3",
  alpha4: "alpha4",
  alpha5: "alpha5",
  alpha235: "alpha235",
  transverseRebarMinimumArea: "ΣAst,min",
  transverseRebarArea: "ΣAst",
  transverseRebarInfluence: "lambda",
  transverseRebarSchemeFactor: "K",
  designAnchorageLength: "lbd",
  minimumAnchorageLength: "lb,min",
  requiredAnchorageLength: "lb,req"
}
```

## Report Order

Each step below is a separate report item. Captions must include clickable clause references. The links must target the normative tab/bookmark entries described in `Normative References Tab`.

### 1. Additional moment from shear

Caption:

`Визначення додаткового моменту від поперечної сили Q за висотою її прикладання:`

Formula:

`MQ = Q * hQ = ... кН * ... м = ... кН*м`

### 2. Total moment at the pedestal

Caption:

`Визначення сумарного моменту на уступі фундаменту:`

Formula:

`Mtot = M + MQ = ... + ... = ... кН*м`

### 3. Eccentricity

Caption:

`Визначення ексцентриситету рівнодійної навантаження:`

Formula:

`e = Mtot / N = ... / ... = ... м`

### 4. Mean soil pressure

Caption:

`Визначення середнього тиску під підошвою фундаменту:`

Formula:

`qm = N / (L * B) = ... / (... * ...) = ... кПа`

`L` and `B` are entered in `мм` and converted to `м` in this step.

### 5. Maximum edge soil pressure

Caption:

`Визначення максимального крайового тиску ґрунту:`

Formula:

`qmax = N / (L * B) + 6 * Mtot / (B * L^2) = ... кПа`

### 6. Minimum edge soil pressure

Caption:

`Визначення мінімального крайового тиску ґрунту:`

Formula:

`qmin = N / (L * B) - 6 * Mtot / (B * L^2) = ... кПа`

If `qmin < 0`, show a warning outside the numbered report:

`qmin < 0: епюра тиску має неповний контакт підошви з ґрунтом; цей калькулятор використовує спрощену лінійну епюру повного контакту.`

### 7. Critical distance from the footing face

Caption:

`Визначення критичної відстані від грані фундаменту для прямих стрижнів без анкерування на кінцях згідно з п. 8.8.2.8 ДСТУ Б В.2.6-156:2010:`

Formula:

`x = h / 2 = ... / 2 = ... мм`

### 8. Soil pressure at distance `x`

Caption:

`Визначення тиску ґрунту на відстані x від грані фундаменту за лінійною епюрою тиску:`

Formula:

`qx = qmax - (qmax - qmin) * x / L = ... - (... - ...) * ... / ... = ... кПа`

### 9. Soil pressure resultant within distance `x`

Caption:

`Визначення результуючої тиску ґрунту R у межах відстані x від грані фундаменту згідно з п. 8.8.2.5 ДСТУ Б В.2.6-156:2010:`

Formula:

`R = B * x * (qmax + qx) / 2 = ... * ... * (... + ...) / 2 = ... кН`

`B` and `x` are converted from `мм` to `м` for this area calculation.

### 10. External lever arm

Caption:

`Визначення зовнішнього плеча пари ze за спрощеним припущенням п. 8.8.2.6 ДСТУ Б В.2.6-156:2010:`

Formula:

`ze = 0.15 * b = 0.15 * ... = ... мм`

### 11. Internal lever arm

Caption:

`Визначення внутрішнього плеча пари zi за спрощеним припущенням п. 8.8.2.6 ДСТУ Б В.2.6-156:2010:`

Formula:

`zi = 0.9 * d = 0.9 * ... = ... мм`

### 12. Tensile force to be anchored

Caption:

`Визначення сили розтягу Fs, яка повинна заанкеровуватись, згідно з п. 8.8.2.5 ДСТУ Б В.2.6-156:2010:`

Formula:

`Fs = R * ze / zi = ... * ... / ... = ... кН`

### 13. Single bar area

Caption:

`Визначення площі одного анкерованого стрижня за діаметром арматури:`

Formula:

`As,1 = pi * Ø^2 / 4 = pi * ...^2 / 4 = ... мм2`

### 14. Provided anchored reinforcement area

Caption for beams:

`Визначення сумарної площі анкерованої робочої арматури балки:`

Formula:

`As,prov = n * As,1 = ... * ... = ... мм2`

Caption for slabs:

`Визначення площі анкерованої робочої арматури на 1 м.п. плити:`

Formula:

`As,prov = As,1 * 1000 / s = ... * 1000 / ... = ... мм2/м.п.`

### 15. Steel design stress for anchorage

Caption:

`Визначення розрахункового напруження в арматурі в місці, від якого визначається довжина анкерування, згідно з п. 7.2.3.2 ДСТУ Б В.2.6-156:2010:`

Formula:

`sigma_sd = Fs * 1000 / As,prov = ... * 1000 / ... = ... МПа`

### 16. Concrete design tensile strength

Caption:

`Визначення розрахункової міцності бетону на осьовий розтяг fctd за класом бетону згідно з табл. 3.1 ДБН В.2.6-98:2009:`

Formula:

`fctd = alpha_ct * fctk,0.05 / gamma_c = ... * ... / ... = ... МПа`

Defaults:

- `alpha_ct = 1.0`
- `gamma_c = 1.5`
- `fctk,0.05` from the existing concrete material directory

### 17. Bond condition factor `eta1`

Caption:

`Визначення коефіцієнта eta1 умов зчеплення за положенням стрижня під час бетонування згідно з п. 7.2.2.2 ДСТУ Б В.2.6-156:2010 / рис. 8.2 EN 1992-1-1:`

Good bond conditions:

- inclined or vertical bars with inclination 45-90 degrees
- horizontal bars in members with `hBond <= 250 мм`
- horizontal bars in members with `250 < hBond <= 600 мм` when `aBottom <= 250 мм`
- horizontal bars in members with `hBond > 600 мм` when `aBottom <= hBond - 300 мм`

Formula for good conditions:

`eta1 = 1.0, оскільки hBond = ... мм, aBottom = ... мм і стрижень знаходиться в зоні добрих умов зчеплення`

Formula for other conditions:

`eta1 = 0.7, оскільки hBond = ... мм, aBottom = ... мм і стрижень знаходиться поза зоною добрих умов зчеплення`

If `slipForm = true`, the calculator must set `eta1 = 0.7` unless the user explicitly changes the detailing condition after review.

### 18. Diameter factor `eta2`

Caption:

`Визначення коефіцієнта eta2 за діаметром стрижня згідно з п. 7.2.2.2 ДСТУ Б В.2.6-156:2010:`

For `Ø <= 32 мм`:

`eta2 = 1.0`

For `Ø > 32 мм`:

`eta2 = (132 - Ø) / 100 = (132 - ...) / 100 = ...`

### 19. Ultimate bond stress

Caption:

`Визначення граничного напруження зчеплення fbd згідно з п. 7.2.2.2, формула (7.2) ДСТУ Б В.2.6-156:2010:`

Formula:

`fbd = 2.25 * eta1 * eta2 * fctd = 2.25 * ... * ... * ... = ... МПа`

### 20. Basic required anchorage length

Caption:

`Визначення необхідної базової довжини анкерування lb,rqd згідно з п. 7.2.3.2, формула (7.3) ДСТУ Б В.2.6-156:2010:`

Formula:

`lb,rqd = (Ø / 4) * (sigma_sd / fbd) = (... / 4) * (... / ...) = ... мм`

### 21. Concrete distance `cd`

Caption:

`Визначення мінімальної відстані cd до грані бетону або сусіднього стрижня згідно з рис. 7.3 ДСТУ Б В.2.6-156:2010:`

For straight bars:

`cd = min(a / 2; c1; c) = min(... / 2; ...; ...) = ... мм`

For bends/hooks/loops:

`cd = min(a / 2; c1) = min(... / 2; ...) = ... мм`

### 22. Shape factor `alpha1`

Caption:

`Визначення коефіцієнта alpha1 впливу форми стрижня згідно з табл. 7.2 ДСТУ Б В.2.6-156:2010:`

For straight bars:

`alpha1 = 1.0 (пряме анкерування)`

For bends/hooks/loops and `cd > 3Ø`:

`alpha1 = 0.7, оскільки cd = ... мм > 3Ø = ... мм`

For bends/hooks/loops and `cd <= 3Ø`:

`alpha1 = 1.0, оскільки cd = ... мм <= 3Ø = ... мм`

### 23. Cover factor `alpha2`

Caption:

`Визначення коефіцієнта alpha2 впливу захисного шару бетону згідно з табл. 7.2 ДСТУ Б В.2.6-156:2010:`

For straight bars in tension:

`alpha2 = min(max(1.0 - 0.15 * (cd - Ø) / Ø; 0.7); 1.0) = min(max(...; 0.7); 1.0) = ...`

For bends/hooks/loops in tension:

`alpha2 = min(max(1.0 - 0.15 * (cd - 3Ø) / Ø; 0.7); 1.0) = min(max(...; 0.7); 1.0) = ...`

### 24. Minimum transverse reinforcement area

Caption:

`Визначення мінімальної площі поперечної арматури ΣAst,min вздовж зони анкерування згідно з приміткою до табл. 7.2 ДСТУ Б В.2.6-156:2010:`

For beams:

`ΣAst,min = 0.25 * As = 0.25 * ... = ... мм2`

For slabs:

`ΣAst,min = 0 мм2`

### 25. Transverse reinforcement influence coefficient `lambda`

Caption:

`Визначення коефіцієнта lambda для впливу поперечної арматури згідно з табл. 7.2 ДСТУ Б В.2.6-156:2010:`

Formula:

`lambda = (ΣAst - ΣAst,min) / As = (... - ...) / ... = ...`

### 26. Scheme factor `K`

Caption:

`Визначення коефіцієнта K за схемою поперечної арматури згідно з рис. 7.4 ДСТУ Б В.2.6-156:2010:`

Formula examples:

`K = 0.1 (поперечна арматура охоплює анкерований стрижень біля кінця)`

`K = 0.05 (поперечна арматура перетинає/утримує зону анкерування за середньою схемою)`

`K = 0 (поперечна арматура не охоплює анкерований стрижень або відсутня)`

### 27. Non-welded transverse reinforcement factor `alpha3`

Caption:

`Визначення коефіцієнта alpha3 впливу поперечної арматури, не привареної до основної, згідно з табл. 7.2 ДСТУ Б В.2.6-156:2010:`

Formula:

`alpha3 = min(max(1.0 - K * lambda; 0.7); 1.0) = min(max(1.0 - ... * ...; 0.7); 1.0) = ...`

### 28. Welded transverse reinforcement factor `alpha4`

Caption:

`Визначення коефіцієнта alpha4 впливу привареної поперечної арматури згідно з табл. 7.2 ДСТУ Б В.2.6-156:2010:`

If welded transverse reinforcement is present:

`alpha4 = 0.7 (наявна приварена поперечна арматура вздовж розрахункової довжини анкерування)`

If absent:

`alpha4 = 1.0 (приварена поперечна арматура вздовж розрахункової довжини анкерування відсутня)`

### 29. Transverse pressure factor `alpha5`

Caption:

`Визначення коефіцієнта alpha5 впливу поперечного тиску згідно з табл. 7.2 ДСТУ Б В.2.6-156:2010:`

Formula:

`alpha5 = min(max(1.0 - 0.04 * p; 0.7); 1.0) = min(max(1.0 - 0.04 * ...; 0.7); 1.0) = ...`

### 30. Product condition for `alpha2 * alpha3 * alpha5`

Caption:

`Перевірка нижньої межі добутку alpha2 * alpha3 * alpha5 згідно з п. 7.2.4.1, формула (7.5) ДСТУ Б В.2.6-156:2010:`

Formula:

`alpha235 = max(alpha2 * alpha3 * alpha5; 0.7) = max(... * ... * ...; 0.7) = ...`

If `alpha235` is greater than the raw product, the design anchorage calculation must use an adjusted value while preserving the individual `alpha2`, `alpha3`, and `alpha5` report steps. The implementation may apply this by increasing `alpha5` for the product used in `lbd`, or by multiplying `alpha1 * alpha4 * alpha235 * lb,rqd`. The report must make the chosen method explicit.

Recommended report formula for the final implementation:

`lbd = alpha1 * alpha4 * alpha235 * lb,rqd`

This avoids hiding the formula (7.5) lower-bound adjustment.

### 31. Design anchorage length

Caption:

`Визначення розрахункової довжини анкерування lbd згідно з п. 7.2.4.1, формула (7.4) ДСТУ Б В.2.6-156:2010 з урахуванням умови формули (7.5):`

Formula:

`lbd = alpha1 * alpha4 * alpha235 * lb,rqd = ... * ... * ... * ... = ... мм`

### 32. Minimum anchorage length in tension

Caption:

`Визначення мінімальної довжини анкерування lb,min при розтягу згідно з п. 7.2.4.1, формула (7.6) ДСТУ Б В.2.6-156:2010:`

Formula:

`lb,min = max(0.3 * lb,rqd; 10 * Ø; 100) = max(...; ...; 100) = ... мм`

### 33. Required anchorage length

Caption:

`Визначення необхідної довжини анкерування з урахуванням мінімального обмеження:`

Formula:

`lb,req = max(lbd; lb,min) = max(...; ...) = ... мм`

### 34. Available anchorage length

Caption:

`Фіксація доступної довжини анкерування lb за геометрією вузла згідно з п. 8.8.2.7 ДСТУ Б В.2.6-156:2010:`

Formula:

`lb = ... мм`

### 35. Final anchorage check

Caption:

`Перевірка достатності доступної довжини анкерування кінця стрижня згідно з п. 8.8.2.7 ДСТУ Б В.2.6-156:2010 та п. 7.2.4.1 ДСТУ Б В.2.6-156:2010:`

Passing formula:

`lb >= lb,req => ... >= ... - умова виконується`

Failing formula:

`lb >= lb,req => ... >= ... - умова не виконується`

Passing summary:

`Анкерування достатнє: lb = ... мм >= lb,req = ... мм.`

Failing summary:

`Анкерування недостатнє: lb = ... мм < lb,req = ... мм. Потрібно збільшити довжину, застосувати загин або анкерний пристрій згідно з п. 8.8.2.7 ДСТУ Б В.2.6-156:2010.`

## Normative References Tab

The calculator UI must include a tab/bookmark named `Нормативні пункти`.

Report captions must render each clause reference as an anchor link to the matching item in this tab, for example:

- `п. 8.8.2.5` links to `#norm-dstu-8-8-2-5`
- `формула (7.2)` links to `#norm-dstu-7-2-2-2`
- `табл. 7.2` links to `#norm-dstu-table-7-2`
- `рис. 7.4` links to `#norm-dstu-fig-7-4`

The tab should not duplicate a full copyrighted standard. It should show concise calculation-relevant excerpts/summaries from the user-provided clauses and figures, enough for auditability:

### `#norm-dstu-8-8-2-4`

Title:

`п. 8.8.2.4 ДСТУ Б В.2.6-156:2010`

Summary:

`Зусилля розтягу в арматурі визначається з умов рівноваги з урахуванням похилих тріщин; зусилля на відстані x повинно анкеруватись у бетоні в межах такої ж відстані x від грані фундаменту.`

### `#norm-dstu-8-8-2-5`

Title:

`п. 8.8.2.5 ДСТУ Б В.2.6-156:2010, формула (8.13)`

Summary:

`Сила розтягу для анкерування визначається як Fs = R * ze / zi.`

Notation:

- `R` - результуюча тиску ґрунту в межах відстані `x`
- `ze` - зовнішнє плече пари
- `zi` - плече внутрішньої пари

### `#norm-dstu-8-8-2-6`

Title:

`п. 8.8.2.6 ДСТУ Б В.2.6-156:2010`

Summary:

`Плечі ze і zi можуть визначатись відносно стиснутих зон. Для спрощення приймається ze = 0.15b, а zi = 0.9d.`

### `#norm-dstu-8-8-2-7`

Title:

`п. 8.8.2.7 ДСТУ Б В.2.6-156:2010`

Summary:

`Можлива зона анкерування для прямих стрижнів позначена як lb. Якщо довжина недостатня, стрижні можуть загинатись або забезпечуватись анкерними пристроями.`

### `#norm-dstu-8-8-2-8`

Title:

`п. 8.8.2.8 ДСТУ Б В.2.6-156:2010`

Summary:

`Для прямих стрижнів без анкерування на кінцях мінімальне x є найбільш критичним; для спрощення можна приймати xmin = h / 2.`

### `#norm-dstu-7-2-2-2`

Title:

`п. 7.2.2.2 ДСТУ Б В.2.6-156:2010, формула (7.2)`

Summary:

`Розрахункове значення граничного напруження зчеплення для стрижнів періодичного профілю визначається як fbd = 2.25 * eta1 * eta2 * fctd.`

Coefficient summary:

- `eta1 = 1.0` для добрих умов зчеплення
- `eta1 = 0.7` для інших випадків та стрижнів у конструктивних елементах, зведених у ковзній опалубці
- `eta2 = 1.0` для `Ø <= 32 мм`
- `eta2 = (132 - Ø) / 100` для `Ø > 32 мм`

### `#norm-dstu-7-2-3-2`

Title:

`п. 7.2.3.2 ДСТУ Б В.2.6-156:2010, формула (7.3)`

Summary:

`Необхідна базова довжина анкерування для зусилля As * sigma_sd у прямих стрижнях при постійному напруженні зчеплення визначається як lb,rqd = (Ø / 4) * (sigma_sd / fbd).`

### `#norm-dstu-7-2-3-3`

Title:

`п. 7.2.3.3 ДСТУ Б В.2.6-156:2010`

Summary:

`При гнутих стрижнях необхідну базову довжину lb,rqd і розрахункову довжину lbd визначають вздовж осьової лінії стрижня.`

### `#norm-dstu-7-2-4-1`

Title:

`п. 7.2.4.1 ДСТУ Б В.2.6-156:2010, формули (7.4)-(7.6)`

Summary:

`Розрахункова довжина анкерування визначається через lb,rqd і коефіцієнти alpha1...alpha5; добуток alpha2 * alpha3 * alpha5 має бути не меншим за 0.7. Мінімальна довжина анкерування при розтягу визначається як max(0.3 * lb,rqd; 10Ø; 100 мм).`

### `#norm-dstu-fig-7-3`

Title:

`рис. 7.3 ДСТУ Б В.2.6-156:2010`

Summary:

`Рисунок задає визначення cd для прямих стрижнів, стрижнів із загином/гаком і стрижнів із петлею. Для прямого стрижня використовується cd = min(a/2; c1; c), для загину/гака - cd = min(a/2; c1).`

### `#norm-dstu-table-7-2`

Title:

`табл. 7.2 ДСТУ Б В.2.6-156:2010`

Summary:

`Таблиця задає коефіцієнти alpha1...alpha5 для розрахункової довжини анкерування залежно від форми стрижня, захисного шару, поперечної арматури, привареної поперечної арматури та поперечного тиску.`

Key formulas used in this calculator:

- `alpha1 = 1.0` for straight bars
- `alpha1 = 0.7` for bends/hooks/loops when `cd > 3Ø`, otherwise `1.0`
- `alpha2 = min(max(1.0 - 0.15 * (cd - Ø) / Ø; 0.7); 1.0)` for straight bars
- `alpha2 = min(max(1.0 - 0.15 * (cd - 3Ø) / Ø; 0.7); 1.0)` for bends/hooks/loops
- `alpha3 = min(max(1.0 - K * lambda; 0.7); 1.0)`
- `alpha4 = 0.7` when welded transverse reinforcement is present, otherwise `1.0`
- `alpha5 = min(max(1.0 - 0.04 * p; 0.7); 1.0)`

### `#norm-dstu-fig-7-4`

Title:

`рис. 7.4 ДСТУ Б В.2.6-156:2010`

Summary:

`Рисунок задає значення K для балок і плит залежно від схеми поперечної арматури: K = 0.1, K = 0.05 або K = 0.`

### `#norm-en-1992-fig-8-2`

Title:

`рис. 8.2 EN 1992-1-1`

Summary:

`Рисунок використовується для визначення добрих умов зчеплення залежно від висоти елемента в напрямку бетонування, положення стрижня відносно нижньої грані та нахилу стрижня.`

## UI Structure

The calculator must use a tabbed or bookmark-style layout:

- `Розрахунок` - grouped input controls, summary, and step-by-step report
- `Нормативні пункти` - concise referenced clause/figure/table summaries

Input groups must be visually separated but not rendered as nested cards. Use compact field groups similar to the existing native calculators.

The report must remain visible on the calculation tab. Clause links in captions should navigate to the relevant normative item. If implemented as tabs, clicking a clause link should switch/open the normative tab and scroll to the target item.

## Validation

The calculator must validate:

- all required dimensions and actions are finite numbers
- `L > 0`, `B > 0`, `h > 0`, `d > 0`, `b > 0`
- `lbAvailable > 0`
- `N > 0`
- `Ø > 0`
- for beams: `barCount > 0`
- for slabs: `barSpacing > 0`
- `hQ >= 0`
- `barSpacingA > 0`
- `coverBottomC > 0`, `coverSideC1 > 0`
- `hBond > 0`, `aBottom >= 0`, `aBottom <= hBond`
- `transverseRebarAreaAst >= 0`
- `transversePressureP >= 0`
- concrete class exists in the material directory
- reinforcement class exists in the material directory
- `fbd > 0`
- no report formula may contain `NaN` or `Infinity`

Warnings:

- `qmin < 0`: show a warning outside the numbered report; do not add a numbered check step.
- `sigma_sd` exceeds the selected reinforcement design/yield stress: show a warning that the anchorage stress input implied by the foundation model is high.
- `x > L`: show a warning that the simplified `x = h / 2` exceeds the footing length in the checked direction.

## Tests

Required test coverage:

- soil pressure calculations from `N`, `M`, `Q`, `hQ`, `L`, `B`
- `x = h / 2`
- `R = B * x * (qmax + qx) / 2`
- `ze = 0.15b`
- `zi = 0.9d`
- `Fs = R * ze / zi`
- beam and slab `As,prov`
- `sigma_sd = Fs * 1000 / As,prov`
- concrete `fctd` lookup/calculation
- `eta1` for good and other bond conditions
- `eta2` for `Ø <= 32` and `Ø > 32`
- `fbd`
- `lb,rqd`
- `cd` for straight and bend anchorage
- `alpha1...alpha5`
- formula (7.5) lower-bound handling through `alpha235`
- `lbd`
- `lb,min`
- `lb,req`
- final pass/fail anchorage condition
- warning when `qmin < 0`
- report step order
- exact plain-text formula strings for a representative case
- clickable normative reference anchors in report captions
- normative tab renders all referenced clause ids
- UI smoke test through `CalculatorShell`

## Registration

The native calculator should be registered as:

- slug: `foundation-bar-anchorage`
- native calculator key: `foundation-bar-anchorage`
- display mode: `native`
- suggested title: `Анкерування стрижня фундаменту`
- suggested short description: `Покрокова перевірка довжини анкерування кінця стрижня фундаменту за ДСТУ Б В.2.6-156:2010.`

## Open Implementation Detail

Formula (7.5) requires `alpha2 * alpha3 * alpha5 >= 0.7`, while formula (7.4) is commonly written with all five individual coefficients. The implementation should use the explicit `alpha235` step and compute:

`lbd = alpha1 * alpha4 * alpha235 * lb,rqd`

This makes the lower-bound adjustment visible and testable. If a different presentation is preferred later, update this spec before implementation.
