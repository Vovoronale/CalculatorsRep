# Revit Plugin Product Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a reusable static product-page system and publish the first internal download and installation page for Revit Screenshot Plugin.

**Architecture:** Product content lives in a new top-level `products` array in `data/content.json` and is exposed through a focused typed loader. A static `/products/[slug]` App Router route resolves content server-side and renders a reusable client shell that matches the existing application layout. Screenshots are local static assets; versioned ZIP downloads remain direct links to `dbnassistant.com`.

**Tech Stack:** Next.js 15 App Router static export, React 19 server/client components, TypeScript, JSON-driven content, Vitest, Testing Library, `next/image`.

---

### Task 1: Add The Typed Product Content Model

**Files:**
- Create: `lib/products.ts`
- Create: `lib/products.test.ts`
- Modify: `data/content.json`

- [ ] **Step 1: Write failing tests for lookup, versions, screenshots, and internal project URL**

Create `lib/products.test.ts` with assertions that `products` contains `revit-screenshot`, `getProductBySlug("revit-screenshot")` returns it, an unknown slug returns `undefined`, screenshot alt text is non-empty and distinct, and downloads exactly map Revit 2024-2026 to the approved DBN Assistant URLs.

Use `projectCategories` in the new test to require the `bim-tools` Revit project URL to be `/products/revit-screenshot`.

- [ ] **Step 2: Run focused tests and confirm RED**

Run:

```bash
npx vitest run lib/products.test.ts
```

Expected: failure because `lib/products.ts` and `contentData.products` do not exist and the project card still uses the DBN Assistant URL.

- [ ] **Step 3: Add the minimal typed loader and approved content**

Create `lib/products.ts` with exported `ProductScreenshot`, `ProductDownload`, `ProductInstallationStep`, and `Product` types. Export:

```ts
export const products: Product[] = contentData.products as Product[];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((product) => product.slug === slug);
}
```

Add the `revit-screenshot` product entry to `data/content.json` with:

- type label `Revit Plugin`;
- the approved short and full descriptions from the existing page;
- three features;
- four local image paths, captions, and descriptive alt text;
- Revit 2024, 2025, and 2026 download entries with exact external URLs;
- the five installation steps, including inline code fragments represented as structured text segments or explicit `code` arrays;
- the existing IVSoft license text and copyright line;
- SEO title and description.

Change the `bim-tools` project `href` to `/products/revit-screenshot`.

- [ ] **Step 4: Run focused tests and confirm GREEN**

Run the same Vitest command and expect all selected tests to pass.

### Task 2: Build The Reusable Product View

**Files:**
- Create: `components/product-view.tsx`
- Create: `components/product-view.test.tsx`

- [ ] **Step 1: Write a failing rendering test**

Render `ProductView` with the real Revit product and verify:

- one `h1` named `Revit Screenshot Plugin`;
- the seven approved section headings in order;
- a keyboard-accessible downloads anchor;
- three version-specific download links with the exact URLs;
- four images with the approved distinct alt text;
- installation filenames and paths rendered as `code`;
- license terms visible in the document.

Mock only `next/image` as a plain `img` if the test environment requires it; use the real product data and real component behavior.

- [ ] **Step 2: Run the component test and confirm RED**

```bash
npx vitest run components/product-view.test.tsx
```

Expected: failure because `components/product-view.tsx` does not exist.

- [ ] **Step 3: Implement the minimal reusable view**

Create a client `ProductView` following the existing `AuthorView` shell pattern:

- retain `CatalogRail`, `DrawerBackdrop`, `MobileTopBar`, `WorkspaceTopBar`, and `SiteFooter`;
- preserve sidebar collapsed state in `localStorage` under `sidebar:collapsed`;
- add breadcrumbs `Каталог / Продукти / <product title>`;
- render every content section from the typed `Product` prop;
- use `next/image` with intrinsic width/height for screenshots;
- render version links as regular external anchors without `target="_blank"`, so downloads remain in the current tab;
- use semantic `section`, heading, list, figure, figcaption, and code markup.

Keep the view a single client boundary and pass only the matching product from the server route, avoiding data fetching and extra client dependencies.

- [ ] **Step 4: Run the component test and confirm GREEN**

Run the same focused Vitest command and expect it to pass without warnings.

### Task 3: Add Static Product Routing And Metadata

**Files:**
- Create: `app/products/[slug]/page.tsx`
- Create: `app/products/[slug]/page.test.tsx`

- [ ] **Step 1: Write failing route tests**

Test exported route helpers and page behavior:

- `generateStaticParams()` returns `[{ slug: "revit-screenshot" }]`;
- `generateMetadata()` returns the product SEO title and description;
- the page renders `ProductView` for the known slug;
- the unknown slug invokes `notFound()`.

Use a minimal mock for `next/navigation` only to observe `notFound()` and mock `ProductView` only in the page-unit test where route resolution is the subject.

- [ ] **Step 2: Run the route test and confirm RED**

```bash
npx vitest run "app/products/[slug]/page.test.tsx"
```

Expected: failure because the product route does not exist.

- [ ] **Step 3: Implement the static route**

Create the route with:

```ts
export const dynamicParams = false;

export function generateStaticParams() {
  return products.map(({ slug }) => ({ slug }));
}
```

Resolve asynchronous Next.js 15 params in both `generateMetadata` and the default page export. Return the site product name for missing metadata and call `notFound()` for an unknown rendered slug. Render `<ProductView product={product} />` for the known product.

- [ ] **Step 4: Run the route test and confirm GREEN**

Run the same focused Vitest command and expect it to pass.

### Task 4: Add Local Screenshots And Responsive Product Styles

**Files:**
- Create: `public/images/products/revit-screenshot/revit-screenshot-1.png`
- Create: `public/images/products/revit-screenshot/revit-screenshot-2.png`
- Create: `public/images/products/revit-screenshot/revit-screenshot-3.png`
- Create: `public/images/products/revit-screenshot/revit-screenshot-4.png`
- Modify: `app/globals.css`

- [ ] **Step 1: Download and validate the four source screenshots**

Fetch the four files from:

```text
https://dbnassistant.com/img/revit-screenshot/revit-screenshot-1.png
https://dbnassistant.com/img/revit-screenshot/revit-screenshot-2.png
https://dbnassistant.com/img/revit-screenshot/revit-screenshot-3.png
https://dbnassistant.com/img/revit-screenshot/revit-screenshot-4.png
```

Write them to the approved local asset directory. Confirm each response is HTTP 200, has an image content type, and produces a non-empty PNG file. Record intrinsic dimensions for the `next/image` props in the product content.

- [ ] **Step 2: Add product-page styles**

Append one focused `Product page` section to `app/globals.css`. Define styles for:

- `.product-page`, `.product-hero`, `.product-section`;
- primary CTA and download cards using existing tokens;
- two-column screenshot grid with bordered `figure` elements;
- installation step list and inline `code` styling;
- license panel;
- single-column layout and reduced padding below the existing mobile breakpoint.

Use the existing color, border, radius, type, and shadow tokens. Avoid new global tokens and avoid JavaScript-driven layout.

- [ ] **Step 3: Re-run focused tests**

```bash
npx vitest run lib/products.test.ts components/product-view.test.tsx "app/products/[slug]/page.test.tsx"
```

Expected: all selected tests pass.

### Task 5: Verify The Complete Feature

**Files:**
- Modify only files required by failures discovered during verification.

- [ ] **Step 1: Verify external downloads**

Send HEAD requests, falling back to GET when HEAD is unsupported, for all three approved ZIP URLs. Require successful HTTP responses and confirm the content is non-empty.

- [ ] **Step 2: Run the full automated suite**

```bash
npm test
npm run typecheck
npm run build
```

Expected: zero test failures, zero TypeScript errors, and a successful static export containing `/products/revit-screenshot/index.html`.

- [ ] **Step 3: Run visual browser verification**

Start `npm run dev`, open `/products/revit-screenshot`, and verify desktop and mobile widths. Confirm:

- the application shell and breadcrumbs render correctly;
- the CTA jumps to downloads;
- screenshots have no overflow;
- version links expose the expected URLs;
- installation code remains readable;
- light and dark themes remain legible;
- the browser console has no errors.

- [ ] **Step 4: Review the final diff against the design**

Confirm every approved section, text block, image, version, route behavior, project-card URL, accessibility requirement, and verification item is represented. Do not modify or stage unrelated pre-existing worktree changes.
