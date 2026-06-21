# Foundation Base Pressure Diagram Axes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add compact local `x` and `y` axes to the foundation base pressure SVG shown on the page and exported to DOCX.

**Architecture:** Keep the existing shared SVG generator as the single source for both outputs. Add an SVG arrow marker and a small axis group inside the lower-left footing area; verify the generated DOCX SVG because it uses the same generator as the web figure.

**Tech Stack:** TypeScript, React, SVG, Vitest, Testing Library, Next.js

---

## Chunk 1: Add and verify diagram axes

### Task 1: Add local axes to the shared diagram SVG

**Files:**
- Modify: `components/calculators/foundation-base-pressure-calculator.test.tsx`
- Modify: `components/calculators/foundation-base-pressure-calculator.tsx`
- Reference: `docs/superpowers/specs/2026-06-21-foundation-base-pressure-diagram-axes-design.md`

- [ ] **Step 1: Write the failing SVG contract test**

Extend the existing DOCX diagram test with assertions for stable axis hooks and geometry:

```ts
expect(svg).toContain('data-axis="x"');
expect(svg).toContain('data-axis="y"');
expect(svg).toContain('data-axis-label="x"');
expect(svg).toContain('data-axis-label="y"');
expect(svg).toContain('x1="124" y1="285" x2="196" y2="285"');
expect(svg).toContain('x1="124" y1="285" x2="124" y2="213"');
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run: `npm test -- components/calculators/foundation-base-pressure-calculator.test.tsx`

Expected: FAIL because the SVG does not contain `data-axis="x"` or the agreed axis geometry.

- [ ] **Step 3: Add the minimal SVG axis group**

In `buildFoundationBasePressureDiagramSvg`, derive an origin 28 px right and 28 px above the lower-left footing corner. Add a `defs` marker with a blue triangular arrowhead, then render:

```ts
const axisOriginX = baseX + 28;
const axisOriginY = baseY + baseHeight - 28;
const axisLength = 72;
```

```svg
<g aria-label="Локальні осі фундаменту">
  <line data-axis="x" ... marker-end="url(#foundation-base-pressure-axis-arrow)" />
  <line data-axis="y" ... marker-end="url(#foundation-base-pressure-axis-arrow)" />
  <text data-axis-label="x" ...>x</text>
  <text data-axis-label="y" ...>y</text>
</g>
```

Use explicit `#2563eb` stroke/fill so the exported SVG does not depend on page CSS. Reuse the existing diagram label class for typography.

- [ ] **Step 4: Run the focused test and confirm pass**

Run: `npm test -- components/calculators/foundation-base-pressure-calculator.test.tsx`

Expected: all focused tests PASS.

- [ ] **Step 5: Run repository verification**

Run:

```bash
npm run typecheck
npm run build
```

Expected: both commands exit 0.

- [ ] **Step 6: Visually verify the calculator**

Open `http://localhost:3000/calculator/foundation-base-pressure` and confirm the `x` arrow points right parallel to `l`, the `y` arrow points up parallel to `b`, and neither overlaps the corner/stress labels.

- [ ] **Step 7: Commit the implementation**

```bash
git add components/calculators/foundation-base-pressure-calculator.tsx \
  components/calculators/foundation-base-pressure-calculator.test.tsx \
  docs/superpowers/plans/2026-06-21-foundation-base-pressure-diagram-axes.md
git commit -m "feat: add axes to foundation pressure diagram"
```
