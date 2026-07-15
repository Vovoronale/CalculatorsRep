# Foundation Base Pressure Report Contract

Date: 2026-06-15
Calculator: `foundation-base-pressure`
Status: Agreed source of truth for report text and formulas

2026-07-15 amendment status: Agreed source of truth

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
N_total = N + G_fund = <N> + <G_fund> = <N_total> т > 0
```

Default example 1 formulas:

```text
G_fund = γ * b * l * h_gr = 2.00 * 1.80 * 2.40 * 2.00 = 17.28 т
N_total = N + G_fund = 26.00 + 17.28 = 43.28 т > 0
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

### 5. Середній тиск під підошвою

Caption:

```text
Середній тиск під підошвою (Методика визначення крайових напружень під прямокутною підошвою фундаменту):
```

Formula:

```text
p_avg = N_total / A = <N_total> / <A> = <p_avg> т/м²
```

Default example 1 formula:

```text
p_avg = N_total / A = 43.28 / 4.320 = 10.02 т/м²
```

### 6. Напруження по кутах без урахування відриву

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

### 7. Контактна епюра з урахуванням відриву

Display condition:

Show only when at least one corner stress from step 6 is `< 0`.

Caption:

```text
Вибір схеми відриву підошви (Методика визначення крайових напружень під прямокутною підошвою фундаменту):
```

Warning text:

```text
Найменше з обчислених напружень менше нуля, тому маємо відрив підошви.
```

Action text:

```text
Визначаємо від'ємні кутові напруження: <negative-stress-list>.
За розташуванням від'ємних кутів вибираємо схему відриву: <scheme-name>.
```

Rule:

- Do not show `p0`, `ax`, `ay` in the visible report.
- The implementation may use a numerical solver internally to locate the zero-pressure line, but the visible report must be action-oriented: negative corners -> scheme -> zero-pressure-line dimensions -> uplift area -> uplift share -> final contact stresses.
- The first version must explicitly classify and report the two agreed check schemes below: uplift in one corner and uplift in two corners.
- If the solved contact polygon has another shape, the implementation plan must define a generic polygon report block and obtain user approval before coding that report text.
- The report must show the uplift area in `м²` before showing the uplift share in `%`.

### 8. Відрив в одному куті

Display condition:

Show when the no-tension contact solution detects a triangular uplift zone in one corner.

Caption:

```text
Відрив підошви в одному куті (Методика визначення крайових напружень під прямокутною підошвою фундаменту):
```

Scheme note:

```text
Від'ємне напруження отримане в одному куті, тому зона відриву має форму трикутника.
```

Dimension note:

```text
Лінія σ = 0 перетинає дві суміжні грані підошви: c1 — сторона трикутної зони відриву вздовж b, c2 — сторона трикутної зони відриву вздовж l.
```

Dimension formulas:

```text
c1 = <c1> м
c2 = <c2> м
```

Uplift area and share formulas:

```text
A_lift = c1 * c2 / 2 = <c1> * <c2> / 2 = <A_lift> м²
P_lift = A_lift / A * 100 = <A_lift> / <A> * 100 = <P_lift>%
```

Final stress formulas:

```text
η1 = l / c2 + b / c1 - 1 = <l> / <c2> + <b> / <c1> - 1 = <η1>
η2 = l / c2 - 1 = <l> / <c2> - 1 = <η2>
η3 = b / c1 - 1 = <b> / <c1> - 1 = <η3>
V_eta = b * l * (l / (2 * c2) + b / (2 * c1) - 1) + c1 * c2 / 6 = <V_eta> м²
k = N_total / V_eta = <N_total> / <V_eta> = <k> т/м²
σ1 = k * η1 = <k> * <η1> = <σ1> т/м²
σ2 = k * η2 = <k> * <η2> = <σ2> т/м²
σ3 = k * η3 = <k> * <η3> = <σ3> т/м²
```

Check example 2 formulas:

```text
c1 = 1.7340 м
c2 = 1.3427 м
A_lift = c1 * c2 / 2 = 1.7340 * 1.3427 / 2 = 1.1641 м²
P_lift = A_lift / A * 100 = 1.1641 / 4.320 * 100 = 26.9%
η1 = l / c2 + b / c1 - 1 = 2.40 / 1.3427 + 1.80 / 1.7340 - 1 = 1.8255
η2 = l / c2 - 1 = 2.40 / 1.3427 - 1 = 0.7874
η3 = b / c1 - 1 = 1.80 / 1.7340 - 1 = 0.0381
V_eta = b * l * (l / (2 * c2) + b / (2 * c1) - 1) + c1 * c2 / 6 = 1.80 * 2.40 * (2.40 / (2 * 1.3427) + 1.80 / (2 * 1.7340) - 1) + 1.7340 * 1.3427 / 6 = 2.1711 м²
k = N_total / V_eta = 43.28 / 2.1711 = 19.9343 т/м²
σ1 = k * η1 = 19.9343 * 1.8255 = 36.39 т/м²
σ2 = k * η2 = 19.9343 * 0.7874 = 15.70 т/м²
σ3 = k * η3 = 19.9343 * 0.0381 = 0.76 т/м²
```

### 9. Відрив у двох кутах

Display condition:

Show when the no-tension contact solution detects an uplift zone along one side with two edge dimensions.

Caption:

```text
Відрив підошви у двох кутах (Методика визначення крайових напружень під прямокутною підошвою фундаменту):
```

Scheme note:

```text
Від'ємні напруження отримані у двох суміжних кутах однієї грані, тому зона відриву має форму трапеції.
```

Dimension note:

```text
Лінія σ = 0 перетинає дві протилежні грані підошви: c1 — відстань від точки 3 до перетину на верхній грані, c2 — відстань від точки 4 до перетину на нижній грані.
```

Dimension formulas:

```text
c1 = <c1> м
c2 = <c2> м
```

Uplift area and share formulas:

```text
A_lift = (c1 + c2) / 2 * b = (<c1> + <c2>) / 2 * <b> = <A_lift> м²
P_lift = A_lift / A * 100 = <A_lift> / <A> * 100 = <P_lift>%
```

Final stress formulas:

```text
d1 = l - c1 = <l> - <c1> = <d1> м
d2 = l - c2 = <l> - <c2> = <d2> м
k = 6 * N_total / (b * (d1^2 + d1 * d2 + d2^2)) = 6 * <N_total> / (<b> * (<d1>^2 + <d1> * <d2> + <d2>^2)) = <k> т/м³
σ1 = k * d1 = <k> * <d1> = <σ1> т/м²
σ2 = k * d2 = <k> * <d2> = <σ2> т/м²
```

Check example 1 formulas:

```text
c1 = 0.2781 м
c2 = 0.6927 м
A_lift = (c1 + c2) / 2 * b = (0.2781 + 0.6927) / 2 * 1.80 = 0.8737 м²
P_lift = A_lift / A * 100 = 0.8737 / 4.320 * 100 = 20.2%
d1 = l - c1 = 2.40 - 0.2781 = 2.1219 м
d2 = l - c2 = 2.40 - 0.6927 = 1.7073 м
k = 6 * N_total / (b * (d1^2 + d1 * d2 + d2^2)) = 6 * 43.28 / (1.80 * (2.1219^2 + 2.1219 * 1.7073 + 1.7073^2)) = 13.0676 т/м³
σ1 = k * d1 = 13.0676 * 2.1219 = 27.73 т/м²
σ2 = k * d2 = 13.0676 * 1.7073 = 22.31 т/м²
```

### 10. Перевірка рівноваги

Display condition:

Show when uplift is present.

Caption:

```text
Перевірка рівноваги контактної епюри з урахуванням відриву (Методика визначення крайових напружень під прямокутною підошвою фундаменту):
```

Formulas:

```text
ΣP = <integrated_force> т ≈ N_total = <N_total> т
ΣMx = <integrated_moment_x_about_center> т·м ≈ Mx_base = <Mx_base> т·м
ΣMy = <integrated_moment_y_about_center> т·м ≈ My_base = <My_base> т·м
```

Rule:

The equilibrium check is a diagnostic engineering control of the selected uplift scheme. Values on the left side are calculated from the integrated contact-pressure plane, not reconstructed from the target resultant. Do not show integral expressions or `p0`, `ax`, `ay` in this step.

### 11. Схема епюри

Display condition:

Show after the stress result.

Caption:

```text
Епюра тиску під підошвою:
```

Rules:

- The diagram must show the rectangular base `l` by `b`.
- The diagram must show corner point numbers:
  - `1` at `(l, b)`;
  - `2` at `(l, 0)`;
  - `3` at `(0, b)`;
  - `4` at `(0, 0)`.
- If uplift is present, show the uplift zone and label `c1`, `c2` where applicable.
- Label the final nonzero stresses at the corresponding contact corners: `σ1` at point `1`, `σ2` at point `2`, `σ3` at point `3`, `σ4` at point `4`.

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
N_total має бути більше 0.
l має бути більше 0.
b має бути більше 0.
h_gr має бути не менше 0.
h_fund має бути не менше 0.
γ має бути не менше 0.
ex має бути менше l / 2; рівнодійна виходить за межі підошви в напрямку l.
ey має бути менше b / 2; рівнодійна виходить за межі підошви в напрямку b.
Не вдалося отримати збіжний розв'язок контактної епюри; перевірте вихідні дані.
```

Rules:

- Numeric inputs must be finite numbers.
- Every validation failure returns a stable report with the input step and
  errors, but no calculated values, uplift classification, equilibrium step,
  summary, or DOCX action. No report formula may contain `NaN` or `Infinity`.
- Check `ex < l / 2` and `ey < b / 2` before solving the no-tension contact plane. Equality is invalid because the non-negative contact area degenerates at the footing boundary.
- For a no-tension solution, accept convergence only when the force residual and both moment residuals are each within `1e-6 * max(1, abs(target))`.
- A solver-convergence error follows the same invalid-report rule.
