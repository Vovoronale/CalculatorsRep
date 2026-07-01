import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

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

  it("publishes the licensed XRef2Current source", () => {
    const sourcePath = join(
      process.cwd(),
      "public",
      "downloads",
      "autocad-lisp",
      "XRef2Current.lsp",
    );

    expect(existsSync(sourcePath)).toBe(true);

    const source = readFileSync(sourcePath, "utf8");

    expect(source).toContain("Program: XRef to Current Drawing");
    expect(source).toContain("Filename: XRef2Current.lsp");
    expect(source).toContain("Command: X2C");
    expect(source).toContain("Version: 1.0");
    expect(source).toContain("Author: Ivaneiko Volodymyr");
    expect(source).toContain(
      "Copyright (c) 2026 Ivaneiko Volodymyr. All rights reserved.",
    );
    expect(source).toContain("(defun c:x2c");
  });
});
