# DBN e-construction Links Design

Date: 2026-06-20

Status: Approved design

## Goal

Add a direct external action from every normative-reference card that contains DBN scan fragments to the corresponding DBN document page on the official e-construction portal.

## Scope

The change covers the existing normative-reference cards in these four calculators:

- `steel-structure-category-group`;
- `soil-design-resistance`;
- `concrete-cover-durability`;
- `residential-yard-areas`.

The registry must contain the five documents used by those cards:

- ДБН В.2.6-198:2014;
- ДБН В.2.1-10-2009;
- ДБН В.2.6-98:2009;
- ДБН Б.2.2-12:2019;
- ДБН В.2.3-15:2007.

Calculators and normative sections without DBN scan fragments are outside this change.

## User experience

Each normative-reference card renders exactly one action labeled `Відкрити ДБН на e-construction`.

The action appears after the card heading and explanatory text, when present, and before the first `Скан фрагмента ДБН` disclosure. A card with multiple scan disclosures still renders only one action. Cards that refer to the same DBN intentionally repeat the same document action.

The action opens the direct e-construction document-detail page in a new browser tab. It uses `target="_blank"` and `rel="noopener noreferrer"` so the calculator and its entered values remain available in the original tab.

The action is styled as a compact secondary link-button with an external-link icon. Its text remains readable without the icon, it wraps safely on narrow screens, and it uses the same presentation in all four calculators.

## Architecture

Create one typed DBN link registry shared by the four calculators. Registry keys represent the five DBN documents in scope, and registry values are direct `https://e-construction.gov.ua/laws_detail/...` document-detail URLs.

Every stored URL must be verified before being added:

1. the request returns a successful response;
2. the e-construction page title identifies the exact DBN designation;
3. the target is a document-detail page rather than a search-results page or a direct PDF download.

Create one shared presentational component that accepts only a registry key. The component resolves the URL and owns the visible label, external-link icon, new-tab attributes, and shared class name. A TypeScript union derived from the registry prevents unsupported document keys from being passed by a calculator.

The existing calculator-specific normative-card and scan markup remains in place. Each card supplies the appropriate DBN key to the shared component; no calculation, report, internal citation anchor, scan path, or disclosure behavior changes.

## Failure behavior

There is no runtime fallback to a search page. Missing or misspelled registry keys are compile-time errors. If an official direct page cannot be verified for a document, implementation stops for that document rather than shipping a guessed URL.

External portal availability after deployment is outside the static site's control. The local action remains rendered because the verified URL is static and the portal owns any later availability messaging.

## Testing

Follow test-driven development:

1. Add failing component tests that assert one action per normative-reference card in each of the four calculators.
2. Assert the expected direct URL for every document represented by a card.
3. Assert the shared label, `target="_blank"`, and `rel="noopener noreferrer"`.
4. Preserve the existing scan-count, image-source, disclosure, and internal citation-anchor assertions.
5. Run the focused Vitest files, the relevant full test suite, `npm run typecheck`, and `npm run build`.

Expected action counts are determined by the current normative sections: six steel cards, six soil-resistance cards, seven concrete-cover cards, and four residential-yard cards, for 23 actions total.

## Non-goals

- Deep-linking to an exact paragraph or table inside e-construction.
- Replacing or removing local DBN scan images.
- Adding links to report steps, field descriptions, catalog cards, or calculators without scan fragments.
- Generalizing every normative-reference section in the repository.
- Changing calculation algorithms, report contracts, formulas, warnings, or DOCX output.
