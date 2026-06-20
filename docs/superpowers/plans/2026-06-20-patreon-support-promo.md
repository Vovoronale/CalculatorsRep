# Patreon Support Promo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a compact calculator-page support strip, a dedicated `/support` page, and a Patreon profile link on the author page.

**Architecture:** Keep all visible copy and the canonical Patreon URL in `data/content.json`, typed through `lib/site-content.ts`. A focused `SupportStrip` component is rendered at the primary-interaction boundary of both calculator-detail layouts, while a dedicated `SupportView` owns the shared shell for `/support`.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript, JSON-driven content, lucide-react, Vitest, Testing Library, CSS custom properties.

## Global Constraints

- Calculator strip text is exactly `Подобається IVApps.pro? Підтримайте розвиток сервісу →` and links to `/support` in the current tab.
- `/support` contains the three approved paragraphs without shortening.
- Patreon actions use `https://patreon.com/u93873537?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_fan&utm_content=copyLink`, `target="_blank"`, and a safe `rel` value.
- The strip remains a thin, non-sticky, non-animated horizontal row with no illustration.
- Preserve the existing typefaces, color tokens, light/dark themes, keyboard focus, and mobile responsiveness.

---

### Task 1: JSON content model and calculator support strip

**Files:**
- Modify: `data/content.json`
- Modify: `lib/site-content.ts`
- Create: `components/support-strip.tsx`
- Create: `components/support-strip.test.tsx`
- Modify: `components/calculator-shell.tsx`
- Modify: `components/calculator-shell.test.tsx`

**Interfaces:**
- Consumes: `siteContent.support.stripLabel` and internal route `/support`.
- Produces: `SupportStrip(): JSX.Element` and typed `SupportContent` data for the support page.

- [ ] **Step 1: Write failing component and integration tests**

Add a test that renders `<SupportStrip />` and expects a link named `Подобається IVApps.pro? Підтримайте розвиток сервісу →` with `href="/support"` and no `_blank` target. Extend calculator-shell tests to render representative native, embedded, and external calculators and assert the same link exists after the primary calculator region, iframe, or external action respectively.

- [ ] **Step 2: Run tests to verify RED**

Run: `npm test -- --run components/support-strip.test.tsx components/calculator-shell.test.tsx`

Expected: FAIL because `components/support-strip.tsx` does not exist and calculator details do not render the link.

- [ ] **Step 3: Add typed JSON support content and the component**

Add this shape to `site` in `data/content.json` and mirror it with a `SupportContent` type and `support: SupportContent` on `SiteContent`:

```json
"support": {
  "stripLabel": "Подобається IVApps.pro? Підтримайте розвиток сервісу →",
  "eyebrow": "Підтримка проєкту",
  "title": "Подобається IVApps.pro? Підтримайте розвиток сервісу",
  "paragraphs": [
    "Підпишіться на Patreon CadEE.pro. Навіть безкоштовна підписка допомагає популяризувати наші інженерні сервіси та залучати ресурси для створення нових калькуляторів.",
    "IVApps.pro і CadEE.pro містять різні типи калькуляторів, але розробляються одним автором. Тому підтримка обох проєктів об’єднана на одній сторінці Patreon CadEE.pro.",
    "Якщо IVApps.pro корисний для вас і ви хочете підтримати його активний розвиток, можете обрати платний рівень підписки."
  ],
  "ctaLabel": "Підтримати проєкти на Patreon",
  "patreonHref": "https://patreon.com/u93873537?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_fan&utm_content=copyLink"
}
```

Create the semantic internal link:

```tsx
export function SupportStrip() {
  return (
    <Link className="support-strip" href="/support">
      {siteContent.support.stripLabel}
    </Link>
  );
}
```

Render it after the normal calculator interaction branch and immediately after `.detail-embed` in `IframeCalculatorDetail`.

- [ ] **Step 4: Run focused tests to verify GREEN**

Run: `npm test -- --run components/support-strip.test.tsx components/calculator-shell.test.tsx`

Expected: both test files pass.

### Task 2: Dedicated support page

**Files:**
- Create: `components/support-view.tsx`
- Create: `app/support/page.tsx`
- Create: `app/support/page.test.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `siteContent.support` from Task 1 and existing shell components.
- Produces: static App Router route `/support` with one H1 and an external Patreon CTA.

- [ ] **Step 1: Write the failing route test**

Render `SupportPage` and assert the shared catalog rail and main region exist, the H1 equals the approved title, all three paragraphs are present, and the CTA has the exact Patreon URL, `target="_blank"`, and `rel="noreferrer"`.

- [ ] **Step 2: Run test to verify RED**

Run: `npm test -- --run app/support/page.test.tsx`

Expected: FAIL because the support route does not exist.

- [ ] **Step 3: Implement the route and view**

Create `SupportView` using the same drawer, catalog rail, workspace top bar, workspace content, and footer structure as `AuthorView`. Render `siteContent.support.eyebrow`, the title as the only H1, all paragraphs, and this CTA:

```tsx
<a
  className="cta-button support-page__cta"
  href={siteContent.support.patreonHref}
  target="_blank"
  rel="noreferrer"
>
  {siteContent.support.ctaLabel}
  <ExternalLink size={14} aria-hidden />
</a>
```

Create `app/support/page.tsx` with metadata derived from the support title and first paragraph.

- [ ] **Step 4: Add restrained responsive styles**

Add `.support-strip` with a 1px border, 3px accent inset/left border, existing surface/text tokens, compact padding, minimum 44px touch height, and visible hover/focus states. Add `.support-page` styles matching legal/author reading width and typography. At `max-width: 767px`, allow wrapping and maintain no horizontal overflow.

- [ ] **Step 5: Run focused tests to verify GREEN**

Run: `npm test -- --run app/support/page.test.tsx components/support-strip.test.tsx components/calculator-shell.test.tsx`

Expected: all focused tests pass.

### Task 3: Author Patreon link and full verification

**Files:**
- Modify: `data/content.json`
- Modify: `app/author/page.test.tsx`
- Modify: `docs/content-editing.md`

**Interfaces:**
- Consumes: the canonical Patreon URL stored in author JSON and the existing JSON-driven social link rendering.
- Produces: a `Patreon CadEE.pro` external profile link and documentation for support content edits.

- [ ] **Step 1: Write the failing author-page assertion**

Add assertions that `Patreon CadEE.pro` has the exact Patreon URL, `target="_blank"`, and `rel="noreferrer"`.

- [ ] **Step 2: Run the author test to verify RED**

Run: `npm test -- --run app/author/page.test.tsx`

Expected: FAIL because the Patreon profile is absent.

- [ ] **Step 3: Add the JSON link and content documentation**

Append this entry to `authorPage.socialLinks`:

```json
{
  "label": "Patreon CadEE.pro",
  "href": "https://patreon.com/u93873537?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_fan&utm_content=copyLink"
}
```

Document `site.support` in `docs/content-editing.md` as the source for the strip, support page, CTA, and Patreon URL.

- [ ] **Step 4: Run focused tests to verify GREEN**

Run: `npm test -- --run app/author/page.test.tsx app/support/page.test.tsx components/support-strip.test.tsx components/calculator-shell.test.tsx`

Expected: all focused tests pass.

- [ ] **Step 5: Run repository verification**

Run: `npm test`

Expected: Vitest exits 0 with no failed tests.

Run: `npm run typecheck`

Expected: TypeScript exits 0 with no diagnostics.

Run: `npm run build`

Expected: Next.js exits 0 and static export includes `/support`.

- [ ] **Step 6: Perform browser verification**

Run `npm run dev`, then inspect `/calculator/rebar-area-bars`, `/calculator/cadee-external`, and `/support` at desktop and mobile viewport widths. Confirm the strip is compact, wraps without overflow, the iframe remains usable, dark/light contrast is intact, and Patreon opens in a new tab.
