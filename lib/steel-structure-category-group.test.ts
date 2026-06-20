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
      "S_1 = 0 балів — клас відповідальності СС2.",
      "S_2 = 11 балів — категорія за призначенням А.",
      "S_3,base = 1 бал — категорія за напруженим станом III.",
      "S_4 = 7 балів — розтягувальні напруження є.",
      "S_5 = 2 бали — несприятливий вплив зварних з’єднань немає.",
    ]);
    expect(scoresStep?.formulas).toBeUndefined();

    const baseGroupStep = report.steps.find((step) => step.key === "base-group");
    expect(baseGroupStep?.formulas).toEqual([
      "S_tot,base = S_1 + S_2 + S_3,base + S_4 + S_5 = 0 + 11 + 1 + 7 + 2 = 21 бал",
    ]);
    expect(baseGroupStep?.resultItems).toEqual([
      "Початкова група: 3; S_tot,base = 21 бал.",
    ]);

    const stressCategoryStep = report.steps.find((step) => step.key === "stress-category-a2");
    expect(stressCategoryStep?.items).toEqual([
      "σ_dyn — найбільший модуль нормального розтягувального напруження від динамічної складової навантаження.",
      "σ_sum — найбільший модуль сумарного нормального розтягувального напруження від усіх розрахункових навантажень у тій самій точці перерізу.",
      "Для статичного навантаження динамічна складова відсутня, тому прийнято σ_dyn = 0 МПа.",
    ]);
    expect(stressCategoryStep?.formulas).toEqual([
      "α = |σ_dyn| / |σ_sum| = 0 / 100 = 0",
    ]);
    expect(stressCategoryStep?.resultItems).toEqual([
      "За α = 0 конструкцію віднесено до категорії III за напруженим станом; прийнято S_3,A2 = 1 бал.",
    ]);

    expect(report.steps.find((step) => step.key === "gamma-c")?.items).toEqual([
      "Для головних балок при статичному навантаженні спеціальні значення коефіцієнта умов роботи за таблицею 5.1 не застосовуються. Відповідно до примітки 5 прийнято γ_c = 1,0.",
    ]);

    const positiveStep = report.steps.find((step) => step.key === "positive-adjustments");
    expect(positiveStep?.items).toEqual([
      "ΔS_t = 0 балів — поправка за товщиною прокату t = 10 мм.",
      "ΔS_guillotine = 0 балів — поправка за наявністю кромок після гільйотинного різання.",
      "ΔS_cold = 0 балів — поправка за неврахованим наклепом.",
      "ΔS_initial = 0 балів — поправка за високими початковими напруженнями.",
    ]);
    expect(positiveStep?.formulas).toEqual([
      "ΔS_+ = ΔS_t + ΔS_guillotine + ΔS_cold + ΔS_initial = 0 + 0 + 0 + 0 = 0 балів",
    ]);

    const compressionStep = report.steps.find((step) => step.key === "compression-adjustment");
    expect(compressionStep?.formulas).toBeUndefined();
    expect(compressionStep?.resultItems).toEqual([
      "Зменшення показника для статичного стиску не застосовується, оскільки в конструкції наявні розтягувальні напруження. Прийнято ΔS_compression = 0 балів.",
    ]);

    const refinedStep = report.steps.find((step) => step.key === "refined-group");
    expect(refinedStep?.formulas).toEqual([
      "ΔS_3 = S_3,A2 - S_3,base = 1 - 1 = 0 балів",
      "ΔS_raw = ΔS_3 + ΔS_+ + ΔS_compression = 0 + 0 + 0 = 0 балів",
      "Відповідно до пункту А.2 сумарна зміна показника приймається в межах від −4 до +4 балів. Оскільки розрахункове значення ΔS_raw = 0, прийнято ΔS = 0 балів.",
      "S_tot,A2 = S_tot,base + ΔS = 21 + 0 = 21 бал",
    ]);
    expect(refinedStep?.resultItems).toEqual([
      "Уточнена група: 3; S_tot,A2 = 21 бал.",
    ]);

    const steelCompatibilityStep = report.steps.find((step) => step.key === "steel-compatibility");
    expect(steelCompatibilityStep?.formula).toBeUndefined();
    expect(steelCompatibilityStep?.items).toEqual(expect.arrayContaining([
      "Уточнена група конструкції: 3",
      "Вид прокату: Фасонний",
      "Товщина прокату: 10 мм.",
      "Умови експлуатації: Опалювана споруда",
      "Комірка таблиці Г.1: + (рядок С245, графа групи 3)",
    ]));
    expect(steelCompatibilityStep?.resultItems).toEqual([
      "Перевірено рядок таблиці Г.1 для сталі С245, групи 3, виду прокату Фасонний, товщини 10 мм та умов експлуатації «Опалювана споруда». Застосування сталі С245 допускається.",
    ]);

    const conclusionStep = report.steps.find((step) => step.key === "conclusion");
    expect(conclusionStep?.formula).toBeUndefined();
    expect(conclusionStep?.items).toEqual([
      "Конструкція або елемент: Головні балки при статичному навантаженні",
      "Категорії за таблицею А.1: А/III",
      "Початкова група: 3; S_tot,base = 21 бал.",
      "Уточнена група: 3; S_tot,A2 = 21 бал.",
      "Застосування сталі С245 допускається за таблицею Г.1.",
    ]);

    const reportText = JSON.stringify(report.steps);
    for (const forbidden of [
      "Режим визначення γc",
      "Кандидатні позиції",
      "за погодженою матрицею",
      "p6a",
      "обмежити(",
      "Вибрана конструкція",
      "Вихідний рядок таблиці",
      "=>",
    ]) {
      expect(reportText).not.toContain(forbidden);
    }
    expect(report.steps.every((step) => step.caption.endsWith(":"))).toBe(true);
    expect(report.steps.every((step) => step.caption.includes("ДБН В.2.6-198:2014"))).toBe(true);
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
      hasTensileStress: false,
      sigmaCKpa: 90_000,
    });

    expect(report.values?.adjustments.compression).toBe(-4);
    expect(report.values?.totalA2).toBe(12);
    expect(report.values?.groupA2).toBe(4);
    expect(report.steps.find((step) => step.key === "compression-adjustment")?.formulas).toContain(
      "σ_c = 90 МПа ≤ σ_limit = 95,61 МПа",
    );
  });

  it("shows a greater-than sign when static compression exceeds the limit", () => {
    const report = getSteelStructureCategoryGroupReport({
      ...DEFAULT_STEEL_STRUCTURE_CATEGORY_GROUP_INPUT,
      hasTensileStress: false,
      sigmaCKpa: 100_000,
    });

    expect(report.values?.adjustments.compression).toBe(0);
    expect(report.steps.find((step) => step.key === "compression-adjustment")?.formulas).toContain(
      "σ_c = 100 МПа > σ_limit = 95,61 МПа",
    );
  });

  it("uses a semi-automatic table 5.1 option", () => {
    const report = getSteelStructureCategoryGroupReport({
      ...DEFAULT_STEEL_STRUCTURE_CATEGORY_GROUP_INPUT,
      gammaCMode: "table",
      gammaCTableOptionId: "p9b",
    });

    expect(report.values?.gammaC).toBe(1.15);
    expect(report.steps.find((step) => step.key === "gamma-c")?.items).toEqual([
      "За обраною позицією 9б таблиці 5.1 прийнято γ_c = 1,15. Застосовність цієї позиції перевіряє користувач.",
    ]);
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
    expect(manual.steps.find((step) => step.key === "gamma-c")?.items).toEqual([
      "Прийнято користувачем γ_c = 0,83. Нормативну застосовність значення користувач перевіряє самостійно.",
    ]);
    expect(invalid.valid).toBe(false);
    expect(invalid.errors).toContain("Коефіцієнт умов роботи γ_c у ручному режимі має бути більше 0.");
  });

  it("preserves the result but fails validity for an incompatible G.1 class/group", () => {
    const report = getSteelStructureCategoryGroupReport({
      ...DEFAULT_STEEL_STRUCTURE_CATEGORY_GROUP_INPUT,
      hasTensileStress: false,
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
