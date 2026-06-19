export const RESIDENTIAL_YARD_AREAS_SOURCE =
  "ДБН Б.2.2-12:2019; ДБН В.2.3-15:2007";

export type PhysicalCultureAreaMode = "full" | "reduced";
export type WasteCollectionMethod =
  | "above_ground"
  | "underground"
  | "vacuum";
export type ResidentialYardAreaUnit = "m2" | "a" | "ha";
export type ResidentialYardGoverningBasis =
  | "residents"
  | "apartments"
  | "equal"
  | "manual"
  | "disabled";

export type ResidentialYardAreasInput = {
  residents: number;
  oneRoomApartments: number;
  twoOrMoreRoomApartments: number;
  physicalCultureMode: PhysicalCultureAreaMode;
  hasSeparateLandscapedPhysicalCultureZone: boolean;
  hasRequiredLimitedUseGreenery: boolean;
  wasteCollectionMethod: WasteCollectionMethod;
  manualVacuumAreaM2: number | null;
  manualVacuumAreaUnit: ResidentialYardAreaUnit;
  hasHouseholdPurposeAreas: boolean;
  householdAreaPerPersonM2: number;
  householdAreaPerApartmentM2: number;
  householdAreaPerPersonUnit: ResidentialYardAreaUnit;
  householdAreaPerApartmentUnit: ResidentialYardAreaUnit;
};

export type ResidentialYardAreaResult = {
  byResidentsM2: number | null;
  byApartmentsM2: number | null;
  adoptedM2: number;
  basis: ResidentialYardGoverningBasis;
};

export type ResidentialYardAreasValues = {
  apartmentCount: number;
  guestParkingSpaces: number;
  children: ResidentialYardAreaResult;
  adultRecreation: ResidentialYardAreaResult;
  physicalCulture: ResidentialYardAreaResult;
  guestParkingAreaM2: number;
  bicycleParking: ResidentialYardAreaResult;
  wasteCollection: ResidentialYardAreaResult;
  petWalking: ResidentialYardAreaResult;
  householdPurpose: ResidentialYardAreaResult;
  insideBoundaryAreaM2: number;
  territorialNeedAreaM2: number;
};

export const DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT: ResidentialYardAreasInput = {
  residents: 100,
  oneRoomApartments: 0,
  twoOrMoreRoomApartments: 40,
  physicalCultureMode: "full",
  hasSeparateLandscapedPhysicalCultureZone: false,
  hasRequiredLimitedUseGreenery: false,
  wasteCollectionMethod: "above_ground",
  manualVacuumAreaM2: null,
  manualVacuumAreaUnit: "m2",
  hasHouseholdPurposeAreas: false,
  householdAreaPerPersonM2: 0.1,
  householdAreaPerApartmentM2: 0.25,
  householdAreaPerPersonUnit: "m2",
  householdAreaPerApartmentUnit: "m2",
};

const RATES = {
  children: { residents: 0.7, apartments: 1.75 },
  adultRecreation: { residents: 0.2, apartments: 0.5 },
  physicalCulture: {
    full: { residents: 2, apartments: 5 },
    reduced: { residents: 0.2, apartments: 0.5 },
  },
  bicycleParking: { residents: 0.1, apartments: 0.25 },
  wasteCollection: {
    above_ground: { residents: 0.07, apartments: 0.18 },
    underground: { residents: 0.03, apartments: 0.08 },
  },
  petWalking: { residents: 0.3, apartments: 0.3 },
  guestParking: {
    perApartment: 0.15,
    oneRoomCoefficient: 0.5,
    areaPerSpaceM2: 25,
  },
} as const;

function cleanNumber(value: number): number {
  return Number.parseFloat(value.toFixed(12));
}

function multiply(rate: number, count: number): number {
  return cleanNumber(rate * count);
}

function selectDualBasisArea(
  byResidentsM2: number,
  byApartmentsM2: number,
): ResidentialYardAreaResult {
  const basis: ResidentialYardGoverningBasis =
    byResidentsM2 > byApartmentsM2
      ? "residents"
      : byApartmentsM2 > byResidentsM2
        ? "apartments"
        : "equal";

  return {
    byResidentsM2,
    byApartmentsM2,
    adoptedM2: Math.max(byResidentsM2, byApartmentsM2),
    basis,
  };
}

function calculateDualBasisArea(
  residents: number,
  apartments: number,
  rates: { residents: number; apartments: number },
): ResidentialYardAreaResult {
  return selectDualBasisArea(
    multiply(rates.residents, residents),
    multiply(rates.apartments, apartments),
  );
}

function calculateWasteCollectionArea(
  input: ResidentialYardAreasInput,
  apartmentCount: number,
): ResidentialYardAreaResult {
  if (input.wasteCollectionMethod === "vacuum") {
    return {
      byResidentsM2: null,
      byApartmentsM2: null,
      adoptedM2: cleanNumber(input.manualVacuumAreaM2 ?? 0),
      basis: "manual",
    };
  }

  return calculateDualBasisArea(
    input.residents,
    apartmentCount,
    RATES.wasteCollection[input.wasteCollectionMethod],
  );
}

function calculateHouseholdPurposeArea(
  input: ResidentialYardAreasInput,
  apartmentCount: number,
): ResidentialYardAreaResult {
  if (!input.hasHouseholdPurposeAreas) {
    return {
      byResidentsM2: null,
      byApartmentsM2: null,
      adoptedM2: 0,
      basis: "disabled",
    };
  }

  return selectDualBasisArea(
    multiply(input.householdAreaPerPersonM2, input.residents),
    multiply(input.householdAreaPerApartmentM2, apartmentCount),
  );
}

export function calculateResidentialYardAreas(
  input: ResidentialYardAreasInput,
): ResidentialYardAreasValues {
  const apartmentCount =
    input.oneRoomApartments + input.twoOrMoreRoomApartments;
  const children = calculateDualBasisArea(
    input.residents,
    apartmentCount,
    RATES.children,
  );
  const adultRecreation = calculateDualBasisArea(
    input.residents,
    apartmentCount,
    RATES.adultRecreation,
  );
  const physicalCulture = calculateDualBasisArea(
    input.residents,
    apartmentCount,
    RATES.physicalCulture[input.physicalCultureMode],
  );
  const bicycleParking = calculateDualBasisArea(
    input.residents,
    apartmentCount,
    RATES.bicycleParking,
  );
  const wasteCollection = calculateWasteCollectionArea(input, apartmentCount);
  const petWalking = calculateDualBasisArea(
    input.residents,
    apartmentCount,
    RATES.petWalking,
  );
  const householdPurpose = calculateHouseholdPurposeArea(
    input,
    apartmentCount,
  );
  const weightedApartmentCount =
    RATES.guestParking.oneRoomCoefficient * input.oneRoomApartments +
    input.twoOrMoreRoomApartments;
  const guestParkingSpaces = Math.ceil(
    RATES.guestParking.perApartment * weightedApartmentCount,
  );
  const guestParkingAreaM2 =
    guestParkingSpaces * RATES.guestParking.areaPerSpaceM2;
  const insideBoundaryAreaM2 = cleanNumber(
    children.adoptedM2 +
      adultRecreation.adoptedM2 +
      physicalCulture.adoptedM2 +
      guestParkingAreaM2 +
      bicycleParking.adoptedM2 +
      wasteCollection.adoptedM2 +
      householdPurpose.adoptedM2,
  );

  return {
    apartmentCount,
    guestParkingSpaces,
    children,
    adultRecreation,
    physicalCulture,
    guestParkingAreaM2,
    bicycleParking,
    wasteCollection,
    petWalking,
    householdPurpose,
    insideBoundaryAreaM2,
    territorialNeedAreaM2: cleanNumber(
      insideBoundaryAreaM2 + petWalking.adoptedM2,
    ),
  };
}

export function formatResidentialYardAreaNumber(value: number): string {
  return Number.parseFloat(value.toFixed(2)).toString().replace(".", ",");
}
