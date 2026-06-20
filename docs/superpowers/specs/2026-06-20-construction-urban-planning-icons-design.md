# Construction and Urban Planning Calculator Icons

**Status:** Approved design

## Scope

Replace the catalog artwork for all 13 calculators in the `konstruktsiyi` branch and the single calculator in `mistobuduvannya-blahoustriy`. The delivered assets are 14 PNG files under `public/calculator-icons/`.

## Visual System

- Canvas: 512 x 512 px PNG, rendered at 44 x 44 px in the calculator table.
- Background: flat, light neutral gray with no grid, border, or decorative texture.
- Subject: one large, immediately recognizable technical silhouette in charcoal or near-black.
- Detail: use only the geometry needed to distinguish the task at 44 x 44 px. Avoid captions, dimensions, hatching, and secondary decoration.
- Rendering: crisp technical drawing with restrained gray material shading, inspired by compact legacy engineering software icons.
- Accent: one quantity badge in the upper-left area. It is the only colored element.
- Badge text must be laid out deterministically after the artwork is created. Generated or approximate lettering is not acceptable.
- Badge size may adapt to the notation, but the type size must remain legible at 44 x 44 px.
- Typeface: bold technical sans or monospace. Use typographic subscripts where they remain legible.

## Badge Colors

| Calculator subtype | Badge treatment |
| --- | --- |
| Reinforced concrete | muted structural green `#4F7A58`, white text |
| Foundations | warm soil brown `#76533E`, white text |
| Structural mechanics | deep technical blue `#3E6288`, white text |
| Steel structures | restrained violet `#71558A`, white text |
| Urban planning | white fill, charcoal text and outline |

Minor shade adjustments are allowed only to improve contrast while keeping these color directions visibly intact.

## Icon Inventory

| Slug | Subtype | Recognizable subject | Badge |
| --- | --- | --- | --- |
| `armcon` | Reinforced concrete | reinforced-concrete section with four bars | `As` |
| `rebar-area-bars` | Reinforced concrete | compact row of reinforcing bars with one emphasized diameter | `nO` rendered as `n` plus the diameter symbol |
| `minimum-reinforcement-area` | Reinforced concrete | beam section with the minimum tension reinforcement emphasized | `mu min` rendered with the Greek mu and compact subscript |
| `foundation-bar-anchorage` | Reinforced concrete | bent reinforcing bar anchored into a foundation block | `lbd` rendered with `bd` as a subscript when legible |
| `concrete-exposure-class` | Reinforced concrete | concrete specimen exposed to a single droplet/weather mark | `XC` |
| `concrete-cover-durability` | Reinforced concrete | concrete edge, reinforcing bar, and highlighted cover distance | `cnom` rendered with `nom` as a subscript when legible |
| `rebar-characteristics` | Reinforced concrete | ribbed reinforcing bar sample | `fyd` rendered with `yd` as a subscript when legible |
| `concrete-characteristics` | Reinforced concrete | concrete test cube | `fcd` rendered with `cd` as a subscript when legible |
| `soil-design-resistance` | Foundations | shallow footing over two simple soil layers | `R` |
| `foundation-base-pressure` | Foundations | footing with a single pressure diagram beneath its base | `p` |
| `cassoon-load-distribution` | Structural mechanics | one caisson slab cell with load arrows splitting in two directions | `q` |
| `livebeamcalculator` | Structural mechanics | simply supported beam with load and bending curve | `M` |
| `steel-structure-category-group` | Steel structures | one clean I-section | `S` |
| `residential-yard-areas` | Urban planning | top-view house and one adjacent yard platform | `S` |

In the source artwork, ASCII spellings in the table describe semantics only. The final badges use the proper visible symbols: `nØ`, `μmin`, `lbd`, `cnom`, `fyd`, and `fcd`, with compact subscripts where they improve rather than reduce legibility.

## Integration

- Update the calculator table image source from `.svg` to `.png`.
- Update asset-presence and image-source tests accordingly.
- Keep existing SVG files unless removal is clearly safe and covered by repository references; the new PNG files become the active catalog assets.
- Preserve current image dimensions, loading behavior, alt text, and table layout.

## Acceptance Criteria

- All 14 PNG files exist and are used by the calculator table.
- Every icon is distinguishable by silhouette at 44 x 44 px.
- Badge notation is exact and readable at 44 x 44 px.
- Badge colors consistently identify calculator subtype.
- Each image has exactly one colored accent element and no visual clutter.
- `npm run typecheck` and `npm run build` pass.
- The construction and urban-planning catalog rows are visually checked in the browser at desktop and mobile widths.
