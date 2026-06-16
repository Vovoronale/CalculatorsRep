import { describe, expect, it } from "vitest";

import {
  DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT,
  getConcreteExposureClassReport,
  getConcreteExposureClassReturnUrl,
  type ConcreteExposureClassInput,
} from "@/lib/concrete-exposure-class";

function reportFor(input: Partial<ConcreteExposureClassInput>) {
  return getConcreteExposureClassReport({
    ...DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT,
    ...input,
  });
}

describe("getConcreteExposureClassReport", () => {
  it("returns XC1 for a reinforced dry or permanently wet element", () => {
    const report = reportFor({
      reinforcementPresence: "reinforced_or_embedded_metal",
      carbonationMoistureCondition: "dry_or_permanently_wet",
    });

    expect(report.valid).toBe(true);
    expect(report.values?.exposureClasses).toEqual(["XC1"]);
    expect(report.values?.governingCoverExposureClass).toBe("XC1");
    expect(report.steps.map((step) => step.key)).toEqual([
      "inputs",
      "x0-check",
      "xc-carbonation",
      "xd-chlorides",
      "xs-marine-chlorides",
      "xf-freeze-thaw",
      "xa-chemical-attack",
      "class-set",
      "governing-cover-class",
      "additional-requirements",
      "conclusion",
    ]);
    expect(report.steps.find((step) => step.key === "xc-carbonation")?.formula).toBe(
      "XC = f(carbonation_moisture_condition) = dry_or_permanently_wet => XC1",
    );
  });

  it("accepts X0 only for plain concrete without metal and without XF or XA", () => {
    const report = reportFor({
      reinforcementPresence: "plain_concrete_without_metal",
      freezeThawRisk: "none",
      chemicalAttackRisk: "none",
    });

    expect(report.valid).toBe(true);
    expect(report.values?.exposureClasses).toEqual(["X0"]);
    expect(report.values?.governingCoverExposureClass).toBe("X0");
    expect(report.steps.find((step) => step.key === "x0-check")?.formula).toBe(
      "X0 = plain_concrete_without_metal and XF = none and XA = none = true",
    );
  });

  it("maps carbonation moisture conditions to XC classes", () => {
    expect(
      reportFor({ carbonationMoistureCondition: "wet_rarely_dry" }).values
        ?.exposureClasses,
    ).toContain("XC2");
    expect(
      reportFor({ carbonationMoistureCondition: "moderate_or_high_humidity" })
        .values?.exposureClasses,
    ).toContain("XC3");
    expect(
      reportFor({ carbonationMoistureCondition: "cyclic_wet_dry" }).values
        ?.exposureClasses,
    ).toContain("XC4");
  });

  it("maps deicing salts to XD classes", () => {
    expect(
      reportFor({
        chlorideSource: "deicing_salts",
        chlorideMoistureCondition: "moderate_humidity",
      }).values?.exposureClasses,
    ).toContain("XD1");
    expect(
      reportFor({
        chlorideSource: "deicing_salts",
        chlorideMoistureCondition: "wet_rarely_dry",
      }).values?.exposureClasses,
    ).toContain("XD2");
    expect(
      reportFor({
        chlorideSource: "deicing_salts",
        chlorideMoistureCondition: "splash_or_spray",
      }).values?.exposureClasses,
    ).toContain("XD3");
  });

  it("maps marine chlorides to XS classes including wet rarely dry as XS2", () => {
    expect(reportFor({ chlorideSource: "airborne_sea_salts" }).values?.exposureClasses).toContain(
      "XS1",
    );
    expect(
      reportFor({
        chlorideSource: "sea_water",
        chlorideMoistureCondition: "permanently_submerged",
      }).values?.exposureClasses,
    ).toContain("XS2");
    expect(
      reportFor({
        chlorideSource: "sea_water",
        chlorideMoistureCondition: "wet_rarely_dry",
      }).values?.exposureClasses,
    ).toContain("XS2");
    expect(
      reportFor({
        chlorideSource: "sea_water",
        chlorideMoistureCondition: "cyclic_wet_dry",
      }).values?.exposureClasses,
    ).toContain("XS3");
  });

  it("maps freeze thaw risks to XF classes and adds requirements", () => {
    const report = reportFor({
      freezeThawRisk: "high_water_saturation_with_deicing_or_sea_water",
    });

    expect(report.values?.exposureClasses).toContain("XF4");
    expect(report.values?.additionalDurabilityRequirements).toContain(
      "Для класу XF необхідно перевірити вимоги до морозостійкості бетону, водонасичення, водонепроникності, повітровтягування та складу бетонної суміші.",
    );
  });

  it("maps XA classes, explains severity, and warns when analysis is absent", () => {
    const report = reportFor({
      chemicalAttackRisk: "XA2",
      hasSoilOrGroundwaterAnalysis: false,
    });

    expect(report.values?.exposureClasses).toContain("XA2");
    expect(report.warnings).toContain(
      "Клас XA прийнято за вибором користувача. Для остаточного призначення класу хімічної агресії потрібен аналіз ґрунту або води.",
    );
    expect(report.steps.find((step) => step.key === "xa-chemical-attack")?.formula).toBe(
      "XA = f(chemical_attack_risk; has_soil_or_groundwater_analysis) = XA2; false => XA2 — помірна хімічна агресія",
    );
  });

  it("keeps unknown XA out of exposure_classes and emits the agreed warning", () => {
    const report = reportFor({ chemicalAttackRisk: "unknown_requires_analysis" });

    expect(report.values?.exposureClasses).not.toContain("XA_unknown");
    expect(report.warnings).toContain("Для визначення класу XA потрібен аналіз ґрунту або води.");
    expect(report.steps.find((step) => step.key === "class-set")?.formula).toBe(
      "exposure_classes = union(XC1; XA_unknown) = [XC1]",
    );
  });

  it("keeps stable class order and selects governing cover class by rank", () => {
    const report = reportFor({
      carbonationMoistureCondition: "cyclic_wet_dry",
      chlorideSource: "deicing_salts",
      chlorideMoistureCondition: "splash_or_spray",
      freezeThawRisk: "high_water_saturation_with_deicing_or_sea_water",
    });

    expect(report.values?.exposureClasses).toEqual(["XC4", "XD3", "XF4"]);
    expect(report.values?.governingCoverExposureClass).toBe("XD3");
    expect(report.steps.find((step) => step.key === "governing-cover-class")?.formula).toBe(
      "governing_cover_exposure_class = max_rank(X0; XC; XD; XS) = max_rank([XC4, XD3]) = XD3",
    );
  });

  it("returns stable report text for the input and conclusion steps", () => {
    const report = reportFor({
      elementName: "Балка Б-1",
      elementType: "beam",
      currentExposureClass: "XC1",
      carbonationMoistureCondition: "cyclic_wet_dry",
    });

    expect(report.steps[0].caption).toBe(
      "Вихідні дані для визначення класу впливу середовища (ДБН В.2.6-98:2009, розділ 4.3-4.4; ДСТУ ENV 206:2018, класи впливу середовища):",
    );
    expect(report.steps[0].items).toContain("Назва елемента: Балка Б-1");
    expect(report.steps[0].items).toContain("Тип елемента: балка");
    expect(report.steps[0].items).toContain("Поточний клас у розрахунку захисного шару: XC1");
    expect(report.steps.at(-1)?.formula).toBe(
      "exposure_classes -> governing_cover_exposure_class = [XC4] -> XC4",
    );
  });
});

describe("getConcreteExposureClassReturnUrl", () => {
  it("uses returnTo and returnField when they are provided", () => {
    expect(
      getConcreteExposureClassReturnUrl({
        returnTo: "/calculator/concrete-cover-durability",
        returnField: "exposureClass",
        governingCoverExposureClass: "XD3",
        exposureClasses: ["XC4", "XD3", "XF4"],
      }),
    ).toBe(
      "/calculator/concrete-cover-durability?exposureClass=XD3&sourceExposureClasses=XC4%2CXD3%2CXF4&sourceCalculator=concrete-exposure-class",
    );
  });

  it("uses the future concrete cover durability calculator as the default return target", () => {
    expect(
      getConcreteExposureClassReturnUrl({
        governingCoverExposureClass: "XC1",
        exposureClasses: ["XC1"],
      }),
    ).toBe(
      "/calculator/concrete-cover-durability?exposureClass=XC1&sourceExposureClasses=XC1&sourceCalculator=concrete-exposure-class",
    );
  });
});
