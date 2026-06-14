# Design Spec: Foundation Base Pressure Calculator

Date: 2026-06-15
Project: `construction-calculators-hub`
Status: Awaiting user review

## Context

The project needs a native calculator for stresses under a rectangular foundation base:

`Напруження під підошвою фундаменту`

The calculator receives vertical force, moments, horizontal forces, base geometry, embedment heights, and averaged unit weight. It computes corner stresses without uplift and, when tension appears under part of the base, solves the no-tension contact pressure distribution.

Canonical agreed report text and formulas are captured separately in [`2026-06-15-foundation-base-pressure-report-contract.md`](2026-06-15-foundation-base-pressure-report-contract.md). Implementation plans, tests, and code must treat that file as the source of truth for report captions, display conditions, warning text, and formula strings.

The method source is intentionally temporary:

```text
Методика визначення крайових напружень під прямокутною підошвою фундаменту; назву джерела буде уточнено користувачем.
```

The user will later replace it with the exact book/source name.

## Goals

- Add a native calculator for pressure under a rectangular foundation base.
- Use the default input values from the provided examples.
- Produce a Ukrainian step-by-step calculation report.
- Use Latin notation for all variables, including `h_gr` and `h_fund`.
- Show corner stresses without uplift.
- Detect uplift whenever any no-uplift corner stress is negative.
- Support a universal no-tension contact model for rectangular bases:

```text
p(x, y) = max(0; p0 + ax * x + ay * y)
```

- Classify and report the two agreed check schemes:
  - uplift in one corner;
  - uplift in two corners.
- Show the uplift share `P_lift` with the explicit formula for the detected scheme.
- Keep the underlying contact model universal for a rectangular base. If implementation planning needs a generic report block for another contact polygon shape, that block must be approved before coding.
- Include a diagram of the pressure epure under the base.
- Keep engineering logic in `lib/<calculator>.ts`, outside React UI.

## Non-Goals

- No bearing-capacity resistance check against allowable soil pressure in the first version.
- No settlement calculation.
- No soil parameter selection.
- No foundation design or sizing recommendations.
- No official normative point reference until the user provides the source name.
- No DOCX/PDF export in the first version.

## User Inputs

Default values reproduce the first provided example:

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

UI field names:

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

## Calculation Flow

1. Summarize input data.
2. Compute self-weight contribution:

```text
G_fund = γ * b * l * h_gr
N_total = N + G_fund
```

3. Compute geometric properties:

```text
A = b * l
Wy = b * l^2 / 6
Wx = l * b^2 / 6
```

4. Move loads to the base level:

```text
Mx_base = |Mx + Qy * h_fund|
My_base = |My + Qx * h_fund|
ex = My_base / N_total
ey = Mx_base / N_total
```

5. Compute no-uplift corner stresses:

```text
σ1 = N_total / A + My_base / Wy + Mx_base / Wx
σ2 = N_total / A + My_base / Wy - Mx_base / Wx
σ3 = N_total / A - My_base / Wy + Mx_base / Wx
σ4 = N_total / A - My_base / Wy - Mx_base / Wx
```

6. If all four corner stresses are nonnegative, report no uplift and use these stresses as final.
7. If any corner stress is negative, solve the no-tension contact problem:

```text
p(x, y) = max(0; p0 + ax * x + ay * y)
```

with equilibrium:

```text
∫A p(x, y) dA = N_total
∫A x * p(x, y) dA = N_total * x_R
∫A y * p(x, y) dA = N_total * y_R
```

8. Classify the solved contact/uplift polygon.
9. Show the detected scheme, final stresses, dimensions `c1`, `c2`, and `P_lift`.
10. Show the equilibrium check.
11. Render the pressure epure diagram.

## Uplift Schemes

### Uplift in one corner

Use when the uplift zone is triangular in one corner.

Report geometry:

```text
c1 — сторона трикутної зони відриву вздовж b
c2 — сторона трикутної зони відриву вздовж l
```

Uplift share formula:

```text
P_lift = c1 * c2 / (2 * b * l) * 100
```

Required check example:

```text
Mx = 9.00 т·м
σ1 = 36.39 т/м²
σ2 = 15.70 т/м²
σ3 = 0.76 т/м²
c1 = 1.7340 м
c2 = 1.3427 м
P_lift = 26.9%
```

### Uplift in two corners

Use when the uplift zone is along one side and touches two corners.

Uplift share formula:

```text
P_lift = (c1 + c2) / 2 * b * 1 / (b * l) * 100
```

Required check example:

```text
Mx = 2.00 т·м
σ1 = 27.73 т/м²
σ2 = 22.31 т/м²
c1 = 0.2781 м
c2 = 0.6927 м
P_lift = 20.2%
```

## Algorithm Notes

The implementation plan must decide the numerical details before coding, including:

- coordinate origin and corner ordering;
- pressure-plane parameterization;
- solver method for `p0`, `ax`, `ay`;
- polygon clipping/integration method for the compressed zone;
- tolerance for equilibrium checks;
- classification rules for one-corner and two-corner uplift.

The report must not expose low-level iteration details. It should show the model, detected scheme, dimensions, stresses, uplift share formula, and equilibrium check.

## UI Structure

Follow the existing native calculator pattern:

- result summary with the main final stresses and uplift status;
- input form groups:
  - `Навантаження`
  - `Геометрія фундаменту`
  - `Висоти та вага`
- pressure epure diagram near the result/report;
- `Покроковий звіт`;
- method/source section with the temporary source text until the user provides the exact book name.

The diagram should show:

- rectangular base with `l` and `b`;
- stress labels for final nonzero contact stresses;
- uplift zone and labels `c1`, `c2` when uplift is present.

## Registration

Proposed catalog registration:

```text
slug: foundation-base-pressure
nativeCalculator: foundation-base-pressure
title: Напруження під підошвою фундаменту
mainCategory: fundamenty
extraCategories: ["perevirka-dbn", "normatyvni-obgruntuvannya"]
displayMode: native
accessLabel: Вбудований розрахунок
openUrl: /calculator/foundation-base-pressure
standard: Методика визначення крайових напружень під прямокутною підошвою фундаменту
```

Suggested use cases:

```text
Крайові напруження під підошвою
Відрив підошви фундаменту
Епюра тиску під фундаментом
```

Suggested tags:

```text
фундаменти
напруження
відрив підошви
```

## Validation

Errors:

```text
N_total має бути не менше 0.
l має бути більше 0.
b має бути більше 0.
h_gr має бути не менше 0.
h_fund має бути не менше 0.
γ має бути не менше 0.
```

Numeric inputs must be finite numbers. Invalid input must return a stable report with the input step, errors, and no `NaN` or `Infinity` formulas.

## Tests

Required coverage:

- default example input values are used by the UI;
- no-uplift geometry formulas produce `A = 4.320 м²`, `Wy = 1.728 м³`, `Wx = 1.296 м³`;
- example 1 no-uplift stresses are `26.13`, `21.80`, `-1.77`, `-6.09 т/м²`;
- example 1 detects uplift in two corners and returns `σ1 = 27.73 т/м²`, `σ2 = 22.31 т/м²`, `c1 = 0.2781 м`, `c2 = 0.6927 м`, `P_lift = 20.2%`;
- example 2 with `Mx = 9.00 т·м` detects uplift in one corner and returns `σ1 = 36.39 т/м²`, `σ2 = 15.70 т/м²`, `σ3 = 0.76 т/м²`, `c1 = 1.7340 м`, `c2 = 1.3427 м`, `P_lift = 26.9%`;
- report step order matches the contract;
- exact formula strings from the report contract are present for representative examples;
- invalid dimensions return errors and no non-finite formulas;
- UI smoke test through `CalculatorShell`;
- diagram renders labels for final stresses and uplift dimensions.

## Implementation Files

Expected files:

```text
lib/foundation-base-pressure.ts
lib/foundation-base-pressure.test.ts
components/calculators/foundation-base-pressure-calculator.tsx
components/calculators/foundation-base-pressure-calculator.test.tsx
lib/calculators.ts
components/calculator-shell.tsx
data/content.json
app/globals.css
components/calculator-shell.test.tsx
```

## Verification

After implementation:

```bash
npm run test
npm run typecheck
npm run build
```
