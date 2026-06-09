import { describe, expect, it } from "vitest";

import {
  DBN_E8_COEFFICIENTS,
  formatSoilDesignResistanceNumber,
  getKz,
  getLinearInterpolation,
  getMGammaMqMc,
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
