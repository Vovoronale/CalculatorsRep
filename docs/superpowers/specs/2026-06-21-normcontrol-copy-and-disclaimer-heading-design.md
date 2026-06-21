# NormControl copy and disclaimer heading

## Status

Agreed design.

## Scope

Update only content in `data/content.json`.

### NormControl

Position NormControl as an automated service that checks whether normative documents referenced in project documentation are currently valid.

Update the calculator title, short description, full description, SEO copy, use cases, tags, and normative-context label so they consistently describe this function. Preserve the existing slug, category, URLs, display mode, order, icon, and product name.

Use Ukrainian spelling with `проєктна документація`.

### Disclaimer

Rename the section heading `Обмеження відповідальності` to `Умови використання матеріалів`.

Do not change the section body or any other legal-page content.

## Verification

- Confirm `data/content.json` is valid JSON.
- Run `npm run typecheck`.
- Run `npm run build`.
