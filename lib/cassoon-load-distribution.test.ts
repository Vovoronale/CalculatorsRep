import { describe, expect, it } from "vitest";

import {
  getCassoonLoadDistributionCoefficients,
  getCassoonLoadDistributionReport,
} from "@/lib/cassoon-load-distribution";

describe("cassoon load distribution calculator", () => {
  it("calculates c1 and c2 from the fourth powers of spans", () => {
    const coefficients = getCassoonLoadDistributionCoefficients(3, 6);

    expect(coefficients.c1).toBeCloseTo(16 / 17, 6);
    expect(coefficients.c2).toBeCloseTo(1 / 17, 6);
  });

  it("builds a two-way load distribution report for ld/lk = 2", () => {
    const report = getCassoonLoadDistributionReport({
      shortSpanM: 3,
      longSpanM: 6,
      totalLoadKnM2: 10,
    });

    expect(report.valid).toBe(true);
    expect(report.values).toMatchObject({
      spanRatio: 2,
      c1: expect.closeTo(0.941176, 5),
      c2: expect.closeTo(0.058824, 5),
      shortDirectionLoadKnM2: expect.closeTo(9.4118, 4),
      longDirectionLoadKnM2: expect.closeTo(0.5882, 4),
      isOneWay: false,
    });
    expect(report.steps.map((step) => step.key)).toEqual([
      "source",
      "inputs",
      "span-ratio",
      "coefficients",
      "loads",
      "check-sum",
    ]);
    expect(report.steps.find((step) => step.key === "span-ratio")?.formula).toBe(
      "ld/lk = 6 / 3 = 2",
    );
    expect(report.steps.find((step) => step.key === "loads")?.formula).toBe(
      "qk = c1 * q = 0.9412 * 10 = 9.41 кН/м²; qd = c2 * q = 0.0588 * 10 = 0.59 кН/м²",
    );
  });

  it("uses one-way distribution when ld/lk is greater than 2", () => {
    const report = getCassoonLoadDistributionReport({
      shortSpanM: 3,
      longSpanM: 6.3,
      totalLoadKnM2: 10,
    });

    expect(report.valid).toBe(true);
    expect(report.values).toMatchObject({
      spanRatio: 2.1,
      c1: 1,
      c2: 0,
      shortDirectionLoadKnM2: 10,
      longDirectionLoadKnM2: 0,
      isOneWay: true,
    });
    expect(report.steps.map((step) => step.key)).toContain("one-way-rule");
    expect(report.warnings).toContain(
      "ld/lk більше 2: за приміткою Ліновіча плиту доцільно розглядати як балкову, з передачею навантаження тільки за коротким прольотом lk.",
    );
  });

  it("validates positive spans, positive load, and long span order", () => {
    const report = getCassoonLoadDistributionReport({
      shortSpanM: 6,
      longSpanM: 3,
      totalLoadKnM2: 0,
    });

    expect(report.valid).toBe(false);
    expect(report.errors).toEqual([
      "q має бути більше 0.",
      "ld має бути не менше lk.",
    ]);
  });
});
