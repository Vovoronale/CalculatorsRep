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
  return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(digits)));
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

function steelAllowed(
  steelClass: SteelStrengthClass,
  group: 1 | 2 | 3 | 4,
  input: SteelStructureCategoryGroupInput,
): boolean {
  const specialNetwork = input.sectionId === "a1-section-09" || input.sectionId === "a1-section-16";
  if (steelClass === "С235" && input.thicknessMm <= 5 && !specialNetwork) return true;
  if (steelClass === "С245" && group === 1 && input.thicknessMm <= 8) return true;
  const cell = TABLE_G1_MATRIX[steelClass][group - 1];
  if (cell === "+") return true;
  if (cell === "+a") return input.serviceCondition === "heated" && !specialNetwork;
  if (cell === "+b") {
    return input.serviceCondition === "heated" || input.thicknessMm <= 10;
  }
  return false;
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
    errors.push("Коефіцієнт умов роботи γc у ручному режимі має бути більше 0.");
  }

  const visibleInputItems = [
    `Розділ таблиці А.1: ${section?.title ?? input.sectionId}`,
    `Конструкція або елемент: ${entry?.label ?? input.structureId}`,
    `Клас відповідальності: ${input.responsibilityClass.replace("CC", "СС")}`,
    `Характер навантаження: ${input.loadType === "static" ? "Статичне" : "Динамічне"}`,
  ];
  const steps: SteelStructureCategoryGroupReportStep[] = [
    {
      key: "inputs",
      caption: "Вихідні дані для визначення категорій і групи конструкції (ДБН В.2.6-198:2014, таблиця 5.1, таблиці 7.1 і 7.2, Додаток А, таблиці А.1 і А.2, Додаток Г, таблиці Г.1 і Г.5):",
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
  const compression = input.loadType === "static" && (input.sigmaCKpa ?? Number.POSITIVE_INFINITY) <= sigmaLimitKpa ? -4 : 0;
  const raw = stressAdjustment + positive + compression;
  const applied = Math.max(-4, Math.min(4, raw));
  const totalA2 = totalBase + applied;
  const groupA2 = groupForTotal(totalA2);
  const isSteelAllowed = steelAllowed(input.steelClass, groupA2, input);
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
    `Характер навантаження: ${input.loadType === "static" ? "Статичне" : "Динамічне"}`,
    `Наявність розтягувальних напружень: ${input.hasTensileStress ? "Так" : "Ні"}`,
    `Несприятливий вплив зварних з’єднань: ${input.hasAdverseWeldEffect ? "Так" : "Ні"}`,
    `Умови експлуатації: ${{ heated: "Опалювана споруда", unheated: "Неопалювана споруда", open_air: "Конструкція на відкритому повітрі" }[input.serviceCondition]}`,
    `Вид прокату: ${{ section: "Фасонний", long: "Сортовий", sheet: "Листовий", universal_plate: "Широкосмуговий універсальний", cold_formed: "Холодногнутий профіль" }[input.productType]}`,
    `Клас міцності сталі: ${input.steelClass}`,
    `Марка сталі та нормативний документ: ${grade?.label ?? input.steelGradeStandardId}`,
    `Товщина прокату t: ${format(thicknessDisplay.value)} ${thicknessDisplay.label}`,
    ...(input.loadType === "dynamic" && input.hasTensileStress ? [`σdyn: ${format(sigmaDynDisplay.value)} ${sigmaDynDisplay.label}`] : []),
    ...(input.hasTensileStress ? [`σsum: ${format(sigmaSumDisplay.value)} ${sigmaSumDisplay.label}`] : []),
    ...(input.loadType === "static" ? [`σc: ${format(sigmaCDisplay.value)} ${sigmaCDisplay.label}`] : []),
    `Кромки після гільйотинного різання: ${input.hasGuillotineEdges ? "Так" : "Ні"}`,
    `Неврахований наклеп від деформування в холодному стані: ${input.hasUnaccountedColdWork ? "Так" : "Ні"}`,
    `Високі початкові напруження, у тому числі зварювальні: ${input.hasHighInitialStress ? "Так" : "Ні"}`,
  ];

  steps.push(
    {
      key: "categories-a1",
      caption: `Визначення категорій конструкції за призначенням і за напруженим станом (ДБН В.2.6-198:2014, Додаток А, таблиця А.1, позиція ${entry.sourcePosition}):`,
      items: [`Розділ таблиці А.1: ${section?.title}`, `Вибрана конструкція або елемент: ${entry.label}`, `Вихідний рядок таблиці: ${entry.sourceText}`],
      formula: `${entry.label} => категорія за призначенням = ${entry.purposeCategory}; категорія за напруженим станом = ${entry.stressCategory}`,
      ...(entry.id === "a1-01-14" || entry.id === "a1-01-15"
        ? { notes: ["У наданому тексті позиції 1в ручні талі і кран-балки перетинаються у рядках Б/I та Б/II. За погодженим виправленням їх віднесено до категорій Б/II."] }
        : {}),
    },
    {
      key: "scores-a2",
      caption: "Визначення показників окремих чинників S1–S5 (ДБН В.2.6-198:2014, Додаток А, таблиця А.2):",
      items: [
        `S1 = ${s1} балів — клас відповідальності ${input.responsibilityClass.replace("CC", "СС")}`,
        `S2 = ${s2} балів — категорія за призначенням ${entry.purposeCategory}`,
        `S3,base = ${s3Base} балів — категорія за напруженим станом ${entry.stressCategory}`,
        `S4 = ${s4} балів — розтягувальні напруження ${input.hasTensileStress ? "є" : "немає"}`,
        `S5 = ${s5} балів — несприятливий вплив зварних з’єднань ${input.hasAdverseWeldEffect ? "є" : "немає"}`,
      ],
    },
    {
      key: "base-group",
      caption: "Визначення початкового показника та групи конструкції (ДБН В.2.6-198:2014, Додаток А, пункт А.1):",
      formulas: [`Stot,base = S1 + S2 + S3,base + S4 + S5 = ${s1} + ${s2} + ${s3Base} + ${s4} + ${s5} = ${totalBase} балів`],
      resultItems: [`Початкова група: ${groupBase} (Stot,base = ${totalBase} балів)`],
    },
    {
      key: "steel-resistance",
      caption: "Визначення розрахункового опору сталі Ry за границею текучості (ДБН В.2.6-198:2014, пункт 7.1, таблиці 7.1 і 7.2, Додаток Г, таблиця Г.5):",
      items: [`Клас міцності сталі: ${input.steelClass}`, `Марка сталі та нормативний документ: ${grade?.label ?? input.steelGradeStandardId}`, `Характеристичний опір за класом міцності: Ryn = ${rynMpa} МПа`, `Коефіцієнт надійності за матеріалом за відповідним рядком таблиці 7.2: γm = ${format(gammaM, 3)}`],
      formula: `Ry = Ryn / γm = ${rynMpa} / ${format(gammaM, 3)} = ${format(ryMpa, 2)} МПа${input.displayUnits.sigmaC !== "mpa" ? ` = ${format(ryDisplay.value, 2)} ${ryDisplay.label}` : ""}`,
    },
    {
      key: "gamma-c",
      caption: "Визначення коефіцієнта умов роботи γc (ДБН В.2.6-198:2014, пункт 5.4.1, таблиця 5.1 та примітки 1–5):",
      items: input.gammaCMode === "automatic"
        ? ["Режим визначення γc: Автоматично за вибраною конструкцією", `Кандидатні позиції таблиці 5.1 за погодженою матрицею: ${entry.table51Profiles.join(", ")}`, `Застосовні позиції таблиці 5.1: ${gammaResult.applicable.map((item) => item.source).join(", ") || "немає"}`]
        : input.gammaCMode === "table"
          ? ["Режим визначення γc: Напівавтоматично — вибір позиції таблиці 5.1", `Вибрана позиція таблиці 5.1: ${gammaResult.selectedTableOption?.label}`]
          : ["Режим визначення γc: Вручну", `Значення γc прийняте користувачем: ${format(gammaResult.value, 3)}`],
      formula: input.gammaCMode === "manual"
        ? `γc = ${format(gammaResult.value, 3)} (прийнято користувачем)`
        : input.gammaCMode === "table"
          ? `γc = ${format(gammaResult.value, 3)} (таблиця 5.1, ${gammaResult.selectedTableOption?.position})`
          : gammaResult.applicable.length
            ? `γc = ${format(gammaResult.value, 3)}`
            : "γc = 1,0 (таблиця 5.1, примітка 5)",
    },
    {
      key: "stress-category-a2",
      caption: "Уточнення категорії конструкції за напруженим станом після підбору перерізу (ДБН В.2.6-198:2014, Додаток А, пункт А.2, перший абзац):",
      formulas: alpha === null ? ["α = не визначається, оскільки розтягувальні напруження відсутні"] : [`α = |σdyn| / |σsum| = ${format(sigmaDynDisplay.value)} / ${format(sigmaSumDisplay.value)} = ${format(alpha)}`],
      resultItems: alpha === null
        ? [`S3,A2 = S3,base = ${s3Base} балів — категорія за напруженим станом не уточнюється`]
        : [`Категорія за напруженим станом після уточнення: ${stressCategoryA2} (α = ${format(alpha)})`, `S3,A2 = ${S3_SCORE[stressCategoryA2]} бал — категорія за напруженим станом ${stressCategoryA2}`],
    },
    {
      key: "positive-adjustments",
      caption: "Визначення додатних поправок до показника групи після підбору перерізу (ДБН В.2.6-198:2014, Додаток А, пункт А.2, другий абзац):",
      items: [
        `ΔSt = ${thicknessAdjustment} балів — товщина прокату t = ${format(input.thicknessMm)} мм`,
        `ΔSguillotine = ${guillotine} балів — кромки після гільйотинного різання ${input.hasGuillotineEdges ? "є" : "немає"}`,
        `ΔScold = ${coldWork} балів — неврахований наклеп ${input.hasUnaccountedColdWork ? "є" : "немає"}`,
        `ΔSinitial = ${initialStress} балів — високі початкові напруження ${input.hasHighInitialStress ? "є" : "немає"}`,
      ],
      formulas: [`ΔS+ = ΔSt + ΔSguillotine + ΔScold + ΔSinitial = ${thicknessAdjustment} + ${guillotine} + ${coldWork} + ${initialStress} = ${positive} балів`],
    },
    {
      key: "compression-adjustment",
      caption: "Перевірка умови зменшення показника групи при статичному стиску (ДБН В.2.6-198:2014, Додаток А, пункт А.2, третій абзац):",
      formulas: input.loadType === "static" ? [`σlimit = 0,4 * Ry * γc = 0,4 * ${format(ryDisplay.value, 2)} * ${format(gammaResult.value, 3)} = ${format(sigmaLimitDisplay.value, 2)} ${sigmaLimitDisplay.label}`, `σc = ${format(sigmaCDisplay.value)} ${sigmaCDisplay.label} ≤ σlimit = ${format(sigmaLimitDisplay.value, 2)} ${sigmaLimitDisplay.label}`] : ["ΔScompression = 0 балів (умова пункту А.2 застосовується при статичному навантаженні)"],
      ...(input.loadType === "static"
        ? { resultItems: [`Умова зменшення показника групи при статичному стиску: ${compression === -4 ? "виконується" : "не виконується"}`, `ΔScompression = ${compression} балів`] }
        : {}),
    },
    {
      key: "refined-group",
      caption: "Уточнення показника та групи конструкції після підбору перерізу (ДБН В.2.6-198:2014, Додаток А, пункт А.2):",
      formulas: [`ΔS3 = S3,A2 - S3,base = ${S3_SCORE[stressCategoryA2]} - ${s3Base} = ${stressAdjustment} балів`, `ΔSraw = ΔS3 + ΔS+ + ΔScompression = ${stressAdjustment} + ${positive} + ${compression} = ${raw} балів`, `ΔS = обмежити(ΔSraw; -4; +4) = ${applied} балів`, `Stot,A2 = Stot,base + ΔS = ${totalBase} + ${applied} = ${totalA2} балів`],
      resultItems: [`Уточнена група: ${groupA2} (Stot,A2 = ${totalA2} балів)`],
    },
    {
      key: "steel-compatibility",
      caption: "Перевірка застосування вибраної сталі для уточненої групи конструкцій (ДБН В.2.6-198:2014, Додаток Г, таблиця Г.1 та примітки 1–6):",
      resultItems: [`Застосовність сталі за таблицею Г.1: ${isSteelAllowed ? "дозволено" : "не дозволено"}`],
    },
    {
      key: "conclusion",
      caption: "Висновок щодо категорій, групи конструкції та застосовності сталі (ДБН В.2.6-198:2014, Додаток А, пункти А.1 і А.2; Додаток Г, таблиця Г.1):",
      items: [
        `Конструкція або елемент: ${entry.label}`,
        `Категорії за таблицею А.1: ${entry.purposeCategory}/${entry.stressCategory}`,
        `Початкова група: ${groupBase} (Stot,base = ${totalBase} балів)`,
        `Уточнена група: ${groupA2} (Stot,A2 = ${totalA2} балів)`,
        `Сталь ${input.steelClass}: ${isSteelAllowed ? "дозволено" : "не дозволено"} за таблицею Г.1`,
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
