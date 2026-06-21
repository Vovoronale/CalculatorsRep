# Revit Plugin Product Page Design

**Date:** 2026-06-21  
**Status:** Approved

## Goal

Create an internal product page for Revit Screenshot Plugin that provides product information, screenshots, direct download links, installation instructions, and license terms. The implementation must establish a reusable pattern for future Revit plugins instead of hard-coding a one-off page.

## Scope

- Add a reusable static product route at `/products/[slug]`.
- Add structured product-page content to `data/content.json`.
- Add the first product entry for Revit Screenshot Plugin.
- Change the existing Revit Screenshot Plugin card in the `BIM та робочі інструменти` project category to link to `/products/revit-screenshot`.
- Copy the four existing product screenshots into this repository.
- Keep the ZIP archives hosted on `dbnassistant.com` and link directly to them.

The ZIP files will not be copied into this repository. No other Revit plugin pages are included in this first implementation.

## Content Model

Add a top-level `products` array to `data/content.json`. Each product entry must support:

- slug;
- product type label;
- title;
- short and full descriptions;
- feature list;
- screenshot paths, captions, and accessible alternative text;
- downloadable versions with labels and external URLs;
- ordered installation steps;
- license terms.

The content loader must provide TypeScript types and lookup helpers for product entries. Unknown slugs must resolve through Next.js `notFound()`.

## Routing And Static Export

Create `app/products/[slug]/page.tsx`. The route must use `generateStaticParams` so every product entry is included in the static export. Product metadata should be derived from the matching content entry.

The existing project card remains in the `bim-tools` category, but its `href` becomes the internal route `/products/revit-screenshot`.

## Page Structure

The product page uses the site's existing shell, navigation, typography, colors, and responsive conventions. Its content appears in this order:

1. Hero with the `Revit Plugin` label, product name, short description, and a button that jumps to the downloads section.
2. `Що вміє плагін` with the three existing product capabilities.
3. `Опис плагіну` with the full product description.
4. `Скріншоти плагіну` with four screenshots, captions, and meaningful `alt` text.
5. `Завантаження за версіями Revit` with direct download buttons for Revit 2024, 2025, and 2026.
6. `Повна інструкція встановлення` with the five existing installation steps, including file names and filesystem paths.
7. `Ліцензійні умови` with the current proprietary IVSoft license and disclaimer text from the existing page.

Product-specific content must come from `data/content.json`. Reusable presentation components may be introduced where they keep the dynamic route focused and make subsequent product entries straightforward.

## Assets And Downloads

Copy the four screenshots from the existing DBN Assistant product page into:

`public/images/products/revit-screenshot/`

Download buttons must point to:

- `https://dbnassistant.com/downloads/revit-screenshot/RevitScreenshot-2024.zip`
- `https://dbnassistant.com/downloads/revit-screenshot/RevitScreenshot-2025.zip`
- `https://dbnassistant.com/downloads/revit-screenshot/RevitScreenshot-2026.zip`

Downloads open in the current tab. The implementation must verify that all three external URLs are reachable, but the new site does not proxy the files or attempt to display an in-app error after navigation.

## Responsive And Accessible Behavior

- The page must remain usable on mobile and desktop within the existing application shell.
- Screenshots must scale without horizontal overflow.
- Each screenshot must have descriptive alternative text rather than a repeated product name.
- Download links and the downloads anchor must be keyboard accessible and have unambiguous labels that include the Revit version.
- Installation paths and filenames must be visually distinguishable as code.

## Verification

Add focused tests that cover:

- product lookup and typed content loading;
- static params for the known product;
- rendering or resolution of the known product and `notFound()` behavior for an unknown slug;
- Revit 2024, 2025, and 2026 labels and exact download URLs;
- the existing project card's internal product URL;
- meaningful screenshot alternative text.

Run:

```bash
npm test
npm run typecheck
npm run build
```

Before completion, verify the responsive page visually in the local browser and confirm all three download URLs respond successfully.
