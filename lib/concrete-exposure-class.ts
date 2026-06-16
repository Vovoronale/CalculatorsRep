export const CONCRETE_EXPOSURE_CLASS_SOURCE =
  "ДБН В.2.6-98:2009 / ДСТУ ENV 206:2018";

export type CoverExposureClass =
  | "X0"
  | "XC1"
  | "XC2"
  | "XC3"
  | "XC4"
  | "XD1"
  | "XD2"
  | "XD3"
  | "XS1"
  | "XS2"
  | "XS3";

export type ExposureClass =
  | CoverExposureClass
  | "XF1"
  | "XF2"
  | "XF3"
  | "XF4"
  | "XA1"
  | "XA2"
  | "XA3";

export type ConcreteExposureElementType =
  | "slab"
  | "beam"
  | "column"
  | "wall"
  | "foundation"
  | "retaining_wall"
  | "tank"
  | "other";

export type ReinforcementPresence =
  | "reinforced_or_embedded_metal"
  | "plain_concrete_without_metal";

export type CarbonationMoistureCondition =
  | "dry_or_permanently_wet"
  | "wet_rarely_dry"
  | "moderate_or_high_humidity"
  | "cyclic_wet_dry";

export type ChlorideSource =
  | "none"
  | "deicing_salts"
  | "airborne_sea_salts"
  | "sea_water";

export type ChlorideMoistureCondition =
  | "moderate_humidity"
  | "wet_rarely_dry"
  | "permanently_submerged"
  | "cyclic_wet_dry"
  | "splash_or_spray";

export type FreezeThawRisk =
  | "none"
  | "moderate_water_saturation_without_deicing"
  | "moderate_water_saturation_with_deicing"
  | "high_water_saturation_without_deicing"
  | "high_water_saturation_with_deicing_or_sea_water";

export type ChemicalAttackRisk =
  | "none"
  | "XA1"
  | "XA2"
  | "XA3"
  | "unknown_requires_analysis";

export type ConcreteExposureClassInput = {
  elementName: string;
  elementType: ConcreteExposureElementType;
  reinforcementPresence: ReinforcementPresence;
  carbonationMoistureCondition: CarbonationMoistureCondition;
  chlorideSource: ChlorideSource;
  chlorideMoistureCondition: ChlorideMoistureCondition;
  freezeThawRisk: FreezeThawRisk;
  chemicalAttackRisk: ChemicalAttackRisk;
  hasSoilOrGroundwaterAnalysis: boolean;
  currentExposureClass?: CoverExposureClass;
};

export type ConcreteExposureClassValues = {
  exposureClasses: ExposureClass[];
  governingCoverExposureClass: CoverExposureClass;
  additionalDurabilityRequirements: string[];
};

export type ConcreteExposureClassReportStep = {
  key:
    | "inputs"
    | "x0-check"
    | "xc-carbonation"
    | "xd-chlorides"
    | "xs-marine-chlorides"
    | "xf-freeze-thaw"
    | "xa-chemical-attack"
    | "class-set"
    | "governing-cover-class"
    | "additional-requirements"
    | "conclusion";
  caption: string;
  items?: string[];
  notes?: string[];
  formula?: string;
  formulas?: string[];
};

export type ConcreteExposureClassReport = {
  input: ConcreteExposureClassInput;
  valid: boolean;
  errors: string[];
  warnings: string[];
  values: ConcreteExposureClassValues | null;
  steps: ConcreteExposureClassReportStep[];
};

export const DEFAULT_CONCRETE_EXPOSURE_CLASS_INPUT: ConcreteExposureClassInput = {
  elementName: "Елемент",
  elementType: "column",
  reinforcementPresence: "reinforced_or_embedded_metal",
  carbonationMoistureCondition: "dry_or_permanently_wet",
  chlorideSource: "none",
  chlorideMoistureCondition: "moderate_humidity",
  freezeThawRisk: "none",
  chemicalAttackRisk: "none",
  hasSoilOrGroundwaterAnalysis: false,
};

const ELEMENT_TYPE_LABELS: Record<ConcreteExposureElementType, string> = {
  slab: "плита",
  beam: "балка",
  column: "колона",
  wall: "стіна",
  foundation: "фундамент",
  retaining_wall: "підпірна стіна",
  tank: "резервуар",
  other: "інший елемент",
};

const REINFORCEMENT_PRESENCE_LABELS: Record<ReinforcementPresence, string> = {
  reinforced_or_embedded_metal:
    "залізобетон або бетон з металевими закладними",
  plain_concrete_without_metal: "бетон без арматури і металевих закладних",
};

const CARBONATION_MOISTURE_LABELS: Record<
  CarbonationMoistureCondition,
  string
> = {
  dry_or_permanently_wet: "сухо або постійно мокро",
  wet_rarely_dry: "волого, рідко сухо",
  moderate_or_high_humidity: "помірна або висока вологість",
  cyclic_wet_dry: "циклічне зволоження і висихання",
};

const CHLORIDE_SOURCE_LABELS: Record<ChlorideSource, string> = {
  none: "немає",
  deicing_salts: "протиожеледні солі",
  airborne_sea_salts: "морські солі в повітрі",
  sea_water: "морська вода",
};

const CHLORIDE_MOISTURE_LABELS: Record<ChlorideMoistureCondition, string> = {
  moderate_humidity: "помірна вологість",
  wet_rarely_dry: "волого, рідко сухо",
  permanently_submerged: "постійне занурення",
  cyclic_wet_dry: "циклічне зволоження і висихання",
  splash_or_spray: "бризки або розпилення",
};

const FREEZE_THAW_LABELS: Record<FreezeThawRisk, string> = {
  none: "немає",
  moderate_water_saturation_without_deicing:
    "помірне водонасичення без солей",
  moderate_water_saturation_with_deicing: "помірне водонасичення з солями",
  high_water_saturation_without_deicing: "високе водонасичення без солей",
  high_water_saturation_with_deicing_or_sea_water:
    "високе водонасичення з солями або морською водою",
};

const CHEMICAL_ATTACK_LABELS: Record<ChemicalAttackRisk, string> = {
  none: "немає ознак хімічної агресії",
  XA1: "XA1 — слабка хімічна агресія",
  XA2: "XA2 — помірна хімічна агресія",
  XA3: "XA3 — сильна хімічна агресія",
  unknown_requires_analysis: "невідомо — потрібен аналіз ґрунту або води",
};

const COVER_EXPOSURE_RANK: Record<CoverExposureClass, number> = {
  X0: 0,
  XC1: 1,
  XC2: 2,
  XC3: 2,
  XC4: 3,
  XD1: 4,
  XS1: 4,
  XD2: 5,
  XS2: 5,
  XD3: 6,
  XS3: 6,
};

const COVER_EXPOSURE_ORDER: CoverExposureClass[] = [
  "X0",
  "XC1",
  "XC2",
  "XC3",
  "XC4",
  "XD1",
  "XS1",
  "XD2",
  "XS2",
  "XD3",
  "XS3",
];

const EXPOSURE_CLASS_OUTPUT_ORDER: ExposureClass[] = [
  "X0",
  "XC1",
  "XC2",
  "XC3",
  "XC4",
  "XD1",
  "XD2",
  "XD3",
  "XS1",
  "XS2",
  "XS3",
  "XF1",
  "XF2",
  "XF3",
  "XF4",
  "XA1",
  "XA2",
  "XA3",
];

const XF_REQUIREMENT =
  "Для класу XF необхідно перевірити вимоги до морозостійкості бетону, водонасичення, водонепроникності, повітровтягування та складу бетонної суміші.";
const XA_REQUIREMENT =
  "Для класу XA необхідно перевірити хімічну агресивність середовища та потребу у спеціальному захисті бетону.";
const XA_ANALYSIS_WARNING =
  "Для визначення класу XA потрібен аналіз ґрунту або води.";
const XA_USER_SELECTED_WARNING =
  "Клас XA прийнято за вибором користувача. Для остаточного призначення класу хімічної агресії потрібен аналіз ґрунту або води.";
const PLAIN_CONCRETE_X0_WARNING =
  "Для бетону без арматури і металевих закладних попередньо прийнято X0 для передачі в калькулятор захисного шару.";
const REINFORCED_NO_COVER_ERROR =
  "Для залізобетонного елемента не визначено клас із груп X0/XC/XD/XS. Потрібно уточнити вологісний режим або дію хлоридів.";

function addUnique<T>(items: T[], item: T | null): void {
  if (item !== null && !items.includes(item)) {
    items.push(item);
  }
}

function getX0Class(input: ConcreteExposureClassInput): "X0" | null {
  if (
    input.reinforcementPresence === "plain_concrete_without_metal" &&
    input.freezeThawRisk === "none" &&
    input.chemicalAttackRisk === "none"
  ) {
    return "X0";
  }

  return null;
}

function getXcClass(
  input: ConcreteExposureClassInput,
): "XC1" | "XC2" | "XC3" | "XC4" | null {
  if (input.reinforcementPresence === "plain_concrete_without_metal") {
    return null;
  }

  if (input.carbonationMoistureCondition === "dry_or_permanently_wet") {
    return "XC1";
  }
  if (input.carbonationMoistureCondition === "wet_rarely_dry") return "XC2";
  if (input.carbonationMoistureCondition === "moderate_or_high_humidity") {
    return "XC3";
  }

  return "XC4";
}

function getXdClass(
  input: ConcreteExposureClassInput,
): "XD1" | "XD2" | "XD3" | null {
  if (input.chlorideSource !== "deicing_salts") return null;
  if (input.chlorideMoistureCondition === "moderate_humidity") return "XD1";
  if (input.chlorideMoistureCondition === "wet_rarely_dry") return "XD2";
  if (
    input.chlorideMoistureCondition === "cyclic_wet_dry" ||
    input.chlorideMoistureCondition === "splash_or_spray"
  ) {
    return "XD3";
  }

  return null;
}

function getXsClass(
  input: ConcreteExposureClassInput,
): "XS1" | "XS2" | "XS3" | null {
  if (input.chlorideSource === "airborne_sea_salts") return "XS1";
  if (input.chlorideSource !== "sea_water") return null;
  if (
    input.chlorideMoistureCondition === "permanently_submerged" ||
    input.chlorideMoistureCondition === "wet_rarely_dry"
  ) {
    return "XS2";
  }
  if (
    input.chlorideMoistureCondition === "cyclic_wet_dry" ||
    input.chlorideMoistureCondition === "splash_or_spray"
  ) {
    return "XS3";
  }

  return null;
}

function getXfClass(
  input: ConcreteExposureClassInput,
): "XF1" | "XF2" | "XF3" | "XF4" | null {
  if (input.freezeThawRisk === "moderate_water_saturation_without_deicing") {
    return "XF1";
  }
  if (input.freezeThawRisk === "moderate_water_saturation_with_deicing") {
    return "XF2";
  }
  if (input.freezeThawRisk === "high_water_saturation_without_deicing") {
    return "XF3";
  }
  if (input.freezeThawRisk === "high_water_saturation_with_deicing_or_sea_water") {
    return "XF4";
  }

  return null;
}

function getXaClass(
  input: ConcreteExposureClassInput,
): "XA1" | "XA2" | "XA3" | null {
  if (
    input.chemicalAttackRisk === "XA1" ||
    input.chemicalAttackRisk === "XA2" ||
    input.chemicalAttackRisk === "XA3"
  ) {
    return input.chemicalAttackRisk;
  }

  return null;
}

function isCoverExposureClass(cls: ExposureClass): cls is CoverExposureClass {
  return COVER_EXPOSURE_ORDER.includes(cls as CoverExposureClass);
}

function getGoverningCoverExposureClass(
  classes: ExposureClass[],
): CoverExposureClass | null {
  const candidates = COVER_EXPOSURE_ORDER.filter((cls) =>
    classes.includes(cls),
  );
  if (candidates.length === 0) return null;

  return candidates.reduce((selected, candidate) =>
    COVER_EXPOSURE_RANK[candidate] > COVER_EXPOSURE_RANK[selected]
      ? candidate
      : selected,
  );
}

function buildAdditionalRequirements(
  classes: ExposureClass[],
  input: ConcreteExposureClassInput,
): string[] {
  const requirements: string[] = [];

  if (classes.some((cls) => cls.startsWith("XF"))) {
    addUnique(requirements, XF_REQUIREMENT);
  }
  if (classes.some((cls) => cls.startsWith("XA"))) {
    addUnique(requirements, XA_REQUIREMENT);
  }
  if (input.chemicalAttackRisk === "unknown_requires_analysis") {
    addUnique(requirements, XA_ANALYSIS_WARNING);
  }

  return requirements;
}

function sortExposureClasses(classes: ExposureClass[]): ExposureClass[] {
  return EXPOSURE_CLASS_OUTPUT_ORDER.filter((cls) => classes.includes(cls));
}

function formatClasses(classes: string[]): string {
  return classes.join(", ");
}

function getClassSetFormula(
  classes: ExposureClass[],
  rawParts: string[],
): string {
  return `exposure_classes = union(${rawParts.join("; ")}) = [${formatClasses(
    classes,
  )}]`;
}

function buildInputStep(
  input: ConcreteExposureClassInput,
): ConcreteExposureClassReportStep {
  const items = [
    `Назва елемента: ${input.elementName}`,
    `Тип елемента: ${ELEMENT_TYPE_LABELS[input.elementType]}`,
    `Армування або металеві закладні: ${
      REINFORCEMENT_PRESENCE_LABELS[input.reinforcementPresence]
    }`,
    `Вологісний режим для карбонізації: ${
      CARBONATION_MOISTURE_LABELS[input.carbonationMoistureCondition]
    }`,
    `Джерело хлоридів: ${CHLORIDE_SOURCE_LABELS[input.chlorideSource]}`,
  ];

  if (input.chlorideSource !== "none") {
    items.push(
      `Вологісний режим для хлоридів: ${
        CHLORIDE_MOISTURE_LABELS[input.chlorideMoistureCondition]
      }`,
    );
  }

  items.push(`Морозний вплив: ${FREEZE_THAW_LABELS[input.freezeThawRisk]}`);
  items.push(`Хімічна агресія: ${CHEMICAL_ATTACK_LABELS[input.chemicalAttackRisk]}`);

  if (input.chemicalAttackRisk !== "none") {
    items.push(
      `Аналіз ґрунту або води: ${
        input.hasSoilOrGroundwaterAnalysis ? "є" : "немає"
      }`,
    );
  }

  if (input.currentExposureClass) {
    items.push(
      `Поточний клас у розрахунку захисного шару: ${input.currentExposureClass}`,
    );
  }

  return {
    key: "inputs",
    caption:
      "Вихідні дані для визначення класу впливу середовища (ДБН В.2.6-98:2009, розділ 4.3-4.4; ДСТУ ENV 206:2018, класи впливу середовища):",
    items,
    formula:
      "exposure_classes = f(умови карбонізації; хлориди; морозний вплив; хімічна агресія)",
  };
}

function buildX0Step(x0Class: "X0" | null): ConcreteExposureClassReportStep {
  return {
    key: "x0-check",
    caption:
      "Перевірка можливості прийняття класу X0 (ДБН В.2.6-98:2009, класи впливу середовища; ДСТУ ENV 206:2018, група X0):",
    notes: [
      "Клас X0 застосовується для бетону без арматури або металевих закладних, якщо відсутні суттєві агресивні впливи середовища.",
      "Для залізобетону або бетону з металевими закладними X0 не приймається як керівний клас, оскільки потрібно враховувати ризик корозії арматури.",
    ],
    formula: `X0 = plain_concrete_without_metal and XF = none and XA = none = ${
      x0Class === "X0" ? "true" : "false"
    }`,
  };
}

function buildXcStep(
  input: ConcreteExposureClassInput,
  xcClass: ReturnType<typeof getXcClass>,
): ConcreteExposureClassReportStep {
  const notes = [
    "Для залізобетонних елементів або бетонних елементів із металевими закладними перевіряється ризик корозії арматури внаслідок карбонізації бетону.",
    "Клас XC визначається за вологісним режимом експлуатації.",
  ];

  if (input.reinforcementPresence === "plain_concrete_without_metal") {
    notes.push(
      "Елемент без арматури і металевих закладних, тому клас XC для захисту арматури від карбонізації не призначається.",
    );
  }

  return {
    key: "xc-carbonation",
    caption:
      "Визначення класу впливу за карбонізацією XC (ДБН В.2.6-98:2009, класи впливу середовища; ДСТУ ENV 206:2018, група XC):",
    notes,
    formula: xcClass
      ? `XC = f(carbonation_moisture_condition) = ${input.carbonationMoistureCondition} => ${xcClass}`
      : "XC = not_applicable",
  };
}

function buildXdStep(
  input: ConcreteExposureClassInput,
  xdClass: ReturnType<typeof getXdClass>,
): ConcreteExposureClassReportStep {
  return {
    key: "xd-chlorides",
    caption:
      "Визначення класу дії хлоридів не з морської води XD (ДБН В.2.6-98:2009, класи впливу середовища; ДСТУ ENV 206:2018, група XD):",
    notes: [
      "Клас XD призначається, якщо на конструкцію діють хлориди не з морської води, наприклад протиожеледні солі.",
      "Ступінь впливу залежить від вологісного режиму, змінного зволоження, висихання, бризок або розпилення.",
    ],
    formula: xdClass
      ? `XD = f(chloride_moisture_condition) = ${input.chlorideMoistureCondition} => ${xdClass}`
      : "XD = not_applicable",
  };
}

function buildXsStep(
  input: ConcreteExposureClassInput,
  xsClass: ReturnType<typeof getXsClass>,
): ConcreteExposureClassReportStep {
  let formula = "XS = not_applicable";
  if (input.chlorideSource === "airborne_sea_salts") {
    formula = "XS = airborne_sea_salts => XS1";
  } else if (xsClass) {
    formula = `XS = f(chloride_moisture_condition) = ${input.chlorideMoistureCondition} => ${xsClass}`;
  }

  return {
    key: "xs-marine-chlorides",
    caption:
      "Визначення класу дії хлоридів морського походження XS (ДБН В.2.6-98:2009, класи впливу середовища; ДСТУ ENV 206:2018, група XS):",
    notes: [
      "Клас XS призначається, якщо конструкція зазнає дії морського середовища або хлоридів морського походження.",
      "Для конструкцій у зоні бризок або змінного зволоження приймається більш жорсткий клас, ніж для постійного занурення.",
    ],
    formula,
  };
}

function buildXfStep(
  input: ConcreteExposureClassInput,
  xfClass: ReturnType<typeof getXfClass>,
): ConcreteExposureClassReportStep {
  return {
    key: "xf-freeze-thaw",
    caption:
      "Визначення класу морозного впливу XF (ДБН В.2.6-98:2009, таблиця 4.1а; ДСТУ ENV 206:2018, група XF):",
    notes: [
      "Клас XF призначається, якщо конструкція зазнає циклів заморожування та відтавання.",
      "Наявність протиожеледних солей або морської води підвищує агресивність впливу.",
      "Клас XF не передається в калькулятор захисного шару як основний exposure_class, але формує додаткові вимоги до бетону.",
    ],
    formula: `XF = f(freeze_thaw_risk) = ${input.freezeThawRisk} => ${
      xfClass ?? "not_applicable"
    }`,
  };
}

function buildXaStep(
  input: ConcreteExposureClassInput,
  xaClass: ReturnType<typeof getXaClass>,
): ConcreteExposureClassReportStep {
  const notes = [
    "Клас XA призначається, якщо бетон контактує з хімічно агресивним ґрунтом, підземною водою, промисловими стоками або іншим агресивним середовищем.",
    "Остаточне призначення XA потребує даних аналізу ґрунту або води.",
    "Клас XA не передається в калькулятор захисного шару як основний exposure_class, але формує додаткові вимоги до бетону або спеціального захисту.",
  ];
  let result = "not_applicable";

  if (input.chemicalAttackRisk === "unknown_requires_analysis") {
    result = "warning";
    notes.push("XA не призначається остаточно.");
  } else if (xaClass) {
    result = CHEMICAL_ATTACK_LABELS[xaClass];
  }

  return {
    key: "xa-chemical-attack",
    caption:
      "Визначення класу хімічної агресії XA (ДБН В.2.6-98:2009, таблиця 4.1б; ДСТУ ENV 206:2018, група XA):",
    notes,
    formula: `XA = f(chemical_attack_risk; has_soil_or_groundwater_analysis) = ${input.chemicalAttackRisk}; ${input.hasSoilOrGroundwaterAnalysis} => ${result}`,
  };
}

function buildClassSetStep(
  classes: ExposureClass[],
  rawParts: string[],
): ConcreteExposureClassReportStep {
  return {
    key: "class-set",
    caption:
      "Формування повного набору класів впливу середовища (ДБН В.2.6-98:2009, розділ 4.3-4.4; ДСТУ ENV 206:2018, класи впливу середовища):",
    notes: [
      "Для одного елемента може бути призначено кілька класів впливу одночасно.",
      "Класи XF та XA залишаються у повному наборі класів і не повинні втрачатися після вибору класу для захисного шару.",
    ],
    formula: getClassSetFormula(classes, rawParts),
  };
}

function buildGoverningStep(
  classes: ExposureClass[],
  governingClass: CoverExposureClass | null,
): ConcreteExposureClassReportStep {
  const candidates = classes.filter(isCoverExposureClass);

  return {
    key: "governing-cover-class",
    caption:
      "Вибір керівного класу для розрахунку захисного шару (ДБН В.2.6-98:2009, п. 4.4.2.4.1, таблиця 4.3; п. 4.4.2.4.2, таблиця 4.4):",
    notes: [
      "Для визначення мінімального захисного шару за довговічністю використовується один клас із груп X0, XC, XD або XS.",
      "Якщо для елемента одночасно призначено кілька таких класів, для калькулятора захисного шару передається найбільш несприятливий клас.",
      "Класи XF та XA не використовуються як основний exposure_class для таблиці захисного шару, але залишаються додатковими вимогами.",
    ],
    formula: `governing_cover_exposure_class = max_rank(X0; XC; XD; XS) = max_rank([${formatClasses(
      candidates,
    )}]) = ${governingClass ?? "not_defined"}`,
  };
}

function buildAdditionalRequirementsStep(
  additionalDurabilityRequirements: string[],
): ConcreteExposureClassReportStep {
  return {
    key: "additional-requirements",
    caption:
      "Додаткові вимоги до довговічності (ДБН В.2.6-98:2009, таблиці 4.1а, 4.1б; ДСТУ ENV 206:2018, групи XF та XA):",
    notes: [
      "Класи XF та XA не повинні ігноруватися після вибору керівного класу для захисного шару.",
      "Вони формують додаткові вимоги до бетону, морозостійкості, водонепроникності, складу бетонної суміші або спеціального захисту конструкції.",
    ],
    formula: `additional_requirements = f(XF; XA) = [${additionalDurabilityRequirements.join(
      "; ",
    )}]`,
  };
}

function buildConclusionStep(
  classes: ExposureClass[],
  governingClass: CoverExposureClass | null,
): ConcreteExposureClassReportStep {
  return {
    key: "conclusion",
    caption:
      "Висновок щодо класу впливу середовища (ДБН В.2.6-98:2009, розділ 4.3-4.4; ДСТУ ENV 206:2018, класи впливу середовища):",
    notes: [
      "За результатами аналізу умов експлуатації визначено повний набір класів впливу середовища та керівний клас для подальшого розрахунку захисного шару бетону.",
    ],
    formula: `exposure_classes -> governing_cover_exposure_class = [${formatClasses(
      classes,
    )}] -> ${governingClass ?? "not_defined"}`,
  };
}

export function getConcreteExposureClassReport(
  input: ConcreteExposureClassInput,
): ConcreteExposureClassReport {
  const warnings: string[] = [];
  const errors: string[] = [];
  const rawParts: string[] = [];
  const classes: ExposureClass[] = [];

  const x0Class = getX0Class(input);
  const xcClass = getXcClass(input);
  const xdClass = getXdClass(input);
  const xsClass = getXsClass(input);
  const xfClass = getXfClass(input);
  const xaClass = getXaClass(input);

  addUnique(classes, x0Class);
  addUnique(classes, xcClass);
  addUnique(classes, xdClass);
  addUnique(classes, xsClass);
  addUnique(classes, xfClass);
  addUnique(classes, xaClass);

  for (const cls of [x0Class, xcClass, xdClass, xsClass, xfClass, xaClass]) {
    if (cls) rawParts.push(cls);
  }
  if (input.chemicalAttackRisk === "unknown_requires_analysis") {
    rawParts.push("XA_unknown");
    addUnique(warnings, XA_ANALYSIS_WARNING);
  }
  if (
    xaClass &&
    input.hasSoilOrGroundwaterAnalysis === false
  ) {
    addUnique(warnings, XA_USER_SELECTED_WARNING);
  }

  const exposureClasses = sortExposureClasses(classes);
  let governingCoverExposureClass =
    getGoverningCoverExposureClass(exposureClasses);

  if (
    governingCoverExposureClass === null &&
    input.reinforcementPresence === "plain_concrete_without_metal"
  ) {
    governingCoverExposureClass = "X0";
    addUnique(warnings, PLAIN_CONCRETE_X0_WARNING);
  }

  if (exposureClasses.length === 0) {
    errors.push(
      "Клас впливу середовища не визначено. Потрібно уточнити умови експлуатації.",
    );
  }

  if (
    governingCoverExposureClass === null &&
    input.reinforcementPresence === "reinforced_or_embedded_metal"
  ) {
    errors.push(REINFORCED_NO_COVER_ERROR);
  }

  const additionalDurabilityRequirements = buildAdditionalRequirements(
    exposureClasses,
    input,
  );
  const steps: ConcreteExposureClassReportStep[] = [
    buildInputStep(input),
    buildX0Step(x0Class),
    buildXcStep(input, xcClass),
    buildXdStep(input, xdClass),
    buildXsStep(input, xsClass),
    buildXfStep(input, xfClass),
    buildXaStep(input, xaClass),
    buildClassSetStep(exposureClasses, rawParts),
    buildGoverningStep(exposureClasses, governingCoverExposureClass),
    buildAdditionalRequirementsStep(additionalDurabilityRequirements),
    buildConclusionStep(exposureClasses, governingCoverExposureClass),
  ];

  return {
    input,
    valid: errors.length === 0 && governingCoverExposureClass !== null,
    errors,
    warnings,
    values: governingCoverExposureClass
      ? {
          exposureClasses,
          governingCoverExposureClass,
          additionalDurabilityRequirements,
        }
      : null,
    steps,
  };
}

export function getConcreteExposureClassReturnUrl({
  returnTo = "/calculator/concrete-cover-durability",
  returnField = "exposureClass",
  governingCoverExposureClass,
  exposureClasses,
}: {
  returnTo?: string;
  returnField?: string;
  governingCoverExposureClass: CoverExposureClass;
  exposureClasses: ExposureClass[];
}): string {
  const params = new URLSearchParams();
  params.set(returnField, governingCoverExposureClass);
  params.set("sourceExposureClasses", exposureClasses.join(","));
  params.set("sourceCalculator", "concrete-exposure-class");

  return `${returnTo}?${params.toString()}`;
}
