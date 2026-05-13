import { describe, expect, it } from "vitest";

import {
  getRebarAreaByDiameter,
  getRebarByClass,
  getRebarClasses,
  getRebarDesignValues,
  getRebarMaterials,
} from "@/lib/materials/rebar";

describe("rebar material directory", () => {
  it("exposes available rebar diameters with base areas", () => {
    const materials = getRebarMaterials();

    expect(materials.map((material) => material.diameterMm)).toContain(10);
    expect(materials.map((material) => material.diameterMm)).toContain(40);
    expect(getRebarAreaByDiameter(10)).toBeCloseTo(78.54, 2);
  });

  it("returns undefined for unknown rebar diameters", () => {
    expect(getRebarAreaByDiameter(7)).toBeUndefined();
  });

  it("exposes rebar classes from DSTU 3760", () => {
    const classes = getRebarClasses();

    expect(classes).toContain("A240C");
    expect(classes).toContain("A400C");
    expect(classes).toContain("A500C");
    expect(classes).toContain("A1000");
  });

  it("returns table characteristics for A500C", () => {
    expect(getRebarByClass("A500C")).toMatchObject({
      className: "A500C",
      yieldStrengthMPa: 500,
      tensileStrengthMPa: 600,
      elongationAfterRupturePercent: 14,
      totalElongationAtMaximumLoadPercent: 5,
      bendAngleDegrees: 90,
      mandrelDiameterFactor: 3,
      elasticModulusGPa: 190,
    });
  });

  it("calculates design values with explicit factors", () => {
    expect(getRebarDesignValues("A500C", { gammaS: 1.15 })).toEqual({
      fydMPa: expect.closeTo(434.783, 3),
    });
  });

  it("returns undefined for unknown rebar classes", () => {
    expect(getRebarByClass("A777C")).toBeUndefined();
    expect(getRebarDesignValues("A777C")).toBeUndefined();
  });
});
