import { describe, expect, it } from "vitest";

import {
  buildCalculatorSeoMetadata,
  buildCalculatorStructuredData,
  calculatorCategories,
  calculators,
  getCalculatorBySlug,
  getCalculatorsForCategory,
  getCalculatorSeoSections,
} from "@/lib/calculators";
import { siteContent } from "@/lib/site-content";

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

  it("places each calculator in a primary category and limits extra category duplication", () => {
    const categorySlugs = new Set(calculatorCategories.map((category) => category.slug));

    for (const calculator of calculators) {
      expect(categorySlugs.has(calculator.mainCategory), calculator.slug).toBe(true);
      for (const extraCategory of calculator.extraCategories) {
        expect(categorySlugs.has(extraCategory), calculator.slug).toBe(true);
      }
    }

    expect(
      calculators
        .filter((calculator) => calculator.extraCategories.length > 0)
        .map((calculator) => ({
          slug: calculator.slug,
          extraCategories: calculator.extraCategories,
        })),
    ).toEqual([
      {
        slug: "soil-design-resistance",
        extraCategories: ["perevirka-dbn", "normatyvni-obgruntuvannya"],
      },
      {
        slug: "foundation-base-pressure",
        extraCategories: ["perevirka-dbn", "normatyvni-obgruntuvannya"],
      },
      {
        slug: "concrete-exposure-class",
        extraCategories: ["beton", "normy-perevirky", "normatyvni-obgruntuvannya"],
      },
      {
        slug: "concrete-cover-durability",
        extraCategories: ["beton", "normy-perevirky", "normatyvni-obgruntuvannya"],
      },
    ]);
  });

  it("allows empty prepared subcategories while keeping top-level categories populated", () => {
    const topLevelCategories = calculatorCategories.filter((category) => !category.parentSlug);

    for (const category of topLevelCategories) {
      expect(getCalculatorsForCategory(category.slug).length, category.slug).toBeGreaterThan(0);
    }

    expect(getCalculatorsForCategory("perevirka-dbn").map((calculator) => calculator.slug)).toEqual([
      "soil-design-resistance",
      "foundation-base-pressure",
    ]);
    expect(getCalculatorsForCategory("asystenty-pidhotovky-poyasnen")).toHaveLength(0);
  });

  it("registers the soil design resistance calculator as a native foundation calculator", () => {
    const calculator = getCalculatorBySlug("soil-design-resistance");

    expect(calculator).toMatchObject({
      title: "Розрахунковий опір ґрунту основи",
      shortDescription:
        "Обчислення розрахункового опору ґрунту основи R за додатком Е ДБН В.2.1-10-2009.",
      mainCategory: "fundamenty",
      extraCategories: ["perevirka-dbn", "normatyvni-obgruntuvannya"],
      displayMode: "native",
      nativeCalculator: "soil-design-resistance",
      icon: "Layers",
      standard: "ДБН В.2.1-10-2009, додаток Е",
    });
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

  it("registers the foundation base pressure calculator as a native foundation calculator", () => {
    const calculator = getCalculatorBySlug("foundation-base-pressure");

    expect(calculator).toMatchObject({
      title: "Напруження під підошвою фундаменту",
      shortDescription:
        "Розрахунок крайових напружень під прямокутною підошвою фундаменту з урахуванням відриву.",
      mainCategory: "fundamenty",
      extraCategories: ["perevirka-dbn", "normatyvni-obgruntuvannya"],
      displayMode: "native",
      nativeCalculator: "foundation-base-pressure",
      icon: "Layers",
      standard: "Методика визначення крайових напружень під прямокутною підошвою фундаменту",
    });
  });

  it("registers the concrete exposure class calculator as a native reinforced concrete calculator", () => {
    const calculator = getCalculatorBySlug("concrete-exposure-class");

    expect(calculator).toMatchObject({
      title: "Клас впливу середовища для бетону",
      shortDescription:
        "Визначення XC, XD, XS, XF та XA для бетонного або залізобетонного елемента з передачею керівного класу в розрахунок захисного шару.",
      mainCategory: "zalizobeton",
      extraCategories: ["beton", "normy-perevirky", "normatyvni-obgruntuvannya"],
      displayMode: "native",
      nativeCalculator: "concrete-exposure-class",
      icon: "ShieldCheck",
      standard: "ДБН В.2.6-98:2009 / ДСТУ ENV 206:2018",
    });
  });

  it("registers the concrete cover durability calculator as a native reinforced concrete calculator", () => {
    const calculator = getCalculatorBySlug("concrete-cover-durability");

    expect(calculator).toMatchObject({
      title: "Захисний шар бетону для арматури",
      shortDescription:
        "Розрахунок мінімального та номінального захисного шару cmin і cnom за ДБН В.2.6-98:2009.",
      mainCategory: "zalizobeton",
      extraCategories: ["beton", "normy-perevirky", "normatyvni-obgruntuvannya"],
      displayMode: "native",
      nativeCalculator: "concrete-cover-durability",
      icon: "Shield",
      standard: "ДБН В.2.6-98:2009, п. 4.4",
    });
  });

  it("builds unique metadata from calculator title, category, and short description", () => {
    const metadata = calculators.map((calculator) =>
      buildCalculatorSeoMetadata(calculator, siteContent.brand.umbrella),
    );

    expect(new Set(metadata.map((item) => item.title)).size).toBe(calculators.length);
    expect(new Set(metadata.map((item) => item.description)).size).toBe(
      calculators.length,
    );

    const soil = getCalculatorBySlug("soil-design-resistance");

    if (!soil) {
      throw new Error("Expected native soil design resistance calculator to exist");
    }

    expect(buildCalculatorSeoMetadata(soil, siteContent.brand.umbrella)).toEqual({
      title: "Розрахунковий опір ґрунту основи | Фундаменти | IVapps.pro",
      description:
        "Розрахунковий опір ґрунту основи у категорії «Фундаменти»: Обчислення розрахункового опору ґрунту основи R за додатком Е ДБН В.2.1-10-2009.",
    });
  });

  it("builds calculator SEO sections with methodology, example, and normative context", () => {
    const calculator = getCalculatorBySlug("soil-design-resistance");

    if (!calculator) {
      throw new Error("Expected native soil design resistance calculator to exist");
    }

    const sections = getCalculatorSeoSections(calculator);

    expect(sections.map((section) => section.title)).toEqual([
      "Короткий опис задачі",
      "Де застосовується",
      "Вхідні параметри",
      "Формули та методика",
      "Приклад розрахунку",
      "Обмеження",
      "Нормативна база",
    ]);
    expect(sections[0].body).toContain(
      "Обчислення розрахункового опору ґрунту основи R",
    );
    expect(sections[3].body).toContain("ДБН В.2.1-10-2009, додаток Е");
    expect(sections[4].body).toContain("Розрахунковий опір ґрунту основи");
    expect(sections[6].items).toEqual(["ДБН В.2.1-10-2009, додаток Е"]);
  });

  it("uses calculator SEO content overrides when they are present", () => {
    const calculator = getCalculatorBySlug("rebar-area-bars");

    if (!calculator) {
      throw new Error("Expected native rebar calculator to exist");
    }

    const sections = getCalculatorSeoSections({
      ...calculator,
      seoContent: {
        task: "Підібрати набір стрижнів за потрібною площею арматури.",
        applications: ["Підбір робочої арматури балки"],
        inputParameters: ["Потрібна площа As"],
        formulas: ["As = n * π * d² / 4"],
        example: "Для As = 5 см² калькулятор підбирає найближчу комбінацію.",
        limitations: ["Не перевіряє міцність перерізу."],
        standards: ["ДСТУ 3760:2006"],
      },
    });

    expect(sections[0].body).toBe(
      "Підібрати набір стрижнів за потрібною площею арматури.",
    );
    expect(sections[1].items).toEqual(["Підбір робочої арматури балки"]);
    expect(sections[2].items).toEqual(["Потрібна площа As"]);
    expect(sections[3].items).toEqual(["As = n * π * d² / 4"]);
    expect(sections[4].body).toBe(
      "Для As = 5 см² калькулятор підбирає найближчу комбінацію.",
    );
    expect(sections[5].items).toEqual(["Не перевіряє міцність перерізу."]);
    expect(sections[6].items).toEqual(["ДСТУ 3760:2006"]);
  });

  it("builds BreadcrumbList and SoftwareApplication structured data", () => {
    const calculator = getCalculatorBySlug("soil-design-resistance");

    if (!calculator) {
      throw new Error("Expected native soil design resistance calculator to exist");
    }

    const structuredData = buildCalculatorStructuredData(
      calculator,
      "https://ivapps.pro",
      siteContent.brand.umbrella,
    );

    expect(structuredData).toEqual([
      {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Каталог",
            item: "https://ivapps.pro/",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Конструкції",
            item: "https://ivapps.pro/#konstruktsiyi",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: "Фундаменти",
            item: "https://ivapps.pro/#fundamenty",
          },
          {
            "@type": "ListItem",
            position: 4,
            name: "Розрахунковий опір ґрунту основи",
            item: "https://ivapps.pro/calculator/soil-design-resistance",
          },
        ],
      },
      {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: "Розрахунковий опір ґрунту основи",
        applicationCategory: "EngineeringApplication",
        operatingSystem: "Web",
        url: "https://ivapps.pro/calculator/soil-design-resistance",
        description:
          "Обчислення розрахункового опору ґрунту основи R за додатком Е ДБН В.2.1-10-2009.",
        provider: {
          "@type": "Organization",
          name: "IVapps.pro",
        },
      },
    ]);
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
