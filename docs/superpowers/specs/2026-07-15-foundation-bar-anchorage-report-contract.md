# Foundation Bar Anchorage Bugfix Report Contract

Date: 2026-07-15
Calculator: `foundation-bar-anchorage`
Status: Agreed source of truth

This contract records the exact report and validation amendments agreed for the
2026-07-15 native-calculator audit fixes. It supersedes the affected passages in
`2026-05-13-foundation-bar-anchorage-design.md`. All report steps not named here
retain their previously approved captions, formulas, order, and display rules.

## Critical-Edge Moment Rule

Signed input actions are combined algebraically. The magnitude of their sum is
then used to select and calculate the critical footing edge. No separate sign or
orientation selector is added.

### Additional moment from shear

Caption and formula remain:

```text
Визначення додаткового моменту від поперечної сили Q за висотою її прикладання:
MQ = Q * hQ = <Q> * <hQ> = <MQ> кН*м
```

### Total moment at the pedestal

Caption:

```text
Визначення сумарного моменту на уступі фундаменту:
```

Formula:

```text
Mtot = |M + MQ| = |<M> + <MQ>| = <Mtot> кН*м
```

Downstream rule:

```text
e, qmax, qmin, qx, R та Fs визначаються за невід'ємним Mtot.
```

The existing downstream symbolic formulas remain unchanged:

```text
e = Mtot / N
qmax = N / (L * B) + 6 * Mtot / (B * L^2)
qmin = N / (L * B) - 6 * Mtot / (B * L^2)
qx = qmax - (qmax - qmin) * x / L
R = B * x * (qmax + qx) / 2
Fs = R * ze / zi
```

## Beam Bar Count Validation

For beam mode, `n` must be finite, greater than zero, and an integer.

Error:

```text
n має бути цілим числом, більшим за 0.
```

When this error exists, return a stable invalid report with no calculated
values or formulas containing `NaN` or `Infinity`. The UI must not render a
result summary or DOCX action.

## Regression Examples

With all other representative inputs unchanged:

```text
Case A: M = 100 кН*м; Q = 50 кН; hQ = 0.5 м
MQ = 25 кН*м
Mtot = |100 + 25| = 125 кН*м

Case B: M = -150 кН*м; Q = 50 кН; hQ = 0.5 м
MQ = 25 кН*м
Mtot = |-150 + 25| = 125 кН*м
```

For the symmetric footing in the representative test, both cases must produce
the same `qmax`, `qmin`, `qx`, `R`, `Fs`, and anchorage verdict.

For beam mode:

```text
n = 2.5 -> invalid
n має бути цілим числом, більшим за 0.
```

## Unchanged Report Content

No other input labels, captions, formula strings, warnings, step order,
normative links, or handoff parameters change in this bugfix.
