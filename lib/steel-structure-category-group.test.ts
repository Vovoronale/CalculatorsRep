import { describe, expect, it } from "vitest";

import {
  DEFAULT_STEEL_STRUCTURE_CATEGORY_GROUP_INPUT,
  getSteelStructureCategoryGroupReport,
  groupForTotal,
} from "@/lib/steel-structure-category-group";

describe("steel structure category/group core", () => {
  it("calculates the agreed default example", () => {
    const report = getSteelStructureCategoryGroupReport(
      DEFAULT_STEEL_STRUCTURE_CATEGORY_GROUP_INPUT,
    );

    expect(report.valid).toBe(true);
    expect(report.values).toMatchObject({
      purposeCategory: "А",
      stressCategoryBase: "III",
      scores: { s1: 0, s2: 11, s3Base: 1, s4: 7, s5: 2 },
      totalBase: 21,
      groupBase: 3,
      gammaM: 1.025,
      gammaC: 1,
      stressCategoryA2: "III",
      totalA2: 21,
      groupA2: 3,
      steelAllowed: true,
    });
    expect(report.values?.ryMpa).toBeCloseTo(245 / 1.025, 9);
    expect(report.steps).toHaveLength(12);
    expect(report.steps[0]?.items).toContain("Умови експлуатації: Опалювана споруда");
    expect(report.steps[0]?.items).toContain("Вид прокату: Фасонний");
    expect(report.steps[0]?.items?.join(" ")).not.toContain("heated");
    expect(report.steps[0]?.items?.join(" ")).not.toContain("section");
    expect(report.steps.map((step) => step.key)).toEqual([
      "inputs",
      "categories-a1",
      "scores-a2",
      "base-group",
      "steel-resistance",
      "gamma-c",
      "stress-category-a2",
      "positive-adjustments",
      "compression-adjustment",
      "refined-group",
      "steel-compatibility",
      "conclusion",
    ]);
  });

  it("uses the exact group boundaries", () => {
    expect([18, 19, 22, 23, 26, 27].map(groupForTotal)).toEqual([4, 3, 3, 2, 2, 1]);
  });

  it("uses exact alpha boundaries", () => {
    const reportAtPointTwo = getSteelStructureCategoryGroupReport({
      ...DEFAULT_STEEL_STRUCTURE_CATEGORY_GROUP_INPUT,
      loadType: "dynamic",
      sigmaDynKpa: 20_000,
      sigmaSumKpa: 100_000,
    });
    const reportAtPointFive = getSteelStructureCategoryGroupReport({
      ...DEFAULT_STEEL_STRUCTURE_CATEGORY_GROUP_INPUT,
      loadType: "dynamic",
      sigmaDynKpa: 50_000,
      sigmaSumKpa: 100_000,
    });

    expect(reportAtPointTwo.values?.stressCategoryA2).toBe("III");
    expect(reportAtPointFive.values?.stressCategoryA2).toBe("I");
  });

  it("clamps the total A.2 adjustment to plus four", () => {
    const report = getSteelStructureCategoryGroupReport({
      ...DEFAULT_STEEL_STRUCTURE_CATEGORY_GROUP_INPUT,
      loadType: "dynamic",
      sigmaDynKpa: 100_000,
      sigmaSumKpa: 100_000,
      thicknessMm: 50,
      hasGuillotineEdges: true,
      hasUnaccountedColdWork: true,
      hasHighInitialStress: true,
    });

    expect(report.values?.adjustments.raw).toBeGreaterThan(4);
    expect(report.values?.adjustments.applied).toBe(4);
    expect(report.values?.totalA2).toBe(report.values!.totalBase + 4);
  });

  it("applies the static compression reduction when the inequality passes", () => {
    const report = getSteelStructureCategoryGroupReport({
      ...DEFAULT_STEEL_STRUCTURE_CATEGORY_GROUP_INPUT,
      sigmaCKpa: 90_000,
    });

    expect(report.values?.adjustments.compression).toBe(-4);
    expect(report.values?.totalA2).toBe(17);
    expect(report.values?.groupA2).toBe(4);
  });

  it("uses a semi-automatic table 5.1 option", () => {
    const report = getSteelStructureCategoryGroupReport({
      ...DEFAULT_STEEL_STRUCTURE_CATEGORY_GROUP_INPUT,
      gammaCMode: "table",
      gammaCTableOptionId: "p9b",
    });

    expect(report.values?.gammaC).toBe(1.15);
    expect(report.steps.find((step) => step.key === "gamma-c")?.items).toContain(
      "Режим визначення γc: Напівавтоматично — вибір позиції таблиці 5.1",
    );
    expect(report.steps.find((step) => step.key === "gamma-c")?.formula).toBe(
      "γc = 1.15 (таблиця 5.1, 9б)",
    );
  });

  it("uses and validates a manual gamma c value", () => {
    const manual = getSteelStructureCategoryGroupReport({
      ...DEFAULT_STEEL_STRUCTURE_CATEGORY_GROUP_INPUT,
      gammaCMode: "manual",
      gammaCManual: 0.83,
    });
    const invalid = getSteelStructureCategoryGroupReport({
      ...DEFAULT_STEEL_STRUCTURE_CATEGORY_GROUP_INPUT,
      gammaCMode: "manual",
      gammaCManual: 0,
    });

    expect(manual.values?.gammaC).toBe(0.83);
    expect(manual.steps.find((step) => step.key === "gamma-c")?.formula).toBe(
      "γc = 0.83 (прийнято користувачем)",
    );
    expect(invalid.valid).toBe(false);
    expect(invalid.errors).toContain("Коефіцієнт умов роботи γc у ручному режимі має бути більше 0.");
  });

  it("preserves the result but fails validity for an incompatible G.1 class/group", () => {
    const report = getSteelStructureCategoryGroupReport({
      ...DEFAULT_STEEL_STRUCTURE_CATEGORY_GROUP_INPUT,
      sigmaCKpa: 90_000,
    });

    expect(report.values?.groupA2).toBe(4);
    expect(report.values?.steelAllowed).toBe(false);
    expect(report.valid).toBe(false);
    expect(report.errors.join(" ")).toContain("не допускається");
  });

  it("returns stable errors without non-finite formulas", () => {
    const report = getSteelStructureCategoryGroupReport({
      ...DEFAULT_STEEL_STRUCTURE_CATEGORY_GROUP_INPUT,
      thicknessMm: 0,
      sigmaSumKpa: 0,
    });

    expect(report.valid).toBe(false);
    expect(JSON.stringify(report.steps)).not.toMatch(/NaN|Infinity/);
  });
});
