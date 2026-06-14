import { describe, expect, it } from "vitest";

import sitemap, { dynamic } from "@/app/sitemap";
import { calculators } from "@/lib/calculators";

describe("sitemap metadata route", () => {
  it("lists static pages and every calculator detail page", () => {
    const entries = sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toContain("https://ivapps.pro/");
    expect(urls).toContain("https://ivapps.pro/author");

    for (const calculator of calculators) {
      expect(urls).toContain(`https://ivapps.pro/calculator/${calculator.slug}`);
    }

    expect(new Set(urls).size).toBe(urls.length);
    expect(entries).toHaveLength(calculators.length + 2);
  });

  it("uses sensible priorities and change frequencies for SEO discovery", () => {
    const entries = sitemap();
    const home = entries.find((entry) => entry.url === "https://ivapps.pro/");
    const author = entries.find((entry) => entry.url === "https://ivapps.pro/author");
    const calculatorEntry = entries.find(
      (entry) => entry.url === "https://ivapps.pro/calculator/soil-design-resistance",
    );

    expect(home).toMatchObject({
      changeFrequency: "weekly",
      priority: 1,
    });
    expect(author).toMatchObject({
      changeFrequency: "monthly",
      priority: 0.6,
    });
    expect(calculatorEntry).toMatchObject({
      changeFrequency: "monthly",
      priority: 0.8,
    });
  });

  it("is static-export compatible", () => {
    expect(dynamic).toBe("force-static");
  });
});
