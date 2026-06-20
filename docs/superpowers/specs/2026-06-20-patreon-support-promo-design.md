# Patreon Support Promo Design

**Date:** 2026-06-20  
**Status:** Approved design, pending written-spec review

## Goal

Add a minimal Patreon support entry point to every IVApps.pro calculator page without competing with the calculator itself. The compact entry point leads to a dedicated support page that explains the relationship between IVApps.pro and CadEE.pro and links to Patreon.

## Calculator-page support strip

- Render one shared support strip on every calculator detail page, including native, external, modal, and embedded calculator modes.
- Place the strip after the primary calculator interaction:
  - after the native calculator workspace;
  - after the external or modal calculator action block;
  - immediately after the iframe for embedded calculators and before the collapsed “Про калькулятор” disclosure.
- Use this visible text: `Подобається IVApps.pro? Підтримайте розвиток сервісу →`
- Make the entire strip an internal link to `/support`.
- Open `/support` in the current tab.
- Present the strip as a thin horizontal row using the existing site typography, surface, border, text, and orange accent tokens. It must not use an illustration, large promotional panel, animation, or sticky positioning.
- Keep the text on one line when space permits. Allow a natural compact wrap on narrow mobile screens without horizontal overflow.
- Preserve visible keyboard focus and an adequate touch target.

## Support page

- Add the static route `/support` inside the existing engineering shell, with shared catalog rail, workspace top bar, breadcrumbs, and site footer.
- Use `Підтримка проєкту` as the page breadcrumb and page eyebrow.
- Use `Подобається IVApps.pro? Підтримайте розвиток сервісу` as the page H1.
- Render the following body copy as three paragraphs, without shortening:

  1. `Підпишіться на Patreon CadEE.pro. Навіть безкоштовна підписка допомагає популяризувати наші інженерні сервіси та залучати ресурси для створення нових калькуляторів.`
  2. `IVApps.pro і CadEE.pro містять різні типи калькуляторів, але розробляються одним автором. Тому підтримка обох проєктів об’єднана на одній сторінці Patreon CadEE.pro.`
  3. `Якщо IVApps.pro корисний для вас і ви хочете підтримати його активний розвиток, можете обрати платний рівень підписки.`

- Add a primary CTA labeled `Підтримати проєкти на Patreon`.
- Link the CTA to `https://patreon.com/u93873537?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_fan&utm_content=copyLink`.
- Open the Patreon CTA in a new tab with safe external-link relationship attributes.
- Keep the page visually restrained and consistent with the author and legal content pages. Use existing type and color tokens; no new typeface or standalone color palette is introduced.

## Author page

- Add `Patreon CadEE.pro` to the existing JSON-driven profile links in the “Про автора” page.
- Use the same Patreon URL as the support-page CTA.
- Open the link in a new tab using the author page’s existing external-link behavior.

## Content and component boundaries

- Store user-visible support copy, CTA label, strip label, and Patreon URL in `data/content.json`, consistent with the repository’s JSON-driven content model.
- Add a reusable support-strip component for calculator detail modes instead of duplicating markup.
- Add a dedicated support-page view that preserves the shared shell pattern without coupling support content to calculator behavior.

## Accessibility and responsive behavior

- Use semantic links for both the support strip and Patreon actions.
- Keep a single H1 on `/support`.
- Ensure focus states remain visible in light and dark themes.
- Verify no horizontal overflow at mobile width and that the strip remains a compact row at desktop width.
- Do not force the external Patreon destination onto users who select the calculator-page strip; that strip always leads to the explanatory `/support` page first.

## Verification

- Add tests proving all calculator display modes render the support strip with `href="/support"`.
- Add a support-page test for the heading, exact body copy, Patreon CTA URL, `_blank` target, and shared shell.
- Extend the author-page test for the Patreon link URL and `_blank` target.
- Run the focused Vitest tests, full test suite as appropriate, `npm run typecheck`, and `npm run build`.
- Run the development site and visually check representative native and embedded calculator pages plus `/support` at desktop and mobile viewport widths.

## Out of scope

- Direct Patreon navigation from the calculator-page strip.
- Dismissal state, analytics, animation, sticky behavior, modal behavior, or Patreon API integration.
- Changes to calculator algorithms or reports.
