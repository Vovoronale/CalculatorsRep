# Soil Resistance SVGParametric Update Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the embedded SVGParametric runtime from `I:\SVGParametric\src` and use its ready foundation objects in the soil design resistance calculator.

**Architecture:** Treat `lib/vendor/svgparametric` as a self-contained runtime copy. Synchronize runtime source files from the standalone library, adapt imports to local extensionless TypeScript style, then consume `LoadedFoundation` and `BasementFoundation` from the existing `buildScene` flow in `soil-design-resistance`. The calculation core and report contract remain unchanged.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, Testing Library, local SVGParametric runtime.

---

## File Map

- Modify: `lib/vendor/svgparametric/core/*` - synchronize runtime core behavior from `I:\SVGParametric\src\core`.
- Modify: `lib/vendor/svgparametric/objects/annotations.ts` - add updated `Dimension`, `DistributedLoad`, and `BreakLine`.
- Modify: `lib/vendor/svgparametric/objects/primitives.ts` - synchronize primitive object behavior.
- Modify: `lib/vendor/svgparametric/objects/defaultRegistry.ts` - register all runtime objects, including `BreakLine`, `LoadedFoundation`, and `BasementFoundation`.
- Modify: `lib/vendor/svgparametric/index.ts` - export runtime objects used by the app.
- Create: `lib/vendor/svgparametric/objects/foundationDiagram.ts` - shared foundation geometry helpers.
- Create: `lib/vendor/svgparametric/objects/loadedFoundation.ts` - no-basement loaded foundation object.
- Create: `lib/vendor/svgparametric/objects/basementFoundation.ts` - basement foundation object.
- Create: `lib/vendor/svgparametric/objects/loadedFoundation.test.ts` - focused runtime tests adapted from upstream.
- Create: `lib/vendor/svgparametric/objects/basementFoundation.test.ts` - focused runtime tests adapted from upstream.
- Modify: `components/calculators/soil-design-resistance-calculator.tsx` - add parametric foundation diagram section.
- Modify: `components/calculators/soil-design-resistance-calculator.test.ts` - add UI smoke coverage for the diagram.
- Modify: `app/globals.css` - add responsive soil-resistance diagram styling.

## Task 1: Add Failing Runtime Object Tests

**Files:**
- Create: `lib/vendor/svgparametric/objects/loadedFoundation.test.ts`
- Create: `lib/vendor/svgparametric/objects/basementFoundation.test.ts`

- [ ] **Step 1: Add tests for `LoadedFoundation`**

Create `lib/vendor/svgparametric/objects/loadedFoundation.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { buildScene } from "../core/scene";
import { createDefaultRegistry } from "./defaultRegistry";

describe("LoadedFoundation", () => {
  it("renders a foundation body with depth, width, and R load label", () => {
    const built = buildScene(
      {
        scene: { width: 700, height: 520, mode: "detailed" },
        objects: {
          foundation: {
            type: "LoadedFoundation",
            params: {
              x: 180,
              y: 130,
              width: 320,
              depth: 170,
              loadValue: "R",
              color: "black",
              strokeWidth: 1.4,
            },
          },
        },
      },
      createDefaultRegistry(),
    );

    const foundation = built.objects.foundation;

    expect(foundation.anchors.ground).toEqual({ x: 340, y: 130 });
    expect(foundation.anchors.bottom).toEqual({ x: 340, y: 300 });
    expect(foundation.anchors.loadStart).toEqual({ x: 180, y: 362 });
    expect(foundation.anchors.loadEnd).toEqual({ x: 500, y: 362 });
    expect(foundation.children.map((child) => child.type)).toEqual([
      "Dimension",
      "Dimension",
      "RectBlock",
      "DistributedLoad",
    ]);
    expect(built.svg).toContain("d1=170");
    expect(built.svg).toContain("b=320");
    expect(built.svg).toContain(">R</text>");
    expect(built.svg).toContain("id=\"foundation-hatch\"");
    expect(built.svg).toContain("fill=\"url(#foundation-hatch)\"");
  });

  it("passes load prefix, suffix, and scaled height through the composed load", () => {
    const built = buildScene(
      {
        scene: { width: 520, height: 430, mode: "detailed" },
        objects: {
          foundation: {
            type: "LoadedFoundation",
            params: {
              x: 100,
              y: 80,
              width: 240,
              depth: 130,
              loadValue: 12,
              loadPrefix: "R=",
              loadSuffix: " кН",
              loadHeightScale: 3,
              loadMinHeight: 28,
            },
          },
        },
      },
      createDefaultRegistry(),
    );

    const foundation = built.objects.foundation;

    expect(built.svg).toContain(">R=12 кН</text>");
    expect(foundation.anchors.loadStart).toEqual({ x: 100, y: 272 });
    expect(foundation.anchors.loadEnd).toEqual({ x: 340, y: 272 });
    expect(foundation.children[2].params).toMatchObject({ height: 36 });
  });
});
```

- [ ] **Step 2: Add tests for `BasementFoundation`**

Create `lib/vendor/svgparametric/objects/basementFoundation.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { buildScene } from "../core/scene";
import { createDefaultRegistry } from "./defaultRegistry";

describe("BasementFoundation", () => {
  it("renders a basement foundation with floor dimensions, break lines, and reaction load", () => {
    const built = buildScene(
      {
        scene: { width: 860, height: 560, mode: "detailed" },
        objects: {
          foundation: {
            type: "BasementFoundation",
            params: {
              x: 120,
              y: 90,
              width: 360,
              depth: 180,
              stemWidth: 84,
              basementWidth: 270,
              floorTopDepth: 120,
              floorThickness: 30,
              slabThickness: 24,
              upperWallWidth: 84,
              loadValue: "R",
              color: "black",
              strokeWidth: 1.4,
            },
          },
        },
      },
      createDefaultRegistry(),
    );

    const foundation = built.objects.foundation;
    const childTypes = foundation.children.map((child) => child.type);

    expect(childTypes).toContain("RectBlock");
    expect(childTypes).toContain("Dimension");
    expect(childTypes).toContain("DistributedLoad");
    expect(childTypes).toContain("BreakLine");
    expect(built.svg).toContain("dB=120");
    expect(built.svg).toContain("h_cf=30");
    expect(built.svg).toContain("b=360");
    expect(foundation.anchors.floorTop).toEqual({ x: 612, y: 210 });
    expect(foundation.anchors.floorBottom).toEqual({ x: 612, y: 240 });
    expect(foundation.anchors.bottom).toEqual({ x: 300, y: 290.4 });
    expect(foundation.anchors.basementRight).toEqual({ x: 612, y: 150 });
  });

  it("moves the footing down when the basement floor depth increases", () => {
    const built = buildScene(
      {
        scene: { width: 900, height: 620, mode: "detailed" },
        objects: {
          shallow: {
            type: "BasementFoundation",
            params: {
              x: 120,
              y: 90,
              width: 360,
              depth: 180,
              stemWidth: 84,
              basementWidth: 270,
              floorTopDepth: 120,
              floorThickness: 30,
            },
          },
          deep: {
            type: "BasementFoundation",
            params: {
              x: 120,
              y: 90,
              width: 360,
              depth: 180,
              stemWidth: 84,
              basementWidth: 270,
              floorTopDepth: 170,
              floorThickness: 30,
            },
          },
        },
      },
      createDefaultRegistry(),
    );

    expect(built.objects.shallow.anchors.floorBottom.y).toBe(
      built.objects.shallow.anchors.baseTopLeft.y,
    );
    expect(built.objects.deep.anchors.floorBottom.y).toBe(
      built.objects.shallow.anchors.floorBottom.y + 50,
    );
    expect(built.objects.deep.anchors.baseTopLeft.y).toBe(
      built.objects.shallow.anchors.baseTopLeft.y + 50,
    );
    expect(built.objects.deep.anchors.bottom.y).toBe(
      built.objects.shallow.anchors.bottom.y + 50,
    );
  });
});
```

- [ ] **Step 3: Run runtime tests and verify RED**

Run:

```bash
npm run test -- lib/vendor/svgparametric/objects/loadedFoundation.test.ts lib/vendor/svgparametric/objects/basementFoundation.test.ts
```

Expected: FAIL because `LoadedFoundation` and `BasementFoundation` are not registered or do not exist in the embedded runtime yet.

## Task 2: Synchronize SVGParametric Runtime

**Files:**
- Modify: `lib/vendor/svgparametric/core/*`
- Modify: `lib/vendor/svgparametric/objects/*`
- Modify: `lib/vendor/svgparametric/index.ts`

- [ ] **Step 1: Copy runtime files from upstream source**

Copy files from `I:\SVGParametric\src\core` to `lib/vendor/svgparametric/core`.

Copy files from `I:\SVGParametric\src\objects` to `lib/vendor/svgparametric/objects`.

Copy `I:\SVGParametric\src\index.ts` to `lib/vendor/svgparametric/index.ts`.

- [ ] **Step 2: Adapt local imports**

In `lib/vendor/svgparametric`, replace import/export specifiers ending in `.js` with extensionless TypeScript specifiers.

For example:

```ts
import { svgElement } from "../core/svg.js";
```

becomes:

```ts
import { svgElement } from "../core/svg";
```

And:

```ts
export * from "./objects/loadedFoundation.js";
```

becomes:

```ts
export * from "./objects/loadedFoundation";
```

- [ ] **Step 3: Remove parser export from local index**

Keep `lib/vendor/svgparametric/index.ts` limited to runtime exports. Remove:

```ts
export * from "./parser/yamlScene";
```

because this app does not vendor the parser or CLI.

- [ ] **Step 4: Run runtime tests and verify GREEN**

Run:

```bash
npm run test -- lib/vendor/svgparametric/objects/loadedFoundation.test.ts lib/vendor/svgparametric/objects/basementFoundation.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run existing SVGParametric consumers**

Run:

```bash
npm run test -- components/calculators/cassoon-load-distribution-calculator.tsx components/calculators/minimum-reinforcement-calculator.tsx
```

Expected: PASS or no matching tests. If no matching tests are found, run:

```bash
npm run test -- components/calculators/cassoon-load-distribution-calculator.test.ts lib/minimum-reinforcement.test.ts
```

Expected: PASS.

## Task 3: Add Failing Soil Diagram UI Tests

**Files:**
- Modify: `components/calculators/soil-design-resistance-calculator.test.ts`

- [ ] **Step 1: Add render tests for diagram modes**

Append to `components/calculators/soil-design-resistance-calculator.test.ts`:

```ts
import { fireEvent, render, screen } from "@testing-library/react";

import { SoilDesignResistanceCalculator } from "./soil-design-resistance-calculator";

describe("SoilDesignResistanceCalculator diagrams", () => {
  it("renders the no-basement foundation diagram by default", () => {
    render(<SoilDesignResistanceCalculator />);

    expect(
      screen.getByRole("img", {
        name: /схема фундаменту без підвалу/i,
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Позначення величин")).toBeInTheDocument();
  });

  it("renders the basement foundation diagram after enabling basement mode", () => {
    render(<SoilDesignResistanceCalculator />);

    fireEvent.click(screen.getByRole("checkbox", { name: /є підвал/i }));

    expect(
      screen.getByRole("img", {
        name: /схема фундаменту з підвалом/i,
      }),
    ).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run UI test and verify RED**

Run:

```bash
npm run test -- components/calculators/soil-design-resistance-calculator.test.ts
```

Expected: FAIL because the diagram section does not exist yet.

## Task 4: Implement Soil Resistance Diagram

**Files:**
- Modify: `components/calculators/soil-design-resistance-calculator.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: Import SVGParametric runtime**

In `components/calculators/soil-design-resistance-calculator.tsx`, add:

```ts
import {
  buildScene,
  createDefaultRegistry,
  type SceneDefinition,
} from "@/lib/vendor/svgparametric";
```

- [ ] **Step 2: Add diagram helpers**

Add helper constants and functions near existing utility functions:

```ts
const SVG_PARAMETRIC_REGISTRY = createDefaultRegistry();
const SOIL_DIAGRAM_METER_SCALE = 120;
const SOIL_DIAGRAM_MIN_WIDTH = 260;
const SOIL_DIAGRAM_MAX_WIDTH = 430;
const SOIL_DIAGRAM_MIN_DEPTH = 110;
const SOIL_DIAGRAM_MAX_DEPTH = 230;

function sanitizeDiagramValue(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function clampDiagramValue(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function scaledLengthMeters(value: number, fallbackMeters: number, min: number, max: number): number {
  const safeValue = sanitizeDiagramValue(value, fallbackMeters);
  return clampDiagramValue(safeValue * SOIL_DIAGRAM_METER_SCALE, min, max);
}

function escapeSvgAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}
```

- [ ] **Step 3: Add scene builder**

Add:

```ts
function getSoilFoundationScene({
  hasBasement,
  foundationWidthM,
  embedmentDepthD1M,
  basementDepthInputM,
  soilLayerAboveFootingHsM,
  basementFloorThicknessHcfM,
  soilDesignResistanceKPa,
}: {
  hasBasement: boolean;
  foundationWidthM: number;
  embedmentDepthD1M: number;
  basementDepthInputM: number;
  soilLayerAboveFootingHsM: number;
  basementFloorThicknessHcfM: number;
  soilDesignResistanceKPa?: number;
}): SceneDefinition {
  const width = scaledLengthMeters(
    foundationWidthM,
    1,
    SOIL_DIAGRAM_MIN_WIDTH,
    SOIL_DIAGRAM_MAX_WIDTH,
  );
  const noBasementDepth = scaledLengthMeters(
    embedmentDepthD1M,
    1.2,
    SOIL_DIAGRAM_MIN_DEPTH,
    SOIL_DIAGRAM_MAX_DEPTH,
  );
  const basementDepth = scaledLengthMeters(
    basementDepthInputM,
    1.2,
    95,
    190,
  );
  const floorThickness = scaledLengthMeters(
    basementFloorThicknessHcfM,
    0.2,
    18,
    36,
  );
  const baseHeight = scaledLengthMeters(
    soilLayerAboveFootingHsM,
    0.4,
    36,
    70,
  );
  const hasResult =
    typeof soilDesignResistanceKPa === "number" &&
    Number.isFinite(soilDesignResistanceKPa) &&
    soilDesignResistanceKPa > 0;
  const loadValue = hasResult
    ? formatSoilDesignResistanceNumber(soilDesignResistanceKPa, 1)
    : "R";

  if (hasBasement) {
    return {
      scene: { width: 900, height: 620, mode: "detailed" },
      objects: {
        foundation: {
          type: "BasementFoundation",
          params: {
            x: 135,
            y: 190,
            width,
            depth: basementDepth + floorThickness + baseHeight,
            baseHeight,
            stemWidth: Math.max(74, width * 0.26),
            basementWidth: 270,
            floorTopDepth: basementDepth,
            floorThickness,
            slabThickness: 24,
            upperWallWidth: 84,
            loadValue,
            loadPrefix: hasResult ? "R=" : "",
            loadSuffix: hasResult ? " кПа" : "",
            color: "#111827",
            strokeWidth: 1.4,
            fill: "#e6e6e6",
            slabFill: "#eef7e8",
            slabColor: "#5f8f43",
            upperWallColor: "#d56a00",
            loadFill: "#f3cccc",
            loadColor: "#b54a4a",
          },
        },
      },
    };
  }

  return {
    scene: { width: 720, height: 430, mode: "detailed" },
    objects: {
      foundation: {
        type: "LoadedFoundation",
        params: {
          x: 160,
          y: 90,
          width,
          depth: noBasementDepth,
          loadValue,
          loadPrefix: hasResult ? "R=" : "",
          loadSuffix: hasResult ? " кПа" : "",
          color: "#111827",
          strokeWidth: 1.4,
          fill: "#e6e6e6",
          loadFill: "#f3cccc",
          loadColor: "#b54a4a",
        },
      },
    },
  };
}
```

- [ ] **Step 4: Add diagram component**

Add:

```tsx
function SoilFoundationDiagram({
  input,
  soilDesignResistanceKPa,
}: {
  input: SoilDesignResistanceInput;
  soilDesignResistanceKPa?: number;
}) {
  const title = input.hasBasement
    ? `Схема фундаменту з підвалом: b ${formatSoilDesignResistanceNumber(
        input.foundationWidthM,
        2,
      )} м, db,input ${formatSoilDesignResistanceNumber(
        input.basementDepthInputM,
        2,
      )} м, hcf ${formatSoilDesignResistanceNumber(
        input.basementFloorThicknessHcfM,
        2,
      )} м`
    : `Схема фундаменту без підвалу: b ${formatSoilDesignResistanceNumber(
        input.foundationWidthM,
        2,
      )} м, d1 ${formatSoilDesignResistanceNumber(input.embedmentDepthD1M, 2)} м`;
  const svg = buildScene(
    getSoilFoundationScene({
      hasBasement: input.hasBasement,
      foundationWidthM: input.foundationWidthM,
      embedmentDepthD1M: input.embedmentDepthD1M,
      basementDepthInputM: input.basementDepthInputM,
      soilLayerAboveFootingHsM: input.soilLayerAboveFootingHsM,
      basementFloorThicknessHcfM: input.basementFloorThicknessHcfM,
      soilDesignResistanceKPa,
    }),
    SVG_PARAMETRIC_REGISTRY,
  ).svg.replace(
    "<svg ",
    `<svg role="img" aria-label="${escapeSvgAttribute(
      title,
    )}" class="soil-resistance-diagram__svg" `,
  );

  return (
    <figure className="soil-resistance-diagram">
      <div
        className="soil-resistance-diagram__canvas"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <figcaption>
        {input.hasBasement
          ? "Параметрична схема фундаменту з підвалом для геометричних величин формул (Е.1) і (Е.2)."
          : "Параметрична схема фундаменту без підвалу для геометричних величин формули (Е.1)."}
      </figcaption>
    </figure>
  );
}
```

- [ ] **Step 5: Render diagram section**

In `SoilDesignResistanceCalculator`, after the input shell and before errors, add:

```tsx
<section className="soil-resistance-diagrams" aria-labelledby="soil-resistance-diagrams-title">
  <div className="soil-resistance-report__head">
    <h3 id="soil-resistance-diagrams-title">Позначення величин</h3>
  </div>
  <SoilFoundationDiagram
    input={input}
    soilDesignResistanceKPa={
      report.valid && report.values ? report.values.soilDesignResistanceKPa : undefined
    }
  />
</section>
```

- [ ] **Step 6: Add styles**

Add near existing soil-resistance CSS in `app/globals.css`:

```css
.soil-resistance-diagrams {
  display: grid;
  gap: 1rem;
}

.soil-resistance-diagram {
  display: grid;
  gap: 0.75rem;
  margin: 0;
}

.soil-resistance-diagram__canvas {
  overflow-x: auto;
  border-radius: 8px;
  background: var(--surface-muted);
  padding: 1rem;
}

.soil-resistance-diagram__svg {
  display: block;
  width: min(100%, 900px);
  height: auto;
}

.soil-resistance-diagram figcaption {
  color: var(--muted-foreground);
  font-size: 0.92rem;
  line-height: 1.45;
}
```

- [ ] **Step 7: Run UI test and verify GREEN**

Run:

```bash
npm run test -- components/calculators/soil-design-resistance-calculator.test.ts
```

Expected: PASS.

## Task 5: Full Verification

**Files:**
- No new files.

- [ ] **Step 1: Run targeted tests**

Run:

```bash
npm run test -- lib/vendor/svgparametric/objects/loadedFoundation.test.ts lib/vendor/svgparametric/objects/basementFoundation.test.ts components/calculators/soil-design-resistance-calculator.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run full test suite**

Run:

```bash
npm run test
```

Expected: PASS.

- [ ] **Step 3: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

## Self-Review

- Spec coverage: runtime update, all runtime objects, foundation object usage, accessibility, styling, and tests are covered.
- Placeholder scan: no placeholder steps remain.
- Type consistency: `SceneDefinition`, `SoilDesignResistanceInput`, and SVGParametric object params are consistently named across tasks.
