# Soil Design Resistance Report Contract

Date: 2026-06-09
Calculator: `soil-design-resistance`
Status: Agreed source of truth for report text and formulas

This document contains the agreed report captions, display conditions, and formula strings for the soil design resistance calculator. Implementation plans and code must treat this file as the canonical source for the step-by-step report.

## Report Steps

### 1. Вихідні дані

Caption:

```text
Вихідні дані, задані користувачем:
```

Items:

```text
Спосіб розрахунку: ...
Конструктивна схема споруди: ...
Довжина споруди: L = ... м
Висота споруди: H = ... м
Тип ґрунту: ...
Показник текучості: IL = ...
Кут внутрішнього тертя: φ11 = ...°
Питома вага ґрунту нижче підошви: γ11 = ... кН/м³
Осереднена питома вага вище підошви: γ′11 = ... кН/м³
Питоме зчеплення: c11 = ... кПа
Спосіб визначення φ11 і c11: ...
Ширина підошви: b = ... м
Глибина закладання: d = ... м
Підвал: ...
Приведена глибина закладання: d1 = ... м
Коефіцієнт умов роботи 1: γc1 = ...
Коефіцієнт умов роботи 2: γc2 = ...
```

Rules:

- Show `IL = ...` only when `IL` applies to the selected soil type.
- Show `γc1 = ...` and `γc2 = ...` only in manual table Е.7 mode.
- In automatic mode, `γc1` and `γc2` are calculated in later report steps and are not listed as user inputs.
- Every scalar input item must include the user-facing quantity name and the mathematical notation in the form `<назва>: <позначення> = <значення> <одиниця>`.
- Text-choice items without a mathematical symbol (`Спосіб розрахунку`, `Конструктивна схема споруди`, `Тип ґрунту`, `Спосіб визначення φ11 і c11`, `Підвал`) remain descriptive text rows.
- For basement cases, replace the simple `Приведена глибина закладання: d1 = ... м` item with the basement inputs used for `d1` and `db`:

```text
Глибина підвалу: db,input = ... м
Шар ґрунту над підошвою: hs = ... м
Товщина підлоги підвалу: hcf = ... м
Питома вага підлоги підвалу: γcf = ... кН/м³
```

### 2. Відношення L/H

Display condition:

Show only when `calculationMode = автоматично за характеристиками ґрунту` and `structuralScheme = жорстка`.

Caption:

```text
Визначення відношення довжини споруди або її відсіку до висоти для табл. Е.7 ДБН В.2.1-10-2009:
```

Formula:

```text
L/H = L / H = ... / ... = ...
```

### 3. Конструктивна схема споруди

Display condition:

Show only in automatic mode.

Caption:

```text
Конструктивна схема споруди згідно з примітками 1-3 до табл. Е.7 ДБН В.2.1-10-2009:
```

Flexible structural scheme note:

```text
Конструктивна схема: гнучка. γc2 приймається згідно з приміткою 2 до табл. Е.7.
```

Flexible structural scheme formula:

```text
γc2 = 1.0
```

Rigid structural scheme, `L/H <= 1.5`, note:

```text
Конструктивна схема: жорстка. Для ґрунту "<тип ґрунту>"<, IL = ...>, L/H = ... <= 1.5, тому γc2 приймається за графою "1,5 і менше" табл. Е.7.
```

Rigid structural scheme, `L/H <= 1.5`, formula:

```text
γc2 = ...
```

Rigid structural scheme, `L/H >= 4`, note:

```text
Конструктивна схема: жорстка. Для ґрунту "<тип ґрунту>"<, IL = ...>, L/H = ... >= 4, тому γc2 приймається за графою "4 і більше" табл. Е.7.
```

Rigid structural scheme, `L/H >= 4`, formula:

```text
γc2 = ...
```

Rigid structural scheme, `1.5 < L/H < 4`, note:

```text
Конструктивна схема: жорстка. Для ґрунту "<тип ґрунту>"<, IL = ...>, L/H = ... коефіцієнт γc2 визначається інтерполяцією згідно з приміткою 3 до табл. Е.7.
```

Rigid structural scheme, `1.5 < L/H < 4`, formula:

```text
γc2 = γc2,1.5 + (γc2,4 - γc2,1.5) * (L/H - 1.5) / (4 - 1.5) = ... + (... - ...) * (... - 1.5) / 2.5 = ...
```

Rules:

- Omit `IL = ...` for soil types where `IL` does not apply.
- The interpolation line must include the two table values selected for `γc2,1.5` and `γc2,4`.

### 4. Коефіцієнти γc1 і γc2

Manual mode caption:

```text
Прийняття коефіцієнтів умов роботи γc1 і γc2 користувачем за табл. Е.7 ДБН В.2.1-10-2009:
```

Manual mode formula:

```text
γc1 = ...; γc2 = ...
```

Automatic mode caption:

```text
Визначення коефіцієнтів умов роботи γc1 і γc2 за фактичним типом ґрунту згідно з табл. Е.7 ДБН В.2.1-10-2009:
```

Automatic mode note:

```text
Для ґрунту "<тип ґрунту>"<, IL = ...> використовується рядок табл. Е.7: "<рядок табл. Е.7>". Коефіцієнт γc2 приймається за результатом блоку "Конструктивна схема споруди".
```

Automatic mode formula:

```text
γc1 = ...; γc2 = ...
```

Rules:

- Omit `IL = ...` for soil types where `IL` does not apply.
- Manual mode is a user decision inside the `Умови роботи` block, not a global override for the whole calculator.

### 5. Коефіцієнт k

Caption:

```text
Визначення коефіцієнта k за способом визначення φ11 і c11 згідно з п. Е.4 ДБН В.2.1-10-2009:
```

Direct testing note:

```text
φ11 і c11 визначені безпосередніми випробуваннями, тому згідно з п. Е.4 ДБН В.2.1-10-2009 приймається k = 1.0.
```

Direct testing formula:

```text
k = 1.0
```

Appendix В tables note:

```text
φ11 і c11 прийняті за таблицями В.1-В.2, тому згідно з п. Е.4 ДБН В.2.1-10-2009 приймається k = 1.1.
```

Appendix В tables formula:

```text
k = 1.1
```

### 6. Коефіцієнти Mγ, Mq, Mc

Caption:

```text
Визначення коефіцієнтів Mγ, Mq, Mc за кутом внутрішнього тертя φ11 згідно з табл. Е.8 ДБН В.2.1-10-2009:
```

Exact table value note:

```text
Для φ11 = ...° коефіцієнти Mγ, Mq, Mc приймаються за табл. Е.8 ДБН В.2.1-10-2009.
```

Exact table value formula:

```text
Mγ = ...; Mq = ...; Mc = ...
```

Interpolated value note:

```text
φ11 = ...° знаходиться між φa = ...° і φb = ...°. Коефіцієнти Mγ, Mq, Mc визначаються лінійною інтерполяцією за табл. Е.8 ДБН В.2.1-10-2009.
```

Interpolated value formulas:

```text
Mγ = Mγ,a + (Mγ,b - Mγ,a) * (φ11 - φa) / (φb - φa) = ... + (... - ...) * (... - ...) / (... - ...) = ...
Mq = Mq,a + (Mq,b - Mq,a) * (φ11 - φa) / (φb - φa) = ... + (... - ...) * (... - ...) / (... - ...) = ...
Mc = Mc,a + (Mc,b - Mc,a) * (φ11 - φa) / (φb - φa) = ... + (... - ...) * (... - ...) / (... - ...) = ...
```

### 7. Коефіцієнт kz

Caption:

```text
Визначення коефіцієнта kz за шириною підошви фундаменту b згідно з п. Е.4 ДБН В.2.1-10-2009:
```

For `b < 10 м`, note:

```text
Оскільки b = ... м < 10 м, згідно з п. Е.4 ДБН В.2.1-10-2009 приймається kz = 1.0.
```

For `b < 10 м`, formula:

```text
kz = 1.0
```

For `b >= 10 м`, note:

```text
Оскільки b = ... м >= 10 м, коефіцієнт kz визначається за залежністю з п. Е.4 ДБН В.2.1-10-2009.
```

For `b >= 10 м`, formula:

```text
kz = z0 / b + 0.2 = 8 / ... + 0.2 = ...
```

### 8. Глибина d1

No basement caption:

```text
Глибина закладання d1 для безпідвальної споруди згідно з п. Е.4 ДБН В.2.1-10-2009:
```

No basement formula:

```text
d1 = ... м
```

Basement caption:

```text
Визначення приведеної глибини закладання d1 для споруди з підвалом згідно з формулою (Е.2) ДБН В.2.1-10-2009:
```

Basement formula:

```text
d1 = hs + hcf * γcf / γ′11 = ... + ... * ... / ... = ... м
```

### 9. Перевірка d1 <= d

Caption:

```text
Перевірка умови d1 <= d згідно з приміткою 6 до п. Е.4 ДБН В.2.1-10-2009:
```

Passing note:

```text
Умова d1 <= d виконується. Для подальшого розрахунку за формулою (Е.1) приймаються d1 = ... м і db = ... м.
```

Passing formula:

```text
d1 <= d => ... <= ...
```

Note when note 6 applies:

```text
Умова d1 <= d не виконується. Згідно з приміткою 6 до п. Е.4 ДБН В.2.1-10-2009 для подальшого розрахунку за формулою (Е.1) приймаються d1 = d = ... м і db = 0 м.
```

Formula when note 6 applies:

```text
d1 > d => ... > ...
```

Rule:

After this step, all later formulas use the calculated values `d1,calc` and `db,calc`.

### 10. Глибина підвалу db

Display condition:

Show only for basement cases. Do not duplicate this step when step 9 has already set `db = 0` because `d1 > d`.

Caption:

```text
Визначення розрахункової глибини підвалу db згідно з п. Е.4 ДБН В.2.1-10-2009:
```

For `db,input <= 2.0 м`:

```text
db = ... м
```

For `db,input > 2.0 м`:

```text
db = min(db,input; 2.0) = min(...; 2.0) = 2.0 м
```

### 11. Розрахунковий опір R

Caption:

```text
Визначення розрахункового опору ґрунту основи R згідно з п. Е.4, формула (Е.1) ДБН В.2.1-10-2009:
```

Formula:

```text
R = γc1 * γc2 / k * [Mγ * kz * b * γ11 + Mq * d1 * γ′11 + (Mq - 1) * db * γ′11 + Mc * c11] = ... * ... / ... * [... * ... * ... * ... + ... * ... * ... + (... - 1) * ... * ... + ... * ...] = ... кПа
```

Rule:

Do not introduce intermediate report variables such as `Rγ`, `Rq`, `Rb`, or `Rc`.

Default MQN substitution:

```text
R = 1 * 1 / 1 * [1.15 * 1 * 1 * 17.1 + 5.59 * 1.2 * 16.6 + (5.59 - 1) * 0 * 16.6 + 7.95 * 4] = 162.82 кПа
```

### 12. Переведення одиниць

Caption:

```text
Переведення розрахункового опору R у додаткові одиниці:
```

Formula:

```text
R = ... кПа = ... т/м² = ... кг/см²
```

Rules:

```text
Rт/м² = RкПа / 10
Rкг/см² = RкПа / 100
```

Default MQN conversion:

```text
R = 162.82 кПа = 16.3 т/м² = 1.6 кг/см²
```
