"use client";

import { useMemo, useState, type ReactNode } from "react";

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

import { DbnSourceLink } from "./dbn-source-link";
import { InputSchemaForm } from "./input-schema-form";
import { MathNotation } from "./math-notation";
import { buildNativeDocxReport, formatDocxFileDate } from "./native-report-docx";
import { NativeCalculatorLayout } from "./native-calculator-layout";
import { NativeReport } from "./native-report";
import { ReportDocxButton } from "./report-docx-button";

const REPORT_TITLE = "Розрахунок категорій і групи сталевої конструкції";

type SchemaValues = Partial<CalculatorInputValues>;

const STEEL_NORM_LINKS = [
  { text: "таблиці 7.1 і 7.2", id: "steel-norm-table-7-1" },
  { text: "таблицею 7.2", id: "steel-norm-table-7-2" },
  { text: "таблицею 5.1", id: "steel-norm-table-5-1" },
  { text: "таблицею А.1", id: "steel-norm-table-a-1" },
  { text: "таблицею А.2", id: "steel-norm-table-a-2" },
  { text: "таблицею Г.1", id: "steel-norm-table-g-1" },
  { text: "таблицею Г.5", id: "steel-norm-table-g-5" },
  { text: "пункти 7.1–7.2", id: "steel-norm-table-7-1" },
  { text: "пункт 5.4.1", id: "steel-norm-table-5-1" },
  { text: "примітками 1–5", id: "steel-norm-table-5-1-notes" },
  { text: "примітки 1–5", id: "steel-norm-table-5-1-notes" },
  { text: "таблиці А.1", id: "steel-norm-table-a-1" },
  { text: "таблиця А.1", id: "steel-norm-table-a-1" },
  { text: "таблиці А.2", id: "steel-norm-table-a-2" },
  { text: "таблиця А.2", id: "steel-norm-table-a-2" },
  { text: "пункти А.1 і А.2", id: "steel-norm-a-1-a-2" },
  { text: "пункт А.1", id: "steel-norm-a-1-a-2" },
  { text: "пункт А.2", id: "steel-norm-a-1-a-2" },
  { text: "таблиці Г.1", id: "steel-norm-table-g-1" },
  { text: "таблиця Г.1", id: "steel-norm-table-g-1" },
  { text: "таблиці Г.5", id: "steel-norm-table-g-5" },
  { text: "таблиця Г.5", id: "steel-norm-table-g-5" },
  { text: "таблиця 7.1", id: "steel-norm-table-7-1" },
  { text: "таблиця 7.2", id: "steel-norm-table-7-2" },
  { text: "таблиці 7.1", id: "steel-norm-table-7-1" },
  { text: "таблиці 7.2", id: "steel-norm-table-7-2" },
  { text: "таблиця 5.1", id: "steel-norm-table-5-1" },
  { text: "таблиці 5.1", id: "steel-norm-table-5-1" },
  { text: "Додаток А", id: "steel-norm-table-a-1" },
  { text: "Додаток Г", id: "steel-norm-table-g-1" },
  { text: "Г.1", id: "steel-norm-table-g-1" },
  { text: "Г.5", id: "steel-norm-table-g-5" },
] as const;

const STEEL_INLINE_NOTATIONS = [
  { text: "S_tot,base", base: "S", subscript: "tot,base" },
  { text: "S_tot,A2", base: "S", subscript: "tot,A2" },
  { text: "S_3,base", base: "S", subscript: "3,base" },
  { text: "S_3,A2", base: "S", subscript: "3,A2" },
  { text: "ΔS_compression", base: "ΔS", subscript: "compression" },
  { text: "ΔS_guillotine", base: "ΔS", subscript: "guillotine" },
  { text: "ΔS_initial", base: "ΔS", subscript: "initial" },
  { text: "ΔS_cold", base: "ΔS", subscript: "cold" },
  { text: "ΔS_raw", base: "ΔS", subscript: "raw" },
  { text: "ΔS_+", base: "ΔS", subscript: "+" },
  { text: "ΔS_3", base: "ΔS", subscript: "3" },
  { text: "ΔS_t", base: "ΔS", subscript: "t" },
  { text: "σ_limit", base: "σ", subscript: "limit" },
  { text: "σ_dyn", base: "σ", subscript: "dyn" },
  { text: "σ_sum", base: "σ", subscript: "sum" },
  { text: "σ_c", base: "σ", subscript: "c" },
  { text: "R_yn", base: "R", subscript: "yn" },
  { text: "R_y", base: "R", subscript: "y" },
  { text: "γ_m", base: "γ", subscript: "m" },
  { text: "γ_c", base: "γ", subscript: "c" },
  { text: "S_1", base: "S", subscript: "1" },
  { text: "S_2", base: "S", subscript: "2" },
  { text: "S_3", base: "S", subscript: "3" },
  { text: "S_4", base: "S", subscript: "4" },
  { text: "S_5", base: "S", subscript: "5" },
  { text: "ΔS", base: "ΔS" },
] as const;

function escapePattern(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderSteelNormText(text: string): ReactNode {
  const tokens = [
    ...STEEL_NORM_LINKS.map((link) => link.text),
    ...STEEL_INLINE_NOTATIONS.map((notation) => notation.text),
  ].sort((left, right) => right.length - left.length);
  const pattern = new RegExp(tokens.map(escapePattern).join("|"), "g");
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    if (match.index === undefined) continue;
    if (match.index > lastIndex) nodes.push(<span key={`text:${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>);
    const link = STEEL_NORM_LINKS.find((item) => item.text === match[0]);
    if (link) {
      nodes.push(<a key={`${link.id}:${match.index}`} href={`#${link.id}`} onClick={() => {
        const target = document.getElementById(link.id);
        const details = (target?.tagName === "DETAILS" ? target : target?.querySelector("details")) as HTMLDetailsElement | null | undefined;
        if (details) details.open = true;
      }}>{link.text}</a>);
    } else {
      const notation = STEEL_INLINE_NOTATIONS.find((item) => item.text === match[0]);
      if (notation) {
        nodes.push(
          <MathNotation
            ariaLabel={notation.text}
            base={notation.base}
            key={`${notation.text}:${match.index}`}
            subscript={"subscript" in notation ? notation.subscript : undefined}
          />,
        );
      }
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) nodes.push(<span key={`text:${lastIndex}`}>{text.slice(lastIndex)}</span>);
  return <>{nodes}</>;
}

const steelGradeStandardDescription = "Оберіть фактичну марку сталі та стандарт, за яким виготовлено прокат. Ці дані беруть із сертифіката якості на метал або зі специфікації проєкту. Калькулятор перевіряє, чи відповідає вибрана марка заданому класу міцності, виду та товщині прокату за таблицею Г.5 ДБН В.2.6-198:2014, а також визначає коефіцієнт надійності за матеріалом γm для розрахунку Ry = Ryn / γm за таблицею 7.2.";

function checkbox(id: string, name: string, defaultValue: boolean, description: string): CalculatorInputField {
  return { id, kind: "checkbox", name, defaultValue, description };
}

function table51Fields(profiles: string[]): CalculatorInputField[] {
  const fields: CalculatorInputField[] = [];
  const source = (position: string) => `Звірте цю ознаку з розрахунковою схемою, перерізом і способом закріплення елемента. Відповідь визначає, чи застосовується коефіцієнт умов роботи γc за позицією ${position} таблиці 5.1 ДБН В.2.6-198:2014.`;

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
      checkbox("isPlateForSingleStoreyIndustrialCraneColumn", "Опорна плита належить колоні одноповерхової виробничої споруди з мостовими кранами?", false, "Звірте призначення плити з опорним вузлом колони. Відповідь дає змогу сумісно врахувати γc позицій 9 і 3 згідно з приміткою 3 до таблиці 5.1 ДБН В.2.6-198:2014."),
    );
  }
  if (profiles.includes("p4")) {
    fields.push(
      checkbox("isCompressedMainLatticeElement", "Елемент є стиснутим основним елементом решітки, крім опорного?", false, source("4")),
      checkbox("isWeldedRoofOrFloorTruss", "Елемент належить зварній фермі покриття або перекриття?", false, source("4")),
      checkbox("isBuiltUpTeeFromTwoAngles", "Переріз елемента — складений тавр із двох кутиків?", false, source("4")),
      checkbox("isStabilityCheck", "Розрахунок виконується на стійкість?", false, source("4")),
      { id: "slendernessLambda", kind: "number", name: "Гнучкість елемента", prefix: "λ", defaultValue: "60", min: 0, quantity: "coefficient", description: "Введіть розрахункову гнучкість λ, отриману під час перевірки стійкості елемента. Позиція 4 таблиці 5.1 ДБН В.2.6-198:2014 застосовується лише при λ ≥ 60 і дає γc = 0,80." },
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
      { id: "position7FigureCase", kind: "select", name: "Схема елемента за рисунком 13.3", defaultValue: "diagonal_a", description: "Оберіть схему, яка відповідає положенню розкосу або розпірки у просторовій решітці. Від схеми залежить значення γc = 0,90 або 0,80 за позицією 7а таблиці 5.1 ДБН В.2.6-198:2014 і рисунком 13.3.", options: [{ value: "diagonal_a", label: "Розкіс — рисунок 13.3а" }, { value: "strut_bve", label: "Розпірка — рисунок 13.3б, 13.3в або 13.3е" }, { value: "diagonal_vgde", label: "Розкіс — рисунок 13.3в, 13.3г, 13.3д або 13.3е" }] },
    );
  }
  if (profiles.includes("p8")) {
    fields.push(
      { id: "position8Case", kind: "select", name: "Випадок позиції 8 таблиці 5.1", defaultValue: "none", description: source("8"), options: [{ value: "flat_truss_angle", label: "Елемент плоскої ферми з одиночного кутика" }, { value: "other_compressed_angle", label: "Інший стиснутий елемент з одиночного кутика" }, { value: "none", label: "Не застосовується" }] },
      checkbox("angleAttachedByOneLeg", "Кутик прикріплений однією полицею?", false, source("8")),
      checkbox("unequalAngleAttachedBySmallerLeg", "Нерівнополичковий кутик прикріплений меншою полицею?", false, source("8")),
    );
  }
  if (profiles.includes("p9")) fields.push(checkbox("isSupportPlate", "Елемент є опорною плитою?", true, "Підтвердьте, що розраховується плита, яка передає опорну реакцію на нижню конструкцію. Для такої плити γc залежить від товщини за позицією 9 таблиці 5.1 ДБН В.2.6-198:2014; примітка 3 дозволяє окремі сполучення."));
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
    { id: "gammaCMode", kind: "select", name: "Режим визначення γc", defaultValue: gammaCMode, description: "Оберіть спосіб отримання γc. Автоматичний режим перевіряє умови кандидатних позицій для вибраної конструкції; напівавтоматичний приймає обрану вами позицію таблиці 5.1; ручний використовує задане вами число. γc входить до перевірки статичного стиску за пунктом А.2. Джерело: пункт 5.4.1 і таблиця 5.1 ДБН В.2.6-198:2014.", options: [
      { value: "automatic", label: "Автоматично за вибраною конструкцією" },
      { value: "table", label: "Напівавтоматично — вибір позиції таблиці 5.1" },
      { value: "manual", label: "Вручну" },
    ] },
    ...(gammaCMode === "table" ? [{ id: "gammaCTableOptionId", kind: "select" as const, name: "Позиція таблиці 5.1", defaultValue: "note5", description: "Оберіть рядок, умови якого ви вже перевірили за розрахунковою схемою. Калькулятор візьме наведене в цьому рядку γc без автоматичної перевірки ознак конструкції та використає його у подальших формулах. Джерело: таблиця 5.1 ДБН В.2.6-198:2014.", options: GAMMA_C_TABLE_OPTIONS.map((option) => ({ value: option.id, label: option.label })) }] : []),
    ...(gammaCMode === "manual" ? [
      { id: "gammaCManualPreset", kind: "select" as const, name: "Значення γc", defaultValue: gammaCManualPreset, description: "Оберіть прийняте вами значення γc. Список містить значення з таблиці 5.1; варіант «Інше значення» відкриває довільний ввід. Калькулятор не перевіряє нормативну застосовність ручного значення, але використовує його у перевірці статичного стиску за пунктом А.2 ДБН В.2.6-198:2014.", options: [
        { value: "0.75", label: "0,75" }, { value: "0.8", label: "0,80" }, { value: "0.9", label: "0,90" },
        { value: "0.95", label: "0,95" }, { value: "1", label: "1,00" }, { value: "1.05", label: "1,05" },
        { value: "1.1", label: "1,10" }, { value: "1.15", label: "1,15" }, { value: "1.2", label: "1,20" },
        { value: "custom", label: "Інше значення" },
      ] },
      ...(gammaCManualPreset === "custom" ? [{ id: "gammaCManual", kind: "number" as const, name: "Коефіцієнт умов роботи", prefix: { text: "γ", subscript: "c", ariaLabel: "γc" }, defaultValue: "1", min: 0.000001, description: "Введіть обґрунтоване вами додатне значення γc. Воно буде прийняте без нормативного підбору й використане в умові σc ≤ 0,4 Ry γc за пунктом А.2 ДБН В.2.6-198:2014; відповідальність за вибір значення залишається за користувачем." }] : []),
    ] : []),
    ...conditions,
  ];

  return {
    groups: [
      { id: "steel-structure-selection", title: "Конструкція", fields: [
        { id: "sectionId", kind: "select", name: "Розділ таблиці А.1", defaultValue: sectionId, description: "Оберіть загальний тип споруди або конструктивної системи. Це звужує наступний список до елементів відповідного розділу таблиці А.1, але саме по собі ще не визначає категорії. Джерело: Додаток А, таблиця А.1 ДБН В.2.6-198:2014.", options: STEEL_STRUCTURE_SECTIONS.map((section) => ({ value: section.id, label: `${section.number}. ${section.title}` })) },
        { id: "structureId", kind: "select", name: "Конструкція або елемент", defaultValue: entry?.id ?? "", description: "Оберіть конкретний елемент, який перевіряється, а не всю споруду загалом. Вибраний атомарний рядок таблиці А.1 задає категорії за призначенням і напруженим станом та перелік можливих позицій таблиці 5.1 для γc. Джерело: Додаток А, таблиця А.1 ДБН В.2.6-198:2014.", options: structures.map((item) => ({ value: item.id, label: `${item.label} — ${item.purposeCategory}/${item.stressCategory}` })) },
        { id: "responsibilityClass", kind: "select", name: "Клас відповідальності", defaultValue: "CC2", description: "Оберіть клас наслідків (відповідальності) будівлі або споруди, встановлений у проєктній документації. Він формує показник S1: для СС3 — 4 бали, для СС2 і СС1 — 0 балів, тому впливає на групу конструкції. Джерело: таблиця А.2 ДБН В.2.6-198:2014.", options: [{ value: "CC1", label: "СС1" }, { value: "CC2", label: "СС2" }, { value: "CC3", label: "СС3" }] },
        { id: "loadType", kind: "select", name: "Характер навантаження", defaultValue: entry?.inferredLoadType ?? "static", description: "Вкажіть, чи розрахунковий ефект створюється статичним навантаженням, чи містить динамічну складову. Вибір керує полем σdyn, уточненням категорії через α та можливістю зменшення показника групи при статичному стиску. Джерело: пункт А.2 ДБН В.2.6-198:2014.", options: [{ value: "static", label: "Статичне" }, { value: "dynamic", label: "Динамічне" }] },
        checkbox("hasTensileStress", "Є розтягувальні напруження від розрахункового навантаження?", true, "Виберіть «Так», якщо хоча б у частині розрахункового перерізу від розрахункової комбінації виникають нормальні розтягувальні напруження. Це задає S4 = 7 балів замість 2 і вмикає уточнення категорії за α. Джерело: таблиця А.2 і пункт А.2 ДБН В.2.6-198:2014."),
        checkbox("hasAdverseWeldEffect", "Є несприятливий вплив зварних з’єднань?", false, "Виберіть «Так», якщо зварні шви розташовані в зоні значних розрахункових розтягувальних напружень або міцність з’єднання визначає придатність конструкції в цілому. Це задає S5 = 6 балів замість 2. Джерело: таблиця А.2 та примітка до неї в ДБН В.2.6-198:2014."),
      ] },
      { id: "steel-material", title: "Сталь", fields: [
        { id: "serviceCondition", kind: "select", name: "Умови експлуатації", defaultValue: "heated", description: "Оберіть фактичне температурне середовище елемента: всередині опалюваної чи неопалюваної споруди або просто неба. Ця ознака змінює допустимість окремих класів сталі для груп конструкцій за примітками а, б і 3 таблиці Г.1 ДБН В.2.6-198:2014.", options: [{ value: "heated", label: "Опалювана споруда" }, { value: "unheated", label: "Неопалювана споруда" }, { value: "open_air", label: "Конструкція на відкритому повітрі" }] },
        { id: "productType", kind: "select", name: "Вид прокату", defaultValue: productType, description: "Оберіть форму металопродукції за специфікацією або сертифікатом: фасонний профіль, сортовий, лист, універсальна смуга чи холодногнутий профіль. Вибір фільтрує допустимі марки й межі товщини за таблицею Г.5 та бере участь у визначенні γm за таблицею 7.2 ДБН В.2.6-198:2014.", options: [{ value: "section", label: "Фасонний" }, { value: "long", label: "Сортовий" }, { value: "sheet", label: "Листовий" }, { value: "universal_plate", label: "Широкосмуговий універсальний" }, { value: "cold_formed", label: "Холодногнутий профіль" }] },
        { id: "steelClass", kind: "select", name: "Клас міцності сталі", defaultValue: steelClass, description: "Оберіть клас міцності, зазначений у специфікації або сертифікаті прокату, наприклад С245. З числової частини класу калькулятор приймає Ryn, перевіряє допустимість сталі для уточненої групи за Г.1 і фільтрує марки за Г.5. Джерело: таблиці 7.1, 7.2, Г.1 і Г.5 ДБН В.2.6-198:2014.", options: STEEL_STRENGTH_CLASSES.map((item) => ({ value: item, label: item })) },
        { id: "steelGradeStandardId", kind: "select", name: "Марка сталі та нормативний документ", defaultValue: gradeOptions[0]?.id ?? "", description: steelGradeStandardDescription, options: gradeOptions.map((item) => ({ value: item.id, label: item.label })) },
        { id: "thicknessMm", kind: "number", name: "Товщина прокату", prefix: "t", defaultValue: "10", min: 0, quantity: "thickness", baseUnit: "mm", defaultDisplayUnit: "mm", description: "Введіть фактичну товщину розрахункового елемента за сортаментом, кресленням або сертифікатом. Товщина перевіряє межі застосування марки за Г.5, окремі умови Г.1 і позиції 9 таблиці 5.1, а понад 20 мм збільшує поправку до показника групи за пунктом А.2 ДБН В.2.6-198:2014." },
      ] },
      { id: "steel-a2", title: "Чинники А.2", fields: [
        { id: "sigmaDynKpa", kind: "number", name: "Найбільше нормальне розтягувальне напруження від динамічних навантажень", prefix: { text: "σ", subscript: "dyn", ariaLabel: "σdyn" }, defaultValue: "0", min: 0, quantity: "pressure", baseUnit: "kpa", defaultDisplayUnit: "mpa", description: "Введіть найбільший модуль нормального розтягувального напруження лише від динамічної складової навантажень, отриманий із розрахунку вже підібраного перерізу. Це чисельник α = |σdyn| / |σsum|, за яким уточнюється категорія напруженого стану. Джерело: пункт А.2 ДБН В.2.6-198:2014.", showWhen: [{ fieldId: "loadType", equals: "dynamic" }, { fieldId: "hasTensileStress", equals: true }] },
        { id: "sigmaSumKpa", kind: "number", name: "Найбільше сумарне нормальне розтягувальне напруження від усіх навантажень", prefix: { text: "σ", subscript: "sum", ariaLabel: "σsum" }, defaultValue: "100000", min: 0, quantity: "pressure", baseUnit: "kpa", defaultDisplayUnit: "mpa", description: "Введіть найбільший модуль сумарного нормального розтягувального напруження від усіх розрахункових навантажень у тій самій точці й для того самого перерізу. Це знаменник α; значення має бути додатним і не меншим за σdyn. Джерело: пункт А.2 ДБН В.2.6-198:2014.", showWhen: { fieldId: "hasTensileStress", equals: true } },
        { id: "sigmaCKpa", kind: "number", name: "Нормальне напруження стиску з урахуванням φ, φe, φb", prefix: { text: "σ", subscript: "c", ariaLabel: "σc" }, defaultValue: "100000", min: 0, quantity: "pressure", baseUnit: "kpa", defaultDisplayUnit: "mpa", description: "Введіть невід’ємний модуль нормального стискального напруження з розрахунку підібраного перерізу, вже приведений з урахуванням відповідного коефіцієнта стійкості φ, φe або φb. Калькулятор перевіряє умову σc ≤ 0,4 Ry γc для зменшення показника на 4 бали. Джерело: пункт А.2 ДБН В.2.6-198:2014.", showWhen: { fieldId: "loadType", equals: "static" } },
        checkbox("hasGuillotineEdges", "Є кромки після гільйотинного різання?", false, "Виберіть «Так», якщо розрахунковий елемент має кромки після гільйотинного різання і їхній вплив не усунуто подальшою обробкою. Калькулятор додає 1 бал до поправки показника групи. Джерело: пункт А.2, другий абзац ДБН В.2.6-198:2014."),
        checkbox("hasUnaccountedColdWork", "Є неврахований у розрахунку наклеп від деформування в холодному стані?", false, "Виберіть «Так», якщо виготовлення спричинило наклеп від холодного деформування, а його вплив не врахований у розрахункових характеристиках. Калькулятор додає 1 бал до поправки показника групи. Джерело: пункт А.2, другий абзац ДБН В.2.6-198:2014."),
        checkbox("hasHighInitialStress", "Є високі початкові напруження, у тому числі зварювальні?", false, "Виберіть «Так», якщо в елементі очікуються високі початкові або залишкові зварювальні напруження, які не враховані окремо. Калькулятор додає 1 бал до поправки показника групи. Джерело: пункт А.2, другий абзац ДБН В.2.6-198:2014."),
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
  return buildNativeDocxReport({ title: REPORT_TITLE, fileBaseName: `kategorii-ta-grupy-stalevykh-konstruktsii-${formatDocxFileDate(date)}`, steps });
}

function NormScan({ alt, id, src }: { alt: string; id?: string; src: string }) {
  return <details className="steel-structure-norm__scan" id={id}><summary>Скан фрагмента ДБН</summary><figure><img src={src} alt={alt} loading="lazy" decoding="async" /></figure></details>;
}

function NormativeReferences() {
  return <section className="native-report" aria-labelledby="steel-structure-norms-title">
    <div className="native-report__head"><h3 id="steel-structure-norms-title">Нормативні посилання</h3></div>
    <div className="native-report__items">
      <article><h4>ДБН В.2.6-198:2014, Додаток А, таблиця А.1</h4><p>Категорії конструкцій за призначенням і за напруженим станом.</p>
        <DbnSourceLink document="dbn-v-2-6-198-2014" />
        <NormScan id="steel-norm-table-a-1" src="/dbn/steel-structure-category-group/dbn-table-a-1-part-1.png" alt="Скан таблиці А.1 з ДБН В.2.6-198:2014, частина 1" />
        <NormScan src="/dbn/steel-structure-category-group/dbn-table-a-1-part-2.png" alt="Скан таблиці А.1 з ДБН В.2.6-198:2014, частина 2" />
        <NormScan src="/dbn/steel-structure-category-group/dbn-table-a-1-part-3.png" alt="Скан таблиці А.1 з ДБН В.2.6-198:2014, частина 3" />
      </article>
      <article><h4>ДБН В.2.6-198:2014, Додаток А, таблиця А.2</h4><p>Показники S1–S5, початкова група та її уточнення.</p>
        <DbnSourceLink document="dbn-v-2-6-198-2014" />
        <NormScan id="steel-norm-table-a-2" src="/dbn/steel-structure-category-group/dbn-table-a-2.png" alt="Скан таблиці А.2 з ДБН В.2.6-198:2014" />
        <NormScan id="steel-norm-a-1-a-2" src="/dbn/steel-structure-category-group/dbn-a-1-a-2-rules-part-1.png" alt="Скан пунктів А.1 і А.2 з ДБН В.2.6-198:2014, частина 1" />
        <NormScan src="/dbn/steel-structure-category-group/dbn-a-1-a-2-rules-part-2.png" alt="Скан пункту А.2 з ДБН В.2.6-198:2014, частина 2" />
      </article>
      <article><h4>ДБН В.2.6-198:2014, пункт 5.4.1, таблиця 5.1</h4><p>Коефіцієнти умов роботи γc та примітки 1–5.</p>
        <DbnSourceLink document="dbn-v-2-6-198-2014" />
        <NormScan id="steel-norm-table-5-1" src="/dbn/steel-structure-category-group/dbn-table-5-1-part-1.png" alt="Скан таблиці 5.1 з ДБН В.2.6-198:2014" />
        <NormScan id="steel-norm-table-5-1-notes" src="/dbn/steel-structure-category-group/dbn-table-5-1-part-2-notes.png" alt="Скан приміток 1–5 до таблиці 5.1 з ДБН В.2.6-198:2014" />
      </article>
      <article><h4>ДБН В.2.6-198:2014, пункти 7.1–7.2, таблиці 7.1–7.2</h4><p>Визначення Ry = Ryn / γm і коефіцієнта надійності за матеріалом γm.</p>
        <DbnSourceLink document="dbn-v-2-6-198-2014" />
        <NormScan id="steel-norm-table-7-1" src="/dbn/steel-structure-category-group/dbn-table-7-1.png" alt="Скан пункту 7.1 і таблиці 7.1 з ДБН В.2.6-198:2014" />
        <NormScan id="steel-norm-table-7-2" src="/dbn/steel-structure-category-group/dbn-table-7-2.png" alt="Скан таблиці 7.2 з ДБН В.2.6-198:2014" />
      </article>
      <article><h4>ДБН В.2.6-198:2014, Додаток Г, таблиця Г.1</h4><p>Допустимість класів сталі для груп конструкцій.</p>
        <DbnSourceLink document="dbn-v-2-6-198-2014" />
        <NormScan id="steel-norm-table-g-1" src="/dbn/steel-structure-category-group/dbn-table-g-1-part-1.png" alt="Скан таблиці Г.1 з ДБН В.2.6-198:2014, частина 1" />
        <NormScan src="/dbn/steel-structure-category-group/dbn-table-g-1-part-2-notes.png" alt="Скан таблиці Г.1 з ДБН В.2.6-198:2014, частина 2 і примітки" />
      </article>
      <article><h4>ДБН В.2.6-198:2014, Додаток Г, таблиця Г.5</h4><p>Відповідність марок сталі класам міцності, виду і товщині прокату.</p>
        <DbnSourceLink document="dbn-v-2-6-198-2014" />
        <NormScan id="steel-norm-table-g-5" src="/dbn/steel-structure-category-group/dbn-table-g-5-part-1.png" alt="Скан таблиці Г.5 з ДБН В.2.6-198:2014, частина 1" />
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
  const summary = report.values ? (
    <div className="steel-structure-category-summary">
      <p>Категорії: {report.values.purposeCategory}/{report.values.stressCategoryBase}</p>
      <p>
        Початкова група: {report.values.groupBase}, <MathNotation base="S" subscript="tot,base" ariaLabel="S_tot,base" /> = {report.values.totalBase}
      </p>
      <p>
        Уточнена група: {report.values.groupA2}, <MathNotation base="S" subscript="tot,A2" ariaLabel="S_tot,A2" /> = {report.values.totalA2}
      </p>
      <p>
        <MathNotation base="γ" subscript="c" ariaLabel="γ_c" /> = {report.values.gammaC}; <MathNotation base="R" subscript="y" ariaLabel="R_y" /> = {report.values.ryMpa.toFixed(2).replace(".", ",")} МПа
      </p>
      <p>Сталь за Г.1: {report.values.steelAllowed ? "дозволено" : "не дозволено"}</p>
    </div>
  ) : null;

  return <NativeCalculatorLayout ariaLabel="Калькулятор категорій і груп сталевих конструкцій" navLinks={[{ href: "#steel-structure-selection", label: "Конструкція" }, { href: "#steel-material", label: "Сталь" }, { href: "#steel-a2", label: "Чинники А.2" }, { href: "#steel-gamma-c", label: "Умови γc" }, { href: "#steel-structure-report-title", label: "Звіт" }, { href: "#steel-structure-norms-title", label: "Норми" }]} summary={summary} controls={<InputSchemaForm schema={schema} values={values} onValuesChange={setNormalizedValues} displayUnits={displayUnits} onDisplayUnitsChange={setDisplayUnits} renderDescription={renderSteelNormText} />} errors={report.errors} warnings={report.warnings}><NativeReport titleId="steel-structure-report-title" title={REPORT_TITLE} steps={report.steps} actions={<ReportDocxButton report={docx} />} renderText={renderSteelNormText} /><NormativeReferences /></NativeCalculatorLayout>;
}
