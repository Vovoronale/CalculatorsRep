# Design Spec: Calculator Category Taxonomy Review

Project: `construction-calculators-hub`
Date: 2026-06-18
Status: Approved for implementation planning

## Goal

Simplify the calculator catalog taxonomy so the navigation reflects real engineering
workflows instead of a mix of active tools, future placeholders, references, and
cross-cutting tags.

The change is content/navigation only. It should not change calculator formulas,
native calculator behavior, report text, detail routes, display modes, or external
URLs.

## Current Problems

- Several empty future subcategories are visible as clickable navigation items with
  a `0` count.
- Thermal calculators are split into too many narrow categories, including
  moisture, surface temperature, thermal inertia, and air permeability.
- Reinforced-concrete calculators are split across `Залізобетон`, `Арматура`,
  `Бетон`, `Анкерування`, and the separate top-level `Довідники`.
- Reference calculators are separated from the construction type where engineers
  naturally expect to use them.
- Beam/load-distribution tools need a structural mechanics home rather than being
  mixed into generic beams and slabs.

## Target Category Tree

### Теплотехніка

Keep the top-level category `Теплотехніка`.

Children:

- `Огороджувальні конструкції`
- `Підлоги`
- `Теплові містки / FEM`

The `Огороджувальні конструкції` child becomes the home for:

- base envelope heat-transfer tools;
- moisture and dew-point tools;
- vapor permeability;
- surface temperature checks;
- thermal inertia and summer thermal resistance;
- air permeability.

Remove these separate thermal child categories:

- `Волога і точка роси`
- `Температура поверхні`
- `Теплова інерція`
- `Повітропроникність`

### Конструкції

Keep the top-level category `Конструкції`.

Children:

- `Залізобетон`
- `Фундаменти та основи`
- `Сталеві конструкції`
- `Будівельна механіка`

`Залізобетон` becomes the home for:

- ArmCon;
- minimum reinforcement;
- rebar area selection;
- rebar anchorage;
- concrete exposure class;
- concrete cover durability;
- concrete characteristics;
- rebar characteristics.

Remove these separate construction/reference categories:

- `Арматура`
- `Бетон`
- `Балки і плити`
- `Анкерування`
- `Довідкові таблиці`
- top-level `Довідники`
- `Характеристики бетону`
- `Характеристики арматури`
- `Матеріали`
- `Нормативні характеристики`

Rename `Фундаменти` to `Фундаменти та основи`.

Add `Будівельна механіка` under `Конструкції`. It becomes the home for:

- `LiveBeamCalculator`;
- `Розподіл навантаження в кесонному перекритті`.

Use the new slug `budivelna-mekhanika`.

### Норми та перевірки

Keep the existing top-level category `Норми та перевірки` for cross-cutting
regulatory workflows.

Children:

- `Нормоконтроль`
- `Клас наслідків`
- `Перевірки ДБН`
- `Нормативні обґрунтування`

Remove the empty `AI-асистенти з норм` child. AI tools stay under the dedicated
AI top-level category.

Calculators may still use `extraCategories` for cross-cutting regulatory
placement when that helps discovery, but the primary category should remain the
engineering discipline where the calculation is used.

### Інженерні Мережі

Keep this as a top-level category.

Children:

- `Електрика`

Remove empty future children:

- `Опалення`
- `Вентиляція`
- `Водопостачання`
- `Енергоспоживання`

### CAD / GIS / Дані

Keep this as a top-level category.

Children:

- `DXF / GeoJSON`

Remove empty future children:

- `Конвертери`
- `Геометрія`
- `Імпорт / експорт`

### AI-Інструменти

Keep this as a top-level category.

Children:

- `Асистенти з ДБН`

Remove empty future children:

- `Асистенти з перевірки рішень`
- `Асистенти з підготовки пояснень`

## Calculator Reassignment Rules

Update calculator `mainCategory` values as follows:

- `cadee-heat-humid-state`: `ogorodzhuvalni-konstruktsiyi`
- `cadee-vapor-permeability-resistance`: `ogorodzhuvalni-konstruktsiyi`
- `cadee-dewpoint-temperature`: `ogorodzhuvalni-konstruktsiyi`
- `cadee-delta-surface-temperature`: `ogorodzhuvalni-konstruktsiyi`
- `cadee-heat-inertia`: `ogorodzhuvalni-konstruktsiyi`
- `cadee-summer-thermo-resistance`: `ogorodzhuvalni-konstruktsiyi`
- `cadee-air-permeability`: `ogorodzhuvalni-konstruktsiyi`
- `minimum-reinforcement-area`: `zalizobeton`
- `rebar-area-bars`: `zalizobeton`
- `foundation-bar-anchorage`: `zalizobeton`
- `cassoon-load-distribution`: `budivelna-mekhanika`
- `livebeamcalculator`: `budivelna-mekhanika`
- `rebar-characteristics`: `zalizobeton`
- `concrete-characteristics`: `zalizobeton`

Keep these primary categories:

- foundation calculators stay under `fundamenty`, whose title changes to
  `Фундаменти та основи`;
- steel category/group calculator stays under `stalevi-konstruktsiyi`;
- concrete exposure and cover calculators stay under `zalizobeton`;
- NormControl, consequence class, electrical, CAD/GIS, and AI assistant entries
  stay in their current active categories.

Remove `extraCategories` values that reference deleted categories. Keep active
cross-cutting regulatory extras where they still point to existing categories.

## Implementation Boundaries

Expected implementation files:

- `data/content.json`
- `lib/calculators.ts`
- `lib/icons.ts`
- `lib/calculators.test.ts`

No native calculator source files should need behavior changes.

## Testing

Update tests to verify:

- category navigation order matches the new tree;
- deleted category slugs are absent from `CategorySlug` and test expectations;
- all calculators reference existing primary and extra categories;
- top-level categories remain populated;
- `Теплотехніка` aggregates the moved envelope calculators;
- `Залізобетон` aggregates the moved armature, anchorage, concrete, and reference calculators;
- `Будівельна механіка` contains load distribution and beam calculation tools;
- `Довідники` no longer exists as a top-level category.

Run:

```bash
npm run typecheck
npm run build
```

## Non-Goals

- No visual redesign of the rail or category table.
- No hiding logic for empty categories; the empty categories are removed from
  content instead.
- No changes to calculator display modes or external service links.
- No SEO text rewrite except metadata implied by category title changes.
