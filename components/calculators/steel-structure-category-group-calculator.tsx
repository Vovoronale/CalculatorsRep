"use client";

import { useMemo, useState } from "react";

import {
  STEEL_STRENGTH_CLASSES,
  STEEL_STRUCTURE_SECTIONS,
  getSteelGradeOptions,
  getSteelStructureEntry,
  getSteelStructuresForSection,
  type ProductType,
  type SteelStrengthClass,
  type SteelStructureId,
  type SteelStructureSectionId,
} from "@/lib/steel-structure-category-group-data";
import {
  DEFAULT_STEEL_STRUCTURE_CATEGORY_GROUP_INPUT,
  GAMMA_C_TABLE_OPTIONS,
  getSteelStructureCategoryGroupReport,
  type GammaCMode,
  type GammaCTableOptionId,
  type LoadType,
  type ResponsibilityClass,
  type ServiceCondition,
  type SteelStructureCategoryGroupInput,
  type Table51QualifierInput,
} from "@/lib/steel-structure-category-group";
import {
  getDefaultInputSchemaValues,
  parseCalculatorDecimal,
  type CalculatorInputField,
  type CalculatorInputSchema,
  type CalculatorInputValues,
} from "@/lib/calculator-input-schema";

import { InputSchemaForm } from "./input-schema-form";
import { buildNativeDocxReport, formatDocxFileDate } from "./native-report-docx";
import { NativeCalculatorLayout } from "./native-calculator-layout";
import { NativeReport } from "./native-report";
import { ReportDocxButton } from "./report-docx-button";

type SchemaValues = Partial<CalculatorInputValues>;

const yesNoDescription = "Оберіть відповідь за відповідною нормативною умовою.";

function checkbox(id: string, name: string, defaultValue: boolean, description: string): CalculatorInputField {
  return { id, kind: "checkbox", name, defaultValue, description };
}

function table51Fields(profiles: string[]): CalculatorInputField[] {
  const fields: CalculatorInputField[] = [];
  const source = (position: string) => `ДБН В.2.6-198:2014, таблиця 5.1, позиція ${position}. ${yesNoDescription}`;

  if (profiles.includes("p1")) {
    fields.push(
      { id: "floorLocation", kind: "select", name: "Розташування перекриття", defaultValue: "other", description: source("1"), options: [
        { value: "hall", label: "Під залом театру, клубу або кінотеатру" }, { value: "stands", label: "Під трибунами" }, { value: "shop", label: "Під приміщенням магазину" }, { value: "book", label: "Під книгосховищем" }, { value: "archive", label: "Під архівом" }, { value: "analog", label: "Інший аналогічний випадок" }, { value: "other", label: "Інший випадок" },
      ] },
      { id: "floorElementType", kind: "select", name: "Тип елемента перекриття", defaultValue: "other", description: source("1"), options: [
        { value: "solid_beam", label: "Балка суцільного перерізу" }, { value: "compressed_truss_member", label: "Стиснутий елемент ферми перекриття" }, { value: "other", label: "Інший елемент" },
      ] },
      checkbox("temporaryLoadNotAboveFloorWeight", "Тимчасове навантаження не перевищує вагу перекриття?", false, source("1")),
    );
  }
  if (profiles.includes("p2")) {
    fields.push(
      { id: "tallOrPublicFacilityType", kind: "select", name: "Тип споруди", defaultValue: "public", description: source("2"), options: [{ value: "public", label: "Громадська споруда" }, { value: "other_over_75m", label: "Інша споруда заввишки понад 75 м" }] },
      { id: "towerFacilityType", kind: "select", name: "Тип баштової споруди", defaultValue: "water_tower", description: source("2"), options: [{ value: "tower_cooling", label: "Баштова градирня" }, { value: "fan_cooling", label: "Вентиляторна градирня" }, { value: "water_tower", label: "Водонапірна башта" }] },
      checkbox("isWaterTowerSupportElement", "Елемент належить опорі водонапірної башти?", false, source("2")),
    );
  }
  if (profiles.includes("p3")) {
    fields.push(
      checkbox("isSingleStoreyIndustrialCraneColumn", "Це колона одноповерхової виробничої споруди з мостовими кранами?", false, source("3")),
      checkbox("isPlateForSingleStoreyIndustrialCraneColumn", "Опорна плита належить колоні одноповерхової виробничої споруди з мостовими кранами?", false, "ДБН В.2.6-198:2014, таблиця 5.1, позиції 3 і 9, примітка 3."),
    );
  }
  if (profiles.includes("p4")) {
    fields.push(
      checkbox("isCompressedMainLatticeElement", "Елемент є стиснутим основним елементом решітки, крім опорного?", false, source("4")),
      checkbox("isWeldedRoofOrFloorTruss", "Елемент належить зварній фермі покриття або перекриття?", false, source("4")),
      checkbox("isBuiltUpTeeFromTwoAngles", "Переріз елемента — складений тавр із двох кутиків?", false, source("4")),
      checkbox("isStabilityCheck", "Розрахунок виконується на стійкість?", false, source("4")),
      { id: "slendernessLambda", kind: "number", name: "Гнучкість елемента", prefix: "λ", defaultValue: "60", min: 0, quantity: "coefficient", description: "ДБН В.2.6-198:2014, таблиця 5.1, позиція 4: λ ≥ 60." },
    );
  }
  if (profiles.includes("p5")) {
    fields.push(checkbox("isStrengthCheck", "Розрахунок виконується на міцність?", true, source("5")), checkbox("isUnweakenedSection", "Розрахунковий переріз не має послаблень?", true, source("5")));
  }
  if (profiles.includes("p6a") || profiles.includes("p6b")) {
    fields.push(
      { id: "position6MemberType", kind: "select", name: "Тип несучого елемента", defaultValue: profiles.includes("p6a") ? "solid_beam" : "roof_bar", description: source("6"), options: [{ value: "solid_beam", label: "Суцільна балка" }, { value: "solid_column", label: "Суцільна колона" }, { value: "roof_bar", label: "Стрижнева конструкція покриття" }, { value: "floor_bar", label: "Стрижнева конструкція перекриття" }, { value: "other", label: "Інший елемент" }] },
      checkbox("isStrengthCheck", "Розрахунок виконується на міцність?", true, source("6")),
      checkbox("hasBoltHoles", "Переріз послаблений отворами для болтів?", false, source("6")),
      checkbox("isFrictionConnection", "З’єднання є фрикційним?", false, source("6")),
    );
  }
  if (profiles.includes("p7")) {
    fields.push(
      checkbox("isCompressedSpaceLatticeMember", "Елемент є стиснутим елементом решітки просторової решітчастої конструкції?", false, source("7")),
      { id: "position7Profile", kind: "select", name: "Профіль елемента", defaultValue: "other", description: source("7"), options: [{ value: "equal_angle", label: "Одиночний рівнополичковий кутик" }, { value: "unequal_angle", label: "Одиночний нерівнополичковий кутик" }, { value: "other", label: "Інший профіль" }] },
      checkbox("unequalAngleAttachedByLargerLeg", "Нерівнополичковий кутик прикріплений більшою полицею?", false, source("7")),
      { id: "position7Connection", kind: "select", name: "Спосіб кріплення", defaultValue: "other", description: source("7"), options: [{ value: "welded", label: "Безпосередньо до пояса зварними швами" }, { value: "two_plus_bolts", label: "Безпосередньо до пояса двома або більше болтами вздовж кутика" }, { value: "one_bolt", label: "Безпосередньо до пояса одним болтом" }, { value: "gusset", label: "Через фасонку" }, { value: "other", label: "Інший спосіб" }] },
      { id: "position7FigureCase", kind: "select", name: "Схема елемента за рисунком 13.3", defaultValue: "diagonal_a", description: "ДБН В.2.6-198:2014, таблиця 5.1, позиція 7, рисунок 13.3.", options: [{ value: "diagonal_a", label: "Розкіс — рисунок 13.3а" }, { value: "strut_bve", label: "Розпірка — рисунок 13.3б, 13.3в або 13.3е" }, { value: "diagonal_vgde", label: "Розкіс — рисунок 13.3в, 13.3г, 13.3д або 13.3е" }] },
    );
  }
  if (profiles.includes("p8")) {
    fields.push(
      { id: "position8Case", kind: "select", name: "Випадок позиції 8 таблиці 5.1", defaultValue: "none", description: source("8"), options: [{ value: "flat_truss_angle", label: "Елемент плоскої ферми з одиночного кутика" }, { value: "other_compressed_angle", label: "Інший стиснутий елемент з одиночного кутика" }, { value: "none", label: "Не застосовується" }] },
      checkbox("angleAttachedByOneLeg", "Кутик прикріплений однією полицею?", false, source("8")),
      checkbox("unequalAngleAttachedBySmallerLeg", "Нерівнополичковий кутик прикріплений меншою полицею?", false, source("8")),
    );
  }
  if (profiles.includes("p9")) fields.push(checkbox("isSupportPlate", "Елемент є опорною плитою?", true, "ДБН В.2.6-198:2014, таблиця 5.1, позиція 9 та примітка 3."));
  return fields;
}

export function buildSteelStructureCategoryGroupInputSchema(values: SchemaValues): CalculatorInputSchema {
  const sectionId = String(values.sectionId ?? "a1-section-03") as SteelStructureSectionId;
  const structures = getSteelStructuresForSection(sectionId);
  const structureId = String(values.structureId ?? structures[0]?.id ?? "a1-03-03");
  const entry = getSteelStructureEntry(structureId) ?? structures[0];
  const steelClass = String(values.steelClass ?? "С245") as SteelStrengthClass;
  const productType = String(values.productType ?? "section") as ProductType;
  const gradeOptions = getSteelGradeOptions(steelClass, productType);
  const gammaCMode = String(values.gammaCMode ?? "automatic") as GammaCMode;
  const gammaCManualPreset = String(values.gammaCManualPreset ?? "1");
  const conditions = gammaCMode === "automatic" && entry ? table51Fields(entry.table51Profiles) : [];
  const gammaCFields: CalculatorInputField[] = [
    { id: "gammaCMode", kind: "select", name: "Режим визначення γc", defaultValue: gammaCMode, description: "ДБН В.2.6-198:2014, пункт 5.4.1 і таблиця 5.1.", options: [
      { value: "automatic", label: "Автоматично за вибраною конструкцією" },
      { value: "table", label: "Напівавтоматично — вибір позиції таблиці 5.1" },
      { value: "manual", label: "Вручну" },
    ] },
    ...(gammaCMode === "table" ? [{ id: "gammaCTableOptionId", kind: "select" as const, name: "Позиція таблиці 5.1", defaultValue: "note5", description: "Оберіть нормативний рядок таблиці 5.1; значення γc підставляється автоматично.", options: GAMMA_C_TABLE_OPTIONS.map((option) => ({ value: option.id, label: option.label })) }] : []),
    ...(gammaCMode === "manual" ? [
      { id: "gammaCManualPreset", kind: "select" as const, name: "Значення γc", defaultValue: gammaCManualPreset, description: "Оберіть типове значення або перейдіть до довільного вводу.", options: [
        { value: "0.75", label: "0,75" }, { value: "0.8", label: "0,80" }, { value: "0.9", label: "0,90" },
        { value: "0.95", label: "0,95" }, { value: "1", label: "1,00" }, { value: "1.05", label: "1,05" },
        { value: "1.1", label: "1,10" }, { value: "1.15", label: "1,15" }, { value: "1.2", label: "1,20" },
        { value: "custom", label: "Інше значення" },
      ] },
      ...(gammaCManualPreset === "custom" ? [{ id: "gammaCManual", kind: "number" as const, name: "Коефіцієнт умов роботи", prefix: { text: "γ", subscript: "c", ariaLabel: "γc" }, defaultValue: "1", min: 0.000001, description: "Значення γc приймається користувачем і має бути більше 0." }] : []),
    ] : []),
    ...conditions,
  ];

  return {
    groups: [
      { id: "steel-structure-selection", title: "Конструкція", fields: [
        { id: "sectionId", kind: "select", name: "Розділ таблиці А.1", defaultValue: sectionId, description: "ДБН В.2.6-198:2014, Додаток А, таблиця А.1: групування атомарних позицій.", options: STEEL_STRUCTURE_SECTIONS.map((section) => ({ value: section.id, label: `${section.number}. ${section.title}` })) },
        { id: "structureId", kind: "select", name: "Конструкція або елемент", defaultValue: entry?.id ?? "", description: "ДБН В.2.6-198:2014, Додаток А, таблиця А.1. Категорії визначаються з вибраного атомарного рядка.", options: structures.map((item) => ({ value: item.id, label: `${item.label} — ${item.purposeCategory}/${item.stressCategory}` })) },
        { id: "responsibilityClass", kind: "select", name: "Клас відповідальності", defaultValue: "CC2", description: "ДБН В.2.6-198:2014, таблиця А.2, показник S1.", options: [{ value: "CC1", label: "СС1" }, { value: "CC2", label: "СС2" }, { value: "CC3", label: "СС3" }] },
        { id: "loadType", kind: "select", name: "Характер навантаження", defaultValue: entry?.inferredLoadType ?? "static", description: "ДБН В.2.6-198:2014, пункт А.2; використовується для α та перевірки статичного стиску.", options: [{ value: "static", label: "Статичне" }, { value: "dynamic", label: "Динамічне" }] },
        checkbox("hasTensileStress", "Є розтягувальні напруження від розрахункового навантаження?", true, "ДБН В.2.6-198:2014, таблиця А.2, показник S4."),
        checkbox("hasAdverseWeldEffect", "Є несприятливий вплив зварних з’єднань?", false, "ДБН В.2.6-198:2014, таблиця А.2, показник S5 і примітка до таблиці."),
      ] },
      { id: "steel-material", title: "Сталь", fields: [
        { id: "serviceCondition", kind: "select", name: "Умови експлуатації", defaultValue: "heated", description: "ДБН В.2.6-198:2014, таблиця Г.1, примітки а, б і 3.", options: [{ value: "heated", label: "Опалювана споруда" }, { value: "unheated", label: "Неопалювана споруда" }, { value: "open_air", label: "Конструкція на відкритому повітрі" }] },
        { id: "productType", kind: "select", name: "Вид прокату", defaultValue: productType, description: "ДБН В.2.6-198:2014, таблиця Г.5; використовується для фільтрації марки сталі.", options: [{ value: "section", label: "Фасонний" }, { value: "long", label: "Сортовий" }, { value: "sheet", label: "Листовий" }, { value: "universal_plate", label: "Широкосмуговий універсальний" }, { value: "cold_formed", label: "Холодногнутий профіль" }] },
        { id: "steelClass", kind: "select", name: "Клас міцності сталі", defaultValue: steelClass, description: "ДБН В.2.6-198:2014, таблиці 7.1, 7.2, Г.1 і Г.5.", options: STEEL_STRENGTH_CLASSES.map((item) => ({ value: item, label: item })) },
        { id: "steelGradeStandardId", kind: "select", name: "Марка сталі та нормативний документ", defaultValue: gradeOptions[0]?.id ?? "", description: "ДБН В.2.6-198:2014, Додаток Г, таблиця Г.5.", options: gradeOptions.map((item) => ({ value: item.id, label: item.label })) },
        { id: "thicknessMm", kind: "number", name: "Товщина прокату", prefix: "t", defaultValue: "10", min: 0, quantity: "thickness", baseUnit: "mm", defaultDisplayUnit: "mm", description: "ДБН В.2.6-198:2014, пункт А.2, другий абзац; таблиця Г.5 та примітки таблиці Г.1." },
      ] },
      { id: "steel-a2", title: "Чинники А.2", fields: [
        { id: "sigmaDynKpa", kind: "number", name: "Найбільше нормальне розтягувальне напруження від динамічних навантажень", prefix: { text: "σ", subscript: "dyn", ariaLabel: "σdyn" }, defaultValue: "0", min: 0, quantity: "pressure", baseUnit: "kpa", defaultDisplayUnit: "mpa", description: "ДБН В.2.6-198:2014, пункт А.2, перший абзац: чисельник α.", showWhen: [{ fieldId: "loadType", equals: "dynamic" }, { fieldId: "hasTensileStress", equals: true }] },
        { id: "sigmaSumKpa", kind: "number", name: "Найбільше сумарне нормальне розтягувальне напруження від усіх навантажень", prefix: { text: "σ", subscript: "sum", ariaLabel: "σsum" }, defaultValue: "100000", min: 0, quantity: "pressure", baseUnit: "kpa", defaultDisplayUnit: "mpa", description: "ДБН В.2.6-198:2014, пункт А.2, перший абзац: знаменник α.", showWhen: { fieldId: "hasTensileStress", equals: true } },
        { id: "sigmaCKpa", kind: "number", name: "Нормальне напруження стиску з урахуванням φ, φe, φb", prefix: { text: "σ", subscript: "c", ariaLabel: "σc" }, defaultValue: "100000", min: 0, quantity: "pressure", baseUnit: "kpa", defaultDisplayUnit: "mpa", description: "ДБН В.2.6-198:2014, пункт А.2, третій абзац; вводиться невід’ємний модуль.", showWhen: { fieldId: "loadType", equals: "static" } },
        checkbox("hasGuillotineEdges", "Є кромки після гільйотинного різання?", false, "ДБН В.2.6-198:2014, пункт А.2, другий абзац."),
        checkbox("hasUnaccountedColdWork", "Є неврахований у розрахунку наклеп від деформування в холодному стані?", false, "ДБН В.2.6-198:2014, пункт А.2, другий абзац."),
        checkbox("hasHighInitialStress", "Є високі початкові напруження, у тому числі зварювальні?", false, "ДБН В.2.6-198:2014, пункт А.2, другий абзац."),
      ] },
      { id: "steel-gamma-c", title: "Умови γc", fields: gammaCFields },
    ],
  };
}

function stringValue(values: CalculatorInputValues, key: string, fallback: string) {
  const value = values[key];
  return typeof value === "string" && value ? value : fallback;
}

function boolValue(values: CalculatorInputValues, key: string, fallback = false) {
  return typeof values[key] === "boolean" ? Boolean(values[key]) : fallback;
}

function numberValue(values: CalculatorInputValues, key: string, fallback: number) {
  const value = parseCalculatorDecimal(values[key] ?? "");
  return Number.isFinite(value) ? value : fallback;
}

function qualifierInput(values: CalculatorInputValues): Table51QualifierInput {
  return {
    floorLocation: stringValue(values, "floorLocation", "other"),
    floorElementType: stringValue(values, "floorElementType", "other") as Table51QualifierInput["floorElementType"],
    temporaryLoadNotAboveFloorWeight: boolValue(values, "temporaryLoadNotAboveFloorWeight"),
    towerFacilityType: stringValue(values, "towerFacilityType", "water_tower") as Table51QualifierInput["towerFacilityType"],
    isWaterTowerSupportElement: boolValue(values, "isWaterTowerSupportElement"),
    tallOrPublicFacilityType: stringValue(values, "tallOrPublicFacilityType", "public") as Table51QualifierInput["tallOrPublicFacilityType"],
    isSingleStoreyIndustrialCraneColumn: boolValue(values, "isSingleStoreyIndustrialCraneColumn"),
    isPlateForSingleStoreyIndustrialCraneColumn: boolValue(values, "isPlateForSingleStoreyIndustrialCraneColumn"),
    isCompressedMainLatticeElement: boolValue(values, "isCompressedMainLatticeElement"),
    isWeldedRoofOrFloorTruss: boolValue(values, "isWeldedRoofOrFloorTruss"),
    isBuiltUpTeeFromTwoAngles: boolValue(values, "isBuiltUpTeeFromTwoAngles"),
    isStabilityCheck: boolValue(values, "isStabilityCheck"),
    slendernessLambda: numberValue(values, "slendernessLambda", 0),
    isStrengthCheck: boolValue(values, "isStrengthCheck", true),
    isUnweakenedSection: boolValue(values, "isUnweakenedSection"),
    position6MemberType: stringValue(values, "position6MemberType", "other") as Table51QualifierInput["position6MemberType"],
    hasBoltHoles: boolValue(values, "hasBoltHoles"),
    isFrictionConnection: boolValue(values, "isFrictionConnection"),
    isCompressedSpaceLatticeMember: boolValue(values, "isCompressedSpaceLatticeMember"),
    position7Profile: stringValue(values, "position7Profile", "other") as Table51QualifierInput["position7Profile"],
    unequalAngleAttachedByLargerLeg: boolValue(values, "unequalAngleAttachedByLargerLeg"),
    position7Connection: stringValue(values, "position7Connection", "other") as Table51QualifierInput["position7Connection"],
    position7FigureCase: stringValue(values, "position7FigureCase", "diagonal_a") as Table51QualifierInput["position7FigureCase"],
    position8Case: stringValue(values, "position8Case", "none") as Table51QualifierInput["position8Case"],
    angleAttachedByOneLeg: boolValue(values, "angleAttachedByOneLeg"),
    unequalAngleAttachedBySmallerLeg: boolValue(values, "unequalAngleAttachedBySmallerLeg"),
    isSupportPlate: boolValue(values, "isSupportPlate"),
  };
}

function inputFromValues(values: CalculatorInputValues, units: Record<string, string>): SteelStructureCategoryGroupInput {
  return {
    sectionId: stringValue(values, "sectionId", "a1-section-03") as SteelStructureSectionId,
    structureId: stringValue(values, "structureId", "a1-03-03") as SteelStructureId,
    responsibilityClass: stringValue(values, "responsibilityClass", "CC2") as ResponsibilityClass,
    loadType: stringValue(values, "loadType", "static") as LoadType,
    hasTensileStress: boolValue(values, "hasTensileStress", true),
    hasAdverseWeldEffect: boolValue(values, "hasAdverseWeldEffect"),
    serviceCondition: stringValue(values, "serviceCondition", "heated") as ServiceCondition,
    productType: stringValue(values, "productType", "section") as ProductType,
    steelClass: stringValue(values, "steelClass", "С245") as SteelStrengthClass,
    steelGradeStandardId: stringValue(values, "steelGradeStandardId", "c245-01"),
    thicknessMm: numberValue(values, "thicknessMm", 10),
    sigmaDynKpa: numberValue(values, "sigmaDynKpa", 0),
    sigmaSumKpa: numberValue(values, "sigmaSumKpa", 100_000),
    sigmaCKpa: numberValue(values, "sigmaCKpa", 100_000),
    hasGuillotineEdges: boolValue(values, "hasGuillotineEdges"),
    hasUnaccountedColdWork: boolValue(values, "hasUnaccountedColdWork"),
    hasHighInitialStress: boolValue(values, "hasHighInitialStress"),
    gammaCMode: stringValue(values, "gammaCMode", "automatic") as GammaCMode,
    gammaCTableOptionId: stringValue(values, "gammaCTableOptionId", "note5") as GammaCTableOptionId,
    gammaCManual: stringValue(values, "gammaCManualPreset", "1") === "custom"
      ? numberValue(values, "gammaCManual", 1)
      : Number(stringValue(values, "gammaCManualPreset", "1")),
    table51: qualifierInput(values),
    displayUnits: { thickness: units.thicknessMm ?? "mm", sigmaDyn: units.sigmaDynKpa ?? "mpa", sigmaSum: units.sigmaSumKpa ?? "mpa", sigmaC: units.sigmaCKpa ?? "mpa" },
  };
}

export function buildSteelStructureCategoryGroupDocxReport(steps: ReturnType<typeof getSteelStructureCategoryGroupReport>["steps"], date = new Date()) {
  return buildNativeDocxReport({ title: "Покроковий звіт", fileBaseName: `kategorii-ta-grupy-stalevykh-konstruktsii-${formatDocxFileDate(date)}`, steps });
}

function NormScan({ alt, src }: { alt: string; src: string }) {
  return <details className="steel-structure-norm__scan"><summary>Скан фрагмента ДБН</summary><figure><img src={src} alt={alt} loading="lazy" decoding="async" /></figure></details>;
}

function NormativeReferences() {
  return <section className="native-report" aria-labelledby="steel-structure-norms-title">
    <div className="native-report__head"><h3 id="steel-structure-norms-title">Нормативні посилання</h3></div>
    <div className="native-report__items">
      <article><h4>ДБН В.2.6-198:2014, Додаток А, таблиця А.1</h4><p>Категорії конструкцій за призначенням і за напруженим станом.</p>
        <NormScan src="/dbn/steel-structure-category-group/dbn-table-a-1-part-1.png" alt="Скан таблиці А.1 з ДБН В.2.6-198:2014, частина 1" />
        <NormScan src="/dbn/steel-structure-category-group/dbn-table-a-1-part-2.png" alt="Скан таблиці А.1 з ДБН В.2.6-198:2014, частина 2" />
        <NormScan src="/dbn/steel-structure-category-group/dbn-table-a-1-part-3.png" alt="Скан таблиці А.1 з ДБН В.2.6-198:2014, частина 3" />
      </article>
      <article><h4>ДБН В.2.6-198:2014, Додаток А, таблиця А.2</h4><p>Показники S1–S5, початкова група та її уточнення.</p><NormScan src="/dbn/steel-structure-category-group/dbn-table-a-2.png" alt="Скан таблиці А.2 з ДБН В.2.6-198:2014" /></article>
      <article><h4>ДБН В.2.6-198:2014, пункт 5.4.1, таблиця 5.1</h4><p>Коефіцієнти умов роботи γc та примітки 1–5.</p>
        <NormScan src="/dbn/steel-structure-category-group/dbn-table-5-1-part-1.png" alt="Скан таблиці 5.1 з ДБН В.2.6-198:2014" />
        <NormScan src="/dbn/steel-structure-category-group/dbn-table-5-1-part-2-notes.png" alt="Скан приміток 1–5 до таблиці 5.1 з ДБН В.2.6-198:2014" />
      </article>
      <article><h4>ДБН В.2.6-198:2014, пункти 7.1–7.2, таблиці 7.1–7.2</h4><p>Визначення Ry = Ryn / γm і коефіцієнта надійності за матеріалом γm.</p></article>
      <article><h4>ДБН В.2.6-198:2014, Додаток Г, таблиці Г.1 і Г.5</h4><p>Відповідність марок класам міцності та застосування сталі.</p>
        <NormScan src="/dbn/steel-structure-category-group/dbn-table-g-1-part-1.png" alt="Скан таблиці Г.1 з ДБН В.2.6-198:2014, частина 1" />
        <NormScan src="/dbn/steel-structure-category-group/dbn-table-g-1-part-2-notes.png" alt="Скан таблиці Г.1 з ДБН В.2.6-198:2014, частина 2 і примітки" />
        <NormScan src="/dbn/steel-structure-category-group/dbn-table-g-5-part-1.png" alt="Скан таблиці Г.5 з ДБН В.2.6-198:2014, частина 1" />
        <NormScan src="/dbn/steel-structure-category-group/dbn-table-g-5-part-2.png" alt="Скан таблиці Г.5 з ДБН В.2.6-198:2014, частина 2" />
      </article>
    </div>
  </section>;
}

export function SteelStructureCategoryGroupCalculator() {
  const initialSchema = useMemo(() => buildSteelStructureCategoryGroupInputSchema({ sectionId: "a1-section-03", structureId: "a1-03-03", steelClass: "С245", productType: "section" }), []);
  const [values, setValues] = useState<CalculatorInputValues>(() => getDefaultInputSchemaValues(initialSchema));
  const [displayUnits, setDisplayUnits] = useState<Record<string, string>>({ thicknessMm: "mm", sigmaDynKpa: "mpa", sigmaSumKpa: "mpa", sigmaCKpa: "mpa" });
  const schema = useMemo(() => buildSteelStructureCategoryGroupInputSchema(values), [values]);

  const setNormalizedValues = (next: CalculatorInputValues) => {
    const normalized = { ...next };
    if (next.sectionId !== values.sectionId) {
      const first = getSteelStructuresForSection(String(next.sectionId) as SteelStructureSectionId)[0];
      if (first) {
        normalized.structureId = first.id;
        normalized.loadType = first.inferredLoadType ?? "static";
      }
    } else if (next.structureId !== values.structureId) {
      const entry = getSteelStructureEntry(String(next.structureId));
      if (entry?.inferredLoadType) normalized.loadType = entry.inferredLoadType;
    }
    if (next.steelClass !== values.steelClass || next.productType !== values.productType) {
      const options = getSteelGradeOptions(String(next.steelClass) as SteelStrengthClass, String(next.productType) as ProductType);
      normalized.steelGradeStandardId = options[0]?.id ?? "";
    }
    setValues(normalized);
  };

  const input = useMemo(() => inputFromValues(values, displayUnits), [values, displayUnits]);
  const report = useMemo(() => getSteelStructureCategoryGroupReport(input), [input]);
  const docx = useMemo(() => buildSteelStructureCategoryGroupDocxReport(report.steps), [report.steps]);
  const summary = report.values ? <div className="steel-structure-category-summary"><p>Категорії: {report.values.purposeCategory}/{report.values.stressCategoryBase}</p><p>Початкова група: {report.values.groupBase}, Stot = {report.values.totalBase}</p><p>Уточнена група: {report.values.groupA2}, Stot = {report.values.totalA2}</p><p>γc = {report.values.gammaC}; Ry = {report.values.ryMpa.toFixed(2)} МПа</p><p>Сталь за Г.1: {report.values.steelAllowed ? "дозволено" : "не дозволено"}</p></div> : null;

  return <NativeCalculatorLayout ariaLabel="Калькулятор категорій і груп сталевих конструкцій" navLinks={[{ href: "#steel-structure-selection", label: "Конструкція" }, { href: "#steel-material", label: "Сталь" }, { href: "#steel-a2", label: "Чинники А.2" }, { href: "#steel-gamma-c", label: "Умови γc" }, { href: "#steel-structure-report-title", label: "Звіт" }, { href: "#steel-structure-norms-title", label: "Норми" }]} summary={summary} controls={<InputSchemaForm schema={schema} values={values} onValuesChange={setNormalizedValues} displayUnits={displayUnits} onDisplayUnitsChange={setDisplayUnits} />} errors={report.errors} warnings={report.warnings}><NativeReport titleId="steel-structure-report-title" title="Покроковий звіт" steps={report.steps} actions={<ReportDocxButton report={docx} />} /><NormativeReferences /></NativeCalculatorLayout>;
}
