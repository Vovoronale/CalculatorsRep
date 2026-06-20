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
    | "territorial-need"
    | "conclusion";
  caption: string;
  items?: string[];
  notes?: string[];
  formula?: string;
  formulas?: string[];
  resultItems?: string[];
};

export type ResidentialYardAreasReport = {
  input: ResidentialYardAreasInput;
  valid: boolean;
  errors: string[];
  warnings: string[];
  values: ResidentialYardAreasValues | null;
  steps: ResidentialYardAreasReportStep[];
};

const GLOBAL_WARNINGS = [
  "Для кожного виду майданчика приймається більша площа з розрахунків за кількістю мешканців і квартир. Це погоджене консервативне правило калькулятора, а не окрема вимога ДБН.",
  "Розрахунок площ не підтверджує можливість фактичного розміщення майданчиків. Проєктом окремо перевіряють нормативні відстані, озеленення, інсоляцію, проїзди, протипожежні вимоги, технічні умови та місцеві містобудівні обмеження.",
] as const;

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
      "Кількість дво- та більше кімнатних квартир має бути цілим числом, не меншим за 0.",
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
        "Зменшений норматив не можна застосувати без окремої озелененої зони з фізкультурними майданчиками.",
      );
    }
    if (!input.hasRequiredLimitedUseGreenery) {
      errors.push(
        "Зменшений норматив не можна застосувати без забезпечення не менше 6 м² зелених насаджень обмеженого користування на одну особу.",
      );
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
      return "кількість осіб";
    case "apartments":
      return "кількість квартир";
    case "equal":
      return "обидва показники дають однакову площу";
    case "manual":
      return "ручне значення за технічними умовами";
    case "disabled":
      return "майданчики не передбачені";
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
  return `Nкв = N₁ + N₂+ = ${formatCount(input.oneRoomApartments)} + ${formatCount(
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
): string[] {
  const apartmentCount =
    input.oneRoomApartments + input.twoOrMoreRoomApartments;
  return [
    `${symbol},ос = ${personRateSymbol} × Nосіб = ${formatResidentialYardAreaNumber(
      personRate,
    )} × ${formatCount(input.residents)} = ${formatResidentialYardAreaNumber(
      values.byResidentsM2 ?? 0,
    )} м²`,
    `${symbol},кв = ${apartmentRateSymbol} × Nкв = ${formatResidentialYardAreaNumber(
      apartmentRate,
    )} × ${formatCount(apartmentCount)} = ${formatResidentialYardAreaNumber(
      values.byApartmentsM2 ?? 0,
    )} м²`,
    `${symbol} = max(${symbol},ос; ${symbol},кв) = max(${formatResidentialYardAreaNumber(
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
    `Кількість мешканців: Nосіб = ${formatCount(input.residents)} осіб`,
    `Кількість однокімнатних квартир: N₁ = ${formatCount(
      input.oneRoomApartments,
    )} квартир`,
    `Кількість дво- та більше кімнатних квартир: N₂+ = ${formatCount(
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
    `Господарські майданчики передбачено: ${
      input.hasHouseholdPurposeAreas ? "Так" : "Ні"
    }`,
  ];

  if (input.physicalCultureMode === "reduced") {
    items.push(
      `Окрема озеленена зона з фізкультурними майданчиками: ${
        input.hasSeparateLandscapedPhysicalCultureZone
          ? "підтверджено"
          : "не підтверджено"
      }`,
      `Зелені насадження обмеженого користування не менше 6 м²/особу: ${
        input.hasRequiredLimitedUseGreenery
          ? "підтверджено"
          : "не підтверджено"
      }`,
    );
  }
  if (input.wasteCollectionMethod === "vacuum") {
    items.push(
      `Площа майданчика для збирання відходів, прийнята за технічними умовами: ${formatManualArea(
        "Sвідх,руч",
        safeFinite(input.manualVacuumAreaM2),
        input.manualVacuumAreaUnit,
      )}`,
    );
  }
  if (input.hasHouseholdPurposeAreas) {
    items.push(
      `Прийнятий питомий розмір господарських майданчиків на одну особу: ${formatManualArea(
        "qгосп,ос",
        input.householdAreaPerPersonM2,
        input.householdAreaPerPersonUnit,
        "/особу",
      )}`,
      `Прийнятий питомий розмір господарських майданчиків на одну квартиру: ${formatManualArea(
        "qгосп,кв",
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
      "Питомий розмір на одну особу: qдіт,ос = 0,7 м²/особу",
      "Питомий розмір на одну квартиру: qдіт,кв = 1,75 м²/квартиру",
    ],
    formulas: buildDualFormulas(
      "Sдіт",
      "qдіт,ос",
      "qдіт,кв",
      0.7,
      1.75,
      input,
      values.children,
    ),
    resultItems: [
      `Прийнята площа дитячих майданчиків: Sдіт = ${formatResidentialYardAreaNumber(
        values.children.adoptedM2,
      )} м²`,
      `Розрахункова база, що визначила площу: ${formatBasis(
        values.children.basis,
      )}`,
    ],
    notes: [
      "Таблиця 6.4 наводить паралельні питомі показники на одну особу та одну квартиру. Прийняття більшої з двох розрахованих площ є погодженим консервативним правилом калькулятора, а не окремою вимогою ДБН.",
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
      "Питомий розмір на одну особу: qвідп,ос = 0,2 м²/особу",
      "Питомий розмір на одну квартиру: qвідп,кв = 0,5 м²/квартиру",
    ],
    formulas: buildDualFormulas(
      "Sвідп",
      "qвідп,ос",
      "qвідп,кв",
      0.2,
      0.5,
      input,
      values.adultRecreation,
    ),
    resultItems: [
      `Прийнята площа майданчиків для відпочинку дорослого населення: Sвідп = ${formatResidentialYardAreaNumber(
        values.adultRecreation.adoptedM2,
      )} м²`,
      `Розрахункова база, що визначила площу: ${formatBasis(
        values.adultRecreation.basis,
      )}`,
    ],
    notes: [
      "Прийняття більшої з площ, розрахованих за двома паралельними показниками таблиці 6.4, є погодженим консервативним правилом калькулятора.",
    ],
  };
}

function buildPhysicalCultureStep(
  input: ResidentialYardAreasInput,
  values: ResidentialYardAreasValues,
): ResidentialYardAreasReportStep {
  const reduced = input.physicalCultureMode === "reduced";
  const personRate = reduced ? 0.2 : 2;
  const apartmentRate = reduced ? 0.5 : 5;
  const items = [
    `Режим розрахунку: ${reduced ? "зменшений норматив" : "повний норматив"}`,
  ];
  if (reduced) {
    items.push(
      `Окрема озеленена зона з фізкультурними майданчиками: ${
        input.hasSeparateLandscapedPhysicalCultureZone
          ? "підтверджено"
          : "не підтверджено"
      }`,
      `Зелені насадження обмеженого користування не менше 6 м²/особу: ${
        input.hasRequiredLimitedUseGreenery
          ? "підтверджено"
          : "не підтверджено"
      }`,
    );
  }
  items.push(
    `Питомий розмір на одну особу: qфіз,ос = ${formatResidentialYardAreaNumber(
      personRate,
    )} м²/особу`,
    `Питомий розмір на одну квартиру: qфіз,кв = ${formatResidentialYardAreaNumber(
      apartmentRate,
    )} м²/квартиру`,
  );

  return {
    key: "physical-culture",
    caption:
      "Визначення площі майданчиків для занять фізкультурою (п. 6.1.21, таблиця 6.4 та примітка * ДБН Б.2.2-12:2019):",
    items,
    formulas: buildDualFormulas(
      "Sфіз",
      "qфіз,ос",
      "qфіз,кв",
      personRate,
      apartmentRate,
      input,
      values.physicalCulture,
    ),
    resultItems: [
      `Прийнята площа фізкультурних майданчиків: Sфіз = ${formatResidentialYardAreaNumber(
        values.physicalCulture.adoptedM2,
      )} м²`,
      `Розрахункова база, що визначила площу: ${formatBasis(
        values.physicalCulture.basis,
      )}`,
    ],
    notes: [
      "Зменшений норматив допускається лише за наявності окремої озелененої зони з фізкультурними майданчиками, яка обслуговує мікрорайон або групу житлових кварталів, та за забезпечення не менше 6 м² зелених насаджень обмеженого користування на одну особу.",
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
      `Nгост = ceil(0,15 × (0,5 × N₁ + N₂+)) = ceil(0,15 × (0,5 × ${oneRoom} + ${multiRoom})) = ${formatCount(
        values.guestParkingSpaces,
      )} машиномісць`,
      `Sгост = 25 × Nгост = 25 × ${formatCount(
        values.guestParkingSpaces,
      )} = ${formatResidentialYardAreaNumber(
        values.guestParkingAreaM2,
      )} м²`,
    ],
    resultItems: [
      `Кількість гостьових машиномісць: Nгост = ${formatCount(
        values.guestParkingSpaces,
      )} машиномісць`,
      `Площа відкритої гостьової стоянки: Sгост = ${formatResidentialYardAreaNumber(
        values.guestParkingAreaM2,
      )} м²`,
    ],
    notes: [
      "Округлення виконується вгору до цілого машиномісця, щоб забезпечити не менше нормативної кількості місць.",
      "Площа гостьової стоянки визначається за складом квартир і є спільною складовою підсумку; окремий розрахунок за кількістю мешканців не виконується.",
      "Цей крок не перевіряє нормативні відстані від стоянки до будинків та інших об’єктів.",
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
      "Питомий розмір на одну особу: qвел,ос = 0,1 м²/особу",
      "Питомий розмір на одну квартиру: qвел,кв = 0,25 м²/квартиру",
    ],
    formulas: buildDualFormulas(
      "Sвел",
      "qвел,ос",
      "qвел,кв",
      0.1,
      0.25,
      input,
      values.bicycleParking,
    ),
    resultItems: [
      `Прийнята площа майданчиків для тимчасової стоянки велосипедів: Sвел = ${formatResidentialYardAreaNumber(
        values.bicycleParking.adoptedM2,
      )} м²`,
      `Розрахункова база, що визначила площу: ${formatBasis(
        values.bicycleParking.basis,
      )}`,
    ],
    notes: [
      "Прийняття більшої з площ, розрахованих за кількістю осіб і квартир, є погодженим консервативним правилом калькулятора.",
    ],
  };
}

function buildWasteCollectionStep(
  input: ResidentialYardAreasInput,
  values: ResidentialYardAreasValues,
): ResidentialYardAreasReportStep {
  const methodLabel =
    input.wasteCollectionMethod === "above_ground"
      ? "наземний"
      : input.wasteCollectionMethod === "underground"
        ? "підземний"
        : "вакуумний";
  const items = [
    `Спосіб збирання побутових відходів: ${methodLabel}`,
  ];
  let formulas: string[] | undefined;
  let formula: string | undefined;
  if (input.wasteCollectionMethod === "vacuum") {
    items.push(
      `Площа майданчика, прийнята за технічними умовами: ${formatManualArea(
        "Sвідх,руч",
        safeFinite(input.manualVacuumAreaM2),
        input.manualVacuumAreaUnit,
      )}`,
    );
    formula = `Sвідх = Sвідх,руч = ${formatResidentialYardAreaNumber(
      values.wasteCollection.adoptedM2,
    )} м²`;
  } else {
    const rates = RATES.wasteCollection[input.wasteCollectionMethod];
    items.push(
      `Питомий розмір на одну особу: qвідх,ос = ${formatResidentialYardAreaNumber(
        rates.residents,
      )} м²/особу`,
      `Питомий розмір на одну квартиру: qвідх,кв = ${formatResidentialYardAreaNumber(
        rates.apartments,
      )} м²/квартиру`,
    );
    formulas = buildDualFormulas(
      "Sвідх",
      "qвідх,ос",
      "qвідх,кв",
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
      `Прийнята площа майданчиків для збирання побутових відходів: Sвідх = ${formatResidentialYardAreaNumber(
        values.wasteCollection.adoptedM2,
      )} м²`,
      `Розрахункова база, що визначила площу: ${formatBasis(
        values.wasteCollection.basis,
      )}`,
    ],
    notes: [
      "Для вакуумного способу таблиця 6.4 не встановлює питомого показника. Площу приймає користувач за містобудівними та технічними умовами; калькулятор не перевіряє її нормативне обґрунтування.",
      "Для наземного способу відстань від майданчика до вікон житлових і громадських будівель та до дитячих, фізкультурних і рекреаційних майданчиків має бути не менше 20 м, а пішохідна доступність — не більше 100 м.",
      "Для підземного і вакуумного способів нормативні відстані визначаються технічними умовами.",
      "Калькулятор визначає площу, але не перевіряє розміщення, під’їзд сміттєвоза та нормативні відстані.",
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
      "Питомий розмір на одну особу: qтвар,ос = 0,3 м²/особу",
      "Питомий розмір на одну квартиру: qтвар,кв = 0,3 м²/квартиру",
    ],
    formulas: buildDualFormulas(
      "Sтвар",
      "qтвар,ос",
      "qтвар,кв",
      0.3,
      0.3,
      input,
      values.petWalking,
    ),
    resultItems: [
      `Прийнята площа майданчиків для вигулу домашніх тварин: Sтвар = ${formatResidentialYardAreaNumber(
        values.petWalking.adoptedM2,
      )} м²`,
      `Розрахункова база, що визначила площу: ${formatBasis(
        values.petWalking.basis,
      )}`,
      "Розміщення: поза межами прибудинкової території",
    ],
    notes: [
      "Майданчики для вигулу домашніх тварин слід влаштовувати поза межами прибудинкових територій на спеціально визначених ділянках.",
      "Відстань від майданчика до вікон житлового будинку, майданчиків для ігор і відпочинку та майданчиків для занять фізкультурою має бути не менше 40 м.",
      "Площа Sтвар не входить до підсумку майданчиків у межах прибудинкової території, але входить до загальної територіальної потреби.",
      "Калькулятор визначає площу, але не перевіряє фактичне розміщення та відстані.",
    ],
  };
}

function buildHouseholdPurposeStep(
  input: ResidentialYardAreasInput,
  values: ResidentialYardAreasValues,
): ResidentialYardAreasReportStep {
  const enabled = input.hasHouseholdPurposeAreas;
  const items = [
    `Господарські майданчики передбачено: ${enabled ? "Так" : "Ні"}`,
  ];
  let formulas: string[] | undefined;
  let formula: string | undefined;
  if (enabled) {
    items.push(
      `Прийнятий питомий розмір на одну особу: ${formatManualArea(
        "qгосп,ос",
        input.householdAreaPerPersonM2,
        input.householdAreaPerPersonUnit,
        "/особу",
      )}`,
      "Нормативний діапазон на одну особу: 0,1–0,3 м²/особу",
      `Прийнятий питомий розмір на одну квартиру: ${formatManualArea(
        "qгосп,кв",
        input.householdAreaPerApartmentM2,
        input.householdAreaPerApartmentUnit,
        "/квартиру",
      )}`,
      "Нормативний діапазон на одну квартиру: 0,25–0,75 м²/квартиру",
    );
    formulas = buildDualFormulas(
      "Sгосп",
      "qгосп,ос",
      "qгосп,кв",
      input.householdAreaPerPersonM2,
      input.householdAreaPerApartmentM2,
      input,
      values.householdPurpose,
    );
  } else {
    formula =
      "Sгосп = 0 м² (господарські майданчики не передбачені користувачем)";
  }

  return {
    key: "household-purpose",
    caption:
      "Визначення площі майданчиків для господарських цілей (п. 6.1.21, примітка 2 до таблиці 6.4 ДБН Б.2.2-12:2019):",
    items,
    formula,
    formulas,
    resultItems: [
      `Прийнята площа господарських майданчиків: Sгосп = ${formatResidentialYardAreaNumber(
        values.householdPurpose.adoptedM2,
      )} м²`,
      `Розрахункова база, що визначила площу: ${formatBasis(
        values.householdPurpose.basis,
      )}`,
    ],
    notes: [
      "Примітка 2 до таблиці 6.4 дозволяє облаштовувати господарські майданчики для сушіння білизни та чищення килимів у наведених діапазонах.",
      "Відстань від господарських майданчиків до найбільш віддаленого входу в житловий будинок має бути не більше 100 м.",
      "Калькулятор перевіряє питомі значення, але не перевіряє фактичну відстань до входу.",
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
      `Дитячі майданчики: Sдіт = ${formatResidentialYardAreaNumber(areas[0])} м²`,
      `Майданчики для відпочинку дорослих: Sвідп = ${formatResidentialYardAreaNumber(
        areas[1],
      )} м²`,
      `Фізкультурні майданчики: Sфіз = ${formatResidentialYardAreaNumber(
        areas[2],
      )} м²`,
      `Відкрита гостьова стоянка: Sгост = ${formatResidentialYardAreaNumber(
        areas[3],
      )} м²`,
      `Майданчики для тимчасової стоянки велосипедів: Sвел = ${formatResidentialYardAreaNumber(
        areas[4],
      )} м²`,
      `Майданчики для збирання побутових відходів: Sвідх = ${formatResidentialYardAreaNumber(
        areas[5],
      )} м²`,
      `Господарські майданчики: Sгосп = ${formatResidentialYardAreaNumber(
        areas[6],
      )} м²`,
    ],
    formula: `Sприбуд = Sдіт + Sвідп + Sфіз + Sгост + Sвел + Sвідх + Sгосп = ${areas
      .map(formatResidentialYardAreaNumber)
      .join(" + ")} = ${formatResidentialYardAreaNumber(
      values.insideBoundaryAreaM2,
    )} м²`,
    resultItems: [
      `Сумарна площа майданчиків у межах прибудинкової території: Sприбуд = ${formatResidentialYardAreaNumber(
        values.insideBoundaryAreaM2,
      )} м²`,
    ],
    notes: [
      "До суми входить прийнята більша площа кожного виду майданчика, визначена за кількістю осіб і квартир.",
      "Майданчик для вигулу домашніх тварин не включено, оскільки його слід розміщувати поза межами прибудинкової території.",
      "Цей підсумок не є мінімальною площею земельної ділянки житлового будинку за таблицею 6.3 і не включає площу забудови, проїздів, тротуарів, озеленення та інших елементів території.",
    ],
  };
}

function buildTerritorialNeedStep(
  values: ResidentialYardAreasValues,
): ResidentialYardAreasReportStep {
  return {
    key: "territorial-need",
    caption:
      "Визначення загальної територіальної потреби для розрахованих майданчиків:",
    items: [
      `Сумарна площа майданчиків у межах прибудинкової території: Sприбуд = ${formatResidentialYardAreaNumber(
        values.insideBoundaryAreaM2,
      )} м²`,
      `Площа майданчика для вигулу домашніх тварин поза межами прибудинкової території: Sтвар = ${formatResidentialYardAreaNumber(
        values.petWalking.adoptedM2,
      )} м²`,
    ],
    formula: `Sтер = Sприбуд + Sтвар = ${formatResidentialYardAreaNumber(
      values.insideBoundaryAreaM2,
    )} + ${formatResidentialYardAreaNumber(
      values.petWalking.adoptedM2,
    )} = ${formatResidentialYardAreaNumber(
      values.territorialNeedAreaM2,
    )} м²`,
    resultItems: [
      `Загальна територіальна потреба для розрахованих майданчиків: Sтер = ${formatResidentialYardAreaNumber(
        values.territorialNeedAreaM2,
      )} м²`,
    ],
    notes: [
      "Значення Sтер об’єднує площі, які мають розміщуватися в різних територіальних межах, і використовується лише як сумарний планувальний показник.",
      "Sтер не є нормативною площею прибудинкової земельної ділянки та не скасовує вимоги щодо розміщення майданчика для вигулу тварин поза її межами.",
    ],
  };
}

function buildConclusionStep(
  values: ResidentialYardAreasValues,
): ResidentialYardAreasReportStep {
  return {
    key: "conclusion",
    caption:
      "Висновок щодо площ майданчиків у складі прибудинкової території:",
    items: [
      `Дитячі майданчики: ${formatResidentialYardAreaNumber(
        values.children.adoptedM2,
      )} м²`,
      `Майданчики для відпочинку дорослих: ${formatResidentialYardAreaNumber(
        values.adultRecreation.adoptedM2,
      )} м²`,
      `Фізкультурні майданчики: ${formatResidentialYardAreaNumber(
        values.physicalCulture.adoptedM2,
      )} м²`,
      `Відкрита гостьова стоянка: ${formatCount(
        values.guestParkingSpaces,
      )} машиномісць, ${formatResidentialYardAreaNumber(
        values.guestParkingAreaM2,
      )} м²`,
      `Майданчики для тимчасової стоянки велосипедів: ${formatResidentialYardAreaNumber(
        values.bicycleParking.adoptedM2,
      )} м²`,
      `Майданчики для збирання побутових відходів: ${formatResidentialYardAreaNumber(
        values.wasteCollection.adoptedM2,
      )} м²`,
      `Господарські майданчики: ${formatResidentialYardAreaNumber(
        values.householdPurpose.adoptedM2,
      )} м²`,
      `Сумарна площа майданчиків у межах прибудинкової території: ${formatResidentialYardAreaNumber(
        values.insideBoundaryAreaM2,
      )} м²`,
      `Майданчик для вигулу домашніх тварин поза її межами: ${formatResidentialYardAreaNumber(
        values.petWalking.adoptedM2,
      )} м²`,
      `Загальна територіальна потреба для розрахованих майданчиків: ${formatResidentialYardAreaNumber(
        values.territorialNeedAreaM2,
      )} м²`,
    ],
    notes: [
      "Результат визначає площі погодженого переліку майданчиків, але не підтверджує можливість їх фактичного розміщення. Проєктом окремо перевіряють площу земельної ділянки, озеленення, інсоляцію, проїзди, протипожежні та санітарні відстані, місцеві містобудівні обмеження й технічні умови.",
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
      buildTerritorialNeedStep(values),
      buildConclusionStep(values),
    ],
  };
}
