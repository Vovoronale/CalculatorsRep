# AutoCAD LISP Catalog and XRef2Current Product Page Design

**Date:** 2026-07-01  
**Status:** Approved

## Goal

Add a dedicated `AutoCAD Lisp` catalog section immediately after `Revit плагіни`, publish the supplied `XRef2Current.lsp` file as a downloadable product, and provide a Ukrainian product page explaining its operation, installation, command syntax, safety considerations, and proprietary usage terms.

## Catalog Placement

- Add `AutoCAD Lisp` as an independent top-level category immediately after `Revit плагіни` in the existing category order.
- Use a distinct AutoCAD-appropriate icon from the existing `lucide-react` registry.
- Add one product-mode catalog entry named `XRef to Current Drawing (X2C)`.
- The catalog entry links to `/products/xref-to-current` and is not included in calculator static routes.
- The card identifies the tool as an AutoCAD LISP utility for copying nested Xref objects into the current drawing.

## Downloadable Asset

- Store the supplied source as `public/downloads/autocad-lisp/XRef2Current.lsp`.
- Preserve the program logic and the `X2C` command.
- Add a file header containing:
  - program name `XRef to Current Drawing`;
  - filename `XRef2Current.lsp`;
  - command `X2C`;
  - version `1.0`;
  - author `Ivaneiko Volodymyr`;
  - `Copyright (c) 2026 Ivaneiko Volodymyr. All rights reserved.`;
  - a concise proprietary license notice allowing free personal and commercial use while prohibiting resale, unauthorized republication, and redistributed modifications under the original name;
  - an `as is` warranty disclaimer.

## Product Content Model

Extend the reusable product content model only where necessary so it can describe both Revit plugins and AutoCAD LISP utilities without Revit-specific hard-coding.

- Downloads receive explicit user-facing labels and accessible labels instead of being rendered as `Revit {version}`.
- Screenshot content becomes optional; no empty screenshot heading or grid is rendered for products without screenshots.
- Product facts may describe command syntax, version, platform, and compatibility.
- Ordered usage or installation steps remain content-driven.
- Warning paragraphs become a reusable optional product-page section.
- Existing Revit Screenshot Plugin content and rendering remain unchanged.

## Product Page

The page at `/products/xref-to-current` uses the existing application shell, product-page typography, responsive layout, and content-driven route. Its content appears in this order:

1. Hero with the `AutoCAD LISP` type label, product title, short description, and a link to the download section.
2. Product facts:
   - command: `X2C`;
   - version: `1.0`;
   - platform: `AutoCAD for Windows`;
   - AutoCAD for Mac: not supported;
   - AutoCAD LT: not supported because the routine relies on ActiveX/ObjectDBX APIs.
3. `Що робить LISP` feature list.
4. `Опис роботи` explaining the complete user flow.
5. `Як користуватися` with the command sequence.
6. A prominent warning about external drawing changes.
7. `Завантаження` with a direct link to `/downloads/autocad-lisp/XRef2Current.lsp`.
8. `Як встановити LISP в AutoCAD` with APPLOAD and optional Startup Suite instructions.
9. `Ліцензійні умови` containing the agreed proprietary terms and copyright notice.

The content structure follows the useful information hierarchy of Lee Mac's program pages but uses original Ukrainian copy and describes this routine's actual, opposite-direction workflow.

## Program Description

The page must accurately explain that the routine:

1. Prompts the user to select a source Xref attached to the current drawing.
2. Prompts for nested objects inside that selected Xref until Enter is pressed.
3. Locates each source object by handle in the Xref source DWG, opening the source through ObjectDBX when it is not already open.
4. Copies each selected object into the current model space or paper space.
5. Applies the Xref transformation matrix so the copied objects retain their displayed position, scale, rotation, and orientation.
6. Asks whether the selected source objects should be deleted from the Xref DWG.
7. If deletion is confirmed, deletes the source objects, saves the Xref source DWG, and reloads the reference in the current drawing.
8. If deletion is declined, leaves the source Xref unchanged and keeps the new copies in the current drawing.

The page must not claim that the routine copies objects into an Xref. The referenced Lee Mac page is an organizational and explanatory analogue only.

## Installation and Invocation

The installation section must cover both a one-session load and optional automatic loading:

1. Download `XRef2Current.lsp` to a trusted local folder.
2. In AutoCAD, run `APPLOAD`.
3. Browse to the file, select it, and choose `Load`.
4. Optionally add the file to `Startup Suite` in the APPLOAD dialog to load it for future sessions.
5. Return to the drawing and enter `X2C` at the command line.

The page must note that AutoCAD security settings may require the folder to be included in `TRUSTEDPATHS` or approved through the displayed security prompt.

## Safety Warning

When the user chooses to delete copied objects from the Xref source:

- the external DWG is modified and saved;
- the modification cannot be reversed with Undo in the current host drawing;
- users should save or back up the source DWG before using deletion on production files;
- choosing `No` is the safe default and leaves the Xref source objects unchanged.

## License Terms

The page and LISP header use the same meaning:

- proprietary software by Ivaneiko Volodymyr;
- free use in personal and commercial projects;
- no resale as another product;
- no public republication without written permission;
- no modified redistribution under the original name;
- provided `as is`, without warranties;
- `© 2026 Ivaneiko Volodymyr. Усі права захищені.`

## Verification

Add or update focused tests covering:

- category order: `AutoCAD Lisp` immediately follows `Revit плагіни`;
- category typing and fallback icon registration;
- the catalog card's internal `/products/xref-to-current` URL;
- product lookup and static route generation;
- rendering of `X2C`, compatibility facts, download link, installation steps, warning, and copyright;
- omission of the screenshot section when screenshots are absent;
- preservation of the existing Revit product labels and links;
- the downloadable `.lsp` file and its author, copyright, version, and command header.

Run:

```bash
npm test
npm run typecheck
npm run build
```

Finally, start the local site and visually verify the new category and product page at desktop and mobile widths.
