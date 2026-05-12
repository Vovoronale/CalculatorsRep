import { describe, expect, it } from "vitest";

import {
  convertAreaToSquareMillimeters,
  formatRebarArea,
  formatRebarUtilization,
  getRebarMaximumAreaSquareMillimeters,
  getRebarAreaSquareMillimeters,
  getRebarBarCounts,
  getRebarSelection,
} from "@/lib/rebar-area-bars";

describe("rebar area by bars calculator", () => {
  it("calculates total reinforcement area in square millimeters", () => {
    expect(getRebarAreaSquareMillimeters(10, 1)).toBeCloseTo(78.54, 2);
    expect(getRebarAreaSquareMillimeters(10, 10)).toBeCloseTo(785.4, 2);
  });

  it("converts user input area to square millimeters", () => {
    expect(convertAreaToSquareMillimeters(5, "cm2")).toBe(500);
    expect(convertAreaToSquareMillimeters(500, "mm2")).toBe(500);
    expect(convertAreaToSquareMillimeters(0.0005, "m2")).toBe(500);
  });

  it("formats area values with unit-specific precision", () => {
    const area = getRebarAreaSquareMillimeters(10, 1);

    expect(formatRebarArea(area, "mm2")).toBe("78.54");
    expect(formatRebarArea(area, "cm2")).toBe("0.785");
    expect(formatRebarArea(area, "m2")).toBe("0.00007854");
  });

  it("formats utilization against the minimum required area", () => {
    expect(formatRebarUtilization(500, getRebarAreaSquareMillimeters(8, 10))).toBe(
      "99.5%",
    );
    expect(formatRebarUtilization(500, getRebarAreaSquareMillimeters(10, 7))).toBe(
      "90.9%",
    );
  });

  it("uses 1-9 plus custom n for the table columns", () => {
    expect(getRebarBarCounts(10)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(getRebarBarCounts(12)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 12]);
    expect(getRebarBarCounts(120)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 120]);
  });

  it("finds the smallest eligible combination for required area", () => {
    const selection = getRebarSelection({
      requiredAreaSquareMillimeters: 500,
      customCount: 10,
    });

    expect(selection.bestMatch).toEqual({
      diameter: 8,
      count: 10,
      areaSquareMillimeters: expect.closeTo(502.65, 2),
    });
    expect(selection.eligibleKeys.has("8:10")).toBe(true);
    expect(selection.eligibleKeys.has("10:7")).toBe(true);
    expect(selection.eligibleKeys.has("10:6")).toBe(false);
  });

  it("limits eligible combinations to the requested area range", () => {
    const selection = getRebarSelection({
      requiredAreaSquareMillimeters: 500,
      customCount: 10,
    });

    expect(selection.eligibleKeys.has("8:10")).toBe(true);
    expect(selection.eligibleKeys.has("10:7")).toBe(true);
    expect(selection.eligibleKeys.has("10:8")).toBe(true);
    expect(selection.eligibleKeys.has("10:9")).toBe(false);
    expect(selection.eligibleKeys.has("10:6")).toBe(false);
  });

  it("derives the maximum area as an internal limit", () => {
    expect(getRebarMaximumAreaSquareMillimeters(500)).toBe(630);
    expect(getRebarMaximumAreaSquareMillimeters(0)).toBe(0);
  });
});
