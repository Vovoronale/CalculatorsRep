import { describe, expect, it } from "vitest";

import {
  STEEL_GRADE_STANDARD_OPTIONS,
  STEEL_STRENGTH_CLASSES,
  STEEL_STRUCTURE_CATALOG,
  STEEL_STRUCTURE_SECTIONS,
  TABLE_G1_MATRIX,
} from "@/lib/steel-structure-category-group-data";

describe("steel structure normative catalog", () => {
  it("contains the agreed 18 sections and 155 atomic options", () => {
    expect(STEEL_STRUCTURE_SECTIONS).toHaveLength(18);
    expect(STEEL_STRUCTURE_CATALOG).toHaveLength(155);
    expect(new Set(STEEL_STRUCTURE_CATALOG.map((entry) => entry.id)).size).toBe(155);

    const counts = STEEL_STRUCTURE_SECTIONS.map(
      (section) =>
        STEEL_STRUCTURE_CATALOG.filter((entry) => entry.sectionId === section.id).length,
    );
    expect(counts).toEqual([19, 7, 8, 10, 13, 7, 10, 11, 5, 11, 12, 6, 7, 4, 11, 8, 2, 4]);
  });

  it("gives every entry categories, source data, and an explicit table 5.1 mapping", () => {
    const sectionIds = new Set(STEEL_STRUCTURE_SECTIONS.map((section) => section.id));

    for (const entry of STEEL_STRUCTURE_CATALOG) {
      expect(sectionIds.has(entry.sectionId)).toBe(true);
      expect(entry.sourcePosition).not.toBe("");
      expect(entry.sourceText).not.toBe("");
      expect(["А", "Б", "В"]).toContain(entry.purposeCategory);
      expect(["I", "II", "III"]).toContain(entry.stressCategory);
      expect(entry.table51Profiles.length).toBeGreaterThan(0);
    }
  });

  it("records manual hoists and manual crane beams as Б/II", () => {
    for (const id of ["a1-01-14", "a1-01-15"] as const) {
      const entry = STEEL_STRUCTURE_CATALOG.find((item) => item.id === id);
      expect(entry).toMatchObject({ purposeCategory: "Б", stressCategory: "II" });
    }
  });

  it("keeps the agreed static main beam as the default-ready entry", () => {
    expect(STEEL_STRUCTURE_CATALOG.find((entry) => entry.id === "a1-03-03")).toMatchObject({
      purposeCategory: "А",
      stressCategory: "III",
      inferredLoadType: "static",
    });
  });
});

describe("steel normative material tables", () => {
  it("contains all agreed strength classes and a complete G.1 matrix", () => {
    expect(STEEL_STRENGTH_CLASSES).toHaveLength(20);
    expect(new Set(STEEL_STRENGTH_CLASSES).size).toBe(20);

    for (const steelClass of STEEL_STRENGTH_CLASSES) {
      expect(TABLE_G1_MATRIX[steelClass]).toHaveLength(4);
      expect(
        STEEL_GRADE_STANDARD_OPTIONS.some((option) => option.steelClass === steelClass),
      ).toBe(true);
    }
  });

  it("uses unique stable IDs for table G.5 options", () => {
    expect(new Set(STEEL_GRADE_STANDARD_OPTIONS.map((option) => option.id)).size).toBe(
      STEEL_GRADE_STANDARD_OPTIONS.length,
    );
  });
});
