import { describe, expect, it } from "vitest";

import { getCalculatorArtworkPath } from "@/lib/calculator-artwork";
import { calculators } from "@/lib/calculators";

describe("calculator artwork paths", () => {
  it("uses PNG artwork for the approved construction and urban-planning icons", () => {
    expect(getCalculatorArtworkPath("armcon")).toBe("/calculator-icons/armcon.png");
    expect(getCalculatorArtworkPath("residential-yard-areas")).toBe(
      "/calculator-icons/residential-yard-areas.png",
    );
  });

  it("uses PNG artwork for calculators outside the original approved set", () => {
    expect(getCalculatorArtworkPath("cadee-external")).toBe(
      "/calculator-icons/cadee-external.png",
    );
  });

  it("uses PNG artwork for every registered calculator", () => {
    for (const calculator of calculators) {
      expect(getCalculatorArtworkPath(calculator.slug), calculator.slug).toMatch(
        /\.png$/,
      );
    }
  });
});
