import { describe, expect, it } from "vitest";

import {
  DEFAULT_CONCRETE_COVER_DURABILITY_INPUT,
  getConcreteCoverDurabilityReport,
  getConcreteCoverDurabilityReturnUrl,
} from "@/lib/concrete-cover-durability";

describe("concrete cover durability", () => {
  it("calculates the default ordinary-reinforcement report from the contract", () => {
    const report = getConcreteCoverDurabilityReport({
      ...DEFAULT_CONCRETE_COVER_DURABILITY_INPUT,
    });

    expect(report.valid).toBe(true);
    expect(report.errors).toEqual([]);
    expect(report.warnings).toEqual([]);
    expect(report.values).toMatchObject({
      bondCoverMm: 16,
      constructionClass: "S3",
      durabilityCoverMm: 10,
      durabilityAdjustedCoverMm: 10,
      minimumCoverMm: 16,
      nominalCoverMm: 26,
    });
    expect(report.steps.map((step) => step.key)).toEqual([
      "inputs",
      "bond-cover",
      "construction-class",
      "durability-cover",
      "minimum-cover",
      "nominal-cover",
      "conclusion",
    ]);
    expect(report.steps[0].caption).toBe(
      "Вихідні дані для розрахунку захисного шару бетону (ДБН В.2.6-98:2009, розділ 4.4):",
    );
    expect(report.steps[1].formula).toBe("cmin,b = φ = 16 мм");
    expect(report.steps[2].caption).toBe(
      "Визначення класу конструкції S за розрахунковим строком експлуатації та факторами впливу (п. 4.4.2.4.3, табл. 4.5 ДБН В.2.6-98:2009):",
    );
    expect(report.steps[2].formulas).toContain("Sbase = S4");
    expect(report.steps[2].formulas).toContain("S2 = S4 - 1 = S3");
    expect(report.steps[2].formulas).toContain("S = clamp(S3; S1; S6) = S3");
    expect(report.steps[3].formula).toBe("cmin,dur = табл. 4.3[S3; XC1] = 10 мм");
    expect(report.steps[4].formulas).toEqual([
      "cdur = cmin,dur + Δcdur,γ - Δcdur,st - Δcdur,add = 10 + 0 - 0 - 0 = 10 мм",
      "cmin = max(cmin,b; cdur; 10 мм) = max(16; 10; 10) = 16 мм",
    ]);
    expect(report.steps[5].formula).toBe("cnom = cmin + Δcdev = 16 + 10 = 26 мм");
    expect(report.steps[6].formulas).toEqual([
      "cmin = 16 мм",
      "cnom = 26 мм",
    ]);
  });

  it("uses table 4.4 for prestressed reinforcement", () => {
    const report = getConcreteCoverDurabilityReport({
      ...DEFAULT_CONCRETE_COVER_DURABILITY_INPUT,
      exposureClass: "XD3",
      reinforcementDurabilityType: "prestressed",
      constructionClassMode: "manual",
      manualConstructionClass: "S4",
      bondCoverMode: "strand",
      strandEquivalentDiameterMm: 15.2,
    });

    expect(report.valid).toBe(true);
    expect(report.values).toMatchObject({
      bondCoverMm: 15.2,
      constructionClass: "S4",
      durabilityCoverMm: 55,
      durabilityAdjustedCoverMm: 55,
      minimumCoverMm: 55,
      nominalCoverMm: 65,
    });
    expect(report.steps[1].formula).toBe("cmin,b = φp = 15.2 мм");
    expect(report.steps[2].caption).toBe("Прийняття класу конструкції S користувачем:");
    expect(report.steps[2].formula).toBe("S = S4");
    expect(report.steps[3].formula).toBe("cmin,dur = табл. 4.4[S4; XD3/XS3] = 55 мм");
  });

  it("adds 5 mm to cmin,b when aggregate is larger than 32 mm", () => {
    const report = getConcreteCoverDurabilityReport({
      ...DEFAULT_CONCRETE_COVER_DURABILITY_INPUT,
      aggregateMaxSizeMm: 40,
    });

    expect(report.valid).toBe(true);
    expect(report.values?.bondCoverMm).toBe(21);
    expect(report.steps[1].notes).toEqual([
      "Оскільки Dmax = 40 мм > 32 мм, згідно з приміткою до табл. 4.2 cmin,b збільшується на 5 мм.",
    ]);
    expect(report.steps[1].formulas).toEqual([
      "cmin,b = φ = 16 мм",
      "cmin,b = cmin,b,base + 5 = 16 + 5 = 21 мм",
    ]);
  });

  it("calculates every bond-cover mode from table 4.2", () => {
    expect(
      getConcreteCoverDurabilityReport({
        ...DEFAULT_CONCRETE_COVER_DURABILITY_INPUT,
        bondCoverMode: "round-duct",
        roundDuctDiameterMm: 60,
      }).steps[1].formula,
    ).toBe("cmin,b = dduct = 60 мм");
    expect(
      getConcreteCoverDurabilityReport({
        ...DEFAULT_CONCRETE_COVER_DURABILITY_INPUT,
        bondCoverMode: "rectangular-duct",
        rectangularDuctShortSideMm: 40,
        rectangularDuctLongSideMm: 90,
      }).steps[1].formula,
    ).toBe("cmin,b = max(aduct; bduct / 2) = max(40; 90 / 2) = 45 мм");
    expect(
      getConcreteCoverDurabilityReport({
        ...DEFAULT_CONCRETE_COVER_DURABILITY_INPUT,
        bondCoverMode: "pre-tensioned-wire",
        preTensionedElementDiameterMm: 12,
      }).steps[1].formula,
    ).toBe("cmin,b = 1.5 * dp = 1.5 * 12 = 18 мм");
    expect(
      getConcreteCoverDurabilityReport({
        ...DEFAULT_CONCRETE_COVER_DURABILITY_INPUT,
        bondCoverMode: "pre-tensioned-bar",
        preTensionedElementDiameterMm: 16,
      }).steps[1].formula,
    ).toBe("cmin,b = 2.5 * dp = 2.5 * 16 = 40 мм");
  });

  it("applies automatic construction class increases, reductions, and clamp", () => {
    const report = getConcreteCoverDurabilityReport({
      ...DEFAULT_CONCRETE_COVER_DURABILITY_INPUT,
      exposureClass: "XD3",
      designWorkingLife: "100",
      concreteClass: "C45/55",
      isSlabElement: true,
      hasSpecialQualityControl: true,
    });

    expect(report.values?.constructionClass).toBe("S3");
    expect(report.steps[2].formulas).toEqual([
      "Sbase = S4",
      "S1 = Sbase + 2 = S4 + 2 = S6",
      "S2 = S6 - 1 = S5",
      "S3 = S5 - 1 = S4",
      "S = S4 - 1 = S3",
      "S = clamp(S3; S1; S6) = S3",
    ]);
  });

  it("warns when nominal cover is greater than 45 mm", () => {
    const report = getConcreteCoverDurabilityReport({
      ...DEFAULT_CONCRETE_COVER_DURABILITY_INPUT,
      exposureClass: "XD3",
      constructionClassMode: "manual",
      manualConstructionClass: "S4",
    });

    expect(report.values?.nominalCoverMm).toBe(55);
    expect(report.warnings).toEqual([
      "Номінальний захисний шар cnom = 55 мм > 45 мм. Згідно з п. 4.4.2.4.4 ДБН В.2.6-98:2009 необхідно передбачити конструктивне армування захисного шару.",
    ]);
  });

  it("returns a stable invalid report without NaN formulas", () => {
    const report = getConcreteCoverDurabilityReport({
      ...DEFAULT_CONCRETE_COVER_DURABILITY_INPUT,
      barDiameterMm: 0,
      deltaCdevMm: -1,
    });

    expect(report.valid).toBe(false);
    expect(report.errors).toEqual([
      "Укажіть додатне значення φ.",
      "Δcdev має бути не менше 0 мм.",
    ]);
    expect(report.values).toBeNull();
    expect(report.steps).toHaveLength(1);
    expect(JSON.stringify(report.steps)).not.toContain("NaN");
    expect(JSON.stringify(report.steps)).not.toContain("Infinity");
  });

  it("builds return URLs from exposure-class calculator results", () => {
    expect(
      getConcreteCoverDurabilityReturnUrl({
        exposureClass: "XD3",
        sourceExposureClasses: "XC4,XD3,XF4",
        sourceCalculator: "concrete-exposure-class",
      }),
    ).toBe(
      "/calculator/concrete-cover-durability?exposureClass=XD3&sourceExposureClasses=XC4%2CXD3%2CXF4&sourceCalculator=concrete-exposure-class",
    );
  });
});
