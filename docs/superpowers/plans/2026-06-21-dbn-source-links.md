# DBN Source Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one verified external DBN source action to every normative-reference card that currently contains local DBN scan fragments.

**Architecture:** A typed registry in `lib/dbn-source-links.ts` owns the five document URLs and provider-specific labels. A shared `DbnSourceLink` component owns the external-link markup and styling; the four calculator components only select a typed document key. The approved design is [`docs/superpowers/specs/2026-06-20-dbn-e-construction-links-design.md`](../specs/2026-06-20-dbn-e-construction-links-design.md).

**Tech Stack:** Next.js App Router, React, TypeScript, lucide-react, Vitest, Testing Library, CSS.

## Global Constraints

- Render exactly one source action per normative-reference card: 6 steel, 6 soil-resistance, 7 concrete-cover, and 4 residential-yard actions.
- Render actions after each card heading and explanatory paragraph, when present, and before the first scan disclosure.
- Open every source with `target="_blank"` and `rel="noopener noreferrer"`.
- Use `Відкрити ДБН на e-construction` for e-construction entries and `Відкрити ДБН на dbn.co.ua` for ДБН В.2.1-10-2009.
- Keep calculation logic, reports, DOCX output, internal citation anchors, scan paths, and disclosure behavior unchanged.
- Do not add search-result URLs, deep links to normative clauses, or links outside the four calculators in scope.
- Use these verified targets exactly:
  - ДБН В.2.6-198:2014: `https://e-construction.gov.ua/laws_detail/3870232666225772499?doc_type=2`
  - ДБН В.2.1-10-2009: `https://dbn.co.ua/dbn/DBN_V.2.1-10-2009.pdf`
  - ДБН В.2.6-98:2009: `https://e-construction.gov.ua/laws_detail/3873881846584444859?doc_type=2`
  - ДБН Б.2.2-12:2019: `https://e-construction.gov.ua/laws_detail/3874277768581612585?doc_type=2`
  - ДБН В.2.3-15:2007: `https://e-construction.gov.ua/laws_detail/3875034753086261244?doc_type=2`

---

### Task 1: Typed source registry and shared action

**Files:**
- Create: `lib/dbn-source-links.ts`
- Create: `components/calculators/dbn-source-link.tsx`
- Create: `components/calculators/dbn-source-link.test.tsx`
- Modify: `app/globals.css:3224`

**Interfaces:**
- Produces: `DBN_SOURCE_LINKS`, a readonly registry of `{ href: string; label: string }` entries.
- Produces: `DbnSourceKey = keyof typeof DBN_SOURCE_LINKS`.
- Produces: `DbnSourceLink({ document }: { document: DbnSourceKey }): JSX.Element`.

- [ ] **Step 1: Write the failing shared-component test**

Create `components/calculators/dbn-source-link.test.tsx`:

```tsx
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { DbnSourceLink } from "./dbn-source-link";

afterEach(cleanup);

const cases = [
  [
    "dbn-v-2-6-198-2014",
    "https://e-construction.gov.ua/laws_detail/3870232666225772499?doc_type=2",
    "Відкрити ДБН на e-construction",
  ],
  [
    "dbn-v-2-1-10-2009",
    "https://dbn.co.ua/dbn/DBN_V.2.1-10-2009.pdf",
    "Відкрити ДБН на dbn.co.ua",
  ],
  [
    "dbn-v-2-6-98-2009",
    "https://e-construction.gov.ua/laws_detail/3873881846584444859?doc_type=2",
    "Відкрити ДБН на e-construction",
  ],
  [
    "dbn-b-2-2-12-2019",
    "https://e-construction.gov.ua/laws_detail/3874277768581612585?doc_type=2",
    "Відкрити ДБН на e-construction",
  ],
  [
    "dbn-v-2-3-15-2007",
    "https://e-construction.gov.ua/laws_detail/3875034753086261244?doc_type=2",
    "Відкрити ДБН на e-construction",
  ],
] as const;

describe("DbnSourceLink", () => {
  it.each(cases)("renders the verified %s source", (document, href, label) => {
    render(<DbnSourceLink document={document} />);

    const link = screen.getByRole("link", { name: label });
    expect(link).toHaveAttribute("href", href);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveClass("dbn-source-link");
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- components/calculators/dbn-source-link.test.tsx`

Expected: FAIL because `./dbn-source-link` does not exist.

- [ ] **Step 3: Add the typed registry**

Create `lib/dbn-source-links.ts`:

```ts
export const DBN_SOURCE_LINKS = {
  "dbn-v-2-6-198-2014": {
    href: "https://e-construction.gov.ua/laws_detail/3870232666225772499?doc_type=2",
    label: "Відкрити ДБН на e-construction",
  },
  "dbn-v-2-1-10-2009": {
    href: "https://dbn.co.ua/dbn/DBN_V.2.1-10-2009.pdf",
    label: "Відкрити ДБН на dbn.co.ua",
  },
  "dbn-v-2-6-98-2009": {
    href: "https://e-construction.gov.ua/laws_detail/3873881846584444859?doc_type=2",
    label: "Відкрити ДБН на e-construction",
  },
  "dbn-b-2-2-12-2019": {
    href: "https://e-construction.gov.ua/laws_detail/3874277768581612585?doc_type=2",
    label: "Відкрити ДБН на e-construction",
  },
  "dbn-v-2-3-15-2007": {
    href: "https://e-construction.gov.ua/laws_detail/3875034753086261244?doc_type=2",
    label: "Відкрити ДБН на e-construction",
  },
} as const;

export type DbnSourceKey = keyof typeof DBN_SOURCE_LINKS;
```

- [ ] **Step 4: Add the shared component**

Create `components/calculators/dbn-source-link.tsx`:

```tsx
import { ExternalLink } from "lucide-react";

import {
  DBN_SOURCE_LINKS,
  type DbnSourceKey,
} from "@/lib/dbn-source-links";

export function DbnSourceLink({ document }: { document: DbnSourceKey }) {
  const source = DBN_SOURCE_LINKS[document];

  return (
    <a
      className="dbn-source-link"
      href={source.href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span>{source.label}</span>
      <ExternalLink size={14} aria-hidden />
    </a>
  );
}
```

- [ ] **Step 5: Add compact responsive styling**

Add near the shared `.native-norm` styles in `app/globals.css`:

```css
.dbn-source-link {
  display: inline-flex;
  align-items: center;
  justify-self: start;
  gap: 6px;
  width: fit-content;
  max-width: 100%;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 7px 10px;
  background: var(--surface);
  color: var(--accent);
  font-size: 12px;
  font-weight: 800;
  line-height: 1.35;
  text-decoration: none;
}

.dbn-source-link:hover {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.dbn-source-link:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.dbn-source-link span {
  overflow-wrap: anywhere;
}

.dbn-source-link svg {
  flex: 0 0 auto;
}
```

- [ ] **Step 6: Run the shared test and verify GREEN**

Run: `npm test -- components/calculators/dbn-source-link.test.tsx`

Expected: PASS, 5 cases.

- [ ] **Step 7: Commit the shared unit**

```bash
git add lib/dbn-source-links.ts components/calculators/dbn-source-link.tsx components/calculators/dbn-source-link.test.tsx app/globals.css
git commit -m "Add shared DBN source links"
```

---

### Task 2: Steel normative cards

**Files:**
- Modify: `components/calculators/steel-structure-category-group-calculator.test.tsx:95`
- Modify: `components/calculators/steel-structure-category-group-calculator.tsx:367-401`

**Interfaces:**
- Consumes: `DbnSourceLink({ document: "dbn-v-2-6-198-2014" })` from Task 1.
- Produces: six steel-card actions using the same verified e-construction URL.

- [ ] **Step 1: Write the failing steel integration test**

Add to the calculator render test area:

```tsx
it("renders one e-construction action per steel normative card", () => {
  render(<SteelStructureCategoryGroupCalculator />);

  const links = screen.getAllByRole("link", {
    name: "Відкрити ДБН на e-construction",
  });
  expect(links).toHaveLength(6);
  for (const link of links) {
    expect(link).toHaveAttribute(
      "href",
      "https://e-construction.gov.ua/laws_detail/3870232666225772499?doc_type=2",
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- components/calculators/steel-structure-category-group-calculator.test.tsx`

Expected: FAIL because no matching source links are rendered.

- [ ] **Step 3: Add one action to each steel card**

Import the component:

```tsx
import { DbnSourceLink } from "./dbn-source-link";
```

In each of the six `NormativeReferences` articles, add this exact element after its `<p>` and before its first `<NormScan>`:

```tsx
<DbnSourceLink document="dbn-v-2-6-198-2014" />
```

The six insertion contexts are the cards headed by table А.1, table А.2, table 5.1, tables 7.1–7.2, table Г.1, and table Г.5. Do not add the element between multiple scans in the same article.

- [ ] **Step 4: Run the steel test and verify GREEN**

Run: `npm test -- components/calculators/steel-structure-category-group-calculator.test.tsx`

Expected: PASS, including the existing 14-scan assertion.

- [ ] **Step 5: Commit the steel integration**

```bash
git add components/calculators/steel-structure-category-group-calculator.tsx components/calculators/steel-structure-category-group-calculator.test.tsx
git commit -m "Link steel DBN reference cards"
```

---

### Task 3: Soil-resistance normative cards

**Files:**
- Modify: `components/calculators/soil-design-resistance-calculator.test.ts:1`
- Modify: `components/calculators/soil-design-resistance-calculator.tsx:977-1031`

**Interfaces:**
- Consumes: `DbnSourceLink({ document: "dbn-v-2-1-10-2009" })` from Task 1.
- Produces: six soil-card actions using the agreed dbn.co.ua PDF and provider-specific label.

- [ ] **Step 1: Write the failing soil integration test**

Add to the calculator component describe block:

```ts
it("renders one dbn.co.ua action per soil normative card", () => {
  render(createElement(SoilDesignResistanceCalculator));

  const links = screen.getAllByRole("link", {
    name: "Відкрити ДБН на dbn.co.ua",
  });
  expect(links).toHaveLength(6);
  for (const link of links) {
    expect(link).toHaveAttribute(
      "href",
      "https://dbn.co.ua/dbn/DBN_V.2.1-10-2009.pdf",
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- components/calculators/soil-design-resistance-calculator.test.ts`

Expected: FAIL because no matching dbn.co.ua links are rendered.

- [ ] **Step 3: Add one action to each soil card**

Import the component:

```tsx
import { DbnSourceLink } from "./dbn-source-link";
```

In each of the six `soil-resistance-norm` articles, add this exact element after its `<p>` and before its `<NormScan>`:

```tsx
<DbnSourceLink document="dbn-v-2-1-10-2009" />
```

Apply it to the cards with ids `soil-norm-e4`, `soil-norm-e1`, `soil-norm-e2`, `soil-norm-table-e7`, `soil-norm-table-e7-note-1`, and `soil-norm-table-e8`.

- [ ] **Step 4: Run the soil test and verify GREEN**

Run: `npm test -- components/calculators/soil-design-resistance-calculator.test.ts`

Expected: PASS with all existing calculation, report, scan, and citation behavior unchanged.

- [ ] **Step 5: Commit the soil integration**

```bash
git add components/calculators/soil-design-resistance-calculator.tsx components/calculators/soil-design-resistance-calculator.test.ts
git commit -m "Link soil DBN reference cards"
```

---

### Task 4: Concrete-cover normative cards

**Files:**
- Modify: `components/calculators/concrete-cover-durability-calculator.test.tsx:106`
- Modify: `components/calculators/concrete-cover-durability-calculator.tsx:710-771`

**Interfaces:**
- Consumes: `DbnSourceLink({ document: "dbn-v-2-6-98-2009" })` from Task 1.
- Produces: seven concrete-cover-card actions using the verified e-construction URL.

- [ ] **Step 1: Write the failing concrete-cover integration test**

Add beside the existing DBN scan test:

```tsx
it("renders one e-construction action per concrete-cover normative card", () => {
  render(<ConcreteCoverDurabilityCalculator />);

  const links = screen.getAllByRole("link", {
    name: "Відкрити ДБН на e-construction",
  });
  expect(links).toHaveLength(7);
  for (const link of links) {
    expect(link).toHaveAttribute(
      "href",
      "https://e-construction.gov.ua/laws_detail/3873881846584444859?doc_type=2",
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- components/calculators/concrete-cover-durability-calculator.test.tsx`

Expected: FAIL because no matching source links are rendered.

- [ ] **Step 3: Add one action to each concrete-cover card**

Import the component:

```tsx
import { DbnSourceLink } from "./dbn-source-link";
```

In each of the seven `concrete-cover-durability-norm` articles, add this exact element after its `<h4>` and before its `<NormScan>`:

```tsx
<DbnSourceLink document="dbn-v-2-6-98-2009" />
```

Apply it to article ids `concrete-cover-norm-formula-4-2`, `concrete-cover-norm-table-4-2`, `concrete-cover-norm-table-4-3`, `concrete-cover-norm-table-4-4`, `concrete-cover-norm-table-4-5`, `concrete-cover-norm-45-mm`, and `concrete-cover-norm-cdev`.

- [ ] **Step 4: Run the concrete-cover test and verify GREEN**

Run: `npm test -- components/calculators/concrete-cover-durability-calculator.test.tsx`

Expected: PASS, including all seven existing scan assertions.

- [ ] **Step 5: Commit the concrete-cover integration**

```bash
git add components/calculators/concrete-cover-durability-calculator.tsx components/calculators/concrete-cover-durability-calculator.test.tsx
git commit -m "Link concrete cover DBN cards"
```

---

### Task 5: Residential-yard normative cards

**Files:**
- Modify: `components/calculators/residential-yard-areas-calculator.test.tsx:154`
- Modify: `components/calculators/residential-yard-areas-calculator.tsx:487-540`

**Interfaces:**
- Consumes: `DbnSourceLink` with `dbn-b-2-2-12-2019` and `dbn-v-2-3-15-2007` keys from Task 1.
- Produces: three planning-DBN actions and one parking-DBN action.

- [ ] **Step 1: Write the failing residential-yard integration test**

Add beside the existing normative scan test:

```tsx
it("links every residential-yard normative card to its DBN", () => {
  render(<ResidentialYardAreasCalculator />);

  const links = screen.getAllByRole("link", {
    name: "Відкрити ДБН на e-construction",
  });
  expect(links).toHaveLength(4);
  expect(links.map((link) => link.getAttribute("href"))).toEqual([
    "https://e-construction.gov.ua/laws_detail/3874277768581612585?doc_type=2",
    "https://e-construction.gov.ua/laws_detail/3874277768581612585?doc_type=2",
    "https://e-construction.gov.ua/laws_detail/3874277768581612585?doc_type=2",
    "https://e-construction.gov.ua/laws_detail/3875034753086261244?doc_type=2",
  ]);
  for (const link of links) {
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm test -- components/calculators/residential-yard-areas-calculator.test.tsx`

Expected: FAIL because no matching source links are rendered.

- [ ] **Step 3: Add the three planning-DBN actions**

Import the component:

```tsx
import { DbnSourceLink } from "./dbn-source-link";
```

After the `<p>` and before the first `<ResidentialYardNormScan>` in the cards for tables 6.4, 6.5, and 10.5, add:

```tsx
<DbnSourceLink document="dbn-b-2-2-12-2019" />
```

- [ ] **Step 4: Add the parking-DBN action**

After the `<p>` and before `<ResidentialYardNormScan>` in the card for ДБН В.2.3-15:2007 table 1, add:

```tsx
<DbnSourceLink document="dbn-v-2-3-15-2007" />
```

- [ ] **Step 5: Run the residential-yard test and verify GREEN**

Run: `npm test -- components/calculators/residential-yard-areas-calculator.test.tsx`

Expected: PASS, including the existing five-scan and citation-opening assertions.

- [ ] **Step 6: Commit the residential-yard integration**

```bash
git add components/calculators/residential-yard-areas-calculator.tsx components/calculators/residential-yard-areas-calculator.test.tsx
git commit -m "Link residential yard DBN cards"
```

---

### Task 6: Cross-feature verification

**Files:**
- Verify only; no planned file changes.

**Interfaces:**
- Consumes: all registry, component, styling, and calculator integrations from Tasks 1–5.
- Produces: evidence that the 23 actions coexist with all existing behavior and the static build.

- [ ] **Step 1: Run all five focused test files together**

Run:

```bash
npm test -- components/calculators/dbn-source-link.test.tsx components/calculators/steel-structure-category-group-calculator.test.tsx components/calculators/soil-design-resistance-calculator.test.ts components/calculators/concrete-cover-durability-calculator.test.tsx components/calculators/residential-yard-areas-calculator.test.tsx
```

Expected: PASS with no failed cases.

- [ ] **Step 2: Run the complete test suite**

Run: `npm test`

Expected: PASS.

- [ ] **Step 3: Run TypeScript verification**

Run: `npm run typecheck`

Expected: PASS with no TypeScript errors, proving that every calculator uses a valid registry key.

- [ ] **Step 4: Build the static site**

Run: `npm run build`

Expected: PASS and complete the Next.js static export without errors.

- [ ] **Step 5: Perform the visual smoke check**

Run: `npm run dev`, then inspect these pages at desktop and narrow mobile widths:

```text
http://localhost:3000/calculator/steel-structure-category-group
http://localhost:3000/calculator/soil-design-resistance
http://localhost:3000/calculator/concrete-cover-durability
http://localhost:3000/calculator/residential-yard-areas
```

Expected: each action appears before the first scan disclosure, long labels wrap without horizontal overflow, focus is visible, and opening an action leaves the calculator page in the original tab.

- [ ] **Step 6: Confirm the worktree contains only intended changes**

Run: `git status --short` and `git diff --check`.

Expected: no uncommitted implementation changes and no whitespace errors. The implementation consists of the five task commits from this plan.
