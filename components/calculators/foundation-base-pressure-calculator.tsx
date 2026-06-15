"use client";

import { useMemo, useState } from "react";

import {
  DEFAULT_FOUNDATION_BASE_PRESSURE_INPUT,
  FOUNDATION_BASE_PRESSURE_SOURCE,
  formatFoundationBasePressureNumber,
  getFoundationBasePressureReport,
  type FoundationBasePressureInput,
  type FoundationBasePressureReport,
} from "@/lib/foundation-base-pressure";
import {
  getDefaultInputSchemaValues,
  type CalculatorInputSchema,
  type CalculatorInputValues,
} from "@/lib/calculator-input-schema";
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

const TON_UNIT = [{ value: "t", label: "т", factorToBase: 1 }];
const TON_MOMENT_UNIT = [{ value: "t-m", label: "т·м", factorToBase: 1 }];
const TON_UNIT_WEIGHT = [{ value: "t-m3", label: "т/м³", factorToBase: 1 }];

export const FOUNDATION_BASE_PRESSURE_INPUT_SCHEMA: CalculatorInputSchema = {
  groups: [
    {
      id: "foundation-base-pressure-loads",
      title: "Навантаження",
      fields: [
        {
          id: "verticalForceT",
          kind: "number",
          prefix: { text: "N", ariaLabel: "N" },
          name: "Вертикальна сила",
          defaultValue: String(DEFAULT_FOUNDATION_BASE_PRESSURE_INPUT.verticalForceT),
          step: "0.01",
          defaultDisplayUnit: "t",
          displayUnits: TON_UNIT,
          description: "Вертикальна сила N на рівні верху фундаменту.",
        },
        {
          id: "momentXTm",
          kind: "number",
          prefix: { text: "M", subscript: "x", ariaLabel: "Mx" },
          name: "Момент відносно осі x",
          defaultValue: String(DEFAULT_FOUNDATION_BASE_PRESSURE_INPUT.momentXTm),
          step: "0.01",
          defaultDisplayUnit: "t-m",
          displayUnits: TON_MOMENT_UNIT,
          description: "Момент Mx на рівні верху фундаменту.",
        },
        {
          id: "shearYT",
          kind: "number",
          prefix: { text: "Q", subscript: "y", ariaLabel: "Qy" },
          name: "Поперечна сила вздовж осі y",
          defaultValue: String(DEFAULT_FOUNDATION_BASE_PRESSURE_INPUT.shearYT),
          step: "0.001",
          defaultDisplayUnit: "t",
          displayUnits: TON_UNIT,
          description: "Поперечна сила Qy створює додатковий момент Mx_base.",
        },
        {
          id: "momentYTm",
          kind: "number",
          prefix: { text: "M", subscript: "y", ariaLabel: "My" },
          name: "Момент відносно осі y",
          defaultValue: String(DEFAULT_FOUNDATION_BASE_PRESSURE_INPUT.momentYTm),
          step: "0.01",
          defaultDisplayUnit: "t-m",
          displayUnits: TON_MOMENT_UNIT,
          description: "Момент My на рівні верху фундаменту.",
        },
        {
          id: "shearXT",
          kind: "number",
          prefix: { text: "Q", subscript: "x", ariaLabel: "Qx" },
          name: "Поперечна сила вздовж осі x",
          defaultValue: String(DEFAULT_FOUNDATION_BASE_PRESSURE_INPUT.shearXT),
          step: "0.001",
          defaultDisplayUnit: "t",
          displayUnits: TON_UNIT,
          description: "Поперечна сила Qx створює додатковий момент My_base.",
        },
      ],
    },
    {
      id: "foundation-base-pressure-geometry",
      title: "Геометрія фундаменту",
      fields: [
        {
          id: "foundationLengthM",
          kind: "number",
          prefix: { text: "l", ariaLabel: "l" },
          name: "Довжина підошви фундаменту",
          defaultValue: String(DEFAULT_FOUNDATION_BASE_PRESSURE_INPUT.foundationLengthM),
          min: 0,
          step: "0.01",
          quantity: "length",
          baseUnit: "m",
          defaultDisplayUnit: "m",
          description: "Довжина прямокутної підошви фундаменту l.",
        },
        {
          id: "foundationWidthM",
          kind: "number",
          prefix: { text: "b", ariaLabel: "b" },
          name: "Ширина підошви фундаменту",
          defaultValue: String(DEFAULT_FOUNDATION_BASE_PRESSURE_INPUT.foundationWidthM),
          min: 0,
          step: "0.01",
          quantity: "length",
          baseUnit: "m",
          defaultDisplayUnit: "m",
          description: "Ширина прямокутної підошви фундаменту b.",
        },
      ],
    },
    {
      id: "foundation-base-pressure-heights",
      title: "Висоти та вага",
      fields: [
        {
          id: "embedmentDepthM",
          kind: "number",
          prefix: { text: "h", subscript: "gr", ariaLabel: "h_gr" },
          name: "Відстань від поверхні ґрунту до підошви",
          defaultValue: String(DEFAULT_FOUNDATION_BASE_PRESSURE_INPUT.embedmentDepthM),
          min: 0,
          step: "0.01",
          quantity: "length",
          baseUnit: "m",
          defaultDisplayUnit: "m",
          description: "Висота h_gr для власної ваги ґрунту і фундаменту на обрізах.",
        },
        {
          id: "loadApplicationHeightM",
          kind: "number",
          prefix: { text: "h", subscript: "fund", ariaLabel: "h_fund" },
          name: "Відстань від рівня прикладання навантаження до підошви",
          defaultValue: String(DEFAULT_FOUNDATION_BASE_PRESSURE_INPUT.loadApplicationHeightM),
          min: 0,
          step: "0.01",
          quantity: "length",
          baseUnit: "m",
          defaultDisplayUnit: "m",
          description: "Висота h_fund для перенесення поперечних сил на рівень підошви.",
        },
        {
          id: "soilAndFoundationUnitWeightTM3",
          kind: "number",
          prefix: { text: "γ", ariaLabel: "γ" },
          name: "Осереднена об'ємна вага ґрунту і фундаменту",
          defaultValue: String(
            DEFAULT_FOUNDATION_BASE_PRESSURE_INPUT.soilAndFoundationUnitWeightTM3,
          ),
          min: 0,
          step: "0.01",
          defaultDisplayUnit: "t-m3",
          displayUnits: TON_UNIT_WEIGHT,
          description: "Осереднена об'ємна вага γ для визначення G_fund.",
        },
      ],
    },
  ],
};

function parseNumberInput(value: string): number {
  return Number.parseFloat(value.replace(",", "."));
}

function inputFromValues(values: CalculatorInputValues): FoundationBasePressureInput {
  return {
    verticalForceT: parseNumberInput(String(values.verticalForceT ?? "26")),
    momentXTm: parseNumberInput(String(values.momentXTm ?? "2")),
    shearYT: parseNumberInput(String(values.shearYT ?? "0.5")),
    momentYTm: parseNumberInput(String(values.momentYTm ?? "9.7")),
    shearXT: parseNumberInput(String(values.shearXT ?? "9")),
    foundationLengthM: parseNumberInput(String(values.foundationLengthM ?? "2.4")),
    foundationWidthM: parseNumberInput(String(values.foundationWidthM ?? "1.8")),
    embedmentDepthM: parseNumberInput(String(values.embedmentDepthM ?? "2")),
    loadApplicationHeightM: parseNumberInput(
      String(values.loadApplicationHeightM ?? "1.6"),
    ),
    soilAndFoundationUnitWeightTM3: parseNumberInput(
      String(values.soilAndFoundationUnitWeightTM3 ?? "2"),
    ),
  };
}

function escapeSvgText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

function getUpliftSummary(report: FoundationBasePressureReport): string {
  const uplift = report.values?.uplift;

  if (!uplift || uplift.type === "none") {
    return "відрив відсутній";
  }

  return `P_lift = ${formatFoundationBasePressureNumber(
    uplift.upliftSharePercent,
    1,
  )}%`;
}

function getStressSummary(report: FoundationBasePressureReport) {
  const uplift = report.values?.uplift;

  if (!uplift) return null;

  if (uplift.type === "none") {
    return uplift.contactStressesTM2.map((stress, index) => (
      <span key={index}>
        <MathNotation base="σ" subscript={String(index + 1)} ariaLabel={`σ${index + 1}`} /> ={" "}
        {formatFoundationBasePressureNumber(stress, 2)} т/м²
      </span>
    ));
  }

  return uplift.contactStressesTM2.map((stress, index) => (
    <span key={index}>
      <MathNotation base="σ" subscript={String(index + 1)} ariaLabel={`σ${index + 1}`} /> ={" "}
      {formatFoundationBasePressureNumber(stress, 2)} т/м²
    </span>
  ));
}

type DiagramPointNumber = 1 | 2 | 3 | 4;

function buildFoundationBasePressureDiagramSvg(report: FoundationBasePressureReport): string {
  const width = 540;
  const height = 340;
  const baseX = 96;
  const baseY = 88;
  const baseWidth = 300;
  const baseHeight = 225;
  const values = report.values;
  const uplift = values?.uplift;
  const title = "Епюра тиску під підошвою фундаменту";
  const project = ([x, y]: [number, number]) => {
    const length = report.input.foundationLengthM;
    const foundationWidth = report.input.foundationWidthM;

    return [
      baseX + (x / length) * baseWidth,
      baseY + baseHeight - (y / foundationWidth) * baseHeight,
    ] as const;
  };
  const contactPolygon =
    uplift && "compressedPolygon" in uplift
      ? uplift.compressedPolygon
          .map((point) => project(point).map((value) => value.toFixed(1)).join(","))
          .join(" ")
      : `${baseX},${baseY} ${baseX + baseWidth},${baseY} ${baseX + baseWidth},${
          baseY + baseHeight
        } ${baseX},${baseY + baseHeight}`;
  const pointMarkers = [
    {
      point: 1,
      cx: baseX + baseWidth,
      cy: baseY,
      textX: baseX + baseWidth + 16,
      textY: baseY - 10,
    },
    {
      point: 2,
      cx: baseX + baseWidth,
      cy: baseY + baseHeight,
      textX: baseX + baseWidth + 16,
      textY: baseY + baseHeight + 19,
    },
    { point: 3, cx: baseX, cy: baseY, textX: baseX - 20, textY: baseY - 10 },
    {
      point: 4,
      cx: baseX,
      cy: baseY + baseHeight,
      textX: baseX - 20,
      textY: baseY + baseHeight + 19,
    },
  ]
    .map(
      ({ point, cx, cy, textX, textY }) => `
  <g data-point-label="${point}">
    <circle cx="${cx}" cy="${cy}" r="10" fill="#ffffff" stroke="#111827" stroke-width="1.5" />
    <text x="${textX}" y="${textY}" class="foundation-base-pressure-diagram__point">${point}</text>
  </g>`,
    )
    .join("");
  const stressLabelPositions = {
    1: { x: baseX + baseWidth + 14, y: baseY - 6 },
    2: { x: baseX + baseWidth + 14, y: baseY + baseHeight + 11 },
    3: { x: baseX + 12, y: baseY - 6 },
    4: { x: baseX + 12, y: baseY + baseHeight + 11 },
  } as const;
  const contactStressPointNumbers =
    uplift?.type === "none"
      ? ([1, 2, 3, 4] satisfies DiagramPointNumber[])
      : uplift?.type === "one-corner"
        ? ([1, 2, 3] satisfies DiagramPointNumber[])
        : uplift?.type === "two-corners"
          ? ([1, 2] satisfies DiagramPointNumber[])
          : [];
  const stressLabels =
    uplift && contactStressPointNumbers.length > 0
      ? contactStressPointNumbers
          .map((point, index) => {
            const stress = uplift.contactStressesTM2[index];
            const position = stressLabelPositions[point];

            return `<text data-stress-label="${point}" x="${position.x}" y="${
              position.y
            }" class="foundation-base-pressure-diagram__label">σ${point} = ${formatFoundationBasePressureNumber(
              stress,
              2,
            )} т/м²</text>`;
          })
          .join("")
      : "";
  const upliftLabel =
    uplift && uplift.type !== "none"
      ? `<text x="${baseX}" y="${baseY - 34}" class="foundation-base-pressure-diagram__label">${escapeSvgText(
          getUpliftSummary(report),
        )}</text>`
      : "";
  const cLabels =
    uplift && (uplift.type === "one-corner" || uplift.type === "two-corners")
      ? `<text x="${baseX}" y="${baseY - 12}" class="foundation-base-pressure-diagram__label">c1 = ${formatFoundationBasePressureNumber(
          uplift.c1M,
          4,
        )} м; c2 = ${formatFoundationBasePressureNumber(uplift.c2M, 4)} м</text>`
      : "";

  return `
<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${title}" class="foundation-base-pressure-diagram__svg" viewBox="0 0 ${width} ${height}">
  <rect x="${baseX}" y="${baseY}" width="${baseWidth}" height="${baseHeight}" fill="#f8fafc" stroke="#111827" stroke-width="2" />
  <polygon points="${contactPolygon}" fill="#dbeafe" stroke="#2563eb" stroke-width="1.8" />
  ${pointMarkers}
  <line x1="${baseX}" y1="${baseY + baseHeight}" x2="${baseX + baseWidth}" y2="${
    baseY + baseHeight
  }" stroke="#111827" stroke-width="1" />
  <text x="${baseX + baseWidth / 2 - 28}" y="${baseY + baseHeight + 24}" class="foundation-base-pressure-diagram__label">l = ${formatFoundationBasePressureNumber(
    report.input.foundationLengthM,
    2,
  )} м</text>
  <text x="${baseX - 56}" y="${baseY + baseHeight / 2}" class="foundation-base-pressure-diagram__label" transform="rotate(-90 ${baseX - 56} ${
    baseY + baseHeight / 2
  })">b = ${formatFoundationBasePressureNumber(report.input.foundationWidthM, 2)} м</text>
  ${upliftLabel}
  ${cLabels}
  ${stressLabels}
</svg>`;
}

function FoundationBasePressureDiagram({ report }: { report: FoundationBasePressureReport }) {
  const svg = buildFoundationBasePressureDiagramSvg(report);

  return (
    <figure className="foundation-base-pressure-diagram">
      <div
        className="foundation-base-pressure-diagram__canvas"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <figcaption>
        Синя область показує стиснуту частину підошви; за наявності відриву
        незафарбована частина відповідає зоні без контакту.
      </figcaption>
    </figure>
  );
}

function buildFoundationBasePressureDiagramFigure(
  report: FoundationBasePressureReport,
): DocxReportFigure {
  return {
    key: "foundation-base-pressure-diagram",
    caption: "Епюра тиску під підошвою фундаменту.",
    svg: buildFoundationBasePressureDiagramSvg(report),
    widthPx: 540,
    heightPx: 340,
  };
}

export function buildFoundationBasePressureDocxReport(
  report: FoundationBasePressureReport,
  date = new Date(),
) {
  return buildNativeDocxReport({
    title: "Покроковий звіт",
    fileBaseName: `napruzhennia-pid-pidoshvoiu-fundamentu-${formatDocxFileDate(date)}`,
    figures: [buildFoundationBasePressureDiagramFigure(report)],
    steps: report.steps,
  });
}

export function FoundationBasePressureCalculator() {
  const [inputValues, setInputValues] = useState<CalculatorInputValues>(() =>
    getDefaultInputSchemaValues(FOUNDATION_BASE_PRESSURE_INPUT_SCHEMA),
  );
  const input = useMemo(() => inputFromValues(inputValues), [inputValues]);
  const report = useMemo(() => getFoundationBasePressureReport(input), [input]);
  const docxReport = useMemo(
    () => buildFoundationBasePressureDocxReport(report),
    [report],
  );
  const stressSummary = getStressSummary(report);
  const resultSummary =
    report.valid && report.values ? (
      <div className="foundation-base-pressure-summary" aria-live="polite">
        <p>{stressSummary}</p>
        <p>{getUpliftSummary(report)}</p>
      </div>
    ) : null;

  return (
    <NativeCalculatorLayout
      ariaLabel="Калькулятор напружень під підошвою фундаменту"
      navLinks={[
        { href: "#foundation-base-pressure-loads", label: "Навантаження" },
        { href: "#foundation-base-pressure-geometry", label: "Геометрія" },
        { href: "#foundation-base-pressure-heights", label: "Висоти" },
        { href: "#foundation-base-pressure-report-title", label: "Звіт" },
      ]}
      summary={resultSummary}
      controls={
        <InputSchemaForm
          schema={FOUNDATION_BASE_PRESSURE_INPUT_SCHEMA}
          values={inputValues}
          onValuesChange={setInputValues}
        />
      }
      diagramTitle="Епюра тиску під підошвою"
      diagrams={<FoundationBasePressureDiagram report={report} />}
      errors={report.errors}
      warnings={report.warnings}
    >
      <p className="foundation-base-pressure-source">
        Джерело: {FOUNDATION_BASE_PRESSURE_SOURCE}
      </p>

      <NativeReport
        titleId="foundation-base-pressure-report-title"
        title="Покроковий звіт"
        steps={report.steps}
        actions={<ReportDocxButton report={docxReport} />}
      />
    </NativeCalculatorLayout>
  );
}
