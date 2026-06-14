import { siteContent, type LegalPage } from "@/lib/site-content";

export type LegalPageSlug = "disclaimer" | "terms" | "privacy";

export const legalPages = siteContent.legalPages as Array<
  LegalPage & { slug: LegalPageSlug }
>;

export function getLegalPage(slug: LegalPageSlug): LegalPage & { slug: LegalPageSlug } {
  const page = legalPages.find((candidate) => candidate.slug === slug);

  if (!page) {
    throw new Error(`Legal page not found: ${slug}`);
  }

  return page;
}
