"use client";

import { useMemo, useState } from "react";

import {
  CASSOON_LOAD_DISTRIBUTION_LENGTH_UNITS,
  CASSOON_LOAD_DISTRIBUTION_LOAD_UNITS,
  CASSOON_LOAD_DISTRIBUTION_SOURCE,
  formatCassoonLoadDistributionNumber,
  getCassoonLoadDistributionReport,
  type CassoonLoadDistributionLoadUnit,
  type CassoonLoadDistributionReportStep,
  type CassoonLoadDistributionValues,
} from "@/lib/cassoon-load-distribution";
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

const SYMBOLS = {
  "ld/lk": { base: "l", subscript: "d", ariaLabel: "ld/lk" },
  "ld^4": { base: "l", subscript: "d", superscript: "4", ariaLabel: "ld^4" },
  "lk^4": { base: "l", subscript: "k", superscript: "4", ariaLabel: "lk^4" },
  qk: { base: "q", subscript: "k", ariaLabel: "qk" },
  qd: { base: "q", subscript: "d", ariaLabel: "qd" },
  lk: { base: "l", subscript: "k", ariaLabel: "lk" },
  ld: { base: "l", subscript: "d", ariaLabel: "ld" },
  c1: { base: "c", subscript: "1", ariaLabel: "c1" },
  c2: { base: "c", subscript: "2", ariaLabel: "c2" },
  q: { base: "q", ariaLabel: "q" },
} as const;

const SYMBOL_PATTERN = new RegExp(
  Object.keys(SYMBOLS)
    .sort((left, right) => right.length - left.length)
    .map((symbol) => symbol.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|"),
  "g",
);

const LENGTH_DISPLAY_UNITS = Object.entries(CASSOON_LOAD_DISTRIBUTION_LENGTH_UNITS).map(
  ([value, unit]) => ({
    value,
    label: unit.label,
    factorToBase: unit.factorToM,
  }),
);

const LOAD_DISPLAY_UNITS = Object.entries(CASSOON_LOAD_DISTRIBUTION_LOAD_UNITS).map(
  ([value, unit]) => ({
    value,
    label: unit.label,
    factorToBase: unit.factorToKnM2,
  }),
);

const CASSOON_INPUT_SCHEMA: CalculatorInputSchema = {
  groups: [
    {
      id: "inputs",
      title: "Вихідні дані",
      fields: [
        {
          id: "shortSpanM",
          kind: "number",
          prefix: { text: "l", subscript: "k", ariaLabel: "lk" },
          name: "Короткий проліт",
          defaultValue: "3",
          min: 0,
          step: "0.1",
          description: "Короткий або перший введений проліт; розрахунок нормалізує lk <= ld.",
          baseUnit: "m",
          defaultDisplayUnit: "m",
          displayUnits: LENGTH_DISPLAY_UNITS,
        },
        {
          id: "longSpanM",
          kind: "number",
          prefix: { text: "l", subscript: "d", ariaLabel: "ld" },
          name: "Довгий проліт",
          defaultValue: "6",
          min: 0,
          step: "0.1",
          description: "Довгий або другий введений проліт; розрахунок нормалізує lk <= ld.",
          baseUnit: "m",
          defaultDisplayUnit: "m",
          displayUnits: LENGTH_DISPLAY_UNITS,
        },
        {
          id: "totalLoadKnM2",
          kind: "number",
          prefix: { text: "q", ariaLabel: "q" },
          name: "Повне навантаження",
          defaultValue: "10",
          min: 0,
          step: "0.1",
          description: "Повне рівномірно розподілене навантаження на плиту.",
          baseUnit: "kn-m2",
          defaultDisplayUnit: "kn-m2",
          displayUnits: LOAD_DISPLAY_UNITS,
        },
      ],
    },
  ],
};

function parseNumberInput(value: string): number {
  return Number.parseFloat(value.replace(",", "."));
}

function getDisplayLoadValue(valueKnM2: number, unit: CassoonLoadDistributionLoadUnit): number {
  return valueKnM2 / CASSOON_LOAD_DISTRIBUTION_LOAD_UNITS[unit].factorToKnM2;
}

function isFormulaBoundary(value: string | undefined): boolean {
  return !value || !/[A-Za-z0-9_,/^]/.test(value);
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
          if (part === "ld/lk") {
            return (
              <span key={`${part}:${index}`} className="cassoon-formula-symbol">
                <MathNotation base="l" subscript="d" ariaLabel="ld" />
                <span aria-hidden="true">/</span>
                <MathNotation base="l" subscript="k" ariaLabel="lk" />
              </span>
            );
          }

          const symbol = SYMBOLS[part as keyof typeof SYMBOLS];

          return (
            <span key={`${part}:${index}`} className="cassoon-formula-symbol">
              <MathNotation
                base={symbol.base}
                subscript={"subscript" in symbol ? symbol.subscript : undefined}
                superscript={"superscript" in symbol ? symbol.superscript : undefined}
                ariaLabel={symbol.ariaLabel}
              />
            </span>
          );
        }

        return <span key={`${part}:${index}`}>{part}</span>;
      })}
    </>
  );
}

function ReportStepFormula({ step }: { step: CassoonLoadDistributionReportStep }) {
  if (!step.formula) {
    return null;
  }

  const formulaLines = step.formula.split("; ");

  return (
    <div
      className="cassoon-load-equation"
      aria-label={step.formula}
      title={step.formula}
    >
      {formulaLines.map((line, index) => (
        <span className="cassoon-load-equation__line" key={`${step.key}:${line}`}>
          <FormulaText
            text={
              index < formulaLines.length - 1 && !line.endsWith(";")
                ? `${line};`
                : line
            }
          />
        </span>
      ))}
    </div>
  );
}

const SVG_PARAMETRIC_REGISTRY = createDefaultRegistry();
const CASSOON_DIAGRAM_WIDTH = 570;
const CASSOON_DIAGRAM_HEIGHT = 360;
const CASSOON_SLAB_HEIGHT = 170;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function sanitizeDiagramValue(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function formatDiagramMeterValue(value: number): string {
  return formatCassoonLoadDistributionNumber(value, 3);
}

function formatDiagramLoadValue(
  valueKnM2: number,
  unit: CassoonLoadDistributionLoadUnit,
): string {
  const selectedUnit = CASSOON_LOAD_DISTRIBUTION_LOAD_UNITS[unit];

  return `${formatCassoonLoadDistributionNumber(
    getDisplayLoadValue(valueKnM2, unit),
    selectedUnit.fractionDigits,
  )} ${selectedUnit.label}`;
}

function escapeSvgAttribute(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;");
}

function getCassoonLoadDistributionScene({
  shortSpanM,
  longSpanM,
  shortDirectionLoadLabel,
  longDirectionLoadLabel,
  totalLoadLabel,
  shortDirectionLoadShare,
  longDirectionLoadShare,
}: {
  shortSpanM: number;
  longSpanM: number;
  shortDirectionLoadLabel: string;
  longDirectionLoadLabel: string;
  totalLoadLabel: string;
  shortDirectionLoadShare: number;
  longDirectionLoadShare: number;
}): SceneDefinition {
  const safeShortSpanM = sanitizeDiagramValue(shortSpanM, 3);
  const safeLongSpanM = Math.max(
    safeShortSpanM,
    sanitizeDiagramValue(longSpanM, safeShortSpanM * 2),
  );
  const spanRatio = safeLongSpanM / safeShortSpanM;
  const slabWidth = clamp(CASSOON_SLAB_HEIGHT * spanRatio, 270, 390);
  const slabHeight = CASSOON_SLAB_HEIGHT;
  const slabX = Math.round((CASSOON_DIAGRAM_WIDTH - slabWidth) / 2 + 10);
  const slabY = 118;
  const centerX = slabX + slabWidth / 2;
  const centerY = slabY + slabHeight / 2;
  const horizontalBandHeight = slabHeight / safeShortSpanM;
  const verticalBandWidth = slabWidth / safeLongSpanM;
  const maxLoadHeight = 46;
  const minVisibleLoadHeight = 12;
  const getLoadHeight = (share: number) => {
    const clampedShare = clamp(share, 0, 1);

    return clampedShare <= 0 ? 0 : Math.max(minVisibleLoadHeight, maxLoadHeight * clampedShare);
  };
  const shortDirectionLoadHeight = getLoadHeight(shortDirectionLoadShare);
  const longDirectionLoadHeight = getLoadHeight(longDirectionLoadShare);
  const loadColor = "#0b78de";
  const lineColor = "#111827";
  const fillColor = "#fff7ed";
  const hatchColor = "#111827";

  return {
    scene: {
      width: CASSOON_DIAGRAM_WIDTH,
      height: CASSOON_DIAGRAM_HEIGHT,
    },
    objects: {
      slab: {
        type: "RectBlock",
        params: {
          x: slabX,
          y: slabY,
          width: slabWidth,
          height: slabHeight,
          fill: "#ffffff",
          color: lineColor,
          strokeWidth: 2,
        },
      },
      horizontalLoadStrip: {
        type: "RectBlock",
        params: {
          x: slabX,
          y: centerY - horizontalBandHeight / 2,
          width: slabWidth,
          height: horizontalBandHeight,
          fill: fillColor,
          hatch: {
            type: "diagonal",
            spacing: 9,
            color: hatchColor,
            strokeWidth: 1.2,
          },
          color: lineColor,
          strokeWidth: 1.4,
        },
      },
      verticalLoadStrip: {
        type: "RectBlock",
        params: {
          x: centerX - verticalBandWidth / 2,
          y: slabY,
          width: verticalBandWidth,
          height: slabHeight,
          fill: fillColor,
          hatch: {
            type: "diagonal",
            spacing: 9,
            color: hatchColor,
            strokeWidth: 1.2,
          },
          color: lineColor,
          strokeWidth: 1.4,
        },
      },
      longDirectionLoad: {
        type: "DistributedLoad",
        params: {
          x1: "${objects.slab.anchors.topLeft.x}",
          y1: "${objects.slab.anchors.topLeft.y}",
          x2: "${objects.slab.anchors.topRight.x}",
          y2: "${objects.slab.anchors.topRight.y}",
          offset: -8,
          height: longDirectionLoadHeight,
          arrowSpacing: 42,
          arrowSize: 8,
          value: longDirectionLoadLabel,
          prefix: "qd = ",
          color: loadColor,
          strokeWidth: 1.6,
          fontSize: 17,
        },
      },
      shortDirectionLoad: {
        type: "DistributedLoad",
        params: {
          x1: "${objects.slab.anchors.bottomLeft.x}",
          y1: "${objects.slab.anchors.bottomLeft.y}",
          x2: "${objects.slab.anchors.topLeft.x}",
          y2: "${objects.slab.anchors.topLeft.y}",
          offset: -8,
          height: shortDirectionLoadHeight,
          arrowSpacing: 42,
          arrowSize: 8,
          value: shortDirectionLoadLabel,
          prefix: "qk = ",
          textOffset: 22,
          color: loadColor,
          strokeWidth: 1.6,
          fontSize: 17,
        },
      },
      longSpanDimension: {
        type: "Dimension",
        params: {
          x1: "${objects.slab.anchors.bottomLeft.x}",
          y1: "${objects.slab.anchors.bottomLeft.y}",
          x2: "${objects.slab.anchors.bottomRight.x}",
          y2: "${objects.slab.anchors.bottomRight.y}",
          offset: 54,
          scale: safeLongSpanM / slabWidth,
          prefix: "ld = ",
          suffix: " м",
          color: lineColor,
          strokeWidth: 1,
          fontSize: 16,
        },
      },
      shortSpanDimension: {
        type: "Dimension",
        params: {
          x1: "${objects.slab.anchors.topRight.x}",
          y1: "${objects.slab.anchors.topRight.y}",
          x2: "${objects.slab.anchors.bottomRight.x}",
          y2: "${objects.slab.anchors.bottomRight.y}",
          offset: -48,
          scale: safeShortSpanM / slabHeight,
          prefix: "lk = ",
          suffix: " м",
          color: lineColor,
          strokeWidth: 1,
          fontSize: 16,
        },
      },
      stripDimension: {
        type: "Dimension",
        params: {
          x1: centerX - verticalBandWidth / 2,
          y1: "${objects.slab.anchors.bottom.y}",
          x2: centerX + verticalBandWidth / 2,
          y2: "${objects.slab.anchors.bottom.y}",
          offset: 25,
          scale: 1 / verticalBandWidth,
          prefix: "",
          suffix: " м",
          color: loadColor,
          strokeWidth: 1,
          fontSize: 14,
        },
      },
      horizontalStripDimension: {
        type: "Dimension",
        params: {
          x1: "${objects.slab.anchors.right.x}",
          y1: centerY - horizontalBandHeight / 2,
          x2: "${objects.slab.anchors.right.x}",
          y2: centerY + horizontalBandHeight / 2,
          offset: -24,
          scale: 1 / horizontalBandHeight,
          prefix: "",
          suffix: " м",
          color: loadColor,
          strokeWidth: 1,
          fontSize: 14,
        },
      },
      totalLoadLabel: {
        type: "TextLabel",
        params: {
          x: centerX + slabWidth * 0.22,
          y: centerY + 41,
          text: `q = ${totalLoadLabel}`,
          color: lineColor,
          fontSize: 16,
          fontFamily: "Arial, sans-serif",
          textAnchor: "middle",
        },
      },
    },
  };
}

function ParametricLoadDistributionDiagram({
  values,
  totalLoadKnM2,
  loadUnit,
}: {
  values: CassoonLoadDistributionValues | null;
  totalLoadKnM2: number;
  loadUnit: CassoonLoadDistributionLoadUnit;
}) {
  const shortSpanM = values?.shortSpanM ?? 3;
  const longSpanM = values?.longSpanM ?? 6;
  const shortDirectionLoadKnM2 = values?.shortDirectionLoadKnM2 ?? 0;
  const longDirectionLoadKnM2 = values?.longDirectionLoadKnM2 ?? 0;
  const totalLoadLabel = Number.isFinite(totalLoadKnM2) && totalLoadKnM2 > 0
    ? formatDiagramLoadValue(totalLoadKnM2, loadUnit)
    : "q";
  const shortDirectionLoadLabel = values
    ? formatDiagramLoadValue(shortDirectionLoadKnM2, loadUnit)
    : "";
  const longDirectionLoadLabel = values
    ? formatDiagramLoadValue(longDirectionLoadKnM2, loadUnit)
    : "";
  const title = `Параметрична схема розподілу навантаження q між напрямами lk і ld: lk ${formatDiagramMeterValue(
    shortSpanM,
  )} м, ld ${formatDiagramMeterValue(longSpanM)} м`;
  const svg = buildScene(
    getCassoonLoadDistributionScene({
      shortSpanM,
      longSpanM,
      shortDirectionLoadLabel,
      longDirectionLoadLabel,
      totalLoadLabel,
      shortDirectionLoadShare:
        totalLoadKnM2 > 0 ? shortDirectionLoadKnM2 / totalLoadKnM2 : 0,
      longDirectionLoadShare:
        totalLoadKnM2 > 0 ? longDirectionLoadKnM2 / totalLoadKnM2 : 0,
    }),
    SVG_PARAMETRIC_REGISTRY,
  ).svg.replace(
    "<svg ",
    `<svg role="img" aria-label="${escapeSvgAttribute(title)}" class="cassoon-load-diagram__svg" `,
  );

  return (
    <figure className="cassoon-load-diagram">
      <div
        className="cassoon-load-diagram__canvas"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <figcaption>
        На схемі показано, як повне навантаження q розподіляється між
        коротким напрямом qk та довгим напрямом qd. Заштриховані смуги
        відповідають ділянкам шириною 1 м, для яких наведено розміри lk і ld.
      </figcaption>
    </figure>
  );
}

export function CassoonLoadDistributionCalculator() {
  const [inputValues, setInputValues] = useState<CalculatorInputValues>(
    () => getDefaultInputSchemaValues(CASSOON_INPUT_SCHEMA),
  );
  const shortSpanM = String(inputValues.shortSpanM ?? "3");
  const longSpanM = String(inputValues.longSpanM ?? "6");
  const totalLoadKnM2 = String(inputValues.totalLoadKnM2 ?? "10");
  const loadUnit: CassoonLoadDistributionLoadUnit = "kn-m2";
  const selectedLoadUnit = CASSOON_LOAD_DISTRIBUTION_LOAD_UNITS[loadUnit];

  const report = useMemo(
    () => {
      const shortSpan = parseNumberInput(shortSpanM);
      const longSpan = parseNumberInput(longSpanM);
      const totalLoad = parseNumberInput(totalLoadKnM2);

      return getCassoonLoadDistributionReport({
        shortSpanM: shortSpan,
        longSpanM: longSpan,
        shortSpanDisplayValue: shortSpan,
        shortSpanUnit: "m",
        longSpanDisplayValue: longSpan,
        longSpanUnit: "m",
        totalLoadKnM2: totalLoad,
        loadUnit,
      });
    },
    [
      longSpanM,
      shortSpanM,
      totalLoadKnM2,
    ],
  );

  return (
    <div
      className="cassoon-load-calculator"
      aria-label="Калькулятор коефіцієнтів c1 і c2 для розподілу навантаження"
    >
      <div className="cassoon-load-layout">
        <InputSchemaForm
          schema={CASSOON_INPUT_SCHEMA}
          values={inputValues}
          onValuesChange={setInputValues}
        />

        <ParametricLoadDistributionDiagram
          values={report.values}
          totalLoadKnM2={report.input.totalLoadKnM2}
          loadUnit={loadUnit}
        />
      </div>

      {report.valid && report.values ? (
        <div className="cassoon-load-summary" aria-live="polite">
          <p>
            <MathNotation base="c" subscript="1" ariaLabel="c1" /> ={" "}
            {formatCassoonLoadDistributionNumber(report.values.c1, 4)};{" "}
            <MathNotation base="c" subscript="2" ariaLabel="c2" /> ={" "}
            {formatCassoonLoadDistributionNumber(report.values.c2, 4)};{" "}
            <MathNotation base="l" subscript="d" ariaLabel="ld" />/
            <MathNotation base="l" subscript="k" ariaLabel="lk" /> ={" "}
            {formatCassoonLoadDistributionNumber(report.values.spanRatio, 3)}.
          </p>
          <p>
            <MathNotation base="q" subscript="k" ariaLabel="qk" /> ={" "}
            {formatCassoonLoadDistributionNumber(
              getDisplayLoadValue(report.values.shortDirectionLoadKnM2, loadUnit),
              selectedLoadUnit.fractionDigits,
            )}{" "}
            {selectedLoadUnit.label};{" "}
            <MathNotation base="q" subscript="d" ariaLabel="qd" /> ={" "}
            {formatCassoonLoadDistributionNumber(
              getDisplayLoadValue(report.values.longDirectionLoadKnM2, loadUnit),
              selectedLoadUnit.fractionDigits,
            )}{" "}
            {selectedLoadUnit.label}.
          </p>
        </div>
      ) : null}

      <p className="cassoon-load-source">
        Джерело:{" "}
        <a
          href={CASSOON_LOAD_DISTRIBUTION_SOURCE.url}
          target="_blank"
          rel="noreferrer"
        >
          {CASSOON_LOAD_DISTRIBUTION_SOURCE.label}
        </a>
      </p>

      {report.errors.length > 0 ? (
        <div className="cassoon-load-errors" role="alert">
          <ul>
            {report.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {report.warnings.length > 0 ? (
        <div className="cassoon-load-warning" role="status">
          {report.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}

      <section className="cassoon-load-report" aria-labelledby="cassoon-load-report-title">
        <div className="cassoon-load-report__head">
          <h3 id="cassoon-load-report-title">Покроковий звіт</h3>
        </div>

        <ol className="cassoon-load-report__steps">
          {report.steps.map((step) => (
            <li key={step.key} className="cassoon-load-report__step">
              <p className="cassoon-load-report__caption">
                <FormulaText text={step.caption} />
              </p>
              {step.items ? (
                <ul className="cassoon-load-report__items">
                  {step.items.map((item) => (
                    <li key={item}>
                      <FormulaText text={item} />
                    </li>
                  ))}
                </ul>
              ) : null}
              <ReportStepFormula step={step} />
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
