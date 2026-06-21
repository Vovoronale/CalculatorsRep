import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

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
import { getCalculatorArtworkPath } from "@/lib/calculator-artwork";

describe("calculator data model", () => {
  it("builds the category navigation in the expected order", () => {
    expect(calculatorCategories.map((category) => category.slug)).toEqual([
      "konstruktsiyi",
      "zalizobeton",
      "fundamenty",
      "stalevi-konstruktsiyi",
      "budivelna-mekhanika",
      "mistobuduvannya-blahoustriy",
      "normy-perevirky",
      "normokontrol",
      "klas-naslidkiv",
      "dxf-geojson",
      "inzhenerni-merezhi",
      "elektryka",
      "energoefektyvnist-teplotekhnika",
      "ogorodzhuvalni-konstruktsiyi",
      "pidlohy",
      "teplovi-mistky-fem",
      "ai-instrumenty",
      "asystenty-dbn",
    ]);
  });

  it("groups project documentation tools under EDESSB", () => {
    const category = calculatorCategories.find(
      (item) => item.slug === "normy-perevirky",
    );
    const geoJsonCategory = calculatorCategories.find(
      (item) => item.slug === "dxf-geojson",
    );
    const categorySlugs = calculatorCategories.map((item) => item.slug);

    expect(category).toMatchObject({
      title: "ЄДЕССБ та ПД",
      icon: "FileText",
    });
    expect(geoJsonCategory?.parentSlug).toBe("normy-perevirky");
    expect(categorySlugs).not.toContain("cad-gis-dani");
    expect(categorySlugs).not.toContain("perevirka-dbn");
    expect(categorySlugs).not.toContain("normatyvni-obgruntuvannya");
    expect(getCalculatorsForCategory("normy-perevirky").map((item) => item.slug)).toEqual([
      "normcontrol",
      "consequence-class",
      "iv-geojson",
    ]);
  });

  it("describes NormControl as an automated normative-validity check", () => {
    const normControl = getCalculatorBySlug("normcontrol");

    expect(normControl?.title).toContain("автоматизована перевірка чинності нормативів");
    expect(normControl?.shortDescription).toContain("проєктній документації");
    expect(normControl?.description).toContain("проєктній документації");
  });

  it("aggregates calculators for top-level categories", () => {
    const slugs = getCalculatorsForCategory("energoefektyvnist-teplotekhnika").map(
      (calculator) => calculator.slug,
    );

    expect(slugs).toContain("cadee-external");
    expect(slugs).toContain("cadee-dewpoint-temperature");
    expect(slugs).toContain("cadee-bridge-homogeneous-wall-floor");
  });

  it("groups thermal envelope calculators under envelope structures", () => {
    const parent = calculatorCategories.find(
      (category) => category.slug === "energoefektyvnist-teplotekhnika",
    );
    const envelopeCategory = calculatorCategories.find(
      (category) => category.slug === "ogorodzhuvalni-konstruktsiyi",
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
    expect(envelopeCategory?.parentSlug).toBe("energoefektyvnist-teplotekhnika");
    expect(envelopeSlugs).toEqual([
      "cadee-external",
      "cadee-heat-transfer-resistance",
      "cadee-heat-humid-state",
      "cadee-vapor-permeability-resistance",
      "cadee-heat-inertia",
      "cadee-summer-thermo-resistance",
      "cadee-dewpoint-temperature",
      "cadee-delta-surface-temperature",
      "cadee-air-permeability",
    ]);
    expect(floorSlugs).toContain("cadee-floor-ground");
    expect(femSlugs).toContain("cadee-bridge-homogeneous-wall-floor");
  });

  it("moves reference calculators into reinforced concrete", () => {
    const categorySlugs = calculatorCategories.map((category) => category.slug);
    const reinforcedConcreteSlugs = getCalculatorsForCategory("zalizobeton").map(
      (calculator) => calculator.slug,
    );

    expect(categorySlugs).not.toContain("dovidnyky");
    expect(categorySlugs).not.toContain("dovidnyk-armatura");
    expect(categorySlugs).not.toContain("dovidnyk-beton");
    expect(reinforcedConcreteSlugs).toEqual([
      "armcon",
      "minimum-reinforcement-area",
      "foundation-bar-anchorage",
      "rebar-area-bars",
      "concrete-exposure-class",
      "rebar-characteristics",
      "concrete-characteristics",
      "concrete-cover-durability",
    ]);
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
    ).toEqual([]);
  });

  it("keeps only populated category branches", () => {
    const topLevelCategories = calculatorCategories.filter((category) => !category.parentSlug);
    const removedSlugs = [
      "voloha-tochka-rosy",
      "temperatura-poverkhni",
      "teplova-inertsiya",
      "povitropronyknist",
      "armatura",
      "beton",
      "balky-plyty",
      "ankeruvannya",
      "dovidkovi-tablytsi",
      "ai-asystenty-z-norm",
      "opalennya",
      "ventylyatsiya",
      "vodopostachannya",
      "enerhospozhyvannya",
      "konvertery",
      "heometriya",
      "import-eksport",
      "dovidnyky",
      "dovidnyk-beton",
      "dovidnyk-armatura",
      "materialy",
      "normatyvni-kharakterystyky",
      "asystenty-perevirky-rishen",
      "asystenty-pidhotovky-poyasnen",
      "cad-gis-dani",
      "perevirka-dbn",
      "normatyvni-obgruntuvannya",
    ];
    const categorySlugs = calculatorCategories.map((category) => category.slug);

    for (const category of topLevelCategories) {
      expect(getCalculatorsForCategory(category.slug).length, category.slug).toBeGreaterThan(0);
    }

    for (const removedSlug of removedSlugs) {
      expect(categorySlugs).not.toContain(removedSlug);
    }

  });

  it("registers the steel category/group calculator in the steel category", () => {
    const calculator = getCalculatorBySlug("steel-structure-category-group");
    const category = calculatorCategories.find(
      (item) => item.slug === "stalevi-konstruktsiyi",
    );

    expect(category).toMatchObject({
      parentSlug: "konstruktsiyi",
      title: "Сталеві конструкції",
      icon: "Hammer",
    });
    expect(calculator).toMatchObject({
      mainCategory: "stalevi-konstruktsiyi",
      extraCategories: [],
      displayMode: "native",
      nativeCalculator: "steel-structure-category-group",
      standard: "ДБН В.2.6-198:2014",
    });
  });

  it("registers structural mechanics calculators under construction mechanics", () => {
    const category = calculatorCategories.find(
      (item) => item.slug === "budivelna-mekhanika",
    );

    expect(category).toMatchObject({
      parentSlug: "konstruktsiyi",
      title: "Будівельна механіка",
      icon: "Activity",
    });
    expect(
      getCalculatorsForCategory("budivelna-mekhanika").map(
        (calculator) => calculator.slug,
      ),
    ).toEqual(["cassoon-load-distribution", "livebeamcalculator"]);
  });

  it("registers the soil design resistance calculator as a native foundation calculator", () => {
    const calculator = getCalculatorBySlug("soil-design-resistance");

    expect(calculator).toMatchObject({
      title: "Розрахунковий опір ґрунту основи",
      shortDescription:
        "Обчислення розрахункового опору ґрунту основи R за додатком Е ДБН В.2.1-10-2009.",
      mainCategory: "fundamenty",
      extraCategories: [],
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

  it("registers the residential yard calculator in the urban planning category", () => {
    const category = calculatorCategories.find(
      (item) => item.slug === ("mistobuduvannya-blahoustriy" as string),
    );
    const calculator = calculators.find(
      (item) => item.slug === "residential-yard-areas",
    );

    expect(category).toMatchObject({
      title: "Містобудування та благоустрій",
      icon: "MapPinned",
    });
    expect(calculator).toMatchObject({
      mainCategory: "mistobuduvannya-blahoustriy",
      extraCategories: [],
      displayMode: "native",
      nativeCalculator: "residential-yard-areas",
      icon: "LandPlot",
    });
  });

  it("has a catalog image asset for every calculator", () => {
    for (const calculator of calculators) {
      const artworkPath = getCalculatorArtworkPath(calculator.slug);

      expect(
        existsSync(
          join(process.cwd(), "public", artworkPath.slice(1)),
        ),
        calculator.slug,
      ).toBe(true);
    }
  });

  it("keeps the approved ArmCon and LiveBeamCalculator PNG conversions", () => {
    const approvedHashes = {
      armcon: "202fa591cfd4442c2af2952fe357b9f32ac07b87354d067fcd25991843b850b7",
      livebeamcalculator:
        "116f41db1f3bac32d910f0d20df418d98b3f347bc9da62f857bf22014744426f",
    };

    for (const [slug, approvedHash] of Object.entries(approvedHashes)) {
      const image = readFileSync(
        join(process.cwd(), "public", "calculator-icons", `${slug}.png`),
      );

      expect(image.subarray(1, 4).toString("ascii"), slug).toBe("PNG");
      expect(image.readUInt32BE(16), slug).toBe(512);
      expect(image.readUInt32BE(20), slug).toBe(512);
      expect(createHash("sha256").update(image).digest("hex"), slug).toBe(
        approvedHash,
      );
    }
  });

  it("does not regenerate the supplied ArmCon and LiveBeamCalculator artwork", () => {
    const generator = readFileSync(
      join(process.cwd(), "scripts", "generate-construction-urban-icons.mjs"),
      "utf8",
    );

    expect(generator).not.toContain('slug: "armcon"');
    expect(generator).not.toContain('slug: "livebeamcalculator"');
  });

  it("defines every generated calculator once with the enlarged badge typography", () => {
    const generator = readFileSync(
      join(process.cwd(), "scripts", "generate-construction-urban-icons.mjs"),
      "utf8",
    );
    const generatedSlugs = [
      ...generator.matchAll(/slug:\s*"([^"]+)"/g),
    ].map((match) => match[1]);
    const expectedSlugs = calculators
      .map((calculator) => calculator.slug)
      .filter((slug) => slug !== "armcon" && slug !== "livebeamcalculator")
      .sort();

    expect(generatedSlugs).toHaveLength(42);
    expect(new Set(generatedSlugs).size).toBe(42);
    expect(generatedSlugs.sort()).toEqual(expectedSlugs);
    expect(generator).toMatch(/function textBadge\([^)]*fontSize = 87\)/);
    expect(generator).toContain('font-size="87"');
    expect(generator).toContain('font-size="51"');
  });

  it("registers the foundation base pressure calculator as a native foundation calculator", () => {
    const calculator = getCalculatorBySlug("foundation-base-pressure");

    expect(calculator).toMatchObject({
      title: "Напруження під підошвою фундаменту",
      shortDescription:
        "Розрахунок крайових напружень під прямокутною підошвою фундаменту з урахуванням відриву.",
      mainCategory: "fundamenty",
      extraCategories: [],
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
      extraCategories: [],
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
      extraCategories: [],
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
      title: "Розрахунковий опір ґрунту основи | Фундаменти та основи | IVapps.pro",
      description:
        "Розрахунковий опір ґрунту основи у категорії «Фундаменти та основи»: Обчислення розрахункового опору ґрунту основи R за додатком Е ДБН В.2.1-10-2009.",
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
            name: "Фундаменти та основи",
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
    expect(calculator?.mainCategory).toBe("ogorodzhuvalni-konstruktsiyi");
    expect(calculator?.displayMode).toBe("embed");
    expect(calculator?.embedUrl).toBe(
      "https://cadee.pro/?thermalcalc=air-permeability",
    );
    expect(calculator?.openUrl).toBe(
      "https://cadee.pro/?thermalcalc=air-permeability",
    );
  });
});
