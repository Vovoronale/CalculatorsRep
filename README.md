# Construction Calculators Hub

Static Next.js site for a branded construction-calculators catalog. The UI uses a dark app-shell layout with category navigation on the left and dedicated calculator routes in the main workspace.

## Stack

- Next.js App Router with static export
- TypeScript
- Vitest + Testing Library
- Cloudflare Pages-ready output in `out/`

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Verification

```bash
npm test
npm run typecheck
npm run build
```

The production build exports static files to `out/`.

## Content editing

All site content (calculators, categories, IVapps top bar, author page, brand copy) lives in [data/content.json](/I:/CalculatorsRep/data/content.json).

See [docs/content-editing.md](/I:/CalculatorsRep/docs/content-editing.md) for the full schema and editing workflow.

The TypeScript loaders ([lib/site-content.ts](/I:/CalculatorsRep/lib/site-content.ts), [lib/calculators.ts](/I:/CalculatorsRep/lib/calculators.ts), [lib/projects.ts](/I:/CalculatorsRep/lib/projects.ts)) just type the JSON — they are not edited for content changes.

## Cloudflare Pages

This repository supports two Cloudflare Pages deployment modes:

- Git integration in the Cloudflare Dashboard
- GitHub Actions direct upload from this repository

For Git integration in Cloudflare Pages, use these settings:

- Framework preset: `Next.js (Static HTML Export)`
- Build command: `npm run build`
- Build output directory: `out`
- Root directory: repository root

No server runtime is required.

For repository-driven deployment to `ivapps.pro`, see [docs/cloudflare-pages-ivapps-pro.md](/I:/CalculatorsRep/docs/cloudflare-pages-ivapps-pro.md).
