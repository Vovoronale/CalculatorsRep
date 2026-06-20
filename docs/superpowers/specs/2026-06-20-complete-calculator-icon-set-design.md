# Complete Calculator Icon Set

**Status:** Approved design

## Scope

- Replace the remaining 30 SVG catalog assets with 512 x 512 PNG icons.
- Keep the supplied ArmCon and LiveBeamCalculator PNG conversions unchanged.
- Regenerate the existing 12 technical PNG icons with badge text enlarged by exactly 50%.
- After completion, every calculator catalog row uses a PNG asset.

## Shared Visual System

- Canvas: 512 x 512 px, flat light-neutral background, transparent only for the two supplied product icons.
- Subject: one large, recognizable charcoal technical silhouette with restrained gray material fills.
- Accent: one colored quantity badge in the upper-left area. Access-mode markers remain separate code-native overlays in the upper-right corner.
- Generated badge main text increases from 58 px to 87 px.
- Generated badge subscript text increases from 34 px to 51 px.
- Badge widths remain notation-aware so larger text does not clip. Badge height and baseline may be adjusted only as needed to contain the approved 50% type increase.
- No captions, dimensions, decorative grids, or secondary colored elements.
- ArmCon and LiveBeamCalculator remain exact supplied artwork and have no quantity badge.

## Direction Colors

| Direction | Badge fill | Text |
| --- | --- | --- |
| Reinforced concrete | `#4F7A58` | white |
| Foundations | `#76533E` | white |
| Structural mechanics | `#3E6288` | white |
| Steel structures | `#71558A` | white |
| Urban planning | white with charcoal outline | charcoal |
| Envelope structures | `#A45A45` | white |
| Floors | `#8A6A3C` | white |
| Thermal bridges / FEM | `#3F7774` | white |
| Norm control | `#4A6078` | white |
| Consequence class | `#7D4655` | white |
| Electricity | `#B27618` | white |
| CAD / GIS | `#3C6E8F` | white |
| AI / DBN assistants | `#6E568C` | white |

## Remaining Icon Inventory

| Slug | Recognizable subject | Badge |
| --- | --- | --- |
| `cadee-external` | layered exterior wall section with one heat-flow arrow | `RΣ` |
| `cadee-heat-transfer-resistance` | layered wall with opposed indoor/outdoor heat arrows | `R` |
| `cadee-heat-humid-state` | layered wall and one moisture droplet | `w` |
| `cadee-vapor-permeability-resistance` | wall section with vapor dots crossing layers | `Rv` with `v` as subscript |
| `cadee-heat-inertia` | massive wall section and one time/thermal-wave mark | `D` |
| `cadee-summer-thermo-resistance` | wall section and a sun | `ν` |
| `cadee-dewpoint-temperature` | thermometer inside a droplet | `td` with `d` as subscript |
| `cadee-delta-surface-temperature` | wall face with a surface thermometer | `τi` with `i` as subscript |
| `cadee-air-permeability` | wall section crossed by three airflow lines | `G` |
| `cadee-heated-basement` | floor slab with a radiator/heat source below | `Rb+` with `b` as subscript |
| `cadee-floor-techroom` | floor slab with a compact service duct below | `Rtp` with `tp` as subscript |
| `cadee-floor-ground` | floor slab directly over two soil layers | `Rg` with `g` as subscript |
| `cadee-floor-cold-basement` | floor slab with a snowflake below | `Rb-` with `b` as subscript |
| `cadee-floor-heat-absorption` | floor surface receiving a single thermal wave | `Y` |
| `cadee-bridge-homogeneous-wall-floor` | clean T-junction of wall and slab | `Ψ` |
| `cadee-bridge-homogeneous-wall-floor-balcony` | wall/slab junction with projecting balcony | `Ψ` |
| `cadee-bridge-floor-inclusions` | floor slab with one embedded inclusion | `Ψ` |
| `cadee-bridge-wall-inclusions` | wall section with one embedded inclusion | `Ψ` |
| `cadee-bridge-homogeneous-wall-corner` | single-layer L-shaped wall corner | `Ψ` |
| `cadee-bridge-two-wall-corner` | double-layer L-shaped wall corner | `Ψ` |
| `normcontrol` | technical checklist with one magnifier | `NC` |
| `consequence-class` | building silhouette inside a shield | `CC` |
| `power-calculator` | distribution panel with one lightning bolt | `P` |
| `iv-geojson` | map polygon with connected vertices | `GIS` |
| `dbn-assistant` | open standards book with one chat mark | `AI` |
| `ai-dbn-v-2-2-5-2023` | shelter entrance inside a shield | `AI` |
| `ai-dbn-v-2-6-31-2021` | layered wall between sun and snowflake | `AI` |
| `ai-dbn-v-1-1-7-2016` | flame inside a shield | `AI` |
| `ai-dbn-v-2-2-15-2019` | residential building facade | `AI` |
| `ai-dbn-v-2-5-67-2013` | ventilation fan with two airflow lines | `AI` |

## Existing Generated Icons

The existing 12 deterministic technical icons retain their approved silhouettes, badges, and subtype colors. Only their badge typography changes to the shared 87 px main text and 51 px subscript text. The official `armcon` and `livebeamcalculator` images remain excluded from generation.

## Integration

- Extend the focused PNG generator to cover 42 generated calculators: the existing 12 plus the remaining 30.
- Keep one definition per slug so silhouettes, badge notation, and palette are explicit and reviewable.
- Update artwork-path selection so every registered calculator resolves to `/calculator-icons/<slug>.png`.
- Preserve the blue `embed` and orange `external` upper-right access markers.
- Keep PNG dimensions, alt text, lazy loading, and responsive table geometry unchanged.

## Acceptance Criteria

- All 44 registered calculators resolve to existing 512 x 512 PNG files.
- ArmCon and LiveBeamCalculator hashes remain unchanged.
- The generator writes 42 icons and never writes the two official product icons.
- Generated badge main/subscript type sizes are exactly 87/51 px.
- No enlarged badge text clips at 512 px or becomes unreadable at 44 px.
- Every remaining icon has one distinct, recognizable subject matching the inventory.
- Direction colors are consistent across the catalog.
- Access markers remain visible and correctly colored without covering badge text.
- Desktop and mobile catalogs have no broken images, clipping, or horizontal overflow.
- `npm test`, `npm run typecheck`, and `npm run build` pass.
