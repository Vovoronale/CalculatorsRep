# Foundation Pressure Corner Label Overlap Design

**Date:** 2026-06-21
**Status:** Approved

## Problem

The corner numbers and stress labels in the foundation base pressure SVG overlap at the right-hand corners because both text elements are positioned immediately outside the same corner marker.

## Approved design

- Center corner numbers `1`–`4` inside their existing white circular markers.
- Keep all stress labels at their current positions.
- Keep the marker size, footing geometry, axes, dimensions, uplift annotations, calculations, and report text unchanged.
- Apply the change in the shared SVG generator so the web diagram and DOCX figure remain identical.

## Verification

- Add a focused SVG test that checks every corner number uses the marker center and centered text alignment.
- Run the focused component test, full test suite, typecheck, and production build.
- Visually confirm that corner numbers and stress labels no longer overlap.
