import { createHash } from "node:crypto";
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

    const source = readFileSync(sourcePath);
    const approvedHeader = Buffer.from(
      [
        ";;----------------------------------------------------------------------;;",
        ";; Program: XRef to Current Drawing                                    ;;",
        ";; Filename: XRef2Current.lsp                                          ;;",
        ";; Command: X2C                                                        ;;",
        ";; Version: 1.0                                                        ;;",
        ";; Author: Ivaneiko Volodymyr                                          ;;",
        ";; Copyright (c) 2026 Ivaneiko Volodymyr. All rights reserved.         ;;",
        ";;                                                                      ;;",
        ";; Proprietary license: free use is permitted in personal and          ;;",
        ";; commercial projects. Resale, public republication without written  ;;",
        ";; permission, and distribution of modified versions under the         ;;",
        ";; original name are prohibited.                                       ;;",
        ";;                                                                      ;;",
        ';; This software is provided "as is", without warranty of any kind.    ;;',
        ";; The user is solely responsible for the results of its use.           ;;",
        ";;----------------------------------------------------------------------;;",
        "",
      ].join("\r\n"),
      "utf8",
    );

    expect(source.subarray(0, approvedHeader.length)).toEqual(approvedHeader);

    const programSource = source.subarray(approvedHeader.length);

    expect(createHash("sha256").update(programSource).digest("hex")).toBe(
      "f051358f510fafc124eb0299b56280edeaa80b3aee0ad1a3707449cf152e3fdf",
    );

    const sourceText = source.toString("utf8");

    expect(sourceText).toContain("Program: XRef to Current Drawing");
    expect(sourceText).toContain("Filename: XRef2Current.lsp");
    expect(sourceText).toContain("Command: X2C");
    expect(sourceText).toContain("Version: 1.0");
    expect(sourceText).toContain("Author: Ivaneiko Volodymyr");
    expect(sourceText).toContain(
      "Copyright (c) 2026 Ivaneiko Volodymyr. All rights reserved.",
    );
    expect(sourceText).toContain("(defun c:x2c");
  });
});
