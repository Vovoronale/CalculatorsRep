"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  getDefaultInputSchemaValues,
  type CalculatorInputDisplayUnit,
  type CalculatorInputSchema,
  type CalculatorInputValues,
} from "@/lib/calculator-input-schema";
import {
  formatMinimumReinforcementNumber,
  getMinimumReinforcementReport,
  type MinimumReinforcementReport,
  type MinimumReinforcementStructureType,
} from "@/lib/minimum-reinforcement";
import { getConcreteClasses, type ConcreteClassName } from "@/lib/materials/concrete";
import { getRebarClasses, type RebarClassName } from "@/lib/materials/rebar";
import { getRebarSelection, getRebarSpacingSelection } from "@/lib/rebar-area-bars";
import {
  buildScene,
  createDefaultRegistry,
  type SceneDefinition,
} from "@/lib/vendor/svgparametric";
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

const CONCRETE_CLASS_OPTIONS = getConcreteClasses().map((className) => ({
  value: className,
  label: className,
}));

const REBAR_CLASS_OPTIONS = getRebarClasses().map((className) => ({
  value: className,
  label: className,
}));

export const MINIMUM_REINFORCEMENT_INPUT_SCHEMA: CalculatorInputSchema = {
  groups: [
    {
      id: "minimum-reinforcement-inputs",
      title: "Вихідні дані",
      fields: [
        {
          id: "structureType",
          kind: "select",
          name: "Тип конструкції",
          defaultValue: "beam",
          description:
            "Тип елемента визначає пояснення розрахунку і формат рекомендації з підбору арматури.",
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
          description:
            "Клас бетону використовується для визначення fctm за табличними характеристиками.",
          options: CONCRETE_CLASS_OPTIONS,
        },
        {
          id: "rebarClass",
          kind: "select",
          name: "Клас арматури",
          defaultValue: DEFAULT_REBAR_CLASS,
          description:
            "Клас арматури використовується для визначення fyk і перевірки меж застосовності Eurocode 2.",
          options: REBAR_CLASS_OPTIONS,
        },
        {
          id: "sectionHeightMm",
          kind: "number",
          prefix: { text: "h", ariaLabel: "h" },
          name: "Висота перерізу",
          defaultValue: "500",
          min: 0,
          step: "1",
          baseUnit: "mm",
          defaultDisplayUnit: "mm",
          displayUnits: MILLIMETER_DISPLAY_UNITS,
          description:
            "Повна висота залізобетонного перерізу h. Значення передається в розрахунок у міліметрах.",
        },
        {
          id: "tensileZoneWidthMm",
          kind: "number",
          prefix: { text: "b", subscript: "t", ariaLabel: "bt" },
          name: "Ширина розтягнутої зони",
          defaultValue: "1000",
          min: 0,
          step: "1",
          baseUnit: "mm",
          defaultDisplayUnit: "mm",
          displayUnits: MILLIMETER_DISPLAY_UNITS,
          description:
            "Ширина розтягнутої зони bt; для плити зазвичай приймається смуга 1000 мм.",
        },
        {
          id: "reinforcementCentroidDistanceMm",
          kind: "number",
          prefix: { text: "a", subscript: "s", ariaLabel: "a_s" },
          name: "Відстань до центра арматури",
          defaultValue: "50",
          min: 0,
          step: "1",
          baseUnit: "mm",
          defaultDisplayUnit: "mm",
          displayUnits: MILLIMETER_DISPLAY_UNITS,
          description:
            "Відстань a_s від розтягнутої грані до центра робочої арматури; використовується для d = h - a_s.",
        },
        {
          id: "rebarDiameterMm",
          kind: "number",
          prefix: { text: "Ø", subscript: "s", ariaLabel: "Øs" },
          name: "Діаметр стрижня",
          defaultValue: "16",
          min: 0,
          step: "1",
          baseUnit: "mm",
          defaultDisplayUnit: "mm",
          displayUnits: MILLIMETER_DISPLAY_UNITS,
          description:
            "Діаметр стрижня Øs використовується в пояснювальній схемі перерізу.",
        },
      ],
    },
  ],
};

const SYMBOLS = {
  "As,min,2": { base: "A", subscript: "s,min,2", ariaLabel: "As,min,2" },
  "As,min,1": { base: "A", subscript: "s,min,1", ariaLabel: "As,min,1" },
  "As,min": { base: "A", subscript: "s,min", ariaLabel: "As,min" },
  fctm: { base: "f", subscript: "ctm", ariaLabel: "fctm" },
  fyk: { base: "f", subscript: "yk", ariaLabel: "fyk" },
  a_s: { base: "a", subscript: "s", ariaLabel: "a_s" },
  "Øs": { base: "Ø", subscript: "s", ariaLabel: "Øs" },
  bt: { base: "b", subscript: "t", ariaLabel: "bt" },
  d: { base: "d", ariaLabel: "d" },
  h: { base: "h", ariaLabel: "h" },
} as const;

const SYMBOL_PATTERN = new RegExp(
  Object.keys(SYMBOLS)
    .sort((left, right) => right.length - left.length)
    .map((symbol) => symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|"),
  "g",
);

function isFormulaBoundary(value: string | undefined): boolean {
  return !value || !/[A-Za-z0-9_,]/.test(value);
}

function parseNumberInput(value: string): number {
  return Number.parseFloat(value.replace(",", "."));
}

function FormulaText({ text }: { text: string }) {
  const parts: Array<string | keyof typeof SYMBOLS> = [];
  let lastIndex = 0;

  for (const match of text.matchAll(SYMBOL_PATTERN)) {
    if (match.index === undefined) {
      continue;
    }

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

  return (
    <>
      {parts.map((part, index) => {
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
      })}
    </>
  );
}

const SVG_PARAMETRIC_REGISTRY = createDefaultRegistry();
const SECTION_DIAGRAM_MARGIN_LEFT = 120;
const SECTION_DIAGRAM_MARGIN_TOP = 70;
const SECTION_DIAGRAM_MARGIN_RIGHT = 180;
const SECTION_DIAGRAM_MARGIN_BOTTOM = 95;

function sanitizeDiagramDimension(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function formatDiagramDimension(value: number): string {
  return Number.isFinite(value) && value > 0
    ? formatMinimumReinforcementNumber(value, 1)
    : "0";
}

function escapeSvgAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

function getReinforcedConcreteSectionScene({
  widthMm,
  heightMm,
  reinforcementCentroidDistanceMm,
  rebarDiameterMm,
  minimumAreaMm2,
}: {
  widthMm: number;
  heightMm: number;
  reinforcementCentroidDistanceMm: number;
  rebarDiameterMm: number;
  minimumAreaMm2?: number;
}): SceneDefinition {
  const safeWidthMm = sanitizeDiagramDimension(widthMm);
  const safeHeightMm = sanitizeDiagramDimension(heightMm);
  const safeRebarDiameterMm = sanitizeDiagramDimension(rebarDiameterMm);
  const safeCentroidDistanceMm = Math.max(
    safeRebarDiameterMm / 2,
    sanitizeDiagramDimension(reinforcementCentroidDistanceMm),
  );
  const bottomCoverMm = Math.max(0, safeCentroidDistanceMm - safeRebarDiameterMm / 2);
  const sceneWidth = Math.ceil(
    SECTION_DIAGRAM_MARGIN_LEFT + safeWidthMm + SECTION_DIAGRAM_MARGIN_RIGHT,
  );
  const sceneHeight = Math.ceil(
    SECTION_DIAGRAM_MARGIN_TOP + safeHeightMm + SECTION_DIAGRAM_MARGIN_BOTTOM,
  );
  const bottomAreaLabel =
    minimumAreaMm2 && Number.isFinite(minimumAreaMm2) && minimumAreaMm2 > 0
      ? `As,min = ${formatMinimumReinforcementNumber(minimumAreaMm2, 1)} мм²`
      : "As,min";

  return {
    scene: {
      width: sceneWidth,
      height: sceneHeight,
      mode: "detailed",
    },
    objects: {
      section: {
        type: "ReinforcedConcreteSection",
        params: {
          x: SECTION_DIAGRAM_MARGIN_LEFT,
          y: SECTION_DIAGRAM_MARGIN_TOP,
          width: safeWidthMm,
          height: safeHeightMm,
          showTopRebar: false,
          showBottomRebar: true,
          topDiameter: safeRebarDiameterMm,
          bottomDiameter: safeRebarDiameterMm,
          topCover: bottomCoverMm,
          bottomCover: bottomCoverMm,
          topAreaLabel: "A's",
          bottomAreaLabel,
          showLeftCenterDimensions: true,
          showRightRebarDimensions: true,
          showTotalHeightDimension: true,
          showWidthDimension: true,
          bodyFill: "#f8fafc",
          rebarFill: "#d8c4ff",
          rebarColor: "#7a3ea0",
          dimensionColor: "#1f2937",
          calloutColor: "#e95a0c",
          color: "#1f2937",
          strokeWidth: 1.5,
          lineType: "solid",
        },
      },
    },
  };
}

function ParametricSectionDiagram({
  widthMm,
  heightMm,
  reinforcementCentroidDistanceMm,
  rebarDiameterMm,
  minimumAreaMm2,
}: {
  widthMm: number;
  heightMm: number;
  reinforcementCentroidDistanceMm: number;
  rebarDiameterMm: number;
  minimumAreaMm2?: number;
}) {
  const title = `Параметричний залізобетонний переріз bt ${formatDiagramDimension(
    widthMm,
  )} мм, h ${formatDiagramDimension(heightMm)} мм`;
  const svg = buildScene(
    getReinforcedConcreteSectionScene({
      widthMm,
      heightMm,
      reinforcementCentroidDistanceMm,
      rebarDiameterMm,
      minimumAreaMm2,
    }),
    SVG_PARAMETRIC_REGISTRY,
  ).svg.replace(
    "<svg ",
    `<svg role="img" aria-label="${title}" class="minimum-reinforcement-diagram__svg" `,
  );

  return (
    <figure className="minimum-reinforcement-diagram minimum-reinforcement-diagram--parametric">
      <div
        className="minimum-reinforcement-diagram__canvas"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <figcaption>Параметричний залізобетонний переріз</figcaption>
    </figure>
  );
}

function buildMinimumReinforcementDiagramFigure(
  report: MinimumReinforcementReport,
): DocxReportFigure {
  const title = `Параметричний залізобетонний переріз bt ${formatDiagramDimension(
    report.input.tensileZoneWidthMm,
  )} мм, h ${formatDiagramDimension(report.input.sectionHeightMm)} мм`;
  const sceneDefinition = getReinforcedConcreteSectionScene({
    widthMm: report.input.tensileZoneWidthMm,
    heightMm: report.input.sectionHeightMm,
    reinforcementCentroidDistanceMm: report.input.reinforcementCentroidDistanceMm,
    rebarDiameterMm: report.input.rebarDiameterMm,
    minimumAreaMm2: report.values?.minimumAreaMm2,
  });
  const svg = buildScene(sceneDefinition, SVG_PARAMETRIC_REGISTRY).svg.replace(
    "<svg ",
    `<svg role="img" aria-label="${escapeSvgAttribute(
      title,
    )}" class="minimum-reinforcement-diagram__svg" `,
  );

  return {
    key: "minimum-reinforcement-section-diagram",
    caption: "Параметричний залізобетонний переріз",
    svg,
    widthPx: sceneDefinition.scene.width,
    heightPx: sceneDefinition.scene.height,
  };
}

export function buildMinimumReinforcementDocxReport(
  report: MinimumReinforcementReport,
  date = new Date(),
) {
  return buildNativeDocxReport({
    title: "Покроковий звіт",
    fileBaseName: `minimalne-armuvannia-${formatDocxFileDate(date)}`,
    figures: [buildMinimumReinforcementDiagramFigure(report)],
    steps: report.steps,
  });
}

export function MinimumReinforcementCalculator() {
  const [inputValues, setInputValues] = useState<CalculatorInputValues>(
    () => getDefaultInputSchemaValues(MINIMUM_REINFORCEMENT_INPUT_SCHEMA),
  );
  const structureType = String(
    inputValues.structureType ?? "beam",
  ) as MinimumReinforcementStructureType;
  const concreteClass = String(inputValues.concreteClass ?? DEFAULT_CONCRETE_CLASS);
  const rebarClass = String(inputValues.rebarClass ?? DEFAULT_REBAR_CLASS);
  const sectionHeightInput = String(inputValues.sectionHeightMm ?? "500");
  const tensileZoneWidthInput = String(inputValues.tensileZoneWidthMm ?? "1000");
  const reinforcementCentroidDistanceInput = String(
    inputValues.reinforcementCentroidDistanceMm ?? "50",
  );
  const rebarDiameterInput = String(inputValues.rebarDiameterMm ?? "16");

  const report = useMemo(
    () =>
      getMinimumReinforcementReport({
        structureType,
        concreteClass,
        rebarClass,
        sectionHeightMm: parseNumberInput(sectionHeightInput),
        tensileZoneWidthMm: tensileZoneWidthInput
          ? parseNumberInput(tensileZoneWidthInput)
          : undefined,
        reinforcementCentroidDistanceMm: parseNumberInput(
          reinforcementCentroidDistanceInput,
        ),
        rebarDiameterMm: parseNumberInput(rebarDiameterInput),
      }),
    [
      concreteClass,
      rebarClass,
      rebarDiameterInput,
      reinforcementCentroidDistanceInput,
      sectionHeightInput,
      structureType,
      tensileZoneWidthInput,
    ],
  );
  const docxReport = useMemo(
    () => buildMinimumReinforcementDocxReport(report),
    [report],
  );
  const rebarSelectionHref =
    report.valid && report.values
      ? `/calculator/rebar-area-bars?minimumArea=${encodeURIComponent(
          formatMinimumReinforcementNumber(report.values.minimumAreaMm2, 1),
        )}&unit=mm2&returnTo=${encodeURIComponent(
          "/calculator/minimum-reinforcement-area",
        )}&returnLabel=${encodeURIComponent("Повернутися до As,min")}`
      : "/calculator/rebar-area-bars";
  const rebarSelection = useMemo(
    () =>
      report.valid && report.values
        ? getRebarSelection({
            requiredAreaSquareMillimeters: report.values.minimumAreaMm2,
            customCount: 10,
          }).bestMatch
        : null,
    [report],
  );
  const rebarSpacingSelection = useMemo(
    () =>
      report.valid && report.values
        ? getRebarSpacingSelection({
            requiredAreaSquareMillimeters: report.values.minimumAreaMm2,
            customSpacingMillimeters: 400,
          }).bestMatch
        : null,
    [report],
  );

  const resultSummary =
    report.valid && report.values ? (
      <>
        <p>
          <MathNotation base="A" subscript="s,min" ariaLabel="As,min" /> ={" "}
          {report.values.minimumAreaMm2.toFixed(1)} мм² ={" "}
          {report.values.minimumAreaCm2.toFixed(2)} см²;{" "}
          <MathNotation base="d" ariaLabel="d" /> ={" "}
          {report.values.effectiveDepthMm} мм.
        </p>
        <p className="minimum-reinforcement-summary__handoff">
          {structureType === "slab" && rebarSpacingSelection ? (
            <>
              Рекомендований підбір на 1 м.п.: Ø
              {rebarSpacingSelection.diameter} крок{" "}
              {rebarSpacingSelection.spacingMillimeters} мм ={" "}
              {formatMinimumReinforcementNumber(
                rebarSpacingSelection.areaSquareMillimeters,
                1,
              )}{" "}
              мм²/м.п. (
              {(
                (rebarSpacingSelection.areaSquareMillimeters /
                  report.values.minimumAreaMm2) *
                100
              ).toFixed(1)}
              % від As,min).
            </>
          ) : structureType === "beam" && rebarSelection ? (
            <>
              Рекомендований підбір: {rebarSelection.count}Ø
              {rebarSelection.diameter} ={" "}
              {formatMinimumReinforcementNumber(
                rebarSelection.areaSquareMillimeters,
                1,
              )}{" "}
              мм² (
              {(
                (rebarSelection.areaSquareMillimeters /
                  report.values.minimumAreaMm2) *
                100
              ).toFixed(1)}
              % від As,min).
            </>
          ) : (
            <>
              Для As,min = {report.values.minimumAreaMm2.toFixed(1)} мм² не знайдено
              {structureType === "slab"
                ? " підбір на 1 м.п. у поточному сортаменті."
                : " підбір у поточному сортаменті."}
            </>
          )}
        </p>
        <Link className="minimum-reinforcement-summary__link" href={rebarSelectionHref}>
          {structureType === "slab"
            ? "Підібрати діаметр і крок арматури на 1 м.п."
            : "Підібрати діаметр і кількість арматури"}
        </Link>
      </>
    ) : null;

  return (
    <NativeCalculatorLayout
      ariaLabel="Калькулятор мінімальної площі армування"
      navLinks={[
        { href: "#minimum-reinforcement-inputs", label: "Ввід" },
        { href: "#native-calculator-diagrams-title", label: "Схема" },
        { href: "#minimum-report-title", label: "Звіт" },
      ]}
      summary={resultSummary}
      controls={
        <InputSchemaForm
          schema={MINIMUM_REINFORCEMENT_INPUT_SCHEMA}
          values={inputValues}
          onValuesChange={setInputValues}
        />
      }
      diagrams={
        <div className="minimum-reinforcement-diagrams__grid">
          <ParametricSectionDiagram
            widthMm={parseNumberInput(tensileZoneWidthInput)}
            heightMm={parseNumberInput(sectionHeightInput)}
            reinforcementCentroidDistanceMm={parseNumberInput(
              reinforcementCentroidDistanceInput,
            )}
            rebarDiameterMm={parseNumberInput(rebarDiameterInput)}
            minimumAreaMm2={
              report.valid && report.values ? report.values.minimumAreaMm2 : undefined
            }
          />
        </div>
      }
      errors={report.errors}
      warnings={report.warnings}
    >
      <NativeReport
        titleId="minimum-report-title"
        title="Покроковий звіт"
        steps={report.steps}
        renderText={(text) => <FormulaText text={text} />}
        actions={<ReportDocxButton report={docxReport} />}
      />
    </NativeCalculatorLayout>
  );
}
