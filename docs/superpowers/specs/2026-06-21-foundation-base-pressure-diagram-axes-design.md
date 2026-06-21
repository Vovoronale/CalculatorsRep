# Foundation Base Pressure Diagram Axes Design

**Date:** 2026-06-21
**Status:** Approved

## Goal

Make the plan-view pressure diagram in the native `foundation-base-pressure` calculator show the local foundation axes, so users can relate the input force and moment suffixes to the footing geometry.

## Approved design

- Add a compact coordinate marker inside the lower-left area of the footing outline.
- Draw the positive `x` axis to the right, parallel to footing length `l`.
- Draw the positive `y` axis upward, parallel to footing width `b`.
- Put the `x` and `y` labels at the corresponding arrowheads.
- Do not add force or moment labels to the diagram.
- Keep the existing footing dimensions, corner numbers, pressure labels, uplift geometry, and calculation logic unchanged.
- Generate the axes in the shared SVG string so they appear both on the web page and in the DOCX figure.

## Implementation boundary

Update only the diagram SVG generator, its focused tests, and the minimum styling needed for readable axes. No report-contract, calculation, schema, or catalog changes are required.

## Verification

- Focused component tests assert both axis labels and axis directions are present in the SVG used by the page and DOCX export.
- Run the focused calculator test, TypeScript check, and production build.
- Visually confirm that the axes remain legible without colliding with corner, stress, or dimension labels.
