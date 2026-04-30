import { describe, expect, it } from "vitest";

import {
  calculatorCategories,
  getCalculatorBySlug,
  getCalculatorsForCategory,
} from "@/lib/calculators";

describe("calculator data model", () => {
  it("builds the category navigation in the expected order", () => {
    expect(calculatorCategories.map((category) => category.slug)).toEqual([
      "teplotekhnika",
      "normokontrol",
      "konstruktsiyi",
      "inzhenerni-merezhi",
      "instrumenty",
      "ai-asystenty",
    ]);
  });

  it("returns calculators for their main category", () => {
    const slugs = getCalculatorsForCategory("teplotekhnika").map(
      (calculator) => calculator.slug,
    );

    expect(slugs).toContain("cadee-external");
    expect(slugs).toContain("cadee-dewpoint-temperature");
  });

  it("includes FEM nodes under merged teplotekhnika", () => {
    const slugs = getCalculatorsForCategory("teplotekhnika").map(
      (calculator) => calculator.slug,
    );

    expect(slugs).toContain("cadee-bridge-homogeneous-wall-floor");
  });

  it("places each calculator in exactly one category", () => {
    for (const calculator of [
      ...calculatorCategories.flatMap((c) =>
        getCalculatorsForCategory(c.slug),
      ),
    ]) {
      expect(calculator.extraCategories).toHaveLength(0);
    }
  });

  it("every category has at least one calculator", () => {
    for (const category of calculatorCategories) {
      expect(
        getCalculatorsForCategory(category.slug).length,
      ).toBeGreaterThan(0);
    }
  });

  it("resolves a calculator by slug for detail routes", () => {
    const calculator = getCalculatorBySlug("cadee-external");

    expect(calculator?.title).toBe("Огороджувальна конструкція");
    expect(calculator?.mainCategory).toBe("teplotekhnika");
    expect(calculator?.accessLabel).toBe("Вбудований розрахунок");
    expect(calculator?.embedUrl).toBe(
      "https://cadee.pro/?thermalcalc=external",
    );
  });
});
