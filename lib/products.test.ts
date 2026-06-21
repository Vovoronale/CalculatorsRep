import { describe, expect, it } from "vitest";

import { projectCategories } from "@/lib/projects";
import { getProductBySlug, products } from "@/lib/products";

describe("product content", () => {
  it("loads Revit Screenshot Plugin by slug", () => {
    expect(products.map((product) => product.slug)).toContain("revit-screenshot");
    expect(getProductBySlug("revit-screenshot")?.title).toBe(
      "Revit Screenshot Plugin",
    );
    expect(getProductBySlug("missing-product")).toBeUndefined();
  });

  it("provides distinct accessible screenshot descriptions", () => {
    const product = getProductBySlug("revit-screenshot");
    const altTexts = product?.screenshots.map((screenshot) => screenshot.alt) ?? [];

    expect(altTexts).toHaveLength(4);
    expect(altTexts.every((alt) => alt.trim().length > 0)).toBe(true);
    expect(new Set(altTexts).size).toBe(4);
  });

  it("provides approved Revit download URLs", () => {
    expect(getProductBySlug("revit-screenshot")?.downloads).toEqual([
      {
        version: "2024",
        href: "https://dbnassistant.com/downloads/revit-screenshot/RevitScreenshot-2024.zip",
      },
      {
        version: "2025",
        href: "https://dbnassistant.com/downloads/revit-screenshot/RevitScreenshot-2025.zip",
      },
      {
        version: "2026",
        href: "https://dbnassistant.com/downloads/revit-screenshot/RevitScreenshot-2026.zip",
      },
    ]);
  });

  it("links the BIM project card to the internal product page", () => {
    const bimTools = projectCategories.find((category) => category.slug === "bim-tools");
    const project = bimTools?.projects.find(
      (candidate) => candidate.slug === "revit-screenshot-plugin",
    );

    expect(project?.href).toBe("/products/revit-screenshot");
  });
});
