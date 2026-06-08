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
      "energoefektyvnist-teplotekhnika",
      "ogorodzhuvalni-konstruktsiyi",
      "pidlohy",
      "voloha-tochka-rosy",
      "temperatura-poverkhni",
      "teplova-inertsiya",
      "teplovi-mistky-fem",
      "povitropronyknist",
      "konstruktsiyi",
      "zalizobeton",
      "armatura",
      "beton",
      "balky-plyty",
      "fundamenty",
      "ankeruvannya",
      "dovidkovi-tablytsi",
      "normy-perevirky",
      "normokontrol",
      "klas-naslidkiv",
      "perevirka-dbn",
      "normatyvni-obgruntuvannya",
      "ai-asystenty-z-norm",
      "inzhenerni-merezhi",
      "elektryka",
      "opalennya",
      "ventylyatsiya",
      "vodopostachannya",
      "enerhospozhyvannya",
      "cad-gis-dani",
      "dxf-geojson",
      "konvertery",
      "heometriya",
      "import-eksport",
      "dovidnyky",
      "dovidnyk-beton",
      "dovidnyk-armatura",
      "materialy",
      "normatyvni-kharakterystyky",
      "ai-instrumenty",
      "asystenty-dbn",
      "asystenty-perevirky-rishen",
      "asystenty-pidhotovky-poyasnen",
    ]);
  });

  it("aggregates calculators for top-level categories", () => {
    const slugs = getCalculatorsForCategory("energoefektyvnist-teplotekhnika").map(
      (calculator) => calculator.slug,
    );

    expect(slugs).toContain("cadee-external");
    expect(slugs).toContain("cadee-dewpoint-temperature");
    expect(slugs).toContain("cadee-bridge-homogeneous-wall-floor");
  });

  it("keeps thermal calculators in specific subcategories", () => {
    const parent = calculatorCategories.find(
      (category) => category.slug === "energoefektyvnist-teplotekhnika",
    );
    const femCategory = calculatorCategories.find(
      (category) => category.slug === "teplovi-mistky-fem",
    );
    const envelopeSlugs = getCalculatorsForCategory("ogorodzhuvalni-konstruktsiyi").map(
      (calculator) => calculator.slug,
    );
    const floorSlugs = getCalculatorsForCategory("pidlohy").map(
      (calculator) => calculator.slug,
    );
    const femSlugs = getCalculatorsForCategory("teplovi-mistky-fem").map(
      (calculator) => calculator.slug,
    );

    expect(parent?.parentSlug).toBeUndefined();
    expect(femCategory?.parentSlug).toBe("energoefektyvnist-teplotekhnika");
    expect(envelopeSlugs).toEqual([
      "cadee-external",
      "cadee-heat-transfer-resistance",
    ]);
    expect(floorSlugs).toContain("cadee-floor-ground");
    expect(femSlugs).toContain("cadee-bridge-homogeneous-wall-floor");
  });

  it("moves reference calculators into reference subcategories", () => {
    expect(
      getCalculatorsForCategory("dovidnyk-armatura").map((calculator) => calculator.slug),
    ).toEqual(["rebar-characteristics"]);
    expect(
      getCalculatorsForCategory("dovidnyk-beton").map((calculator) => calculator.slug),
    ).toEqual(["concrete-characteristics"]);
    expect(
      getCalculatorsForCategory("dovidnyky").map((calculator) => calculator.slug),
    ).toEqual(["rebar-characteristics", "concrete-characteristics"]);
  });

  it("places each calculator in exactly one primary category without extra category duplication", () => {
    const categorySlugs = new Set(calculatorCategories.map((category) => category.slug));

    for (const calculator of calculators) {
      expect(categorySlugs.has(calculator.mainCategory), calculator.slug).toBe(true);
      expect(calculator.extraCategories).toHaveLength(0);
    }
  });

  it("allows empty prepared subcategories while keeping top-level categories populated", () => {
    const topLevelCategories = calculatorCategories.filter((category) => !category.parentSlug);

    for (const category of topLevelCategories) {
      expect(getCalculatorsForCategory(category.slug).length, category.slug).toBeGreaterThan(0);
    }

    expect(getCalculatorsForCategory("perevirka-dbn")).toHaveLength(0);
    expect(getCalculatorsForCategory("asystenty-pidhotovky-poyasnen")).toHaveLength(0);
  });

  it("resolves a calculator by slug for detail routes", () => {
    const calculator = getCalculatorBySlug("cadee-external");

    expect(calculator?.title).toBe(
      "Теплотехнічний розрахунок огороджувальної конструкції будівлі",
    );
    expect(calculator?.mainCategory).toBe("ogorodzhuvalni-konstruktsiyi");
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
    expect(calculator?.mainCategory).toBe("povitropronyknist");
    expect(calculator?.displayMode).toBe("embed");
    expect(calculator?.embedUrl).toBe(
      "https://cadee.pro/?thermalcalc=air-permeability",
    );
    expect(calculator?.openUrl).toBe(
      "https://cadee.pro/?thermalcalc=air-permeability",
    );
  });
});
