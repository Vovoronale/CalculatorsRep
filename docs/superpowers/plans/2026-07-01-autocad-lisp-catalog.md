# AutoCAD LISP Catalog and XRef2Current Product Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the supplied XRef2Current AutoLISP routine in a new `AutoCAD Lisp` catalog section with a downloadable, fully documented product page and Ivaneiko Volodymyr's proprietary rights notice.

**Architecture:** Reuse the existing `products` content pipeline and `/products/[slug]` route, extending its schema with optional facts, usage, warning, screenshots, and product-neutral download labels. Register the LISP as a product-mode catalog item, keep its source under `public/downloads`, and render every page section from `data/content.json` so future LISP utilities can follow the same pattern.

**Tech Stack:** Next.js App Router with static export, React, TypeScript, JSON-driven content, Vitest and Testing Library, lucide-react, Sharp-generated catalog artwork.

**Design source:** `docs/superpowers/specs/2026-07-01-autocad-lisp-catalog-design.md`

---

## File Structure

- Create `public/downloads/autocad-lisp/XRef2Current.lsp` — downloadable routine with the approved author, copyright, license, version, and command header.
- Modify `data/content.json` — add the category, catalog card, product page copy, generalized Revit download labels, facts, usage, warning, installation, and license content.
- Modify `lib/calculators.ts` — add the `autocad-lisp` category slug.
- Modify `lib/icons.ts` — register and use `Code2` for the new category and catalog item.
- Modify `scripts/generate-construction-urban-icons.mjs` — define the `xref-to-current` artwork and produce its PNG.
- Create `public/calculator-icons/xref-to-current.png` — generated 512×512 catalog artwork.
- Modify `lib/products.ts` — generalize downloads and add optional product sections.
- Modify `lib/calculators.test.ts` — cover category order, catalog registration, product routing, and generated artwork invariants.
- Modify `lib/products.test.ts` — cover the LISP asset, content model, exact download, facts, license, and Revit regression.
- Modify `components/product-view.tsx` — conditionally render facts, screenshots, usage, warning, and product-neutral downloads.
- Modify `components/product-view.test.tsx` — verify LISP page section order and preserve the Revit page.
- Modify `app/globals.css` — style product facts and the safety warning within the existing responsive product layout.
- Modify `app/products/[slug]/page.test.tsx` — cover the new static route and metadata.
- Modify `app/calculator/[slug]/page.test.tsx` — ensure the product-mode LISP is excluded from calculator detail routes.
- Modify `components/search-input.test.tsx` — ensure search opens the internal LISP product page.
- Modify `app/sitemap.test.ts` — explicitly assert the new product URL.
- Modify `docs/content-editing.md` — document the reusable product-page fields and local-download convention.

---

### Task 1: Publish the Licensed LISP Asset

**Files:**
- Create: `public/downloads/autocad-lisp/XRef2Current.lsp`
- Test: `lib/products.test.ts`

- [ ] **Step 1: Write the failing asset test**

Add Node filesystem imports and this test to `lib/products.test.ts`:

```ts
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

it("publishes the licensed XRef2Current source", () => {
  const lispPath = join(
    process.cwd(),
    "public",
    "downloads",
    "autocad-lisp",
    "XRef2Current.lsp",
  );

  expect(existsSync(lispPath)).toBe(true);

  const source = readFileSync(lispPath, "utf8");
  expect(source).toContain("Program: XRef to Current Drawing");
  expect(source).toContain("Filename: XRef2Current.lsp");
  expect(source).toContain("Command: X2C");
  expect(source).toContain("Version: 1.0");
  expect(source).toContain("Author: Ivaneiko Volodymyr");
  expect(source).toContain(
    "Copyright (c) 2026 Ivaneiko Volodymyr. All rights reserved.",
  );
  expect(source).toContain("(defun c:x2c");
});
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```bash
npm test -- lib/products.test.ts
```

Expected: FAIL because `public/downloads/autocad-lisp/XRef2Current.lsp` does not exist.

- [ ] **Step 3: Create the downloadable file without changing its program logic**

Copy the complete contents of:

```text
C:\Users\Xtyna\.codex\attachments\66731c0d-9bb6-417e-a3bc-4fe50a0edd5e\pasted-text.txt
```

to `public/downloads/autocad-lisp/XRef2Current.lsp`, and prepend this exact comment header before the existing title block:

```lisp
;;----------------------------------------------------------------------;;
;; Program: XRef to Current Drawing                                    ;;
;; Filename: XRef2Current.lsp                                          ;;
;; Command: X2C                                                        ;;
;; Version: 1.0                                                        ;;
;; Author: Ivaneiko Volodymyr                                          ;;
;; Copyright (c) 2026 Ivaneiko Volodymyr. All rights reserved.         ;;
;;                                                                      ;;
;; Proprietary license: free use is permitted in personal and          ;;
;; commercial projects. Resale, public republication without written  ;;
;; permission, and distribution of modified versions under the         ;;
;; original name are prohibited.                                       ;;
;;                                                                      ;;
;; This software is provided "as is", without warranty of any kind.    ;;
;; The user is solely responsible for the results of its use.           ;;
;;----------------------------------------------------------------------;;
```

Do not rename `c:x2c`, alter prompts, or change the copy/delete/ObjectDBX logic.

- [ ] **Step 4: Run the focused test and confirm it passes**

Run:

```bash
npm test -- lib/products.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit the asset and test**

```bash
git add lib/products.test.ts public/downloads/autocad-lisp/XRef2Current.lsp
git commit -m "feat: publish XRef2Current LISP source"
```

---

### Task 2: Register the AutoCAD LISP Catalog Section and Card

**Files:**
- Modify: `lib/calculators.test.ts:22-68`
- Modify: `lib/calculators.ts:3-22`
- Modify: `lib/icons.ts:1-110`
- Modify: `data/content.json:473-484`
- Modify: `data/content.json:1903-1931`
- Modify: `scripts/generate-construction-urban-icons.mjs:10-26`
- Modify: `scripts/generate-construction-urban-icons.mjs:365-383`
- Create: `public/calculator-icons/xref-to-current.png`

- [ ] **Step 1: Write the failing category and card tests**

Insert `"autocad-lisp"` immediately after `"revit-plaginy"` in the expected category slug array. Add this test after the Revit registration test:

```ts
it("registers XRef2Current immediately after the Revit plugin category", () => {
  const categorySlugs = calculatorCategories.map((category) => category.slug);
  const revitIndex = categorySlugs.indexOf("revit-plaginy");
  const category = calculatorCategories.find(
    (item) => item.slug === "autocad-lisp",
  );
  const calculator = getCalculatorBySlug("xref-to-current");

  expect(categorySlugs[revitIndex + 1]).toBe("autocad-lisp");
  expect(category).toMatchObject({
    title: "AutoCAD Lisp",
    icon: "Code2",
  });
  expect(getCalculatorsForCategory("autocad-lisp").map((item) => item.slug)).toEqual([
    "xref-to-current",
  ]);
  expect(calculator).toMatchObject({
    title: "XRef to Current Drawing (X2C)",
    mainCategory: "autocad-lisp",
    extraCategories: [],
    displayMode: "product",
    openUrl: "/products/xref-to-current",
    standard: "AutoCAD for Windows",
  });
  expect(getCalculatorCatalogHref(calculator!)).toBe("/products/xref-to-current");
  expect(calculatorPageCalculators).not.toContainEqual(calculator);
});
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```bash
npm test -- lib/calculators.test.ts
```

Expected: FAIL because `autocad-lisp` and `xref-to-current` are not registered.

- [ ] **Step 3: Add the category slug, icon, category, and product-mode card**

Add the slug to `CategorySlug` in `lib/calculators.ts`:

```ts
  | "revit-plaginy"
  | "autocad-lisp"
  | "ai-instrumenty"
```

Import `Code2` immediately after `BrickWall`, register it immediately after `BrickWall`, and add the fallback:

```ts
import {
  BrickWall,
  Code2,
  BookOpen,
} from "lucide-react";

export const iconRegistry: Record<string, LucideIcon> = {
  BrickWall,
  Code2,
  BookOpen,
};

const FALLBACK_CATEGORY_ICONS: Record<CategorySlug, LucideIcon> = {
  "revit-plaginy": Box,
  "autocad-lisp": Code2,
  "ai-instrumenty": Bot,
  "asystenty-dbn": Bot,
};
```

Retain every other existing import, registry entry, and fallback mapping unchanged.

Add this category immediately after `revit-plaginy` in `data/content.json`:

```json
{
  "slug": "autocad-lisp",
  "title": "AutoCAD Lisp",
  "note": "AutoLISP-утиліти для автоматизації роботи в Autodesk AutoCAD.",
  "icon": "Code2"
}
```

Add this calculator immediately after `revit-screenshot-plugin`:

```json
{
  "slug": "xref-to-current",
  "title": "XRef to Current Drawing (X2C)",
  "shortDescription": "Копіювання вибраних вкладених об’єктів із Xref у поточне креслення зі збереженням їхнього видимого положення, масштабу та повороту.",
  "description": "AutoCAD LISP переносить вибрані об’єкти із зовнішнього DWG-посилання в поточний простір креслення та за підтвердженням може видалити оригінали з вихідного Xref.",
  "mainCategory": "autocad-lisp",
  "extraCategories": [],
  "displayMode": "product",
  "accessLabel": "Сторінка LISP",
  "openUrl": "/products/xref-to-current",
  "order": 34,
  "editorialLabel": "Новий",
  "useCases": [
    "Копіювання геометрії з Xref",
    "Перенесення вибраних об’єктів у поточний DWG",
    "Контрольоване видалення об’єктів із вихідного Xref"
  ],
  "tags": [
    "AutoCAD",
    "AutoLISP",
    "Xref"
  ],
  "tools": [
    "Autodesk AutoCAD"
  ],
  "icon": "Code2",
  "standard": "AutoCAD for Windows"
}
```

- [ ] **Step 4: Add and generate the catalog artwork**

Add an AutoCAD palette to `scripts/generate-construction-urban-icons.mjs`:

```js
autocad: { fill: "#A9473D", text: "#FFFFFF", stroke: "#713029" },
```

Add this icon definition after `revit-screenshot-plugin`:

```js
{
  slug: "xref-to-current",
  badge: textBadge("X2C", colors.autocad, 238, 68),
  body: `
    <path d="M132 176h264v228H132z" fill="#E4E7E5" stroke="#222729" stroke-width="20"/>
    <path d="M214 230h264v228H214z" fill="#F5F7F6" stroke="#222729" stroke-width="20"/>
    <path d="M166 290h112m-34-34l34 34-34 34" ${stroke}/>
    <path d="M338 344H226m34-34l-34 34 34 34" ${stroke}/>
  `,
},
```

Run:

```bash
node scripts/generate-construction-urban-icons.mjs
```

Expected: the command reports generated 512×512 icons and creates `public/calculator-icons/xref-to-current.png`. Confirm `git status --short` does not show unrelated generated files; if deterministic regeneration touches existing files, verify their content is unchanged before staging only the intended new asset.

- [ ] **Step 5: Run the focused test and confirm it passes**

Run:

```bash
npm test -- lib/calculators.test.ts
```

Expected: PASS, including the category-order, artwork-existence, and generator-coverage assertions.

- [ ] **Step 6: Commit the catalog registration**

```bash
git add data/content.json lib/calculators.ts lib/calculators.test.ts lib/icons.ts scripts/generate-construction-urban-icons.mjs public/calculator-icons/xref-to-current.png
git commit -m "feat: add AutoCAD LISP catalog section"
```

---

### Task 3: Generalize Product Content and Add XRef2Current Copy

**Files:**
- Modify: `lib/products.ts:3-44`
- Modify: `lib/products.test.ts:6-49`
- Modify: `data/content.json:1932-2053`
- Modify: `components/product-view.tsx:92-136`
- Modify: `components/product-view.test.tsx:59-81`

- [ ] **Step 1: Write failing product-content tests**

Update the Revit download expectation to the product-neutral shape and add the XRef2Current test:

```ts
it("provides explicit accessible Revit download labels", () => {
  expect(getProductBySlug("revit-screenshot")?.downloads).toEqual([
    {
      label: "Revit 2024",
      ctaLabel: "Завантажити для Revit 2024",
      ariaLabel: "Завантажити для Revit 2024",
      href: "https://dbnassistant.com/downloads/revit-screenshot/RevitScreenshot-2024.zip",
    },
    {
      label: "Revit 2025",
      ctaLabel: "Завантажити для Revit 2025",
      ariaLabel: "Завантажити для Revit 2025",
      href: "https://dbnassistant.com/downloads/revit-screenshot/RevitScreenshot-2025.zip",
    },
    {
      label: "Revit 2026",
      ctaLabel: "Завантажити для Revit 2026",
      ariaLabel: "Завантажити для Revit 2026",
      href: "https://dbnassistant.com/downloads/revit-screenshot/RevitScreenshot-2026.zip",
    },
  ]);
});

it("loads the XRef2Current product with facts, download, warning, and rights", () => {
  const product = getProductBySlug("xref-to-current");

  expect(product).toMatchObject({
    typeLabel: "AutoCAD LISP",
    title: "XRef to Current Drawing (X2C)",
    factsHeading: "Основні відомості",
    downloadCtaLabel: "Завантажити LISP",
    warningHeading: "Важливе застереження",
  });
  expect(product?.screenshots).toBeUndefined();
  expect(product?.facts).toEqual([
    { label: "Команда", value: "X2C" },
    { label: "Версія", value: "1.0" },
    { label: "Платформа", value: "AutoCAD for Windows" },
    { label: "AutoCAD for Mac", value: "Не підтримується" },
    { label: "AutoCAD LT", value: "Не підтримується" },
  ]);
  expect(product?.downloads).toEqual([
    {
      label: "XRef2Current.lsp",
      ctaLabel: "Завантажити XRef2Current.lsp",
      ariaLabel: "Завантажити XRef2Current.lsp",
      href: "/downloads/autocad-lisp/XRef2Current.lsp",
    },
  ]);
  expect(product?.warningParagraphs?.join(" ")).toContain(
    "не можна скасувати командою Undo",
  );
  expect(product?.licenseTerms).toContain(
    "© 2026 Ivaneiko Volodymyr. Усі права захищені.",
  );
});
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```bash
npm test -- lib/products.test.ts
```

Expected: FAIL because the generalized fields and XRef2Current product do not exist.

- [ ] **Step 3: Generalize the TypeScript product model**

Replace `ProductDownload` and extend `Product` in `lib/products.ts` with these exact types:

```ts
export type ProductDownload = {
  label: string;
  ctaLabel: string;
  ariaLabel: string;
  href: string;
};

export type ProductFact = {
  label: string;
  value: string;
};

export type ProductInstallationStep = {
  title: string;
  description: string;
  code?: string[];
};

export type Product = {
  slug: string;
  typeLabel: string;
  title: string;
  shortDescription: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  downloadCtaLabel: string;
  factsHeading?: string;
  facts?: ProductFact[];
  featuresHeading: string;
  features: string[];
  descriptionHeading: string;
  usageHeading?: string;
  usageSteps?: ProductInstallationStep[];
  warningHeading?: string;
  warningParagraphs?: string[];
  screenshotsHeading?: string;
  screenshotsIntro?: string;
  screenshots?: ProductScreenshot[];
  downloadsHeading: string;
  downloadsIntro: string;
  downloads: ProductDownload[];
  installationHeading: string;
  installationSteps: ProductInstallationStep[];
  licenseHeading: string;
  licenseTerms: string[];
};
```

- [ ] **Step 4: Make the existing Revit downloads product-neutral**

Replace the three Revit download objects in `data/content.json` with:

```json
[
  {
    "label": "Revit 2024",
    "ctaLabel": "Завантажити для Revit 2024",
    "ariaLabel": "Завантажити для Revit 2024",
    "href": "https://dbnassistant.com/downloads/revit-screenshot/RevitScreenshot-2024.zip"
  },
  {
    "label": "Revit 2025",
    "ctaLabel": "Завантажити для Revit 2025",
    "ariaLabel": "Завантажити для Revit 2025",
    "href": "https://dbnassistant.com/downloads/revit-screenshot/RevitScreenshot-2025.zip"
  },
  {
    "label": "Revit 2026",
    "ctaLabel": "Завантажити для Revit 2026",
    "ariaLabel": "Завантажити для Revit 2026",
    "href": "https://dbnassistant.com/downloads/revit-screenshot/RevitScreenshot-2026.zip"
  }
]
```

- [ ] **Step 5: Add the complete XRef2Current product entry**

Append this object to `products` in `data/content.json`:

```json
{
  "slug": "xref-to-current",
  "typeLabel": "AutoCAD LISP",
  "title": "XRef to Current Drawing (X2C)",
  "shortDescription": "AutoCAD LISP для копіювання вибраних вкладених об’єктів із зовнішнього посилання (Xref) у поточне креслення зі збереженням їхнього видимого положення, масштабу та повороту.",
  "description": "Після запуску програма пропонує вибрати вихідний Xref, а потім — потрібні вкладені об’єкти всередині нього. Кожний об’єкт знаходиться за handle у вихідному DWG, копіюється в поточний простір через ActiveX/ObjectDBX і трансформується матрицею вставки Xref, тому зберігає видиме положення, масштаб, поворот та орієнтацію за будь-яких налаштувань UCS і виду. Після завершення вибору програма запитує, чи потрібно видалити оригінали з вихідного Xref. Відповідь No залишає Xref незмінним; відповідь Yes видаляє вибрані об’єкти, зберігає зовнішній DWG і перезавантажує посилання в поточному кресленні.",
  "seoTitle": "XRef to Current Drawing (X2C) — завантажити AutoCAD LISP",
  "seoDescription": "Завантажте XRef2Current.lsp для копіювання вкладених об’єктів із Xref у поточне креслення AutoCAD. Команда X2C, опис роботи та інструкція встановлення.",
  "downloadCtaLabel": "Завантажити LISP",
  "factsHeading": "Основні відомості",
  "facts": [
    { "label": "Команда", "value": "X2C" },
    { "label": "Версія", "value": "1.0" },
    { "label": "Платформа", "value": "AutoCAD for Windows" },
    { "label": "AutoCAD for Mac", "value": "Не підтримується" },
    { "label": "AutoCAD LT", "value": "Не підтримується" }
  ],
  "featuresHeading": "Що робить LISP",
  "features": [
    "Копіює вибрані вкладені об’єкти із зазначеного Xref у поточний model space або paper space.",
    "Зберігає видиме положення, масштаб, поворот і орієнтацію об’єктів через матрицю трансформації Xref.",
    "За окремим підтвердженням видаляє оригінали з вихідного DWG, зберігає його та перезавантажує Xref."
  ],
  "descriptionHeading": "Опис роботи",
  "usageHeading": "Як користуватися",
  "usageSteps": [
    {
      "title": "Крок 1. Запустіть команду",
      "description": "Введіть X2C у командному рядку AutoCAD і натисніть Enter.",
      "code": ["X2C"]
    },
    {
      "title": "Крок 2. Виберіть вихідний Xref",
      "description": "Клацніть зовнішнє DWG-посилання, з якого потрібно скопіювати об’єкти. Програма не прийме звичайний блок або інший тип об’єкта."
    },
    {
      "title": "Крок 3. Виберіть вкладені об’єкти",
      "description": "Послідовно клацайте потрібні об’єкти всередині вибраного Xref. Натисніть Enter, коли вибір завершено."
    },
    {
      "title": "Крок 4. Визначте долю оригіналів",
      "description": "Виберіть No, щоб зберегти об’єкти у вихідному Xref, або Yes, щоб видалити їх із зовнішнього DWG. Безпечне значення за замовчуванням — No.",
      "code": ["No", "Yes"]
    }
  ],
  "warningHeading": "Важливе застереження",
  "warningParagraphs": [
    "Якщо вибрати Yes для видалення оригіналів, програма змінить і збереже зовнішній DWG-файл, а потім перезавантажить Xref. Цю зміну не можна скасувати командою Undo в поточному кресленні.",
    "Перед видаленням об’єктів у робочих файлах збережіть резервну копію вихідного DWG. Вибір No є безпечним значенням за замовчуванням і не змінює Xref."
  ],
  "downloadsHeading": "Завантаження",
  "downloadsIntro": "Збережіть файл LISP у локальну довірену папку та завантажте його в AutoCAD через APPLOAD.",
  "downloads": [
    {
      "label": "XRef2Current.lsp",
      "ctaLabel": "Завантажити XRef2Current.lsp",
      "ariaLabel": "Завантажити XRef2Current.lsp",
      "href": "/downloads/autocad-lisp/XRef2Current.lsp"
    }
  ],
  "installationHeading": "Як встановити LISP в AutoCAD",
  "installationSteps": [
    {
      "title": "Крок 1. Завантажте файл",
      "description": "Збережіть XRef2Current.lsp у постійній локальній папці, якій ви довіряєте.",
      "code": ["XRef2Current.lsp"]
    },
    {
      "title": "Крок 2. Відкрийте APPLOAD",
      "description": "У командному рядку AutoCAD введіть APPLOAD і натисніть Enter.",
      "code": ["APPLOAD"]
    },
    {
      "title": "Крок 3. Завантажте LISP",
      "description": "У діалозі Load/Unload Applications знайдіть XRef2Current.lsp, виберіть файл і натисніть Load. Якщо AutoCAD блокує файл, підтвердьте довіру або додайте його папку до TRUSTEDPATHS.",
      "code": ["TRUSTEDPATHS"]
    },
    {
      "title": "Крок 4. За потреби додайте в автозавантаження",
      "description": "Щоб LISP завантажувався в наступних сеансах, у вікні APPLOAD додайте XRef2Current.lsp до Startup Suite."
    },
    {
      "title": "Крок 5. Запустіть програму",
      "description": "Поверніться до креслення, введіть X2C у командному рядку та натисніть Enter.",
      "code": ["X2C"]
    }
  ],
  "licenseHeading": "Ліцензійні умови",
  "licenseTerms": [
    "Тип ліцензії: пропрієтарна. Автор і правовласник — Ivaneiko Volodymyr.",
    "Дозволено безоплатне використання програми у персональних і комерційних проєктах.",
    "Заборонено продавати програму як власний продукт, публічно перевикладати файл без письмового дозволу автора або розповсюджувати модифіковані версії під оригінальною назвою.",
    "Програма надається за принципом «як є», без будь-яких гарантій. Користувач самостійно відповідає за результати її використання та зміни у файлах креслень.",
    "© 2026 Ivaneiko Volodymyr. Усі права захищені."
  ]
}
```

- [ ] **Step 6: Keep the existing Revit view type-safe and product-neutral**

In `components/product-view.tsx`, make the current screenshot iteration safe before the complete conditional rendering in Task 4:

```tsx
{(product.screenshots ?? []).map((screenshot) => (
  <figure key={screenshot.src} className="product-screenshot">
    <Image
      src={screenshot.src}
      alt={screenshot.alt}
      width={screenshot.width}
      height={screenshot.height}
      sizes="(max-width: 720px) 100vw, 460px"
    />
    <figcaption>{screenshot.caption}</figcaption>
  </figure>
))}
```

Replace the hard-coded Revit download card with the generalized fields:

```tsx
{product.downloads.map((download) => (
  <a
    key={download.href}
    className="product-download-card"
    href={download.href}
    aria-label={download.ariaLabel}
  >
    <span>{download.label}</span>
    <strong>
      <Download aria-hidden size={17} />
      {download.ctaLabel}
    </strong>
  </a>
))}
```

In `components/product-view.test.tsx`, update the existing Revit assertions:

```ts
for (const download of product.downloads) {
  expect(
    within(downloads).getByRole("link", { name: download.ariaLabel }),
  ).toHaveAttribute("href", download.href);
}

for (const screenshot of product.screenshots ?? []) {
  expect(screen.getByRole("img", { name: screenshot.alt })).toBeInTheDocument();
}
```

In `lib/products.test.ts`, make the existing screenshot-description test compatible with optional galleries:

```ts
const altTexts = product?.screenshots?.map((screenshot) => screenshot.alt) ?? [];
```

- [ ] **Step 7: Run the focused tests and confirm they pass**

Run:

```bash
npm test -- lib/products.test.ts components/product-view.test.tsx
```

Expected: PASS.

- [ ] **Step 8: Commit the product model and content**

```bash
git add data/content.json lib/products.ts lib/products.test.ts components/product-view.tsx components/product-view.test.tsx
git commit -m "feat: add XRef2Current product content"
```

---

### Task 4: Render Generic Product Facts, Usage, Warnings, and Downloads

**Files:**
- Modify: `components/product-view.test.tsx:37-93`
- Modify: `components/product-view.tsx:64-167`
- Modify: `app/globals.css:5854-6083`

- [ ] **Step 1: Add the failing LISP page test**

Add this test to `components/product-view.test.tsx`:

```ts
it("renders the LISP facts, workflow, warning, download, and license without screenshots", () => {
  const product = getProductBySlug("xref-to-current");
  expect(product).toBeDefined();

  render(<ProductView product={product!} />);

  expect(
    screen.getByRole("heading", { level: 1, name: "XRef to Current Drawing (X2C)" }),
  ).toBeInTheDocument();
  expect(
    screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent),
  ).toEqual([
    "Основні відомості",
    "Що робить LISP",
    "Опис роботи",
    "Як користуватися",
    "Важливе застереження",
    "Завантаження",
    "Як встановити LISP в AutoCAD",
    "Ліцензійні умови",
  ]);
  const facts = screen.getByRole("region", { name: "Основні відомості" });
  expect(within(facts).getByText("X2C").tagName).toBe("CODE");
  expect(screen.queryByRole("heading", { name: /Скріншоти/ })).not.toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: "Завантажити XRef2Current.lsp" }),
  ).toHaveAttribute("href", "/downloads/autocad-lisp/XRef2Current.lsp");
  expect(screen.getByRole("note")).toHaveTextContent(
    "не можна скасувати командою Undo",
  );
  expect(
    screen.getByText("© 2026 Ivaneiko Volodymyr. Усі права захищені."),
  ).toBeVisible();
});
```

- [ ] **Step 2: Run the focused component test and confirm it fails**

Run:

```bash
npm test -- components/product-view.test.tsx
```

Expected: FAIL because ProductView still requires screenshots and hard-codes Revit download text.

- [ ] **Step 3: Render facts immediately after the hero**

Insert this conditional block after `</header>` in `components/product-view.tsx`:

```tsx
{product.factsHeading && product.facts?.length ? (
  <section className="product-section" aria-labelledby="product-facts-heading">
    <h2 id="product-facts-heading">{product.factsHeading}</h2>
    <dl className="product-facts">
      {product.facts.map((fact) => (
        <div key={fact.label} className="product-fact">
          <dt>{fact.label}</dt>
          <dd>{fact.label === "Команда" ? <code>{fact.value}</code> : fact.value}</dd>
        </div>
      ))}
    </dl>
  </section>
) : null}
```

- [ ] **Step 4: Render usage and warning after the description**

Insert these conditional blocks after the description section:

```tsx
{product.usageHeading && product.usageSteps?.length ? (
  <section className="product-section" aria-labelledby="product-usage-heading">
    <h2 id="product-usage-heading">{product.usageHeading}</h2>
    <ol className="product-installation-list">
      {product.usageSteps.map((step) => (
        <li key={step.title}>
          <h3>{step.title}</h3>
          <p>{step.description}</p>
          {step.code ? (
            <div className="product-code-list">
              {step.code.map((value) => <code key={value}>{value}</code>)}
            </div>
          ) : null}
        </li>
      ))}
    </ol>
  </section>
) : null}

{product.warningHeading && product.warningParagraphs?.length ? (
  <section
    className="product-section product-warning"
    aria-labelledby="product-warning-heading"
    role="note"
  >
    <h2 id="product-warning-heading">{product.warningHeading}</h2>
    {product.warningParagraphs.map((paragraph) => (
      <p key={paragraph}>{paragraph}</p>
    ))}
  </section>
) : null}
```

- [ ] **Step 5: Make screenshots conditional**

Wrap the existing screenshot section in:

```tsx
{product.screenshotsHeading && product.screenshotsIntro && product.screenshots?.length ? (
  <section className="product-section" aria-labelledby="product-screenshots-heading">
    <div className="product-section__intro">
      <h2 id="product-screenshots-heading">{product.screenshotsHeading}</h2>
      <p>{product.screenshotsIntro}</p>
    </div>
    <div className="product-screenshot-grid">
      {product.screenshots.map((screenshot) => (
        <figure key={screenshot.src} className="product-screenshot">
          <Image
            src={screenshot.src}
            alt={screenshot.alt}
            width={screenshot.width}
            height={screenshot.height}
            sizes="(max-width: 720px) 100vw, 460px"
          />
          <figcaption>{screenshot.caption}</figcaption>
        </figure>
      ))}
    </div>
  </section>
) : null}
```

- [ ] **Step 6: Add responsive facts and warning styles**

Add these rules near the existing product styles in `app/globals.css`:

```css
.product-facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 0;
}

.product-fact {
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface);
}

.product-fact dt {
  margin-bottom: 6px;
  color: var(--text-subtle);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.product-fact dd {
  margin: 0;
  color: var(--text);
  line-height: 1.5;
}

.product-fact code {
  font-family: var(--font-mono), monospace;
  font-weight: 700;
}

.product-warning {
  margin-top: 32px;
  padding: 28px;
  border: 1px solid color-mix(in srgb, #f97316 34%, var(--border));
  border-radius: var(--radius-md);
  background: color-mix(in srgb, #f97316 10%, var(--bg));
}

.product-warning > p {
  max-width: none;
}
```

These colors intentionally reuse the existing `.native-calculator__status--warning` palette. Extend the mobile grid selector as follows:

```css
.product-facts,
.product-feature-list,
.product-screenshot-grid,
.product-download-grid {
  grid-template-columns: 1fr;
}
```

- [ ] **Step 7: Run the focused component test and confirm it passes**

Run:

```bash
npm test -- components/product-view.test.tsx
```

Expected: PASS for both Revit and XRef2Current rendering.

- [ ] **Step 8: Commit the reusable product rendering**

```bash
git add components/product-view.tsx components/product-view.test.tsx app/globals.css
git commit -m "feat: render AutoCAD LISP product details"
```

---

### Task 5: Complete Static Routing, Search, Sitemap, and Editing Documentation

**Files:**
- Modify: `app/products/[slug]/page.test.tsx:30-60`
- Modify: `app/calculator/[slug]/page.test.tsx:5-11`
- Modify: `components/search-input.test.tsx:9-22`
- Modify: `app/sitemap.test.ts:7-33`
- Modify: `docs/content-editing.md:1-220`

- [ ] **Step 1: Write the route, search, and sitemap regression tests**

Update the static product route expectation:

```ts
expect(generateStaticParams()).toEqual([
  { slug: "revit-screenshot" },
  { slug: "xref-to-current" },
]);
```

Add XRef2Current metadata and rendering assertions:

```ts
it("generates XRef2Current metadata", async () => {
  await expect(
    generateMetadata({ params: Promise.resolve({ slug: "xref-to-current" }) }),
  ).resolves.toMatchObject({
    title: "XRef to Current Drawing (X2C) — завантажити AutoCAD LISP",
    description:
      "Завантажте XRef2Current.lsp для копіювання вкладених об’єктів із Xref у поточне креслення AutoCAD. Команда X2C, опис роботи та інструкція встановлення.",
  });
});

it("renders the XRef2Current product", async () => {
  render(
    await ProductPage({
      params: Promise.resolve({ slug: "xref-to-current" }),
    }),
  );

  expect(screen.getByText("XRef to Current Drawing (X2C)")).toBeInTheDocument();
  expect(notFoundMock).not.toHaveBeenCalled();
});
```

Extend `app/calculator/[slug]/page.test.tsx`:

```ts
expect(params).not.toContainEqual({ slug: "revit-screenshot-plugin" });
expect(params).not.toContainEqual({ slug: "xref-to-current" });
expect(params).toContainEqual({ slug: "soil-design-resistance" });
```

Add this separate test to `components/search-input.test.tsx` so the query starts from a clean render:

```ts
it("links the XRef result to its internal product page", async () => {
  const user = userEvent.setup();
  render(<SearchInput />);

  await user.type(
    screen.getByRole("searchbox", { name: "Пошук калькуляторів" }),
    "XRef",
  );

  expect(
    screen.getByRole("option", { name: /XRef to Current Drawing/ }),
  ).toHaveAttribute("href", "/products/xref-to-current");
});
```

Add this explicit assertion to the sitemap test:

```ts
expect(urls).toContain("https://ivapps.pro/products/xref-to-current");
```

- [ ] **Step 2: Run the focused integration tests**

Run:

```bash
npm test -- app/products/[slug]/page.test.tsx app/calculator/[slug]/page.test.tsx components/search-input.test.tsx app/sitemap.test.ts
```

Expected: PASS with the content from Tasks 2–3 present.

- [ ] **Step 3: Document reusable product pages and local files**

Add a `Product pages` subsection to `docs/content-editing.md` describing:

```markdown
### Сторінки продуктів

`products[]` керує статичними сторінками `/products/<slug>`. Обов’язкові поля задають hero, можливості, опис, завантаження, встановлення та ліцензію. Додаткові блоки:

- `factsHeading` + `facts[]` (`{ label, value }`) — короткий паспорт продукту;
- `usageHeading` + `usageSteps[]` — порядок використання;
- `warningHeading` + `warningParagraphs[]` — важливе застереження;
- `screenshotsHeading`, `screenshotsIntro`, `screenshots[]` — необов’язкова галерея; якщо масиву немає, блок не показується;
- `downloads[]` — `{ label, ctaLabel, ariaLabel, href }`, без припущень про конкретний продукт або його версію.

Для локального завантаження поклади файл у `public/downloads/<group>/` і вкажи URL від кореня сайту, наприклад `/downloads/autocad-lisp/XRef2Current.lsp`. Каталожний запис із `displayMode: "product"` повинен мати `openUrl: "/products/<slug>"`.
```

Also add `products` and `lib/products.ts` to the top-level content table if the current table omits them.

- [ ] **Step 4: Run the focused tests again**

Run:

```bash
npm test -- app/products/[slug]/page.test.tsx app/calculator/[slug]/page.test.tsx components/search-input.test.tsx app/sitemap.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit routes and documentation**

```bash
git add app/products/[slug]/page.test.tsx app/calculator/[slug]/page.test.tsx components/search-input.test.tsx app/sitemap.test.ts docs/content-editing.md docs/superpowers/specs/2026-07-01-autocad-lisp-catalog-design.md
git commit -m "test: cover XRef2Current product discovery"
```

---

### Task 6: Full Verification and Visual QA

**Files:**
- Verify: all files changed in Tasks 1–5

- [ ] **Step 1: Run the complete test suite**

Run:

```bash
npm test
```

Expected: all Vitest suites pass.

- [ ] **Step 2: Run the required type check**

Run:

```bash
npm run typecheck
```

Expected: TypeScript exits with code 0 and reports no errors.

- [ ] **Step 3: Run the required production build**

Run:

```bash
npm run build
```

Expected: Next.js static export succeeds and includes `/products/xref-to-current`.

- [ ] **Step 4: Verify exported files**

Run in PowerShell:

```powershell
Test-Path -LiteralPath 'out\products\xref-to-current\index.html'
Test-Path -LiteralPath 'out\downloads\autocad-lisp\XRef2Current.lsp'
Select-String -LiteralPath 'out\downloads\autocad-lisp\XRef2Current.lsp' -Pattern 'Author: Ivaneiko Volodymyr','Command: X2C'
```

Expected: both `Test-Path` calls return `True`, and both header strings are found.

- [ ] **Step 5: Start the site and perform browser QA**

Run:

```bash
npm run dev
```

Using the in-app browser, verify at `http://localhost:3000` and `http://localhost:3000/products/xref-to-current`:

- `AutoCAD Lisp` is immediately below `Revit плагіни` in the catalog rail;
- the category contains `XRef to Current Drawing (X2C)` with its generated artwork;
- the product page sections appear in the approved order;
- `X2C`, compatibility facts, `APPLOAD`, `TRUSTEDPATHS`, warning, and copyright are visible;
- no screenshot heading or empty screenshot gap is rendered;
- the download link resolves to the `.lsp` file;
- the page has no horizontal overflow at 1440×900 and 390×844;
- browser console contains no React, hydration, accessibility, or asset-loading errors.

- [ ] **Step 6: Inspect repository state**

Run:

```bash
git status --short
git log -6 --oneline
git diff --check HEAD~5..HEAD
```

Expected: no uncommitted implementation files remain, the five task commits are visible, and `git diff --check` reports no whitespace errors.
