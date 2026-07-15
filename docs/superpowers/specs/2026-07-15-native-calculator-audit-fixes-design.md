# Native Calculator Audit Fixes Design

Date: 2026-07-15
Project: `construction-calculators-hub`
Status: Approved for implementation

## Context

The audit of all native calculators found ten reproducible defects: six in
calculation/report logic and four in frontend input or invalid-state handling.
The existing test suite passes because it does not cover these edge cases. This
design fixes only the audited defects and adds regression coverage for each one.

## Goals

- Reject impossible or non-finite foundation pressure solutions.
- Preserve both moment directions in the foundation anchorage calculator while
  always checking the critical footing edge.
- Apply the allowed `gamma_c` combinations exactly as specified by the existing
  steel report contract.
- Warn about the incompatible `X0 + XS` exposure combination.
- Use one strict numeric parsing rule from form state to calculation core.
- Never show or export calculated results for blocking numeric/input failures
  that return `values: null`.
- Preserve physical area when rebar-area display units change.
- Avoid duplicate custom columns in rebar tables.

## Non-goals

- No new calculators or new normative methods.
- No redesign of the native calculator layout.
- No replacement of the foundation contact-pressure solver.
- No change to valid-input results except where the audited algorithm is wrong.
- No unrelated refactoring of calculator cores or report rendering.

## Selected Approach

Use focused, contract-aligned fixes. Each defect gets a failing regression test
before production code changes. Shared behavior is centralized only where the
repository already has a shared abstraction, such as numeric parsing and the
DOCX button.

Rejected alternatives:

- Validation-only patches would remove supported negative moment directions and
  would not detect a non-converged pressure solution.
- A full form-state and solver rewrite would expand scope and regression risk
  without being necessary for the audited defects.

## Algorithm Design

### 1. Foundation base pressure

The calculation requires strictly positive total compression:

```text
N_total > 0
```

The existing validation message changes to:

```text
N_total має бути більше 0.
```

The valid-report formula changes from `>= 0` to:

```text
N_total = N + G_fund = <N> + <G_fund> = <N_total> т > 0
```

Before solving a no-tension contact plane, the resultant must lie strictly
inside the rectangular footing:

```text
ex < l / 2
ey < b / 2
```

Errors:

```text
ex має бути менше l / 2; рівнодійна виходить за межі підошви в напрямку l.
ey має бути менше b / 2; рівнодійна виходить за межі підошви в напрямку b.
```

The solver returns the final integrated force and moments together with a
`converged` flag. Convergence is accepted only when each residual is within a
relative tolerance of `1e-6` of its target, with `1` used as the minimum scale.
If it does not converge, the report is invalid and contains this error:

```text
Не вдалося отримати збіжний розв'язок контактної епюри; перевірте вихідні дані.
```

The equilibrium values are calculated from the integrated pressure plane, not
from the target force or target resultant. The report formulas become:

```text
ΣP = <integrated_force> т ≈ N_total = <N_total> т
ΣMx = <integrated_moment_x_about_center> т·м ≈ Mx_base = <Mx_base> т·м
ΣMy = <integrated_moment_y_about_center> т·м ≈ My_base = <My_base> т·м
```

An invalid result contains the input step and errors, but no calculated values,
uplift classification, equilibrium claim, summary, or DOCX export.

The convergence-error regression uses this feasible but numerically difficult
inside-footing case:

```text
N = 10 т
Mx = 8.9 т·м
My = 11.9 т·м
l = 2.4 м
b = 1.8 м
h_gr = 0 м
Qx = Qy = 0 т
ex = 1.19 м < 1.20 м
ey = 0.89 м < 0.90 м
```

The current solver has force or moment residuals above the agreed tolerance for
this case. The fixed report must return the exact convergence error and no
calculated output.

### 2. Foundation bar anchorage

The signed input actions still combine algebraically, but the critical footing
edge is checked using the magnitude of the resulting moment. The agreed report
formula is:

```text
Mtot = |M + MQ| = |<M> + <MQ>| = <Mtot> кН*м
```

All downstream values `e`, `qmax`, `qmin`, `qx`, `R`, and `Fs` use this
non-negative `Mtot`. Thus reversing the total moment mirrors the critical edge
without changing the critical-edge reinforcement demand for symmetric geometry.

For beam mode, `n` must be a positive integer. Error:

```text
n має бути цілим числом, більшим за 0.
```

### 3. Steel structure `gamma_c`

Applicable profiles are converted into calculation candidates. When an allowed
pair is applicable, its two individual factors are replaced by their product:

```text
position 6 with position 1, 2, or 5
position 9 with position 2 or 3
```

Unpaired applicable factors remain individual candidates. If multiple
independent candidates remain, the minimum candidate is selected, as required
by the existing report contract. For a position 9 value of `1.20` and position
3 value of `1.05`, the result is `1.20 * 1.05 = 1.26`.

The existing allowed-combination report wording remains unchanged and must be
selected instead of the single-position wording.

### 4. Concrete exposure class

The existing `X0` compatibility warning is emitted when any of XD, XS, XF, or
XA is selected. Its text remains unchanged. Only its display condition changes:

```text
carbonation_exposure_row = X0 and
(xd_exposure_row != none or xs_exposure_row != none or
 xf_exposure_row != none or xa_exposure_row != none)
```

## Frontend Design

### 5. Strict numeric parsing

Every schema-driven native calculator uses `parseCalculatorDecimal`. Component
helpers must not call `Number.parseFloat` and must not replace malformed user
text with a valid fallback value. A malformed or incomplete numeric value is
passed to the core as `NaN`; the schema and core therefore agree that the input
is invalid.

The affected schema-driven calculators are:

- cassoon load distribution;
- concrete cover durability;
- foundation bar anchorage;
- foundation base pressure;
- minimum reinforcement area;
- residential yard areas;
- soil design resistance.

### 6. Invalid report presentation and DOCX

When numeric or engineering input validation fails and the calculation core
returns `values: null`:

- summary and result cards are hidden;
- only stable input/error report content may be rendered;
- `ReportDocxButton` is not rendered;
- no formulas derived from invalid values appear in UI or DOCX.

`valid = false` is not by itself an instruction to hide safe calculations. A
contract-approved engineering check failure with finite `values` — for example,
an insufficient anchorage verdict or a disallowed steel class/group combination
— retains its calculated steps, result, and DOCX action. Presentation is gated
by the presence of safe calculated `values`, not by the verdict boolean alone.

`residential-yard-areas` changes its report value type to nullable and returns
`values: null` with exactly one `inputs` step when a blocking validation error
exists. That step
uses the existing input caption and raw, non-derived input items. A non-finite
numeric input is rendered as `не введено`; a finite but out-of-range value is
echoed as entered. The apartment-count formula `N_(кв) = N_(1) + N_(2+)` is
omitted because it is derived. Other
calculators retain their contract-approved safe failure reports. Their UI hides
results and DOCX only when the core returns no safe calculated values.

The two reduced-physical-culture applicability errors are non-blocking fallback
errors:

```text
Зменшений норматив не можна застосувати: окрему озеленену зону з фізкультурними майданчиками не передбачено проєктом.
Зменшений норматив не можна застосувати: фактична площа зелених насаджень обмеженого користування має бути не меншою за <S_(озел,мін)> м².
```

If these are the only errors, `valid = false` remains an auditable engineering
verdict, but `values` and the complete report are retained using the contracted
automatic fallback to full physical-culture rates. Result cards and DOCX remain
available. Every other residential validation error is blocking; if any
blocking error coexists with a fallback error, the blocking no-output behavior
wins.

### 7. Rebar-area unit changes

The entered physical area is preserved when the display unit changes:

```text
5 cm² -> 500 mm²
500 mm² -> 5 cm²
5 cm² -> 0.0005 m²
```

The conversion occurs in the unit-change handler using the current valid input.
If the current text is incomplete or invalid, the unit changes without rewriting
the text so that the user can correct it.

### 8. Rebar custom columns

`getRebarBarCounts` and `getRebarSpacingColumns` append the custom value only
when it is not already present in the corresponding base list. Selection logic
continues to operate over the returned unique ordered list. When the custom
value equals a preset, that single column keeps the normal preset heading (`5`
or `100 мм`); it is not relabeled as `n = 5` or `s = 100 мм`.

## Audit Traceability

| # | Audited defect | Required behavior | Mandatory regression |
|---|---|---|---|
| 1 | Non-converged foundation pressure accepted | Reject excessive residuals and omit output | The `ex=1.19`, `ey=0.89` feasible case returns the exact convergence error |
| 2 | `N_total=0` produces `NaN` | Require `N_total>0` | Zero total compression is invalid and report JSON contains no `NaN`/`Infinity` |
| 3 | Allowed `gamma_c` product discarded | Replace paired factors with their product | Position `9+3` gives `1.26`; position `6+1` also uses its product |
| 4 | Negative anchorage moment checks wrong edge | Use `|M+MQ|` for the critical edge | Equal positive/negative `Mtot` give equal `qmax`, `qmin`, `qx`, `R`, `Fs`, and verdict |
| 5 | Fractional bar count accepted | Require positive integer `n` | `n=2.5` returns the exact validation error |
| 6 | `X0+XS` warning missing | Include XS in the X0 condition | `X0+XS3` emits the existing compatibility warning |
| 7 | Schema parser and core parser disagree | Use strict parsing in all seven named components | Each named component rejects `10abc` and shows no calculated result |
| 8 | Invalid residential report still shown/exported | Return `values:null`, one raw input step, and no DOCX button | `residents=-5` has no summary, cards, derived formulas, or DOCX action |
| 9 | Rebar unit switch changes physical area | Convert the entered value | Round trips cover `cm2 -> mm2 -> cm2` and `cm2 -> m2 -> cm2` |
| 10 | Custom rebar columns duplicate presets | Return one normally labeled preset column | Duplicate count and spacing inputs each produce exactly one preset header |

## Data Flow and Boundaries

- Calculation cores remain responsible for engineering validation and stable
  report objects.
- Schema validation remains responsible for immediate field-level feedback.
- Components convert display values to base units with strict parsing and pass
  invalid numbers through as `NaN`.
- Result rendering and DOCX actions depend on the presence of contract-approved,
  finite calculated values; numeric/input-validation failures provide none.
- Rebar tables remain independent of schema-driven report calculators.

## Contract Amendments Before Planning

The exact proposed changes have been transferred into these source-of-truth
documents for written user confirmation before planning:

- `2026-06-15-foundation-base-pressure-report-contract.md` — strict-positive
  `N_total`, resultant-bound errors, solver failure, and actual equilibrium
  formulas;
- `2026-07-15-foundation-bar-anchorage-report-contract.md` — absolute `Mtot`
  formula and positive-integer `n` validation; the older design links to this
  canonical amendment;
- `2026-06-17-concrete-exposure-class-report-contract.md` — add XS to the X0
  warning condition;
- `2026-06-19-residential-yard-areas-report-contract.md` — blocking-invalid
  reports have no calculated values, formulas, summary, or DOCX, while the two
  contracted reduced-mode fallback errors retain safe output.

The steel contract already contains the correct combination rule and requires no
wording change. The proposed amendment markers remain pending until the user
confirms that the agreed behavior was transferred correctly; only then are they
marked `Agreed source of truth` and implementation planning may start.

## Test Strategy

Every production change follows RED-GREEN TDD.

Core regression tests:

- reject `N_total = 0` without `NaN` or `Infinity`;
- reject a resultant outside either footing dimension;
- reject the exact boundaries `ex = l / 2` and `ey = b / 2`;
- verify solver residuals and actual equilibrium values for valid uplift cases;
- exercise the feasible `ex=1.19`, `ey=0.89` non-convergence reproduction and
  verify the exact error plus absence of calculated output;
- produce identical critical-edge anchorage demand for `Mtot = +X` and `-X`;
- reject fractional beam bar count;
- return `gamma_c = 1.26` for the position `9 + 3` example;
- emit the existing X0 warning for `X0 + XS3`;
- return `values: null` and no calculated residential steps for invalid input;
- retain values, full-rate calculations, report, and DOCX for each fallback-only
  reduced-mode applicability error;
- apply blocking no-output behavior when a blocking residential error coexists
  with a fallback error;
- return unique rebar count and spacing columns.

Component regression tests:

- each of the seven listed schema-driven components receives malformed numeric
  text, shows an error, and exposes no calculated summary/result;
- numeric/input-invalid reports with `values: null` do not expose a DOCX action;
- changing `5 cm²` to `mm²` produces `500` and preserves the selection target;
- a custom count or spacing equal to a preset does not create a duplicate header.
- incomplete or malformed rebar-area text is not rewritten when its display
  unit changes.

Final verification:

```text
npm test
npm run typecheck
npm run build
```

The audited browser reproductions are repeated against the production build at
desktop and narrow viewport widths.

## Success Criteria

- All ten audited reproductions now show the agreed behavior.
- No valid default example changes unexpectedly.
- No numeric/input-invalid report contains `NaN`, `Infinity`, misleading result
  cards, or an enabled DOCX export; safe engineering failure verdicts remain
  auditable and exportable where their existing contracts require it.
- All existing and new tests pass, typecheck passes, and static build succeeds.
