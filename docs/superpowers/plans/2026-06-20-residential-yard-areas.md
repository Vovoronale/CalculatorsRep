# Residential Yard Areas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and register a native calculator that determines every agreed residential-yard platform area, renders the canonical 12-step report, exports DOCX, and exposes local normative scans.

**Architecture:** Add a dedicated pure TypeScript core for normalized input, validation, values, governing-basis selection, and report construction. Add a thin React component using the existing input-schema, native layout, report, formula, unit, and DOCX infrastructure; keep all canonical wording and formulas in the approved report contract.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript 5.8, Vitest 3, Testing Library, lucide-react, PyMuPDF for normative scan preparation.

## Global Constraints

- Canonical report source: `docs/superpowers/specs/2026-06-19-residential-yard-areas-report-contract.md`, status `Agreed source of truth for report text and formulas`.
- Approved design: `docs/superpowers/specs/2026-06-20-residential-yard-areas-design.md`.
- Do not change a caption, item, formula, warning, error, label, description, default, display condition, or normative target without first updating and re-approving the report contract.
- The core must calculate both person-based and apartment-based values and adopt the larger result for every applicable platform type.
- The conservative `max` rule must be identified as a calculator rule, not as a DBN requirement.
- Keep all 12 report steps in stable order, including invalid states.
- Calculate totals from full-precision values; format areas with at most two decimals and no redundant zeroes.
- Keep pet-walking area outside `Sприбуд` and inside `Sтер`.
- Do not add a generic urban-planning rate engine or refactor unrelated calculator infrastructure.
- Do not add the calculator to a second category.
- Before completion run `npm run test`, `npm run typecheck`, and `npm run build`.

## File Map

- Create `lib/residential-yard-areas.ts`: domain types, defaults, constants, numeric calculation, validation, report builder, formatters.
- Create `lib/residential-yard-areas.test.ts`: numeric, validation, unit-normalized input, exact report-order and contract-string tests.
- Create `components/calculators/residential-yard-areas-calculator.tsx`: input schema, state normalization, result grid, native report, DOCX mapping, normative references.
- Create `components/calculators/residential-yard-areas-calculator.test.tsx`: schema descriptions, conditional behavior, units, result cards, normative links/scans, DOCX.
- Create `public/dbn/residential-yard-areas/*.png`: current normative scan assets.
- Modify `app/globals.css`: calculator-specific result-grid and scan styling only.
- Modify `data/content.json`: new root category and native calculator record.
- Modify `lib/calculators.ts`: new category slug and native calculator discriminator.
- Modify `lib/icons.ts`: register `MapPinned` and `LandPlot` and add the category fallback.
- Modify `components/calculator-shell.tsx`: import and render the native calculator.
- Modify or create focused tests covering catalog registration, icon lookup, and shell rendering where existing suites require it.

---

### Task 1: Pure calculation values and governing bases

**Files:**
- Create: `lib/residential-yard-areas.ts`
- Create: `lib/residential-yard-areas.test.ts`

**Interfaces:**
- Produces `ResidentialYardAreasInput`, `ResidentialYardAreasValues`, `ResidentialYardGoverningBasis`, `DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT`, `calculateResidentialYardAreas`, and `formatResidentialYardAreaNumber`.
- Later tasks call `getResidentialYardAreasReport`, added in Task 2, using the same input and values types.

- [ ] **Step 1: Write failing default-case and governing-basis tests**

Add tests with these exact expectations:

```ts
import {
  DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT,
  calculateResidentialYardAreas,
} from "./residential-yard-areas";

it("calculates the approved default regression case", () => {
  const values = calculateResidentialYardAreas(DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT);

  expect(values).toMatchObject({
    apartmentCount: 40,
    guestParkingSpaces: 6,
    children: { adoptedM2: 70, basis: "equal" },
    adultRecreation: { adoptedM2: 20, basis: "equal" },
    physicalCulture: { adoptedM2: 200, basis: "equal" },
    guestParkingAreaM2: 150,
    bicycleParking: { adoptedM2: 10, basis: "equal" },
    wasteCollection: { adoptedM2: 7.2, basis: "apartments" },
    householdPurpose: { adoptedM2: 0, basis: "disabled" },
    petWalking: { adoptedM2: 30, basis: "residents" },
    insideBoundaryAreaM2: 457.2,
    territorialNeedAreaM2: 487.2,
  });
});

it.each([
  [100, 40, "equal"],
  [120, 40, "residents"],
  [80, 40, "apartments"],
] as const)("selects the governing basis", (residents, apartments, basis) => {
  const values = calculateResidentialYardAreas({
    ...DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT,
    residents,
    oneRoomApartments: 0,
    twoOrMoreRoomApartments: apartments,
  });
  expect(values.children.basis).toBe(basis);
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm run test -- lib/residential-yard-areas.test.ts
```

Expected: FAIL because `./residential-yard-areas` does not exist.

- [ ] **Step 3: Implement domain types, defaults, constants, and numeric calculation**

Create the core with these public shapes:

```ts
export type PhysicalCultureAreaMode = "full" | "reduced";
export type WasteCollectionMethod = "above_ground" | "underground" | "vacuum";
export type ResidentialYardAreaUnit = "m2" | "a" | "ha";
export type ResidentialYardGoverningBasis =
  | "residents"
  | "apartments"
  | "equal"
  | "manual"
  | "disabled";

export type ResidentialYardAreasInput = {
  residents: number;
  oneRoomApartments: number;
  twoOrMoreRoomApartments: number;
  physicalCultureMode: PhysicalCultureAreaMode;
  hasSeparateLandscapedPhysicalCultureZone: boolean;
  hasRequiredLimitedUseGreenery: boolean;
  wasteCollectionMethod: WasteCollectionMethod;
  manualVacuumAreaM2: number | null;
  manualVacuumAreaUnit: ResidentialYardAreaUnit;
  hasHouseholdPurposeAreas: boolean;
  householdAreaPerPersonM2: number;
  householdAreaPerApartmentM2: number;
  householdAreaPerPersonUnit: ResidentialYardAreaUnit;
  householdAreaPerApartmentUnit: ResidentialYardAreaUnit;
};

export const DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT: ResidentialYardAreasInput = {
  residents: 100,
  oneRoomApartments: 0,
  twoOrMoreRoomApartments: 40,
  physicalCultureMode: "full",
  hasSeparateLandscapedPhysicalCultureZone: false,
  hasRequiredLimitedUseGreenery: false,
  wasteCollectionMethod: "above_ground",
  manualVacuumAreaM2: null,
  manualVacuumAreaUnit: "m2",
  hasHouseholdPurposeAreas: false,
  householdAreaPerPersonM2: 0.1,
  householdAreaPerApartmentM2: 0.25,
  householdAreaPerPersonUnit: "m2",
  householdAreaPerApartmentUnit: "m2",
};
```

Represent every dual-basis result with both raw areas, adopted area, and basis:

```ts
export type ResidentialYardAreaResult = {
  byResidentsM2: number | null;
  byApartmentsM2: number | null;
  adoptedM2: number;
  basis: ResidentialYardGoverningBasis;
};

export type ResidentialYardAreasValues = {
  apartmentCount: number;
  guestParkingSpaces: number;
  children: ResidentialYardAreaResult;
  adultRecreation: ResidentialYardAreaResult;
  physicalCulture: ResidentialYardAreaResult;
  guestParkingAreaM2: number;
  bicycleParking: ResidentialYardAreaResult;
  wasteCollection: ResidentialYardAreaResult;
  petWalking: ResidentialYardAreaResult;
  householdPurpose: ResidentialYardAreaResult;
  insideBoundaryAreaM2: number;
  territorialNeedAreaM2: number;
};
```

Implement a private helper that does not round:

```ts
function selectDualBasisArea(
  byResidentsM2: number,
  byApartmentsM2: number,
): ResidentialYardAreaResult {
  const basis =
    byResidentsM2 > byApartmentsM2
      ? "residents"
      : byApartmentsM2 > byResidentsM2
        ? "apartments"
        : "equal";
  return {
    byResidentsM2,
    byApartmentsM2,
    adoptedM2: Math.max(byResidentsM2, byApartmentsM2),
    basis,
  };
}
```

Use the exact rates and formulas from the contract, calculate guest spaces with `Math.ceil`, add only adopted in-boundary areas to `insideBoundaryAreaM2`, and add `petWalkingAreaM2` only to `territorialNeedAreaM2`.

- [ ] **Step 4: Add focused numeric branch tests**

Cover exact full/reduced sport rates, above-ground/underground/manual waste, enabled/disabled household-purpose areas, one-room parking coefficient, mixed apartments, and ceiling:

```ts
expect(
  calculateResidentialYardAreas({
    ...DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT,
    oneRoomApartments: 10,
    twoOrMoreRoomApartments: 0,
  }).guestParkingSpaces,
).toBe(1);

expect(
  calculateResidentialYardAreas({
    ...DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT,
    wasteCollectionMethod: "vacuum",
    manualVacuumAreaM2: 8,
  }).wasteCollection.adoptedM2,
).toBe(8);
```

- [ ] **Step 5: Run the focused tests and verify GREEN**

Run:

```bash
npm run test -- lib/residential-yard-areas.test.ts
```

Expected: PASS for all numeric tests.

- [ ] **Step 6: Commit Task 1**

```bash
git add lib/residential-yard-areas.ts lib/residential-yard-areas.test.ts
git commit -m "Add residential yard area calculations"
```

### Task 2: Validation and canonical 12-step report

**Files:**
- Modify: `lib/residential-yard-areas.ts`
- Modify: `lib/residential-yard-areas.test.ts`

**Interfaces:**
- Consumes `ResidentialYardAreasInput` and numeric calculation from Task 1.
- Produces `ResidentialYardAreasReportStep`, `ResidentialYardAreasReport`, and `getResidentialYardAreasReport(input)`.

- [ ] **Step 1: Write failing validation and stable-report tests**

Define the step-key contract in the test:

```ts
const EXPECTED_STEP_KEYS = [
  "inputs",
  "children",
  "adult-recreation",
  "physical-culture",
  "guest-parking",
  "bicycle-parking",
  "waste-collection",
  "pet-walking",
  "household-purpose",
  "inside-boundary-total",
  "territorial-need",
  "conclusion",
] as const;

it("keeps the canonical 12-step order", () => {
  const report = getResidentialYardAreasReport(DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT);
  expect(report.steps.map((step) => step.key)).toEqual(EXPECTED_STEP_KEYS);
});

it("returns stable finite steps for invalid input", () => {
  const report = getResidentialYardAreasReport({
    ...DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT,
    residents: 0,
  });
  expect(report.valid).toBe(false);
  expect(report.errors).toContain("Кількість мешканців має бути цілим числом, більшим за 0.");
  expect(report.steps.map((step) => step.key)).toEqual(EXPECTED_STEP_KEYS);
  expect(JSON.stringify(report.steps)).not.toMatch(/NaN|Infinity/);
});
```

Add separate failing tests for each exact contract error and conditional visibility rule.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npm run test -- lib/residential-yard-areas.test.ts
```

Expected: FAIL because `getResidentialYardAreasReport` and report types are absent.

- [ ] **Step 3: Implement report types, validation, formatting, and builders**

Add these public types:

```ts
export type ResidentialYardAreasReportStep = {
  key:
    | "inputs"
    | "children"
    | "adult-recreation"
    | "physical-culture"
    | "guest-parking"
    | "bicycle-parking"
    | "waste-collection"
    | "pet-walking"
    | "household-purpose"
    | "inside-boundary-total"
    | "territorial-need"
    | "conclusion";
  caption: string;
  items?: string[];
  notes?: string[];
  formula?: string;
  formulas?: string[];
  resultItems?: string[];
};

export type ResidentialYardAreasReport = {
  input: ResidentialYardAreasInput;
  valid: boolean;
  errors: string[];
  warnings: string[];
  values: ResidentialYardAreasValues | null;
  steps: ResidentialYardAreasReportStep[];
};
```

Implement `formatResidentialYardAreaNumber(value)` with at most two decimals and no trailing zeroes. Build every caption, item, formula, result item, note, warning, and error verbatim from the approved contract. For invalid inputs, sanitize unsafe arithmetic inputs, keep all step keys, and omit only numeric substitutions that cannot be calculated safely; never stringify non-finite values.

- [ ] **Step 4: Add exact branch and contract-string tests**

Assert:

- default formulas and default expected values;
- full and reduced physical-culture formulas;
- both reduced-mode errors independently;
- above-ground, underground, and manual vacuum report lines;
- optional unit-conversion display strings supplied to the report input;
- household-purpose disabled and enabled formulas;
- pet exclusion/inclusion notes;
- both global warnings;
- exact captions and the exact 12-step order.

Use the contract file as the literal source while writing expected strings; do not paraphrase it in the test.

- [ ] **Step 5: Run core tests and verify GREEN**

```bash
npm run test -- lib/residential-yard-areas.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 2**

```bash
git add lib/residential-yard-areas.ts lib/residential-yard-areas.test.ts
git commit -m "Add residential yard calculation report"
```

### Task 3: Input schema, units, result grid, and DOCX UI

**Files:**
- Create: `components/calculators/residential-yard-areas-calculator.tsx`
- Create: `components/calculators/residential-yard-areas-calculator.test.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes `DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT`, `getResidentialYardAreasReport`, report/value types, `InputSchemaForm`, `NativeCalculatorLayout`, `NativeReport`, `buildNativeDocxReport`, and `ReportDocxButton`.
- Produces `RESIDENTIAL_YARD_AREAS_INPUT_SCHEMA`, `ResidentialYardAreasCalculator`, and `buildResidentialYardAreasDocxReport`.

- [ ] **Step 1: Write failing schema and default-render tests**

Test every field ID, default, description, condition, and local unit option:

```ts
expect(findSchemaField("residents")).toMatchObject({
  defaultValue: "100",
  min: 1,
  step: "1",
});
expect(findSchemaField("manualVacuumAreaM2")).toMatchObject({
  defaultDisplayUnit: "m2",
  showWhen: { field: "wasteCollectionMethod", equals: "vacuum" },
});
expect(findSchemaField("manualVacuumAreaM2")).toHaveProperty("displayUnits", [
  { value: "m2", label: "м²", factorToBase: 1 },
  { value: "a", label: "ар", factorToBase: 100 },
  { value: "ha", label: "га", factorToBase: 10000 },
]);
```

Render the component and initially expect all platform result labels, `Sприбуд = 457,2 м²`, `Sтер = 487,2 м²`, the report heading, and the DOCX button.

- [ ] **Step 2: Run the component test and verify RED**

```bash
npm run test -- components/calculators/residential-yard-areas-calculator.test.tsx
```

Expected: FAIL because the component does not exist.

- [ ] **Step 3: Implement the canonical input schema and state conversion**

Create four schema groups and the exact field IDs:

```ts
"residents"
"oneRoomApartments"
"twoOrMoreRoomApartments"
"physicalCultureMode"
"hasSeparateLandscapedPhysicalCultureZone"
"hasRequiredLimitedUseGreenery"
"wasteCollectionMethod"
"manualVacuumAreaM2"
"hasHouseholdPurposeAreas"
"householdAreaPerPersonM2"
"householdAreaPerApartmentM2"
```

Use field-local `displayUnits` with factors relative to square metres, not the global structural area registry. Use canonical descriptions and `showWhen` rules from the contract. Maintain controlled display-unit state so the report can show the entered unit and normalized value.

When a controller changes, reset hidden values:

```ts
physicalCultureMode !== "reduced"
  -> both physical-culture confirmations = false
wasteCollectionMethod !== "vacuum"
  -> manualVacuumAreaM2 = null/default empty value
hasHouseholdPurposeAreas === false
  -> household rates = 0.1 and 0.25
```

- [ ] **Step 4: Implement the full upper result grid and native report**

Render cards for:

```text
Sдіт, Sвідп, Sфіз, Nгост + Sгост, Sвел, Sвідх, Sгосп, Sтвар, Sприбуд, Sтер
```

Each applicable card shows the governing-basis label. Mark pet walking as outside the residential-yard boundary. Pass errors and warnings to `NativeCalculatorLayout`, render `NativeReport` with all steps, and map the same report into `buildNativeDocxReport`.

- [ ] **Step 5: Add focused UI styles**

Add calculator-scoped classes:

```css
.residential-yard-results {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 10px;
}

.residential-yard-result {
  display: grid;
  gap: 4px;
  min-width: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
  padding: 10px;
}
```

Add modifier styles for totals and the outside-boundary pet card. Do not alter shared native calculator behavior unless a failing cross-calculator test proves it necessary.

- [ ] **Step 6: Add interaction, unit, and DOCX tests**

Use `userEvent` to cover:

- reduced-mode confirmations appearing and resetting;
- vacuum manual area appearing, accepting `0,08 ар`, and reporting `8 м²`;
- household fields appearing and resetting;
- exact error messages;
- every result card and governing-basis label;
- DOCX step keys matching the UI report keys.

- [ ] **Step 7: Run focused tests and verify GREEN**

```bash
npm run test -- lib/residential-yard-areas.test.ts components/calculators/residential-yard-areas-calculator.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit Task 3**

```bash
git add components/calculators/residential-yard-areas-calculator.tsx components/calculators/residential-yard-areas-calculator.test.tsx app/globals.css
git commit -m "Add residential yard calculator interface"
```

### Task 4: Normative scan assets and state-preserving links

**Files:**
- Create: `public/dbn/residential-yard-areas/dbn-b-2-2-12-table-6-4.png`
- Create: `public/dbn/residential-yard-areas/dbn-b-2-2-12-table-6-4-notes.png`
- Create: `public/dbn/residential-yard-areas/dbn-b-2-2-12-table-6-5.png`
- Create: `public/dbn/residential-yard-areas/dbn-b-2-2-12-table-10-5.png`
- Create: `public/dbn/residential-yard-areas/dbn-v-2-3-15-4-6-table-1.png`
- Modify: `components/calculators/residential-yard-areas-calculator.tsx`
- Modify: `components/calculators/residential-yard-areas-calculator.test.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes the five anchor IDs and source evidence from the report contract.
- Produces five local scan blocks and `renderResidentialYardNormativeText(text)` for linked captions/descriptions.

- [ ] **Step 1: Write failing scan and anchor tests**

Assert the five exact targets and asset URLs:

```ts
expect(screen.getByAltText("Скан п. 6.1.21 і таблиці 6.4 ДБН Б.2.2-12:2019"))
  .toHaveAttribute("src", "/dbn/residential-yard-areas/dbn-b-2-2-12-table-6-4.png");
expect(document.getElementById("residential-yard-norm-parking-4-6-table-1"))
  .toBeInstanceOf(HTMLDetailsElement);
```

Click one description/report citation and assert the matching details element has `open === true` while the current form value remains unchanged.

- [ ] **Step 2: Run the component test and verify RED**

```bash
npm run test -- components/calculators/residential-yard-areas-calculator.test.tsx
```

Expected: FAIL because assets and normative blocks are absent.

- [ ] **Step 3: Render and visually inspect the five current normative fragments**

Use the provided DBN B.2.2-12:2019 PDF and the official current DBN V.2.3-15:2007 PDF. Render at 2x or higher with PyMuPDF, crop only the cited clause/table/notes, and save the five stable PNG paths above. Inspect every PNG for readable text, complete table borders, and no clipped notes before proceeding.

- [ ] **Step 4: Implement normative blocks and linked text renderer**

Render five `<details>` elements with the canonical IDs, `Скан фрагмента ДБН` summary, local image, descriptive alt text, lazy loading, and async decoding. Reuse the established click behavior that opens a target details element after hash navigation without changing React input state.

- [ ] **Step 5: Add calculator-scoped scan styles**

Match the existing soil/steel/concrete scan pattern: scroll margin, bordered details, plus/minus summary marker, horizontally scrollable figure, and a legible minimum image width on narrow screens.

- [ ] **Step 6: Run tests and inspect scan assets**

```bash
npm run test -- components/calculators/residential-yard-areas-calculator.test.tsx
```

Expected: PASS. Open every generated PNG locally and confirm the five targets show the complete cited content.

- [ ] **Step 7: Commit Task 4**

```bash
git add public/dbn/residential-yard-areas components/calculators/residential-yard-areas-calculator.tsx components/calculators/residential-yard-areas-calculator.test.tsx app/globals.css
git commit -m "Add residential yard normative references"
```

### Task 5: Catalog, icons, and calculator shell registration

**Files:**
- Modify: `data/content.json`
- Modify: `lib/calculators.ts`
- Modify: `lib/icons.ts`
- Modify: `components/calculator-shell.tsx`
- Modify: `lib/calculators.test.ts`
- Modify: `components/calculator-shell.test.tsx`

**Interfaces:**
- Consumes `ResidentialYardAreasCalculator` from Task 3.
- Produces category slug `mistobuduvannya-blahoustriy` and native calculator discriminator `residential-yard-areas`.

- [ ] **Step 1: Write failing registration tests**

Add expectations:

```ts
expect(getCategoryBySlug("mistobuduvannya-blahoustriy")).toMatchObject({
  title: "Містобудування та благоустрій",
  icon: "MapPinned",
});

expect(calculators.find((item) => item.slug === "residential-yard-areas"))
  .toMatchObject({
    mainCategory: "mistobuduvannya-blahoustriy",
    extraCategories: [],
    displayMode: "native",
    nativeCalculator: "residential-yard-areas",
    icon: "LandPlot",
  });
```

Add a shell smoke assertion for the calculator aria label and a representative result card.

- [ ] **Step 2: Run registration tests and verify RED**

```bash
npm run test -- lib/calculators.test.ts components/calculator-shell.test.tsx
```

Expected: FAIL because the category, calculator, icons, and shell case are absent.

- [ ] **Step 3: Register content and TypeScript discriminators**

Add `mistobuduvannya-blahoustriy` to `CategorySlug` and `residential-yard-areas` to the native calculator union. Add these exact records to the respective arrays in `data/content.json`:

```json
{
  "slug": "mistobuduvannya-blahoustriy",
  "title": "Містобудування та благоустрій",
  "note": "Розрахунки планування територій, прибудинкових майданчиків, озеленення, паркування та елементів благоустрою.",
  "icon": "MapPinned"
}
```

```json
{
  "slug": "residential-yard-areas",
  "title": "Площі прибудинкових майданчиків",
  "shortDescription": "Розрахунок нормативних площ майданчиків багатоквартирного житлового будинку.",
  "description": "Розрахунок площ прибудинкових майданчиків одночасно за кількістю мешканців і складом квартир з урахуванням фізкультурних зон, збирання відходів, гостьового паркування та майданчика для вигулу тварин.",
  "mainCategory": "mistobuduvannya-blahoustriy",
  "extraCategories": [],
  "displayMode": "native",
  "nativeCalculator": "residential-yard-areas",
  "accessLabel": "Нативний розрахунок",
  "openUrl": "/calculator/residential-yard-areas",
  "order": 32,
  "seoTitle": "Площі прибудинкових майданчиків — ДБН Б.2.2-12:2019",
  "seoDescription": "Розрахунок площ дитячих, рекреаційних, фізкультурних, велосипедних, господарських та інших прибудинкових майданчиків.",
  "useCases": [
    "Прибудинкові території",
    "Площі майданчиків",
    "Гостьове паркування"
  ],
  "tags": [
    "прибудинкова територія",
    "майданчики",
    "благоустрій",
    "ДБН Б.2.2-12"
  ],
  "tools": [
    "Покроковий звіт",
    "Експорт DOCX"
  ],
  "icon": "LandPlot",
  "standard": "ДБН Б.2.2-12:2019; ДБН В.2.3-15:2007",
  "editorialLabel": "Новий"
}
```

- [ ] **Step 4: Register icons and shell component**

Import `MapPinned` and `LandPlot` from `lucide-react`, add both to `iconRegistry`, and add the new category fallback. Import `ResidentialYardAreasCalculator` in the shell and add:

```tsx
case "residential-yard-areas":
  return <ResidentialYardAreasCalculator />;
```

- [ ] **Step 5: Run registration tests and verify GREEN**

```bash
npm run test -- lib/calculators.test.ts components/calculator-shell.test.tsx
```

Expected: PASS.

- [ ] **Step 6: Commit Task 5**

```bash
git add data/content.json lib/calculators.ts lib/icons.ts components/calculator-shell.tsx lib/calculators.test.ts components/calculator-shell.test.tsx
git commit -m "Register residential yard calculator"
```

### Task 6: Full verification and visual QA

**Files:**
- Modify only files required by failures found in this task.

**Interfaces:**
- Consumes the complete calculator from Tasks 1-5.
- Produces a passing repository build and visually verified calculator page.

- [ ] **Step 1: Run the complete test suite**

```bash
npm run test
```

Expected: all tests pass.

- [ ] **Step 2: Run static type checking**

```bash
npm run typecheck
```

Expected: zero TypeScript errors.

- [ ] **Step 3: Run the production static build**

```bash
npm run build
```

Expected: successful Next.js build and static export including `/calculator/residential-yard-areas`.

- [ ] **Step 4: Run local visual verification**

Start:

```bash
npm run dev
```

Verify in the browser at `http://localhost:3000/calculator/residential-yard-areas`:

- desktop and narrow responsive layout;
- all ten upper result cards;
- default expected values;
- full/reduced physical-culture interaction and errors;
- all waste methods and unit conversion;
- optional household-purpose areas;
- all 12 report steps and formula rendering;
- DOCX button availability;
- five normative scans and state-preserving anchor navigation;
- no console errors or hydration warnings.

- [ ] **Step 5: Run final focused regression after any QA fix**

```bash
npm run test -- lib/residential-yard-areas.test.ts components/calculators/residential-yard-areas-calculator.test.tsx lib/calculators.test.ts components/calculator-shell.test.tsx
npm run typecheck
npm run build
```

Expected: all commands pass.

- [ ] **Step 6: Confirm the worktree is clean**

Run:

```bash
git status --short
```

Expected: no output. If QA exposed a defect, return to the task that owns the affected file, repeat that task's RED/GREEN cycle, and use that task's exact staging and commit command before rerunning Task 6.
