# Calculator Workspace Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make native React calculators a responsive engineering workbench and make iframe calculators fill the available first viewport while retaining the catalog rail.

**Architecture:** `CalculatorShell` continues to choose presentation by display mode. `NativeCalculatorLayout` becomes the single slot-based, container-query workbench for every report calculator, including soil resistance. Embedded iframe details get a dedicated primary-workspace composition with supporting content in one semantic disclosure.

**Tech Stack:** Next.js App Router, React, TypeScript, CSS container queries, Vitest, Testing Library.

## Global Constraints

- Do not change calculation algorithms, input schemas, report text, formulas, or normative references.
- Keep the desktop catalog rail visible and preserve its existing collapse behavior.
- Use exact native layout thresholds: 1180 px for three columns and 820 px for the narrow single-column transition.
- Keep the native result rail at 260 px, never below 240 px while it is beside the form.
- Do not introduce page-level horizontal overflow.
- Keep iframe supporting content in a closed-by-default disclosure labeled `Про калькулятор`.
- Preserve current light/dark tokens, keyboard focus, semantic document order, and reduced-motion behavior.
- Run `npm run typecheck` and `npm run build` before completion.

---

### Task 1: Shared native engineering workbench

**Files:**
- Modify: `components/calculators/native-calculator-layout.test.tsx`
- Modify: `components/calculators/native-calculator-layout.tsx`
- Modify: `components/calculator-shell.test.tsx`
- Modify: `components/calculator-shell.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: existing `NativeCalculatorLayoutProps` slots (`navLinks`, `summary`, `controls`, `diagrams`, `errors`, `warnings`, `children`).
- Produces: `.native-calculator__rail`, `.native-calculator__menu`, `.native-calculator__summary`, and a container-query layout shared by all native report calculators.

- [ ] **Step 1: Write failing semantic and CSS contract tests**

Extend `native-calculator-layout.test.tsx` so the test requires a combined rail and verifies navigation precedes the result:

```tsx
const rail = within(calculator).getByRole("complementary", {
  name: "Навігація і результат",
});
const navigation = within(rail).getByRole("navigation", { name: "Розділи вводу" });
const summary = within(rail).getByLabelText("Поточний результат");

expect(
  navigation.compareDocumentPosition(summary) & Node.DOCUMENT_POSITION_FOLLOWING,
).toBeTruthy();
```

Add a CSS contract test that reads `app/globals.css` and requires:

```tsx
expect(css).toMatch(/\.native-calculator\s*{[\s\S]*?container-type:\s*inline-size;/);
expect(css).toMatch(/\.native-calculator__rail\s*{[\s\S]*?width:\s*260px;[\s\S]*?min-width:\s*240px;/);
expect(css).toMatch(/@container\s*\(min-width:\s*1180px\)/);
expect(css).toMatch(/@container\s*\(max-width:\s*819px\)/);
```

Update `calculator-shell.test.tsx` to require `.workspace-content--native` for a native detail page.

- [ ] **Step 2: Run focused tests and verify RED**

Run:

```bash
npm test -- --run components/calculators/native-calculator-layout.test.tsx components/calculator-shell.test.tsx
```

Expected: FAIL because the rail accessible name, CSS container contract, and native workspace modifier do not exist.

- [ ] **Step 3: Implement the shared rail markup and native workspace modifier**

Change `NativeCalculatorLayout` input-shell markup to this structure while keeping the existing props:

```tsx
<div className="native-calculator__input-shell">
  <aside className="native-calculator__rail" aria-label="Навігація і результат">
    <div className="native-calculator__menu">
      <p className="native-calculator__menu-label">Ввід</p>
      <nav className="native-calculator__menu-links" aria-label="Розділи вводу">
        {navLinks.map((link) => (
          <a href={link.href} key={link.href}>{link.label}</a>
        ))}
      </nav>
    </div>
    {summary ? (
      <div className="native-calculator__summary" aria-label="Поточний результат">
        {summary}
      </div>
    ) : null}
  </aside>
  <div className="native-calculator__controls">{controls}</div>
  {diagrams ? (
    <section className="native-calculator__diagrams" aria-labelledby={diagramTitleId}>
      <div className="native-report__head">
        <h3 id={diagramTitleId}>{diagramTitle}</h3>
      </div>
      {diagrams}
    </section>
  ) : null}
</div>
```

In `CalculatorShell`, add `workspace-content--native` when `selectedCalculator.displayMode === "native"`.

- [ ] **Step 4: Implement container-query workbench CSS**

Replace the current viewport-based native layout rules with:

```css
.workspace-content--native {
  max-width: none;
  padding: 24px;
}

.native-calculator {
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
}

.native-calculator__input-shell {
  display: grid;
  grid-template-areas: "rail controls" "rail diagram";
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  min-width: 0;
}

.native-calculator__rail {
  grid-area: rail;
  position: sticky;
  top: 68px;
  display: grid;
  gap: 10px;
  width: 260px;
  min-width: 240px;
  max-height: calc(100dvh - 84px);
  overflow-y: auto;
}

.native-calculator__summary {
  border-left: 3px solid var(--accent);
}

.native-calculator__diagrams {
  position: static;
  max-width: 100%;
  overflow: hidden;
  box-shadow: none;
}

@container (min-width: 1180px) {
  .native-calculator__input-shell {
    grid-template-areas: "rail controls diagram";
    grid-template-columns: 260px minmax(470px, 1fr) minmax(320px, 420px);
  }

  .native-calculator__diagrams {
    position: sticky;
    top: 68px;
  }
}

@container (max-width: 819px) {
  .native-calculator__input-shell {
    grid-template-areas: "rail" "controls" "diagram";
    grid-template-columns: minmax(0, 1fr);
  }

  .native-calculator__rail {
    position: static;
    width: auto;
    min-width: 0;
    max-height: none;
    overflow: visible;
  }

  .native-calculator__menu-links {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
```

Retain detailed existing control, report, warning, and responsive field styles. Ensure diagram canvases and SVGs have `min-width: 0; max-width: 100%` and remove the superseded native `@media (max-width: 1320px/1100px/760px)` layout blocks.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run the command from Step 2. Expected: both test files PASS.

- [ ] **Step 6: Commit Task 1**

```bash
git add components/calculators/native-calculator-layout.test.tsx components/calculators/native-calculator-layout.tsx components/calculator-shell.test.tsx components/calculator-shell.tsx app/globals.css
git commit -m "Refine native calculator workspace layout"
```

### Task 2: Migrate soil resistance to the shared layout

**Files:**
- Modify: `components/calculators/soil-design-resistance-calculator.test.ts`
- Modify: `components/calculators/soil-design-resistance-calculator.tsx`
- Modify: `components/calculator-shell.test.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `NativeCalculatorLayout` from Task 1.
- Produces: soil resistance through the same `navLinks`, `summary`, `controls`, `diagrams`, `errors`, `warnings`, and `children` slots as every other report calculator.

- [ ] **Step 1: Write a failing migration test**

In the soil calculator component test, require the shared workbench class and rail:

```tsx
const calculator = screen.getByLabelText("Калькулятор розрахункового опору ґрунту основи");
expect(calculator).toHaveClass("native-calculator");
expect(within(calculator).getByRole("complementary", {
  name: "Навігація і результат",
})).toBeInTheDocument();
```

Replace the old soil desktop-track CSS assertions in `calculator-shell.test.tsx` with assertions that the old `.soil-resistance-input-shell` selector is absent and the diagram canvas remains bounded.

- [ ] **Step 2: Run focused tests and verify RED**

```bash
npm test -- --run components/calculators/soil-design-resistance-calculator.test.ts components/calculator-shell.test.tsx
```

Expected: FAIL because soil resistance still renders its duplicated outer shell.

- [ ] **Step 3: Render soil resistance through `NativeCalculatorLayout`**

Import the shared component and replace the duplicated shell/status markup with:

```tsx
<NativeCalculatorLayout
  ariaLabel="Калькулятор розрахункового опору ґрунту основи"
  navLinks={[
    { href: "#soil-resistance-working", label: "Умови" },
    { href: "#soil-resistance-strength", label: "Ґрунт" },
    { href: "#soil-resistance-geometry", label: "Геометрія" },
    { href: "#soil-resistance-basement", label: "Підвал" },
    { href: "#soil-resistance-report-title", label: "Звіт" },
  ]}
  summary={resultSummary}
  controls={
    <div className="soil-resistance-controls">
      <InputSchemaForm schema={SOIL_INPUT_SCHEMA} values={inputValues} onValuesChange={setInputValues} />
    </div>
  }
  diagramTitle="Позначення величин"
  diagrams={
    <SoilFoundationDiagram
      input={input}
      soilDesignResistanceKPa={
        report.valid && report.values
          ? report.values.soilDesignResistanceKPa
          : undefined
      }
    />
  }
  errors={report.errors}
  warnings={report.warnings}
>
```

Keep the current complete `soil-resistance-report` and `soil-resistance-norms` section elements immediately after this opening tag, then replace the final outer `</div>` with `</NativeCalculatorLayout>`. Delete only the duplicated input shell, error block, and warning block now represented by props. Do not change the two retained sections' JSX, text, ids, or class names.

- [ ] **Step 4: Remove duplicated soil shell CSS**

Delete `.soil-resistance-calculator`, `.soil-resistance-input-shell`, `.soil-resistance-input-menu*`, `.soil-resistance-diagrams`, `.soil-resistance-errors`, `.soil-resistance-warning`, and their old layout media queries. Keep soil-specific input density, diagram canvas, report, formulas, and normative-scan styles.

- [ ] **Step 5: Run focused tests and verify GREEN**

Run the command from Step 2. Expected: both files PASS.

- [ ] **Step 6: Commit Task 2**

```bash
git add components/calculators/soil-design-resistance-calculator.test.ts components/calculators/soil-design-resistance-calculator.tsx components/calculator-shell.test.tsx app/globals.css
git commit -m "Unify soil calculator workspace layout"
```

### Task 3: Immersive iframe detail composition

**Files:**
- Modify: `components/calculator-shell.test.tsx`
- Modify: `components/calculator-shell.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: calculator metadata, `CalculatorSeoSections`, related calculators, and the existing workspace toolbar.
- Produces: `IframeCalculatorDetail`, `.detail-section--embed`, and `.detail-about` with the existing supporting content.

- [ ] **Step 1: Write failing iframe behavior tests**

Extend the existing embedded-calculator test:

```tsx
const iframe = screen.getByTitle(calculator.title);
const aboutSummary = screen.getByText("Про калькулятор");
const about = aboutSummary.closest("details");

expect(about).not.toBeNull();
expect(about).not.toHaveAttribute("open");
expect(
  iframe.compareDocumentPosition(about as HTMLElement) & Node.DOCUMENT_POSITION_FOLLOWING,
).toBeTruthy();
expect(within(about as HTMLElement).getByText(calculator.shortDescription)).toBeInTheDocument();
expect(document.querySelectorAll("h1")).toHaveLength(1);
```

Add CSS contract assertions for `height: calc(100dvh - 88px)`, the mobile `calc(100dvh - 104px)`, and `.workspace-content--embed` without a reading-width maximum.

- [ ] **Step 2: Run the iframe test and verify RED**

```bash
npm test -- --run components/calculator-shell.test.tsx
```

Expected: FAIL because no `Про калькулятор` disclosure exists and the iframe height contract is absent.

- [ ] **Step 3: Add an iframe-specific detail branch**

Before rendering the standard detail header, branch embedded calculators to `IframeCalculatorDetail`. Render:

```tsx
<section className="detail-section detail-section--embed" aria-label={calculator.title}>
  <h1 className="visually-hidden">{calculator.title}</h1>
  <div className="detail-embed">
    <iframe src={calculator.embedUrl} title={calculator.title} loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
  </div>
  <details className="detail-about">
    <summary>Про калькулятор</summary>
    <div className="detail-about__body">
      <div className="detail-header__badges">
        <span className="detail-badge detail-badge--accent">{calculator.accessLabel}</span>
        {calculator.editorialLabel ? (
          <span className="detail-badge detail-badge--neutral">{calculator.editorialLabel}</span>
        ) : null}
        {calculator.tools?.map((tool) => (
          <span key={tool} className="detail-badge detail-badge--neutral">{tool}</span>
        ))}
      </div>
      <p className="detail-header__desc">{calculator.shortDescription}</p>
      {calculator.description ? <p className="detail-header__long">{calculator.description}</p> : null}
      <ul className="detail-use-cases" aria-label={`Сценарії: ${calculator.title}`}>
        {calculator.useCases.map((useCase) => <li key={useCase}>{useCase}</li>)}
      </ul>
      {calculator.tags?.length ? (
        <ul className="detail-tags" aria-label={`Теги: ${calculator.title}`}>
          {calculator.tags.map((tag) => <li key={tag}>#{tag}</li>)}
        </ul>
      ) : null}
      <CalculatorSeoSections sections={getCalculatorSeoSections(calculator)} />
      {related.length > 0 ? (
        <section className="workspace-section workspace-section--related" aria-labelledby="detail-related-title">
          <div className="workspace-section__head">
            <h2 className="workspace-section__title" id="detail-related-title">Схожі калькулятори</h2>
          </div>
          <div className="calc-grid calc-grid--compact">
            {related.map((calc) => (
              <CalculatorCard
                key={calc.slug}
                calculator={calc}
                className="calc-card--compact"
                onOpenModal={onOpenModal}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  </details>
</section>
```

Do not duplicate content outside the disclosure. Keep non-iframe detail rendering unchanged.

- [ ] **Step 4: Add immersive iframe CSS**

Implement:

```css
.workspace-content--embed {
  max-width: none;
  padding: 0 16px 24px;
  gap: 0;
}

.detail-section--embed {
  gap: 16px;
  min-width: 0;
}

.detail-section--embed .detail-embed iframe {
  width: 100%;
  height: calc(100dvh - 88px);
  min-height: 560px;
}

.detail-about {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--surface);
}

.detail-about > summary {
  padding: 14px 16px;
  color: var(--text);
  font-weight: 700;
}

.detail-about__body {
  display: grid;
  gap: 20px;
  padding: 0 16px 20px;
}

@media (max-width: 767px) {
  .detail-section--embed .detail-embed iframe {
    height: calc(100dvh - 104px);
  }
}
```

Use thin borders and existing theme tokens; remove the obsolete embed header spacing and old `calc(100vh - 100px)` rule.

- [ ] **Step 5: Run iframe and full component tests**

```bash
npm test -- --run components/calculator-shell.test.tsx components/calculators/native-calculator-layout.test.tsx components/calculators/soil-design-resistance-calculator.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit Task 3**

```bash
git add components/calculator-shell.test.tsx components/calculator-shell.tsx app/globals.css
git commit -m "Make embedded calculators viewport-first"
```

### Task 4: Regression and visual verification

**Files:**
- Modify only if verification reveals a failing requirement: files already listed in Tasks 1–3, with a new failing regression test first.

**Interfaces:**
- Consumes: completed native and iframe layouts.
- Produces: verification evidence at supported widths and a clean production build.

- [ ] **Step 1: Run the full automated suite**

```bash
npm test -- --run
npm run typecheck
npm run build
```

Expected: all tests PASS, typecheck exits 0, and static export completes.

- [ ] **Step 2: Start the development server**

```bash
npm run dev
```

Expected: Next.js serves `http://localhost:3000` without compile errors.

- [ ] **Step 3: Inspect representative pages**

At 1920, 1440, 1280, 1024, 768, and 390 px inspect:

- `/calculator/steel-structure-category-group` for the longest result rail;
- `/calculator/minimum-reinforcement-area` for the long result action;
- `/calculator/soil-design-resistance` for the large diagram and migrated layout;
- `/calculator/cadee-external` for the viewport-first iframe and disclosure.

Expected: 260 px rail on supported side layouts, no rail below 240 px, diagram moves below form in medium mode, single-column order below 820 px, no page-level horizontal scrollbar, iframe occupies the available first viewport, and `Про калькулятор` is closed initially.

- [ ] **Step 4: Fix any visual regression through TDD**

For each defect, add the smallest failing component/CSS contract test, run it to confirm RED, implement the fix, and rerun the focused test to confirm GREEN.

- [ ] **Step 5: Re-run final verification**

```bash
npm test -- --run
npm run typecheck
npm run build
git diff --check
```

Expected: zero failures, zero type errors, successful export, and no whitespace errors.

- [ ] **Step 6: Commit verification fixes if any**

```bash
git add components app/globals.css
git commit -m "Polish calculator workspace responsiveness"
```

Skip this commit only when Step 4 required no source changes.
