# Revit Plugins Catalog Design

## Status

Proposed for user review.

## Goal

Make `Revit Screenshot Plugin` discoverable from the main calculator catalog under a new top-level category named `Revit плагіни`.

## Catalog structure

- Add the top-level category `revit-plaginy` after `Теплотехніка` and before `AI-інструменти`.
- Use the visible title `Revit плагіни`, a short note explaining that the section contains Autodesk Revit extensions, and the existing `Box` icon.
- Add one catalog item named `Revit Screenshot Plugin` with the existing product description and internal destination `/products/revit-screenshot`.
- Show `Revit 2024–2026` in the table's standard/version column.

## Navigation behavior

Introduce a `product` display mode for catalog items that point to an internal product page.

- Clicking the item title in the category table opens `/products/revit-screenshot` in the current tab.
- Selecting the item from calculator search opens the same internal product page.
- Product items do not show the external-link marker.
- Product items do not generate duplicate `/calculator/<slug>` pages and are excluded from calculator sitemap entries; the existing `/products/revit-screenshot` sitemap entry remains the canonical URL.

## Data and type changes

- Add `revit-plaginy` to `CategorySlug` and its fallback icon map.
- Add `product` to `DisplayMode`.
- Keep the category and catalog item content in `data/content.json`.
- Add one shared helper that returns the canonical href for a catalog item so the table and global search use identical routing rules.

## Testing

- Data tests verify category order, category membership, title, mode, version text, and destination URL.
- Component tests verify that the category table links directly to the product page without an external marker.
- Search tests verify that product results use the internal product URL.
- Route and sitemap tests verify that no duplicate calculator page or sitemap URL is generated.
- Run the full Vitest suite, TypeScript typecheck, static build, and desktop/mobile browser smoke tests before deployment.

## Out of scope

- Changes to the Revit product page content or downloads.
- Restoring the old project grid on `/author`.
- Adding Revit plugins to unrelated engineering categories.
