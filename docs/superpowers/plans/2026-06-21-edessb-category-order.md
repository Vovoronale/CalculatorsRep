# ЄДЕССБ Category And Catalog Order Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Перейменувати й очистити розділ «ЄДЕССБ та ПД», перенести до нього GeoJSON, змінити порядок верхніх категорій і відкривати сайт на «Конструкціях».

**Architecture:** Каталог лишається JSON-driven: порядок записів у `data/content.json` визначає порядок навігації та початкову категорію. Типи й fallback-іконки синхронізуються з новим набором slug, а Vitest фіксує ієрархію, відсутність дублів і стартовий стан UI.

**Tech Stack:** Next.js App Router, React, TypeScript, JSON content, Lucide React, Vitest, Testing Library.

---

## File Map

- Modify: `data/content.json` — порядок, назва, опис та ієрархія категорій; очищення `extraCategories`.
- Modify: `lib/calculators.ts` — актуальний union `CategorySlug`.
- Modify: `lib/icons.ts` — fallback-іконки лише для наявних категорій.
- Modify: `lib/calculators.test.ts` — контракт даних каталогу.
- Modify: `components/calculator-shell.test.tsx` — початково активні «Конструкції» та перемикання категорій.

### Task 1: Зафіксувати нову структуру тестами

**Files:**
- Modify: `lib/calculators.test.ts`
- Modify: `components/calculator-shell.test.tsx`

- [ ] **Step 1: Оновити очікуваний порядок та ієрархію категорій**

У тесті `builds the category navigation in the expected order` замінити очікуваний масив на:

```ts
expect(calculatorCategories.map((category) => category.slug)).toEqual([
  "konstruktsiyi",
  "zalizobeton",
  "fundamenty",
  "stalevi-konstruktsiyi",
  "budivelna-mekhanika",
  "mistobuduvannya-blahoustriy",
  "normy-perevirky",
  "normokontrol",
  "klas-naslidkiv",
  "dxf-geojson",
  "inzhenerni-merezhi",
  "elektryka",
  "energoefektyvnist-teplotekhnika",
  "ogorodzhuvalni-konstruktsiyi",
  "pidlohy",
  "teplovi-mistky-fem",
  "ai-instrumenty",
  "asystenty-dbn",
]);
```

Додати окремий тест структури розділу:

```ts
it("groups project documentation tools under EDESSB", () => {
  const category = calculatorCategories.find(
    (item) => item.slug === "normy-perevirky",
  );
  const geoJsonCategory = calculatorCategories.find(
    (item) => item.slug === "dxf-geojson",
  );
  const categorySlugs = calculatorCategories.map((item) => item.slug);

  expect(category).toMatchObject({
    title: "ЄДЕССБ та ПД",
    icon: "FileText",
  });
  expect(geoJsonCategory?.parentSlug).toBe("normy-perevirky");
  expect(categorySlugs).not.toContain("cad-gis-dani");
  expect(categorySlugs).not.toContain("perevirka-dbn");
  expect(categorySlugs).not.toContain("normatyvni-obgruntuvannya");
  expect(getCalculatorsForCategory("normy-perevirky").map((item) => item.slug)).toEqual([
    "normcontrol",
    "consequence-class",
    "iv-geojson",
  ]);
});
```

- [ ] **Step 2: Зафіксувати відсутність дублів**

У тесті `places each calculator in a primary category and limits extra category duplication` залишити перевірку валідності категорій, але замінити фінальне очікування на:

```ts
expect(
  calculators
    .filter((calculator) => calculator.extraCategories.length > 0)
    .map((calculator) => ({
      slug: calculator.slug,
      extraCategories: calculator.extraCategories,
    })),
).toEqual([]);
```

У тесті `keeps only populated category branches` додати до `removedSlugs`:

```ts
"cad-gis-dani",
"perevirka-dbn",
"normatyvni-obgruntuvannya",
```

Видалити виклик `getCalculatorsForCategory("perevirka-dbn")`, оскільки після звуження `CategorySlug` він навмисно перестане компілюватися.

У тесті сталевого калькулятора змінити очікування на:

```ts
expect(calculator).toMatchObject({
  mainCategory: "stalevi-konstruktsiyi",
  extraCategories: [],
  displayMode: "native",
  nativeCalculator: "steel-structure-category-group",
  standard: "ДБН В.2.6-198:2014",
});
```

- [ ] **Step 3: Зафіксувати стартову категорію в UI**

У тесті `renders category-only navigation and a standards table for the active category` замінити початкові очікування на:

```ts
expect(
  within(rail).getByRole("link", { name: "Конструкції 13" }),
).toHaveAttribute("aria-current", "page");
expect(
  within(rail).getByRole("link", { name: "Залізобетон 8" }),
).toBeInTheDocument();
expect(
  within(rail).getByRole("button", { name: "Згорнути Конструкції" }),
).toHaveAttribute("aria-expanded", "true");
expect(
  within(workspace).getByRole("heading", { name: "Конструкції" }),
).toBeInTheDocument();
expect(
  within(workspace).getByRole("table", {
    name: "Розрахунки категорії Конструкції",
  }),
).toBeInTheDocument();
```

У тесті `switches the homepage table when a category is selected` замінити взаємодію з уже відкритими «Конструкціями» на перемикання до теплотехніки:

```ts
await user.click(screen.getByRole("link", { name: "Теплотехніка 20" }));

expect(screen.getByRole("heading", { name: "Теплотехніка" })).toBeInTheDocument();
expect(
  screen.getByRole("table", {
    name: "Розрахунки категорії Теплотехніка",
  }),
).toBeInTheDocument();
```

- [ ] **Step 4: Запустити цільові тести й підтвердити RED**

Run:

```bash
npm test -- lib/calculators.test.ts components/calculator-shell.test.tsx
```

Expected: FAIL через старий порядок категорій, стару назву, старі `extraCategories` і початкову «Теплотехніку».

### Task 2: Оновити JSON-driven каталог і типи

**Files:**
- Modify: `data/content.json`
- Modify: `lib/calculators.ts`
- Modify: `lib/icons.ts`
- Test: `lib/calculators.test.ts`
- Test: `components/calculator-shell.test.tsx`

- [ ] **Step 1: Перебудувати масив категорій у `data/content.json`**

Розташувати записи верхнього рівня та їхніх дітей у такій послідовності:

```text
konstruktsiyi
  zalizobeton
  fundamenty
  stalevi-konstruktsiyi
  budivelna-mekhanika
mistobuduvannya-blahoustriy
normy-perevirky
  normokontrol
  klas-naslidkiv
  dxf-geojson
inzhenerni-merezhi
  elektryka
energoefektyvnist-teplotekhnika
  ogorodzhuvalni-konstruktsiyi
  pidlohy
  teplovi-mistky-fem
ai-instrumenty
  asystenty-dbn
```

Для `normy-perevirky` використати точний вміст:

```json
{
  "slug": "normy-perevirky",
  "title": "ЄДЕССБ та ПД",
  "note": "Нормоконтроль, визначення класу наслідків і підготовка даних для ЄДЕССБ та проєктної документації.",
  "icon": "FileText"
}
```

Для `dxf-geojson` змінити лише батька:

```json
"parentSlug": "normy-perevirky"
```

Повністю видалити категорії зі slug `perevirka-dbn`, `normatyvni-obgruntuvannya` та `cad-gis-dani`. «Теплотехніка» лишається без `parentSlug`, тобто окремою категорією верхнього рівня після блоку «Інженерні мережі».

- [ ] **Step 2: Очистити дублювання калькуляторів**

Для кожного з цих калькуляторів встановити точне значення:

```json
"extraCategories": []
```

Змінювані slug:

```text
soil-design-resistance
foundation-base-pressure
steel-structure-category-group
concrete-exposure-class
concrete-cover-durability
```

Не змінювати `mainCategory`: усі п'ять калькуляторів мають залишитися у своїх профільних категоріях.

- [ ] **Step 3: Звузити `CategorySlug`**

Замінити union у `lib/calculators.ts` на:

```ts
export type CategorySlug =
  | "konstruktsiyi"
  | "zalizobeton"
  | "fundamenty"
  | "stalevi-konstruktsiyi"
  | "budivelna-mekhanika"
  | "mistobuduvannya-blahoustriy"
  | "normy-perevirky"
  | "normokontrol"
  | "klas-naslidkiv"
  | "dxf-geojson"
  | "inzhenerni-merezhi"
  | "elektryka"
  | "energoefektyvnist-teplotekhnika"
  | "ogorodzhuvalni-konstruktsiyi"
  | "pidlohy"
  | "teplovi-mistky-fem"
  | "ai-instrumenty"
  | "asystenty-dbn";
```

- [ ] **Step 4: Синхронізувати fallback-іконки**

У `FALLBACK_CATEGORY_ICONS` видалити ключі `perevirka-dbn`, `normatyvni-obgruntuvannya` та `cad-gis-dani`, а для батьківського розділу встановити:

```ts
"normy-perevirky": FileText,
```

Інші відповідності залишити без змін. `FileText` уже імпортований і зареєстрований у `iconRegistry`.

- [ ] **Step 5: Запустити цільові тести й підтвердити GREEN**

Run:

```bash
npm test -- lib/calculators.test.ts components/calculator-shell.test.tsx
```

Expected: обидва test-файли PASS; початковий каталог показує «Конструкції», а дані не містять вилучених категорій або дублів.

- [ ] **Step 6: Закомітити функціональну зміну**

```bash
git add data/content.json lib/calculators.ts lib/icons.ts lib/calculators.test.ts components/calculator-shell.test.tsx
git commit -m "Reorganize calculator catalog categories"
```

Перед staging перевірити `git diff` і не включати сторонні зміни, які вже були у робочому дереві до виконання цього плану.

### Task 3: Повна перевірка

**Files:**
- Verify only

- [ ] **Step 1: Запустити весь набір тестів**

Run:

```bash
npm test
```

Expected: PASS без regressions.

- [ ] **Step 2: Запустити перевірку типів**

Run:

```bash
npm run typecheck
```

Expected: exit code 0 без TypeScript errors.

- [ ] **Step 3: Зібрати static Next.js сайт**

Run:

```bash
npm run build
```

Expected: exit code 0, Next.js build і static export завершуються успішно.

- [ ] **Step 4: Візуально перевірити головну сторінку**

Run:

```bash
npm run dev
```

На `http://localhost:3000` підтвердити:

```text
«Конструкції» стоять першими, розгорнуті та активні.
«ЄДЕССБ та ПД» містить «Нормоконтроль», «Клас наслідків» і «DXF / GeoJSON».
«Інженерні мережі» розташовані перед окремою категорією «Теплотехніка».
«CAD / GIS / Дані», «Перевірки ДБН» і «Нормативні обґрунтування» відсутні.
Профільні калькулятори не дублюються в «ЄДЕССБ та ПД».
```
