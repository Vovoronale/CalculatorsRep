# Design Spec: Calculator Catalog Redesign

Date: 2026-04-22
Project: `construction-calculators-hub`
Status: Approved for planning

## Context

The current homepage mixes several roles at once: calculator catalog, author presentation, and product showcase. That weakens the site's main job. The user wants the site to read first and foremost as a catalog of construction calculators where visitors can quickly find the right tool by task type.

The redesign should remove the mixed hierarchy and rebuild the homepage around fast catalog navigation. The author profile remains in the product, but only as a separate page available through navigation.

## Goals

- Make the homepage clearly calculator-first.
- Help users quickly find a calculator by category or task type.
- Remove author and side-product content from the homepage.
- Replace the current heavy panel-based visual style with a lighter editorial utility style.
- Preserve access to individual calculator detail pages and standalone calculator links.
- Keep a separate `/author` page in the same visual system.

## Non-goals

- No change to the calculator data model unless required for presentation.
- No change to calculator routes or embed behavior.
- No expansion of homepage scope into product showcase or personal-brand storytelling.
- No dark visual redesign.

## Product Decision Summary

### Homepage role

The homepage is a working catalog, not a promo page. Its first screen should explain what the site is and immediately expose category-based navigation into the calculator list.

### Primary user flow

The main scenario is:

1. User lands on the homepage.
2. User identifies the relevant task category.
3. User scans a short list of calculators in that category.
4. User opens the needed calculator in one click.

The page should optimize for fast scanning rather than narrative reading.

### Author positioning

Author information must not compete with the catalog on the homepage. It should live on a separate `/author` page linked from navigation or footer.

## Information Architecture

### Homepage sections

1. Compact top bar
2. Hero / quick-entry block
3. Category selector
4. Main calculator catalog list
5. Minimal footer

### Removed from homepage

- Author teaser block
- Other products or project showcase sections
- Secondary promotional content

### Author page

The `/author` page remains available as a separate professional profile page. It should use the same light visual system but stay clearly secondary to the calculator catalog.

## Homepage Structure

### Top bar

The top bar should stay compact and quiet.

Keep:

- site name / brand
- link to `/author`
- optional external flagship link if already part of the product navigation

The top bar must not dominate the first screen.

### Hero / quick-entry block

The first content block should contain:

- a strong catalog title
- one short sentence explaining the purpose of the tools
- the category selector directly in or under the hero

This area should feel like the start of an index or knowledge directory, not a marketing hero.

### Category selector

The category selector should sit near the top of the page, above the catalog list. It should be easy to scan and fast to interact with.

Recommended behavior:

- one active category at a time
- active state clearly visible
- switching category updates the visible list without full page reload
- hash-based deep-linking may remain if already implemented

Recommended layout:

- horizontal row or compact grouped block above the list
- not a dominant left sidebar

### Catalog list

The calculator list is the main content of the homepage and should own most of the page height.

Each catalog item should include:

- calculator title
- one short description explaining what it calculates
- 2-3 short use cases or task cues
- one clear primary action such as `Відкрити калькулятор`

The list should read like a practical directory of tools, not a gallery of product cards.

### Footer

The footer should stay minimal and service-oriented.

Possible contents:

- link to `/author`
- external site link
- short update note if needed

## Visual Direction

### Chosen direction

Approved visual direction: `Editorial utility`

This means:

- light or warm-light background
- dark readable text
- thin separators
- restrained accent color
- strong typography
- very little decorative chrome

The design should feel closer to an editor, document interface, or professional catalog than to a SaaS dashboard.

### Reference qualities to preserve

The approved reference suggests:

- calm, bright interface
- document-like cleanliness
- spacious layout
- readable text rhythm
- subtle lines instead of heavy containers

### Visual rules

- remove dark atmospheric backgrounds, blur, and glass panels
- minimize shadows
- use one restrained warm accent color
- prioritize spacing, typography, and alignment over decorative devices
- keep the first screen calm and immediately legible
- avoid card-heavy composition unless a card is functionally necessary

## Interaction Rules

### Category interaction

- clicking a category updates the calculator list in place
- the change should feel immediate and quiet
- no elaborate transitions or decorative motion
- the active category must remain obvious during scanning

### Calculator detail flow

If a user opens a calculator detail page, they should still be able to return easily to the relevant category in the catalog.

Preserve:

- existing calculator detail routes
- standalone open behavior
- embed behavior where already supported

## Content Strategy

### Homepage copy

Homepage copy should be short, practical, and utility-first.

Avoid:

- personal-brand messaging
- abstract product language
- overly technical UI jargon
- promotional filler

Prefer:

- direct naming of the catalog purpose
- concise descriptions of calculator function
- language tied to real engineering or construction tasks

### Author page copy

The author page may remain more descriptive, but it should still be structured and restrained. It should not feel like a second homepage.

## Implementation Scope

### Likely files to update

- `app/page.tsx`
- `components/calculator-shell.tsx`
- `app/globals.css`
- `lib/site-content.ts`
- optionally `app/author/page.tsx` if visual alignment updates are needed there

### Expected component changes

- simplify homepage composition
- move category navigation out of the dominant sidebar pattern
- remove homepage author/product sections
- restyle the shell around a light editorial system
- keep author-page navigation access intact

## Testing Strategy

Verify:

- homepage emphasizes calculator catalog content first
- homepage no longer renders author teaser or product showcase sections
- category switching still works
- calculator detail navigation still works
- `/author` remains reachable
- responsive layout stays clear on desktop and mobile

## Acceptance Criteria

- The homepage clearly reads as a calculator catalog within the first screen.
- Users can select a category near the top of the page and immediately scan relevant calculators.
- The main content area is dominated by the calculator list, not side panels or secondary sections.
- Author-related content is removed from the homepage and available only on `/author`.
- The visual system is light, clean, restrained, and reference-aligned rather than dark and atmospheric.
- Existing calculator routes and opening behavior continue to work.
