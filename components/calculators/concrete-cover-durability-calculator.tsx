"use client";

import { useMemo, useState } from "react";

import {
  DEFAULT_CONCRETE_COVER_DURABILITY_INPUT,
  getConcreteCoverDurabilityReport,
  type ConcreteCoverBondMode,
  type ConcreteCoverConstructionClass,
  type ConcreteCoverConstructionClassMode,
  type ConcreteCoverDesignWorkingLife,
  type ConcreteCoverDurabilityInput,
  type ConcreteCoverDurabilityReport,
  type ConcreteCoverReinforcementDurabilityType,
} from "@/lib/concrete-cover-durability";
import type {
  CoverExposureClass,
  ReinforcementPresence,
} from "@/lib/concrete-exposure-class";
import {
  getDefaultInputSchemaValues,
  parseCalculatorDecimal,
  type CalculatorInputDisplayUnit,
  type CalculatorInputSchema,
  type CalculatorInputValues,
} from "@/lib/calculator-input-schema";
import { getConcreteClasses } from "@/lib/materials/concrete";
import {
  buildScene,
  createDefaultRegistry,
  type SceneDefinition,
} from "@/lib/vendor/svgparametric";

import {
  InputSchemaForm,
  type InputSchemaFieldCalculatorActionEvent,
} from "./input-schema-form";
import {
  buildNativeDocxReport,
  formatDocxFileDate,
} from "./native-report-docx";
import { DbnSourceLink } from "./dbn-source-link";
import { NativeCalculatorLayout } from "./native-calculator-layout";
import { NativeReport } from "./native-report";
import { ReportDocxButton } from "./report-docx-button";

const MM_UNIT: CalculatorInputDisplayUnit[] = [
  { value: "mm", label: "мм", factorToBase: 1 },
  { value: "cm", label: "см", factorToBase: 10 },
  { value: "m", label: "м", factorToBase: 1000 },
];

const EXPOSURE_CLASS_OPTIONS = [
  { value: "X0", label: "X0" },
  { value: "XC1", label: "XC1" },
  { value: "XC2", label: "XC2" },
  { value: "XC3", label: "XC3" },
  { value: "XC4", label: "XC4" },
  { value: "XD1", label: "XD1" },
  { value: "XD2", label: "XD2" },
  { value: "XD3", label: "XD3" },
  { value: "XS1", label: "XS1" },
  { value: "XS2", label: "XS2" },
  { value: "XS3", label: "XS3" },
];

const CONSTRUCTION_CLASS_OPTIONS = [
  { value: "S1", label: "S1" },
  { value: "S2", label: "S2" },
  { value: "S3", label: "S3" },
  { value: "S4", label: "S4" },
  { value: "S5", label: "S5" },
  { value: "S6", label: "S6" },
];

const CONCRETE_CLASS_OPTIONS = getConcreteClasses().map((className) => ({
  value: className,
  label: className,
}));

const DELTA_CDEV_DESCRIPTION =
  "Допуск на відхил Δcdev додається до мінімального захисного шару для визначення номінального захисного шару cnom. За п. 4.4.3 ДБН В.2.6-98:2009 товщину мінімального захисного шару необхідно збільшити на абсолютне значення допустимого від'ємного відхилу. Рекомендоване значення за приміткою до п. 4.4.3: Δcdev = 10 мм.";
const SVG_PARAMETRIC_REGISTRY = createDefaultRegistry();

export const CONCRETE_COVER_DURABILITY_INPUT_SCHEMA: CalculatorInputSchema = {
  groups: [
    {
      id: "concrete-cover-context",
      title: "Елемент і середовище",
      fields: [
        {
          id: "elementName",
          kind: "text",
          name: "Назва елемента",
          defaultValue: DEFAULT_CONCRETE_COVER_DURABILITY_INPUT.elementName,
          description:
            "Службова назва елемента для звіту та передачі в калькулятор класу впливу середовища.",
        },
        {
          id: "exposureClass",
          kind: "select",
          name: "Клас впливу середовища",
          defaultValue: DEFAULT_CONCRETE_COVER_DURABILITY_INPUT.exposureClass,
          description:
            "Клас X0, XC, XD або XS використовується для вибору графи таблиць 4.3/4.4 і таблиці 4.5 ДБН В.2.6-98:2009.",
          options: EXPOSURE_CLASS_OPTIONS,
          calculatorAction: { label: "Розрахувати клас впливу" },
        },
        {
          id: "reinforcementDurabilityType",
          kind: "select",
          name: "Тип арматурної сталі для довговічності",
          defaultValue:
            DEFAULT_CONCRETE_COVER_DURABILITY_INPUT.reinforcementDurabilityType,
          description:
            "Для звичайної арматури застосовується табл. 4.3 ДБН В.2.6-98:2009, для попередньо напруженої - табл. 4.4.",
          options: [
            { value: "ordinary", label: "Звичайна" },
            { value: "prestressed", label: "Попередньо напружена" },
          ],
        },
      ],
    },
    {
      id: "concrete-cover-bond",
      title: "cmin,b за зчепленням",
      fields: [
        {
          id: "bondCoverMode",
          kind: "select",
          name: "Спосіб визначення cmin,b",
          defaultValue: DEFAULT_CONCRETE_COVER_DURABILITY_INPUT.bondCoverMode,
          description:
            "Вибір рядка таблиці 4.2 ДБН В.2.6-98:2009 для мінімального захисного шару за вимогами зчеплення.",
          options: [
            { value: "bar", label: "Роздільне розташування стрижнів" },
            { value: "strand", label: "Пасмо" },
            { value: "round-duct", label: "Канал круглий" },
            { value: "rectangular-duct", label: "Канал прямокутний" },
            {
              value: "pre-tensioned-wire",
              label: "Напруження на упори: канат або гладкий дріт",
            },
            {
              value: "pre-tensioned-bar",
              label: "Напруження на упори: стрижень періодичного профілю",
            },
          ],
        },
        {
          id: "barDiameterMm",
          kind: "number",
          prefix: { text: "φ", ariaLabel: "φ" },
          name: "Діаметр стрижня",
          defaultValue: String(DEFAULT_CONCRETE_COVER_DURABILITY_INPUT.barDiameterMm),
          min: 0,
          step: "1",
          baseUnit: "mm",
          defaultDisplayUnit: "mm",
          displayUnits: MM_UNIT,
          description:
            "Діаметр окремого стрижня φ для рядка таблиці 4.2: cmin,b дорівнює діаметру стрижня.",
          showWhen: { fieldId: "bondCoverMode", equals: "bar" },
        },
        {
          id: "strandEquivalentDiameterMm",
          kind: "number",
          prefix: { text: "φ", subscript: "p", ariaLabel: "φp" },
          name: "Еквівалентний діаметр пасма",
          defaultValue: String(
            DEFAULT_CONCRETE_COVER_DURABILITY_INPUT.strandEquivalentDiameterMm,
          ),
          min: 0,
          step: "0.1",
          baseUnit: "mm",
          defaultDisplayUnit: "mm",
          displayUnits: MM_UNIT,
          description:
            "Еквівалентний діаметр пасма φp для рядка таблиці 4.2 ДБН В.2.6-98:2009.",
          showWhen: { fieldId: "bondCoverMode", equals: "strand" },
        },
        {
          id: "roundDuctDiameterMm",
          kind: "number",
          prefix: { text: "d", subscript: "duct", ariaLabel: "dduct" },
          name: "Діаметр круглого каналу",
          defaultValue: String(
            DEFAULT_CONCRETE_COVER_DURABILITY_INPUT.roundDuctDiameterMm,
          ),
          min: 0,
          step: "1",
          baseUnit: "mm",
          defaultDisplayUnit: "mm",
          displayUnits: MM_UNIT,
          description:
            "Діаметр круглого каналу dduct; за табл. 4.2 cmin,b приймається рівним діаметру каналу.",
          showWhen: { fieldId: "bondCoverMode", equals: "round-duct" },
        },
        {
          id: "rectangularDuctShortSideMm",
          kind: "number",
          prefix: { text: "a", subscript: "duct", ariaLabel: "aduct" },
          name: "Менша сторона прямокутного каналу",
          defaultValue: String(
            DEFAULT_CONCRETE_COVER_DURABILITY_INPUT.rectangularDuctShortSideMm,
          ),
          min: 0,
          step: "1",
          baseUnit: "mm",
          defaultDisplayUnit: "mm",
          displayUnits: MM_UNIT,
          description:
            "Менша сторона прямокутного каналу aduct для визначення cmin,b за табл. 4.2.",
          showWhen: { fieldId: "bondCoverMode", equals: "rectangular-duct" },
        },
        {
          id: "rectangularDuctLongSideMm",
          kind: "number",
          prefix: { text: "b", subscript: "duct", ariaLabel: "bduct" },
          name: "Більша сторона прямокутного каналу",
          defaultValue: String(
            DEFAULT_CONCRETE_COVER_DURABILITY_INPUT.rectangularDuctLongSideMm,
          ),
          min: 0,
          step: "1",
          baseUnit: "mm",
          defaultDisplayUnit: "mm",
          displayUnits: MM_UNIT,
          description:
            "Більша сторона прямокутного каналу bduct; у табл. 4.2 використовується більша величина з aduct та bduct / 2.",
          showWhen: { fieldId: "bondCoverMode", equals: "rectangular-duct" },
        },
        {
          id: "preTensionedElementDiameterMm",
          kind: "number",
          prefix: { text: "d", subscript: "p", ariaLabel: "dp" },
          name: "Діаметр елемента при напруженні на упори",
          defaultValue: String(
            DEFAULT_CONCRETE_COVER_DURABILITY_INPUT.preTensionedElementDiameterMm,
          ),
          min: 0,
          step: "1",
          baseUnit: "mm",
          defaultDisplayUnit: "mm",
          displayUnits: MM_UNIT,
          description:
            "Діаметр каната, гладкого дроту або стрижня dp для рядків таблиці 4.2 при напруженні на упори.",
          showWhen: {
            fieldId: "bondCoverMode",
            in: ["pre-tensioned-wire", "pre-tensioned-bar"],
          },
        },
        {
          id: "aggregateMaxSizeMm",
          kind: "number",
          prefix: { text: "D", subscript: "max", ariaLabel: "Dmax" },
          name: "Номінальний максимальний розмір заповнювача",
          defaultValue: String(
            DEFAULT_CONCRETE_COVER_DURABILITY_INPUT.aggregateMaxSizeMm,
          ),
          min: 0,
          step: "1",
          baseUnit: "mm",
          defaultDisplayUnit: "mm",
          displayUnits: MM_UNIT,
          description:
            "Якщо Dmax перевищує 32 мм, примітка до табл. 4.2 вимагає збільшити cmin,b на 5 мм.",
        },
      ],
    },
    {
      id: "concrete-cover-construction-class",
      title: "Клас конструкції S",
      fields: [
        {
          id: "constructionClassMode",
          kind: "select",
          name: "Спосіб визначення класу конструкції S",
          defaultValue:
            DEFAULT_CONCRETE_COVER_DURABILITY_INPUT.constructionClassMode,
          description:
            "Клас конструкції S можна прийняти вручну або визначити автоматично за п. 4.4.2.4.3 і табл. 4.5 ДБН В.2.6-98:2009.",
          options: [
            { value: "automatic", label: "Автоматично за табл. 4.5" },
            { value: "manual", label: "Вручну" },
          ],
        },
        {
          id: "manualConstructionClass",
          kind: "select",
          name: "Клас конструкції вручну",
          defaultValue:
            DEFAULT_CONCRETE_COVER_DURABILITY_INPUT.manualConstructionClass,
          description:
            "Клас конструкції S, прийнятий користувачем без автоматичних поправок за табл. 4.5.",
          options: CONSTRUCTION_CLASS_OPTIONS,
          showWhen: { fieldId: "constructionClassMode", equals: "manual" },
        },
        {
          id: "designWorkingLife",
          kind: "select",
          name: "Розрахунковий строк експлуатації",
          defaultValue: DEFAULT_CONCRETE_COVER_DURABILITY_INPUT.designWorkingLife,
          description:
            "За п. 4.4.2.4.3 для строку 50 років приймається S4, для 100 років клас збільшується на 2.",
          options: [
            { value: "50", label: "50 років" },
            { value: "100", label: "100 років" },
          ],
          showWhen: { fieldId: "constructionClassMode", equals: "automatic" },
        },
        {
          id: "concreteClass",
          kind: "select",
          name: "Клас міцності бетону",
          defaultValue: DEFAULT_CONCRETE_COVER_DURABILITY_INPUT.concreteClass,
          description:
            "Клас міцності бетону використовується для зменшення класу конструкції S за табл. 4.5, якщо він не нижчий за наведений у таблиці поріг.",
          options: CONCRETE_CLASS_OPTIONS,
          showWhen: { fieldId: "constructionClassMode", equals: "automatic" },
        },
        {
          id: "isSlabElement",
          kind: "checkbox",
          name: "Елемент має форму плити",
          defaultValue: DEFAULT_CONCRETE_COVER_DURABILITY_INPUT.isSlabElement,
          description:
            "Для елементів форми плити табл. 4.5 дозволяє зменшити клас конструкції на 1.",
          showWhen: { fieldId: "constructionClassMode", equals: "automatic" },
        },
        {
          id: "hasSpecialQualityControl",
          kind: "checkbox",
          name: "Забезпечено спеціальний контроль якості виготовлення бетону",
          defaultValue:
            DEFAULT_CONCRETE_COVER_DURABILITY_INPUT.hasSpecialQualityControl,
          description:
            "За табл. 4.5 спеціальний контроль якості виготовлення бетону дозволяє зменшити клас конструкції на 1.",
          showWhen: { fieldId: "constructionClassMode", equals: "automatic" },
        },
      ],
    },
    {
      id: "concrete-cover-adjustments",
      title: "Поправки та допуск",
      fields: [
        {
          id: "deltaCdurGammaMm",
          kind: "number",
          prefix: { text: "Δc", subscript: "dur,γ", ariaLabel: "Δcdur,γ" },
          name: "Поправка на надійність при застосуванні добавок",
          defaultValue: String(
            DEFAULT_CONCRETE_COVER_DURABILITY_INPUT.deltaCdurGammaMm,
          ),
          min: 0,
          step: "1",
          baseUnit: "mm",
          defaultDisplayUnit: "mm",
          displayUnits: MM_UNIT,
          description:
            "Додатна поправка Δcdur,γ входить у формулу (4.2) для мінімального захисного шару.",
        },
        {
          id: "deltaCdurStMm",
          kind: "number",
          prefix: { text: "Δc", subscript: "dur,st", ariaLabel: "Δcdur,st" },
          name: "Зменшення при застосуванні нержавіючої сталі",
          defaultValue: String(DEFAULT_CONCRETE_COVER_DURABILITY_INPUT.deltaCdurStMm),
          min: 0,
          step: "1",
          baseUnit: "mm",
          defaultDisplayUnit: "mm",
          displayUnits: MM_UNIT,
          description:
            "Зменшення Δcdur,st входить у формулу (4.2) при застосуванні нержавіючої сталі.",
        },
        {
          id: "deltaCdurAddMm",
          kind: "number",
          prefix: { text: "Δc", subscript: "dur,add", ariaLabel: "Δcdur,add" },
          name: "Зменшення при додатковому захисті",
          defaultValue: String(
            DEFAULT_CONCRETE_COVER_DURABILITY_INPUT.deltaCdurAddMm,
          ),
          min: 0,
          step: "1",
          baseUnit: "mm",
          defaultDisplayUnit: "mm",
          displayUnits: MM_UNIT,
          description:
            "Зменшення Δcdur,add входить у формулу (4.2) при додатковому захисті арматури.",
        },
        {
          id: "deltaCdevMm",
          kind: "number",
          prefix: { text: "Δc", subscript: "dev", ariaLabel: "Δcdev" },
          name: "Допуск на відхил",
          defaultValue: String(DEFAULT_CONCRETE_COVER_DURABILITY_INPUT.deltaCdevMm),
          min: 0,
          step: "1",
          baseUnit: "mm",
          defaultDisplayUnit: "mm",
          displayUnits: MM_UNIT,
          description: DELTA_CDEV_DESCRIPTION,
        },
      ],
    },
  ],
};

function parseNumberInput(value: unknown): number {
  return typeof value === "string" ? parseCalculatorDecimal(value) : Number.NaN;
}

function getSearchParam(name: string): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get(name);
}

function isCoverExposureClass(value: string | null): value is CoverExposureClass {
  return [
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
  ].includes(value ?? "");
}

function getStringValue(
  values: CalculatorInputValues,
  key: string,
  fallback: string,
): string {
  const value = values[key];
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

export function getConcreteCoverDurabilityInitialValues(): CalculatorInputValues {
  const values = getDefaultInputSchemaValues(
    CONCRETE_COVER_DURABILITY_INPUT_SCHEMA,
  );
  const exposureClass = getSearchParam("exposureClass");
  const sourceExposureClasses = getSearchParam("sourceExposureClasses");
  const sourceCalculator = getSearchParam("sourceCalculator");

  if (isCoverExposureClass(exposureClass)) values.exposureClass = exposureClass;
  if (sourceExposureClasses) values.sourceExposureClasses = sourceExposureClasses;
  if (sourceCalculator === "concrete-exposure-class") {
    values.sourceCalculator = sourceCalculator;
  }

  return values;
}

function inputFromValues(values: CalculatorInputValues): ConcreteCoverDurabilityInput {
  const sourceExposureClasses =
    typeof values.sourceExposureClasses === "string"
      ? values.sourceExposureClasses
      : undefined;
  const sourceCalculator =
    values.sourceCalculator === "concrete-exposure-class"
      ? "concrete-exposure-class"
      : undefined;

  return {
    elementName: getStringValue(
      values,
      "elementName",
      DEFAULT_CONCRETE_COVER_DURABILITY_INPUT.elementName,
    ),
    exposureClass: getStringValue(
      values,
      "exposureClass",
      DEFAULT_CONCRETE_COVER_DURABILITY_INPUT.exposureClass,
    ) as CoverExposureClass,
    reinforcementDurabilityType: getStringValue(
      values,
      "reinforcementDurabilityType",
      DEFAULT_CONCRETE_COVER_DURABILITY_INPUT.reinforcementDurabilityType,
    ) as ConcreteCoverReinforcementDurabilityType,
    bondCoverMode: getStringValue(
      values,
      "bondCoverMode",
      DEFAULT_CONCRETE_COVER_DURABILITY_INPUT.bondCoverMode,
    ) as ConcreteCoverBondMode,
    barDiameterMm: parseNumberInput(values.barDiameterMm),
    strandEquivalentDiameterMm: parseNumberInput(values.strandEquivalentDiameterMm),
    roundDuctDiameterMm: parseNumberInput(values.roundDuctDiameterMm),
    rectangularDuctShortSideMm: parseNumberInput(
      values.rectangularDuctShortSideMm,
    ),
    rectangularDuctLongSideMm: parseNumberInput(values.rectangularDuctLongSideMm),
    preTensionedElementDiameterMm: parseNumberInput(
      values.preTensionedElementDiameterMm,
    ),
    aggregateMaxSizeMm: parseNumberInput(values.aggregateMaxSizeMm),
    constructionClassMode: getStringValue(
      values,
      "constructionClassMode",
      DEFAULT_CONCRETE_COVER_DURABILITY_INPUT.constructionClassMode,
    ) as ConcreteCoverConstructionClassMode,
    manualConstructionClass: getStringValue(
      values,
      "manualConstructionClass",
      DEFAULT_CONCRETE_COVER_DURABILITY_INPUT.manualConstructionClass,
    ) as ConcreteCoverConstructionClass,
    designWorkingLife: getStringValue(
      values,
      "designWorkingLife",
      DEFAULT_CONCRETE_COVER_DURABILITY_INPUT.designWorkingLife,
    ) as ConcreteCoverDesignWorkingLife,
    concreteClass: getStringValue(
      values,
      "concreteClass",
      DEFAULT_CONCRETE_COVER_DURABILITY_INPUT.concreteClass,
    ),
    isSlabElement: values.isSlabElement === true,
    hasSpecialQualityControl: values.hasSpecialQualityControl === true,
    deltaCdurGammaMm: parseNumberInput(values.deltaCdurGammaMm),
    deltaCdurStMm: parseNumberInput(values.deltaCdurStMm),
    deltaCdurAddMm: parseNumberInput(values.deltaCdurAddMm),
    deltaCdevMm: parseNumberInput(values.deltaCdevMm),
    ...(sourceExposureClasses ? { sourceExposureClasses } : {}),
    ...(sourceCalculator ? { sourceCalculator } : {}),
  };
}

export function buildConcreteCoverDurabilityDocxReport(
  report: ConcreteCoverDurabilityReport,
  date = new Date(),
) {
  return buildNativeDocxReport({
    title: "Покроковий звіт",
    fileBaseName: `zakhysnyi-shar-betonu-${formatDocxFileDate(date)}`,
    steps: report.steps,
  });
}

type ConcreteCoverDetailFigure = {
  title: string;
  caption: string;
  svg: string;
};

function formatDiagramNumber(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("uk-UA", {
    maximumFractionDigits: 1,
  }).format(value);
}

function sanitizePositiveDiagramValue(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getCoverDetailDiameterMm(input: ConcreteCoverDurabilityInput): number {
  switch (input.bondCoverMode) {
    case "strand":
      return input.strandEquivalentDiameterMm;
    case "round-duct":
      return input.roundDuctDiameterMm;
    case "rectangular-duct":
      return Math.max(input.rectangularDuctShortSideMm, input.rectangularDuctLongSideMm / 2);
    case "pre-tensioned-wire":
    case "pre-tensioned-bar":
      return input.preTensionedElementDiameterMm;
    case "bar":
    default:
      return input.barDiameterMm;
  }
}

function getConcreteCoverDetailScene({
  coverToCenterMm,
  diameterMm,
}: {
  coverToCenterMm: number;
  diameterMm: number;
}): SceneDefinition {
  const safeDiameterMm = sanitizePositiveDiagramValue(diameterMm, 16);
  const safeCoverToCenterMm = Math.max(
    safeDiameterMm / 2,
    sanitizePositiveDiagramValue(coverToCenterMm, 34),
  );
  const rebarCenterX = 68 + safeCoverToCenterMm;
  const rebarCenterY = 178;
  const sceneWidth = Math.ceil(rebarCenterX + 370);
  const sceneHeight = Math.ceil(rebarCenterY + safeCoverToCenterMm + 98);

  return {
    scene: {
      width: sceneWidth,
      height: sceneHeight,
      mode: "detailed",
    },
    objects: {
      coverDetail: {
        type: "CornerRebarDetail",
        params: {
          x: rebarCenterX,
          y: rebarCenterY,
          rebarDiameter: safeDiameterMm,
          coverToCenter: safeCoverToCenterMm,
          stirrupDiameter: Math.max(6, Math.min(12, safeDiameterMm / 2)),
          stirrupGap: 6,
          stirrupHorizontalLength: 260,
          stirrupVerticalLength: 190,
          concreteTopExtension: 210,
          showDimensions: true,
          concreteColor: "#1f2937",
          breakColor: "#64748b",
          stirrupColor: "#e95a0c",
          stirrupFill: "#fff7ed",
          rebarFill: "#d8c4ff",
          rebarColor: "#7a3ea0",
          dimensionColor: "#1f2937",
        },
      },
    },
  };
}

function buildConcreteCoverDetailFigure(
  report: ConcreteCoverDurabilityReport,
): ConcreteCoverDetailFigure | null {
  if (!report.valid || !report.values) return null;

  const diameterMm = sanitizePositiveDiagramValue(
    getCoverDetailDiameterMm(report.input),
    DEFAULT_CONCRETE_COVER_DURABILITY_INPUT.barDiameterMm,
  );
  const nominalCoverMm = report.values.nominalCoverMm;
  const coverToCenterMm = nominalCoverMm + diameterMm / 2;
  const title = `Параметричний вузол захисного шару: cnom ${formatDiagramNumber(
    nominalCoverMm,
  )} мм, d ${formatDiagramNumber(diameterMm)} мм, a ${formatDiagramNumber(
    coverToCenterMm,
  )} мм`;
  const svg = buildScene(
    getConcreteCoverDetailScene({ coverToCenterMm, diameterMm }),
    SVG_PARAMETRIC_REGISTRY,
  ).svg.replace(
    "<svg ",
    `<svg role="img" aria-label="${title}" class="concrete-cover-durability-diagram__svg" `,
  );

  return {
    title,
    svg,
    caption: `Параметричний вузол: cnom = ${formatDiagramNumber(
      nominalCoverMm,
    )} мм; d = ${formatDiagramNumber(diameterMm)} мм; a = ${formatDiagramNumber(
      coverToCenterMm,
    )} мм.`,
  };
}

function ConcreteCoverDetailDiagram({
  figure,
}: {
  figure: ConcreteCoverDetailFigure;
}) {
  return (
    <figure className="concrete-cover-durability-diagram">
      <div
        className="concrete-cover-durability-diagram__canvas"
        dangerouslySetInnerHTML={{ __html: figure.svg }}
      />
      <figcaption>{figure.caption}</figcaption>
    </figure>
  );
}

function getExposureCalculatorUrl(values: CalculatorInputValues): string {
  const params = new URLSearchParams();
  params.set("returnTo", "/calculator/concrete-cover-durability");
  params.set("returnField", "exposureClass");
  params.set("returnLabel", "Розрахунок захисного шару");
  params.set("elementName", String(values.elementName ?? "Елемент"));
  params.set("elementType", "other");
  params.set(
    "reinforcementPresence",
    "reinforced_or_embedded_metal" satisfies ReinforcementPresence,
  );
  params.set("currentExposureClass", String(values.exposureClass ?? "XC1"));
  return `/calculator/concrete-exposure-class?${params.toString()}`;
}

function handleFieldCalculatorAction(event: InputSchemaFieldCalculatorActionEvent) {
  if (event.fieldId !== "exposureClass") return;
  window.location.assign(getExposureCalculatorUrl(event.values));
}

function NormScan({ alt, src }: { alt: string; src: string }) {
  return (
    <details className="concrete-cover-durability-norm__scan">
      <summary>Скан фрагмента ДБН</summary>
      <figure>
        <img src={src} alt={alt} loading="lazy" decoding="async" />
      </figure>
    </details>
  );
}

function ConcreteCoverDurabilityNorms() {
  return (
    <section
      className="native-report concrete-cover-durability-norms"
      aria-labelledby="concrete-cover-durability-norms-title"
    >
      <div className="native-report__head">
        <h3 id="concrete-cover-durability-norms-title">Нормативні посилання</h3>
      </div>
      <div className="concrete-cover-durability-norms__list">
        <article className="concrete-cover-durability-norm" id="concrete-cover-norm-formula-4-2">
          <h4>п. 4.4.2.2, формула (4.2) ДБН В.2.6-98:2009</h4>
          <DbnSourceLink document="dbn-v-2-6-98-2009" />
          <NormScan
            alt="Скан п. 4.4.2.2 і формули (4.2) з ДБН В.2.6-98:2009"
            src="/dbn/concrete-cover-durability/dbn-4-4-2-2-formula-4-2.png"
          />
        </article>
        <article className="concrete-cover-durability-norm" id="concrete-cover-norm-table-4-2">
          <h4>п. 4.4.2.3, таблиця 4.2 ДБН В.2.6-98:2009</h4>
          <DbnSourceLink document="dbn-v-2-6-98-2009" />
          <NormScan
            alt="Скан п. 4.4.2.3 і таблиці 4.2 з ДБН В.2.6-98:2009"
            src="/dbn/concrete-cover-durability/dbn-table-4-2.png"
          />
        </article>
        <article className="concrete-cover-durability-norm" id="concrete-cover-norm-table-4-3">
          <h4>п. 4.4.2.4.1, таблиця 4.3 ДБН В.2.6-98:2009</h4>
          <DbnSourceLink document="dbn-v-2-6-98-2009" />
          <NormScan
            alt="Скан таблиці 4.3 з ДБН В.2.6-98:2009"
            src="/dbn/concrete-cover-durability/dbn-table-4-3.png"
          />
        </article>
        <article className="concrete-cover-durability-norm" id="concrete-cover-norm-table-4-4">
          <h4>п. 4.4.2.4.2, таблиця 4.4 ДБН В.2.6-98:2009</h4>
          <DbnSourceLink document="dbn-v-2-6-98-2009" />
          <NormScan
            alt="Скан таблиці 4.4 з ДБН В.2.6-98:2009"
            src="/dbn/concrete-cover-durability/dbn-table-4-4.png"
          />
        </article>
        <article className="concrete-cover-durability-norm" id="concrete-cover-norm-table-4-5">
          <h4>п. 4.4.2.4.3, таблиця 4.5 ДБН В.2.6-98:2009</h4>
          <DbnSourceLink document="dbn-v-2-6-98-2009" />
          <NormScan
            alt="Скан таблиці 4.5 з ДБН В.2.6-98:2009"
            src="/dbn/concrete-cover-durability/dbn-table-4-5.png"
          />
        </article>
        <article className="concrete-cover-durability-norm" id="concrete-cover-norm-45-mm">
          <h4>п. 4.4.2.4.4 ДБН В.2.6-98:2009</h4>
          <DbnSourceLink document="dbn-v-2-6-98-2009" />
          <NormScan
            alt="Скан п. 4.4.2.4.4 з ДБН В.2.6-98:2009"
            src="/dbn/concrete-cover-durability/dbn-4-4-2-4-4.png"
          />
        </article>
        <article className="concrete-cover-durability-norm" id="concrete-cover-norm-cdev">
          <h4>п. 4.4.3 ДБН В.2.6-98:2009</h4>
          <DbnSourceLink document="dbn-v-2-6-98-2009" />
          <NormScan
            alt="Скан п. 4.4.3 з ДБН В.2.6-98:2009"
            src="/dbn/concrete-cover-durability/dbn-4-4-3.png"
          />
        </article>
      </div>
    </section>
  );
}

export function ConcreteCoverDurabilityCalculator() {
  const [inputValues, setInputValues] = useState<CalculatorInputValues>(() =>
    getConcreteCoverDurabilityInitialValues(),
  );
  const input = useMemo(() => inputFromValues(inputValues), [inputValues]);
  const report = useMemo(() => getConcreteCoverDurabilityReport(input), [input]);
  const docxReport = useMemo(
    () => buildConcreteCoverDurabilityDocxReport(report),
    [report],
  );
  const detailFigure = useMemo(() => buildConcreteCoverDetailFigure(report), [report]);
  const resultSummary =
    report.valid && report.values ? (
      <div className="concrete-cover-durability-summary" aria-live="polite">
        <p>Мінімальний захисний шар: cmin = {report.values.minimumCoverMm} мм</p>
        <p>
          Номінальний захисний шар для креслень: cnom ={" "}
          {report.values.nominalCoverMm} мм
        </p>
      </div>
    ) : null;

  return (
    <NativeCalculatorLayout
      ariaLabel="Калькулятор захисного шару бетону для арматури"
      navLinks={[
        { href: "#concrete-cover-context", label: "Елемент" },
        { href: "#concrete-cover-bond", label: "Зчеплення" },
        { href: "#concrete-cover-construction-class", label: "Клас S" },
        { href: "#concrete-cover-adjustments", label: "Поправки" },
        { href: "#native-calculator-diagrams-title", label: "Рисунок" },
        { href: "#concrete-cover-durability-report-title", label: "Звіт" },
        { href: "#concrete-cover-durability-norms-title", label: "Норми" },
      ]}
      summary={resultSummary}
      controls={
        <InputSchemaForm
          schema={CONCRETE_COVER_DURABILITY_INPUT_SCHEMA}
          values={inputValues}
          onValuesChange={setInputValues}
          onFieldCalculatorAction={handleFieldCalculatorAction}
        />
      }
      errors={report.errors}
      warnings={report.warnings}
      diagrams={
        detailFigure ? <ConcreteCoverDetailDiagram figure={detailFigure} /> : null
      }
    >
      <NativeReport
        titleId="concrete-cover-durability-report-title"
        title="Покроковий звіт"
        steps={report.steps}
        actions={report.values ? <ReportDocxButton report={docxReport} /> : undefined}
      />
      <ConcreteCoverDurabilityNorms />
    </NativeCalculatorLayout>
  );
}
