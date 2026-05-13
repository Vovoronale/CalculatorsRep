import { describe, expect, it } from "vitest";

import {
  getFoundationBarAnchorageReport,
  getGoodBondCondition,
} from "@/lib/foundation-bar-anchorage";

const representativeBeamInput = {
  structureType: "beam" as const,
  concreteClass: "C30/37",
  rebarClass: "A500C",
  footingLengthMm: 3000,
  footingWidthMm: 2000,
  footingHeightMm: 600,
  effectiveDepthMm: 550,
  pedestalWidthMm: 400,
  availableAnchorageLengthMm: 700,
  axialLoadKn: 1000,
  momentKnM: 100,
  shearKn: 50,
  shearHeightM: 0.5,
  barDiameterMm: 16,
  barCount: 4,
  hBondMm: 500,
  aBottomMm: 200,
  barAngle: "horizontal" as const,
  slipForm: false,
  anchorageShape: "straight" as const,
  coverBottomMm: 50,
  coverSideMm: 60,
  barSpacingMm: 150,
  transverseRebarAreaMm2: 300,
  kScheme: "0.05" as const,
  weldedTransverseRebar: false,
  transversePressureMPa: 0,
};

describe("foundation bar anchorage calculator", () => {
  it("builds the agreed beam report with foundation and anchorage steps", () => {
    const report = getFoundationBarAnchorageReport(representativeBeamInput);

    expect(report.valid).toBe(true);
    expect(report.values).toMatchObject({
      shearMomentKnM: 25,
      totalMomentKnM: 125,
      eccentricityM: 0.125,
      meanSoilPressureKPa: expect.closeTo(166.67, 2),
      maximumSoilPressureKPa: expect.closeTo(208.33, 2),
      minimumSoilPressureKPa: 125,
      criticalDistanceMm: 300,
      soilPressureAtXKPa: expect.closeTo(200, 2),
      soilResultantKn: expect.closeTo(122.5, 2),
      externalLeverArmMm: 60,
      internalLeverArmMm: 495,
      tensileForceKn: expect.closeTo(14.85, 2),
      singleBarAreaMm2: expect.closeTo(201.06, 2),
      providedAreaMm2: expect.closeTo(804.25, 2),
      steelStressMPa: expect.closeTo(18.46, 2),
      fctdMPa: expect.closeTo(1.33, 2),
      eta1: 1,
      eta2: 1,
      fbdMPa: 3,
      basicRequiredAnchorageLengthMm: expect.closeTo(24.62, 2),
      cdMm: 50,
      alpha1: 1,
      alpha2: 0.7,
      alpha3: expect.closeTo(0.99, 2),
      alpha4: 1,
      alpha5: 1,
      alpha235: 0.7,
      designAnchorageLengthMm: expect.closeTo(17.23, 2),
      minimumAnchorageLengthMm: 160,
      requiredAnchorageLengthMm: 160,
      anchorageSufficient: true,
    });
    expect(report.steps.map((step) => step.key)).toEqual([
      "inputs",
      "shear-moment",
      "total-moment",
      "eccentricity",
      "mean-soil-pressure",
      "maximum-soil-pressure",
      "minimum-soil-pressure",
      "critical-distance",
      "soil-pressure-at-x",
      "soil-resultant",
      "external-lever-arm",
      "internal-lever-arm",
      "tensile-force",
      "single-bar-area",
      "provided-area",
      "steel-stress",
      "fctd",
      "eta1",
      "eta2",
      "fbd",
      "lb-rqd",
      "cd",
      "alpha1",
      "alpha2",
      "ast-min",
      "lambda",
      "k",
      "alpha3",
      "alpha4",
      "alpha5",
      "alpha235",
      "lbd",
      "lb-min",
      "lb-req",
      "lb-available",
      "final-check",
    ]);
    expect(report.steps.find((step) => step.key === "tensile-force")?.formula).toBe(
      "Fs = R * ze / zi = 122.5 * 60 / 495 = 14.85 кН",
    );
    expect(report.steps.find((step) => step.key === "alpha2")?.formula).toBe(
      "alpha2 = min(max(1.0 - 0.15 * (cd - Ø) / Ø; 0.7); 1.0) = min(max(1.0 - 0.15 * (50 - 16) / 16; 0.7); 1.0) = 0.7",
    );
    expect(report.steps.find((step) => step.key === "lbd")?.formula).toBe(
      "lbd = alpha1 * alpha4 * alpha235 * lb,rqd = 1 * 1 * 0.7 * 24.62 = 17.23 мм",
    );
    expect(report.steps.find((step) => step.key === "alpha235")?.formula).toBe(
      "alpha235 = max(alpha2 * alpha3 * alpha5; 0.7) = max(0.7 * 0.99 * 1; 0.7) = max(0.7; 0.7) = 0.7",
    );
    expect(report.steps.find((step) => step.key === "lb-min")?.formula).toBe(
      "lb,min = max(0.3 * lb,rqd; 10 * Ø; 100) = max(0.3 * 24.62; 10 * 16; 100) = max(7.39; 160; 100) = 160 мм",
    );
    expect(report.steps.find((step) => step.key === "final-check")?.formula).toBe(
      "lb >= lb,req => 700 >= 160 - умова виконується",
    );
  });

  it("uses slab spacing to calculate provided area per meter", () => {
    const report = getFoundationBarAnchorageReport({
      ...representativeBeamInput,
      structureType: "slab",
      barCount: undefined,
      barSpacingForAreaMm: 150,
      transverseRebarAreaMm2: 0,
    });

    expect(report.valid).toBe(true);
    expect(report.values?.providedAreaMm2).toBeCloseTo(1340.41, 2);
    expect(report.steps.find((step) => step.key === "provided-area")?.formula).toBe(
      "As,prov = As,1 * 1000 / s = 201.06 * 1000 / 150 = 1340.41 мм²/м.п.",
    );
  });

  it("detects good and other bond conditions from member height and bar position", () => {
    expect(
      getGoodBondCondition({
        hBondMm: 500,
        aBottomMm: 200,
        barAngle: "horizontal",
        slipForm: false,
      }),
    ).toBe(true);
    expect(
      getGoodBondCondition({
        hBondMm: 700,
        aBottomMm: 500,
        barAngle: "horizontal",
        slipForm: false,
      }),
    ).toBe(false);
    expect(
      getGoodBondCondition({
        hBondMm: 700,
        aBottomMm: 500,
        barAngle: "inclined",
        slipForm: false,
      }),
    ).toBe(true);
    expect(
      getGoodBondCondition({
        hBondMm: 200,
        aBottomMm: 100,
        barAngle: "horizontal",
        slipForm: true,
      }),
    ).toBe(false);
  });

  it("warns when the soil pressure diagram has partial contact", () => {
    const report = getFoundationBarAnchorageReport({
      ...representativeBeamInput,
      momentKnM: 600,
      shearKn: 0,
    });

    expect(report.valid).toBe(true);
    expect(report.values?.minimumSoilPressureKPa).toBeLessThan(0);
    expect(report.warnings).toContain(
      "qmin < 0: епюра тиску має неповний контакт підошви з ґрунтом; цей калькулятор використовує спрощену лінійну епюру повного контакту.",
    );
    expect(report.steps.map((step) => step.key)).not.toContain("full-contact-check");
  });

  it("returns a stable invalid report without NaN formulas", () => {
    const report = getFoundationBarAnchorageReport({
      ...representativeBeamInput,
      footingLengthMm: 0,
      axialLoadKn: 0,
    });

    expect(report.valid).toBe(false);
    expect(report.errors).toContain("L має бути більше 0.");
    expect(report.errors).toContain("N має бути більше 0.");
    expect(report.steps).toHaveLength(1);
    expect(report.steps[0].items?.join(" ")).not.toContain("NaN");
  });
});
