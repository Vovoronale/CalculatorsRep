import { existsSync, readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

const legalRoutes = [
  {
    routeFile: "app/disclaimer/page.tsx",
    slug: "disclaimer",
    title: "Відмова від відповідальності",
  },
  {
    routeFile: "app/terms/page.tsx",
    slug: "terms",
    title: "Умови використання",
  },
  {
    routeFile: "app/privacy/page.tsx",
    slug: "privacy",
    title: "Політика конфіденційності",
  },
];

describe("legal pages", () => {
  it("defines static route modules for every legal page", () => {
    for (const page of legalRoutes) {
      expect(existsSync(page.routeFile), `${page.routeFile} should exist`).toBe(true);
    }
  });

  it("stores legal page content in JSON with engineering-service context", () => {
    const content = JSON.parse(readFileSync("data/content.json", "utf8"));
    const legalPages = content.site.legalPages ?? [];

    expect(Array.isArray(legalPages)).toBe(true);
    expect(legalPages).toHaveLength(3);

    for (const route of legalRoutes) {
      const page = legalPages.find(
        (candidate: { slug: string }) => candidate.slug === route.slug,
      );

      expect(page, `${route.slug} content should exist`).toBeDefined();
      expect(page.title).toBe(route.title);
      expect(page.updatedAt).toBe("14 червня 2026 року");
      expect(page.sections.length).toBeGreaterThanOrEqual(4);
      expect(JSON.stringify(page)).toContain("ivapps.pro@gmail.com");
      expect(JSON.stringify(page)).not.toContain("[вставити публічний email]");
    }
  });

  it("uses the provided legal copy anchors", () => {
    const content = JSON.parse(readFileSync("data/content.json", "utf8"));
    const legalPages = content.site.legalPages ?? [];
    const terms = legalPages.find((page: { slug: string }) => page.slug === "terms");
    const disclaimer = legalPages.find(
      (page: { slug: string }) => page.slug === "disclaimer",
    );
    const privacy = legalPages.find((page: { slug: string }) => page.slug === "privacy");

    expect(JSON.stringify(terms)).toContain(
      "До цих Умов застосовується законодавство України",
    );
    expect(JSON.stringify(disclaimer)).toContain(
      "Сайт і його матеріали надаються “як є” та “за наявності”",
    );
    expect(JSON.stringify(privacy)).toContain(
      "Володільцем даних у межах роботи сайту є автор і адміністратор платформи IVApps.pro: Іванейко Володимир",
      );
  });
});
