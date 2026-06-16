# Concrete Exposure Class Report Contract

Date: 2026-06-17
Calculator: `concrete-exposure-class`
Status: Agreed source of truth for report text and formulas

This document contains the agreed Ukrainian report captions, display conditions, formula strings, warnings, errors, and handoff behavior for the concrete exposure class calculator. Implementation plans, tests, and code must treat this file as the canonical source for the step-by-step report.

Normative references must remain flexible before final release because the status of the referenced concrete standards can change. The UI and catalog copy must warn users to verify the current validity of the specific standard before applying the result in a project.

## Agreed Decisions From Chat

This contract captures the decisions agreed before implementation:

- The calculator is a standalone native calculator.
- The calculator is called from the future concrete cover durability calculator, not from the fire cover calculator.
- The future concrete cover durability calculator keeps its own `exposureClass` select with values `X0`, `XC1`, `XC2`, `XC3`, `XC4`, `XD1`, `XD2`, `XD3`, `XS1`, `XS2`, `XS3`.
- Next to that select, the future calculator shows a button that opens this exposure class calculator.
- All shared fields known in the future concrete cover durability calculator must prefill the matching fields in this calculator.
- The first agreed prefill set is `elementName`, `elementType`, `reinforcementPresence`, and `currentExposureClass`.
- After this calculator determines the result, the return link fills the `exposureClass` select in the future concrete cover durability calculator.
- The report uses the existing native report model: `caption`, `items`, `notes`, `formula`, and `formulas`.
- The report contract is the source of truth for captions, display conditions, formulas, warning text, error text, and handoff behavior.
- The design spec and implementation plan must reference this contract instead of duplicating or changing report formulas.

## Inputs

### UI Fields

```text
Назва елемента: element_name
Тип елемента: element_type
Армування або металеві закладні: reinforcement_presence
Вологісний режим для карбонізації: carbonation_moisture_condition
Джерело хлоридів: chloride_source
Вологісний режим для хлоридів: chloride_moisture_condition
Морозний вплив: freeze_thaw_risk
Хімічна агресія: chemical_attack_risk
Є аналіз ґрунту або води: has_soil_or_groundwater_analysis
```

### Input Values

`reinforcement_presence`:

```text
reinforced_or_embedded_metal
plain_concrete_without_metal
```

`carbonation_moisture_condition`:

```text
dry_or_permanently_wet
wet_rarely_dry
moderate_or_high_humidity
cyclic_wet_dry
```

`chloride_source`:

```text
none
deicing_salts
airborne_sea_salts
sea_water
```

`chloride_moisture_condition`:

```text
moderate_humidity
wet_rarely_dry
permanently_submerged
cyclic_wet_dry
splash_or_spray
```

`freeze_thaw_risk`:

```text
none
moderate_water_saturation_without_deicing
moderate_water_saturation_with_deicing
high_water_saturation_without_deicing
high_water_saturation_with_deicing_or_sea_water
```

`chemical_attack_risk`:

```text
none
XA1
XA2
XA3
unknown_requires_analysis
```

UI labels for chemical attack:

```text
Немає ознак хімічної агресії
XA1 — слабка хімічна агресія
XA2 — помірна хімічна агресія
XA3 — сильна хімічна агресія
Невідомо — потрібен аналіз ґрунту або води
```

## Handoff Parameters

When the calculator is opened from the future concrete cover durability calculator, it accepts these query parameters:

```text
elementName
elementType
reinforcementPresence
currentExposureClass
returnTo
returnField
returnLabel
```

Mapping into calculator input:

```text
elementName -> element_name
elementType -> element_type
reinforcementPresence -> reinforcement_presence
currentExposureClass -> current exposure class note in the report and UI
```

Return URL behavior:

```text
<returnTo>?<returnField>=<governing_cover_exposure_class>&sourceExposureClasses=<exposure_classes>&sourceCalculator=concrete-exposure-class
```

If `returnTo` is absent, use the future default:

```text
/calculator/concrete-cover-durability?exposureClass=<governing_cover_exposure_class>&sourceExposureClasses=<exposure_classes>&sourceCalculator=concrete-exposure-class
```

Future concrete cover durability calculator behavior:

```text
Клас впливу середовища: <select with X0/XC/XD/XS values>
Button: Визначити клас
```

The button opens this calculator with all shared data that is already known in the cover calculator:

```text
/calculator/concrete-exposure-class?returnTo=/calculator/concrete-cover-durability&returnField=exposureClass&returnLabel=Розрахунок захисного шару&elementName=<elementName>&elementType=<elementType>&reinforcementPresence=<reinforcementPresence>&currentExposureClass=<currentExposureClass>
```

On return, the future cover calculator:

- sets its `exposureClass` select to `<governing_cover_exposure_class>`;
- shows that the value came from `concrete-exposure-class`;
- may show `sourceExposureClasses` as the full exposure class set.

## Outputs

```text
exposure_classes
governing_cover_exposure_class
additional_durability_requirements
warnings
errors
valid
report_steps
```

Rules:

- `exposure_classes` contains only valid classes. Do not put `not_defined` or `XA_unknown` into this array.
- `governing_cover_exposure_class` is one class from `X0/XC/XD/XS`.
- `XF` and `XA` remain visible in `exposure_classes` and `additional_durability_requirements`, but they are not passed as the main `exposureClass` for the concrete cover table.
- If the result cannot be used, return `valid = false` with stable report steps and no non-finite values.

## Report Steps

### 1. Вихідні дані

Caption:

```text
Вихідні дані для визначення класу впливу середовища (ДБН В.2.6-98:2009, розділ 4.3-4.4; ДСТУ ENV 206:2018, класи впливу середовища):
```

Items:

```text
Назва елемента: <element_name>
Тип елемента: <element_type>
Армування або металеві закладні: <reinforcement_presence_label>
Вологісний режим для карбонізації: <carbonation_moisture_condition_label>
Джерело хлоридів: <chloride_source_label>
Вологісний режим для хлоридів: <chloride_moisture_condition_label>
Морозний вплив: <freeze_thaw_risk_label>
Хімічна агресія: <chemical_attack_risk_label>
Аналіз ґрунту або води: <has_soil_or_groundwater_analysis_label>
Поточний клас у розрахунку захисного шару: <currentExposureClass>
```

Formula:

```text
exposure_classes = f(умови карбонізації; хлориди; морозний вплив; хімічна агресія)
```

Rules:

- Show `Вологісний режим для хлоридів` only when `chloride_source != none`.
- Show `Аналіз ґрунту або води` only when `chemical_attack_risk != none`.
- Show `Поточний клас у розрахунку захисного шару` only when `currentExposureClass` is provided.

### 2. Перевірка можливості прийняття X0

Caption:

```text
Перевірка можливості прийняття класу X0 (ДБН В.2.6-98:2009, класи впливу середовища; ДСТУ ENV 206:2018, група X0):
```

Notes:

```text
Клас X0 застосовується для бетону без арматури або металевих закладних, якщо відсутні суттєві агресивні впливи середовища.
Для залізобетону або бетону з металевими закладними X0 не приймається як керівний клас, оскільки потрібно враховувати ризик корозії арматури.
```

Formula when X0 is accepted:

```text
X0 = plain_concrete_without_metal and XF = none and XA = none = true
```

Formula when X0 is not accepted:

```text
X0 = plain_concrete_without_metal and XF = none and XA = none = false
```

Rules:

- Accept X0 when `reinforcement_presence = plain_concrete_without_metal`, `freeze_thaw_risk = none`, and `chemical_attack_risk = none`.
- Do not accept X0 when the element has reinforcement or embedded metal.
- Do not accept X0 when `freeze_thaw_risk != none` or `chemical_attack_risk != none`.

### 3. Визначення XC

Caption:

```text
Визначення класу впливу за карбонізацією XC (ДБН В.2.6-98:2009, класи впливу середовища; ДСТУ ENV 206:2018, група XC):
```

Notes:

```text
Для залізобетонних елементів або бетонних елементів із металевими закладними перевіряється ризик корозії арматури внаслідок карбонізації бетону.
Клас XC визначається за вологісним режимом експлуатації.
```

Formula:

```text
XC = f(carbonation_moisture_condition) = <carbonation_moisture_condition> => <XC_class>
```

Formula when XC does not apply:

```text
XC = not_applicable
```

Rules:

```text
reinforcement_presence = plain_concrete_without_metal:
- XC не визначається

reinforcement_presence = reinforced_or_embedded_metal:
- dry_or_permanently_wet => XC1
- wet_rarely_dry => XC2
- moderate_or_high_humidity => XC3
- cyclic_wet_dry => XC4
```

If `reinforcement_presence = plain_concrete_without_metal`, add note:

```text
Елемент без арматури і металевих закладних, тому клас XC для захисту арматури від карбонізації не призначається.
```

### 4. Визначення XD

Caption:

```text
Визначення класу дії хлоридів не з морської води XD (ДБН В.2.6-98:2009, класи впливу середовища; ДСТУ ENV 206:2018, група XD):
```

Notes:

```text
Клас XD призначається, якщо на конструкцію діють хлориди не з морської води, наприклад протиожеледні солі.
Ступінь впливу залежить від вологісного режиму, змінного зволоження, висихання, бризок або розпилення.
```

Formula when `chloride_source = deicing_salts`:

```text
XD = f(chloride_moisture_condition) = <chloride_moisture_condition> => <XD_class>
```

Formula when XD does not apply:

```text
XD = not_applicable
```

Rules:

```text
chloride_source = deicing_salts:
- moderate_humidity => XD1
- wet_rarely_dry => XD2
- cyclic_wet_dry => XD3
- splash_or_spray => XD3

chloride_source = none:
- XD не визначається

chloride_source = airborne_sea_salts або sea_water:
- XD не визначається, бо це група XS
```

### 5. Визначення XS

Caption:

```text
Визначення класу дії хлоридів морського походження XS (ДБН В.2.6-98:2009, класи впливу середовища; ДСТУ ENV 206:2018, група XS):
```

Notes:

```text
Клас XS призначається, якщо конструкція зазнає дії морського середовища або хлоридів морського походження.
Для конструкцій у зоні бризок або змінного зволоження приймається більш жорсткий клас, ніж для постійного занурення.
```

Formula when `chloride_source = airborne_sea_salts`:

```text
XS = airborne_sea_salts => XS1
```

Formula when `chloride_source = sea_water`:

```text
XS = f(chloride_moisture_condition) = <chloride_moisture_condition> => <XS_class>
```

Formula when XS does not apply:

```text
XS = not_applicable
```

Rules:

```text
chloride_source = airborne_sea_salts:
- XS1

chloride_source = sea_water:
- permanently_submerged => XS2
- wet_rarely_dry => XS2
- cyclic_wet_dry => XS3
- splash_or_spray => XS3

chloride_source = none:
- XS не визначається

chloride_source = deicing_salts:
- XS не визначається, бо це група XD
```

### 6. Визначення XF

Caption:

```text
Визначення класу морозного впливу XF (ДБН В.2.6-98:2009, таблиця 4.1а; ДСТУ ENV 206:2018, група XF):
```

Notes:

```text
Клас XF призначається, якщо конструкція зазнає циклів заморожування та відтавання.
Наявність протиожеледних солей або морської води підвищує агресивність впливу.
Клас XF не передається в калькулятор захисного шару як основний exposure_class, але формує додаткові вимоги до бетону.
```

Formula:

```text
XF = f(freeze_thaw_risk) = <freeze_thaw_risk> => <XF_class або not_applicable>
```

Rules:

```text
freeze_thaw_risk = none:
- XF не визначається

moderate_water_saturation_without_deicing:
- XF1

moderate_water_saturation_with_deicing:
- XF2

high_water_saturation_without_deicing:
- XF3

high_water_saturation_with_deicing_or_sea_water:
- XF4
```

Additional requirement when XF1-XF4 applies:

```text
Для класу XF необхідно перевірити вимоги до морозостійкості бетону, водонасичення, водонепроникності, повітровтягування та складу бетонної суміші.
```

### 7. Визначення XA

Caption:

```text
Визначення класу хімічної агресії XA (ДБН В.2.6-98:2009, таблиця 4.1б; ДСТУ ENV 206:2018, група XA):
```

Notes:

```text
Клас XA призначається, якщо бетон контактує з хімічно агресивним ґрунтом, підземною водою, промисловими стоками або іншим агресивним середовищем.
Остаточне призначення XA потребує даних аналізу ґрунту або води.
Клас XA не передається в калькулятор захисного шару як основний exposure_class, але формує додаткові вимоги до бетону або спеціального захисту.
```

Formula:

```text
XA = f(chemical_attack_risk; has_soil_or_groundwater_analysis) = <chemical_attack_risk>; <has_soil_or_groundwater_analysis> => <XA_class або warning>
```

Rules:

```text
chemical_attack_risk = none:
- XA не визначається

chemical_attack_risk = XA1:
- exposure class: XA1 — слабка хімічна агресія

chemical_attack_risk = XA2:
- exposure class: XA2 — помірна хімічна агресія

chemical_attack_risk = XA3:
- exposure class: XA3 — сильна хімічна агресія

chemical_attack_risk = unknown_requires_analysis:
- XA не призначається остаточно
- warning: Для визначення класу XA потрібен аналіз ґрунту або води.
```

Additional requirement when XA1-XA3 applies:

```text
Для класу XA необхідно перевірити хімічну агресивність середовища та потребу у спеціальному захисті бетону.
```

Additional warning when `chemical_attack_risk = XA1/XA2/XA3` and `has_soil_or_groundwater_analysis = false`:

```text
Клас XA прийнято за вибором користувача. Для остаточного призначення класу хімічної агресії потрібен аналіз ґрунту або води.
```

### 8. Формування повного набору класів

Caption:

```text
Формування повного набору класів впливу середовища (ДБН В.2.6-98:2009, розділ 4.3-4.4; ДСТУ ENV 206:2018, класи впливу середовища):
```

Notes:

```text
Для одного елемента може бути призначено кілька класів впливу одночасно.
Класи XF та XA залишаються у повному наборі класів і не повинні втрачатися після вибору класу для захисного шару.
```

Formula:

```text
exposure_classes = union(X0; XC; XD; XS; XF; XA) = [<classes>]
```

Rules:

- Remove duplicates.
- Keep stable output order: `X0`, `XC`, `XD`, `XS`, `XF`, `XA`.
- If no classes are defined, set `valid = false`, `exposure_classes = []`, and add the error below.
- Do not use `not_defined` as an `exposure_classes` item.
- Do not add `XA_unknown` to `exposure_classes`; keep it in `warnings`.

Error:

```text
Клас впливу середовища не визначено. Потрібно уточнити умови експлуатації.
```

Example formulas:

```text
exposure_classes = union(XC4; XD3; XF4) = [XC4, XD3, XF4]
exposure_classes = union(XC2; XA_unknown) = [XC2]
```

### 9. Вибір керівного класу для захисного шару

Caption:

```text
Вибір керівного класу для розрахунку захисного шару (ДБН В.2.6-98:2009, п. 4.4.2.4.1, таблиця 4.3; п. 4.4.2.4.2, таблиця 4.4):
```

Notes:

```text
Для визначення мінімального захисного шару за довговічністю використовується один клас із груп X0, XC, XD або XS.
Якщо для елемента одночасно призначено кілька таких класів, для калькулятора захисного шару передається найбільш несприятливий клас.
Класи XF та XA не використовуються як основний exposure_class для таблиці захисного шару, але залишаються додатковими вимогами.
```

Formula:

```text
governing_cover_exposure_class = max_rank(X0; XC; XD; XS) = max_rank([<cover_candidate_classes>]) = <governing_cover_exposure_class>
```

Ranks:

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

Tie rule:

```text
Якщо два класи мають однаковий rank, залишаємо той, який раніше стоїть у стабільному порядку класів:
X0, XC1, XC2, XC3, XC4, XD1, XS1, XD2, XS2, XD3, XS3.
```

Error when `cover_candidate_classes` is empty and `reinforcement_presence = reinforced_or_embedded_metal`:

```text
Для залізобетонного елемента не визначено клас із груп X0/XC/XD/XS. Потрібно уточнити вологісний режим або дію хлоридів.
```

Warning when `cover_candidate_classes` is empty and `reinforcement_presence = plain_concrete_without_metal`:

```text
Для бетону без арматури і металевих закладних попередньо прийнято X0 для передачі в калькулятор захисного шару.
```

### 10. Додаткові вимоги до довговічності

Caption:

```text
Додаткові вимоги до довговічності (ДБН В.2.6-98:2009, таблиці 4.1а, 4.1б; ДСТУ ENV 206:2018, групи XF та XA):
```

Notes:

```text
Класи XF та XA не повинні ігноруватися після вибору керівного класу для захисного шару.
Вони формують додаткові вимоги до бетону, морозостійкості, водонепроникності, складу бетонної суміші або спеціального захисту конструкції.
```

Formula:

```text
additional_requirements = f(XF; XA) = [<additional_durability_requirements>]
```

Rules:

If XF1-XF4 exists, add:

```text
Для класу XF необхідно перевірити вимоги до морозостійкості бетону, водонасичення, водонепроникності, повітровтягування та складу бетонної суміші.
```

If XA1-XA3 exists, add:

```text
Для класу XA необхідно перевірити хімічну агресивність середовища та потребу у спеціальному захисті бетону.
```

If `chemical_attack_risk = unknown_requires_analysis`, add:

```text
Для визначення класу XA потрібен аналіз ґрунту або води.
```

If no additional requirements exist:

```text
additional_requirements = []
```

### 11. Висновок

Caption:

```text
Висновок щодо класу впливу середовища (ДБН В.2.6-98:2009, розділ 4.3-4.4; ДСТУ ENV 206:2018, класи впливу середовища):
```

Notes:

```text
За результатами аналізу умов експлуатації визначено повний набір класів впливу середовища та керівний клас для подальшого розрахунку захисного шару бетону.
```

Formula:

```text
exposure_classes -> governing_cover_exposure_class = [<exposure_classes>] -> <governing_cover_exposure_class>
```

UI result:

```text
Повний набір класів: <exposure_classes>
Для розрахунку захисного шару прийнято: <governing_cover_exposure_class>
```

If opened from the future concrete cover durability calculator through `returnTo`, show button:

```text
Повернути клас <governing_cover_exposure_class> у розрахунок захисного шару
```

If `returnTo` is absent, show link button:

```text
Використати в розрахунку захисного шару
```

## Contract Self-Review

Checked against the agreed chat decisions:

- The calculator is documented as standalone.
- The integration direction is documented as future concrete cover durability calculator -> this calculator -> future concrete cover durability calculator.
- The requested future calculator 1 UX is documented: exposure class select plus a button that opens this calculator.
- Shared data prefill is documented for `elementName`, `elementType`, `reinforcementPresence`, and `currentExposureClass`.
- Return behavior is documented with `returnTo`, `returnField`, `returnLabel`, `sourceExposureClasses`, and `sourceCalculator`.
- The agreed input fields are present.
- The chemical attack labels include XA explanations: weak, moderate, strong, and unknown requiring analysis.
- All 11 agreed report steps are present.
- Step 2 includes the agreed X0 restriction for reinforced concrete.
- Step 3 includes XC mapping.
- Step 4 includes XD mapping and makes `moderate_humidity` valid for `chloride_moisture_condition`.
- Step 5 includes XS mapping and the agreed `wet_rarely_dry => XS2` rule.
- Step 6 includes XF mapping and the additional durability requirement.
- Step 7 includes XA mapping, the no-analysis warning, and the rule that XA is not calculated from concentrations in this version.
- Step 8 keeps `exposure_classes` free of `not_defined` and `XA_unknown`.
- Step 9 uses the agreed rank-based governing class selection and tie order.
- Step 10 keeps XF and XA as additional requirements.
- Step 11 defines the conclusion and return/use button behavior.
- The contract states that implementation plans and tests must use this file as the source of truth.
