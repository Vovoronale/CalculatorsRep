# Design Spec: Engineering Shell Redesign

Date: 2026-04-22
Project: `construction-calculators-hub`
Status: Approved for planning

## Context

The current site already exposes the calculator catalog, calculator detail pages, and the author profile, but the visual system is still panel-heavy and reads more like a soft editorial layout than a strict engineering tool. The user wants the interface rebuilt from scratch with a more technical character.

The approved direction is not a marketing landing page and not a generic SaaS dashboard. It should read as a practical engineering catalog where the calculator tree stays visible on the left and the main working area stays on the right.

## Goals

- Rebuild the site around a strict engineering visual language.
- Keep calculators visible in a persistent left-side catalog rail on desktop.
- Make the homepage feel like the entry point into a working tools directory, not a promo page.
- Unify the homepage, calculator detail routes, and `/author` into one shell system.
- Reduce card-like surfaces and rely instead on typography, spacing, separators, and layout.
- Preserve current calculator routes, hash-based category behavior, and embed or external open behavior.

## Non-goals

- No change to the calculator data model unless required for presentation.
- No functional rewrite of calculator routes or calculator metadata.
- No dark-mode redesign.
- No decorative hero-first landing page treatment.
- No additional product sections beyond the existing site scope.

## Approved Product Direction

### Visual thesis

The interface should feel like a digital engineering index: bright, exact, measured, and systematic.

Core visual traits:

- calm light background
- strong dark text
- thin structural dividers
- one restrained signal accent
- large precise headings
- minimal shadows and almost no soft panel treatment

### Content plan

The approved structure for the experience is:

1. Left catalog rail
2. Main working surface
3. Focused detail area for the current route
4. Minimal service footer or closing note where needed

This keeps the browsing model obvious across all pages.

### Interaction thesis

Motion should stay restrained and functional:

- a quick page entrance reveal
- clear active-state movement for category or calculator selection
- subtle sticky behavior for the left rail on desktop

Motion must sharpen orientation, not decorate the page.

## Information Architecture

### Shell model

The site should use one shared shell language across the main routes:

- homepage `/`
- calculator detail pages `/calculator/[slug]`
- author page `/author`

Desktop composition:

- left column: brand, utility navigation, categories, calculator list
- right column: route-specific content

Mobile composition:

- left rail collapses into a stacked top section
- brand and navigation first
- categories second
- calculator list third
- main content follows below

The mobile layout must preserve the same hierarchy rather than inventing a different experience.

## Homepage

The homepage is no longer a centered catalog page. It becomes the default shell view.

### Left column on homepage

The left side should contain:

- brand
- concise descriptive line about the catalog
- utility links
- category navigation
- calculators for the active category

The left column is the site's operating index. It should remain visible while the right side changes.

### Right column on homepage

The right side should contain:

- a concise engineering-oriented intro
- the active category title and note
- the currently visible calculators rendered as a strict vertical list
- a secondary route into `/author`

This right area should still feel catalog-first. The author link is secondary and should not compete with the tools.

## Calculator detail page

The calculator detail page keeps the same left rail intact.

### Left column behavior

- active category remains highlighted
- active calculator is visible and highlighted in the list
- switching context should still feel like moving within the same tools directory

### Right column behavior

The right side becomes the calculator work area:

- technical heading
- short utility description
- use-case list
- primary actions
- embedded calculator frame or external-launch fallback

The embed area should take clear priority and feel like the working surface.

## Author page

The `/author` page should also live inside the same shell structure.

### Left column

The same structural shell remains visible to preserve continuity across the site.

### Right column

The content area becomes a restrained profile layout with:

- strong title block
- short professional summary
- work directions
- project categories
- AI assistants
- closing positioning note

The author page should feel like part of the same engineering platform, not a separate promo site.

## Layout Rules

### Left catalog rail

The left rail should feel technical, not decorative.

Rules:

- use separators, not card stacks
- keep rhythm vertical and tight enough for scanning
- use one strong active marker
- prioritize legibility over ornament
- allow sticky positioning on desktop if it improves navigation stability

Category controls should no longer read as soft chips. They should read as section selectors in a technical index.

Calculator items in the rail should also be plain and clear:

- title first
- short descriptor second if needed
- active item unmistakable

### Main content surface

The right content surface should feel open and structured.

Rules:

- avoid heavy boxed containers
- use large headings with short supporting copy
- separate regions with spacing and rules, not repeated cards
- keep reading width controlled for text blocks
- give embedded tools enough vertical space to feel usable

## Visual Language

### Typography

Typography should carry the hierarchy more than surface styling.

Rules:

- make the product name and active page heading the loudest text
- use a technical, controlled display voice without becoming futuristic gimmick
- keep supporting copy brief and practical
- rely on size, case, spacing, and contrast rather than badges everywhere

### Color

Use a light engineering palette:

- pale structural background
- darker neutral text
- muted secondary text
- one accent used for active state and primary action

Do not introduce a multicolor system.

### Surfaces

The current soft panels should be reduced or removed.

Approved direction:

- thin borders and dividers
- large open sections
- almost flat surfaces
- subtle shadows only if necessary for embedded regions

### Cards

Cards are not the default UI language. They can remain only where the interaction truly needs a bounded surface.

This especially means:

- no homepage card mosaic
- no hero cards
- no soft stacked author cards as the main composition language

## Interaction Rules

### Category switching

- category change updates the visible calculator set immediately
- current hash behavior may stay in place on the homepage
- state change should be obvious but quiet

### Calculator navigation

- clicking a calculator from the left rail opens its detail route
- returning to the homepage should preserve category context when possible
- users should never lose their orientation inside the catalog tree

### External vs embedded tools

- embedded calculators stay in the main work region
- external calculators still open through a clear explicit action
- the fallback state should read as intentional, not broken

## Content Strategy

### Voice

The copy should be utility-first and engineering-oriented.

Prefer:

- concise headings
- practical descriptions
- direct naming of use cases
- minimal promotional language

Avoid:

- vague inspiration copy
- generic SaaS terminology
- over-explaining the interface

### Homepage emphasis

The homepage must emphasize tool discovery over narrative reading.

### Author page emphasis

The author page may be more descriptive, but it should still remain structured and restrained.

## Implementation Scope

### Primary files

- `components/calculator-shell.tsx`
- `app/globals.css`
- `app/page.tsx`
- `app/calculator/[slug]/page.tsx`
- `app/author/page.tsx`
- `lib/site-content.ts` if copy needs adjustment for the new shell

### Expected component work

- rebuild shell layout into a two-column engineering structure
- move calculator discovery into the left rail
- restyle category and calculator selection states
- refactor the right content area for homepage and detail modes
- align author page to the same shell language

## Testing Strategy

Verify:

- homepage renders with the left catalog rail and right content area
- category switching still works from the homepage
- calculator detail pages keep the left navigation context visible
- active calculator and active category states are clear
- `/author` remains reachable and uses the same shell system
- desktop and mobile layouts preserve hierarchy and usability
- existing embed and external calculator behavior still works

## Risks

- The current component structure centers much of the experience in `CalculatorShell`, so layout refactoring may affect multiple routes at once.
- A stricter layout can become too dense on mobile if the left rail is not carefully restacked.
- Removing too many visible surface boundaries could weaken scanning if typography and spacing are not strong enough.

## Acceptance Criteria

- The site reads as a strict engineering tools platform rather than a soft editorial catalog.
- On desktop, calculators are visible in a persistent left-side rail.
- The homepage uses the same shell as the calculator detail routes and `/author`.
- The right side becomes the route-specific working area.
- The visual system relies primarily on hierarchy, dividers, and typography instead of card-heavy panels.
- Category switching, calculator routing, and embed or external behavior continue to work.
- The mobile layout preserves the same information hierarchy in stacked form.
