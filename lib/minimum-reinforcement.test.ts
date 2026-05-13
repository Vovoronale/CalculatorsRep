import { describe, expect, it } from "vitest";

import {
  getEffectiveDepthMm,
  getMinimumAreaFirstMm2,
  getMinimumAreaSecondMm2,
  getMinimumReinforcementReport,
  isEurocodeRebarStrengthApplicable,
} from "@/lib/minimum-reinforcement";

describe("minimum reinforcement calculator", () => {
  it("calculates effective depth and both minimum reinforcement components", () => {
    expect(getEffectiveDepthMm(500, 50)).toBe(450);
    expect(getMinimumAreaFirstMm2(2.9, 500, 1000, 450)).toBeCloseTo(678.6, 1);
    expect(getMinimumAreaSecondMm2(1000, 450)).toBe(585);
  });

  it("builds the agreed beam report with DSTU and Eurocode references", () => {
    const report = getMinimumReinforcementReport({
      structureType: "beam",
      concreteClass: "C30/37",
      rebarClass: "A500C",
      sectionHeightMm: 500,
      tensileZoneWidthMm: 1000,
      reinforcementCentroidDistanceMm: 50,
      rebarDiameterMm: 16,
    });

    expect(report.valid).toBe(true);
    expect(report.values).toMatchObject({
      fctmMPa: 2.9,
      fykMPa: 500,
      effectiveDepthMm: 450,
      minimumAreaFirstMm2: expect.closeTo(678.6, 1),
      minimumAreaSecondMm2: 585,
      minimumAreaMm2: expect.closeTo(678.6, 1),
      minimumAreaCm2: expect.closeTo(6.79, 2),
    });
    expect(report.steps.map((step) => step.key)).toEqual([
      "inputs",
      "fctm",
      "fyk",
      "eurocode-fyk-check",
      "effective-depth",
      "as-min-1",
      "as-min-2",
      "as-min",
    ]);
    expect(report.steps.find((step) => step.key === "fctm")?.formula).toBe(
      "fctm = 2.9 МПа (C30/37)",
    );
    expect(report.steps.find((step) => step.key === "as-min-2")?.formula).toBe(
      "As,min,2 = 0.0013 * bt * d = 0.0013 * 1000 * 450 = 585 мм² = 5.85 см²",
    );
    expect(report.steps.find((step) => step.key === "as-min")?.formula).toBe(
      "As,min = max(As,min,1; As,min,2) = max(678.6; 585) = 678.6 мм² = 6.79 см²",
    );
  });

  it("adds the slab strip width step and defaults bt to 1000 mm", () => {
    const report = getMinimumReinforcementReport({
      structureType: "slab",
      concreteClass: "C30/37",
      rebarClass: "A500C",
      sectionHeightMm: 200,
      reinforcementCentroidDistanceMm: 30,
      rebarDiameterMm: 12,
    });

    expect(report.input.tensileZoneWidthMm).toBe(1000);
    expect(report.steps.map((step) => step.key)).toContain("slab-strip-width");
    expect(report.steps.find((step) => step.key === "slab-strip-width")?.formula).toBe(
      "bt = 1000 мм",
    );
  });

  it("marks Eurocode as not applicable outside the fyk range but keeps DSTU values", () => {
    const report = getMinimumReinforcementReport({
      structureType: "beam",
      concreteClass: "C30/37",
      rebarClass: "A800",
      sectionHeightMm: 500,
      tensileZoneWidthMm: 1000,
      reinforcementCentroidDistanceMm: 50,
      rebarDiameterMm: 16,
    });

    expect(isEurocodeRebarStrengthApplicable(800)).toBe(false);
    expect(report.valid).toBe(true);
    expect(report.eurocodeApplicable).toBe(false);
    expect(report.warnings).toContain(
      "Розрахунок за Eurocode 2 не виконується: fyk = 800 МПа виходить за межі 400...600 МПа згідно з п. 3.2.2(3)P EN 1992-1-1.",
    );
  });

  it("validates that a_s is smaller than h", () => {
    const report = getMinimumReinforcementReport({
      structureType: "beam",
      concreteClass: "C30/37",
      rebarClass: "A500C",
      sectionHeightMm: 50,
      tensileZoneWidthMm: 1000,
      reinforcementCentroidDistanceMm: 50,
      rebarDiameterMm: 16,
    });

    expect(report.valid).toBe(false);
    expect(report.errors).toContain("a_s має бути менше h.");
  });
});
