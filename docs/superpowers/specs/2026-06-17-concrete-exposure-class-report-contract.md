# Concrete Exposure Class Report Contract

Date: 2026-06-17
Calculator: `concrete-exposure-class`
Status: Agreed source of truth

2026-07-15 amendment status: Pending written-spec confirmation

This document contains the Ukrainian UI labels, report captions, display conditions, item text, formula strings, warning/error text, and handoff behavior for the concrete exposure class calculator.

Implementation plans, tests, and code must treat this file as the canonical source. If any report wording or formula changes during implementation, update this file first and get approval before changing tests or code.

## Source Evidence

Primary source:

```text
ДБН В.2.6-98:2009, розділ 4.3, таблиця 4.1, зі Зміною № 1.
PDF pages visually checked: С.29-С.30, rendered from BN01_5212-1786-8542-9081_3b0f018116.pdf.
```

Evidence notes:

- `X0`, `XC1-XC4`, `XD1-XD3`, `XF1-XF4`, and `XA1-XA3` are table 4.1 rows in the provided DBN PDF.
- `X0` row includes `Дуже сухий повітряно-вологісний режим (RH <= 30 %)`.
- `XC1` row includes `Сухий повітряно-вологісний режим (30 % < RH <= 60 %)`.
- `XC3` row includes `Помірний повітряно-вологісний режим (60 % < RH <= 75 %)`.
- `XD1` row includes `RH > 75 %`.
- `XS1-XS3` are not table 4.1 rows in the provided DBN PDF. They are kept as a separate marine-chloride block by DSTU ENV/EN 206 class logic because DBN cover tables group `XD/XS` columns.
- Tables 4.1(a) and 4.1(b) are not exposure-class mapping tables. They define frost-resistance and water-tightness grades for concrete depending on service conditions.

## Agreed Decisions From Chat

- Use a row-driven UI instead of informal shared moisture buckets.
- Keep `XS1-XS3` as a separate marine-chloride block, but do not describe them as rows of DBN table 4.1.
- The calculator remains a standalone native calculator.
- The calculator is called from the future concrete cover durability calculator, not from the fire cover calculator.
- The future concrete cover durability calculator keeps its own `exposureClass` select with values `X0`, `XC1`, `XC2`, `XC3`, `XC4`, `XD1`, `XD2`, `XD3`, `XS1`, `XS2`, `XS3`.
- The first agreed prefill set is `elementName`, `elementType`, `reinforcementPresence`, and `currentExposureClass`.
- After this calculator determines the result, the return link fills the `exposureClass` select in the future concrete cover durability calculator.
- The report uses the existing native report model: `caption`, `items`, `notes`, `formula`, and `formulas`.
- The design spec and implementation plan must reference this contract instead of duplicating or changing report formulas.

## Inputs

### UI Fields

```text
Назва елемента: element_name
Тип елемента: element_type
Армування або металеві закладні: reinforcement_presence
Клас X0/XC за таблицею 4.1 ДБН: carbonation_exposure_row
Хлориди не з морської води XD за таблицею 4.1 ДБН: xd_exposure_row
Хлориди морського походження XS за ДСТУ ENV/EN 206: xs_exposure_row
Поперемінне заморожування-відтавання XF за таблицею 4.1 ДБН: xf_exposure_row
Хімічні та біологічні дії XA за таблицею 4.1 ДБН: xa_exposure_row
Є підтвердження агресивності середовища за ДСТУ Б В.2.6-145: has_chemical_aggressiveness_confirmation
```

### Input Values And UI Labels

`reinforcement_presence`:

```text
reinforced_or_embedded_metal: Залізобетон або бетон з металевими закладними
plain_concrete_without_metal: Бетон без арматури і металевих закладних
```

`carbonation_exposure_row`:

```text
X0: X0 — агресивні дії відсутні; дуже сухий повітряно-вологісний режим (RH <= 30 %)
XC1: XC1 — сухий повітряно-вологісний режим (30 % < RH <= 60 %) або постійна експлуатація у вологонасиченому стані
XC2: XC2 — водонасичений стан при епізодичному висушуванні
XC3: XC3 — помірний повітряно-вологісний режим (60 % < RH <= 75 %) або експлуатація в умовах епізодичного вологонасичення
XC4: XC4 — поперемінне зволоження та висушування
```

`xd_exposure_row`:

```text
none: Немає дії хлоридів не з морської води
XD1: XD1 — вологий, в умовах повітряно-вологісного стану (RH > 75 %) за відсутності епізодичного водонасичення
XD2: XD2 — у водонасиченому стані
XD3: XD3 — поперемінне зволоження і висушування
```

`xs_exposure_row`:

```text
none: Немає дії хлоридів морського походження
XS1: XS1 — дія солей морського походження в повітрі, без безпосереднього контакту з морською водою
XS2: XS2 — постійне занурення в морську воду
XS3: XS3 — зона припливу, бризок або обприскування морською водою
```

`xf_exposure_row`:

```text
none: Немає поперемінного заморожування-відтавання
XF1: XF1 — епізодичне водонасичення, дія від'ємних температур за відсутності антиобморожувачів
XF2: XF2 — те саме, у присутності антиобморожувачів
XF3: XF3 — водонасичений стан, антиобморожувачі не застосовують
XF4: XF4 — водонасичений стан, застосовують антиобморожувачі
```

`xa_exposure_row`:

```text
none: Немає хімічних або біологічних агресивних дій
XA1: XA1 — слабоагресивне середовище
XA2: XA2 — середньоагресивне середовище
XA3: XA3 — сильноагресивне середовище
unknown_requires_classification: Невідомо — потрібна класифікація агресивності середовища
```

`has_chemical_aggressiveness_confirmation`:

```text
false: ні
true: так
```

Display rules:

- Always show `carbonation_exposure_row`.
- Always show `xd_exposure_row`.
- Always show `xs_exposure_row`.
- Always show `xf_exposure_row`.
- Always show `xa_exposure_row`.
- Show `has_chemical_aggressiveness_confirmation` only when `xa_exposure_row` is `XA1`, `XA2`, `XA3`, or `unknown_requires_classification`.

## DBN Table 4.1 Row Data

These exact row labels, examples, and minimum concrete classes must be available to the report builder.

### X0/XC rows

```text
X0
Характеристика: Відсутнє поперемінно заморожування-відтавання, хімічні дії, стирання тощо. Дуже сухий повітряно-вологісний режим (RH <= 30 %).
Приклад: Конструкції всередині приміщень із сухим режимом згідно з ДБН В.1.2-2 та ДСТУ Б В.2.6-145.
Мінімальний клас бетону: C8/10

XC1
Характеристика: Сухий повітряно-вологісний режим (30 % < RH <= 60 %) або постійна експлуатація у вологонасиченому стані.
Приклад: Конструкції всередині приміщень із нормальним режимом згідно з ДБН В.1.2-2 та ДСТУ Б В.2.6-145; конструкції, які постійно знаходяться в грунті або під водою.
Мінімальний клас бетону: C12/15

XC2
Характеристика: Водонасичений стан при епізодичному висушуванні.
Приклад: Конструкції, поверхня яких тривалий час контактує з водою.
Мінімальний клас бетону: C16/20

XC3
Характеристика: Помірний повітряно-вологісний режим (60 % < RH <= 75 %) або експлуатація в умовах епізодичного вологонасичення.
Приклад: Конструкції всередині приміщень із вологим режимом згідно з ДБН В.1.2-2 та ДСТУ Б В.2.6-145; надвірні конструкції, захищені від атмосферних опадів (дощу).
Мінімальний клас бетону: C20/25

XC4
Характеристика: Поперемінне зволоження та висушування.
Приклад: Конструкції, поверхні яких контактують з водою, але не відповідають класу XC2.
Мінімальний клас бетону: C25/30
```

### XD rows

```text
XD1
Характеристика: Вологий, в умовах повітряно-вологісного стану (RH > 75 %) за відсутності епізодичного водонасичення.
Приклад: Конструкції, поверхні яких контактують із газоподібними середовищами з вмістом хлорид-іонів.
Мінімальний клас бетону: C25/30

XD2
Характеристика: У водонасиченому стані.
Приклад: Залізобетонні конструкції, які контактують з технічною водою, що містить хлорид-іони; басейни для плавання.
Мінімальний клас бетону: C30/35

XD3
Характеристика: Поперемінне зволоження і висушування.
Приклад: Елементи мостових конструкцій; трубопроводи; плити автостоянок тощо.
Мінімальний клас бетону: C30/35
```

### XF rows

```text
XF1
Характеристика: Епізодичне водонасичення, дія від'ємних температур за відсутності антиобморожувачів.
Приклад: Конструкції, вертикальні поверхні яких зазнають атмосферних дій.
Мінімальний клас бетону: C25/30

XF2
Характеристика: Те саме, у присутності антиобморожувачів.
Приклад: Конструкції, вертикальні поверхні яких зазнають атмосферних дій та попадання антиобморожувачів, що містяться у повітрі.
Мінімальний клас бетону: C20/25

XF3
Характеристика: Водонасичений стан, антиобморожувачі не застосовують.
Приклад: Конструкції, горизонтальні поверхні яких зазнають атмосферних дій.
Мінімальний клас бетону: C25/30

XF4
Характеристика: Водонасичений стан, застосовують антиобморожувачі.
Приклад: Конструкції, горизонтальні поверхні яких зазнають прямих дій антиобморожувачів; проїзні частини мостів, шляхи.
Мінімальний клас бетону: C25/30
```

### XA rows

```text
XA1
Характеристика: Слабоагресивне середовище.
Приклад: Згідно з ДСТУ Б В.2.6-145.
Мінімальний клас бетону: C25/30

XA2
Характеристика: Середньоагресивне середовище.
Приклад: Згідно з ДСТУ Б В.2.6-145.
Мінімальний клас бетону: C25/30

XA3
Характеристика: Сильноагресивне середовище.
Приклад: Згідно з ДСТУ Б В.2.6-145.
Мінімальний клас бетону: C30/35
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

## Outputs

```text
exposure_classes
governing_cover_exposure_class
dbn_minimum_concrete_classes
additional_durability_requirements
warnings
errors
valid
report_steps
```

Rules:

- `exposure_classes` contains only valid classes. Do not put `none`, `not_defined`, or `XA_unknown` into this array.
- `dbn_minimum_concrete_classes` contains the minimum concrete classes from selected DBN table 4.1 rows. It does not include `XS`, because `XS` is not a table 4.1 row in the provided DBN PDF.
- `governing_cover_exposure_class` is one class from `X0/XC/XD/XS`.
- `XF` and `XA` remain visible in `exposure_classes` and `additional_durability_requirements`, but they are not passed as the main `exposureClass` for the concrete cover table.
- If the result cannot be used, return `valid = false` with stable report steps and no non-finite values.

## Report Steps

### 1. Вихідні дані

Caption:

```text
Вихідні дані для визначення класів впливу середовища (ДБН В.2.6-98:2009, розділ 4.3, таблиця 4.1; ДСТУ ENV/EN 206 для XS):
```

Items:

```text
Назва елемента: <element_name>
Тип елемента: <element_type>
Армування або металеві закладні: <reinforcement_presence_label>
Клас X0/XC за таблицею 4.1 ДБН: <carbonation_exposure_row_label>
Хлориди не з морської води XD за таблицею 4.1 ДБН: <xd_exposure_row_label>
Хлориди морського походження XS за ДСТУ ENV/EN 206: <xs_exposure_row_label>
Поперемінне заморожування-відтавання XF за таблицею 4.1 ДБН: <xf_exposure_row_label>
Хімічні та біологічні дії XA за таблицею 4.1 ДБН: <xa_exposure_row_label>
Підтвердження агресивності середовища за ДСТУ Б В.2.6-145: <has_chemical_aggressiveness_confirmation_label>
Поточний клас у розрахунку захисного шару: <currentExposureClass>
```

Formula:

```text
класи впливу = union(X0/XC; XD; XS; XF; XA)
```

Rules:

- Show `Підтвердження агресивності середовища за ДСТУ Б В.2.6-145` only when `xa_exposure_row != none`.
- Show `Поточний клас у розрахунку захисного шару` only when `currentExposureClass` is provided.

### 2. Визначення X0/XC

Caption:

```text
Визначення класу X0/XC за карбонізацією або відсутністю агресивних дій (ДБН В.2.6-98:2009, таблиця 4.1, рядки X0, XC1-XC4):
```

Items when `carbonation_exposure_row` is selected:

```text
Рядок таблиці 4.1: <carbonation_exposure_class>
Характеристика середовища: <dbn_characteristic>
Приклад умов середовища: <dbn_example>
Мінімальний клас бетону за таблицею 4.1: <dbn_minimum_concrete_class>
```

Notes:

```text
Рядок X0 допускається для умов без поперемінного заморожування-відтавання, хімічних дій, стирання тощо та для дуже сухого повітряно-вологісного режиму (RH <= 30 %).
Рядки XC1-XC4 застосовуються для корозійних пошкоджень, викликаних карбонізацією бетону.
```

Formula:

```text
X0/XC = рядок таблиці 4.1: <dbn_characteristic> => <carbonation_exposure_class>
```

Rules:

```text
carbonation_exposure_row = X0 -> X0
carbonation_exposure_row = XC1 -> XC1
carbonation_exposure_row = XC2 -> XC2
carbonation_exposure_row = XC3 -> XC3
carbonation_exposure_row = XC4 -> XC4
```

Warning when `carbonation_exposure_row = X0` and (`xd_exposure_row != none` or `xs_exposure_row != none` or `xf_exposure_row != none` or `xa_exposure_row != none`):

```text
Для X0 агресивні дії мають бути відсутні; вибрані додаткові класи впливу перевірте на сумісність із рядком X0 таблиці 4.1.
```

### 3. Визначення XD

Caption:

```text
Визначення класу дії хлоридів не з морської води XD (ДБН В.2.6-98:2009, таблиця 4.1, рядки XD1-XD3):
```

Items when `xd_exposure_row != none`:

```text
Рядок таблиці 4.1: <xd_exposure_class>
Характеристика середовища: <dbn_characteristic>
Приклад умов середовища: <dbn_example>
Мінімальний клас бетону за таблицею 4.1: <dbn_minimum_concrete_class>
```

Notes:

```text
Класи XD призначаються для корозійних пошкоджень, викликаних хлоридами не з морської води.
```

Formula when `xd_exposure_row != none`:

```text
XD = рядок таблиці 4.1: <dbn_characteristic> => <xd_exposure_class>
```

Formula when `xd_exposure_row = none`:

```text
XD = не застосовується
```

### 4. Визначення XS

Caption:

```text
Визначення класу дії хлоридів морського походження XS (ДСТУ ENV/EN 206, група XS; у ДБН В.2.6-98:2009 таблиці 4.3 і 4.4 класи XS враховані разом із XD):
```

Items when `xs_exposure_row != none`:

```text
Клас XS: <xs_exposure_class>
Характеристика середовища: <xs_exposure_row_label>
```

Notes:

```text
У наданому PDF ДБН В.2.6-98:2009 класи XS1-XS3 не наведені як рядки таблиці 4.1.
Класи XS потрібні для передачі в розрахунок захисного шару, оскільки таблиці 4.3 і 4.4 ДБН групують колонки XD/XS.
```

Formula when `xs_exposure_row != none`:

```text
XS = клас хлоридів морського походження за ДСТУ ENV/EN 206 => <xs_exposure_class>
```

Formula when `xs_exposure_row = none`:

```text
XS = не застосовується
```

### 5. Визначення XF

Caption:

```text
Визначення класу поперемінного заморожування-відтавання XF (ДБН В.2.6-98:2009, таблиця 4.1, рядки XF1-XF4):
```

Items when `xf_exposure_row != none`:

```text
Рядок таблиці 4.1: <xf_exposure_class>
Характеристика середовища: <dbn_characteristic>
Приклад умов середовища: <dbn_example>
Мінімальний клас бетону за таблицею 4.1: <dbn_minimum_concrete_class>
```

Notes:

```text
Класи XF призначаються для корозійних пошкоджень, викликаних поперемінним заморожуванням-відтаванням.
Таблиці 4.1(a) і 4.1(b) додатково нормують марки бетону за морозостійкістю та водонепроникністю; вони не замінюють вибір рядка XF у таблиці 4.1.
Клас XF не передається в калькулятор захисного шару як основний exposure_class, але формує додаткові вимоги до бетону.
```

Formula when `xf_exposure_row != none`:

```text
XF = рядок таблиці 4.1: <dbn_characteristic> => <xf_exposure_class>
```

Formula when `xf_exposure_row = none`:

```text
XF = не застосовується
```

Additional requirement when XF1-XF4 applies:

```text
Для класу XF необхідно перевірити вимоги до морозостійкості бетону, водонасичення, водонепроникності, повітровтягування та складу бетонної суміші.
```

### 6. Визначення XA

Caption:

```text
Визначення класу хімічних та біологічних дій XA (ДБН В.2.6-98:2009, таблиця 4.1, рядки XA1-XA3; ДСТУ Б В.2.6-145 для класифікації агресивності середовища):
```

Items when `xa_exposure_row = XA1/XA2/XA3`:

```text
Рядок таблиці 4.1: <xa_exposure_class>
Характеристика середовища: <dbn_characteristic>
Приклад умов середовища: <dbn_example>
Мінімальний клас бетону за таблицею 4.1: <dbn_minimum_concrete_class>
```

Notes:

```text
Клас XA призначається для корозійних пошкоджень, викликаних хімічними та біологічними діями.
Агресивність середовища для XA має бути класифікована за ДСТУ Б В.2.6-145.
Клас XA не передається в калькулятор захисного шару як основний exposure_class, але формує додаткові вимоги до бетону або спеціального захисту.
```

Formula when `xa_exposure_row = XA1/XA2/XA3`:

```text
XA = рядок таблиці 4.1: <dbn_characteristic>; підтвердження = <так/ні> => <xa_exposure_class>
```

Formula when `xa_exposure_row = unknown_requires_classification`:

```text
XA = потрібна класифікація агресивності середовища за ДСТУ Б В.2.6-145
```

Formula when `xa_exposure_row = none`:

```text
XA = не застосовується
```

Warning when `xa_exposure_row = unknown_requires_classification`:

```text
Для визначення класу XA потрібна класифікація агресивності середовища за ДСТУ Б В.2.6-145.
```

Warning when `xa_exposure_row = XA1/XA2/XA3` and `has_chemical_aggressiveness_confirmation = false`:

```text
Клас XA прийнято за вибором користувача. Для остаточного призначення класу хімічної агресії потрібне підтвердження агресивності середовища за ДСТУ Б В.2.6-145.
```

Additional requirement when XA1-XA3 applies:

```text
Для класу XA необхідно перевірити хімічну агресивність середовища та потребу у спеціальному захисті бетону.
```

### 7. Формування повного набору класів

Caption:

```text
Формування повного набору класів впливу середовища (ДБН В.2.6-98:2009, таблиця 4.1; ДСТУ ENV/EN 206 для XS):
```

Notes:

```text
Для одного елемента може бути призначено кілька класів впливу одночасно.
Класи XF та XA залишаються у повному наборі класів і не повинні втрачатися після вибору класу для захисного шару.
```

Formula:

```text
класи впливу = union(X0/XC; XD; XS; XF; XA) = [<classes>]
```

Rules:

- Remove duplicates.
- Keep stable output order: `X0`, `XC`, `XD`, `XS`, `XF`, `XA`.
- Do not use `none`, `not_defined`, or `XA_unknown` as `exposure_classes` items.
- If `xa_exposure_row = unknown_requires_classification`, do not add `XA_unknown` to `exposure_classes`; keep the requirement in `warnings`.
- If no classes are defined, set `valid = false`, `exposure_classes = []`, and add the error below.

Error:

```text
Клас впливу середовища не визначено. Потрібно уточнити умови експлуатації.
```

Example formulas:

```text
класи впливу = union(XC4; XD3; XF4) = [XC4, XD3, XF4]
класи впливу = union(XC2; XA потребує класифікації) = [XC2]
```

### 8. Мінімальні класи бетону за таблицею 4.1

Caption:

```text
Фіксація мінімальних класів бетону за вибраними рядками ДБН (ДБН В.2.6-98:2009, таблиця 4.1):
```

Items:

```text
<selected_dbn_exposure_class>: мінімальний клас бетону <dbn_minimum_concrete_class>
```

Notes:

```text
Цей крок фіксує тільки мінімальні класи бетону, прямо наведені у таблиці 4.1 для вибраних рядків X0/XC, XD, XF та XA.
Для XS у цьому кроці значення не додається, оскільки XS1-XS3 не наведені як рядки таблиці 4.1 у наданому PDF ДБН.
```

Formula when at least one DBN table 4.1 row is selected:

```text
мінімальні класи бетону за таблицею 4.1 = [<class>: <minimum>; ...]
```

Formula when no DBN table 4.1 row is selected:

```text
мінімальні класи бетону за таблицею 4.1 = []
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
керівний клас = max([<cover_candidate_classes>]) = <governing_cover_exposure_class>
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

Error when `cover_candidate_classes` is empty:

```text
Для елемента не визначено клас із груп X0/XC/XD/XS. Потрібно уточнити умови експлуатації для захисного шару.
```

### 10. Додаткові вимоги до довговічності

Caption:

```text
Додаткові вимоги до довговічності (ДБН В.2.6-98:2009, таблиці 4.1, 4.1(a), 4.1(b); ДСТУ Б В.2.6-145 для XA):
```

Notes:

```text
Класи XF та XA не повинні ігноруватися після вибору керівного класу для захисного шару.
Вони формують додаткові вимоги до бетону, морозостійкості, водонепроникності, складу бетонної суміші або спеціального захисту конструкції.
```

Formula:

```text
додаткові вимоги = f(XF; XA) = [<additional_durability_requirements>]
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

If `xa_exposure_row = unknown_requires_classification`, add:

```text
Для визначення класу XA потрібна класифікація агресивності середовища за ДСТУ Б В.2.6-145.
```

If no additional requirements exist:

```text
додаткові вимоги = []
```

### 11. Висновок

Caption:

```text
Висновок щодо класів впливу середовища (ДБН В.2.6-98:2009, розділ 4.3-4.4; ДСТУ ENV/EN 206 для XS):
```

Notes:

```text
За результатами аналізу умов експлуатації визначено повний набір класів впливу середовища та керівний клас для подальшого розрахунку захисного шару бетону.
```

Formula:

```text
класи впливу => керівний клас = [<exposure_classes>] => <governing_cover_exposure_class>
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

## Normative References UI

The calculator page must include a section titled:

```text
Нормативні посилання
```

Items:

```text
ДБН В.2.6-98:2009, розділ 4.3, таблиця 4.1
Рядки X0, XC1-XC4, XD1-XD3, XF1-XF4 та XA1-XA3 для визначення класів умов експлуатації конструкцій.

ДБН В.2.6-98:2009, таблиці 4.1(a) і 4.1(b)
Марки бетону за морозостійкістю та водонепроникністю залежно від режиму експлуатації; ці таблиці не замінюють вибір класів XF у таблиці 4.1.

ДСТУ ENV/EN 206, група XS
Класи хлоридів морського походження XS1-XS3; у ДБН В.2.6-98:2009 таблиці 4.3 і 4.4 вони враховані в колонках XD/XS для захисного шару.

ДСТУ Б В.2.6-145
Класифікація агресивності середовища для прийняття XA1-XA3.
```

## Contract Self-Review

Checked before user confirmation:

- The contract no longer uses informal moisture labels such as `сухо`, `постійно мокро`, or `помірна вологість` as DBN substitutes.
- X0 includes the formal DBN text `дуже сухий повітряно-вологісний режим (RH <= 30 %)`.
- XC1 includes `30 % < RH <= 60 %`.
- XC3 includes `60 % < RH <= 75 %`.
- XD1 includes `RH > 75 %`.
- XF and XA are tied to DBN table 4.1, not to 4.1(a) or 4.1(b).
- XS is documented as a separate DSTU ENV/EN 206 block, not as DBN table 4.1 rows.
- The future cover handoff still supports `X0/XC/XD/XS`.
- The report contains exact captions, formula strings, warnings, errors, and display rules.
- This file is marked `Agreed source of truth` after user confirmation.
