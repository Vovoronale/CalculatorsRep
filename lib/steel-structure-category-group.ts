import {
  STEEL_GRADE_STANDARD_OPTIONS,
  STEEL_STRUCTURE_SECTIONS,
  TABLE_G1_MATRIX,
  getSteelStructureEntry,
  steelGradeSupportsProductAndThickness,
  type ProductType,
  type PurposeCategory,
  type SteelStrengthClass,
  type SteelStructureId,
  type SteelStructureSectionId,
  type StressCategory,
  type Table51Profile,
} from "./steel-structure-category-group-data";
import { CALCULATOR_UNIT_REGISTRY } from "./calculator-units";

export type ResponsibilityClass = "CC1" | "CC2" | "CC3";
export type LoadType = "static" | "dynamic";
export type ServiceCondition = "heated" | "unheated" | "open_air";
export type GammaCMode = "automatic" | "table" | "manual";

export const GAMMA_C_TABLE_OPTIONS = [
  { id: "p1", position: "1", value: 0.9, label: "1 — Балки та стиснуті елементи ферм перекриттів — γc = 0,90" },
  { id: "p2", position: "2", value: 0.95, label: "2 — Колони громадських споруд і опор водонапірних башт — γc = 0,95" },
  { id: "p3", position: "3", value: 1.05, label: "3 — Колони одноповерхових виробничих споруд із мостовими кранами — γc = 1,05" },
  { id: "p4", position: "4", value: 0.8, label: "4 — Стиснуті основні елементи решітки зварних ферм — γc = 0,80" },
  { id: "p5", position: "5", value: 0.9, label: "5 — Затяжки, тяги, відтяжки та підвіски — γc = 0,90" },
  { id: "p6a", position: "6а", value: 1.1, label: "6а — Суцільні балки і колони, переріз послаблений отворами — γc = 1,10" },
  { id: "p6b", position: "6б", value: 1.05, label: "6б — Стрижневі конструкції покриттів та перекриттів, переріз послаблений отворами — γc = 1,05" },
  { id: "p7a-diagonal-a", position: "7а", value: 0.9, label: "7а — Розкоси за рисунком 13.3а — γc = 0,90" },
  { id: "p7a-strut", position: "7а", value: 0.9, label: "7а — Розпірки за рисунками 13.3б, 13.3в або 13.3е — γc = 0,90" },
  { id: "p7a-diagonal-vgde", position: "7а", value: 0.8, label: "7а — Розкоси за рисунками 13.3в, 13.3г, 13.3д або 13.3е — γc = 0,80" },
  { id: "p7b", position: "7б", value: 0.75, label: "7б — Кріплення одним болтом або через фасонку — γc = 0,75" },
  { id: "p8", position: "8", value: 0.75, label: "8 — Елементи плоских ферм і стиснуті елементи з одиночних кутиків — γc = 0,75" },
  { id: "p9a", position: "9а", value: 1.2, label: "9а — Опорні плити до 40 мм включно — γc = 1,20" },
  { id: "p9b", position: "9б", value: 1.15, label: "9б — Опорні плити понад 40 до 60 мм включно — γc = 1,15" },
  { id: "p9c", position: "9в", value: 1.1, label: "9в — Опорні плити понад 60 до 80 мм включно — γc = 1,10" },
  { id: "note5", position: "примітка 5", value: 1, label: "Примітка 5 — випадок не обумовлений нормами — γc = 1,00" },
] as const;

export type GammaCTableOptionId = (typeof GAMMA_C_TABLE_OPTIONS)[number]["id"];

export type Table51QualifierInput = {
  floorLocation?: string;
  floorElementType?: "solid_beam" | "compressed_truss_member" | "other";
  temporaryLoadNotAboveFloorWeight?: boolean;
  towerFacilityType?: "tower_cooling" | "fan_cooling" | "water_tower";
  isWaterTowerSupportElement?: boolean;
  tallOrPublicFacilityType?: "public" | "other_over_75m";
  isSingleStoreyIndustrialCraneColumn?: boolean;
  isPlateForSingleStoreyIndustrialCraneColumn?: boolean;
  isCompressedMainLatticeElement?: boolean;
  isWeldedRoofOrFloorTruss?: boolean;
  isBuiltUpTeeFromTwoAngles?: boolean;
  isStabilityCheck?: boolean;
  slendernessLambda?: number;
  isStrengthCheck?: boolean;
  isUnweakenedSection?: boolean;
  position6MemberType?: "solid_beam" | "solid_column" | "roof_bar" | "floor_bar" | "other";
  hasBoltHoles?: boolean;
  isFrictionConnection?: boolean;
  isCompressedSpaceLatticeMember?: boolean;
  position7Profile?: "equal_angle" | "unequal_angle" | "other";
  unequalAngleAttachedByLargerLeg?: boolean;
  position7Connection?: "welded" | "two_plus_bolts" | "one_bolt" | "gusset" | "other";
  position7FigureCase?: "diagonal_a" | "strut_bve" | "diagonal_vgde";
  position8Case?: "flat_truss_angle" | "other_compressed_angle" | "none";
  angleAttachedByOneLeg?: boolean;
  unequalAngleAttachedBySmallerLeg?: boolean;
  isSupportPlate?: boolean;
};

export type SteelStructureCategoryGroupInput = {
  sectionId: SteelStructureSectionId;
  structureId: SteelStructureId;
  responsibilityClass: ResponsibilityClass;
  loadType: LoadType;
  hasTensileStress: boolean;
  hasAdverseWeldEffect: boolean;
  serviceCondition: ServiceCondition;
  productType: ProductType;
  steelClass: SteelStrengthClass;
  steelGradeStandardId: string;
  thicknessMm: number;
  sigmaDynKpa?: number;
  sigmaSumKpa?: number;
  sigmaCKpa?: number;
  hasGuillotineEdges: boolean;
  hasUnaccountedColdWork: boolean;
  hasHighInitialStress: boolean;
  gammaCMode: GammaCMode;
  gammaCTableOptionId: GammaCTableOptionId;
  gammaCManual: number;
  table51: Table51QualifierInput;
  displayUnits: {
    thickness: string;
    sigmaDyn: string;
    sigmaSum: string;
    sigmaC: string;
  };
};

export type SteelStructureCategoryGroupReportStep = {
  key: string;
  caption: string;
  items?: string[];
  notes?: string[];
  formula?: string;
  formulas?: string[];
  resultItems?: string[];
};

export type SteelStructureCategoryGroupValues = {
  purposeCategory: PurposeCategory;
  stressCategoryBase: StressCategory;
  stressCategoryA2: StressCategory;
  scores: { s1: number; s2: number; s3Base: number; s4: number; s5: number };
  totalBase: number;
  groupBase: 1 | 2 | 3 | 4;
  rynMpa: number;
  gammaM: number;
  ryMpa: number;
  gammaC: number;
  alpha: number | null;
  adjustments: {
    stressCategory: number;
    thickness: number;
    guillotine: number;
    coldWork: number;
    initialStress: number;
    positive: number;
    compression: number;
    raw: number;
    applied: number;
  };
  totalA2: number;
  groupA2: 1 | 2 | 3 | 4;
  steelAllowed: boolean;
};

export type SteelStructureCategoryGroupReport = {
  input: SteelStructureCategoryGroupInput;
  valid: boolean;
  errors: string[];
  warnings: string[];
  values: SteelStructureCategoryGroupValues | null;
  steps: SteelStructureCategoryGroupReportStep[];
};

export const DEFAULT_STEEL_STRUCTURE_CATEGORY_GROUP_INPUT: SteelStructureCategoryGroupInput = {
  sectionId: "a1-section-03",
  structureId: "a1-03-03",
  responsibilityClass: "CC2",
  loadType: "static",
  hasTensileStress: true,
  hasAdverseWeldEffect: false,
  serviceCondition: "heated",
  productType: "section",
  steelClass: "С245",
  steelGradeStandardId: "c245-01",
  thicknessMm: 10,
  sigmaSumKpa: 100_000,
  sigmaCKpa: 100_000,
  hasGuillotineEdges: false,
  hasUnaccountedColdWork: false,
  hasHighInitialStress: false,
  gammaCMode: "automatic",
  gammaCTableOptionId: "note5",
  gammaCManual: 1,
  table51: {
    position6MemberType: "solid_beam",
    isStrengthCheck: true,
    hasBoltHoles: false,
    isFrictionConnection: false,
  },
  displayUnits: {
    thickness: "mm",
    sigmaDyn: "mpa",
    sigmaSum: "mpa",
    sigmaC: "mpa",
  },
};

const S3_SCORE: Record<StressCategory, number> = { I: 8, II: 5, III: 1 };

export function groupForTotal(total: number): 1 | 2 | 3 | 4 {
  if (total > 26) return 1;
  if (total >= 23) return 2;
  if (total >= 19) return 3;
  return 4;
}

function format(value: number, digits = 4): string {
  const rounded = Number.isInteger(value) ? String(value) : String(Number(value.toFixed(digits)));
  return rounded.replace(".", ",");
}

export function formatScoreForReport(value: number): string {
  const absolute = Math.abs(value);
  const lastTwo = absolute % 100;
  const last = absolute % 10;
  const noun = lastTwo >= 11 && lastTwo <= 14
    ? "балів"
    : last === 1
      ? "бал"
      : last >= 2 && last <= 4
        ? "бали"
        : "балів";
  return `${format(value)} ${noun}`;
}

function displayValue(valueInBase: number, quantity: "pressure" | "thickness", unitId: string) {
  const unit = CALCULATOR_UNIT_REGISTRY[quantity].units.find((item) => item.value === unitId)
    ?? CALCULATOR_UNIT_REGISTRY[quantity].units[0];
  return { value: valueInBase / unit.factorToBase, label: unit.label };
}

function strengthValue(steelClass: SteelStrengthClass): number {
  return Number.parseInt(steelClass.replace(/\D/g, ""), 10);
}

function stressCategoryForAlpha(alpha: number): StressCategory {
  if (alpha >= 0.5) return "I";
  if (alpha > 0.2) return "II";
  return "III";
}

type ProfileValue = { profile: Table51Profile; value: number; source: string };

function evaluateProfile(
  profile: Table51Profile,
  input: SteelStructureCategoryGroupInput,
  rynMpa: number,
): ProfileValue | null {
  const q = input.table51;
  switch (profile) {
    case "default":
      return null;
    case "p1":
      return q.floorLocation &&
        q.floorLocation !== "other" &&
        (q.floorElementType === "solid_beam" || q.floorElementType === "compressed_truss_member") &&
        q.temporaryLoadNotAboveFloorWeight
        ? { profile, value: 0.9, source: "1" }
        : null;
    case "p2":
      return (q.tallOrPublicFacilityType === "public" ||
        (q.towerFacilityType === "water_tower" && q.isWaterTowerSupportElement))
        ? { profile, value: 0.95, source: "2" }
        : null;
    case "p3":
      return q.isSingleStoreyIndustrialCraneColumn || q.isPlateForSingleStoreyIndustrialCraneColumn
        ? { profile, value: 1.05, source: "3" }
        : null;
    case "p4":
      return q.isCompressedMainLatticeElement &&
        q.isWeldedRoofOrFloorTruss &&
        q.isBuiltUpTeeFromTwoAngles &&
        q.isStabilityCheck &&
        Number.isFinite(q.slendernessLambda) &&
        (q.slendernessLambda ?? 0) >= 60
        ? { profile, value: 0.8, source: "4" }
        : null;
    case "p5":
      return q.isStrengthCheck && q.isUnweakenedSection
        ? { profile, value: 0.9, source: "5" }
        : null;
    case "p6a":
    case "p6b":
      return input.loadType === "static" &&
        rynMpa <= 440 &&
        q.isStrengthCheck &&
        q.hasBoltHoles &&
        !q.isFrictionConnection
        ? { profile, value: profile === "p6a" ? 1.1 : 1.05, source: "6" }
        : null;
    case "p7": {
      if (!q.isCompressedSpaceLatticeMember || q.position7Profile === "other") return null;
      if (q.position7Profile === "unequal_angle" && !q.unequalAngleAttachedByLargerLeg) return null;
      if (q.position7Connection === "one_bolt" || q.position7Connection === "gusset") {
        return { profile, value: 0.75, source: "7б" };
      }
      if (q.position7Connection === "welded" || q.position7Connection === "two_plus_bolts") {
        if (q.position7FigureCase === "diagonal_vgde") return { profile, value: 0.8, source: "7а" };
        if (q.position7FigureCase) return { profile, value: 0.9, source: "7а" };
      }
      return null;
    }
    case "p8":
      return q.position8Case &&
        q.position8Case !== "none" &&
        q.angleAttachedByOneLeg &&
        !evaluateProfile("p7", input, rynMpa)
        ? { profile, value: 0.75, source: "8" }
        : null;
    case "p9":
      if (!(q.isSupportPlate || input.structureId === "a1-04-04" || input.structureId === "a1-11-07")) return null;
      if (input.loadType !== "static" || rynMpa > 390 || input.thicknessMm > 80) return null;
      return {
        profile,
        value: input.thicknessMm <= 40 ? 1.2 : input.thicknessMm <= 60 ? 1.15 : 1.1,
        source: "9",
      };
  }
}

function resolveGammaC(
  profiles: Table51Profile[],
  input: SteelStructureCategoryGroupInput,
  rynMpa: number,
): { value: number; applicable: ProfileValue[]; selectedTableOption?: (typeof GAMMA_C_TABLE_OPTIONS)[number] } {
  if (input.gammaCMode === "manual") {
    return { value: Number.isFinite(input.gammaCManual) && input.gammaCManual > 0 ? input.gammaCManual : 1, applicable: [] };
  }
  if (input.gammaCMode === "table") {
    const selectedTableOption = GAMMA_C_TABLE_OPTIONS.find((option) => option.id === input.gammaCTableOptionId)
      ?? GAMMA_C_TABLE_OPTIONS[GAMMA_C_TABLE_OPTIONS.length - 1];
    return { value: selectedTableOption.value, applicable: [], selectedTableOption };
  }
  const applicable = profiles
    .map((profile) => evaluateProfile(profile, input, rynMpa))
    .filter((result): result is ProfileValue => Boolean(result));
  if (applicable.length === 0) return { value: 1, applicable };

  const candidates = applicable.map((item) => item.value);
  for (const high of applicable.filter((item) => item.profile === "p6a" || item.profile === "p6b")) {
    for (const low of applicable.filter((item) => ["p1", "p2", "p5"].includes(item.profile))) {
      candidates.push(high.value * low.value);
    }
  }
  for (const plate of applicable.filter((item) => item.profile === "p9")) {
    for (const other of applicable.filter((item) => item.profile === "p2" || item.profile === "p3")) {
      candidates.push(plate.value * other.value);
    }
  }
  return { value: Math.min(...candidates), applicable };
}

function describeGammaProfile(
  result: ProfileValue,
  input: SteelStructureCategoryGroupInput,
): string {
  switch (result.profile) {
    case "p1":
      return "балка або стиснутий елемент ферми перекриття; тимчасове навантаження не перевищує вагу перекриття";
    case "p2":
      return "колона громадської споруди або опорний елемент водонапірної башти";
    case "p3":
      return "колона одноповерхової виробничої споруди з мостовим краном";
    case "p4":
      return "стиснутий основний елемент решітки зварної ферми зі складеним тавровим перерізом при перевірці стійкості та λ ≥ 60";
    case "p5":
      return "затяжка, тяга, відтяжка або підвіска з непослабленим перерізом при перевірці міцності";
    case "p6a":
      return "суцільна балка або колона при статичному навантаженні; переріз послаблений отворами для болтів; з’єднання не є фрикційним";
    case "p6b":
      return "стрижнева конструкція покриття або перекриття при статичному навантаженні; переріз послаблений отворами для болтів; з’єднання не є фрикційним";
    case "p7":
      return "стиснутий елемент просторової решітчастої конструкції з обраним профілем і способом приєднання";
    case "p8":
      return "елемент плоскої ферми або інший стиснутий елемент з одиночного кутика, прикріпленого однією полицею";
    case "p9":
      return `опорна плита завтовшки ${format(input.thicknessMm)} мм при статичному навантаженні`;
    default:
      return "спеціальні умови таблиці 5.1 не встановлені";
  }
}

function buildGammaReportItems(
  entryLabel: string,
  input: SteelStructureCategoryGroupInput,
  gammaResult: ReturnType<typeof resolveGammaC>,
): string[] {
  if (input.gammaCMode === "manual") {
    return [
      `Прийнято користувачем γ_c = ${format(gammaResult.value, 3)}. Нормативну застосовність значення користувач перевіряє самостійно.`,
    ];
  }
  if (input.gammaCMode === "table") {
    return [
      `За обраною позицією ${gammaResult.selectedTableOption?.position} таблиці 5.1 прийнято γ_c = ${format(gammaResult.value, 3)}. Застосовність цієї позиції перевіряє користувач.`,
    ];
  }
  if (gammaResult.applicable.length === 0) {
    if (input.structureId === "a1-03-03") {
      return [
        "Для головних балок при статичному навантаженні спеціальні значення коефіцієнта умов роботи за таблицею 5.1 не застосовуються. Відповідно до примітки 5 прийнято γ_c = 1,0.",
      ];
    }
    return [
      `Для конструкції «${entryLabel}» спеціальні значення коефіцієнта умов роботи за таблицею 5.1 не застосовуються. Відповідно до примітки 5 прийнято γ_c = 1,0.`,
    ];
  }

  const facts = gammaResult.applicable
    .map((result) => describeGammaProfile(result, input))
    .join("; ");
  const positions = gammaResult.applicable.map((result) => result.source).join(", ");
  return [
    `Для конструкції «${entryLabel}» встановлено такі визначальні ознаки: ${facts}. За позицією ${positions} таблиці 5.1 прийнято γ_c = ${format(gammaResult.value, 3)}.`,
  ];
}

type SteelCompatibilityAssessment = {
  allowed: boolean;
  cell: string;
  reference: string;
  note: string;
};

function assessSteelCompatibility(
  steelClass: SteelStrengthClass,
  group: 1 | 2 | 3 | 4,
  input: SteelStructureCategoryGroupInput,
): SteelCompatibilityAssessment {
  const specialNetwork = input.sectionId === "a1-section-09" || input.sectionId === "a1-section-16";
  if (steelClass === "С235" && input.thicknessMm <= 5 && !specialNetwork) {
    return { allowed: true, cell: "примітка 3", reference: "примітка 3 для сталі С235 завтовшки до 5 мм", note: "Застосовано примітку 3." };
  }
  if (steelClass === "С245" && group === 1 && input.thicknessMm <= 8) {
    return { allowed: true, cell: "примітка 3", reference: "примітка 3 для сталі С245 завтовшки до 8 мм", note: "Застосовано примітку 3." };
  }
  const cell = TABLE_G1_MATRIX[steelClass][group - 1];
  const reference = `рядок ${steelClass}, графа групи ${group}`;
  if (cell === "+") return { allowed: true, cell, reference, note: "Примітки не застосовуються." };
  if (cell === "+a") {
    return { allowed: input.serviceCondition === "heated" && !specialNetwork, cell, reference, note: "Перевірено примітку а." };
  }
  if (cell === "+b") {
    return { allowed: input.serviceCondition === "heated" || input.thicknessMm <= 10, cell, reference, note: "Перевірено примітку б." };
  }
  return { allowed: false, cell, reference, note: "Дозвільна примітка не застосовується." };
}

export function getSteelStructureCategoryGroupReport(
  input: SteelStructureCategoryGroupInput,
): SteelStructureCategoryGroupReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const entry = getSteelStructureEntry(input.structureId);
  const section = STEEL_STRUCTURE_SECTIONS.find((item) => item.id === input.sectionId);

  if (!entry || entry.sectionId !== input.sectionId) {
    errors.push("Вибрана конструкція або елемент не належить вибраному розділу таблиці А.1.");
  }
  if (!Number.isFinite(input.thicknessMm) || input.thicknessMm <= 0) {
    errors.push("Товщина прокату t має бути більше 0.");
  }
  if (input.hasTensileStress && (!Number.isFinite(input.sigmaSumKpa) || (input.sigmaSumKpa ?? 0) <= 0)) {
    errors.push("Для визначення α найбільше сумарне розтягувальне напруження σsum має бути більшим за нуль.");
  }
  if (input.loadType === "dynamic" && input.hasTensileStress) {
    if (!Number.isFinite(input.sigmaDynKpa) || (input.sigmaDynKpa ?? -1) < 0) {
      errors.push("Напруження σdyn має бути невід’ємним значенням.");
    } else if ((input.sigmaDynKpa ?? 0) > (input.sigmaSumKpa ?? 0)) {
      errors.push("Напруження σdyn не може перевищувати σsum, оскільки динамічна складова входить до сумарного розтягувального напруження від усіх навантажень.");
    }
  }
  if (input.loadType === "static" && (!Number.isFinite(input.sigmaCKpa) || (input.sigmaCKpa ?? -1) < 0)) {
    errors.push("Нормальне напруження стиску σc має бути невід’ємним значенням.");
  }
  if (input.gammaCMode === "manual" && (!Number.isFinite(input.gammaCManual) || input.gammaCManual <= 0)) {
    errors.push("Коефіцієнт умов роботи γ_c у ручному режимі має бути більше 0.");
  }

  const loadLabel = input.loadType === "static" ? "Статичне" : "Динамічне";
  const serviceConditionLabel = {
    heated: "Опалювана споруда",
    unheated: "Неопалювана споруда",
    open_air: "Конструкція на відкритому повітрі",
  }[input.serviceCondition];
  const productTypeLabel = {
    section: "Фасонний",
    long: "Сортовий",
    sheet: "Листовий",
    universal_plate: "Широкосмуговий універсальний",
    cold_formed: "Холодногнутий профіль",
  }[input.productType];
  const visibleInputItems = [
    `Розділ таблиці А.1: ${section?.title ?? input.sectionId}`,
    `Конструкція або елемент: ${entry?.label ?? input.structureId}`,
    `Клас відповідальності: ${input.responsibilityClass.replace("CC", "СС")}`,
    `Характер навантаження: ${loadLabel}`,
  ];
  const steps: SteelStructureCategoryGroupReportStep[] = [
    {
      key: "inputs",
      caption: "Вихідні дані для визначення категорій і групи конструкції згідно з таблицею 5.1, таблицями 7.1 і 7.2, таблицями А.1 і А.2 Додатка А та таблицями Г.1 і Г.5 Додатка Г ДБН В.2.6-198:2014:",
      items: visibleInputItems,
    },
  ];

  if (!entry || errors.some((error) => error.startsWith("Товщина"))) {
    return { input, valid: false, errors, warnings, values: null, steps };
  }

  const s1 = input.responsibilityClass === "CC3" ? 4 : 0;
  const s2 = { А: 11, Б: 4, В: 1 }[entry.purposeCategory];
  const s3Base = S3_SCORE[entry.stressCategory];
  const s4 = input.hasTensileStress ? 7 : 2;
  const s5 = input.hasAdverseWeldEffect ? 6 : 2;
  const totalBase = s1 + s2 + s3Base + s4 + s5;
  const groupBase = groupForTotal(totalBase);
  const grade = STEEL_GRADE_STANDARD_OPTIONS.find((option) => option.id === input.steelGradeStandardId);
  if (!grade || grade.steelClass !== input.steelClass || !steelGradeSupportsProductAndThickness(grade, input.productType, input.thicknessMm)) {
    errors.push("Вибрана марка сталі не відповідає класу міцності, виду або товщині прокату за таблицею Г.5 ДБН В.2.6-198:2014.");
  }
  const rynMpa = strengthValue(input.steelClass);
  const gammaM = grade
    ? input.productType === "long" && rynMpa > 380 && grade.label.includes("ДСТУ 8541")
      ? 1.1
      : grade.gammaM
    : 1.05;
  const ryMpa = rynMpa / gammaM;
  const gammaResult = resolveGammaC(entry.table51Profiles, input, rynMpa);
  if (input.gammaCMode === "automatic" && entry.table51Profiles.includes("p9") && input.thicknessMm > 80) {
    warnings.push("Для опорної плити завтовшки понад 80 мм таблиця 5.1 не встановлює значення γc у позиції 9; застосовність коефіцієнта потрібно обґрунтувати окремо.");
  }

  let alpha: number | null = null;
  let stressCategoryA2 = entry.stressCategory;
  if (input.hasTensileStress && (input.sigmaSumKpa ?? 0) > 0) {
    alpha = input.loadType === "static" ? 0 : (input.sigmaDynKpa ?? 0) / (input.sigmaSumKpa ?? 1);
    stressCategoryA2 = stressCategoryForAlpha(alpha);
  }
  const stressAdjustment = S3_SCORE[stressCategoryA2] - s3Base;
  const thicknessAdjustment = input.thicknessMm <= 20 ? 0 : input.thicknessMm <= 40 ? 1 : 2;
  const guillotine = input.hasGuillotineEdges ? 1 : 0;
  const coldWork = input.hasUnaccountedColdWork ? 1 : 0;
  const initialStress = input.hasHighInitialStress ? 1 : 0;
  const positive = thicknessAdjustment + guillotine + coldWork + initialStress;
  const sigmaLimitKpa = 0.4 * ryMpa * 1000 * gammaResult.value;
  const compressionApplicable = input.loadType === "static" && !input.hasTensileStress;
  const compressionPasses = compressionApplicable &&
    (input.sigmaCKpa ?? Number.POSITIVE_INFINITY) <= sigmaLimitKpa;
  const compression = compressionPasses ? -4 : 0;
  const raw = stressAdjustment + positive + compression;
  const applied = Math.max(-4, Math.min(4, raw));
  const totalA2 = totalBase + applied;
  const groupA2 = groupForTotal(totalA2);
  const steelCompatibility = assessSteelCompatibility(input.steelClass, groupA2, input);
  const isSteelAllowed = steelCompatibility.allowed;
  if (!isSteelAllowed) {
    errors.push(`Вибраний клас сталі ${input.steelClass} не допускається для групи ${groupA2} за таблицею Г.1 ДБН В.2.6-198:2014 з урахуванням заданих умов експлуатації та товщини прокату.`);
  }

  const thicknessDisplay = displayValue(input.thicknessMm, "thickness", input.displayUnits.thickness);
  const ryDisplay = displayValue(ryMpa * 1000, "pressure", input.displayUnits.sigmaC);
  const sigmaLimitDisplay = displayValue(sigmaLimitKpa, "pressure", input.displayUnits.sigmaC);
  const sigmaCDisplay = displayValue(input.sigmaCKpa ?? 0, "pressure", input.displayUnits.sigmaC);
  const sigmaDynDisplay = displayValue(input.sigmaDynKpa ?? 0, "pressure", input.displayUnits.sigmaDyn);
  const sigmaSumDisplay = displayValue(input.sigmaSumKpa ?? 0, "pressure", input.displayUnits.sigmaSum);

  steps[0].items = [
    `Розділ таблиці А.1: ${section?.title ?? input.sectionId}`,
    `Конструкція або елемент: ${entry.label}`,
    `Клас відповідальності: ${input.responsibilityClass.replace("CC", "СС")}`,
    `Характер навантаження: ${loadLabel}`,
    `Наявність розтягувальних напружень: ${input.hasTensileStress ? "Так" : "Ні"}`,
    `Несприятливий вплив зварних з’єднань: ${input.hasAdverseWeldEffect ? "Так" : "Ні"}`,
    `Умови експлуатації: ${serviceConditionLabel}`,
    `Вид прокату: ${productTypeLabel}`,
    `Клас міцності сталі: ${input.steelClass}`,
    `Марка сталі та нормативний документ: ${grade?.label ?? input.steelGradeStandardId}`,
    `Товщина прокату t: ${format(thicknessDisplay.value)} ${thicknessDisplay.label}`,
    ...(input.loadType === "dynamic" && input.hasTensileStress ? [`σ_dyn: ${format(sigmaDynDisplay.value)} ${sigmaDynDisplay.label}`] : []),
    ...(input.hasTensileStress ? [`σ_sum: ${format(sigmaSumDisplay.value)} ${sigmaSumDisplay.label}`] : []),
    ...(input.loadType === "static" ? [`σ_c: ${format(sigmaCDisplay.value)} ${sigmaCDisplay.label}`] : []),
    `Кромки після гільйотинного різання: ${input.hasGuillotineEdges ? "Так" : "Ні"}`,
    `Неврахований наклеп від деформування в холодному стані: ${input.hasUnaccountedColdWork ? "Так" : "Ні"}`,
    `Високі початкові напруження, у тому числі зварювальні: ${input.hasHighInitialStress ? "Так" : "Ні"}`,
  ];

  steps.push(
    {
      key: "categories-a1",
      caption: `Визначення категорій конструкції за призначенням і за напруженим станом згідно з позицією ${entry.sourcePosition} таблиці А.1 Додатка А ДБН В.2.6-198:2014:`,
      resultItems: [`За таблицею А.1 конструкцію «${entry.label}» віднесено до категорії ${entry.purposeCategory} за призначенням і категорії ${entry.stressCategory} за напруженим станом.`],
      ...(entry.id === "a1-01-14" || entry.id === "a1-01-15"
        ? { notes: ["У наданому тексті позиції 1в ручні талі і кран-балки перетинаються у рядках Б/I та Б/II. За погодженим виправленням їх віднесено до категорій Б/II."] }
        : {}),
    },
    {
      key: "scores-a2",
      caption: "Визначення показників окремих чинників S_1–S_5 згідно з таблицею А.2 Додатка А ДБН В.2.6-198:2014:",
      items: [
        `S_1 = ${formatScoreForReport(s1)} — клас відповідальності ${input.responsibilityClass.replace("CC", "СС")}.`,
        `S_2 = ${formatScoreForReport(s2)} — категорія за призначенням ${entry.purposeCategory}.`,
        `S_3,base = ${formatScoreForReport(s3Base)} — категорія за напруженим станом ${entry.stressCategory}.`,
        `S_4 = ${formatScoreForReport(s4)} — розтягувальні напруження ${input.hasTensileStress ? "є" : "немає"}.`,
        `S_5 = ${formatScoreForReport(s5)} — несприятливий вплив зварних з’єднань ${input.hasAdverseWeldEffect ? "є" : "немає"}.`,
      ],
    },
    {
      key: "base-group",
      caption: "Визначення початкового показника та групи конструкції згідно з пунктом А.1 Додатка А ДБН В.2.6-198:2014:",
      formulas: [`S_tot,base = S_1 + S_2 + S_3,base + S_4 + S_5 = ${s1} + ${s2} + ${s3Base} + ${s4} + ${s5} = ${formatScoreForReport(totalBase)}`],
      resultItems: [`Початкова група: ${groupBase}; S_tot,base = ${formatScoreForReport(totalBase)}.`],
    },
    {
      key: "steel-resistance",
      caption: "Визначення розрахункового опору сталі R_y за границею текучості згідно з пунктом 7.1, таблицями 7.1 і 7.2 та таблицею Г.5 Додатка Г ДБН В.2.6-198:2014:",
      items: [`Клас міцності сталі: ${input.steelClass}`, `Марка сталі та нормативний документ: ${grade?.label ?? input.steelGradeStandardId}`, `Характеристичний опір за класом міцності: R_yn = ${rynMpa} МПа`, `Коефіцієнт надійності за матеріалом за відповідним рядком таблиці 7.2: γ_m = ${format(gammaM, 3)}`],
      formula: `R_y = R_yn / γ_m = ${rynMpa} / ${format(gammaM, 3)} = ${format(ryMpa, 2)} МПа${input.displayUnits.sigmaC !== "mpa" ? ` = ${format(ryDisplay.value, 2)} ${ryDisplay.label}` : ""}`,
    },
    {
      key: "gamma-c",
      caption: "Визначення коефіцієнта умов роботи γ_c з урахуванням ознак конструкції згідно з пунктом 5.4.1, таблицею 5.1 та примітками 1–5 ДБН В.2.6-198:2014:",
      items: buildGammaReportItems(entry.label, input, gammaResult),
    },
    {
      key: "stress-category-a2",
      caption: "Уточнення категорії конструкції за напруженим станом після підбору перерізу за співвідношенням динамічної та сумарної складових розтягувального напруження згідно з першим абзацом пункту А.2 Додатка А ДБН В.2.6-198:2014:",
      items: alpha === null
        ? ["Розтягувальні напруження відсутні, тому α не визначається."]
        : [
            "σ_dyn — найбільший модуль нормального розтягувального напруження від динамічної складової навантаження.",
            "σ_sum — найбільший модуль сумарного нормального розтягувального напруження від усіх розрахункових навантажень у тій самій точці перерізу.",
            ...(input.loadType === "static" ? ["Для статичного навантаження динамічна складова відсутня, тому прийнято σ_dyn = 0 МПа."] : []),
          ],
      ...(alpha === null ? {} : { formulas: [`α = |σ_dyn| / |σ_sum| = ${format(sigmaDynDisplay.value)} / ${format(sigmaSumDisplay.value)} = ${format(alpha)}`] }),
      resultItems: alpha === null
        ? [`Категорія за напруженим станом не уточнюється; прийнято S_3,A2 = S_3,base = ${formatScoreForReport(s3Base)}.`]
        : [`За α = ${format(alpha)} конструкцію віднесено до категорії ${stressCategoryA2} за напруженим станом; прийнято S_3,A2 = ${formatScoreForReport(S3_SCORE[stressCategoryA2])}.`],
    },
    {
      key: "positive-adjustments",
      caption: "Визначення додатних поправок до показника групи після підбору перерізу за товщиною прокату та технологічними чинниками згідно з другим абзацом пункту А.2 Додатка А ДБН В.2.6-198:2014:",
      items: [
        `ΔS_t = ${formatScoreForReport(thicknessAdjustment)} — поправка за товщиною прокату t = ${format(input.thicknessMm)} мм.`,
        `ΔS_guillotine = ${formatScoreForReport(guillotine)} — поправка за наявністю кромок після гільйотинного різання.`,
        `ΔS_cold = ${formatScoreForReport(coldWork)} — поправка за неврахованим наклепом.`,
        `ΔS_initial = ${formatScoreForReport(initialStress)} — поправка за високими початковими напруженнями.`,
      ],
      formulas: [`ΔS_+ = ΔS_t + ΔS_guillotine + ΔS_cold + ΔS_initial = ${thicknessAdjustment} + ${guillotine} + ${coldWork} + ${initialStress} = ${formatScoreForReport(positive)}`],
    },
    {
      key: "compression-adjustment",
      caption: "Перевірка умови зменшення показника групи при статичному стиску з попередньою перевіркою відсутності розтягувальних напружень згідно з третім абзацом пункту А.2 Додатка А ДБН В.2.6-198:2014:",
      ...(input.hasTensileStress
        ? { resultItems: ["Зменшення показника для статичного стиску не застосовується, оскільки в конструкції наявні розтягувальні напруження. Прийнято ΔS_compression = 0 балів."] }
        : input.loadType === "dynamic"
          ? { resultItems: ["Зменшення показника для статичного стиску не застосовується при динамічному навантаженні. Прийнято ΔS_compression = 0 балів."] }
          : {
              items: ["σ_c — модуль нормального напруження стиску, визначений з урахуванням коефіцієнтів φ, φ_e і φ_b."],
              formulas: [
                `σ_limit = 0,4 * R_y * γ_c = 0,4 * ${format(ryDisplay.value, 2)} * ${format(gammaResult.value, 3)} = ${format(sigmaLimitDisplay.value, 2)} ${sigmaLimitDisplay.label}`,
                `σ_c = ${format(sigmaCDisplay.value)} ${sigmaCDisplay.label} ${compressionPasses ? "≤" : ">"} σ_limit = ${format(sigmaLimitDisplay.value, 2)} ${sigmaLimitDisplay.label}`,
              ],
              resultItems: [`Умову зменшення показника групи при статичному стиску ${compressionPasses ? "виконано" : "не виконано"}; прийнято ΔS_compression = ${formatScoreForReport(compression)}.`],
            }),
    },
    {
      key: "refined-group",
      caption: "Уточнення показника та групи конструкції після підбору перерізу з обмеженням сумарної зміни від −4 до +4 балів згідно з пунктом А.2 Додатка А ДБН В.2.6-198:2014:",
      formulas: [
        `ΔS_3 = S_3,A2 - S_3,base = ${S3_SCORE[stressCategoryA2]} - ${s3Base} = ${formatScoreForReport(stressAdjustment)}`,
        `ΔS_raw = ΔS_3 + ΔS_+ + ΔS_compression = ${stressAdjustment} + ${positive} + ${compression} = ${formatScoreForReport(raw)}`,
        `Відповідно до пункту А.2 сумарна зміна показника приймається в межах від −4 до +4 балів. Оскільки розрахункове значення ΔS_raw = ${raw}, прийнято ΔS = ${formatScoreForReport(applied)}.`,
        `S_tot,A2 = S_tot,base + ΔS = ${totalBase} + ${applied} = ${formatScoreForReport(totalA2)}`,
      ],
      resultItems: [`Уточнена група: ${groupA2}; S_tot,A2 = ${formatScoreForReport(totalA2)}.`],
    },
    {
      key: "steel-compatibility",
      caption: `Перевірка застосування вибраної сталі за уточненою групою, видом і товщиною прокату та умовами експлуатації згідно з таблицею Г.1 Додатка Г ДБН В.2.6-198:2014, ${steelCompatibility.reference}:`,
      items: [
        `Уточнена група конструкції: ${groupA2}`,
        `Вид прокату: ${productTypeLabel}`,
        `Клас міцності сталі: ${input.steelClass}`,
        `Товщина прокату: ${format(thicknessDisplay.value)} ${thicknessDisplay.label}.`,
        `Умови експлуатації: ${serviceConditionLabel}`,
        `Комірка таблиці Г.1: ${steelCompatibility.cell} (${steelCompatibility.reference})`,
        steelCompatibility.note,
      ],
      resultItems: [`Перевірено рядок таблиці Г.1 для сталі ${input.steelClass}, групи ${groupA2}, виду прокату ${productTypeLabel}, товщини ${format(thicknessDisplay.value)} ${thicknessDisplay.label} та умов експлуатації «${serviceConditionLabel}». Застосування сталі ${input.steelClass} ${isSteelAllowed ? "допускається" : "не допускається"}.`],
    },
    {
      key: "conclusion",
      caption: "Висновок щодо категорій, групи конструкції та застосовності сталі згідно з пунктами А.1 і А.2 Додатка А та таблицею Г.1 Додатка Г ДБН В.2.6-198:2014:",
      items: [
        `Конструкція або елемент: ${entry.label}`,
        `Категорії за таблицею А.1: ${entry.purposeCategory}/${entry.stressCategory}`,
        `Початкова група: ${groupBase}; S_tot,base = ${formatScoreForReport(totalBase)}.`,
        `Уточнена група: ${groupA2}; S_tot,A2 = ${formatScoreForReport(totalA2)}.`,
        `Застосування сталі ${input.steelClass} ${isSteelAllowed ? "допускається" : "не допускається"} за таблицею Г.1.`,
      ],
    },
  );

  const values: SteelStructureCategoryGroupValues = {
    purposeCategory: entry.purposeCategory,
    stressCategoryBase: entry.stressCategory,
    stressCategoryA2,
    scores: { s1, s2, s3Base, s4, s5 },
    totalBase,
    groupBase,
    rynMpa,
    gammaM,
    ryMpa,
    gammaC: gammaResult.value,
    alpha,
    adjustments: { stressCategory: stressAdjustment, thickness: thicknessAdjustment, guillotine, coldWork, initialStress, positive, compression, raw, applied },
    totalA2,
    groupA2,
    steelAllowed: isSteelAllowed,
  };

  return { input, valid: errors.length === 0, errors, warnings, values, steps };
}
