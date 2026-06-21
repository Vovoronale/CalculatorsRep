# NormControl Copy and Disclaimer Heading Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reposition NormControl as an automated validity check for normative documents in project documentation and soften one disclaimer section heading.

**Architecture:** Keep `data/content.json` as the single content source. Add focused assertions to the existing content-model tests, then update only the agreed JSON fields.

**Tech Stack:** JSON, TypeScript, Vitest, Next.js static export

---

## Chunk 1: Content assertions and update

### Task 1: Lock the approved copy in tests

**Files:**
- Modify: `app/legal-pages.test.ts`
- Modify: `lib/calculators.test.ts`

- [x] Add an assertion that the disclaimer contains a section titled `Умови використання матеріалів`.
- [x] Add assertions that the `normcontrol` calculator title and descriptions contain `автоматизована перевірка чинності нормативів` and `проєктній документації`.
- [x] Run `npm test -- app/legal-pages.test.ts lib/calculators.test.ts` and confirm the new assertions fail against the old copy.

### Task 2: Update the content source

**Files:**
- Modify: `data/content.json`

- [x] Rename only the disclaimer section heading from `Обмеження відповідальності` to `Умови використання матеріалів`.
- [x] Update the NormControl title, short description, full description, SEO title, SEO description, use cases, tags, and standard label to consistently describe automated validity checking of normative documents in project documentation.
- [x] Preserve the NormControl slug, category, URLs, display mode, access label, order, editorial label, tool name, and icon.
- [x] Run `npm test -- app/legal-pages.test.ts lib/calculators.test.ts` and confirm both test files pass.

### Task 3: Verify the repository

- [x] Parse `data/content.json` as JSON.
- [x] Run `npm run typecheck`.
- [x] Run `npm run build`.
- [x] Review `git diff` and confirm unrelated working-tree changes were not modified.
