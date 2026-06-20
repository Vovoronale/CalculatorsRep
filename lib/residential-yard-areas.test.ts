import { describe, expect, it } from "vitest";

import {
  DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT,
  calculateResidentialYardAreas,
  formatResidentialYardAreaNumber,
  getResidentialYardAreasReport,
} from "./residential-yard-areas";

describe("calculateResidentialYardAreas", () => {
  it("calculates the approved default regression case", () => {
    const values = calculateResidentialYardAreas(
      DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT,
    );

    expect(values).toMatchObject({
      apartmentCount: 40,
      guestParkingSpaces: 6,
      children: {
        byResidentsM2: 70,
        byApartmentsM2: 70,
        adoptedM2: 70,
        basis: "equal",
      },
      adultRecreation: {
        byResidentsM2: 20,
        byApartmentsM2: 20,
        adoptedM2: 20,
        basis: "equal",
      },
      physicalCulture: {
        byResidentsM2: 200,
        byApartmentsM2: 200,
        adoptedM2: 200,
        basis: "equal",
      },
      guestParkingAreaM2: 150,
      bicycleParking: {
        byResidentsM2: 10,
        byApartmentsM2: 10,
        adoptedM2: 10,
        basis: "equal",
      },
      wasteCollection: {
        byResidentsM2: 7,
        byApartmentsM2: 7.2,
        adoptedM2: 7.2,
        basis: "apartments",
      },
      householdPurpose: {
        byResidentsM2: null,
        byApartmentsM2: null,
        adoptedM2: 0,
        basis: "disabled",
      },
      petWalking: {
        byResidentsM2: 30,
        byApartmentsM2: 12,
        adoptedM2: 30,
        basis: "residents",
      },
      insideBoundaryAreaM2: 457.2,
    });
  });

  it.each([
    [100, 40, "equal"],
    [120, 40, "residents"],
    [80, 40, "apartments"],
  ] as const)(
    "selects the governing basis for %s residents and %s apartments",
    (residents, apartments, basis) => {
      const values = calculateResidentialYardAreas({
        ...DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT,
        residents,
        oneRoomApartments: 0,
        twoOrMoreRoomApartments: apartments,
      });

      expect(values.children.basis).toBe(basis);
      expect(values.adultRecreation.basis).toBe(basis);
      expect(values.physicalCulture.basis).toBe(basis);
      expect(values.bicycleParking.basis).toBe(basis);
    },
  );

  it("uses the reduced physical-culture rates", () => {
    const values = calculateResidentialYardAreas({
      ...DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT,
      physicalCultureMode: "reduced",
      hasSeparateLandscapedPhysicalCultureZone: true,
      limitedUseGreeneryAreaM2: 600,
    });

    expect(values.minimumLimitedUseGreeneryAreaM2).toBe(600);
    expect(values.effectivePhysicalCultureMode).toBe("reduced");
    expect(values.physicalCulture).toEqual({
      byResidentsM2: 20,
      byApartmentsM2: 20,
      adoptedM2: 20,
      basis: "equal",
    });
    expect(values.insideBoundaryAreaM2).toBe(277.2);
  });

  it("falls back to the full physical-culture rates below the greenery threshold", () => {
    const values = calculateResidentialYardAreas({
      ...DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT,
      physicalCultureMode: "reduced",
      hasSeparateLandscapedPhysicalCultureZone: true,
      limitedUseGreeneryAreaM2: 599.99,
    });

    expect(values.minimumLimitedUseGreeneryAreaM2).toBe(600);
    expect(values.effectivePhysicalCultureMode).toBe("full");
    expect(values.physicalCulture.adoptedM2).toBe(200);
    expect(values.insideBoundaryAreaM2).toBe(457.2);
  });

  it("calculates underground and manual vacuum waste areas", () => {
    const underground = calculateResidentialYardAreas({
      ...DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT,
      wasteCollectionMethod: "underground",
    });
    const vacuum = calculateResidentialYardAreas({
      ...DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT,
      wasteCollectionMethod: "vacuum",
      manualVacuumAreaM2: 8,
    });

    expect(underground.wasteCollection).toEqual({
      byResidentsM2: 3,
      byApartmentsM2: 3.2,
      adoptedM2: 3.2,
      basis: "apartments",
    });
    expect(vacuum.wasteCollection).toEqual({
      byResidentsM2: null,
      byApartmentsM2: null,
      adoptedM2: 8,
      basis: "manual",
    });
  });

  it("calculates enabled household-purpose areas and disables them explicitly", () => {
    const enabled = calculateResidentialYardAreas({
      ...DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT,
      hasHouseholdPurposeAreas: true,
      householdAreaPerPersonM2: 0.2,
      householdAreaPerApartmentM2: 0.5,
    });
    const disabled = calculateResidentialYardAreas(
      DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT,
    );

    expect(enabled.householdPurpose).toEqual({
      byResidentsM2: 20,
      byApartmentsM2: 20,
      adoptedM2: 20,
      basis: "equal",
    });
    expect(disabled.householdPurpose.basis).toBe("disabled");
    expect(disabled.householdPurpose.adoptedM2).toBe(0);
  });

  it.each([
    [10, 0, 1],
    [0, 7, 2],
    [10, 7, 2],
  ])(
    "applies the one-room coefficient and ceiling for %s one-room and %s other apartments",
    (oneRoomApartments, twoOrMoreRoomApartments, expectedSpaces) => {
      const values = calculateResidentialYardAreas({
        ...DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT,
        oneRoomApartments,
        twoOrMoreRoomApartments,
      });

      expect(values.guestParkingSpaces).toBe(expectedSpaces);
      expect(values.guestParkingAreaM2).toBe(expectedSpaces * 25);
    },
  );

  it("keeps pet walking separate from the inside-boundary subtotal", () => {
    const values = calculateResidentialYardAreas(
      DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT,
    );

    expect(values).not.toHaveProperty("territorialNeedAreaM2");
    expect(values.petWalking.adoptedM2).toBe(30);
  });
});

describe("formatResidentialYardAreaNumber", () => {
  it.each([
    [7, "7"],
    [7.2, "7,2"],
    [7.256, "7,26"],
  ] as const)("formats %s as %s", (value, expected) => {
    expect(formatResidentialYardAreaNumber(value)).toBe(expected);
  });
});

describe("getResidentialYardAreasReport", () => {
  const expectedStepKeys = [
    "inputs",
    "children",
    "adult-recreation",
    "physical-culture",
    "guest-parking",
    "bicycle-parking",
    "waste-collection",
    "pet-walking",
    "household-purpose",
    "inside-boundary-total",
    "summary",
    "conditions",
  ];

  it("keeps the canonical 12-step order without global warnings", () => {
    const report = getResidentialYardAreasReport(
      DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT,
    );

    expect(report.valid).toBe(true);
    expect(report.steps.map((step) => step.key)).toEqual(expectedStepKeys);
    expect(report.warnings).toEqual([]);
    expect(
      report.steps
        .flatMap((step) => step.items ?? [])
        .filter((item) => item.startsWith("Кількість мешканців:")),
    ).toHaveLength(1);
    expect(JSON.stringify(report.steps)).not.toMatch(
      /користувач|калькулятор|алгоритм|ceil\(|Sтер/iu,
    );
  });

  it("uses the exact approved default formulas", () => {
    const report = getResidentialYardAreasReport(
      DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT,
    );

    expect(report.steps[1]?.caption).toBe(
      "Визначення площі майданчиків для ігор дітей дошкільного і молодшого шкільного віку (п. 6.1.21, таблиця 6.4 ДБН Б.2.2-12:2019):",
    );
    expect(report.steps[1]?.formulas).toEqual([
      "S_(діт,осіб) = q_(діт,осіб) × N_(осіб) = 0,7 × 100 = 70 м²",
      "S_(діт,кв) = q_(діт,кв) × N_(кв) = 1,75 × 40 = 70 м²",
      "S_(діт) = max(S_(діт,осіб); S_(діт,кв)) = max(70; 70) = 70 м²",
    ]);
    expect(report.steps[3]?.items).toEqual([
      "Режим розрахунку: повний норматив",
    ]);
    expect(report.steps[3]?.formulas).toEqual([
      "q_(фіз,осіб) = 2,0 м²/особу",
      "q_(фіз,кв) = 5,0 м²/квартиру",
      "S_(фіз,осіб) = q_(фіз,осіб) × N_(осіб) = 2,0 × 100 = 200 м²",
      "S_(фіз,кв) = q_(фіз,кв) × N_(кв) = 5,0 × 40 = 200 м²",
      "S_(фіз) = max(S_(фіз,осіб); S_(фіз,кв)) = max(200; 200) = 200 м²",
    ]);
    expect(report.steps[4]?.formulas).toEqual([
      "N_(гост) = ⌈0,15 × (0,5 × N_(1) + N_(2+))⌉ = ⌈0,15 × (0,5 × 0 + 40)⌉ = 6 машиномісць",
      "S_(гост) = 25 × N_(гост) = 25 × 6 = 150 м²",
    ]);
    expect(report.steps[9]?.formula).toBe(
      "S_(прибуд) = S_(діт) + S_(відп) + S_(фіз) + S_(гост) + S_(вел) + S_(відх) + S_(госп) = 70 + 20 + 200 + 150 + 10 + 7,2 + 0 = 457,2 м²",
    );
  });

  it("lists source data as standalone items only in the input step", () => {
    const report = getResidentialYardAreasReport({
      ...DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT,
      hasHouseholdPurposeAreas: true,
    });

    const repeatedSourceData = report.steps
      .slice(1)
      .flatMap((step) => step.items ?? [])
      .filter((item) =>
        /^(Кількість мешканців:|Кількість квартир:|Кількість однокімнатних квартир:|Кількість дво-|Розрахункова кількість мешканців:|Загальна кількість квартир:)/.test(
          item,
        ),
      );

    expect(repeatedSourceData).toEqual([]);
  });

  it("reports reduced sport and its prerequisites", () => {
    const report = getResidentialYardAreasReport({
      ...DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT,
      physicalCultureMode: "reduced",
      hasSeparateLandscapedPhysicalCultureZone: true,
      limitedUseGreeneryAreaM2: 600,
    });

    expect(report.valid).toBe(true);
    expect(report.steps[3]?.items).toEqual([
      "Режим розрахунку: зменшений норматив",
    ]);
    expect(report.steps[3]?.formulas).toEqual([
      "S_(озел,мін) = 6 × N_(осіб) = 6 × 100 = 600 м²",
      "Фактична площа зелених насаджень обмеженого користування: S_(озел,факт) = 600 м²",
      "S_(озел,факт) ≥ S_(озел,мін): 600 ≥ 600 — умову виконано",
      "q_(фіз,осіб) = 0,2 м²/особу",
      "q_(фіз,кв) = 0,5 м²/квартиру",
      "S_(фіз,осіб) = q_(фіз,осіб) × N_(осіб) = 0,2 × 100 = 20 м²",
      "S_(фіз,кв) = q_(фіз,кв) × N_(кв) = 0,5 × 40 = 20 м²",
      "S_(фіз) = max(S_(фіз,осіб); S_(фіз,кв)) = max(20; 20) = 20 м²",
    ]);
    expect(report.steps[0]?.items).toContain(
      "Окрему озеленену зону з фізкультурними майданчиками передбачено проєктом.",
    );
    expect(report.steps[0]?.items).toContain(
      "Фактична площа зелених насаджень обмеженого користування: S_(озел,факт) = 600 м²",
    );
    expect(report.steps[10]?.table).toEqual({
      columns: ["Вид майданчика", "Розрахункова база", "Площа", "Місце розташування"],
      rows: expect.arrayContaining([
        [
          "Сумарна площа майданчиків у межах прибудинкової території",
          "Сума розрахункових площ",
          "S_(прибуд) = 277,2 м²",
          "У межах прибудинкової території",
        ],
        [
          "Майданчик для вигулу домашніх тварин",
          "Кількість мешканців",
          "S_(твар) = 30 м²",
          "Поза межами прибудинкової території",
        ],
      ]),
    });
  });

  it("reports manual area conversions without changing the normalized formula", () => {
    const report = getResidentialYardAreasReport({
      ...DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT,
      wasteCollectionMethod: "vacuum",
      manualVacuumAreaM2: 8,
      manualVacuumAreaUnit: "a",
    });

    expect(report.steps[0]?.items).toContain(
      "Площа майданчика для збирання відходів: S_(відх,руч) = 0,08 ар = 8 м²",
    );
    expect(report.steps[6]?.formula).toBe("S_(відх) = S_(відх,руч) = 8 м²");
    expect(report.steps[6]?.resultItems).toContain(
      "Площу визначено відповідно до містобудівних і технічних умов.",
    );
  });

  it.each([
    [
      { residents: 0 },
      "Кількість мешканців має бути цілим числом, більшим за 0.",
    ],
    [
      { oneRoomApartments: -1 },
      "Кількість однокімнатних квартир має бути цілим числом, не меншим за 0.",
    ],
    [
      { twoOrMoreRoomApartments: 2.5 },
      "Кількість квартир із двома і більше кімнатами має бути цілим числом, не меншим за 0.",
    ],
    [
      { oneRoomApartments: 0, twoOrMoreRoomApartments: 0 },
      "Загальна кількість квартир має бути більшою за 0.",
    ],
  ])("validates count input %o", (patch, error) => {
    const report = getResidentialYardAreasReport({
      ...DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT,
      ...patch,
    });

    expect(report.valid).toBe(false);
    expect(report.errors).toContain(error);
    expect(report.steps.map((step) => step.key)).toEqual(expectedStepKeys);
    expect(JSON.stringify(report.steps)).not.toMatch(/NaN|Infinity/);
  });

  it("validates both reduced physical-culture prerequisites independently", () => {
    const report = getResidentialYardAreasReport({
      ...DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT,
      physicalCultureMode: "reduced",
    });

    expect(report.errors).toEqual([
      "Зменшений норматив не можна застосувати: окрему озеленену зону з фізкультурними майданчиками не передбачено проєктом.",
      "Введіть фактичну площу зелених насаджень обмеженого користування, не меншу за 0 м².",
    ]);
    expect(report.values?.effectivePhysicalCultureMode).toBe("full");
    expect(report.steps[0]?.items).toContain(
      "Фактична площа зелених насаджень обмеженого користування: не введено",
    );
    expect(report.steps[3]?.items).toContain(
      "Умови застосування зменшеного нормативу не виконано; розрахунок виконано за повним нормативом.",
    );
  });

  it("reports an insufficient greenery area and uses the full norm", () => {
    const report = getResidentialYardAreasReport({
      ...DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT,
      physicalCultureMode: "reduced",
      hasSeparateLandscapedPhysicalCultureZone: true,
      limitedUseGreeneryAreaM2: 599,
    });

    expect(report.errors).toContain(
      "Зменшений норматив не можна застосувати: фактична площа зелених насаджень обмеженого користування має бути не меншою за 600 м².",
    );
    expect(report.values?.effectivePhysicalCultureMode).toBe("full");
    expect(report.values?.insideBoundaryAreaM2).toBe(457.2);
    expect(report.steps[3]?.formulas).toContain(
      "S_(озел,факт) ≥ S_(озел,мін): 599 ≥ 600 — умову не виконано",
    );
  });

  it("collects every limitation in the final step", () => {
    const report = getResidentialYardAreasReport(DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT);

    expect(report.steps[11]?.caption).toBe("Умови застосування результатів:");
    expect(report.steps[11]?.items).toContain(
      "Перевірка фактичного розміщення, під’їздів і нормативних відстаней не входить до цього розрахунку.",
    );
    expect(report.steps.slice(0, 11).flatMap((step) => step.notes ?? [])).toEqual([]);
  });

  it("validates vacuum and household-purpose conditional values only when active", () => {
    const vacuum = getResidentialYardAreasReport({
      ...DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT,
      wasteCollectionMethod: "vacuum",
      manualVacuumAreaM2: null,
    });
    const household = getResidentialYardAreasReport({
      ...DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT,
      hasHouseholdPurposeAreas: true,
      householdAreaPerPersonM2: 0.09,
      householdAreaPerApartmentM2: 0.76,
    });
    const inactive = getResidentialYardAreasReport({
      ...DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT,
      manualVacuumAreaM2: -1,
      householdAreaPerPersonM2: -1,
      householdAreaPerApartmentM2: -1,
    });

    expect(vacuum.errors).toContain(
      "Для вакуумного способу введіть площу майданчика за технічними умовами, більшу за 0 м².",
    );
    expect(household.errors).toEqual([
      "Питомий розмір господарського майданчика на одну особу має бути від 0,1 до 0,3 м²/особу.",
      "Питомий розмір господарського майданчика на одну квартиру має бути від 0,25 до 0,75 м²/квартиру.",
    ]);
    expect(inactive.valid).toBe(true);
  });
});
