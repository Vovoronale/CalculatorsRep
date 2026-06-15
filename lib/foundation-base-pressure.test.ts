import { describe, expect, it } from "vitest";

import {
  DEFAULT_FOUNDATION_BASE_PRESSURE_INPUT,
  getFoundationBasePressureReport,
} from "@/lib/foundation-base-pressure";

describe("foundation base pressure calculator", () => {
  it("reproduces the two-corner uplift example", () => {
    const report = getFoundationBasePressureReport(
      DEFAULT_FOUNDATION_BASE_PRESSURE_INPUT,
    );

    expect(report.valid).toBe(true);
    expect(report.values).toMatchObject({
      selfWeightT: expect.closeTo(17.28, 6),
      totalVerticalForceT: expect.closeTo(43.28, 6),
      areaM2: expect.closeTo(4.32, 6),
      sectionModulusWyM3: expect.closeTo(1.728, 6),
      sectionModulusWxM3: expect.closeTo(1.296, 6),
      baseMomentXTm: expect.closeTo(2.8, 6),
      baseMomentYTm: expect.closeTo(24.1, 6),
      eccentricityXM: expect.closeTo(0.5568, 4),
      eccentricityYM: expect.closeTo(0.0647, 4),
      noUpliftCornerStressesTM2: [
        expect.closeTo(26.13, 2),
        expect.closeTo(21.8, 2),
        expect.closeTo(-1.77, 2),
        expect.closeTo(-6.09, 2),
      ],
      uplift: {
        type: "two-corners",
        c1M: expect.closeTo(0.2781, 4),
        c2M: expect.closeTo(0.6927, 4),
        upliftSharePercent: expect.closeTo(20.2, 1),
        contactStressesTM2: [
          expect.closeTo(27.73, 2),
          expect.closeTo(22.31, 2),
        ],
      },
    });
    expect(report.steps.map((step) => step.key)).toContain("uplift-two-corners");
    expect(report.steps.find((step) => step.key === "uplift-two-corners")?.formula).toBe(
      "P_lift = (c1 + c2) / 2 * b * 1 / (b * l) * 100 = (0.2781 + 0.6927) / 2 * 1.80 * 1 / (1.80 * 2.40) * 100 = 20.2%",
    );
  });

  it("reproduces the one-corner uplift example", () => {
    const report = getFoundationBasePressureReport({
      ...DEFAULT_FOUNDATION_BASE_PRESSURE_INPUT,
      momentXTm: 9,
    });

    expect(report.valid).toBe(true);
    expect(report.values?.noUpliftCornerStressesTM2).toEqual([
      expect.closeTo(31.53, 2),
      expect.closeTo(16.4, 2),
      expect.closeTo(3.63, 2),
      expect.closeTo(-11.49, 2),
    ]);
    expect(report.values?.uplift).toMatchObject({
      type: "one-corner",
      c1M: expect.closeTo(1.734, 4),
      c2M: expect.closeTo(1.3427, 4),
      upliftSharePercent: expect.closeTo(26.9, 1),
      contactStressesTM2: [
        expect.closeTo(36.39, 2),
        expect.closeTo(15.7, 2),
        expect.closeTo(0.76, 2),
      ],
    });
    expect(report.steps.find((step) => step.key === "uplift-one-corner")?.formula).toBe(
      "P_lift = c1 * c2 / (2 * b * l) * 100 = 1.7340 * 1.3427 / (2 * 1.80 * 2.40) * 100 = 26.9%",
    );
  });

  it("returns final corner stresses when uplift is absent", () => {
    const report = getFoundationBasePressureReport({
      ...DEFAULT_FOUNDATION_BASE_PRESSURE_INPUT,
      momentXTm: 0,
      momentYTm: 0,
      shearXT: 0,
      shearYT: 0,
    });

    expect(report.valid).toBe(true);
    expect(report.values?.uplift).toMatchObject({ type: "none" });
    expect(report.warnings).toEqual([]);
  });

  it("does not include unresolved source-name placeholder text in report captions", () => {
    const report = getFoundationBasePressureReport(
      DEFAULT_FOUNDATION_BASE_PRESSURE_INPUT,
    );

    expect(JSON.stringify(report.steps)).not.toContain(
      "назву джерела буде уточнено користувачем",
    );
  });

  it("validates dimensions and avoids non-finite formulas", () => {
    const report = getFoundationBasePressureReport({
      ...DEFAULT_FOUNDATION_BASE_PRESSURE_INPUT,
      foundationLengthM: 0,
    });

    expect(report.valid).toBe(false);
    expect(report.errors).toEqual(["l має бути більше 0."]);
    expect(JSON.stringify(report.steps)).not.toContain("NaN");
  });
});
