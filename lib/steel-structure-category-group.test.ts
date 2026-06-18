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

    const scoresStep = report.steps.find((step) => step.key === "scores-a2");
    expect(scoresStep?.items).toEqual([
      "S1 = 0 балів — клас відповідальності СС2",
      "S2 = 11 балів — категорія за призначенням А",
      "S3,base = 1 балів — категорія за напруженим станом III",
      "S4 = 7 балів — розтягувальні напруження є",
      "S5 = 2 балів — несприятливий вплив зварних з’єднань немає",
    ]);
    expect(scoresStep?.formulas).toBeUndefined();

    const baseGroupStep = report.steps.find((step) => step.key === "base-group");
    expect(baseGroupStep?.formulas).toEqual([
      "Stot,base = S1 + S2 + S3,base + S4 + S5 = 0 + 11 + 1 + 7 + 2 = 21 балів",
    ]);
    expect(baseGroupStep?.resultItems).toEqual([
      "Початкова група: 3 (Stot,base = 21 балів)",
    ]);

    const stressCategoryStep = report.steps.find((step) => step.key === "stress-category-a2");
    expect(stressCategoryStep?.formulas).toEqual([
      "α = |σdyn| / |σsum| = 0 / 100 = 0",
    ]);
    expect(stressCategoryStep?.resultItems).toEqual([
      "Категорія за напруженим станом після уточнення: III (α = 0)",
      "S3,A2 = 1 бал — категорія за напруженим станом III",
    ]);

    const positiveStep = report.steps.find((step) => step.key === "positive-adjustments");
    expect(positiveStep?.items).toEqual([
      "ΔSt = 0 балів — товщина прокату t = 10 мм",
      "ΔSguillotine = 0 балів — кромки після гільйотинного різання немає",
      "ΔScold = 0 балів — неврахований наклеп немає",
      "ΔSinitial = 0 балів — високі початкові напруження немає",
    ]);
    expect(positiveStep?.formulas).toEqual([
      "ΔS+ = ΔSt + ΔSguillotine + ΔScold + ΔSinitial = 0 + 0 + 0 + 0 = 0 балів",
    ]);

    const compressionStep = report.steps.find((step) => step.key === "compression-adjustment");
    expect(compressionStep?.formulas).toEqual([
      "σlimit = 0,4 * Ry * γc = 0,4 * 239.02 * 1 = 95.61 МПа",
      "σc = 100 МПа ≤ σlimit = 95.61 МПа",
    ]);
    expect(compressionStep?.resultItems).toEqual([
      "Умова зменшення показника групи при статичному стиску: не виконується",
      "ΔScompression = 0 балів",
    ]);

    const refinedStep = report.steps.find((step) => step.key === "refined-group");
    expect(refinedStep?.formulas).toEqual([
      "ΔS3 = S3,A2 - S3,base = 1 - 1 = 0 балів",
      "ΔSraw = ΔS3 + ΔS+ + ΔScompression = 0 + 0 + 0 = 0 балів",
      "ΔS = обмежити(ΔSraw; -4; +4) = 0 балів",
      "Stot,A2 = Stot,base + ΔS = 21 + 0 = 21 балів",
    ]);
    expect(refinedStep?.resultItems).toEqual([
      "Уточнена група: 3 (Stot,A2 = 21 балів)",
    ]);

    const steelCompatibilityStep = report.steps.find((step) => step.key === "steel-compatibility");
    expect(steelCompatibilityStep?.formula).toBeUndefined();
    expect(steelCompatibilityStep?.resultItems).toEqual([
      "Застосовність сталі за таблицею Г.1: дозволено",
    ]);

    const conclusionStep = report.steps.find((step) => step.key === "conclusion");
    expect(conclusionStep?.formula).toBeUndefined();
    expect(conclusionStep?.items).toEqual([
      "Конструкція або елемент: Головні балки при статичному навантаженні",
      "Категорії за таблицею А.1: А/III",
      "Початкова група: 3 (Stot,base = 21 балів)",
      "Уточнена група: 3 (Stot,A2 = 21 балів)",
      "Сталь С245: дозволено за таблицею Г.1",
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
