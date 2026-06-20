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
      territorialNeedAreaM2: 487.2,
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
      hasRequiredLimitedUseGreenery: true,
    });

    expect(values.physicalCulture).toEqual({
      byResidentsM2: 20,
      byApartmentsM2: 20,
      adoptedM2: 20,
      basis: "equal",
    });
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

  it("excludes pet walking from the inside-boundary subtotal", () => {
    const values = calculateResidentialYardAreas(
      DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT,
    );

    expect(values.territorialNeedAreaM2).toBe(
      values.insideBoundaryAreaM2 + values.petWalking.adoptedM2,
    );
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
    "territorial-need",
    "conclusion",
  ];

  it("keeps the canonical 12-step order and global warnings", () => {
    const report = getResidentialYardAreasReport(
      DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT,
    );

    expect(report.valid).toBe(true);
    expect(report.steps.map((step) => step.key)).toEqual(expectedStepKeys);
    expect(report.warnings).toEqual([
      "Для кожного виду майданчика приймається більша площа з розрахунків за кількістю мешканців і квартир. Це погоджене консервативне правило калькулятора, а не окрема вимога ДБН.",
      "Розрахунок площ не підтверджує можливість фактичного розміщення майданчиків. Проєктом окремо перевіряють нормативні відстані, озеленення, інсоляцію, проїзди, протипожежні вимоги, технічні умови та місцеві містобудівні обмеження.",
    ]);
  });

  it("uses the exact approved default formulas", () => {
    const report = getResidentialYardAreasReport(
      DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT,
    );

    expect(report.steps[1]?.caption).toBe(
      "Визначення площі майданчиків для ігор дітей дошкільного і молодшого шкільного віку (п. 6.1.21, таблиця 6.4 ДБН Б.2.2-12:2019):",
    );
    expect(report.steps[1]?.formulas).toEqual([
      "Sдіт,ос = qдіт,ос × Nосіб = 0,7 × 100 = 70 м²",
      "Sдіт,кв = qдіт,кв × Nкв = 1,75 × 40 = 70 м²",
      "Sдіт = max(Sдіт,ос; Sдіт,кв) = max(70; 70) = 70 м²",
    ]);
    expect(report.steps[4]?.formulas).toEqual([
      "Nгост = ceil(0,15 × (0,5 × N₁ + N₂+)) = ceil(0,15 × (0,5 × 0 + 40)) = 6 машиномісць",
      "Sгост = 25 × Nгост = 25 × 6 = 150 м²",
    ]);
    expect(report.steps[9]?.formula).toBe(
      "Sприбуд = Sдіт + Sвідп + Sфіз + Sгост + Sвел + Sвідх + Sгосп = 70 + 20 + 200 + 150 + 10 + 7,2 + 0 = 457,2 м²",
    );
    expect(report.steps[10]?.formula).toBe(
      "Sтер = Sприбуд + Sтвар = 457,2 + 30 = 487,2 м²",
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
      hasRequiredLimitedUseGreenery: true,
    });

    expect(report.valid).toBe(true);
    expect(report.steps[3]?.formulas).toEqual([
      "Sфіз,ос = qфіз,ос × Nосіб = 0,2 × 100 = 20 м²",
      "Sфіз,кв = qфіз,кв × Nкв = 0,5 × 40 = 20 м²",
      "Sфіз = max(Sфіз,ос; Sфіз,кв) = max(20; 20) = 20 м²",
    ]);
    expect(report.steps[0]?.items).toContain(
      "Окрема озеленена зона з фізкультурними майданчиками: підтверджено",
    );
  });

  it("reports manual area conversions without changing the normalized formula", () => {
    const report = getResidentialYardAreasReport({
      ...DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT,
      wasteCollectionMethod: "vacuum",
      manualVacuumAreaM2: 8,
      manualVacuumAreaUnit: "a",
    });

    expect(report.steps[0]?.items).toContain(
      "Площа майданчика для збирання відходів, прийнята за технічними умовами: Sвідх,руч = 0,08 ар = 8 м²",
    );
    expect(report.steps[6]?.formula).toBe("Sвідх = Sвідх,руч = 8 м²");
    expect(report.steps[6]?.resultItems).toContain(
      "Розрахункова база, що визначила площу: ручне значення за технічними умовами",
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
      "Кількість дво- та більше кімнатних квартир має бути цілим числом, не меншим за 0.",
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
      "Зменшений норматив не можна застосувати без окремої озелененої зони з фізкультурними майданчиками.",
      "Зменшений норматив не можна застосувати без забезпечення не менше 6 м² зелених насаджень обмеженого користування на одну особу.",
    ]);
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
