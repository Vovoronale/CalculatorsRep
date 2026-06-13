# Design Spec: SVGParametric Runtime Update for Soil Resistance Diagrams

Date: 2026-06-13
Project: `construction-calculators-hub`
Status: Approved for implementation

## Context

The site vendors a local copy of the SVGParametric runtime in `lib/vendor/svgparametric`.
That copy is older than the standalone library at `I:\SVGParametric`.

The standalone runtime already contains the objects needed for foundation diagrams:

- `LoadedFoundation` for a foundation with soil reaction `R` and dimensions `b`, `d1`
- `BasementFoundation` for a basement foundation with `b`, basement depth, floor thickness, break lines, and soil reaction `R`
- `BreakLine`
- shared helper code in `foundationDiagram`
- updated `Dimension`, `DistributedLoad`, and primitive object behavior

The soil design resistance calculator already has the required input fields and calculation report. This task must update the embedded runtime library and consume the existing foundation objects without rewriting equivalent objects inside the calculator.

## Goals

- Update the vendored SVGParametric runtime from `I:\SVGParametric\src`.
- Keep the site runtime self-contained under `lib/vendor/svgparametric`.
- Use the ready `LoadedFoundation` and `BasementFoundation` objects in `soil-design-resistance`.
- Preserve existing calculator behavior, report formulas, and report contract text.
- Keep existing consumers of `svgparametric` working:
  - `minimum-reinforcement`
  - `cassoon-load-distribution`
- Add focused tests for the updated runtime and the new soil-resistance diagram integration.

## Non-Goals

- Do not add the standalone SVGParametric CLI to this Next.js app.
- Do not add YAML scene parsing unless a later task needs it.
- Do not copy upstream examples, docs, package metadata, or upstream test tree into the site.
- Do not change formulas, report step order, or normative text in the soil resistance calculation.
- Do not replace existing calculator-specific diagram scenes that already work.

## Runtime Update Scope

Copy and adapt the runtime source from `I:\SVGParametric\src` into `lib/vendor/svgparametric`:

- `core/*`
- `objects/*`
- `index.ts`

Expected new or updated runtime files include:

- `lib/vendor/svgparametric/objects/annotations.ts`
- `lib/vendor/svgparametric/objects/basementFoundation.ts`
- `lib/vendor/svgparametric/objects/defaultRegistry.ts`
- `lib/vendor/svgparametric/objects/foundation.ts`
- `lib/vendor/svgparametric/objects/foundationDiagram.ts`
- `lib/vendor/svgparametric/objects/loadedFoundation.ts`
- `lib/vendor/svgparametric/objects/primitives.ts`
- `lib/vendor/svgparametric/objects/reinforcedConcreteSection.ts`
- `lib/vendor/svgparametric/core/*`
- `lib/vendor/svgparametric/index.ts`

Adapt upstream ESM imports that end in `.js` to the local project style, which currently uses extensionless TypeScript imports.

The vendored runtime should still be imported as:

```ts
import { buildScene, createDefaultRegistry, type SceneDefinition } from "@/lib/vendor/svgparametric";
```

## Soil Resistance Diagram

Add one live "Позначення величин" diagram section to `components/calculators/soil-design-resistance-calculator.tsx`.

The section renders a single SVG scene based on current form values:

- if `hasBasement = false`, use `LoadedFoundation`
- if `hasBasement = true`, use `BasementFoundation`

The diagram should sit near the input form so users can connect geometry fields to the drawing before reading the report.

### No-Basement Scene

Use `LoadedFoundation`.

Map calculator values to object params:

- `foundationWidthM` -> `width`
- `embedmentDepthD1M` -> `depth`
- result `R` -> `loadValue` when available
- load label uses `loadPrefix: "R="` and `loadSuffix: " кПа"` when a valid result exists

Show dimensions for:

- `b`
- `d1`
- `R`

### Basement Scene

Use `BasementFoundation`.

Map calculator values to object params:

- `foundationWidthM` -> `width`
- `basementDepthInputM` -> `floorTopDepth`
- `basementFloorThicknessHcfM` -> `floorThickness`
- `soilLayerAboveFootingHsM` influences the overall footing depth if needed to keep the figure visually coherent
- result `R` -> `loadValue` when available
- load label uses `loadPrefix: "R="` and `loadSuffix: " кПа"` when a valid result exists

The upstream object labels basement depth as `dB`. In this calculator, the UI field is `db,input`; the diagram may show the object's built-in basement-depth label, while the figure caption explains it is the basement depth used for the basement scheme.

Show dimensions for:

- `b`
- basement depth
- `h_cf`
- footing/base height if the upstream object includes it
- `R`

## Scaling and Fallbacks

SVGParametric object dimensions are pixel-like scene units. The calculator stores geometry in meters.

Use a local diagram scaling helper in the soil calculator:

- sanitize input values before scene creation
- use stable fallback dimensions for empty, non-finite, or non-positive inputs
- clamp visual dimensions so extreme user input does not make the SVG unreadable
- keep `aria-label` based on engineering values, not only scaled drawing units

Recommended defaults:

- scene width around `720-900`
- no-basement scene height around `430`
- basement scene height around `560-620`
- scale meters to drawing units with a stable factor and clamp to readable bounds

## Accessibility

The generated SVG must be injected with:

- `role="img"`
- a descriptive `aria-label`
- a calculator-specific class for styling

The label should mention:

- whether the diagram is a no-basement or basement foundation scheme
- `b`
- `d1` for no-basement schemes
- basement depth and `hcf` for basement schemes
- `R` when a valid result exists

## Styling

Add soil-resistance diagram styles in `app/globals.css` near existing soil-resistance styles.

The diagram should:

- be visually secondary to the form and report
- not introduce a card-inside-card layout
- scale down on mobile without clipping labels
- use colors consistent with existing parametric diagrams and the current calculator UI

## Tests

Add focused tests:

- runtime object tests for `LoadedFoundation`
- runtime object tests for `BasementFoundation`
- runtime object test for `BreakLine` or registry availability
- `soil-design-resistance-calculator` UI smoke test verifying:
  - the diagram section renders
  - no-basement mode includes a `LoadedFoundation` SVG
  - basement mode can render a `BasementFoundation` SVG after toggling `hasBasement`
  - the SVG has an accessible label

Run:

```bash
npm run test
npm run typecheck
npm run build
```

## Implementation Notes

Existing unrelated working-tree changes must be preserved. Only stage or commit files changed for this task.

Do not edit the soil calculation report contract unless a later user-approved change alters formulas or report text.

## Self-Review

- No placeholders remain.
- Scope is limited to vendored runtime update and soil-resistance diagram consumption.
- Runtime parser and CLI are explicitly excluded.
- The design uses existing upstream foundation objects instead of reimplementing them.
- Existing formulas and report contract are explicitly preserved.
