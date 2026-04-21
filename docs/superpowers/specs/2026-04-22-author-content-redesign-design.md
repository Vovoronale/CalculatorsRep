# Design Spec: Personal Brand Content Redesign for Calculators Catalog

Date: 2026-04-22
Project: `construction-calculators-hub`
Status: Approved for planning

## Context

The existing site already works as a calculators catalog, but its copy and author presentation are too technical and generic. The current content uses the `Vovoronale` name, links to GitHub, and presents side projects as a flat technical list. The user wants the site to stay a calculators catalog while replacing placeholder-like text with real editorial content tied to Volodymyr Ivaneiko's personal brand.

The new positioning is:

- Ivaneiko Volodymyr
- CTO / Head of AI R&D in a project company
- Founder of an EngTech startup
- AI consultant for construction

The homepage must remain calculator-first. The strong personal-brand narrative should live on a dedicated `/author` page.

## Goals

- Replace `Vovoronale` with `Іванейко Володимир`.
- Remove the GitHub link from site navigation.
- Replace technical placeholder copy with real Ukrainian editorial content.
- Keep the homepage as a catalog of calculators.
- Rework the projects area into categories rather than a flat list.
- Add a dedicated `/author` page with a stronger personal-brand presentation.
- Add a separate `ШІ-асистенти` direction and show real links to individual assistants on the author page.
- Add the electrical calculations project from `https://pc.dbnassistant.com`.

## Non-goals

- No redesign of the calculator data model or calculator routes.
- No replacement of the existing calculator shell architecture.
- No change to the calculator category navigation unless needed for copy consistency.
- No broad visual redesign beyond what is needed to support the new content structure.

## Product Decision Summary

### Homepage

The homepage remains a calculator catalog. It should still open into the calculator shell and preserve the current browsing flow across categories and calculator detail pages.

Content changes:

- The top bar uses `Іванейко Володимир` as the author name.
- GitHub is removed from utility navigation.
- `Про автора` points to `/author`.
- Header and workspace copy are rewritten to sound editorial, practical, and construction-focused rather than technical.
- The bottom author block becomes a concise teaser that points users to the author page instead of trying to carry the full personal-brand story on the homepage.

### Author page

The `/author` page becomes the main personal-brand page.

It should communicate:

- CTO / Head of AI R&D leadership positioning
- EngTech founder role
- AI consulting expertise for construction and design organizations
- Product-builder identity grounded in real engineering practice

The tone should be professional and confident, not loud or salesy.

## Information Architecture

### Top navigation

Keep:

- `CadEE.pro`
- `Про автора`

Remove:

- `GitHub`

Behavior:

- `CadEE.pro` remains an external flagship product link.
- `Про автора` routes internally to `/author`.

### Homepage sections

1. Top bar
2. Calculator category sidebar
3. Main calculator intro block
4. Calculator catalog or calculator detail panel
5. Categorized projects overview
6. Short author teaser with CTA to `/author`

### Author page sections

1. Hero block with name and positioning
2. Intro narrative
3. Work directions / expertise areas
4. Categorized products and projects
5. Separate `ШІ-асистенти` section with individual assistant cards and links
6. Final short positioning / collaboration note

## Content Strategy

### Homepage tone

The homepage copy should describe the site as a practical collection of calculators for engineering work, pre-design estimates, and technical preparation. It must avoid terms like:

- shell
- workspace
- surface
- SEO pages
- catalog mechanics language

Preferred style:

- concise
- editorial
- grounded in engineering use
- clearly written in Ukrainian

### Author page tone

The `/author` page should feel like a compact professional profile for a technical leader and product builder in construction tech. It should connect engineering background, AI work, and product development into one coherent narrative.

## Project Categorization

Existing and newly added projects should be reorganized into categories and displayed through those categories instead of a flat list.

### Approved categories

- `Теплотехнічні розрахунки`
- `Інструменти для ПД`
- `Залізобетонні конструкції`
- `Будівельна механіка`
- `Плагіни Revit`
- `Електротехнічні розрахунки`
- `ШІ-асистенти`

### Approved mapping

#### Теплотехнічні розрахунки

- `CadEE.pro`

#### Інструменти для ПД

- `NormControl`
- `IV GeoJSON`
- `Розрахунок класу наслідків`
- `OptCAD`

#### Залізобетонні конструкції

- `ArmCon`

#### Будівельна механіка

- `LiveBeamCalculator`

#### Плагіни Revit

- `Revit Screenshot Plugin`

#### Електротехнічні розрахунки

- `Розрахунок електричних навантажень будівель`

#### ШІ-асистенти

- `DBN Assistant`

## AI Assistants Source of Truth

The site should not invent AI assistant links manually. The approved source is the current `dbnassistant.com` assistants configuration as observed on 2026-04-22.

Individual assistants currently visible there:

1. `ДБН В.2.2-5:2023`  
   `https://chatgpt.com/g/g-679fe1d48b6c8191a2b9b2dc0e38e431-dbn-v-2-2-5-2023`
2. `ДБН В.2.6-31:2021`  
   `https://chatgpt.com/g/g-679f8359022c819185183f9d67dba80e-dbn-v-2-6-31-2021`
3. `ДБН В.1.1-7:2016`  
   `https://chatgpt.com/g/g-679a43e723088191ba0208ec2f058393-dbn-v-1-1-7-2016`
4. `ДБН В.2.2-15:2019`  
   `https://chatgpt.com/g/g-67a9239a7a28819197664b900dcb30e9-dbn-v-2-2-15-2019`
5. `ДБН В.2.5-67:2013`  
   `https://chatgpt.com/g/g-67bb9c7d29e481919219dfe99e246a96-dbn-v-2-5-67-2013`

These links should be rendered as individual cards on `/author`, under the `ШІ-асистенти` section.

## Data Model Changes

### `lib/site-content.ts`

Rewrite content to support:

- new author name
- new brand positioning
- updated utility navigation
- editorial homepage copy
- short author teaser and CTA

### `lib/projects.ts`

Replace the flat product structure with category-aware data.

Recommended shape:

- project category type
- category title
- array of projects within category
- each project keeps title, description, href, and optional short label

Also add:

- `pc.dbnassistant.com` project under `Електротехнічні розрахунки`
- `DBN Assistant` under `ШІ-асистенти`
- individual assistant entries in a dedicated exported collection for `/author`

## UI Component Changes

### `components/calculator-shell.tsx`

Adjust to:

- render updated navigation
- use rewritten content strings
- render categorized project groups on the homepage
- replace the current footer-note author block with a concise teaser and CTA to `/author`

### New route: `app/author/page.tsx`

Add a dedicated author page with:

- strong heading and subheading
- narrative paragraphs
- expertise/directions block
- categorized project sections
- separate AI assistants section

The page can reuse existing shell-adjacent styling conventions where helpful, but should read as a profile page, not as another calculator panel.

## Testing Strategy

Update or add tests to cover:

- homepage shows `Іванейко Володимир`
- GitHub link is absent
- `/author` link is present
- categorized projects render instead of a flat list expectation
- electrical calculations project appears
- author page renders the `ШІ-асистенти` section
- author page includes real links to the current individual assistants

## Implementation Notes

- Preserve the calculator category behavior and hash-based category switching.
- Preserve calculator detail routes and embedding behavior.
- Focus refactoring on content structure and page composition, not calculator functionality.
- Reuse the current project architecture where possible.

## Risks

- Reworking `lib/projects.ts` may require updating component assumptions and tests together.
- Overwriting too much copy in one pass can make the homepage feel like a profile page; maintain calculator-first hierarchy.
- The assistant links may change in the future, so the data structure should make updates straightforward.

## Acceptance Criteria

- The site no longer displays `Vovoronale`.
- The homepage no longer includes a GitHub link.
- The homepage still functions as a calculator catalog.
- Projects are displayed by category.
- The homepage uses real Ukrainian editorial content rather than technical placeholder text.
- `/author` exists and presents Ivaneiko Volodymyr as a technical leader and product builder in construction tech.
- `/author` contains a dedicated `ШІ-асистенти` section with separate links for each current assistant.
- The electrical calculations project from `pc.dbnassistant.com` is included.
