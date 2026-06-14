"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import {
  SOIL_TYPE_LABELS,
  formatSoilDesignResistanceNumber,
  getSoilDesignResistanceReport,
  type SoilCalculationMode,
  type SoilDesignResistanceInput,
  type SoilDesignResistanceReportStep,
  type SoilStrengthSource,
  type SoilStructuralScheme,
  type SoilType,
} from "@/lib/soil-design-resistance";
import {
  getDefaultInputSchemaValues,
  type CalculatorInputSchema,
  type CalculatorInputValues,
} from "@/lib/calculator-input-schema";
import {
  buildScene,
  createDefaultRegistry,
  type SceneDefinition,
} from "@/lib/vendor/svgparametric";

import { InputSchemaForm } from "./input-schema-form";
import { MathNotation } from "./math-notation";
import { ReportFormula } from "./report-formula";

const SOIL_TYPES = Object.keys(SOIL_TYPE_LABELS) as SoilType[];
const CLAYEY_SOIL_TYPES: SoilType[] = ["coarse-with-clayey-fill", "clayey-soil"];

const NORM_LINKS = [
  { text: "формула (Е.1)", id: "soil-norm-e1" },
  { text: "формулою (Е.2)", id: "soil-norm-e2" },
  { text: "табл. Е.7", id: "soil-norm-table-e7" },
  { text: "табл. Е.8", id: "soil-norm-table-e8" },
  { text: "п. Е.4", id: "soil-norm-e4" },
  { text: "приміткою 1", id: "soil-norm-table-e7-note-1" },
] as const;

const SOIL_TYPE_OPTIONS = SOIL_TYPES.map((type) => ({
  value: type,
  label: SOIL_TYPE_LABELS[type],
}));

export const SOIL_INPUT_SCHEMA: CalculatorInputSchema = {
  groups: [
    {
      id: "soil-resistance-working",
      title: "Умови роботи",
      fields: [
        {
          id: "calculationMode",
          kind: "select",
          name: "Спосіб розрахунку",
          defaultValue: "manual-e7",
          description:
            "В автоматичному режимі γc1 і γc2 підбираються за табл. Е.7 ДБН В.2.1-10 залежно від типу ґрунту, конструктивної схеми та L/H. У ручному режимі користувач задає ці коефіцієнти самостійно.",
          options: [
            { value: "automatic", label: "Автоматично за характеристиками ґрунту" },
            { value: "manual-e7", label: "Вручну за табл. Е.7" },
          ],
        },
        {
          id: "gammaC1Manual",
          kind: "number",
          prefix: { text: "γ", subscript: "c1", ariaLabel: "γc1" },
          name: "Коефіцієнт умов роботи 1",
          defaultValue: "1",
          min: 0,
          step: "0.01",
          quantity: "coefficient",
          description:
            "Коефіцієнт умов роботи γc1, який користувач приймає вручну за табл. Е.7 ДБН В.2.1-10-2009 у режимі ручного розрахунку.",
          showWhen: { fieldId: "calculationMode", equals: "manual-e7" },
        },
        {
          id: "gammaC2Manual",
          kind: "number",
          prefix: { text: "γ", subscript: "c2", ariaLabel: "γc2" },
          name: "Коефіцієнт умов роботи 2",
          defaultValue: "1",
          min: 0,
          step: "0.01",
          quantity: "coefficient",
          description:
            "Коефіцієнт умов роботи γc2, який користувач приймає вручну за табл. Е.7 ДБН В.2.1-10-2009 у режимі ручного розрахунку.",
          showWhen: { fieldId: "calculationMode", equals: "manual-e7" },
        },
        {
          id: "structuralScheme",
          kind: "select",
          name: "Конструктивна схема споруди",
          defaultValue: "rigid",
          description:
            "Конструктивна схема споруди використовується для вибору γc2 за примітками 1-3 до табл. Е.7 ДБН В.2.1-10-2009.",
          options: [
            { value: "rigid", label: "Жорстка" },
            { value: "flexible", label: "Гнучка" },
          ],
          showWhen: { fieldId: "calculationMode", equals: "automatic" },
        },
        {
          id: "buildingLengthM",
          kind: "number",
          prefix: { text: "L", ariaLabel: "L" },
          name: "Довжина споруди",
          defaultValue: "8.25",
          min: 0,
          step: "0.01",
          quantity: "length",
          baseUnit: "m",
          defaultDisplayUnit: "m",
          description:
            "Довжина споруди або її відсіку L у базовій одиниці м; використовується у відношенні L/H для вибору γc2 за табл. Е.7 ДБН В.2.1-10-2009.",
          showWhen: { fieldId: "calculationMode", equals: "automatic" },
        },
        {
          id: "buildingHeightM",
          kind: "number",
          prefix: { text: "H", ariaLabel: "H" },
          name: "Висота споруди",
          defaultValue: "3",
          min: 0,
          step: "0.01",
          quantity: "length",
          baseUnit: "m",
          defaultDisplayUnit: "m",
          description:
            "Висота споруди або її відсіку H у базовій одиниці м; використовується у відношенні L/H для вибору γc2 за табл. Е.7 ДБН В.2.1-10-2009.",
          showWhen: { fieldId: "calculationMode", equals: "automatic" },
        },
        {
          id: "soilType",
          kind: "select",
          name: "Тип ґрунту",
          defaultValue: "medium-sand",
          description:
            "Тип ґрунту визначає рядок табл. Е.7 ДБН В.2.1-10-2009 для автоматичного прийняття γc1 і γc2.",
          options: SOIL_TYPE_OPTIONS,
          showWhen: { fieldId: "calculationMode", equals: "automatic" },
        },
        {
          id: "liquidityIndex",
          kind: "number",
          prefix: { text: "I", subscript: "L", ariaLabel: "IL" },
          name: "Показник текучості",
          defaultValue: "0.3",
          step: "0.01",
          quantity: "coefficient",
          description:
            "Показник текучості IL показується для глинистих ґрунтів або глинистого заповнювача і визначає рядок табл. Е.7 ДБН В.2.1-10-2009.",
          showWhen: [
            { fieldId: "calculationMode", equals: "automatic" },
            { fieldId: "soilType", in: CLAYEY_SOIL_TYPES },
          ],
        },
      ],
    },
    {
      id: "soil-resistance-strength",
      title: "Характеристики ґрунту",
      fields: [
        {
          id: "phi11Deg",
          kind: "number",
          prefix: { text: "φ", subscript: "11", ariaLabel: "φ11" },
          name: "Кут внутрішнього тертя",
          defaultValue: "30",
          min: 0,
          step: "0.01",
          quantity: "angle",
          baseUnit: "deg",
          defaultDisplayUnit: "deg",
          displayUnits: [{ value: "deg", label: "°", factorToBase: 1 }],
          description:
            "Кут внутрішнього тертя φ11 у градусах; за ним визначаються Mγ, Mq і Mc за табл. Е.8 ДБН В.2.1-10-2009.",
        },
        {
          id: "gamma11KnM3",
          kind: "number",
          prefix: { text: "γ", subscript: "11", ariaLabel: "γ11" },
          name: "Питома вага ґрунту нижче підошви",
          defaultValue: "17.1",
          min: 0,
          step: "0.01",
          quantity: "unitWeight",
          baseUnit: "kn-m3",
          defaultDisplayUnit: "kn-m3",
          description:
            "Питома вага ґрунту нижче підошви γ11 у базовій одиниці кН/м³; входить до формули (Е.1) ДБН В.2.1-10-2009.",
        },
        {
          id: "gammaPrime11KnM3",
          kind: "number",
          prefix: { text: "γ′", subscript: "11", ariaLabel: "γ′11" },
          name: "Осереднена питома вага вище підошви",
          defaultValue: "16.6",
          min: 0,
          step: "0.01",
          quantity: "unitWeight",
          baseUnit: "kn-m3",
          defaultDisplayUnit: "kn-m3",
          description:
            "Осереднена питома вага ґрунту вище підошви γ′11 у базовій одиниці кН/м³; входить до формули (Е.1) і формули (Е.2) ДБН В.2.1-10-2009.",
        },
        {
          id: "c11KPa",
          kind: "number",
          prefix: { text: "c", subscript: "11", ariaLabel: "c11" },
          name: "Питоме зчеплення",
          defaultValue: "4",
          min: 0,
          step: "0.01",
          quantity: "pressure",
          baseUnit: "kpa",
          defaultDisplayUnit: "kpa",
          description:
            "Питоме зчеплення c11 у базовій одиниці кПа; входить до формули (Е.1) ДБН В.2.1-10-2009.",
        },
        {
          id: "strengthSource",
          kind: "select",
          name: "Спосіб визначення φ11 і c11",
          defaultValue: "direct-testing",
          description:
            "Спосіб визначення φ11 і c11 впливає на коефіцієнт k за п. Е.4 ДБН В.2.1-10-2009.",
          options: [
            {
              value: "direct-testing",
              label: "Визначені безпосередніми випробуваннями",
            },
            {
              value: "appendix-b-tables",
              label: "Прийняті за таблицями В.1-В.2",
            },
          ],
        },
      ],
    },
    {
      id: "soil-resistance-geometry",
      title: "Геометрія фундаменту",
      fields: [
        {
          id: "foundationWidthM",
          kind: "number",
          prefix: { text: "b", ariaLabel: "b" },
          name: "Ширина підошви",
          defaultValue: "1",
          min: 0,
          step: "0.01",
          quantity: "length",
          baseUnit: "m",
          defaultDisplayUnit: "m",
          description:
            "Ширина підошви фундаменту b у базовій одиниці м; використовується у формулі (Е.1) та для визначення kz за п. Е.4 ДБН В.2.1-10-2009.",
        },
        {
          id: "foundationDepthM",
          kind: "number",
          prefix: { text: "d", ariaLabel: "d" },
          name: "Глибина закладання",
          defaultValue: "1.2",
          min: 0,
          step: "0.01",
          quantity: "length",
          baseUnit: "m",
          defaultDisplayUnit: "m",
          description:
            "Глибина закладання d у базовій одиниці м; використовується для перевірки умови d1 <= d за приміткою 6 до п. Е.4 ДБН В.2.1-10-2009.",
        },
      ],
    },
    {
      id: "soil-resistance-basement",
      title: "Підвал і глибина закладання",
      fields: [
        {
          id: "hasBasement",
          kind: "checkbox",
          name: "Є підвал?",
          defaultValue: false,
          description:
            "Вмикає розрахунок приведеної глибини закладання за формулою (Е.2) ДБН В.2.1-10 для будівель із підвалом.",
        },
        {
          id: "embedmentDepthD1M",
          kind: "number",
          prefix: { text: "d", subscript: "1", ariaLabel: "d1" },
          name: "Приведена глибина закладання",
          defaultValue: "1.2",
          min: 0,
          step: "0.01",
          quantity: "length",
          baseUnit: "m",
          defaultDisplayUnit: "m",
          description:
            "Приведена глибина закладання d1 у базовій одиниці м для безпідвальної схеми; входить до формули (Е.1) ДБН В.2.1-10-2009.",
          showWhen: { fieldId: "hasBasement", equals: false },
        },
        {
          id: "basementDepthInputM",
          kind: "number",
          prefix: { text: "d", subscript: "b,input", ariaLabel: "db,input" },
          name: "Глибина підвалу",
          defaultValue: "1.5",
          min: 0,
          step: "0.01",
          quantity: "length",
          baseUnit: "m",
          defaultDisplayUnit: "m",
          description:
            "Глибина підвалу db,input у базовій одиниці м; використовується для визначення розрахункової глибини підвалу db за п. Е.4 ДБН В.2.1-10-2009.",
          showWhen: { fieldId: "hasBasement", equals: true },
        },
        {
          id: "soilLayerAboveFootingHsM",
          kind: "number",
          prefix: { text: "h", subscript: "s", ariaLabel: "hs" },
          name: "Шар ґрунту над підошвою",
          defaultValue: "0.4",
          min: 0,
          step: "0.01",
          quantity: "length",
          baseUnit: "m",
          defaultDisplayUnit: "m",
          description:
            "Шар ґрунту над підошвою hs у базовій одиниці м; входить до формули (Е.2) для d1 споруди з підвалом.",
          showWhen: { fieldId: "hasBasement", equals: true },
        },
        {
          id: "basementFloorThicknessHcfM",
          kind: "number",
          prefix: { text: "h", subscript: "cf", ariaLabel: "hcf" },
          name: "Товщина підлоги підвалу",
          defaultValue: "0.2",
          min: 0,
          step: "0.01",
          quantity: "length",
          baseUnit: "m",
          defaultDisplayUnit: "m",
          description:
            "Товщина підлоги підвалу hcf у базовій одиниці м; входить до формули (Е.2) для d1 споруди з підвалом.",
          showWhen: { fieldId: "hasBasement", equals: true },
        },
        {
          id: "basementFloorUnitWeightGammaCfKnM3",
          kind: "number",
          prefix: { text: "γ", subscript: "cf", ariaLabel: "γcf" },
          name: "Питома вага підлоги підвалу",
          defaultValue: "22",
          min: 0,
          step: "0.01",
          quantity: "unitWeight",
          baseUnit: "kn-m3",
          defaultDisplayUnit: "kn-m3",
          description:
            "Питома вага підлоги підвалу γcf у базовій одиниці кН/м³; входить до формули (Е.2) для d1 споруди з підвалом.",
          showWhen: { fieldId: "hasBasement", equals: true },
        },
      ],
    },
  ],
};

function parseNumberInput(value: string): number {
  return Number.parseFloat(value.replace(",", "."));
}

const SVG_PARAMETRIC_REGISTRY = createDefaultRegistry();
const SOIL_DIAGRAM_UNITS_PER_METER = 180;
const SOIL_DIAGRAM_DIMENSION_SCALE = 1 / SOIL_DIAGRAM_UNITS_PER_METER;
const SOIL_DIAGRAM_LOAD_GAP = 62;
const SOIL_DIAGRAM_LOAD_LABEL_SPACE = 86;
const SOIL_DIAGRAM_STEM_HEIGHT = 72;
const SOIL_DIAGRAM_UPPER_WALL_HEIGHT = 72;

function sanitizeDiagramValue(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function scaledLengthMeters(
  value: number,
  fallbackMeters: number,
  allowZero = false,
): number {
  const safeValue = allowZero
    ? displayDiagramValue(value, fallbackMeters, true)
    : sanitizeDiagramValue(value, fallbackMeters);
  return safeValue * SOIL_DIAGRAM_UNITS_PER_METER;
}

function displayDiagramValue(value: number, fallback: number, allowZero = false): number {
  if (!Number.isFinite(value)) return fallback;
  return allowZero ? Math.max(0, value) : value > 0 ? value : fallback;
}

function escapeSvgAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

function viewBox(left: number, top: number, right: number, bottom: number): [number, number, number, number] {
  const x = Math.floor(left);
  const y = Math.floor(top);
  return [x, y, Math.ceil(right - x), Math.ceil(bottom - y)];
}

function getNoBasementViewBox({
  x,
  y,
  width,
  depth,
}: {
  x: number;
  y: number;
  width: number;
  depth: number;
}): [number, number, number, number] {
  const stemHeightAboveGround = depth * 0.4;
  const depthDimensionOffset = Math.max(32, width * 0.1);
  const loadTopY = y + depth + SOIL_DIAGRAM_LOAD_GAP;

  return viewBox(
    x - depthDimensionOffset - 86,
    y - stemHeightAboveGround - 24,
    x + width + 48,
    loadTopY + SOIL_DIAGRAM_LOAD_LABEL_SPACE,
  );
}

function getBasementViewBox({
  x,
  y,
  width,
  floorTopDepth,
  floorThickness,
  baseHeight,
  stemWidth,
  basementWidth,
}: {
  x: number;
  y: number;
  width: number;
  floorTopDepth: number;
  floorThickness: number;
  baseHeight: number;
  stemWidth: number;
  basementWidth: number;
}): [number, number, number, number] {
  const depth = floorTopDepth + floorThickness + baseHeight;
  const stemRight = x + (width + stemWidth) / 2;
  const basementRight = stemRight + basementWidth;
  const loadTopY = y + depth + SOIL_DIAGRAM_LOAD_GAP;

  return viewBox(
    x - 60,
    y - SOIL_DIAGRAM_STEM_HEIGHT - SOIL_DIAGRAM_UPPER_WALL_HEIGHT - 50,
    Math.max(x + width + 48, basementRight + 180),
    loadTopY + SOIL_DIAGRAM_LOAD_LABEL_SPACE,
  );
}

function getSoilFoundationScene({
  hasBasement,
  foundationWidthM,
  embedmentDepthD1M,
  basementDepthInputM,
  soilLayerAboveFootingHsM,
  basementFloorThicknessHcfM,
  soilDesignResistanceKPa,
}: {
  hasBasement: boolean;
  foundationWidthM: number;
  embedmentDepthD1M: number;
  basementDepthInputM: number;
  soilLayerAboveFootingHsM: number;
  basementFloorThicknessHcfM: number;
  soilDesignResistanceKPa?: number;
}): SceneDefinition {
  const foundationWidthDisplayM = displayDiagramValue(foundationWidthM, 1);
  const noBasementDepthDisplayM = displayDiagramValue(embedmentDepthD1M, 1.2);
  const basementDepthDisplayM = displayDiagramValue(basementDepthInputM, 1.2, true);
  const floorThicknessDisplayM = displayDiagramValue(
    basementFloorThicknessHcfM,
    0.2,
    true,
  );
  const baseHeightDisplayM = displayDiagramValue(
    soilLayerAboveFootingHsM,
    0.4,
    true,
  );
  const width = scaledLengthMeters(foundationWidthDisplayM, 1);
  const noBasementDepth = scaledLengthMeters(noBasementDepthDisplayM, 1.2);
  const basementDepth = scaledLengthMeters(basementDepthDisplayM, 1.2, true);
  const floorThickness = scaledLengthMeters(floorThicknessDisplayM, 0.2, true);
  const baseHeight = scaledLengthMeters(baseHeightDisplayM, 0.4, true);
  const hasResult =
    typeof soilDesignResistanceKPa === "number" &&
    Number.isFinite(soilDesignResistanceKPa) &&
    soilDesignResistanceKPa > 0;
  const loadValue = hasResult
    ? formatSoilDesignResistanceNumber(soilDesignResistanceKPa, 1)
    : "R";

  if (hasBasement) {
    const x = 135;
    const y = 190;
    const stemWidth = Math.max(74, width * 0.26);
    const basementWidth = 270;
    const sceneViewBox = getBasementViewBox({
      x,
      y,
      width,
      floorTopDepth: basementDepth,
      floorThickness,
      baseHeight,
      stemWidth,
      basementWidth,
    });

    return {
      scene: {
        width: sceneViewBox[2],
        height: sceneViewBox[3],
        viewBox: sceneViewBox,
        mode: "detailed",
      },
      objects: {
        foundation: {
          type: "BasementFoundation",
          params: {
            x,
            y,
            width,
            depth: basementDepth + floorThickness + baseHeight,
            baseHeight,
            stemWidth,
            stemHeightAboveGround: SOIL_DIAGRAM_STEM_HEIGHT,
            basementWidth,
            floorTopDepth: basementDepth,
            floorThickness,
            slabThickness: 24,
            upperWallWidth: 84,
            upperWallHeight: SOIL_DIAGRAM_UPPER_WALL_HEIGHT,
            loadValue,
            loadPrefix: hasResult ? "R=" : "",
            loadSuffix: hasResult ? " кПа" : "",
            widthDimensionScale: SOIL_DIAGRAM_DIMENSION_SCALE,
            baseHeightDimensionScale: SOIL_DIAGRAM_DIMENSION_SCALE,
            floorTopDepthDimensionScale: SOIL_DIAGRAM_DIMENSION_SCALE,
            floorThicknessDimensionScale: SOIL_DIAGRAM_DIMENSION_SCALE,
            dimensionSuffix: " м",
            color: "#111827",
            strokeWidth: 1.4,
            fill: "#e6e6e6",
            slabFill: "#eef7e8",
            slabColor: "#5f8f43",
            upperWallColor: "#d56a00",
            loadFill: "#f3cccc",
            loadColor: "#b54a4a",
          },
        },
      },
    };
  }

  const x = 160;
  const y = 90;
  const sceneViewBox = getNoBasementViewBox({ x, y, width, depth: noBasementDepth });

  return {
    scene: {
      width: sceneViewBox[2],
      height: sceneViewBox[3],
      viewBox: sceneViewBox,
      mode: "detailed",
    },
    objects: {
      foundation: {
        type: "LoadedFoundation",
        params: {
          x,
          y,
          width,
          depth: noBasementDepth,
          loadValue,
          loadPrefix: hasResult ? "R=" : "",
          loadSuffix: hasResult ? " кПа" : "",
          widthDimensionScale: SOIL_DIAGRAM_DIMENSION_SCALE,
          depthDimensionScale: SOIL_DIAGRAM_DIMENSION_SCALE,
          dimensionSuffix: " м",
          color: "#111827",
          strokeWidth: 1.4,
          fill: "#e6e6e6",
          loadFill: "#f3cccc",
          loadColor: "#b54a4a",
        },
      },
    },
  };
}

function RichText({ text }: { text: string }) {
  const linkPattern = new RegExp(
    NORM_LINKS.map((link) => link.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
    "g",
  );
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(linkPattern)) {
    if (match.index === undefined) continue;

    if (match.index > lastIndex) {
      nodes.push(<span key={`text:${lastIndex}`}>{text.slice(lastIndex, match.index)}</span>);
    }

    const link = NORM_LINKS.find((item) => item.text === match[0]);
    if (link) {
      nodes.push(
        <a key={`${link.id}:${match.index}`} href={`#${link.id}`}>
          {link.text}
        </a>,
      );
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    nodes.push(<span key={`text:${lastIndex}`}>{text.slice(lastIndex)}</span>);
  }

  return <>{nodes}</>;
}

function ReportStepFormulas({ step }: { step: SoilDesignResistanceReportStep }) {
  const formulas = [
    ...(step.formula ? [step.formula] : []),
    ...(step.formulas ?? []),
  ];

  if (formulas.length === 0) return null;

  return (
    <>
      {formulas.map((formula) => (
        <ReportFormula key={formula} formula={formula} className="soil-resistance-equation" />
      ))}
    </>
  );
}

function NormScan({ alt, src }: { alt: string; src: string }) {
  return (
    <details className="soil-resistance-norm__scan">
      <summary>Скан фрагмента ДБН</summary>
      <figure>
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
        />
      </figure>
    </details>
  );
}

function SoilFoundationDiagram({
  input,
  soilDesignResistanceKPa,
}: {
  input: SoilDesignResistanceInput;
  soilDesignResistanceKPa?: number;
}) {
  const title = input.hasBasement
    ? `Схема фундаменту з підвалом: b ${formatSoilDesignResistanceNumber(
        input.foundationWidthM,
        2,
      )} м, db,input ${formatSoilDesignResistanceNumber(
        input.basementDepthInputM,
        2,
      )} м, hcf ${formatSoilDesignResistanceNumber(
        input.basementFloorThicknessHcfM,
        2,
      )} м`
    : `Схема фундаменту без підвалу: b ${formatSoilDesignResistanceNumber(
        input.foundationWidthM,
        2,
      )} м, d1 ${formatSoilDesignResistanceNumber(input.embedmentDepthD1M, 2)} м`;
  const svg = buildScene(
    getSoilFoundationScene({
      hasBasement: input.hasBasement,
      foundationWidthM: input.foundationWidthM,
      embedmentDepthD1M: input.embedmentDepthD1M,
      basementDepthInputM: input.basementDepthInputM,
      soilLayerAboveFootingHsM: input.soilLayerAboveFootingHsM,
      basementFloorThicknessHcfM: input.basementFloorThicknessHcfM,
      soilDesignResistanceKPa,
    }),
    SVG_PARAMETRIC_REGISTRY,
  ).svg.replace(
    "<svg ",
    `<svg role="img" aria-label="${escapeSvgAttribute(
      title,
    )}" class="soil-resistance-diagram__svg" `,
  );

  return (
    <figure className="soil-resistance-diagram">
      <div
        className="soil-resistance-diagram__canvas"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <figcaption>
        {input.hasBasement
          ? "Параметрична схема фундаменту з підвалом для геометричних величин формул (Е.1) і (Е.2)."
          : "Параметрична схема фундаменту без підвалу для геометричних величин формули (Е.1)."}
      </figcaption>
    </figure>
  );
}

export function SoilDesignResistanceCalculator() {
  const [inputValues, setInputValues] = useState<CalculatorInputValues>(
    () => getDefaultInputSchemaValues(SOIL_INPUT_SCHEMA),
  );
  const calculationMode = String(
    inputValues.calculationMode ?? "manual-e7",
  ) as SoilCalculationMode;
  const structuralScheme = String(
    inputValues.structuralScheme ?? "rigid",
  ) as SoilStructuralScheme;
  const buildingLengthM = String(inputValues.buildingLengthM ?? "8.25");
  const buildingHeightM = String(inputValues.buildingHeightM ?? "3");
  const soilType = String(inputValues.soilType ?? "medium-sand") as SoilType;
  const liquidityIndex = String(inputValues.liquidityIndex ?? "0.3");
  const gammaC1Manual = String(inputValues.gammaC1Manual ?? "1");
  const gammaC2Manual = String(inputValues.gammaC2Manual ?? "1");
  const phi11Deg = String(inputValues.phi11Deg ?? "30");
  const gamma11KnM3 = String(inputValues.gamma11KnM3 ?? "17.1");
  const gammaPrime11KnM3 = String(inputValues.gammaPrime11KnM3 ?? "16.6");
  const c11KPa = String(inputValues.c11KPa ?? "4");
  const strengthSource = String(
    inputValues.strengthSource ?? "direct-testing",
  ) as SoilStrengthSource;
  const foundationWidthM = String(inputValues.foundationWidthM ?? "1");
  const foundationDepthM = String(inputValues.foundationDepthM ?? "1.2");
  const hasBasement = Boolean(inputValues.hasBasement);
  const embedmentDepthD1M = String(inputValues.embedmentDepthD1M ?? "1.2");
  const basementDepthInputM = String(inputValues.basementDepthInputM ?? "0");
  const soilLayerAboveFootingHsM = String(inputValues.soilLayerAboveFootingHsM ?? "0.4");
  const basementFloorThicknessHcfM = String(
    inputValues.basementFloorThicknessHcfM ?? "0.2",
  );
  const basementFloorUnitWeightGammaCfKnM3 = String(
    inputValues.basementFloorUnitWeightGammaCfKnM3 ?? "22",
  );

  const input = useMemo<SoilDesignResistanceInput>(
    () => ({
      calculationMode,
      structuralScheme,
      buildingLengthM: parseNumberInput(buildingLengthM),
      buildingHeightM: parseNumberInput(buildingHeightM),
      soilType,
      liquidityIndex: parseNumberInput(liquidityIndex),
      gammaC1Manual: parseNumberInput(gammaC1Manual),
      gammaC2Manual: parseNumberInput(gammaC2Manual),
      phi11Deg: parseNumberInput(phi11Deg),
      gamma11KnM3: parseNumberInput(gamma11KnM3),
      gammaPrime11KnM3: parseNumberInput(gammaPrime11KnM3),
      c11KPa: parseNumberInput(c11KPa),
      strengthSource,
      foundationWidthM: parseNumberInput(foundationWidthM),
      foundationDepthM: parseNumberInput(foundationDepthM),
      hasBasement,
      embedmentDepthD1M: parseNumberInput(embedmentDepthD1M),
      basementDepthInputM: parseNumberInput(basementDepthInputM),
      soilLayerAboveFootingHsM: parseNumberInput(soilLayerAboveFootingHsM),
      basementFloorThicknessHcfM: parseNumberInput(basementFloorThicknessHcfM),
      basementFloorUnitWeightGammaCfKnM3: parseNumberInput(
        basementFloorUnitWeightGammaCfKnM3,
      ),
    }),
    [
      basementDepthInputM,
      basementFloorThicknessHcfM,
      basementFloorUnitWeightGammaCfKnM3,
      buildingHeightM,
      buildingLengthM,
      c11KPa,
      calculationMode,
      embedmentDepthD1M,
      foundationDepthM,
      foundationWidthM,
      gamma11KnM3,
      gammaC1Manual,
      gammaC2Manual,
      gammaPrime11KnM3,
      hasBasement,
      liquidityIndex,
      phi11Deg,
      soilLayerAboveFootingHsM,
      soilType,
      strengthSource,
      structuralScheme,
    ],
  );

  const report = useMemo(() => getSoilDesignResistanceReport(input), [input]);
  const resultSummary =
    report.valid && report.values ? (
      <div className="soil-resistance-summary" aria-live="polite">
        <p>
          <MathNotation base="R" ariaLabel="R" /> ={" "}
          {formatSoilDesignResistanceNumber(
            report.values.soilDesignResistanceKPa,
            2,
          )}{" "}
          кПа ={" "}
          {formatSoilDesignResistanceNumber(
            report.values.soilDesignResistanceTonM2,
            1,
          )}{" "}
          т/м² ={" "}
          {formatSoilDesignResistanceNumber(
            report.values.soilDesignResistanceKgCm2,
            1,
          )}{" "}
          кг/см²
        </p>
      </div>
    ) : null;

  return (
    <div
      className="soil-resistance-calculator"
      aria-label="Калькулятор розрахункового опору ґрунту основи"
    >
      <div className="soil-resistance-input-shell">
        <aside className="soil-resistance-input-menu" aria-label="Меню вводу">
          <p className="soil-resistance-input-menu__label">Ввід</p>
          <nav className="soil-resistance-input-menu__links" aria-label="Розділи вводу">
            <a href="#soil-resistance-working">Умови</a>
            <a href="#soil-resistance-strength">Ґрунт</a>
            <a href="#soil-resistance-geometry">Геометрія</a>
            <a href="#soil-resistance-basement">Підвал</a>
            <a href="#soil-resistance-report-title">Звіт</a>
          </nav>
          {resultSummary}
        </aside>

        <div className="soil-resistance-controls">
          <InputSchemaForm
            schema={SOIL_INPUT_SCHEMA}
            values={inputValues}
            onValuesChange={setInputValues}
          />
        </div>

        <section className="soil-resistance-diagrams" aria-labelledby="soil-resistance-diagrams-title">
          <div className="soil-resistance-report__head">
            <h3 id="soil-resistance-diagrams-title">Позначення величин</h3>
          </div>
          <SoilFoundationDiagram
            input={input}
            soilDesignResistanceKPa={
              report.valid && report.values ? report.values.soilDesignResistanceKPa : undefined
            }
          />
        </section>
      </div>

      {report.errors.length > 0 ? (
        <div className="soil-resistance-errors" role="alert">
          <ul>
            {report.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {report.warnings.length > 0 ? (
        <div className="soil-resistance-warning" role="status">
          {report.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}

      <section className="soil-resistance-report" aria-labelledby="soil-resistance-report-title">
        <div className="soil-resistance-report__head">
          <h3 id="soil-resistance-report-title">Покроковий звіт</h3>
        </div>

        <ol className="soil-resistance-report__steps">
          {report.steps.map((step) => (
            <li key={step.key} className="soil-resistance-report__step">
              <p className="soil-resistance-report__caption">
                <RichText text={step.caption} />
              </p>
              {step.items ? (
                <ul className="soil-resistance-report__items">
                  {step.items.map((item) => (
                    <li key={item}>
                      <RichText text={item} />
                    </li>
                  ))}
                </ul>
              ) : null}
              {step.notes ? (
                <div className="soil-resistance-report__notes">
                  {step.notes.map((note) => (
                    <p key={note}>
                      <RichText text={note} />
                    </p>
                  ))}
                </div>
              ) : null}
              <ReportStepFormulas step={step} />
            </li>
          ))}
        </ol>
      </section>

      <section className="soil-resistance-norms" aria-labelledby="soil-resistance-norms-title">
        <div className="soil-resistance-report__head">
          <h3 id="soil-resistance-norms-title">Нормативні посилання</h3>
        </div>
        <div className="soil-resistance-norms__list">
          <article id="soil-norm-e4" className="soil-resistance-norm">
            <h4>п. Е.4 ДБН В.2.1-10-2009</h4>
            <p>Основний пункт для визначення розрахункового опору R за додатком Е.</p>
            <NormScan
              src="/dbn/soil-design-resistance/dbn-e4-e1.png"
              alt="Скан п. Е.4 і формули Е.1 з ДБН В.2.1-10-2009"
            />
          </article>
          <article id="soil-norm-e1" className="soil-resistance-norm">
            <h4>формула (Е.1)</h4>
            <p>Формула визначення розрахункового опору ґрунту основи R.</p>
            <NormScan
              src="/dbn/soil-design-resistance/dbn-e4-e1.png"
              alt="Скан формули Е.1 з ДБН В.2.1-10-2009"
            />
          </article>
          <article id="soil-norm-e2" className="soil-resistance-norm">
            <h4>формула (Е.2)</h4>
            <p>Формула приведеної глибини закладання d1 для споруди з підвалом.</p>
            <NormScan
              src="/dbn/soil-design-resistance/dbn-e2.png"
              alt="Скан формули Е.2 з ДБН В.2.1-10-2009"
            />
          </article>
          <article id="soil-norm-table-e7" className="soil-resistance-norm">
            <h4>табл. Е.7</h4>
            <p>Коефіцієнти умов роботи γc1 і γc2 для різних ґрунтів та схем споруд.</p>
            <NormScan
              src="/dbn/soil-design-resistance/dbn-table-e7.png"
              alt="Скан табл. Е.7 з ДБН В.2.1-10-2009"
            />
          </article>
          <article id="soil-norm-table-e7-note-1" className="soil-resistance-norm">
            <h4>примітка 1 до табл. Е.7</h4>
            <p>Ознака жорсткої конструктивної схеми споруди для прийняття γc2.</p>
            <NormScan
              src="/dbn/soil-design-resistance/dbn-table-e7-note-1.png"
              alt="Скан примітки 1 до табл. Е.7 з ДБН В.2.1-10-2009"
            />
          </article>
          <article id="soil-norm-table-e8" className="soil-resistance-norm">
            <h4>табл. Е.8</h4>
            <p>Коефіцієнти Mγ, Mq і Mc залежно від φ11.</p>
            <NormScan
              src="/dbn/soil-design-resistance/dbn-table-e8.png"
              alt="Скан табл. Е.8 з ДБН В.2.1-10-2009"
            />
          </article>
        </div>
      </section>
    </div>
  );
}
