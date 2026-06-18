# Calculator Category Taxonomy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize the calculator category taxonomy so active calculators live under clearer engineering categories and empty roadmap categories are removed.

**Architecture:** The catalog taxonomy is JSON-driven from `data/content.json`, then typed by `lib/calculators.ts` and rendered by existing components. This implementation keeps the UI and calculator behavior unchanged, updating only category data, calculator category assignments, fallback icon mappings, and tests.

**Tech Stack:** Next.js App Router, TypeScript, JSON content loader, lucide-react icons, Vitest.

## Global Constraints

- The change is content/navigation only.
- Do not change calculator formulas, native calculator behavior, report text, detail routes, display modes, or external URLs.
- Remove empty future categories from content instead of adding UI hiding logic.
- Do not keep the top-level `Довідники` category.
- Use the new category slug `budivelna-mekhanika` for `Будівельна механіка`.
- Keep cross-cutting regulatory `extraCategories` only when they point to categories that still exist.
- Before finishing, run `npm run typecheck` and `npm run build`.

---

## File Structure

- Modify `data/content.json`: update the `categories` array and calculator `mainCategory` / `extraCategories` values.
- Modify `lib/calculators.ts`: update the `CategorySlug` union to match the new category list.
- Modify `lib/icons.ts`: remove fallback icons for deleted category slugs and add `budivelna-mekhanika`.
- Modify `lib/calculators.test.ts`: update taxonomy expectations and category membership tests.
- Modify `components/calculator-shell.test.tsx`: update rendered rail counts and removed empty leaf expectations.

No new runtime modules are needed.

---

### Task 1: Update Taxonomy Tests First

**Files:**
- Modify: `lib/calculators.test.ts`

**Interfaces:**
- Consumes: existing exports `calculatorCategories`, `calculators`, `getCalculatorBySlug`, `getCalculatorsForCategory`.
- Produces: failing tests that define the target taxonomy and calculator assignments.

- [ ] **Step 1: Replace the category navigation order expectation**

In `lib/calculators.test.ts`, update the `builds the category navigation in the expected order` expectation to:

```ts
expect(calculatorCategories.map((category) => category.slug)).toEqual([
  "energoefektyvnist-teplotekhnika",
  "ogorodzhuvalni-konstruktsiyi",
  "pidlohy",
  "teplovi-mistky-fem",
  "konstruktsiyi",
  "zalizobeton",
  "fundamenty",
  "stalevi-konstruktsiyi",
  "budivelna-mekhanika",
  "normy-perevirky",
  "normokontrol",
  "klas-naslidkiv",
  "perevirka-dbn",
  "normatyvni-obgruntuvannya",
  "inzhenerni-merezhi",
  "elektryka",
  "cad-gis-dani",
  "dxf-geojson",
  "ai-instrumenty",
  "asystenty-dbn",
]);
```

- [ ] **Step 2: Replace the thermal grouping test**

Replace the existing thermal-specific test body with assertions that moved calculators now belong to `ogorodzhuvalni-konstruktsiyi`:

```ts
it("groups thermal envelope calculators under envelope structures", () => {
  const parent = calculatorCategories.find(
    (category) => category.slug === "energoefektyvnist-teplotekhnika",
  );
  const envelopeCategory = calculatorCategories.find(
    (category) => category.slug === "ogorodzhuvalni-konstruktsiyi",
  );
  const envelopeSlugs = getCalculatorsForCategory("ogorodzhuvalni-konstruktsiyi").map(
    (calculator) => calculator.slug,
  );
  const floorSlugs = getCalculatorsForCategory("pidlohy").map(
    (calculator) => calculator.slug,
  );
  const femSlugs = getCalculatorsForCategory("teplovi-mistky-fem").map(
    (calculator) => calculator.slug,
  );

  expect(parent?.parentSlug).toBeUndefined();
  expect(envelopeCategory?.parentSlug).toBe("energoefektyvnist-teplotekhnika");
  expect(envelopeSlugs).toEqual([
    "cadee-external",
    "cadee-heat-transfer-resistance",
    "cadee-heat-humid-state",
    "cadee-vapor-permeability-resistance",
    "cadee-heat-inertia",
    "cadee-summer-thermo-resistance",
    "cadee-dewpoint-temperature",
    "cadee-delta-surface-temperature",
    "cadee-air-permeability",
  ]);
  expect(floorSlugs).toContain("cadee-floor-ground");
  expect(femSlugs).toContain("cadee-bridge-homogeneous-wall-floor");
});
```

- [ ] **Step 3: Replace the reference category test**

Replace `moves reference calculators into reference subcategories` with:

```ts
it("moves reference calculators into reinforced concrete", () => {
  const categorySlugs = calculatorCategories.map((category) => category.slug);
  const reinforcedConcreteSlugs = getCalculatorsForCategory("zalizobeton").map(
    (calculator) => calculator.slug,
  );

  expect(categorySlugs).not.toContain("dovidnyky");
  expect(categorySlugs).not.toContain("dovidnyk-armatura");
  expect(categorySlugs).not.toContain("dovidnyk-beton");
  expect(reinforcedConcreteSlugs).toEqual([
    "armcon",
    "minimum-reinforcement-area",
    "foundation-bar-anchorage",
    "rebar-area-bars",
    "concrete-exposure-class",
    "rebar-characteristics",
    "concrete-characteristics",
    "concrete-cover-durability",
  ]);
});
```

- [ ] **Step 4: Update extra category duplication expectations**

In `places each calculator in a primary category and limits extra category duplication`, replace the expected list with:

```ts
expect(
  calculators
    .filter((calculator) => calculator.extraCategories.length > 0)
    .map((calculator) => ({
      slug: calculator.slug,
      extraCategories: calculator.extraCategories,
    })),
).toEqual([
  {
    slug: "soil-design-resistance",
    extraCategories: ["perevirka-dbn", "normatyvni-obgruntuvannya"],
  },
  {
    slug: "foundation-base-pressure",
    extraCategories: ["perevirka-dbn", "normatyvni-obgruntuvannya"],
  },
  {
    slug: "steel-structure-category-group",
    extraCategories: ["normy-perevirky"],
  },
  {
    slug: "concrete-exposure-class",
    extraCategories: ["normy-perevirky", "normatyvni-obgruntuvannya"],
  },
  {
    slug: "concrete-cover-durability",
    extraCategories: ["normy-perevirky", "normatyvni-obgruntuvannya"],
  },
]);
```

- [ ] **Step 5: Replace empty prepared subcategories test**

Replace `allows empty prepared subcategories while keeping top-level categories populated` with:

```ts
it("keeps only populated category branches", () => {
  const topLevelCategories = calculatorCategories.filter((category) => !category.parentSlug);
  const removedSlugs = [
    "voloha-tochka-rosy",
    "temperatura-poverkhni",
    "teplova-inertsiya",
    "povitropronyknist",
    "armatura",
    "beton",
    "balky-plyty",
    "ankeruvannya",
    "dovidkovi-tablytsi",
    "ai-asystenty-z-norm",
    "opalennya",
    "ventylyatsiya",
    "vodopostachannya",
    "enerhospozhyvannya",
    "konvertery",
    "heometriya",
    "import-eksport",
    "dovidnyky",
    "dovidnyk-beton",
    "dovidnyk-armatura",
    "materialy",
    "normatyvni-kharakterystyky",
    "asystenty-perevirky-rishen",
    "asystenty-pidhotovky-poyasnen",
  ];
  const categorySlugs = calculatorCategories.map((category) => category.slug);

  for (const category of topLevelCategories) {
    expect(getCalculatorsForCategory(category.slug).length, category.slug).toBeGreaterThan(0);
  }

  for (const removedSlug of removedSlugs) {
    expect(categorySlugs).not.toContain(removedSlug);
  }

  expect(getCalculatorsForCategory("perevirka-dbn").map((calculator) => calculator.slug)).toEqual([
    "soil-design-resistance",
    "foundation-base-pressure",
  ]);
});
```

- [ ] **Step 6: Add structural mechanics registration test**

Add this test near the existing calculator registration tests:

```ts
it("registers structural mechanics calculators under construction mechanics", () => {
  const category = calculatorCategories.find(
    (item) => item.slug === "budivelna-mekhanika",
  );

  expect(category).toMatchObject({
    parentSlug: "konstruktsiyi",
    title: "Будівельна механіка",
    icon: "Activity",
  });
  expect(getCalculatorsForCategory("budivelna-mekhanika").map((calculator) => calculator.slug)).toEqual([
    "cassoon-load-distribution",
    "livebeamcalculator",
  ]);
});
```

- [ ] **Step 7: Update changed calculator registration assertions**

Update the existing steel calculator test so only the active regulatory cross-listing remains:

```ts
expect(calculator).toMatchObject({
  mainCategory: "stalevi-konstruktsiyi",
  extraCategories: ["normy-perevirky"],
  displayMode: "native",
  nativeCalculator: "steel-structure-category-group",
  standard: "ДБН В.2.6-198:2014",
});
```

Update concrete exposure and cover calculator tests so their `extraCategories` are:

```ts
extraCategories: ["normy-perevirky", "normatyvni-obgruntuvannya"],
```

- [ ] **Step 8: Run the targeted tests and confirm failure**

Run:

```bash
npm test -- lib/calculators.test.ts
```

Expected: FAIL because the JSON, union type, and icon map still contain the old category tree.

---

### Task 2: Update Content Taxonomy and Calculator Assignments

**Files:**
- Modify: `data/content.json`

**Interfaces:**
- Consumes: target category tree from the design spec.
- Produces: JSON content whose `categories` and calculator assignments match tests.

- [ ] **Step 1: Replace `categories` with the target active tree**

In `data/content.json`, replace the current `categories` array with entries in this exact order:

```json
[
  {
    "slug": "energoefektyvnist-teplotekhnika",
    "title": "Теплотехніка",
    "note": "Розрахунки теплової ізоляції, енергоефективності, вологи, температурних режимів і повітропроникності огороджувальних конструкцій.",
    "icon": "Thermometer"
  },
  {
    "slug": "ogorodzhuvalni-konstruktsiyi",
    "parentSlug": "energoefektyvnist-teplotekhnika",
    "title": "Огороджувальні конструкції",
    "note": "Опір теплопередачі, волога, точка роси, температура поверхні, теплостійкість і повітропроникність зовнішніх огороджень.",
    "icon": "BrickWall"
  },
  {
    "slug": "pidlohy",
    "parentSlug": "energoefektyvnist-teplotekhnika",
    "title": "Підлоги",
    "note": "Теплопередача та теплозасвоєння підлог над підвалами, техпідпіллями і по ґрунту.",
    "icon": "Layers"
  },
  {
    "slug": "teplovi-mistky-fem",
    "parentSlug": "energoefektyvnist-teplotekhnika",
    "title": "Теплові містки / FEM",
    "note": "Двовимірний FEM-аналіз вузлів, кутів, термовключень і теплових містків.",
    "icon": "Network"
  },
  {
    "slug": "konstruktsiyi",
    "title": "Конструкції",
    "note": "Розрахунки залізобетону, фундаментів, сталевих конструкцій і будівельної механіки.",
    "icon": "Triangle"
  },
  {
    "slug": "zalizobeton",
    "parentSlug": "konstruktsiyi",
    "title": "Залізобетон",
    "note": "Розрахунки залізобетону, арматури, анкерування, захисного шару та довідкових характеристик матеріалів.",
    "icon": "Building"
  },
  {
    "slug": "fundamenty",
    "parentSlug": "konstruktsiyi",
    "title": "Фундаменти та основи",
    "note": "Інструменти для перевірки фундаментів, основ і фундаментних вузлів.",
    "icon": "Home"
  },
  {
    "slug": "stalevi-konstruktsiyi",
    "parentSlug": "konstruktsiyi",
    "title": "Сталеві конструкції",
    "note": "Класифікація, нормативні перевірки та розрахункові параметри сталевих конструкцій.",
    "icon": "Hammer"
  },
  {
    "slug": "budivelna-mekhanika",
    "parentSlug": "konstruktsiyi",
    "title": "Будівельна механіка",
    "note": "Розрахунки зусиль, прогинів, балок, плит, перекриттів і розподілу навантажень.",
    "icon": "Activity"
  },
  {
    "slug": "normy-perevirky",
    "title": "Норми та перевірки",
    "note": "Нормоконтроль, класи наслідків, перевірка ДБН і нормативні обґрунтування.",
    "icon": "ShieldCheck"
  },
  {
    "slug": "normokontrol",
    "parentSlug": "normy-perevirky",
    "title": "Нормоконтроль",
    "note": "Перевірка проектних рішень на відповідність ДБН і чинним нормативам.",
    "icon": "ShieldCheck"
  },
  {
    "slug": "klas-naslidkiv",
    "parentSlug": "normy-perevirky",
    "title": "Клас наслідків",
    "note": "Визначення класу наслідків та відповідальності об’єкта будівництва.",
    "icon": "BadgeCheck"
  },
  {
    "slug": "perevirka-dbn",
    "parentSlug": "normy-perevirky",
    "title": "Перевірки ДБН",
    "note": "Інструменти для перевірки вимог ДБН у проектних рішеннях.",
    "icon": "FileCheck2"
  },
  {
    "slug": "normatyvni-obgruntuvannya",
    "parentSlug": "normy-perevirky",
    "title": "Нормативні обґрунтування",
    "note": "Підготовка нормативних пояснень і посилань для розрахунків та рішень.",
    "icon": "BookOpenCheck"
  },
  {
    "slug": "inzhenerni-merezhi",
    "title": "Інженерні мережі",
    "note": "Розрахунки електрики та інших інженерних систем у міру появи активних інструментів.",
    "icon": "Zap"
  },
  {
    "slug": "elektryka",
    "parentSlug": "inzhenerni-merezhi",
    "title": "Електрика",
    "note": "Електричні навантаження та живлення будівель.",
    "icon": "Zap"
  },
  {
    "slug": "cad-gis-dani",
    "title": "CAD / GIS / Дані",
    "note": "Конвертація, геоприв'язка і підготовка CAD/GIS-даних.",
    "icon": "Map"
  },
  {
    "slug": "dxf-geojson",
    "parentSlug": "cad-gis-dani",
    "title": "DXF / GeoJSON",
    "note": "Конвертація DXF у GeoJSON і підготовка геоданих.",
    "icon": "Map"
  },
  {
    "slug": "ai-instrumenty",
    "title": "AI-інструменти",
    "note": "AI-асистенти для ДБН, перевірки рішень і підготовки технічних пояснень.",
    "icon": "Bot"
  },
  {
    "slug": "asystenty-dbn",
    "parentSlug": "ai-instrumenty",
    "title": "Асистенти з ДБН",
    "note": "Профільні GPT-асистенти для роботи з будівельними нормами України.",
    "icon": "Bot"
  }
]
```

- [ ] **Step 2: Move thermal calculators to envelope structures**

Set these calculators to `"mainCategory": "ogorodzhuvalni-konstruktsiyi"`:

```text
cadee-heat-humid-state
cadee-vapor-permeability-resistance
cadee-dewpoint-temperature
cadee-delta-surface-temperature
cadee-heat-inertia
cadee-summer-thermo-resistance
cadee-air-permeability
```

- [ ] **Step 3: Move reinforced-concrete and reference calculators**

Set these calculators to `"mainCategory": "zalizobeton"`:

```text
minimum-reinforcement-area
foundation-bar-anchorage
rebar-area-bars
rebar-characteristics
concrete-characteristics
```

Keep `armcon`, `concrete-exposure-class`, and `concrete-cover-durability` in `zalizobeton`.

- [ ] **Step 4: Move structural mechanics calculators**

Set these calculators to `"mainCategory": "budivelna-mekhanika"`:

```text
cassoon-load-distribution
livebeamcalculator
```

- [ ] **Step 5: Remove deleted extra categories**

Update extras for the steel calculator by removing only the deleted reference category:

```json
"steel-structure-category-group": {
  "extraCategories": ["normy-perevirky"]
}
```

For `concrete-exposure-class` and `concrete-cover-durability`, remove `beton` but keep:

```json
"extraCategories": ["normy-perevirky", "normatyvni-obgruntuvannya"]
```

Keep foundation extras unchanged:

```json
"extraCategories": ["perevirka-dbn", "normatyvni-obgruntuvannya"]
```

- [ ] **Step 6: Validate JSON syntax**

Run:

```bash
node -e "JSON.parse(require('fs').readFileSync('data/content.json','utf8')); console.log('valid json')"
```

Expected: `valid json`.

---

### Task 3: Update Category Types and Icon Fallbacks

**Files:**
- Modify: `lib/calculators.ts`
- Modify: `lib/icons.ts`

**Interfaces:**
- Consumes: category slugs present in `data/content.json`.
- Produces: TypeScript types and icon fallback map matching the active category tree.

- [ ] **Step 1: Update `CategorySlug`**

In `lib/calculators.ts`, replace the `CategorySlug` union with:

```ts
export type CategorySlug =
  | "energoefektyvnist-teplotekhnika"
  | "ogorodzhuvalni-konstruktsiyi"
  | "pidlohy"
  | "teplovi-mistky-fem"
  | "konstruktsiyi"
  | "zalizobeton"
  | "fundamenty"
  | "stalevi-konstruktsiyi"
  | "budivelna-mekhanika"
  | "normy-perevirky"
  | "normokontrol"
  | "klas-naslidkiv"
  | "perevirka-dbn"
  | "normatyvni-obgruntuvannya"
  | "inzhenerni-merezhi"
  | "elektryka"
  | "cad-gis-dani"
  | "dxf-geojson"
  | "ai-instrumenty"
  | "asystenty-dbn";
```

- [ ] **Step 2: Update fallback category icons**

In `lib/icons.ts`, replace `FALLBACK_CATEGORY_ICONS` with:

```ts
const FALLBACK_CATEGORY_ICONS: Record<CategorySlug, LucideIcon> = {
  "energoefektyvnist-teplotekhnika": Thermometer,
  "ogorodzhuvalni-konstruktsiyi": BrickWall,
  pidlohy: Layers,
  "teplovi-mistky-fem": Network,
  konstruktsiyi: Triangle,
  zalizobeton: Building,
  fundamenty: Home,
  "stalevi-konstruktsiyi": Hammer,
  "budivelna-mekhanika": Activity,
  "normy-perevirky": ShieldCheck,
  normokontrol: ShieldCheck,
  "klas-naslidkiv": BadgeCheck,
  "perevirka-dbn": FileCheck2,
  "normatyvni-obgruntuvannya": BookOpenCheck,
  "inzhenerni-merezhi": Zap,
  elektryka: Zap,
  "cad-gis-dani": Map,
  "dxf-geojson": Map,
  "ai-instrumenty": Bot,
  "asystenty-dbn": Bot,
};
```

- [ ] **Step 3: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS. If it fails, every remaining deleted slug in the error output must be replaced or removed.

---

### Task 4: Run Tests, Build, and Commit

**Files:**
- Verify: `data/content.json`
- Verify: `lib/calculators.ts`
- Verify: `lib/icons.ts`
- Verify: `lib/calculators.test.ts`
- Verify: `components/calculator-shell.test.tsx`

**Interfaces:**
- Consumes: completed taxonomy implementation.
- Produces: verified branch state with passing tests and static build.

- [ ] **Step 1: Run targeted taxonomy tests**

Run:

```bash
npm test -- lib/calculators.test.ts
npm test -- components/calculator-shell.test.tsx
```

Expected: PASS.

- [ ] **Step 2: Run full typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: PASS and static export completes.

- [ ] **Step 4: Review diff**

Run:

```bash
git diff -- data/content.json lib/calculators.ts lib/icons.ts lib/calculators.test.ts components/calculator-shell.test.tsx
git status --short
```

Expected:

- only intended taxonomy files are changed for implementation;
- the pre-existing modified steel report contract remains unstaged unless it was already staged by the user;
- no deleted category slug remains in `data/content.json`, `lib/calculators.ts`, `lib/icons.ts`, or `lib/calculators.test.ts`.

- [ ] **Step 5: Commit implementation**

Run:

```bash
git add data/content.json lib/calculators.ts lib/icons.ts lib/calculators.test.ts components/calculator-shell.test.tsx docs/superpowers/plans/2026-06-18-calculator-category-taxonomy.md
git commit -m "Refine calculator category taxonomy"
```

Expected: commit succeeds.
