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
  limitedUseGreeneryAreaM2: number | null;
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
  minimumLimitedUseGreeneryAreaM2: number;
  effectivePhysicalCultureMode: PhysicalCultureAreaMode;
  insideBoundaryAreaM2: number;
};

export const DEFAULT_RESIDENTIAL_YARD_AREAS_INPUT: ResidentialYardAreasInput = {
  residents: 100,
  oneRoomApartments: 0,
  twoOrMoreRoomApartments: 40,
  physicalCultureMode: "full",
  hasSeparateLandscapedPhysicalCultureZone: false,
  limitedUseGreeneryAreaM2: null,
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
  const minimumLimitedUseGreeneryAreaM2 = multiply(6, input.residents);
  const canUseReducedMode =
    input.physicalCultureMode === "reduced" &&
    input.hasSeparateLandscapedPhysicalCultureZone &&
    input.limitedUseGreeneryAreaM2 !== null &&
    Number.isFinite(input.limitedUseGreeneryAreaM2) &&
    input.limitedUseGreeneryAreaM2 >= minimumLimitedUseGreeneryAreaM2;
  const effectivePhysicalCultureMode: PhysicalCultureAreaMode = canUseReducedMode
    ? "reduced"
    : "full";
  const physicalCulture = calculateDualBasisArea(
    input.residents,
    apartmentCount,
    RATES.physicalCulture[effectivePhysicalCultureMode],
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
    minimumLimitedUseGreeneryAreaM2,
    effectivePhysicalCultureMode,
    insideBoundaryAreaM2,
  };
}

export function formatResidentialYardAreaNumber(value: number): string {
  return Number.parseFloat(value.toFixed(2)).toString().replace(".", ",");
}

export type ResidentialYardAreasReportStep = {
  key:
    | "inputs"
    | "children"
    | "adult-recreation"
    | "physical-culture"
    | "guest-parking"
    | "bicycle-parking"
    | "waste-collection"
    | "pet-walking"
    | "household-purpose"
    | "inside-boundary-total"
    | "summary"
    | "conditions";
  caption: string;
  items?: string[];
  notes?: string[];
  formula?: string;
  formulas?: string[];
  resultItems?: string[];
  table?: { columns: string[]; rows: string[][] };
};

export type ResidentialYardAreasReport = {
  input: ResidentialYardAreasInput;
  valid: boolean;
  errors: string[];
  warnings: string[];
  values: ResidentialYardAreasValues | null;
  steps: ResidentialYardAreasReportStep[];
};

const GLOBAL_WARNINGS: string[] = [];
const DUAL_BASIS_RULE =
  "За розрахункову приймається більша з площ, визначених за кількістю мешканців і кількістю квартир згідно з п. 6.1.21 та таблицею 6.4 ДБН Б.2.2-12:2019.";

const AREA_UNIT_DATA: Record<
  ResidentialYardAreaUnit,
  { label: string; factorToM2: number }
> = {
  m2: { label: "м²", factorToM2: 1 },
  a: { label: "ар", factorToM2: 100 },
  ha: { label: "га", factorToM2: 10000 },
};

function safeFinite(value: number | null, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function getSafeCalculationInput(
  input: ResidentialYardAreasInput,
): ResidentialYardAreasInput {
  return {
    ...input,
    residents: safeFinite(input.residents),
    oneRoomApartments: safeFinite(input.oneRoomApartments),
    twoOrMoreRoomApartments: safeFinite(input.twoOrMoreRoomApartments),
    limitedUseGreeneryAreaM2:
      input.limitedUseGreeneryAreaM2 === null
        ? null
        : safeFinite(input.limitedUseGreeneryAreaM2),
    manualVacuumAreaM2:
      input.manualVacuumAreaM2 === null
        ? null
        : safeFinite(input.manualVacuumAreaM2),
    householdAreaPerPersonM2: safeFinite(input.householdAreaPerPersonM2),
    householdAreaPerApartmentM2: safeFinite(
      input.householdAreaPerApartmentM2,
    ),
  };
}

function validateResidentialYardAreasInput(
  input: ResidentialYardAreasInput,
): string[] {
  const errors: string[] = [];

  if (!Number.isInteger(input.residents) || input.residents <= 0) {
    errors.push(
      "Кількість мешканців має бути цілим числом, більшим за 0.",
    );
  }
  if (
    !Number.isInteger(input.oneRoomApartments) ||
    input.oneRoomApartments < 0
  ) {
    errors.push(
      "Кількість однокімнатних квартир має бути цілим числом, не меншим за 0.",
    );
  }
  if (
    !Number.isInteger(input.twoOrMoreRoomApartments) ||
    input.twoOrMoreRoomApartments < 0
  ) {
    errors.push(
      "Кількість квартир із двома і більше кімнатами має бути цілим числом, не меншим за 0.",
    );
  }
  if (
    Number.isFinite(input.oneRoomApartments) &&
    Number.isFinite(input.twoOrMoreRoomApartments) &&
    input.oneRoomApartments + input.twoOrMoreRoomApartments <= 0
  ) {
    errors.push("Загальна кількість квартир має бути більшою за 0.");
  }
  if (input.physicalCultureMode === "reduced") {
    if (!input.hasSeparateLandscapedPhysicalCultureZone) {
      errors.push(
        "Зменшений норматив не можна застосувати: окрему озеленену зону з фізкультурними майданчиками не передбачено проєктом.",
      );
    }
    const greeneryAreaIsValid =
      input.limitedUseGreeneryAreaM2 !== null &&
      Number.isFinite(input.limitedUseGreeneryAreaM2) &&
      input.limitedUseGreeneryAreaM2 >= 0;
    if (!greeneryAreaIsValid) {
      errors.push(
        "Введіть фактичну площу зелених насаджень обмеженого користування, не меншу за 0 м².",
      );
    } else {
      const minimumArea = multiply(6, safeFinite(input.residents));
      if ((input.limitedUseGreeneryAreaM2 as number) < minimumArea) {
        errors.push(
          `Зменшений норматив не можна застосувати: фактична площа зелених насаджень обмеженого користування має бути не меншою за ${formatResidentialYardAreaNumber(minimumArea)} м².`,
        );
      }
    }
  }
  if (
    input.wasteCollectionMethod === "vacuum" &&
    (input.manualVacuumAreaM2 === null ||
      !Number.isFinite(input.manualVacuumAreaM2) ||
      input.manualVacuumAreaM2 <= 0)
  ) {
    errors.push(
      "Для вакуумного способу введіть площу майданчика за технічними умовами, більшу за 0 м².",
    );
  }
  if (input.hasHouseholdPurposeAreas) {
    if (
      !Number.isFinite(input.householdAreaPerPersonM2) ||
      input.householdAreaPerPersonM2 < 0.1 ||
      input.householdAreaPerPersonM2 > 0.3
    ) {
      errors.push(
        "Питомий розмір господарського майданчика на одну особу має бути від 0,1 до 0,3 м²/особу.",
      );
    }
    if (
      !Number.isFinite(input.householdAreaPerApartmentM2) ||
      input.householdAreaPerApartmentM2 < 0.25 ||
      input.householdAreaPerApartmentM2 > 0.75
    ) {
      errors.push(
        "Питомий розмір господарського майданчика на одну квартиру має бути від 0,25 до 0,75 м²/квартиру.",
      );
    }
  }

  return errors;
}

function formatCount(value: number): string {
  return Number.isFinite(value) ? formatResidentialYardAreaNumber(value) : "0";
}

function formatBasis(basis: ResidentialYardGoverningBasis): string {
  switch (basis) {
    case "residents":
      return "Кількість мешканців";
    case "apartments":
      return "Кількість квартир";
    case "equal":
      return "Кількість мешканців і кількість квартир";
    case "manual":
      return "Містобудівні і технічні умови";
    case "disabled":
      return "Проєктом не передбачено";
  }
}

function formatManualArea(
  symbol: string,
  normalizedM2: number,
  unit: ResidentialYardAreaUnit,
  suffix = "",
): string {
  const unitData = AREA_UNIT_DATA[unit];
  const normalized = formatResidentialYardAreaNumber(normalizedM2);
  const baseLabel = `м²${suffix}`;
  if (unit === "m2") {
    return `${symbol} = ${normalized} ${baseLabel}`;
  }
  const displayValue = formatResidentialYardAreaNumber(
    normalizedM2 / unitData.factorToM2,
  );
  return `${symbol} = ${displayValue} ${unitData.label}${suffix} = ${normalized} ${baseLabel}`;
}

function formatApartmentCountFormula(
  input: ResidentialYardAreasInput,
  apartmentCount: number,
): string {
  return `N_(кв) = N_(1) + N_(2+) = ${formatCount(input.oneRoomApartments)} + ${formatCount(
    input.twoOrMoreRoomApartments,
  )} = ${formatCount(apartmentCount)} квартир`;
}

function buildDualFormulas(
  symbol: string,
  personRateSymbol: string,
  apartmentRateSymbol: string,
  personRate: number,
  apartmentRate: number,
  input: ResidentialYardAreasInput,
  values: ResidentialYardAreaResult,
  rateLabels?: { person: string; apartment: string },
): string[] {
  const apartmentCount =
    input.oneRoomApartments + input.twoOrMoreRoomApartments;
  const personRateLabel =
    rateLabels?.person ?? formatResidentialYardAreaNumber(personRate);
  const apartmentRateLabel =
    rateLabels?.apartment ?? formatResidentialYardAreaNumber(apartmentRate);
  return [
    `${symbol.replace(/\)$/u, ",осіб)")} = ${personRateSymbol.replace(/\)$/u, ",осіб)")} × N_(осіб) = ${personRateLabel} × ${formatCount(input.residents)} = ${formatResidentialYardAreaNumber(
      values.byResidentsM2 ?? 0,
    )} м²`,
    `${symbol.replace(/\)$/u, ",кв)")} = ${apartmentRateSymbol.replace(/\)$/u, ",кв)")} × N_(кв) = ${apartmentRateLabel} × ${formatCount(apartmentCount)} = ${formatResidentialYardAreaNumber(
      values.byApartmentsM2 ?? 0,
    )} м²`,
    `${symbol} = max(${symbol.replace(/\)$/u, ",осіб)")}; ${symbol.replace(/\)$/u, ",кв)")}) = max(${formatResidentialYardAreaNumber(
      values.byResidentsM2 ?? 0,
    )}; ${formatResidentialYardAreaNumber(
      values.byApartmentsM2 ?? 0,
    )}) = ${formatResidentialYardAreaNumber(values.adoptedM2)} м²`,
  ];
}

function buildInputStep(
  input: ResidentialYardAreasInput,
  values: ResidentialYardAreasValues,
): ResidentialYardAreasReportStep {
  const items = [
    `Кількість мешканців: N_(осіб) = ${formatCount(input.residents)} осіб`,
    `Кількість однокімнатних квартир: N_(1) = ${formatCount(
      input.oneRoomApartments,
    )} квартир`,
    `Кількість квартир із двома і більше кімнатами: N_(2+) = ${formatCount(
      input.twoOrMoreRoomApartments,
    )} квартир`,
    `Режим розрахунку фізкультурних майданчиків: ${
      input.physicalCultureMode === "full"
        ? "повний норматив"
        : "зменшений норматив"
    }`,
    `Спосіб збирання побутових відходів: ${
      input.wasteCollectionMethod === "above_ground"
        ? "наземний"
        : input.wasteCollectionMethod === "underground"
          ? "підземний"
          : "вакуумний"
    }`,
    input.hasHouseholdPurposeAreas
      ? "Господарські майданчики передбачено проєктом."
      : "Господарські майданчики проєктом не передбачено.",
  ];

  if (input.physicalCultureMode === "reduced") {
    items.push(
      input.hasSeparateLandscapedPhysicalCultureZone
        ? "Окрему озеленену зону з фізкультурними майданчиками передбачено проєктом."
        : "Окрему озеленену зону з фізкультурними майданчиками не передбачено проєктом.",
      input.limitedUseGreeneryAreaM2 === null
        ? "Фактична площа зелених насаджень обмеженого користування: не введено"
        : `Фактична площа зелених насаджень обмеженого користування: S_(озел,факт) = ${formatResidentialYardAreaNumber(
            input.limitedUseGreeneryAreaM2,
          )} м²`,
    );
  }
  if (input.wasteCollectionMethod === "vacuum") {
    items.push(
      `Площа майданчика для збирання відходів: ${formatManualArea(
        "S_(відх,руч)",
        safeFinite(input.manualVacuumAreaM2),
        input.manualVacuumAreaUnit,
      )}`,
    );
  }
  if (input.hasHouseholdPurposeAreas) {
    items.push(
      `Питомий розмір господарських майданчиків на одну особу: ${formatManualArea(
        "q_(госп,осіб)",
        input.householdAreaPerPersonM2,
        input.householdAreaPerPersonUnit,
        "/особу",
      )}`,
      `Питомий розмір господарських майданчиків на одну квартиру: ${formatManualArea(
        "q_(госп,кв)",
        input.householdAreaPerApartmentM2,
        input.householdAreaPerApartmentUnit,
        "/квартиру",
      )}`,
    );
  }

  return {
    key: "inputs",
    caption:
      "Вихідні дані для розрахунку площ майданчиків у складі прибудинкової території (п. 6.1.21, таблиця 6.4 ДБН Б.2.2-12:2019):",
    items,
    formula: formatApartmentCountFormula(input, values.apartmentCount),
  };
}

function buildChildrenStep(
  input: ResidentialYardAreasInput,
  values: ResidentialYardAreasValues,
): ResidentialYardAreasReportStep {
  return {
    key: "children",
    caption:
      "Визначення площі майданчиків для ігор дітей дошкільного і молодшого шкільного віку (п. 6.1.21, таблиця 6.4 ДБН Б.2.2-12:2019):",
    items: [
      "Питомий розмір на одну особу: q_(діт,осіб) = 0,7 м²/особу",
      "Питомий розмір на одну квартиру: q_(діт,кв) = 1,75 м²/квартиру",
    ],
    formulas: buildDualFormulas(
      "S_(діт)",
      "q_(діт)",
      "q_(діт)",
      0.7,
      1.75,
      input,
      values.children,
    ),
    resultItems: [
      `Розрахункова площа дитячих майданчиків: S_(діт) = ${formatResidentialYardAreaNumber(
        values.children.adoptedM2,
      )} м²`,
      `Розрахункова база: ${formatBasis(
        values.children.basis,
      )}`,
      DUAL_BASIS_RULE,
    ],
  };
}

function buildAdultRecreationStep(
  input: ResidentialYardAreasInput,
  values: ResidentialYardAreasValues,
): ResidentialYardAreasReportStep {
  return {
    key: "adult-recreation",
    caption:
      "Визначення площі майданчиків для відпочинку дорослого населення (п. 6.1.21, таблиця 6.4 ДБН Б.2.2-12:2019):",
    items: [
      "Питомий розмір на одну особу: q_(відп,осіб) = 0,2 м²/особу",
      "Питомий розмір на одну квартиру: q_(відп,кв) = 0,5 м²/квартиру",
    ],
    formulas: buildDualFormulas(
      "S_(відп)",
      "q_(відп)",
      "q_(відп)",
      0.2,
      0.5,
      input,
      values.adultRecreation,
    ),
    resultItems: [
      `Розрахункова площа майданчиків для відпочинку дорослого населення: S_(відп) = ${formatResidentialYardAreaNumber(
        values.adultRecreation.adoptedM2,
      )} м²`,
      `Розрахункова база: ${formatBasis(
        values.adultRecreation.basis,
      )}`,
      DUAL_BASIS_RULE,
    ],
  };
}

function buildPhysicalCultureStep(
  input: ResidentialYardAreasInput,
  values: ResidentialYardAreasValues,
): ResidentialYardAreasReportStep {
  const reduced = values.effectivePhysicalCultureMode === "reduced";
  const personRate = reduced ? 0.2 : 2;
  const apartmentRate = reduced ? 0.5 : 5;
  const rateLabels = {
    person: reduced ? "0,2" : "2,0",
    apartment: reduced ? "0,5" : "5,0",
  };
  const items = [
    `Режим розрахунку: ${reduced ? "зменшений норматив" : "повний норматив"}`,
  ];
  if (input.physicalCultureMode === "reduced" && !reduced) {
    items.push(
      "Умови застосування зменшеного нормативу не виконано; розрахунок виконано за повним нормативом.",
    );
  }
  const formulas: string[] = [];
  if (input.physicalCultureMode === "reduced") {
    formulas.push(
      `S_(озел,мін) = 6 × N_(осіб) = 6 × ${formatCount(
        input.residents,
      )} = ${formatResidentialYardAreaNumber(
        values.minimumLimitedUseGreeneryAreaM2,
      )} м²`,
    );
    if (
      input.limitedUseGreeneryAreaM2 !== null &&
      Number.isFinite(input.limitedUseGreeneryAreaM2) &&
      input.limitedUseGreeneryAreaM2 >= 0
    ) {
      const actual = formatResidentialYardAreaNumber(input.limitedUseGreeneryAreaM2);
      const minimum = formatResidentialYardAreaNumber(
        values.minimumLimitedUseGreeneryAreaM2,
      );
      formulas.push(
        `Фактична площа зелених насаджень обмеженого користування: S_(озел,факт) = ${actual} м²`,
        `S_(озел,факт) ≥ S_(озел,мін): ${actual} ≥ ${minimum} — ${
          input.limitedUseGreeneryAreaM2 >=
          values.minimumLimitedUseGreeneryAreaM2
            ? "умову виконано"
            : "умову не виконано"
        }`,
      );
    }
  }
  formulas.push(
    `q_(фіз,осіб) = ${rateLabels.person} м²/особу`,
    `q_(фіз,кв) = ${rateLabels.apartment} м²/квартиру`,
    ...buildDualFormulas(
      "S_(фіз)",
      "q_(фіз)",
      "q_(фіз)",
      personRate,
      apartmentRate,
      input,
      values.physicalCulture,
      rateLabels,
    ),
  );

  return {
    key: "physical-culture",
    caption:
      "Визначення площі майданчиків для занять фізкультурою (п. 6.1.21, таблиця 6.4 та примітка * ДБН Б.2.2-12:2019):",
    items,
    formulas,
    resultItems: [
      `Розрахункова площа фізкультурних майданчиків: S_(фіз) = ${formatResidentialYardAreaNumber(
        values.physicalCulture.adoptedM2,
      )} м²`,
      `Розрахункова база: ${formatBasis(
        values.physicalCulture.basis,
      )}`,
      DUAL_BASIS_RULE,
    ],
  };
}

function buildGuestParkingStep(
  input: ResidentialYardAreasInput,
  values: ResidentialYardAreasValues,
): ResidentialYardAreasReportStep {
  const oneRoom = formatCount(input.oneRoomApartments);
  const multiRoom = formatCount(input.twoOrMoreRoomApartments);
  return {
    key: "guest-parking",
    caption:
      "Визначення кількості та площі місць тимчасового зберігання автомобілів — гостьової стоянки (п. 6.1.21, таблиця 6.4, п. 10.8.1 і таблиця 10.5 ДБН Б.2.2-12:2019; п. 4.6 і таблиця 1 ДБН В.2.3-15:2007):",
    items: [
      "Норматив для гостьових стоянок: 0,15 машиномісця на дво- або більше кімнатну квартиру",
      "Коефіцієнт для однокімнатних квартир: 0,5",
      "Площа земельної ділянки відкритої стоянки на один автомобіль: 25 м²/автомобіль",
    ],
    formulas: [
      `N_(гост) = ⌈0,15 × (0,5 × N_(1) + N_(2+))⌉ = ⌈0,15 × (0,5 × ${oneRoom} + ${multiRoom})⌉ = ${formatCount(
        values.guestParkingSpaces,
      )} машиномісць`,
      `S_(гост) = 25 × N_(гост) = 25 × ${formatCount(
        values.guestParkingSpaces,
      )} = ${formatResidentialYardAreaNumber(
        values.guestParkingAreaM2,
      )} м²`,
    ],
    resultItems: [
      `Кількість гостьових машиномісць: N_(гост) = ${formatCount(
        values.guestParkingSpaces,
      )} машиномісць`,
      `Розрахункова площа відкритої гостьової стоянки: S_(гост) = ${formatResidentialYardAreaNumber(
        values.guestParkingAreaM2,
      )} м²`,
      "Кількість машиномісць визначено округленням до більшого цілого.",
    ],
  };
}

function buildBicycleParkingStep(
  input: ResidentialYardAreasInput,
  values: ResidentialYardAreasValues,
): ResidentialYardAreasReportStep {
  return {
    key: "bicycle-parking",
    caption:
      "Визначення площі майданчиків для тимчасової стоянки велосипедів (п. 6.1.21, таблиця 6.4 ДБН Б.2.2-12:2019):",
    items: [
      "Питомий розмір на одну особу: q_(вел,осіб) = 0,1 м²/особу",
      "Питомий розмір на одну квартиру: q_(вел,кв) = 0,25 м²/квартиру",
    ],
    formulas: buildDualFormulas(
      "S_(вел)",
      "q_(вел)",
      "q_(вел)",
      0.1,
      0.25,
      input,
      values.bicycleParking,
    ),
    resultItems: [
      `Розрахункова площа майданчиків для тимчасової стоянки велосипедів: S_(вел) = ${formatResidentialYardAreaNumber(
        values.bicycleParking.adoptedM2,
      )} м²`,
      `Розрахункова база: ${formatBasis(
        values.bicycleParking.basis,
      )}`,
      DUAL_BASIS_RULE,
    ],
  };
}

function buildWasteCollectionStep(
  input: ResidentialYardAreasInput,
  values: ResidentialYardAreasValues,
): ResidentialYardAreasReportStep {
  const items: string[] = [];
  let formulas: string[] | undefined;
  let formula: string | undefined;
  if (input.wasteCollectionMethod === "vacuum") {
    formula = `S_(відх) = S_(відх,руч) = ${formatResidentialYardAreaNumber(
      values.wasteCollection.adoptedM2,
    )} м²`;
  } else {
    const rates = RATES.wasteCollection[input.wasteCollectionMethod];
    items.push(
      `Питомий розмір на одну особу: q_(відх,осіб) = ${formatResidentialYardAreaNumber(
        rates.residents,
      )} м²/особу`,
      `Питомий розмір на одну квартиру: q_(відх,кв) = ${formatResidentialYardAreaNumber(
        rates.apartments,
      )} м²/квартиру`,
    );
    formulas = buildDualFormulas(
      "S_(відх)",
      "q_(відх)",
      "q_(відх)",
      rates.residents,
      rates.apartments,
      input,
      values.wasteCollection,
    );
  }

  return {
    key: "waste-collection",
    caption:
      "Визначення площі майданчиків для збирання побутових відходів (п. 6.1.21, таблиця 6.4 та примітка **, п. 6.1.22 і таблиця 6.5 ДБН Б.2.2-12:2019):",
    items,
    formula,
    formulas,
    resultItems: [
      `Розрахункова площа майданчика для збирання побутових відходів: S_(відх) = ${formatResidentialYardAreaNumber(
        values.wasteCollection.adoptedM2,
      )} м²`,
      ...(input.wasteCollectionMethod === "vacuum"
        ? ["Площу визначено відповідно до містобудівних і технічних умов."]
        : [
            `Розрахункова база: ${formatBasis(values.wasteCollection.basis)}`,
            DUAL_BASIS_RULE,
          ]),
    ],
  };
}

function buildPetWalkingStep(
  input: ResidentialYardAreasInput,
  values: ResidentialYardAreasValues,
): ResidentialYardAreasReportStep {
  return {
    key: "pet-walking",
    caption:
      "Визначення площі майданчиків для вигулу домашніх тварин (п. 6.1.21, таблиця 6.4 та примітка *** ДБН Б.2.2-12:2019):",
    items: [
      "Питомий розмір на одну особу: q_(твар,осіб) = 0,3 м²/особу",
      "Питомий розмір на одну квартиру: q_(твар,кв) = 0,3 м²/квартиру",
    ],
    formulas: buildDualFormulas(
      "S_(твар)",
      "q_(твар)",
      "q_(твар)",
      0.3,
      0.3,
      input,
      values.petWalking,
    ),
    resultItems: [
      `Розрахункова площа майданчиків для вигулу домашніх тварин: S_(твар) = ${formatResidentialYardAreaNumber(
        values.petWalking.adoptedM2,
      )} м²`,
      `Розрахункова база: ${formatBasis(
        values.petWalking.basis,
      )}`,
      DUAL_BASIS_RULE,
      "Розміщення: поза межами прибудинкової території",
    ],
  };
}

function buildHouseholdPurposeStep(
  input: ResidentialYardAreasInput,
  values: ResidentialYardAreasValues,
): ResidentialYardAreasReportStep {
  const enabled = input.hasHouseholdPurposeAreas;
  const items: string[] = [];
  let formulas: string[] | undefined;
  let formula: string | undefined;
  if (enabled) {
    items.push(
      `Питомий розмір на одну особу: ${formatManualArea(
        "q_(госп,осіб)",
        input.householdAreaPerPersonM2,
        input.householdAreaPerPersonUnit,
        "/особу",
      )}`,
      "Нормативний діапазон на одну особу: 0,1–0,3 м²/особу",
      `Питомий розмір на одну квартиру: ${formatManualArea(
        "q_(госп,кв)",
        input.householdAreaPerApartmentM2,
        input.householdAreaPerApartmentUnit,
        "/квартиру",
      )}`,
      "Нормативний діапазон на одну квартиру: 0,25–0,75 м²/квартиру",
    );
    formulas = buildDualFormulas(
      "S_(госп)",
      "q_(госп)",
      "q_(госп)",
      input.householdAreaPerPersonM2,
      input.householdAreaPerApartmentM2,
      input,
      values.householdPurpose,
    );
  } else {
    formula = "S_(госп) = 0 м²";
    items.push("Господарські майданчики проєктом не передбачено.");
  }

  return {
    key: "household-purpose",
    caption:
      "Визначення площі майданчиків для господарських цілей (п. 6.1.21, примітка 2 до таблиці 6.4 ДБН Б.2.2-12:2019):",
    items,
    formula,
    formulas,
    resultItems: [
      `Розрахункова площа господарських майданчиків: S_(госп) = ${formatResidentialYardAreaNumber(
        values.householdPurpose.adoptedM2,
      )} м²`,
      `Розрахункова база: ${formatBasis(
        values.householdPurpose.basis,
      )}`,
      ...(enabled ? [DUAL_BASIS_RULE] : []),
    ],
  };
}

function buildInsideBoundaryStep(
  values: ResidentialYardAreasValues,
): ResidentialYardAreasReportStep {
  const areas = [
    values.children.adoptedM2,
    values.adultRecreation.adoptedM2,
    values.physicalCulture.adoptedM2,
    values.guestParkingAreaM2,
    values.bicycleParking.adoptedM2,
    values.wasteCollection.adoptedM2,
    values.householdPurpose.adoptedM2,
  ];
  return {
    key: "inside-boundary-total",
    caption:
      "Визначення сумарної площі майданчиків у межах прибудинкової території:",
    items: [
      `Дитячі майданчики: S_(діт) = ${formatResidentialYardAreaNumber(areas[0])} м²`,
      `Майданчики для відпочинку дорослих: S_(відп) = ${formatResidentialYardAreaNumber(
        areas[1],
      )} м²`,
      `Фізкультурні майданчики: S_(фіз) = ${formatResidentialYardAreaNumber(
        areas[2],
      )} м²`,
      `Відкрита гостьова стоянка: S_(гост) = ${formatResidentialYardAreaNumber(
        areas[3],
      )} м²`,
      `Майданчики для тимчасової стоянки велосипедів: S_(вел) = ${formatResidentialYardAreaNumber(
        areas[4],
      )} м²`,
      `Майданчики для збирання побутових відходів: S_(відх) = ${formatResidentialYardAreaNumber(
        areas[5],
      )} м²`,
      `Господарські майданчики: S_(госп) = ${formatResidentialYardAreaNumber(
        areas[6],
      )} м²`,
    ],
    formula: `S_(прибуд) = S_(діт) + S_(відп) + S_(фіз) + S_(гост) + S_(вел) + S_(відх) + S_(госп) = ${areas
      .map(formatResidentialYardAreaNumber)
      .join(" + ")} = ${formatResidentialYardAreaNumber(
      values.insideBoundaryAreaM2,
    )} м²`,
    resultItems: [
      `Сумарна площа майданчиків у межах прибудинкової території: S_(прибуд) = ${formatResidentialYardAreaNumber(
        values.insideBoundaryAreaM2,
      )} м²`,
    ],
  };
}

function buildSummaryStep(
  values: ResidentialYardAreasValues,
): ResidentialYardAreasReportStep {
  const inside = "У межах прибудинкової території";
  const area = (symbol: string, value: number) =>
    `${symbol} = ${formatResidentialYardAreaNumber(value)} м²`;
  return {
    key: "summary",
    caption: "Підсумкові результати розрахунку площ майданчиків:",
    table: {
      columns: [
        "Вид майданчика",
        "Розрахункова база",
        "Площа",
        "Місце розташування",
      ],
      rows: [
        ["Дитячі майданчики", formatBasis(values.children.basis), area("S_(діт)", values.children.adoptedM2), inside],
        ["Майданчики для відпочинку дорослих", formatBasis(values.adultRecreation.basis), area("S_(відп)", values.adultRecreation.adoptedM2), inside],
        ["Фізкультурні майданчики", formatBasis(values.physicalCulture.basis), area("S_(фіз)", values.physicalCulture.adoptedM2), inside],
        ["Відкрита гостьова стоянка", `Квартирографія: N_(гост) = ${formatCount(values.guestParkingSpaces)} машиномісць`, area("S_(гост)", values.guestParkingAreaM2), inside],
        ["Тимчасова стоянка велосипедів", formatBasis(values.bicycleParking.basis), area("S_(вел)", values.bicycleParking.adoptedM2), inside],
        ["Майданчики для збирання побутових відходів", formatBasis(values.wasteCollection.basis), area("S_(відх)", values.wasteCollection.adoptedM2), inside],
        ["Господарські майданчики", formatBasis(values.householdPurpose.basis), area("S_(госп)", values.householdPurpose.adoptedM2), inside],
        ["Сумарна площа майданчиків у межах прибудинкової території", "Сума розрахункових площ", area("S_(прибуд)", values.insideBoundaryAreaM2), inside],
        ["Майданчик для вигулу домашніх тварин", formatBasis(values.petWalking.basis), area("S_(твар)", values.petWalking.adoptedM2), "Поза межами прибудинкової території"],
      ],
    },
  };
}

function buildConditionsStep(): ResidentialYardAreasReportStep {
  return {
    key: "conditions",
    caption: "Умови застосування результатів:",
    items: [
      "Сумарна площа S_(прибуд) не є мінімальною площею земельної ділянки житлового будинку за таблицею 6.3 ДБН Б.2.2-12:2019 і не включає площу забудови, проїздів, тротуарів, озеленення та інших елементів території.",
      "Майданчики для вигулу домашніх тварин розміщують поза межами прибудинкової території на відстані не менше 40 м від вікон житлових будинків, майданчиків для ігор і відпочинку та фізкультурних майданчиків.",
      "Для наземного способу збирання побутових відходів відстань до вікон житлових і громадських будівель та до дитячих, фізкультурних і рекреаційних майданчиків має бути не менше 20 м, а пішохідна доступність — не більше 100 м. Для підземного і вакуумного способів відстані визначаються технічними умовами.",
      "Відстань від господарських майданчиків до найбільш віддаленого входу в житловий будинок має бути не більше 100 м.",
      "Перевірка фактичного розміщення, під’їздів і нормативних відстаней не входить до цього розрахунку.",
    ],
  };
}

export function getResidentialYardAreasReport(
  input: ResidentialYardAreasInput,
): ResidentialYardAreasReport {
  const errors = validateResidentialYardAreasInput(input);
  const safeInput = getSafeCalculationInput(input);
  const values = calculateResidentialYardAreas(safeInput);

  return {
    input,
    valid: errors.length === 0,
    errors,
    warnings: [...GLOBAL_WARNINGS],
    values,
    steps: [
      buildInputStep(safeInput, values),
      buildChildrenStep(safeInput, values),
      buildAdultRecreationStep(safeInput, values),
      buildPhysicalCultureStep(safeInput, values),
      buildGuestParkingStep(safeInput, values),
      buildBicycleParkingStep(safeInput, values),
      buildWasteCollectionStep(safeInput, values),
      buildPetWalkingStep(safeInput, values),
      buildHouseholdPurposeStep(safeInput, values),
      buildInsideBoundaryStep(values),
      buildSummaryStep(values),
      buildConditionsStep(),
    ],
  };
}
