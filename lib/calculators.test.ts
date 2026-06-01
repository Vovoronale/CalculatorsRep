import { describe, expect, it } from "vitest";

import {
  calculatorCategories,
  calculators,
  getCalculatorBySlug,
  getCalculatorsForCategory,
} from "@/lib/calculators";

describe("calculator data model", () => {
  it("builds the category navigation in the expected order", () => {
    expect(calculatorCategories.map((category) => category.slug)).toEqual([
      "teplotekhnika",
      "fem-vuzly",
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

  it("keeps FEM node calculators in a thermal subcategory", () => {
    const parent = calculatorCategories.find(
      (category) => category.slug === "teplotekhnika",
    );
    const femCategory = calculatorCategories.find(
      (category) => category.slug === "fem-vuzly",
    );
    const thermalSlugs = getCalculatorsForCategory("teplotekhnika").map(
      (calculator) => calculator.slug,
    );
    const femSlugs = getCalculatorsForCategory("fem-vuzly").map(
      (calculator) => calculator.slug,
    );

    expect(parent?.parentSlug).toBeUndefined();
    expect(femCategory?.parentSlug).toBe("teplotekhnika");
    expect(thermalSlugs).not.toContain("cadee-bridge-homogeneous-wall-floor");
    expect(femSlugs).toContain("cadee-bridge-homogeneous-wall-floor");
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

    expect(calculator?.title).toBe(
      "Теплотехнічний розрахунок огороджувальної конструкції будівлі",
    );
    expect(calculator?.mainCategory).toBe("teplotekhnika");
    expect(calculator?.accessLabel).toBe("Вбудований розрахунок");
    expect(calculator?.standard).toBe(
      "ДСТУ 9191:2022 / ДБН В.2.6-31:2021 / ДСТУ-Н Б В.2.6-192:2013",
    );
    expect(calculator?.embedUrl).toBe(
      "https://cadee.pro/?thermalcalc=external",
    );
  });

  it("uses calculation-specific standard labels for thermal calculators", () => {
    expect(getCalculatorBySlug("cadee-floor-heat-absorption")?.standard).toBe(
      "ДСТУ-Н Б В.2.6-190:2013 / ДСТУ Б В.2.7-276",
    );
    expect(getCalculatorBySlug("cadee-heat-inertia")?.standard).toBe(
      "ДСТУ-Н Б В.2.6-190:2013 / ДСТУ 9191:2022",
    );
    expect(getCalculatorBySlug("cadee-heat-humid-state")?.standard).toBe(
      "ДСТУ-Н Б В.2.6-192:2013 / ДСТУ 9191:2022",
    );
    expect(getCalculatorBySlug("cadee-air-permeability")?.standard).toBe(
      "ДСТУ-Н Б В.2.6-191:2013 / ДБН В.2.6-31:2021",
    );
  });

  it("every calculator has a standard label for the category table", () => {
    for (const calculator of calculators) {
      expect(calculator.standard, calculator.slug).toBeTruthy();
    }
  });

  it("includes the CadEE air permeability calculator as an embedded thermal calculator", () => {
    const calculator = getCalculatorBySlug("cadee-air-permeability");

    expect(calculator?.title).toBe(
      "Повітропроникність огороджувальної конструкції будівлі",
    );
    expect(calculator?.mainCategory).toBe("teplotekhnika");
    expect(calculator?.displayMode).toBe("embed");
    expect(calculator?.embedUrl).toBe(
      "https://cadee.pro/?thermalcalc=air-permeability",
    );
    expect(calculator?.openUrl).toBe(
      "https://cadee.pro/?thermalcalc=air-permeability",
    );
  });
});
