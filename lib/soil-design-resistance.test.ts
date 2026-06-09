import { describe, expect, it } from "vitest";

import {
  DBN_E8_COEFFICIENTS,
  formatSoilDesignResistanceNumber,
  getKz,
  getLinearInterpolation,
  getMGammaMqMc,
  getSoilDesignResistanceReport,
  getTableE7Coefficients,
  type SoilDesignResistanceInput,
} from "@/lib/soil-design-resistance";

const baseInput: SoilDesignResistanceInput = {
  calculationMode: "manual-e7",
  structuralScheme: "rigid",
  buildingLengthM: 24,
  buildingHeightM: 6,
  soilType: "medium-sand",
  liquidityIndex: 0,
  gammaC1Manual: 1,
  gammaC2Manual: 1,
  phi11Deg: 30,
  gamma11KnM3: 17.1,
  gammaPrime11KnM3: 16.6,
  c11KPa: 4,
  strengthSource: "direct-testing",
  foundationWidthM: 1,
  foundationDepthM: 1.2,
  hasBasement: false,
  embedmentDepthD1M: 1.2,
  basementDepthInputM: 0,
  soilLayerAboveFootingHsM: 0,
  basementFloorThicknessHcfM: 0,
  basementFloorUnitWeightGammaCfKnM3: 0,
};

describe("soil design resistance table helpers", () => {
  it("formats numbers with stable engineering output", () => {
    expect(formatSoilDesignResistanceNumber(162.82, 1)).toBe("162.8");
    expect(formatSoilDesignResistanceNumber(16.282, 1)).toBe("16.3");
    expect(formatSoilDesignResistanceNumber(1.6282, 1)).toBe("1.6");
  });

  it("interpolates linearly", () => {
    expect(getLinearInterpolation(1.2, 1.4, 1.5, 4, 2.75)).toBeCloseTo(1.3, 10);
  });

  it("contains the DBN table E8 row for phi11 = 30 degrees", () => {
    expect(DBN_E8_COEFFICIENTS[30]).toEqual({
      phiDeg: 30,
      mGamma: 1.15,
      mQ: 5.59,
      mC: 7.95,
    });
  });

  it("returns exact table E8 coefficients for integer phi11", () => {
    expect(getMGammaMqMc(30)).toEqual({
      phiA: 30,
      phiB: 30,
      exact: true,
      mGamma: 1.15,
      mQ: 5.59,
      mC: 7.95,
    });
  });

  it("interpolates table E8 coefficients for non-integer phi11", () => {
    const result = getMGammaMqMc(30.5);

    expect(result.exact).toBe(false);
    expect(result.phiA).toBe(30);
    expect(result.phiB).toBe(31);
    expect(result.mGamma).toBeCloseTo(1.195, 10);
    expect(result.mQ).toBeCloseTo(5.77, 10);
    expect(result.mC).toBeCloseTo(8.095, 10);
  });

  it("maps actual soil type to table E7 coefficients", () => {
    expect(
      getTableE7Coefficients({
        ...baseInput,
        calculationMode: "automatic",
        structuralScheme: "rigid",
        soilType: "medium-sand",
        buildingLengthM: 24,
        buildingHeightM: 6,
      }),
    ).toMatchObject({
      gammaC1: 1.4,
      gammaC2: 1.2,
      tableRow:
        "Великоуламкові з піщаним заповнювачем і піщані, крім дрібних і пилуватих",
      gammaC2Source: "rigid-large",
    });
  });

  it("interpolates gammaC2 for rigid schemes when 1.5 < L/H < 4", () => {
    const result = getTableE7Coefficients({
      ...baseInput,
      calculationMode: "automatic",
      structuralScheme: "rigid",
      soilType: "small-sand",
      buildingLengthM: 8.25,
      buildingHeightM: 3,
    });

    expect(result.lengthHeightRatio).toBeCloseTo(2.75, 10);
    expect(result.gammaC1).toBe(1.3);
    expect(result.gammaC2).toBeCloseTo(1.2, 10);
    expect(result.gammaC2AtRatio15).toBe(1.3);
    expect(result.gammaC2AtRatio4).toBe(1.1);
    expect(result.gammaC2Source).toBe("rigid-interpolated");
  });

  it("sets gammaC2 to 1.0 for flexible structural schemes", () => {
    expect(
      getTableE7Coefficients({
        ...baseInput,
        calculationMode: "automatic",
        structuralScheme: "flexible",
        soilType: "dusty-sand-saturated",
      }),
    ).toMatchObject({
      gammaC1: 1.1,
      gammaC2: 1,
      gammaC2Source: "flexible",
    });
  });

  it("sets loose sand coefficients to 1.0", () => {
    expect(
      getTableE7Coefficients({
        ...baseInput,
        calculationMode: "automatic",
        soilType: "loose-sand",
      }),
    ).toMatchObject({
      gammaC1: 1,
      gammaC2: 1,
      tableRow: "Пухкі піски",
      gammaC2Source: "loose-sand",
    });
  });

  it("computes kz from foundation width", () => {
    expect(getKz(9.99)).toEqual({ kz: 1, source: "narrow" });
    expect(getKz(20)).toEqual({ kz: 0.6, source: "wide" });
  });
});

describe("soil design resistance report", () => {
  it("reproduces the MQN default example", () => {
    const report = getSoilDesignResistanceReport(baseInput);

    expect(report.valid).toBe(true);
    expect(report.values?.soilDesignResistanceKPa).toBeCloseTo(162.82, 2);
    expect(report.values?.soilDesignResistanceTonM2).toBeCloseTo(16.282, 3);
    expect(report.values?.soilDesignResistanceKgCm2).toBeCloseTo(1.6282, 4);
    expect(report.steps.map((step) => step.key)).toEqual([
      "inputs",
      "gamma-c",
      "k",
      "m-coefficients",
      "kz",
      "d1",
      "d1-check",
      "r",
      "unit-conversion",
    ]);
    expect(report.steps.find((step) => step.key === "r")?.formula).toBe(
      "R = γc1 * γc2 / k * [Mγ * kz * b * γ11 + Mq * d1 * γ′11 + (Mq - 1) * db * γ′11 + Mc * c11] = 1 * 1 / 1 * [1.15 * 1 * 1 * 17.1 + 5.59 * 1.2 * 16.6 + (5.59 - 1) * 0 * 16.6 + 7.95 * 4] = 162.82 кПа",
    );
    expect(report.steps.find((step) => step.key === "unit-conversion")?.formula).toBe(
      "R = 162.82 кПа = 16.3 т/м² = 1.6 кг/см²",
    );
  });

  it("builds automatic rigid interpolation report steps", () => {
    const report = getSoilDesignResistanceReport({
      ...baseInput,
      calculationMode: "automatic",
      structuralScheme: "rigid",
      soilType: "small-sand",
      buildingLengthM: 8.25,
      buildingHeightM: 3,
    });

    expect(report.steps.map((step) => step.key).slice(0, 4)).toEqual([
      "inputs",
      "length-height-ratio",
      "structural-scheme",
      "gamma-c",
    ]);
    expect(report.steps.find((step) => step.key === "length-height-ratio")?.formula).toBe(
      "L/H = L / H = 8.25 / 3 = 2.75",
    );
    expect(report.steps.find((step) => step.key === "structural-scheme")?.formula).toBe(
      "Конструктивна схема: жорстка; для ґрунту \"Пісок дрібний\", L/H = 2.75 коефіцієнт γc2 визначаємо інтерполяцією згідно з приміткою 3 до табл. Е.7; γc2 = γc2,1.5 + (γc2,4 - γc2,1.5) * (L/H - 1.5) / (4 - 1.5) = 1.3 + (1.1 - 1.3) * (2.75 - 1.5) / 2.5 = 1.2",
    );
  });

  it("builds basement d1 and db steps", () => {
    const report = getSoilDesignResistanceReport({
      ...baseInput,
      hasBasement: true,
      soilLayerAboveFootingHsM: 0.4,
      basementFloorThicknessHcfM: 0.2,
      basementFloorUnitWeightGammaCfKnM3: 22,
      gammaPrime11KnM3: 16,
      basementDepthInputM: 2.6,
      foundationDepthM: 1.2,
    });

    expect(report.steps.find((step) => step.key === "d1")?.formula).toBe(
      "d1 = hs + hcf * γcf / γ′11 = 0.4 + 0.2 * 22 / 16 = 0.68 м",
    );
    expect(report.steps.find((step) => step.key === "db")?.formula).toBe(
      "db = min(db,input; 2.0) = min(2.6; 2.0) = 2.0 м",
    );
  });

  it("applies note 6 when d1 is greater than d", () => {
    const report = getSoilDesignResistanceReport({
      ...baseInput,
      foundationDepthM: 1,
      embedmentDepthD1M: 1.5,
    });

    expect(report.warnings).toContain(
      "Оскільки d1 > d, у формулі (Е.1) прийнято d1 = d і db = 0 згідно з приміткою 6 до п. Е.4 ДБН В.2.1-10-2009.",
    );
    expect(report.steps.find((step) => step.key === "d1-check")?.formula).toBe(
      "d1 > d => 1.5 > 1; у формулі (Е.1) приймаємо d1 = d = 1 м, db = 0 м",
    );
  });

  it("returns stable invalid report without NaN formulas", () => {
    const report = getSoilDesignResistanceReport({
      ...baseInput,
      phi11Deg: 46,
      foundationWidthM: 0,
    });

    expect(report.valid).toBe(false);
    expect(report.values).toBeNull();
    expect(report.errors).toContain(
      "φ11 має бути в межах 0...45°, оскільки табл. Е.8 ДБН В.2.1-10-2009 містить значення тільки для цього діапазону.",
    );
    expect(report.errors).toContain("b має бути більше 0.");
    expect(report.steps).toHaveLength(1);
    expect(JSON.stringify(report.steps)).not.toContain("NaN");
  });
});
