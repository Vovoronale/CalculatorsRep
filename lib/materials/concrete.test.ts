import { describe, expect, it } from "vitest";

import {
  getConcreteByClass,
  getConcreteClasses,
  getConcreteDesignValues,
} from "@/lib/materials/concrete";

describe("concrete material directory", () => {
  it("exposes concrete classes from C8/10 to C90/105", () => {
    const classes = getConcreteClasses();

    expect(classes).toContain("C8/10");
    expect(classes).toContain("C20/25");
    expect(classes).toContain("C30/37");
    expect(classes).toContain("C90/105");
  });

  it("returns table characteristics for C30/37", () => {
    expect(getConcreteByClass("C30/37")).toMatchObject({
      className: "C30/37",
      fckMPa: 30,
      fckCubeMPa: 37,
      fcmMPa: 38,
      fctmMPa: 2.9,
      fctk005MPa: 2.0,
      fctk095MPa: 3.8,
      ecmGPa: 33,
      epsilonC1PerMille: 2.2,
      epsilonCu1PerMille: 3.5,
      epsilonC2PerMille: 2.0,
      epsilonCu2PerMille: 3.5,
      n: 2.0,
      epsilonC3PerMille: 1.75,
      epsilonCu3PerMille: 3.5,
    });
  });

  it("calculates design values with explicit factors", () => {
    expect(
      getConcreteDesignValues("C30/37", {
        gammaC: 1.5,
        alphaCc: 1,
        alphaCt: 1,
      }),
    ).toEqual({
      fcdMPa: 20,
      fctdMPa: expect.closeTo(1.333, 3),
    });
  });

  it("returns undefined for unknown concrete classes", () => {
    expect(getConcreteByClass("C31/38")).toBeUndefined();
    expect(getConcreteDesignValues("C31/38")).toBeUndefined();
  });
});
