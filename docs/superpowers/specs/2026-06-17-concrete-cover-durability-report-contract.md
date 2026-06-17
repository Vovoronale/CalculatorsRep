# Concrete Cover Durability Report Contract

Date: 2026-06-17
Calculator: `concrete-cover-durability`
Status: Agreed source of truth for report text and formulas

This file captures the agreed UI labels, report captions, display conditions,
items, notes, formula strings, warning text, and handoff parameters for the
concrete cover durability calculator. Implementation plans, tests, and code
must treat this file as canonical.

If any report wording or formula changes during implementation, update this
file first and get approval before changing tests or code.

## Agreed Scope

The calculator follows the full concrete cover flow from ДБН В.2.6-98:2009,
section 4.4, including:

- minimum cover for bond, `cmin,b`, by p. 4.4.2.3 and table 4.2;
- minimum cover for durability, `cmin,dur`, by p. 4.4.2.4.1/table 4.3 or p. 4.4.2.4.2/table 4.4;
- structural class `S` by p. 4.4.2.4.3 and table 4.5;
- explicit adjustment fields `Δcdur,γ`, `Δcdur,st`, and `Δcdur,add`;
- nominal cover `cnom` by p. 4.4.3;
- warning about constructive reinforcement when `cnom > 45 мм` by p. 4.4.2.4.4;
- temporary first version without a drawing.

## Inputs

### UI Fields

```text
Назва елемента: element_name
Клас впливу середовища: exposure_class
Тип арматурної сталі для довговічності: reinforcement_durability_type
Спосіб визначення cmin,b: bond_cover_mode
Діаметр стрижня: φ = ... мм
Еквівалентний діаметр пасма: φp = ... мм
Діаметр круглого каналу: dduct = ... мм
Менша сторона прямокутного каналу: aduct = ... мм
Більша сторона прямокутного каналу: bduct = ... мм
Діаметр елемента при напруженні на упори: dp = ... мм
Номінальний максимальний розмір заповнювача: Dmax = ... мм
Спосіб визначення класу конструкції S: construction_class_mode
Клас конструкції вручну: S = ...
Розрахунковий строк експлуатації: design_working_life
Клас міцності бетону: concrete_class
Елемент має форму плити: is_slab_element
Забезпечено спеціальний контроль якості виготовлення бетону: has_special_quality_control
Поправка на надійність при застосуванні добавок: Δcdur,γ = ... мм
Зменшення при застосуванні нержавіючої сталі: Δcdur,st = ... мм
Зменшення при додатковому захисті: Δcdur,add = ... мм
Допуск на відхил: Δcdev = ... мм
```

### Field Descriptions

`Δcdev` description:

```text
Допуск на відхил Δcdev додається до мінімального захисного шару для визначення номінального захисного шару cnom. За п. 4.4.3 ДБН В.2.6-98:2009 товщину мінімального захисного шару необхідно збільшити на абсолютне значення допустимого від'ємного відхилу. Рекомендоване значення за приміткою до п. 4.4.3: Δcdev = 10 мм.
```

### Conditional Input Display Rules

- Show `φ` only when `bond_cover_mode = роздільне розташування стрижнів`.
- Show `φp` only when `bond_cover_mode = пасмо`.
- Show `dduct` only when `bond_cover_mode = канал круглий`.
- Show `aduct` and `bduct` only when `bond_cover_mode = канал прямокутний`.
- Show `dp` only when `bond_cover_mode = напруження на упори: канат або гладкий дріт` or `bond_cover_mode = напруження на упори: стрижень періодичного профілю`.
- Show manual `S` only when `construction_class_mode = вручну`.
- Show `design_working_life`, `concrete_class`, `is_slab_element`, and `has_special_quality_control` only when `construction_class_mode = автоматично за табл. 4.5`.

### Exposure Class Calculator Action

The `Клас впливу середовища` field has a right-side inspector `calculatorAction`.

```text
Visible button text: не показується; відображається тільки піктограма калькулятора в правій action-колонці інспектора.
Hint / title / aria-label: Розрахувати клас впливу
```

Cover calculator -> exposure calculator query parameters:

```text
returnTo=/calculator/concrete-cover-durability
returnField=exposureClass
returnLabel=Розрахунок захисного шару
elementName=<Назва елемента>
elementType=<Тип елемента>
reinforcementPresence=<Тип/наявність армування>
currentExposureClass=<поточний exposureClass>
```

Exposure calculator -> cover calculator return:

```text
<returnTo>?<returnField>=<governing_cover_exposure_class>&sourceExposureClasses=<exposure_classes>&sourceCalculator=concrete-exposure-class
```

Cover calculator on return:

```text
sets "Клас впливу середовища" to <governing_cover_exposure_class>
keeps the full sourceExposureClasses for audit note/report
shows that value came from concrete-exposure-class
```

## Report Steps

### 1. Вихідні дані

Caption:

```text
Вихідні дані для розрахунку захисного шару бетону (ДБН В.2.6-98:2009, розділ 4.4):
```

Items:

```text
Назва елемента: <element_name>
Клас впливу середовища: <exposure_class>
Тип арматурної сталі для довговічності: <reinforcement_durability_type_label>
Спосіб визначення cmin,b: <bond_cover_mode_label>
Діаметр стрижня: φ = ... мм
Еквівалентний діаметр пасма: φp = ... мм
Діаметр круглого каналу: dduct = ... мм
Менша сторона прямокутного каналу: aduct = ... мм
Більша сторона прямокутного каналу: bduct = ... мм
Діаметр елемента при напруженні на упори: dp = ... мм
Номінальний максимальний розмір заповнювача: Dmax = ... мм
Спосіб визначення класу конструкції S: <construction_class_mode_label>
Клас конструкції вручну: S = ...
Розрахунковий строк експлуатації: <design_working_life_label>
Клас міцності бетону: <concrete_class>
Елемент має форму плити: <так/ні>
Забезпечено спеціальний контроль якості виготовлення бетону: <так/ні>
Поправка на надійність при застосуванні добавок: Δcdur,γ = ... мм
Зменшення при застосуванні нержавіючої сталі: Δcdur,st = ... мм
Зменшення при додатковому захисті: Δcdur,add = ... мм
Допуск на відхил: Δcdev = ... мм
```

Rules:

- Show conditional fields according to the UI conditional input display rules.
- Show only data entered by the user or required to audit the selected calculation scheme.
- Do not list calculated coefficients or table values as source inputs.
- If `sourceCalculator = concrete-exposure-class`, add this note:

```text
Клас впливу середовища отримано з калькулятора визначення класу впливу; повний набір класів: <sourceExposureClasses>.
```

### 2. cmin,b за вимогами зчеплення

Caption:

```text
Визначення мінімального захисного шару за вимогами зчеплення cmin,b (п. 4.4.2.3, табл. 4.2 ДБН В.2.6-98:2009):
```

Formulas by mode:

```text
cmin,b = φ = ... мм
cmin,b = φp = ... мм
cmin,b = dduct = ... мм
cmin,b = max(aduct; bduct / 2) = max(...; ... / 2) = ... мм
cmin,b = 1.5 * dp = 1.5 * ... = ... мм
cmin,b = 2.5 * dp = 2.5 * ... = ... мм
```

Note and formula when `Dmax > 32 мм`:

```text
Оскільки Dmax = ... мм > 32 мм, згідно з приміткою до табл. 4.2 cmin,b збільшується на 5 мм.
cmin,b = cmin,b,base + 5 = ... + 5 = ... мм
```

### 3. Клас конструкції S

Automatic mode caption:

```text
Визначення класу конструкції S за розрахунковим строком експлуатації та факторами впливу (п. 4.4.2.4.3, табл. 4.5 ДБН В.2.6-98:2009):
```

Automatic mode formulas:

```text
Sbase = S4
S1 = Sbase + 2 = S4 + 2 = S6
S2 = S1 - 1 = ... - 1 = ...
S3 = S2 - 1 = ... - 1 = ...
S = S3 - 1 = ... - 1 = ...
S = clamp(<розрахований клас>; S1; S6) = ...
```

Automatic mode notes:

```text
Для розрахункового строку експлуатації 50 років приймається S4.
Розрахунковий строк експлуатації 100 років: збільшення на 2 класи.
Клас міцності бетону <concreteClass> >= <requiredConcreteClass>: зменшення на 1 клас.
Елемент має форму плити: зменшення на 1 клас.
Забезпечено спеціальний контроль якості виготовлення бетону: зменшення на 1 клас.
Клас конструкції обмежується діапазоном S1...S6.
```

Rules:

- Show the 100-year formula only when `design_working_life = 100 років`.
- Show the concrete-class reduction formula only when the concrete class satisfies the minimum class for the selected exposure-class column in table 4.5.
- Show the slab reduction formula only when `is_slab_element = так`.
- Show the special-quality-control reduction formula only when `has_special_quality_control = так`.
- Always show the final clamp formula.

Manual mode caption:

```text
Прийняття класу конструкції S користувачем:
```

Manual mode formula:

```text
S = <manual S>
```

### 4. cmin,dur за умовами довговічності

Caption:

```text
Визначення мінімального захисного шару за умовами довговічності cmin,dur (п. 4.4.2.4.1, табл. 4.3 / п. 4.4.2.4.2, табл. 4.4 ДБН В.2.6-98:2009):
```

Table selection rules:

```text
Тип арматурної сталі для довговічності = звичайна: використовується табл. 4.3.
Тип арматурної сталі для довговічності = попередньо напружена: використовується табл. 4.4.
```

Exposure-class column grouping:

```text
X0 -> X0
XC1 -> XC1
XC2 або XC3 -> XC2/XC3
XC4 -> XC4
XD1 або XS1 -> XD1/XS1
XD2 або XS2 -> XD2/XS2
XD3 або XS3 -> XD3/XS3
```

Formula for ordinary reinforcement:

```text
cmin,dur = табл. 4.3[<S>; <клас впливу>] = ... мм
```

Formula for prestressed reinforcement:

```text
cmin,dur = табл. 4.4[<S>; <клас впливу>] = ... мм
```

Note:

```text
Для класу конструкції <S> і класу впливу середовища <exposureClass> використовується графа "<графа таблиці>".
```

### 5. Мінімальний захисний шар cmin

Caption:

```text
Визначення мінімального захисного шару cmin як більшого значення з вимог зчеплення та довговічності (п. 4.4.2.2, формула (4.2) ДБН В.2.6-98:2009):
```

Formulas:

```text
cdur = cmin,dur + Δcdur,γ - Δcdur,st - Δcdur,add = ... + ... - ... - ... = ... мм
cmin = max(cmin,b; cdur; 10 мм) = max(...; ...; 10) = ... мм
```

Note:

```text
За формулою (4.2) мінімальний захисний шар не може бути меншим ніж 10 мм.
```

### 6. Номінальний захисний шар cnom

Caption:

```text
Визначення номінального захисного шару cnom з урахуванням допустимого проектного відхилу (п. 4.4.3 ДБН В.2.6-98:2009):
```

Formula:

```text
cnom = cmin + Δcdev = ... + ... = ... мм
```

Note when `Δcdev = 10 мм`:

```text
Для Δcdev прийнято рекомендоване значення 10 мм згідно з приміткою до п. 4.4.3 ДБН В.2.6-98:2009.
```

### 7. Висновок

Caption:

```text
Висновок щодо мінімального та номінального захисного шару бетону (п. 4.4.2-4.4.3 ДБН В.2.6-98:2009):
```

Formulas:

```text
cmin = ... мм
cnom = ... мм
```

UI result:

```text
Мінімальний захисний шар: cmin = ... мм
Номінальний захисний шар для креслень: cnom = ... мм
```

## Warning Text

When `cnom > 45 мм`:

```text
Номінальний захисний шар cnom = ... мм > 45 мм. Згідно з п. 4.4.2.4.4 ДБН В.2.6-98:2009 необхідно передбачити конструктивне армування захисного шару.
```

## Validation Messages

Errors:

```text
Укажіть додатне значення φ.
Укажіть додатне значення φp.
Укажіть додатне значення dduct.
Укажіть додатне значення aduct.
Укажіть додатне значення bduct.
Укажіть додатне значення dp.
Dmax має бути не менше 0 мм.
Δcdur,γ має бути не менше 0 мм.
Δcdur,st має бути не менше 0 мм.
Δcdur,add має бути не менше 0 мм.
Δcdev має бути не менше 0 мм.
Оберіть клас впливу середовища.
Оберіть клас конструкції S.
```

Rules:

- Invalid data returns a stable report with source inputs and errors.
- Invalid data must not render formulas with `NaN` or `Infinity`.

## Normative References UI

The calculator page must include a section titled:

```text
Нормативні посилання
```

Items:

```text
п. 4.4.2.2, формула (4.2) ДБН В.2.6-98:2009
Вибір більшого значення з вимог зчеплення та довговічності з нижньою межею 10 мм.

п. 4.4.2.3, таблиця 4.2 ДБН В.2.6-98:2009
Вимоги до мінімального захисного шару cmin,b для забезпечення зчеплення.

п. 4.4.2.4.1, таблиця 4.3 ДБН В.2.6-98:2009
Мінімальна величина захисного шару cmin,dur для арматурної сталі.

п. 4.4.2.4.2, таблиця 4.4 ДБН В.2.6-98:2009
Мінімальна величина захисного шару cmin,dur для попередньо напруженої арматурної сталі.

п. 4.4.2.4.3, таблиця 4.5 ДБН В.2.6-98:2009
Клас конструкцій залежно від класу впливу середовища та факторів впливу.

п. 4.4.2.4.4 ДБН В.2.6-98:2009
Вимога конструктивного армування захисного шару при товщині понад 45 мм.

п. 4.4.3 ДБН В.2.6-98:2009
Допустимі проектні відхили та визначення номінального захисного шару.
```
