import { describe, expect, it } from "vitest";

import {
  DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT,
  calculateResidentialYardAreas,
  formatResidentialYardAreaNumber,
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
