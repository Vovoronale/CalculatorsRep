# External Calculator Artwork and Markers

**Status:** Approved design

## Scope

- Replace the generated `armcon.png` artwork with the flat 256 px image embedded in `I:/ArmCON/Resources/ArmCON_Icon5.ico`.
- Replace the generated `livebeamcalculator.png` artwork with the largest 256 px image embedded in `I:/ArmCON/Resources/BeamCalc_Icon.ico`.
- Visually mark every calculator whose `displayMode` is `embed` or `external` in the catalog table.

## Supplied Artwork

- Preserve the supplied icon artwork and transparency. Do not redraw it, add a formula badge, recolor it, or merge the access-mode marker into the bitmap.
- Export each source as a 512 x 512 PNG so it follows the active catalog artwork contract. Scale with high-quality interpolation and retain transparent pixels.
- Use the flat ArmCon ICO layer rather than the textured or gradient color-depth variants because it remains clearest at the rendered 44 px size.
- Keep the source ICO files outside the repository; the converted PNG files under `public/calculator-icons/` are the project assets.

## Access-Mode Marker

- Add a positioned wrapper around each catalog artwork image.
- Render a code-native Lucide `ExternalLink` marker in the wrapper's upper-right corner when `displayMode` is `embed` or `external`.
- Marker size: 16 x 16 px at desktop and mobile catalog sizes.
- Shape: square with a 4 px corner radius, white glyph, subtle border/shadow, and a small optical offset beyond the artwork edge.
- `embed` marker fill: technical blue `#3E6288`.
- `external` marker fill: interface orange `#E95F2A`.
- Do not render a marker for `native` or `modal` calculators.
- Keep the marker decorative for assistive technology because the calculator's access behavior is already communicated elsewhere; use `aria-hidden`.

## Integration

- Determine the marker variant directly from `calculator.displayMode`; do not maintain a second slug list.
- Keep artwork-path selection in `lib/calculator-artwork.ts` and preserve SVG paths for calculators outside the approved PNG set.
- Exclude ArmCon and LiveBeamCalculator from the focused generated-artwork definitions so rerunning the generator preserves the two source-controlled PNG conversions.
- Add focused tests for marker visibility, marker color variants, hidden modes, and the two active PNG paths.

## Acceptance Criteria

- ArmCon and LiveBeamCalculator visually match the supplied ICO artwork at 44 px.
- `embed` rows show a blue upper-right external-link marker.
- `external` rows show an orange upper-right external-link marker.
- `native` and `modal` rows have no marker.
- Markers do not clip, cover the primary icon subject, or cause horizontal overflow on desktop or mobile.
- Existing alt text, image dimensions, lazy loading, row interactions, and responsive layout remain unchanged.
- `npm test`, `npm run typecheck`, and `npm run build` pass.
