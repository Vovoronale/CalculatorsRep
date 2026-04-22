import { describe, expect, it } from "vitest";

import {
  calculatorCategories,
  getCalculatorBySlug,
  getCalculatorsForCategory,
} from "@/lib/calculators";

describe("calculator data model", () => {
  it("builds the category navigation in the expected order", () => {
    expect(calculatorCategories.map((category) => category.slug)).toEqual([
      "beton",
      "fundamenti",
      "stiny",
      "pokrivlya",
      "teploizolyatsiya",
      "ozdoblennya",
    ]);
  });

  it("returns calculators for both primary and secondary categories", () => {
    const concreteInFoundations = getCalculatorsForCategory("fundamenti").map(
      (calculator) => calculator.slug,
    );

    expect(concreteInFoundations).toContain("concrete-volume");
    expect(concreteInFoundations).toContain("strip-foundation");
  });

  it("resolves a calculator by slug for detail routes", () => {
    const calculator = getCalculatorBySlug("roof-area");

    expect(calculator?.title).toBe("Калькулятор площі покрівлі");
    expect(calculator?.mainCategory).toBe("pokrivlya");
    expect(calculator?.accessLabel).toBe("Вбудований розрахунок");
  });
});
