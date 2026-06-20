import { describe, expect, it } from "vitest";

import { getCalculatorArtworkPath } from "@/lib/calculator-artwork";

describe("calculator artwork paths", () => {
  it("uses PNG artwork for the approved construction and urban-planning icons", () => {
    expect(getCalculatorArtworkPath("armcon")).toBe("/calculator-icons/armcon.png");
    expect(getCalculatorArtworkPath("residential-yard-areas")).toBe(
      "/calculator-icons/residential-yard-areas.png",
    );
  });

  it("keeps existing SVG artwork for calculators outside the approved set", () => {
    expect(getCalculatorArtworkPath("cadee-external")).toBe(
      "/calculator-icons/cadee-external.svg",
    );
  });
});
