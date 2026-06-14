"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import {
  getDefaultInputSchemaValues,
  type CalculatorInputDisplayUnit,
  type CalculatorInputSchema,
  type CalculatorInputValues,
} from "@/lib/calculator-input-schema";
import {
  FOUNDATION_BAR_ANCHORAGE_NORMATIVE_REFERENCES,
  formatFoundationAnchorageNumber,
  getFoundationBarAnchorageReport,
  type FoundationAnchorageBarAngle,
  type FoundationAnchorageKScheme,
  type FoundationAnchorageShape,
  type FoundationAnchorageStructureType,
  type FoundationBarAnchorageReport,
} from "@/lib/foundation-bar-anchorage";
import { getConcreteClasses, type ConcreteClassName } from "@/lib/materials/concrete";
import { getRebarClasses, type RebarClassName } from "@/lib/materials/rebar";
import type { DocxReportFigure } from "@/lib/report-docx/types";

import { InputSchemaForm } from "./input-schema-form";
import { MathNotation } from "./math-notation";
import { NativeCalculatorLayout } from "./native-calculator-layout";
import { NativeReport } from "./native-report";
import {
  buildNativeDocxReport,
  formatDocxFileDate,
} from "./native-report-docx";
import { ReportDocxButton } from "./report-docx-button";

const DEFAULT_CONCRETE_CLASS: ConcreteClassName = "C30/37";
const DEFAULT_REBAR_CLASS: RebarClassName = "A500C";

const MILLIMETER_DISPLAY_UNITS: CalculatorInputDisplayUnit[] = [
  { value: "mm", label: "мм", factorToBase: 1 },
  { value: "cm", label: "см", factorToBase: 10 },
  { value: "m", label: "м", factorToBase: 1000 },
];

const MOMENT_DISPLAY_UNITS: CalculatorInputDisplayUnit[] = [
  { value: "kn-m", label: "кН*м", factorToBase: 1 },
  { value: "n-mm", label: "Н*мм", factorToBase: 0.000001 },
];

const MEGAPASCAL_DISPLAY_UNITS: CalculatorInputDisplayUnit[] = [
  { value: "mpa", label: "МПа", factorToBase: 1 },
  { value: "kpa", label: "кПа", factorToBase: 0.001 },
];

const CONCRETE_CLASS_OPTIONS = getConcreteClasses().map((className) => ({
  value: className,
  label: className,
}));

const REBAR_CLASS_OPTIONS = getRebarClasses().map((className) => ({
  value: className,
  label: className,
}));

function parseNumberInput(value: string): number {
  return Number.parseFloat(value.replace(",", "."));
}

function getSchemaNumber(
  values: CalculatorInputValues,
  fieldId: string,
  fallback: string,
): number {
  return parseNumberInput(String(values[fieldId] ?? fallback));
}

function getSchemaBottomBarAxis(values: CalculatorInputValues): number {
  return (
    getSchemaNumber(values, "coverBottomMm", "50") +
    getSchemaNumber(values, "barDiameterMm", "16") / 2
  );
}

function formatDerivedMillimeter(value: number): string {
  return `${formatFoundationAnchorageNumber(value)} мм`;
}

export const FOUNDATION_BAR_ANCHORAGE_INPUT_SCHEMA: CalculatorInputSchema = {
  groups: [
    {
      id: "foundation-anchorage-materials",
      title: "Конструкція і матеріали",
      fields: [
        {
          id: "structureType",
          kind: "select",
          name: "Тип конструкції",
          defaultValue: "beam",
          description:
            "Балка або плита для вибору схеми K і способу визначення площі арматури.",
          options: [
            { value: "beam", label: "Балка" },
            { value: "slab", label: "Плита" },
          ],
        },
        {
          id: "concreteClass",
          kind: "select",
          name: "Клас бетону",
          defaultValue: DEFAULT_CONCRETE_CLASS,
          description: "Клас бетону використовується для визначення fctd.",
          options: CONCRETE_CLASS_OPTIONS,
        },
        {
          id: "rebarClass",
          kind: "select",
          name: "Клас арматури",
          defaultValue: DEFAULT_REBAR_CLASS,
          description: "Клас арматури використовується для визначення sigma_sd.",
          options: REBAR_CLASS_OPTIONS,
        },
      ],
    },
    {
      id: "foundation-anchorage-geometry",
      title: "Геометрія фундаменту",
      fields: [
        {
          id: "footingLengthMm",
          kind: "number",
          prefix: { text: "L", ariaLabel: "L" },
          name: "Довжина фундаменту",
          defaultValue: "3000",
          min: 0,
          step: "1",
          baseUnit: "mm",
          defaultDisplayUnit: "mm",
          displayUnits: MILLIMETER_DISPLAY_UNITS,
          description: "Розмір фундаменту в напрямку перевірки.",
        },
        {
          id: "footingWidthMm",
          kind: "number",
          prefix: { text: "B", ariaLabel: "B" },
          name: "Ширина фундаменту",
          defaultValue: "2000",
          min: 0,
          step: "1",
          baseUnit: "mm",
          defaultDisplayUnit: "mm",
          displayUnits: MILLIMETER_DISPLAY_UNITS,
          description: "Ширина фундаменту перпендикулярно напрямку перевірки.",
        },
        {
          id: "footingHeightMm",
          kind: "number",
          prefix: { text: "h", ariaLabel: "h" },
          name: "Висота фундаменту",
          defaultValue: "600",
          min: 0,
          step: "1",
          baseUnit: "mm",
          defaultDisplayUnit: "mm",
          displayUnits: MILLIMETER_DISPLAY_UNITS,
          description: "Висота фундаменту для xmin = h / 2.",
        },
        {
          id: "effectiveDepthMm",
          kind: "derived",
          prefix: { text: "d", ariaLabel: "d" },
          name: "Робоча висота",
          description: "Обчислюється як h - c - Ø / 2.",
          getValue: (values) =>
            formatDerivedMillimeter(
              getSchemaNumber(values, "footingHeightMm", "600") -
                getSchemaBottomBarAxis(values),
            ),
        },
        {
          id: "pedestalWidthMm",
          kind: "number",
          prefix: { text: "b", ariaLabel: "b" },
          name: "Ширина уступу",
          defaultValue: "400",
          min: 0,
          step: "1",
          baseUnit: "mm",
          defaultDisplayUnit: "mm",
          displayUnits: MILLIMETER_DISPLAY_UNITS,
          description: "Ширина уступу для ze = 0.15b.",
        },
        {
          id: "availableAnchorageLengthMm",
          kind: "number",
          prefix: { text: "l", subscript: "b", ariaLabel: "lb" },
          name: "Доступна довжина анкерування",
          defaultValue: "700",
          min: 0,
          step: "1",
          baseUnit: "mm",
          defaultDisplayUnit: "mm",
          displayUnits: MILLIMETER_DISPLAY_UNITS,
          description: "Доступна довжина анкерування за геометрією вузла.",
        },
      ],
    },
    {
      id: "foundation-anchorage-loads",
      title: "Навантаження на уступі",
      fields: [
        {
          id: "axialLoadKn",
          kind: "number",
          prefix: { text: "N", ariaLabel: "N" },
          name: "Вертикальне навантаження",
          defaultValue: "1000",
          min: 0,
          step: "1",
          quantity: "force",
          defaultDisplayUnit: "kn",
          description: "Вертикальне розрахункове навантаження на уступі.",
        },
        {
          id: "momentKnM",
          kind: "number",
          prefix: { text: "M", ariaLabel: "M" },
          name: "Момент",
          defaultValue: "100",
          step: "1",
          baseUnit: "kn-m",
          defaultDisplayUnit: "kn-m",
          displayUnits: MOMENT_DISPLAY_UNITS,
          description: "Момент на уступі.",
        },
        {
          id: "shearKn",
          kind: "number",
          prefix: { text: "Q", ariaLabel: "Q" },
          name: "Поперечна сила",
          defaultValue: "50",
          step: "1",
          quantity: "force",
          defaultDisplayUnit: "kn",
          description: "Поперечна сила, що переводиться у додатковий момент.",
        },
        {
          id: "shearHeightM",
          kind: "number",
          prefix: { text: "h", subscript: "Q", ariaLabel: "hQ" },
          name: "Висота прикладання поперечної сили",
          defaultValue: "0.5",
          min: 0,
          step: "0.01",
          quantity: "length",
          defaultDisplayUnit: "m",
          description: "Висота прикладання Q для MQ = Q * hQ.",
        },
      ],
    },
    {
      id: "foundation-anchorage-reinforcement",
      title: "Анкерована арматура",
      fields: [
        {
          id: "barDiameterMm",
          kind: "number",
          prefix: { text: "Ø", ariaLabel: "Ø" },
          name: "Діаметр стрижня",
          defaultValue: "16",
          min: 0,
          step: "1",
          quantity: "diameter",
          defaultDisplayUnit: "mm",
          description: "Діаметр анкерованого стрижня.",
        },
        {
          id: "barCount",
          kind: "number",
          prefix: "n",
          name: "Кількість стрижнів",
          defaultValue: "4",
          min: 0,
          step: "1",
          showWhen: { fieldId: "structureType", equals: "beam" },
          description: "Кількість анкерованих стрижнів у перерізі балки.",
        },
        {
          id: "barSpacingForAreaMm",
          kind: "number",
          prefix: "s",
          name: "Крок стрижнів плити",
          defaultValue: "150",
          min: 0,
          step: "1",
          baseUnit: "mm",
          defaultDisplayUnit: "mm",
          displayUnits: MILLIMETER_DISPLAY_UNITS,
          showWhen: { fieldId: "structureType", equals: "slab" },
          description: "Крок стрижнів для площі арматури плити на 1 м.п.",
        },
      ],
    },
    {
      id: "foundation-anchorage-bond",
      title: "Умови зчеплення eta1",
      fields: [
        {
          id: "bondHeightMm",
          kind: "derived",
          prefix: "h бетонування",
          name: "Висота бетонування",
          description: "Прийнята рівною висоті фундаменту h.",
          getValue: (values) =>
            formatDerivedMillimeter(getSchemaNumber(values, "footingHeightMm", "600")),
        },
        {
          id: "bottomBarAxisMm",
          kind: "derived",
          prefix: "a від низу",
          name: "Вісь стрижня від низу",
          description: "Обчислюється як c + Ø / 2.",
          getValue: (values) => formatDerivedMillimeter(getSchemaBottomBarAxis(values)),
        },
        {
          id: "barAngle",
          kind: "select",
          name: "Положення стрижня",
          defaultValue: "horizontal",
          description: "Положення стрижня під час бетонування для визначення eta1.",
          options: [
            { value: "horizontal", label: "Горизонтальний" },
            { value: "inclined", label: "Похилий/вертикальний 45-90°" },
          ],
        },
        {
          id: "slipForm",
          kind: "checkbox",
          name: "Ковзна опалубка",
          defaultValue: false,
          description: "Зменшує eta1 до 0.7.",
        },
      ],
    },
    {
      id: "foundation-anchorage-cover",
      title: "Форма анкерування і захисний шар",
      fields: [
        {
          id: "anchorageShape",
          kind: "select",
          name: "Тип анкерування",
          defaultValue: "straight",
          description: "Форма стрижня для alpha1 і alpha2.",
          options: [
            { value: "straight", label: "Прямий стрижень" },
            { value: "bend", label: "Загин / гак / петля" },
          ],
        },
        {
          id: "coverBottomMm",
          kind: "number",
          prefix: "c",
          name: "Нижній захисний шар",
          defaultValue: "50",
          min: 0,
          step: "1",
          baseUnit: "mm",
          defaultDisplayUnit: "mm",
          displayUnits: MILLIMETER_DISPLAY_UNITS,
          description: "Захисний шар для cd за рис. 7.3.",
        },
        {
          id: "coverSideMm",
          kind: "number",
          prefix: "c1",
          name: "Боковий захисний шар",
          defaultValue: "60",
          min: 0,
          step: "1",
          baseUnit: "mm",
          defaultDisplayUnit: "mm",
          displayUnits: MILLIMETER_DISPLAY_UNITS,
          description: "Боковий захисний шар для cd за рис. 7.3.",
        },
        {
          id: "barSpacingMm",
          kind: "number",
          prefix: "a",
          name: "Відстань між стрижнями",
          defaultValue: "150",
          min: 0,
          step: "1",
          baseUnit: "mm",
          defaultDisplayUnit: "mm",
          displayUnits: MILLIMETER_DISPLAY_UNITS,
          showWhen: { fieldId: "structureType", equals: "beam" },
          description: "Відстань між стрижнями для cd за рис. 7.3.",
        },
        {
          id: "barSpacingForCdMm",
          kind: "derived",
          prefix: "a",
          name: "Відстань між стрижнями для cd",
          showWhen: { fieldId: "structureType", equals: "slab" },
          description: "Для плити приймається рівною кроку s.",
          getValue: (values) =>
            formatDerivedMillimeter(getSchemaNumber(values, "barSpacingForAreaMm", "150")),
        },
      ],
    },
    {
      id: "foundation-anchorage-transverse",
      title: "Поперечна арматура і тиск",
      fields: [
        {
          id: "transverseRebarAreaMm2",
          kind: "number",
          prefix: "ΣAst",
          name: "Площа поперечної арматури",
          defaultValue: "300",
          min: 0,
          step: "1",
          quantity: "area",
          defaultDisplayUnit: "mm2",
          description: "Площа поперечної арматури вздовж довжини анкерування.",
        },
        {
          id: "kScheme",
          kind: "select",
          prefix: { text: "K", ariaLabel: "K" },
          name: "Схема поперечної арматури",
          defaultValue: "0.05",
          description: "Схема поперечної арматури за рис. 7.4.",
          options: [
            { value: "0.1", label: "K = 0.1" },
            { value: "0.05", label: "K = 0.05" },
            { value: "0", label: "K = 0" },
          ],
        },
        {
          id: "transversePressureMPa",
          kind: "number",
          prefix: "p",
          name: "Поперечний тиск",
          defaultValue: "0",
          min: 0,
          step: "0.1",
          baseUnit: "mpa",
          defaultDisplayUnit: "mpa",
          displayUnits: MEGAPASCAL_DISPLAY_UNITS,
          description: "Поперечний тиск на площину розколювання.",
        },
        {
          id: "weldedTransverseRebar",
          kind: "checkbox",
          name: "Приварена поперечна арматура",
          defaultValue: false,
          description: "Ознака для alpha4 за табл. 7.2.",
        },
      ],
    },
  ],
};

const SYMBOLS = {
  "lb,rqd": { base: "l", subscript: "b,rqd", ariaLabel: "lb,rqd" },
  "lb,req": { base: "l", subscript: "b,req", ariaLabel: "lb,req" },
  "lb,min": { base: "l", subscript: "b,min", ariaLabel: "lb,min" },
  "As,prov": { base: "A", subscript: "s,prov", ariaLabel: "As,prov" },
  "As,1": { base: "A", subscript: "s,1", ariaLabel: "As,1" },
  "sigma_sd": { base: "σ", subscript: "sd", ariaLabel: "sigma_sd" },
  "alpha_ct": { base: "α", subscript: "ct", ariaLabel: "alpha_ct" },
  "gamma_c": { base: "γ", subscript: "c", ariaLabel: "gamma_c" },
  "fctk,0.05": { base: "f", subscript: "ctk,0.05", ariaLabel: "fctk,0.05" },
  alpha235: { base: "α", subscript: "235", ariaLabel: "alpha235" },
  alpha1: { base: "α", subscript: "1", ariaLabel: "alpha1" },
  alpha2: { base: "α", subscript: "2", ariaLabel: "alpha2" },
  alpha3: { base: "α", subscript: "3", ariaLabel: "alpha3" },
  alpha4: { base: "α", subscript: "4", ariaLabel: "alpha4" },
  alpha5: { base: "α", subscript: "5", ariaLabel: "alpha5" },
  eta1: { base: "η", subscript: "1", ariaLabel: "eta1" },
  eta2: { base: "η", subscript: "2", ariaLabel: "eta2" },
  fctd: { base: "f", subscript: "ctd", ariaLabel: "fctd" },
  fbd: { base: "f", subscript: "bd", ariaLabel: "fbd" },
  qmax: { base: "q", subscript: "max", ariaLabel: "qmax" },
  qmin: { base: "q", subscript: "min", ariaLabel: "qmin" },
  Mtot: { base: "M", subscript: "tot", ariaLabel: "Mtot" },
  hQ: { base: "h", subscript: "Q", ariaLabel: "hQ" },
  MQ: { base: "M", subscript: "Q", ariaLabel: "MQ" },
  qx: { base: "q", subscript: "x", ariaLabel: "qx" },
  qm: { base: "q", subscript: "m", ariaLabel: "qm" },
  ze: { base: "z", subscript: "e", ariaLabel: "ze" },
  zi: { base: "z", subscript: "i", ariaLabel: "zi" },
  Fs: { base: "F", subscript: "s", ariaLabel: "Fs" },
  lb: { base: "l", subscript: "b", ariaLabel: "lb" },
  lbd: { base: "l", subscript: "bd", ariaLabel: "lbd" },
  cd: { base: "c", subscript: "d", ariaLabel: "cd" },
  "Ø": { base: "Ø", ariaLabel: "Ø" },
  N: { base: "N", ariaLabel: "N" },
  M: { base: "M", ariaLabel: "M" },
  Q: { base: "Q", ariaLabel: "Q" },
  R: { base: "R", ariaLabel: "R" },
  L: { base: "L", ariaLabel: "L" },
  B: { base: "B", ariaLabel: "B" },
  h: { base: "h", ariaLabel: "h" },
  d: { base: "d", ariaLabel: "d" },
  b: { base: "b", ariaLabel: "b" },
  x: { base: "x", ariaLabel: "x" },
  e: { base: "e", ariaLabel: "e" },
  K: { base: "K", ariaLabel: "K" },
} as const;

const SYMBOL_PATTERN = new RegExp(
  Object.keys(SYMBOLS)
    .sort((left, right) => right.length - left.length)
    .map((symbol) => symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|"),
  "g",
);

const NORM_LINKS = [
  { text: "п. 8.8.2.5", id: "norm-dstu-8-8-2-5" },
  { text: "п. 8.8.2.6", id: "norm-dstu-8-8-2-6" },
  { text: "п. 8.8.2.7", id: "norm-dstu-8-8-2-7" },
  { text: "п. 8.8.2.8", id: "norm-dstu-8-8-2-8" },
  { text: "п. 7.2.2.2", id: "norm-dstu-7-2-2-2" },
  { text: "п. 7.2.3.2", id: "norm-dstu-7-2-3-2" },
  { text: "п. 7.2.4.1", id: "norm-dstu-7-2-4-1" },
  { text: "рис. 7.3", id: "norm-dstu-fig-7-3" },
  { text: "рис. 7.4", id: "norm-dstu-fig-7-4" },
  { text: "рис. 8.2 EN 1992-1-1", id: "norm-en-1992-fig-8-2" },
  { text: "табл. 7.2", id: "norm-dstu-table-7-2" },
] as const;

function isFormulaBoundary(value: string | undefined): boolean {
  return !value || !/[A-Za-z0-9_,.]/.test(value);
}

function renderFormulaText(text: string) {
  const parts: Array<string | keyof typeof SYMBOLS> = [];
  let lastIndex = 0;

  for (const match of text.matchAll(SYMBOL_PATTERN)) {
    if (match.index === undefined) continue;

    if (
      !isFormulaBoundary(text[match.index - 1]) ||
      !isFormulaBoundary(text[match.index + match[0].length])
    ) {
      continue;
    }

    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    parts.push(match[0] as keyof typeof SYMBOLS);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.map((part, index) => {
    if (part in SYMBOLS) {
      const symbol = SYMBOLS[part as keyof typeof SYMBOLS];

      return (
        <MathNotation
          key={`${part}:${index}`}
          base={symbol.base}
          subscript={"subscript" in symbol ? symbol.subscript : undefined}
          ariaLabel={symbol.ariaLabel}
        />
      );
    }

    return <span key={`${part}:${index}`}>{part}</span>;
  });
}

function CaptionText({ text }: { text: string }) {
  const pattern = new RegExp(
    NORM_LINKS.map((link) => link.text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
    "g",
  );
  const nodes: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(pattern)) {
    if (match.index === undefined) continue;

    if (match.index > lastIndex) {
      nodes.push(
        <span key={`text:${lastIndex}`}>
          {renderFormulaText(text.slice(lastIndex, match.index))}
        </span>,
      );
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
    nodes.push(<span key={`text:${lastIndex}`}>{renderFormulaText(text.slice(lastIndex))}</span>);
  }

  return <>{nodes}</>;
}

function formatDiagramValue(value: number): string {
  return Number.isFinite(value) ? formatFoundationAnchorageNumber(value) : "0";
}

function FoundationGeometryDiagram({
  footingLength,
  footingHeight,
  effectiveDepth,
  pedestalWidth,
  availableAnchorageLength,
  axialLoad,
}: {
  footingLength: string;
  footingHeight: string;
  effectiveDepth: string;
  pedestalWidth: string;
  availableAnchorageLength: string;
  axialLoad: string;
}) {
  return (
    <figure className="foundation-anchorage-diagram">
      <svg
        role="img"
        aria-label="Схема моделі сили розтягу фундаменту за рисунком 8.13"
        viewBox="0 0 620 420"
      >
        <defs>
          <marker id="foundation-arrow" markerHeight="8" markerWidth="8" orient="auto" refX="7" refY="4">
            <path d="M0 0 L8 4 L0 8 Z" className="foundation-anchorage-diagram__arrow" />
          </marker>
          <marker id="foundation-arrow-start" markerHeight="8" markerWidth="8" orient="auto-start-reverse" refX="1" refY="4">
            <path d="M8 0 L0 4 L8 8 Z" className="foundation-anchorage-diagram__arrow" />
          </marker>
        </defs>

        <path
          d="M58 138 H232 V88 H250 V50 H274 V88 H300 V138 H540 V226 H58 Z"
          className="foundation-anchorage-diagram__outline"
        />
        <line x1="92" y1="205" x2="490" y2="205" className="foundation-anchorage-diagram__bar" />
        <path d="M86 205 C126 192 176 168 250 150" className="foundation-anchorage-diagram__crack" />
        <path d="M86 206 L250 150" className="foundation-anchorage-diagram__force" markerStart="url(#foundation-arrow-start)" />
        <path d="M250 150 H372" className="foundation-anchorage-diagram__force" markerEnd="url(#foundation-arrow)" />
        <path d="M250 38 V150" className="foundation-anchorage-diagram__load" markerEnd="url(#foundation-arrow)" />
        <path d="M60 306 H540 V346 L132 374 H60 Z" className="foundation-anchorage-diagram__soil" />

        <line x1="88" y1="58" x2="250" y2="58" className="foundation-anchorage-diagram__dimension" markerStart="url(#foundation-arrow-start)" markerEnd="url(#foundation-arrow)" />
        <line x1="312" y1="150" x2="312" y2="205" className="foundation-anchorage-diagram__dimension" markerStart="url(#foundation-arrow-start)" markerEnd="url(#foundation-arrow)" />
        <line x1="586" y1="138" x2="586" y2="226" className="foundation-anchorage-diagram__dimension" markerStart="url(#foundation-arrow-start)" markerEnd="url(#foundation-arrow)" />
        <line x1="58" y1="284" x2="132" y2="284" className="foundation-anchorage-diagram__dimension" markerStart="url(#foundation-arrow-start)" markerEnd="url(#foundation-arrow)" />

        <text x="148" y="48">ze</text>
        <text x="236" y="34">NEd={axialLoad} кН</text>
        <text x="280" y="76">b={pedestalWidth} мм</text>
        <text x="150" y="194">Fs</text>
        <text x="318" y="182">zi</text>
        <text x="558" y="178">d={effectiveDepth} мм</text>
        <text x="592" y="188">h={footingHeight} мм</text>
        <text x="82" y="252">lb={availableAnchorageLength} мм</text>
        <text x="94" y="348">R</text>
        <text x="178" y="398">L={footingLength} мм</text>
      </svg>
      <figcaption>
        Рисунок 8.13 - модель сили розтягу з урахуванням похилих тріщин.
      </figcaption>
    </figure>
  );
}

function NormativeReferenceFigure({ title, summary }: { title: string; summary: string }) {
  const firstLine = summary.length > 88 ? `${summary.slice(0, 88)}...` : summary;

  return (
    <svg
      role="img"
      aria-label={`Фрагмент ${title}`}
      viewBox="0 0 540 132"
      className="foundation-anchorage-norm__figure"
    >
      <rect x="1" y="1" width="538" height="130" rx="3" />
      <text x="18" y="30">{title}</text>
      <line x1="18" y1="43" x2="522" y2="43" />
      <text x="18" y="70">{firstLine}</text>
      <text x="18" y="100">Формули та рисунки наведені у звіті як окремі кроки з посиланнями.</text>
    </svg>
  );
}

function escapeSvgText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeSvgAttribute(value: string): string {
  return escapeSvgText(value).replaceAll("\"", "&quot;");
}

function buildFoundationBarAnchorageDiagramFigure(
  report: FoundationBarAnchorageReport,
): DocxReportFigure {
  const title = "Схема моделі сили розтягу фундаменту за рисунком 8.13";
  const effectiveDepthMm =
    report.values?.effectiveDepthMm ??
    report.input.footingHeightMm -
      (report.input.coverBottomMm + report.input.barDiameterMm / 2);
  const tensileForceKn = report.values?.tensileForceKn ?? 0;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeSvgAttribute(
    title,
  )}" viewBox="0 0 620 420">
  <rect x="58" y="138" width="482" height="88" fill="#eef2f7" stroke="#475569" stroke-width="2"/>
  <rect x="232" y="88" width="68" height="50" fill="#e2e8f0" stroke="#475569" stroke-width="2"/>
  <line x1="92" y1="205" x2="490" y2="205" stroke="#0f172a" stroke-width="5" stroke-linecap="round"/>
  <path d="M86 205 C126 192 176 168 250 150" fill="none" stroke="#dc2626" stroke-width="2" stroke-dasharray="7 5"/>
  <path d="M60 306 H540 V346 L132 374 H60 Z" fill="#dbeafe" stroke="#475569" stroke-width="2"/>
  <line x1="250" y1="38" x2="250" y2="150" stroke="#2563eb" stroke-width="3"/>
  <line x1="86" y1="205" x2="250" y2="150" stroke="#16a34a" stroke-width="3"/>
  <line x1="250" y1="150" x2="372" y2="150" stroke="#16a34a" stroke-width="3"/>
  <text x="236" y="34" font-family="Arial" font-size="16">N = ${escapeSvgText(
    formatFoundationAnchorageNumber(report.input.axialLoadKn),
  )} кН</text>
  <text x="280" y="76" font-family="Arial" font-size="16">b = ${escapeSvgText(
    formatFoundationAnchorageNumber(report.input.pedestalWidthMm),
  )} мм</text>
  <text x="150" y="194" font-family="Arial" font-size="16">Fs = ${escapeSvgText(
    formatFoundationAnchorageNumber(tensileForceKn),
  )} кН</text>
  <text x="558" y="178" font-family="Arial" font-size="16">d = ${escapeSvgText(
    formatFoundationAnchorageNumber(effectiveDepthMm),
  )} мм</text>
  <text x="82" y="252" font-family="Arial" font-size="16">lb = ${escapeSvgText(
    formatFoundationAnchorageNumber(report.input.availableAnchorageLengthMm),
  )} мм</text>
  <text x="178" y="398" font-family="Arial" font-size="16">L = ${escapeSvgText(
    formatFoundationAnchorageNumber(report.input.footingLengthMm),
  )} мм</text>
</svg>`;

  return {
    key: "foundation-bar-anchorage-diagram",
    caption: title,
    svg,
    widthPx: 620,
    heightPx: 420,
  };
}

export function buildFoundationBarAnchorageDocxReport(
  report: FoundationBarAnchorageReport,
  date = new Date(),
) {
  return buildNativeDocxReport({
    title: "Покроковий звіт",
    fileBaseName: `ankeruvannia-armatury-fundamentu-${formatDocxFileDate(date)}`,
    figures: [buildFoundationBarAnchorageDiagramFigure(report)],
    steps: report.steps,
  });
}

export function FoundationBarAnchorageCalculator() {
  const [inputValues, setInputValues] = useState<CalculatorInputValues>(
    () => getDefaultInputSchemaValues(FOUNDATION_BAR_ANCHORAGE_INPUT_SCHEMA),
  );

  const report = useMemo(() => {
    const structureType = String(
      inputValues.structureType ?? "beam",
    ) as FoundationAnchorageStructureType;
    const barSpacingForAreaMm = getSchemaNumber(inputValues, "barSpacingForAreaMm", "150");
    const barSpacingMm = getSchemaNumber(inputValues, "barSpacingMm", "150");

    return getFoundationBarAnchorageReport({
      structureType,
      concreteClass: String(inputValues.concreteClass ?? DEFAULT_CONCRETE_CLASS),
      rebarClass: String(inputValues.rebarClass ?? DEFAULT_REBAR_CLASS),
      footingLengthMm: getSchemaNumber(inputValues, "footingLengthMm", "3000"),
      footingWidthMm: getSchemaNumber(inputValues, "footingWidthMm", "2000"),
      footingHeightMm: getSchemaNumber(inputValues, "footingHeightMm", "600"),
      pedestalWidthMm: getSchemaNumber(inputValues, "pedestalWidthMm", "400"),
      availableAnchorageLengthMm: getSchemaNumber(
        inputValues,
        "availableAnchorageLengthMm",
        "700",
      ),
      axialLoadKn: getSchemaNumber(inputValues, "axialLoadKn", "1000"),
      momentKnM: getSchemaNumber(inputValues, "momentKnM", "100"),
      shearKn: getSchemaNumber(inputValues, "shearKn", "50"),
      shearHeightM: getSchemaNumber(inputValues, "shearHeightM", "0.5"),
      barDiameterMm: getSchemaNumber(inputValues, "barDiameterMm", "16"),
      barCount: getSchemaNumber(inputValues, "barCount", "4"),
      barSpacingForAreaMm,
      barAngle: String(inputValues.barAngle ?? "horizontal") as FoundationAnchorageBarAngle,
      slipForm: Boolean(inputValues.slipForm ?? false),
      anchorageShape: String(inputValues.anchorageShape ?? "straight") as FoundationAnchorageShape,
      coverBottomMm: getSchemaNumber(inputValues, "coverBottomMm", "50"),
      coverSideMm: getSchemaNumber(inputValues, "coverSideMm", "60"),
      barSpacingMm: structureType === "slab" ? barSpacingForAreaMm : barSpacingMm,
      transverseRebarAreaMm2: getSchemaNumber(
        inputValues,
        "transverseRebarAreaMm2",
        "300",
      ),
      kScheme: String(inputValues.kScheme ?? "0.05") as FoundationAnchorageKScheme,
      weldedTransverseRebar: Boolean(inputValues.weldedTransverseRebar ?? false),
      transversePressureMPa: getSchemaNumber(inputValues, "transversePressureMPa", "0"),
    });
  }, [inputValues]);

  const docxReport = useMemo(
    () => buildFoundationBarAnchorageDocxReport(report),
    [report],
  );
  const effectiveDepthMm =
    report.values?.effectiveDepthMm ??
    report.input.footingHeightMm -
      (report.input.coverBottomMm + report.input.barDiameterMm / 2);
  const resultSummary =
    report.valid && report.values ? (
      <>
        <p>
          {report.values.anchorageSufficient
            ? "Анкерування достатнє"
            : "Анкерування недостатнє"}
          : <MathNotation base="l" subscript="b" ariaLabel="lb" /> ={" "}
          {formatFoundationAnchorageNumber(report.input.availableAnchorageLengthMm)} мм,{" "}
          <MathNotation base="l" subscript="b,req" ariaLabel="lb,req" /> ={" "}
          {formatFoundationAnchorageNumber(report.values.requiredAnchorageLengthMm)} мм.
        </p>
        <p>
          <MathNotation base="F" subscript="s" ariaLabel="Fs" /> ={" "}
          {formatFoundationAnchorageNumber(report.values.tensileForceKn)} кН;{" "}
          <MathNotation base="σ" subscript="sd" ariaLabel="sigma_sd" /> ={" "}
          {formatFoundationAnchorageNumber(report.values.steelStressMPa)} МПа.
        </p>
      </>
    ) : null;

  return (
    <NativeCalculatorLayout
      ariaLabel="Калькулятор анкерування арматури фундаменту"
      navLinks={[
        { href: "#foundation-anchorage-materials", label: "Ввід" },
        { href: "#native-calculator-diagrams-title", label: "Схема" },
        { href: "#foundation-anchorage-report-title", label: "Звіт" },
        { href: "#foundation-anchorage-norms", label: "Норми" },
      ]}
      summary={resultSummary}
      controls={
        <InputSchemaForm
          schema={FOUNDATION_BAR_ANCHORAGE_INPUT_SCHEMA}
          values={inputValues}
          onValuesChange={setInputValues}
        />
      }
      diagrams={
        <FoundationGeometryDiagram
          footingLength={formatDiagramValue(report.input.footingLengthMm)}
          footingHeight={formatDiagramValue(report.input.footingHeightMm)}
          effectiveDepth={formatDiagramValue(effectiveDepthMm)}
          pedestalWidth={formatDiagramValue(report.input.pedestalWidthMm)}
          availableAnchorageLength={formatDiagramValue(
            report.input.availableAnchorageLengthMm,
          )}
          axialLoad={formatDiagramValue(report.input.axialLoadKn)}
        />
      }
      errors={report.errors}
      warnings={report.warnings}
    >
      <NativeReport
        titleId="foundation-anchorage-report-title"
        title="Покроковий звіт"
        steps={report.steps}
        renderText={(text) => <CaptionText text={text} />}
        actions={<ReportDocxButton report={docxReport} />}
      />

      <section
        className="native-norms"
        id="foundation-anchorage-norms"
        aria-labelledby="foundation-anchorage-norms-title"
      >
        <div className="native-report__head">
          <h3 id="foundation-anchorage-norms-title">Нормативні пункти</h3>
        </div>
        <div className="native-norms__list">
          {FOUNDATION_BAR_ANCHORAGE_NORMATIVE_REFERENCES.map((reference) => (
            <article key={reference.id} id={reference.id} className="native-norm">
              <h4>{reference.title}</h4>
              <p>{reference.summary}</p>
              <NormativeReferenceFigure title={reference.title} summary={reference.summary} />
            </article>
          ))}
        </div>
      </section>
    </NativeCalculatorLayout>
  );
}
