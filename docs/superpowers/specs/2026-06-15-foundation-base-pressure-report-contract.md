# Foundation Base Pressure Report Contract

Date: 2026-06-15
Calculator: `foundation-base-pressure`
Status: Agreed source of truth for report text and formulas

This document contains the agreed Ukrainian report captions, display conditions, formula strings, warnings, and expected check examples for the foundation base pressure calculator. Implementation plans, tests, and code must treat this file as the canonical source for the step-by-step report.

Temporary method source used in every calculation step:

```text
Методика визначення крайових напружень під прямокутною підошвою фундаменту
```

## Notation

Use Latin variable names in report formulas:

```text
N
Mx
My
Qx
Qy
l
b
h_gr
h_fund
γ
G_fund
N_total
A
Wy
Wx
Mx_base
My_base
ex
ey
σ1
σ2
σ3
σ4
p(x, y)
p0
ax
ay
x_R
y_R
c1
c2
P_lift
```

## Report Steps

### 1. Вихідні дані

Caption:

```text
Вихідні дані:
```

Items:

```text
Mx = <значення> т·м
My = <значення> т·м
Qx = <значення> т
Qy = <значення> т
N = <значення> т
l = <значення> м
b = <значення> м
γ = <значення> т/м³
h_gr = <значення> м
h_fund = <значення> м
```

Default example 1 items:

```text
Mx = 2.00 т·м
My = 9.70 т·м
Qx = 9.000 т
Qy = 0.500 т
N = 26.00 т
l = 2.40 м
b = 1.80 м
γ = 2.00 т/м³
h_gr = 2.00 м
h_fund = 1.60 м
```

Default UI field names:

```text
Вертикальна сила: N, т
Момент відносно осі x: Mx, т·м
Поперечна сила вздовж осі y: Qy, т
Момент відносно осі y: My, т·м
Поперечна сила вздовж осі x: Qx, т
Довжина підошви фундаменту: l, м
Ширина підошви фундаменту: b, м
Відстань від поверхні ґрунту до підошви: h_gr, м
Відстань від рівня прикладання навантаження до підошви: h_fund, м
Осереднена об'ємна вага ґрунту і фундаменту: γ, т/м³
```

### 2. Вертикальне навантаження з урахуванням власної ваги

Caption:

```text
Розрахунок вертикального навантаження з урахуванням власної ваги фундаменту і ґрунту на обрізах (Методика визначення крайових напружень під прямокутною підошвою фундаменту):
```

Formulas:

```text
G_fund = γ * b * l * h_gr = <γ> * <b> * <l> * <h_gr> = <G_fund> т
N_total = N + G_fund = <N> + <G_fund> = <N_total> т >= 0
```

Default example 1 formulas:

```text
G_fund = γ * b * l * h_gr = 2.00 * 1.80 * 2.40 * 2.00 = 17.28 т
N_total = N + G_fund = 26.00 + 17.28 = 43.28 т >= 0
```

### 3. Геометричні характеристики підошви

Caption:

```text
Геометричні характеристики підошви (Методика визначення крайових напружень під прямокутною підошвою фундаменту):
```

Formulas:

```text
A = b * l = <b> * <l> = <A> м²
Wy = b * l^2 / 6 = <b> * <l>^2 / 6 = <Wy> м³
Wx = l * b^2 / 6 = <l> * <b>^2 / 6 = <Wx> м³
```

Default example 1 formulas:

```text
A = b * l = 1.80 * 2.40 = 4.320 м²
Wy = b * l^2 / 6 = 1.80 * 2.40^2 / 6 = 1.728 м³
Wx = l * b^2 / 6 = 2.40 * 1.80^2 / 6 = 1.296 м³
```

### 4. Зовнішні зусилля на рівні підошви

Caption:

```text
Зовнішні зусилля на рівні підошви (Методика визначення крайових напружень під прямокутною підошвою фундаменту):
```

Formulas:

```text
Mx_base = |Mx + Qy * h_fund| = |<Mx> + <Qy> * <h_fund>| = <Mx_base> т·м
My_base = |My + Qx * h_fund| = |<My> + <Qx> * <h_fund>| = <My_base> т·м
ex = My_base / N_total = <My_base> / <N_total> = <ex> м < l / 2 = <l> / 2 = <l/2> м
ey = Mx_base / N_total = <Mx_base> / <N_total> = <ey> м < b / 2 = <b> / 2 = <b/2> м
```

Default example 1 formulas:

```text
Mx_base = |Mx + Qy * h_fund| = |2.00 + 0.500 * 1.60| = 2.80 т·м
My_base = |My + Qx * h_fund| = |9.70 + 9.000 * 1.60| = 24.10 т·м
ex = My_base / N_total = 24.10 / 43.28 = 0.5568 м < l / 2 = 2.40 / 2 = 1.200 м
ey = Mx_base / N_total = 2.80 / 43.28 = 0.0647 м < b / 2 = 1.80 / 2 = 0.900 м
```

### 5. Напруження по кутах без урахування відриву

Caption:

```text
Напруження по кутах підошви, обчислені без урахування відриву (Методика визначення крайових напружень під прямокутною підошвою фундаменту):
```

Formulas:

```text
σ1 = N_total / A + My_base / Wy + Mx_base / Wx = <N_total> / <A> + <My_base> / <Wy> + <Mx_base> / <Wx> = <σ1> т/м²
σ2 = N_total / A + My_base / Wy - Mx_base / Wx = <N_total> / <A> + <My_base> / <Wy> - <Mx_base> / <Wx> = <σ2> т/м²
σ3 = N_total / A - My_base / Wy + Mx_base / Wx = <N_total> / <A> - <My_base> / <Wy> + <Mx_base> / <Wx> = <σ3> т/м²
σ4 = N_total / A - My_base / Wy - Mx_base / Wx = <N_total> / <A> - <My_base> / <Wy> - <Mx_base> / <Wx> = <σ4> т/м²
```

Default example 1 formulas:

```text
σ1 = N_total / A + My_base / Wy + Mx_base / Wx = 43.28 / 4.320 + 24.10 / 1.728 + 2.80 / 1.296 = 26.13 т/м²
σ2 = N_total / A + My_base / Wy - Mx_base / Wx = 43.28 / 4.320 + 24.10 / 1.728 - 2.80 / 1.296 = 21.80 т/м²
σ3 = N_total / A - My_base / Wy + Mx_base / Wx = 43.28 / 4.320 - 24.10 / 1.728 + 2.80 / 1.296 = -1.77 т/м²
σ4 = N_total / A - My_base / Wy - Mx_base / Wx = 43.28 / 4.320 - 24.10 / 1.728 - 2.80 / 1.296 = -6.09 т/м²
```

Display rule:

- If all `σ1...σ4 >= 0`, show that uplift is absent and these values are final.
- If at least one value is `< 0`, show the uplift warning and run the contact pressure calculation without tension.

### 6. Контактна епюра з урахуванням відриву

Display condition:

Show only when at least one corner stress from step 5 is `< 0`.

Caption:

```text
Контактна епюра з урахуванням відриву (Методика визначення крайових напружень під прямокутною підошвою фундаменту):
```

Warning text:

```text
Найменше з обчислених напружень менше нуля, тому маємо відрив підошви.
```

Model text:

```text
Контактна епюра з урахуванням відриву шукається як лінійна площина тиску без розтягу:
p(x, y) = max(0; p0 + ax * x + ay * y)
```

Equilibrium text:

```text
Параметри p0, ax, ay підбираються чисельно так, щоб виконувались умови рівноваги:
∫A p(x, y) dA = N_total
∫A x * p(x, y) dA = N_total * x_R
∫A y * p(x, y) dA = N_total * y_R
```

Rule:

- The report must identify the uplift scheme after solving the no-tension contact problem.
- The calculation model is universal for a rectangular base with a no-tension contact plane.
- The first version must explicitly classify and report the two agreed check schemes below: uplift in one corner and uplift in two corners.
- If the solved contact polygon has another shape, the implementation plan must define a generic polygon report block and obtain user approval before coding that report text.
- The implementation may use a numerical solver, but the report must show the detected scheme, the found dimensions, the final stresses, and the explicit uplift-area formula.

### 7. Відрив в одному куті

Display condition:

Show when the no-tension contact solution detects a triangular uplift zone in one corner.

Caption:

```text
Відрив підошви в одному куті (Методика визначення крайових напружень під прямокутною підошвою фундаменту):
```

Scheme note:

```text
Перебором/чисельним розв'язанням знайдено, що відрив підошви присутній в одному куті.
```

Dimension note:

```text
Для схеми відриву в одному куті c1 — сторона трикутної зони відриву вздовж b; c2 — сторона трикутної зони відриву вздовж l.
```

Dimension formulas:

```text
c1 = <c1> м
c2 = <c2> м
```

Uplift share formula:

```text
P_lift = c1 * c2 / (2 * b * l) * 100 = <c1> * <c2> / (2 * <b> * <l>) * 100 = <P_lift>%
```

Final stress formulas:

```text
σ1 = <σ1> т/м²
σ2 = <σ2> т/м²
σ3 = <σ3> т/м²
```

Check example 2 formulas:

```text
c1 = 1.7340 м
c2 = 1.3427 м
P_lift = c1 * c2 / (2 * b * l) * 100 = 1.7340 * 1.3427 / (2 * 1.80 * 2.40) * 100 = 26.9%
σ1 = 36.39 т/м²
σ2 = 15.70 т/м²
σ3 = 0.76 т/м²
```

### 8. Відрив у двох кутах

Display condition:

Show when the no-tension contact solution detects an uplift zone along one side with two edge dimensions.

Caption:

```text
Відрив підошви у двох кутах (Методика визначення крайових напружень під прямокутною підошвою фундаменту):
```

Scheme note:

```text
Перебором/чисельним розв'язанням знайдено, що відрив підошви присутній у двох кутах.
```

Dimension formulas:

```text
c1 = <c1> м
c2 = <c2> м
```

Uplift share formula:

```text
P_lift = (c1 + c2) / 2 * b * 1 / (b * l) * 100 = (<c1> + <c2>) / 2 * <b> * 1 / (<b> * <l>) * 100 = <P_lift>%
```

Final stress formulas:

```text
σ1 = <σ1> т/м²
σ2 = <σ2> т/м²
```

Check example 1 formulas:

```text
c1 = 0.2781 м
c2 = 0.6927 м
P_lift = (c1 + c2) / 2 * b * 1 / (b * l) * 100 = (0.2781 + 0.6927) / 2 * 1.80 * 1 / (1.80 * 2.40) * 100 = 20.2%
σ1 = 27.73 т/м²
σ2 = 22.31 т/м²
```

### 9. Перевірка рівноваги

Display condition:

Show when uplift is present.

Caption:

```text
Перевірка рівноваги контактної епюри з урахуванням відриву (Методика визначення крайових напружень під прямокутною підошвою фундаменту):
```

Items:

```text
ΣP = <значення> т ≈ N_total = <N_total> т
ΣMx = <значення> т·м ≈ Mx_base = <Mx_base> т·м
ΣMy = <значення> т·м ≈ My_base = <My_base> т·м
```

Rule:

The equilibrium check is diagnostic and should use a tolerance appropriate for the numerical method. The exact tolerance must be stated in the implementation plan before coding.

### 10. Схема епюри

Display condition:

Show after the stress result.

Caption:

```text
Епюра тиску під підошвою:
```

Rules:

- The diagram must show the rectangular base `l` by `b`.
- If uplift is present, show the uplift zone and label `c1`, `c2` where applicable.
- Label the final nonzero stresses shown by the detected scheme.

## Check Examples

### Example 1: uplift in two corners

Inputs:

```text
N = 26.00 т
Mx = 2.00 т·м
Qy = 0.500 т
My = 9.70 т·м
Qx = 9.000 т
l = 2.40 м
b = 1.80 м
h_gr = 2.00 м
h_fund = 1.60 м
γ = 2.00 т/м³
```

Expected result:

```text
σ1 = 27.73 т/м²
σ2 = 22.31 т/м²
c1 = 0.2781 м
c2 = 0.6927 м
P_lift = 20.2%
```

### Example 2: uplift in one corner

Inputs:

```text
N = 26.00 т
Mx = 9.00 т·м
Qy = 0.500 т
My = 9.70 т·м
Qx = 9.000 т
l = 2.40 м
b = 1.80 м
h_gr = 2.00 м
h_fund = 1.60 м
γ = 2.00 т/м³
```

Expected result:

```text
σ1 = 36.39 т/м²
σ2 = 15.70 т/м²
σ3 = 0.76 т/м²
c1 = 1.7340 м
c2 = 1.3427 м
P_lift = 26.9%
```

## Validation Messages

Errors:

```text
N_total має бути не менше 0.
l має бути більше 0.
b має бути більше 0.
h_gr має бути не менше 0.
h_fund має бути не менше 0.
γ має бути не менше 0.
```

Rules:

- Numeric inputs must be finite numbers.
- Invalid inputs must return a stable report with the input step, errors, and no `NaN` or `Infinity` formulas.
