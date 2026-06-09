# Design Spec: Soil Design Resistance Calculator

Date: 2026-06-09
Project: `construction-calculators-hub`
Status: Awaiting user review

## Context

The project needs a native calculator for computing the design resistance of soil under a foundation base:

`R` - розрахунковий опір ґрунту основи, кПа.

The calculation follows appendix Е of `ДБН В.2.1-10-2009 "Основи і фундаменти споруд. Основні положення проектування"`, specifically:

- п. 7.7.1 - reference to appendix Е for determining `R`
- п. Е.4 - formula (Е.1) and basement-related formula (Е.2)
- п. Е.5 - determination of design values and weighted-average characteristics
- table Е.7 - coefficients `γc1`, `γc2`
- table Е.8 - coefficients `Mγ`, `Mq`, `Mc`
- notes to п. Е.4 and table Е.7

The default example must reproduce the referenced MQN calculator example:

- source: `https://www.mqn.com.ua/foundations-R.php`
- expected result: `R = 162.8 кПа = 16.3 т/м² = 1.6 кг/см²`

Canonical agreed report text and formulas are captured separately in [`2026-06-09-soil-design-resistance-report-contract.md`](2026-06-09-soil-design-resistance-report-contract.md). Implementation plans and code should treat that file as the source of truth for report captions, display conditions, and formula strings.

## Goals

- Add a native calculator with a step-by-step report for formula (Е.1).
- Use actual user soil type inputs and map them to table Е.7.
- Automatically determine `γc1`, `γc2`, `k`, `Mγ`, `Mq`, `Mc`, `kz`, `d1`, and `db` where applicable.
- Allow manual entry only for `γc1` and `γc2` as an option inside the working conditions block.
- Show every agreed formula and substitution in the report.
- Include concise normative reference summaries without duplicating the full DBN text.
- Keep calculation logic out of the React component.

## Non-goals

- No settlement calculation.
- No bearing capacity check by appendix Ж.
- No automatic selection of soil parameters from appendix В tables.
- No multi-layer weighted-average helper for `φ11`, `c11`, `γ11`, or `γ′11` in the first version.
- No PDF/DOCX export in the first version.
- No manual override for `k`, `Mγ`, `Mq`, `Mc`, `kz`, `d1`, or `db`.

## User Inputs

### Working Conditions

- `calculationMode` / `Спосіб розрахунку`
  - `автоматично за характеристиками ґрунту`
  - `вручну за табл. Е.7`
- `structuralScheme` / `Конструктивна схема споруди`
  - `жорстка`
  - `гнучка`
- `buildingLengthM` / `L - довжина споруди або її відсіку, м`
- `buildingHeightM` / `H - висота споруди або її відсіку, м`
- `lengthHeightRatio` / `L/H - відношення довжини споруди або її відсіку до висоти`
  - derived as `L / H`
- `soilType` / `Тип ґрунту`
  - `Великоуламковий з піщаним заповнювачем`
  - `Великоуламковий з глинистим заповнювачем`
  - `Пісок гравелистий`
  - `Пісок крупний`
  - `Пісок середньої крупності`
  - `Пісок пухкий`
  - `Пісок дрібний`
  - `Пісок пилуватий малого ступеня вологості`
  - `Пісок пилуватий середнього ступеня вологості`
  - `Пісок пилуватий, насичений водою`
  - `Глинистий ґрунт`
- `liquidityIndex` / `IL - показник текучості ґрунту або глинистого заповнювача`
  - shown for `Великоуламковий з глинистим заповнювачем`
  - shown for `Глинистий ґрунт`
- manual mode only:
  - `gammaC1` / `γc1 - коефіцієнт умов роботи ґрунту`
  - `gammaC2` / `γc2 - коефіцієнт умов роботи споруди у взаємодії з основою`

Explanation near `Конструктивна схема споруди`:

`Жорстка конструктивна схема: конструкції спеціально пристосовані до сприйняття зусиль від деформацій основ (примітка 1 до табл. Е.7 ДБН В.2.1-10-2009).`

In manual mode, `L`, `H`, `structuralScheme`, `soilType`, and `IL` are not required and may be hidden because `γc1` and `γc2` are entered directly by the user.

### Soil Characteristics

- `phi11Deg` / `φ11 - розрахункове значення кута внутрішнього тертя ґрунту, °`
- `gamma11KnM3` / `γ11 - усереднене розрахункове значення питомої ваги ґрунтів нижче підошви, кН/м³`
- `gammaPrime11KnM3` / `γ′11 - усереднене розрахункове значення питомої ваги ґрунтів вище підошви, кН/м³`
- `c11KPa` / `c11 - розрахункове значення питомого зчеплення ґрунту під підошвою, кПа`
- `strengthSource` / `Спосіб визначення φ11 і c11`
  - `визначені безпосередніми випробуваннями`
  - `прийняті за таблицями В.1-В.2`

Explanation near the group:

`Розрахункові значення φ11, c11, γ11 приймають для розрахунків за другим граничним станом згідно з п. Е.5 ДБН В.2.1-10-2009.`

### Geometry

- `foundationWidthM` / `b - ширина підошви фундаменту, м`
- `foundationDepthM` / `d - глибина закладання фундаменту від рівня планування, м`

Explanations:

- `b`: `Для круглої або правильної багатокутної підошви площею A допускається приймати b = sqrt(A) згідно з приміткою 1 до п. Е.4.`
- `d`: `Використовується для перевірки d1 <= d за приміткою 6 до п. Е.4.`

### Basement

- `hasBasement` / `Підвал`
  - `немає підвалу`
  - `є підвал`

If there is no basement:

- `embedmentDepthD1M` / `d1 - глибина закладання фундаменту безпідвальної споруди від рівня планування, м`

If there is a basement:

- `basementDepthInputM` / `db,input - глибина підвалу від рівня планування до підлоги підвалу, м`
- `soilLayerAboveFootingHsM` / `hs - товщина шару ґрунту вище підошви фундаменту з боку підвалу, м`
- `basementFloorThicknessHcfM` / `hcf - товщина конструкції підлоги підвалу, м`
- `basementFloorUnitWeightGammaCfKnM3` / `γcf - розрахункове значення питомої ваги конструкції підлоги підвалу, кН/м³`

Derived values:

- `basementDepthDbM` / `db - розрахункова глибина підвалу, м`
- `embedmentDepthD1M` / `d1 - приведена глибина закладання фундаменту від підлоги підвалу, м`

## Default Example

The default values should reproduce the MQN example:

- `calculationMode`: `вручну за табл. Е.7`
- `γc1 = 1.0`
- `γc2 = 1.0`
- `strengthSource`: `визначені безпосередніми випробуваннями`, so `k = 1.0`
- `φ11 = 30°`
- `b = 1.0 м`
- `γ11 = 17.1 кН/м³`
- `γ′11 = 16.6 кН/м³`
- `c11 = 4 кПа`
- `d = 1.2 м`
- `hasBasement`: `немає підвалу`
- `d1 = 1.2 м`
- `db = 0 м`
- hidden automatic-mode defaults: `L = 24 м`, `H = 6 м`, so `L/H = 4`

Expected:

`R = 1 * 1 / 1 * [1.15 * 1 * 1 * 17.1 + 5.59 * 1.2 * 16.6 + (5.59 - 1) * 0 * 16.6 + 7.95 * 4] = 162.82 кПа`

Displayed:

`R = 162.8 кПа = 16.3 т/м² = 1.6 кг/см²`

Additional unit conversion uses the engineering convention agreed for this calculator:

- `1 т/м² = 10 кПа`
- `1 кг/см² = 100 кПа`

## Table Е.7 Mapping

Automatic mode maps the actual selected soil type to table Е.7 rows:

- `Великоуламковий з піщаним заповнювачем`, `Пісок гравелистий`, `Пісок крупний`, `Пісок середньої крупності` -> `Великоуламкові з піщаним заповнювачем і піщані, крім дрібних і пилуватих`
- `Пісок пухкий` -> `γc1 = 1.0`, `γc2 = 1.0` by note 4 to table Е.7
- `Пісок дрібний` -> `Піски дрібні`
- `Пісок пилуватий малого ступеня вологості`, `Пісок пилуватий середнього ступеня вологості` -> `Піски пилуваті малого і середнього ступеня вологості`
- `Пісок пилуватий, насичений водою` -> `Піски пилуваті, насичені водою`
- `Великоуламковий з глинистим заповнювачем`, `Глинистий ґрунт` -> row selected by `IL`:
  - `IL <= 0.25`
  - `0.25 < IL <= 0.5`
  - `IL > 0.5`

For rigid structural schemes:

- if `L/H <= 1.5`, use the `1,5 і менше` column
- if `L/H >= 4`, use the `4 і більше` column
- if `1.5 < L/H < 4`, linearly interpolate `γc2` according to note 3 to table Е.7

For flexible structural schemes:

- `γc2 = 1.0` according to note 2 to table Е.7

## Table Е.8

The calculator includes table Е.8 for integer `φ11` values from `0°` to `45°`.

If `φ11` is an exact table value, use the table row directly.

If `φ11` is between table values, linearly interpolate:

`M = Ma + (Mb - Ma) * (φ11 - φa) / (φb - φa)`

The report must show the interpolation formula separately for `Mγ`, `Mq`, and `Mc`.

## Report Order

The canonical report contract is [`2026-06-09-soil-design-resistance-report-contract.md`](2026-06-09-soil-design-resistance-report-contract.md). The summary below mirrors that contract; if wording ever differs, update both files before implementation and keep the report contract authoritative.

Every step has a stable plain-text formula for tests and accessibility. The UI should render symbols with mathematical notation while preserving the plain-text formula in `aria-label` or an equivalent accessible representation.

### 1. User input summary

Caption:

`Вихідні дані, задані користувачем:`

Items:

- `Спосіб розрахунку: ...`
- `Конструктивна схема споруди: ...`
- `L = ... м`
- `H = ... м`
- `Тип ґрунту: ...`
- `IL = ...` only when applicable
- `φ11 = ...°`
- `γ11 = ... кН/м³`
- `γ′11 = ... кН/м³`
- `c11 = ... кПа`
- `Спосіб визначення φ11 і c11: ...`
- `b = ... м`
- `d = ... м`
- `Підвал: ...`
- `d1 = ... м` or basement parameters
- manual table Е.7 mode only: `γc1 = ...`, `γc2 = ...`

In automatic mode, `γc1` and `γc2` are not listed as user inputs because they are computed in later report steps.

### 2. Length-height ratio

Show only when `calculationMode = автоматично за характеристиками ґрунту` and `structuralScheme = жорстка`.

Caption:

`Визначення відношення довжини споруди або її відсіку до висоти для табл. Е.7 ДБН В.2.1-10-2009:`

Formula:

`L/H = L / H = ... / ... = ...`

### 3. Structural scheme

Show in automatic mode.

Caption:

`Конструктивна схема споруди згідно з примітками 1-3 до табл. Е.7 ДБН В.2.1-10-2009:`

For flexible scheme:

`Конструктивна схема: гнучка; γc2 = 1.0 згідно з приміткою 2 до табл. Е.7`

For rigid scheme when `L/H <= 1.5`:

`Конструктивна схема: жорстка; для ґрунту "<тип ґрунту>", IL = ..., L/H = ... <= 1.5 приймаємо γc2 = ... за графою "1,5 і менше" табл. Е.7`

For rigid scheme when `L/H >= 4`:

`Конструктивна схема: жорстка; для ґрунту "<тип ґрунту>", IL = ..., L/H = ... >= 4 приймаємо γc2 = ... за графою "4 і більше" табл. Е.7`

For rigid scheme when `1.5 < L/H < 4`:

Caption text remains the same and the formula is:

`γc2 = γc2,1.5 + (γc2,4 - γc2,1.5) * (L/H - 1.5) / (4 - 1.5) = ... + (... - ...) * (... - 1.5) / 2.5 = ...`

If `IL` is not applicable for the selected soil type, omit `IL = ...` from the text.

### 4. Coefficients γc1 and γc2

Manual mode caption:

`Прийняття коефіцієнтів умов роботи γc1 і γc2 користувачем за табл. Е.7 ДБН В.2.1-10-2009:`

Formula:

`γc1 = ...; γc2 = ...`

Automatic mode caption:

`Визначення коефіцієнтів умов роботи γc1 і γc2 за фактичним типом ґрунту згідно з табл. Е.7 ДБН В.2.1-10-2009:`

Formula for `γc1`:

`Для ґрунту "<тип ґрунту>", IL = ..., за рядком "<рядок табл. Е.7>" приймаємо γc1 = ...`

Formula for `γc2`:

- flexible scheme: `γc2 = 1.0 згідно з приміткою 2 до табл. Е.7`
- rigid scheme: `γc2 = ... за результатом пункту "Конструктивна схема споруди"`

If `IL` is not applicable, omit `IL = ...`.

### 5. Coefficient k

Caption:

`Визначення коефіцієнта k за способом визначення φ11 і c11 згідно з п. Е.4 ДБН В.2.1-10-2009:`

Formula when direct testing is selected:

`k = 1.0, оскільки φ11 і c11 визначені безпосередніми випробуваннями`

Formula when table values are selected:

`k = 1.1, оскільки φ11 і c11 прийняті за таблицями В.1-В.2`

### 6. Coefficients Mγ, Mq, Mc

Caption:

`Визначення коефіцієнтів Mγ, Mq, Mc за кутом внутрішнього тертя φ11 згідно з табл. Е.8 ДБН В.2.1-10-2009:`

Exact table value:

`φ11 = ...°; за табл. Е.8 приймаємо Mγ = ...; Mq = ...; Mc = ...`

Interpolated value:

`φ11 = ...° знаходиться між φa = ...° і φb = ...°; коефіцієнти визначаємо лінійною інтерполяцією за табл. Е.8`

`Mγ = Mγ,a + (Mγ,b - Mγ,a) * (φ11 - φa) / (φb - φa) = ... + (... - ...) * (... - ...) / (... - ...) = ...`

`Mq = Mq,a + (Mq,b - Mq,a) * (φ11 - φa) / (φb - φa) = ... + (... - ...) * (... - ...) / (... - ...) = ...`

`Mc = Mc,a + (Mc,b - Mc,a) * (φ11 - φa) / (φb - φa) = ... + (... - ...) * (... - ...) / (... - ...) = ...`

### 7. Coefficient kz

Caption:

`Визначення коефіцієнта kz за шириною підошви фундаменту b згідно з п. Е.4 ДБН В.2.1-10-2009:`

If `b < 10 м`:

`b = ... м < 10 м; kz = 1.0`

If `b >= 10 м`:

`kz = z0 / b + 0.2 = 8 / ... + 0.2 = ...`

### 8. Depth d1

No basement caption:

`Глибина закладання d1 для безпідвальної споруди згідно з п. Е.4 ДБН В.2.1-10-2009:`

Formula:

`d1 = ... м`

Basement caption:

`Визначення приведеної глибини закладання d1 для споруди з підвалом згідно з формулою (Е.2) ДБН В.2.1-10-2009:`

Formula:

`d1 = hs + hcf * γcf / γ′11 = ... + ... * ... / ... = ... м`

### 9. Check d1 <= d

Caption:

`Перевірка умови d1 <= d згідно з приміткою 6 до п. Е.4 ДБН В.2.1-10-2009:`

If `d1 <= d`:

`d1 <= d => ... <= ... - умова виконується; у формулі (Е.1) приймаємо d1 = ... м, db = ... м`

If `d1 > d`:

`d1 > d => ... > ...; у формулі (Е.1) приймаємо d1 = d = ... м, db = 0 м`

The calculation uses `d1,calc` and `db,calc` after this step.

### 10. Basement depth db

Show only for basement cases. Do not duplicate this step when step 9 has already set `db = 0` because `d1 > d`.

Caption:

`Визначення розрахункової глибини підвалу db згідно з п. Е.4 ДБН В.2.1-10-2009:`

If `db,input <= 2.0 м`:

`db = ... м`

If `db,input > 2.0 м`:

`db = min(db,input; 2.0) = min(...; 2.0) = 2.0 м`

### 11. Soil design resistance R

Caption:

`Визначення розрахункового опору ґрунту основи R згідно з п. Е.4, формула (Е.1) ДБН В.2.1-10-2009:`

Formula:

`R = γc1 * γc2 / k * [Mγ * kz * b * γ11 + Mq * d1 * γ′11 + (Mq - 1) * db * γ′11 + Mc * c11] = ... * ... / ... * [... * ... * ... * ... + ... * ... * ... + (... - 1) * ... * ... + ... * ...] = ... кПа`

Do not introduce intermediate report variables such as `Rγ`, `Rq`, `Rb`, or `Rc`.

### 12. Unit conversion

Caption:

`Переведення розрахункового опору R у додаткові одиниці:`

Formula:

`R = ... кПа = ... т/м² = ... кг/см²`

Rules:

- `Rт/м² = RкПа / 10`
- `Rкг/см² = RкПа / 100`

## Notation Dictionary

The implementation must centralize notation:

```ts
{
  calculationMode: "спосіб розрахунку",
  structuralScheme: "конструктивна схема споруди",
  buildingLength: "L",
  buildingHeight: "H",
  lengthHeightRatio: "L/H",
  soilType: "тип ґрунту",
  liquidityIndex: "IL",
  phi11: "φ11",
  gamma11: "γ11",
  gammaPrime11: "γ′11",
  c11: "c11",
  strengthSource: "спосіб визначення φ11 і c11",
  gammaC1: "γc1",
  gammaC2: "γc2",
  k: "k",
  mGamma: "Mγ",
  mQ: "Mq",
  mC: "Mc",
  foundationWidth: "b",
  foundationDepth: "d",
  kz: "kz",
  z0: "z0",
  hasBasement: "підвал",
  basementDepthInput: "db,input",
  basementDepth: "db",
  soilLayerAboveFooting: "hs",
  basementFloorThickness: "hcf",
  basementFloorUnitWeight: "γcf",
  embedmentDepth: "d1",
  soilDesignResistance: "R"
}
```

## UI Structure

The calculator should follow existing native calculators with reports:

- compact result summary at the top:
  - `R = ... кПа`
  - `... т/м²`
  - `... кг/см²`
- form groups:
  - `Умови роботи`
  - `Характеристики ґрунту`
  - `Геометрія`
  - `Підвал`
- report section:
  - `Покроковий звіт`
- normative section:
  - `Нормативні пункти`

Dynamic fields:

- manual `γc1/γc2` mode hides `L`, `H`, `structuralScheme`, `soilType`, and `IL`
- no-basement mode hides `db,input`, `hs`, `hcf`, and `γcf`
- soil types without `IL` hide the `IL` field

The UI must render formulas mathematically using the existing `MathNotation` pattern or a local renderer with centralized symbol definitions.

## Normative References Section

The UI should include concise summaries for:

- `п. 7.7.1 ДБН В.2.1-10-2009`
- `п. Е.4 ДБН В.2.1-10-2009, формула (Е.1)`
- `формула (Е.2) ДБН В.2.1-10-2009`
- `примітка 6 до п. Е.4`
- `примітка 7 до п. Е.4`
- `п. Е.5`
- `табл. Е.7`
- `примітки 1-4 до табл. Е.7`
- `табл. Е.8`

Summaries must be calculation-oriented and must not reproduce large DBN excerpts.

Report captions should link to matching normative entries when practical, following the foundation anchorage calculator pattern.

## Validation

Errors:

- `φ11 має бути в межах 0...45°, оскільки табл. Е.8 ДБН В.2.1-10-2009 містить значення тільки для цього діапазону.`
- `b має бути більше 0.`
- `d має бути більше 0.`
- `L має бути більше 0.` in automatic rigid mode
- `H має бути більше 0.` in automatic rigid mode
- `γ11 має бути більше 0.`
- `γ′11 має бути більше 0.`
- `c11 має бути не менше 0.`
- `IL має бути числом.` when required by soil type
- no-basement mode: `d1 має бути більше 0.`
- basement mode:
  - `db,input має бути не менше 0.`
  - `hs має бути не менше 0.`
  - `hcf має бути не менше 0.`
  - `γcf має бути не менше 0.`
  - `γcf має бути більше 0, якщо задано hcf > 0.`
  - `hcf має бути більше 0, якщо задано γcf > 0.`

Warnings:

- Loose sand:
  `Для пухких пісків значення R, знайдене за формулою (Е.1) при γc1 = 1.0 та γc2 = 1.0, повинно уточнюватись за результатами випробувань штампами згідно з приміткою 7 до п. Е.4 ДБН В.2.1-10-2009.`
- Manual table Е.7 mode:
  `γc1 і γc2 прийняті користувачем вручну за табл. Е.7; перевірте відповідність обраних значень фактичному типу ґрунту, конструктивній схемі та L/H.`
- `d1 > d`:
  `Оскільки d1 > d, у формулі (Е.1) прийнято d1 = d і db = 0 згідно з приміткою 6 до п. Е.4 ДБН В.2.1-10-2009.`

Invalid inputs must return a stable report with `valid: false`, errors, original input, and no `NaN` or `Infinity` formulas.

## Tests

Required test coverage:

- default MQN example returns `R = 162.82 кПа` and displays `162.8 кПа`, `16.3 т/м²`, `1.6 кг/см²`
- manual `γc1`, `γc2` report step
- automatic table Е.7 mapping for each soil group
- `Пісок пухкий` sets `γc1 = 1.0`, `γc2 = 1.0` and emits warning
- `γc2 = 1.0` for flexible structural scheme
- `L/H <= 1.5` uses the `1,5 і менше` table column
- `L/H >= 4` uses the `4 і більше` table column
- `1.5 < L/H < 4` interpolates `γc2` and reports the interpolation formula
- `k = 1.0` for direct testing
- `k = 1.1` for appendix В table values
- exact table Е.8 lookup for integer `φ11`
- interpolation of `Mγ`, `Mq`, `Mc` for non-integer `φ11`
- validation rejects `φ11 < 0` and `φ11 > 45`
- `kz = 1.0` for `b < 10 м`
- `kz = z0 / b + 0.2` for `b >= 10 м`
- no-basement `d1` handling
- basement formula `d1 = hs + hcf * γcf / γ′11`
- `db = min(db,input; 2.0)`
- note 6 handling when `d1 > d`
- full formula (Е.1) report string without intermediate variables
- report step order
- UI smoke test through `CalculatorShell`
- normative references render

## Registration

- `slug`: `soil-design-resistance`
- `nativeCalculator`: `soil-design-resistance`
- `title`: `Розрахунковий опір ґрунту основи`
- `shortDescription`: `Обчислення розрахункового опору ґрунту основи R за додатком Е ДБН В.2.1-10-2009.`
- `standard`: `ДБН В.2.1-10-2009, додаток Е`
- `mainCategory`: `fundamenty`
- `extraCategories`: `["perevirka-dbn", "normatyvni-obgruntuvannya"]`
- `displayMode`: `native`
- `accessLabel`: `Нативний розрахунок`
- `openUrl`: `/calculator/soil-design-resistance`
- `useCases`:
  - `Попереднє визначення R для фундаментів`
  - `Перевірка середнього тиску під підошвою`
  - `Підготовка розрахункового звіту за ДБН`
- `tags`: `["фундаменти", "ґрунт", "ДБН"]`
- `icon`: `LandPlot` if available in `lucide-react`, otherwise `Layers`

## Implementation Files

- `lib/soil-design-resistance.ts`
- `lib/soil-design-resistance.test.ts`
- `components/calculators/soil-design-resistance-calculator.tsx`
- `lib/calculators.ts`
- `components/calculator-shell.tsx`
- `data/content.json`
- `app/globals.css`
- relevant shell/UI tests in `components/calculator-shell.test.tsx`

## Verification

After implementation:

```bash
npm run test
npm run typecheck
npm run build
```
