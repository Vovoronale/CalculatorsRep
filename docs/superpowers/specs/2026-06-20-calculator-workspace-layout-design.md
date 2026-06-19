# Calculator workspace layout redesign

**Status:** Agreed design
**Date:** 2026-06-20

## Goal

Improve the working layout of native React calculators and iframe calculators without changing calculation algorithms or report content.

The redesign must:

- prevent diagrams from overflowing the right edge of the calculator workspace;
- make native-calculator navigation and result summaries comfortably readable;
- let iframe calculators occupy the full available working viewport while the catalog rail remains visible;
- move supporting iframe-page content out of the primary working viewport;
- preserve the existing IVapps visual identity, accessibility behavior, and light/dark themes.

## Scope

### Included

- shared native calculator layout and its responsive behavior;
- the legacy soil-resistance layout where it duplicates the shared layout behavior;
- calculator detail-page composition for `native` and `embed` display modes;
- iframe toolbar, viewport sizing, and supporting-content disclosure;
- representative component, responsive, typecheck, and build verification.

### Excluded

- calculation logic, input schemas, report wording, formulas, and normative references;
- catalog information architecture;
- external and modal calculator behavior;
- a new color palette or typography system;
- user-resizable columns, drawers for diagrams, or scroll-spy navigation.

## Existing problems

The shared native layout currently uses three columns with minimum widths of approximately 150 px, 470 px, and 400 px. Its breakpoint is based on the browser viewport rather than the actual calculator container. With the 260 px catalog rail open, the calculator can be narrower than the breakpoint assumes, allowing the diagram column to overflow the workspace.

The first native column is limited to 120–150 px even though it contains both section navigation and multi-line calculation results. Real content includes long reinforcement-selection actions and multi-line steel-category summaries, so this width is insufficient.

Iframe detail pages already remove the workspace maximum width, but a large detail header and all supporting sections remain in the page flow. The iframe therefore does not read as the primary full-viewport workspace.

## Layout architecture

### Site shell

The existing catalog rail remains visible on desktop and retains its current collapse behavior. Calculator workspace changes must not alter catalog navigation.

Both native and iframe calculator detail workspaces use all available width instead of the reading-page `max-width`. Reading widths for external, modal, author, and legal content remain unchanged.

### Native calculator workbench

The native input area becomes a container-query layout. Breakpoints are based on the width of the calculator workbench, not the browser viewport.

#### Wide container: 1180 px and above

```text
| navigation + result: 260 px | inputs: flexible | diagram: 320–420 px |
```

The left rail and diagram are sticky within the viewport. The inputs column receives the remaining width and must retain at least the width needed by the shared input schema.

#### Medium container: 820–1179 px

```text
| navigation + result: 260 px | inputs: flexible |
| navigation + result: 260 px | diagram below inputs |
```

The left rail remains sticky. The diagram becomes static, moves below the input controls in the second column, and uses that column's full width. It must not shrink into an unreadable third column.

#### Narrow container: below 820 px

```text
| navigation |
| result     |
| inputs     |
| diagram    |
```

Navigation becomes a compact link grid. The result is a separate full-width block. Controls and diagrams follow in document order. No internal workbench panel is sticky in this mode.

### Native navigation and result rail

- Preferred width: 260 px.
- Hard minimum while rendered as a side rail: 240 px.
- The rail must never be compressed below 240 px.
- Navigation is shown before the current result summary.
- Long labels, values, and action buttons wrap naturally without clipping.
- When sticky, the rail may use an internal vertical scrollbar if its content is taller than the available viewport.
- No active-section scroll spy is added.

### Diagram containment

- Every diagram wrapper and SVG participates in the grid with `min-width: 0` and `max-width: 100%`.
- Responsive SVG diagrams scale to their containing column.
- The page itself must not gain horizontal scrolling because of a diagram.
- Intrinsically large normative scans may retain horizontal scrolling inside their own bounded canvas.
- A diagram is presented as a technical canvas with a thin border and restrained background, without a heavy card shadow.

### Native status and report flow

Errors and warnings remain after the input workbench and before the calculation report. They span the full calculator width. Report content, report ordering, and normative sections are unchanged.

## Iframe calculator workspace

### Primary viewport

An iframe calculator page uses this order:

1. compact workspace toolbar;
2. iframe occupying the full available viewport height;
3. collapsed `Про калькулятор` disclosure;
4. site footer.

The catalog rail remains visible. The iframe height is based on the dynamic viewport height minus the visible global and workspace toolbars. Mobile sizing must account for the mobile header. A fixed large hero or description must not appear above the iframe.

The iframe owns scrolling while the user works inside it. The document continues below the iframe when the user intentionally scrolls to supporting content.

### Compact toolbar

The existing breadcrumb context, current calculator title, and `Відкрити окремо` action are consolidated into the compact workspace toolbar. Long titles may truncate visually, but their accessible name must remain complete. The action remains keyboard accessible and opens the configured `openUrl` in a new tab.

### Supporting-content disclosure

The closed-by-default semantic `<details>` element is labeled `Про калькулятор`. It contains the existing non-working content:

- access and editorial badges;
- short and long descriptions when available;
- use cases and tags;
- methodology and normative context;
- related calculators.

This content remains in the document for users and search indexing but does not consume the initial working viewport. The site footer follows the disclosure.

## Visual system

The redesign uses the existing brand tokens:

- accent: `#e95f2a`;
- primary text: `#111111`;
- muted text: `#5e5e5e`;
- border: `#e2e2e2`;
- technical surface: `#f2f2f2`.

Equivalent existing dark-theme tokens continue to apply. No hard-coded light-only surfaces may be introduced around native calculators.

Typography roles remain:

- Space Grotesk for calculator and panel headings;
- Inter for controls, navigation, and explanations;
- JetBrains Mono for numeric values, units, and technical result data.

The native calculator loses the current “card inside a card” appearance. It becomes an edge-to-edge engineering workbench with thin structural borders and restrained surfaces. Shadows are removed or reduced on nested panels.

The distinctive element is the **engineering result rail**: navigation and current results form one stable reading anchor, with a thin orange rule identifying the live result area. Orange is used for state and calculation emphasis, not decoration.

## Interaction and accessibility

- Existing visible keyboard focus behavior is preserved.
- Navigation anchors retain semantic links and logical document order.
- The iframe toolbar and `Про калькулятор` summary are keyboard operable.
- Reduced-motion preferences remain respected.
- Opening the supporting-content disclosure may use only a restrained transition; the content must remain usable with transitions disabled.
- Layout changes must not reorder content in a way that differs between visual and keyboard navigation order.
- No page-level horizontal overflow is permitted at supported widths.

## Component boundaries

Implementation should keep responsibilities separated:

- `CalculatorShell` selects detail-page composition by display mode.
- The shared native layout owns workbench slots, responsive placement, statuses, and result-rail structure.
- Individual calculators continue to supply navigation links, controls, summary, diagrams, warnings, errors, and report children.
- Iframe presentation owns the compact toolbar, iframe viewport, and supporting-content disclosure without changing calculator data.
- Shared SEO-section rendering remains reusable inside the iframe disclosure and on non-iframe detail pages.

The duplicated soil-resistance input shell is migrated to the shared native layout. Its specialized controls, summary, diagram, warnings, errors, and report remain calculator-owned slot content. It must not retain a separate viewport-based layout implementation.

## Verification

### Automated checks

- Component tests verify native slot ordering and semantic regions.
- Component tests verify that an iframe is rendered immediately after its compact toolbar.
- Component tests verify that `Про калькулятор` is closed by default and contains the existing supporting sections.
- Existing calculator and report tests remain unchanged and passing.
- Run `npm run typecheck`.
- Run `npm run build`.

### Visual checks

Inspect at viewport widths 1920, 1440, 1280, 1024, 768, and 390 px with the catalog rail in its applicable expanded or collapsed state.

Use representative pages containing:

- the longest native result summary (steel structure category/group);
- a native result containing a long action label (minimum reinforcement);
- a large parametric diagram (soil resistance or concrete cover);
- an iframe calculator with supporting SEO content.

Acceptance criteria:

- the native result rail is 260 px when space permits and never narrower than 240 px while beside the form;
- diagrams never cross the calculator or page right edge;
- medium layouts move the diagram below controls instead of squeezing it;
- narrow layouts follow the agreed single-column order;
- the iframe fills the available first working viewport beneath the compact toolbar;
- supporting iframe content is accessible under the closed-by-default disclosure;
- there is no unintended page-level horizontal scrollbar.
