"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import {
  formatMinimumReinforcementNumber,
  getMinimumReinforcementReport,
  type MinimumReinforcementReportStep,
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

import { MathNotation } from "./math-notation";

const DEFAULT_CONCRETE_CLASS: ConcreteClassName = "C30/37";
const DEFAULT_REBAR_CLASS: RebarClassName = "A500C";

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

function ReportStepFormula({ step }: { step: MinimumReinforcementReportStep }) {
  if (!step.formula) {
    return null;
  }

  return (
    <div
      className="minimum-reinforcement-equation"
      aria-label={step.formula}
      title={step.formula}
    >
      <FormulaText text={step.formula} />
    </div>
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

export function MinimumReinforcementCalculator() {
  const concreteClasses = useMemo(() => getConcreteClasses(), []);
  const rebarClasses = useMemo(() => getRebarClasses(), []);
  const [structureType, setStructureType] =
    useState<MinimumReinforcementStructureType>("beam");
  const [concreteClass, setConcreteClass] =
    useState<ConcreteClassName>(DEFAULT_CONCRETE_CLASS);
  const [rebarClass, setRebarClass] = useState<RebarClassName>(DEFAULT_REBAR_CLASS);
  const [sectionHeightInput, setSectionHeightInput] = useState("500");
  const [tensileZoneWidthInput, setTensileZoneWidthInput] = useState("1000");
  const [reinforcementCentroidDistanceInput, setReinforcementCentroidDistanceInput] =
    useState("50");
  const [rebarDiameterInput, setRebarDiameterInput] = useState("16");

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

  const handleStructureTypeChange = (value: MinimumReinforcementStructureType) => {
    setStructureType(value);
    if (value === "slab" && !tensileZoneWidthInput) {
      setTensileZoneWidthInput("1000");
    }
  };
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

  return (
    <div
      className="minimum-reinforcement-calculator"
      aria-label="Калькулятор мінімальної площі армування"
    >
      <div className="minimum-reinforcement-calculator__controls">
        <label className="minimum-reinforcement-field">
          <span>Тип конструкції</span>
          <select
            value={structureType}
            onChange={(event) =>
              handleStructureTypeChange(
                event.target.value as MinimumReinforcementStructureType,
              )
            }
            aria-label="Тип конструкції"
          >
            <option value="beam">Балка</option>
            <option value="slab">Плита</option>
          </select>
        </label>

        <label className="minimum-reinforcement-field">
          <span>Клас бетону</span>
          <select
            value={concreteClass}
            onChange={(event) => setConcreteClass(event.target.value as ConcreteClassName)}
            aria-label="Клас бетону"
          >
            {concreteClasses.map((className) => (
              <option key={className} value={className}>
                {className}
              </option>
            ))}
          </select>
        </label>

        <label className="minimum-reinforcement-field">
          <span>Клас арматури</span>
          <select
            value={rebarClass}
            onChange={(event) => setRebarClass(event.target.value as RebarClassName)}
            aria-label="Клас арматури"
          >
            {rebarClasses.map((className) => (
              <option key={className} value={className}>
                {className}
              </option>
            ))}
          </select>
        </label>

        <label className="minimum-reinforcement-field minimum-reinforcement-field--number">
          <span>
            <MathNotation base="h" ariaLabel="h" />
            <span className="math-notation__unit">, мм</span>
          </span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="1"
            value={sectionHeightInput}
            onChange={(event) => setSectionHeightInput(event.target.value)}
            aria-label="h, мм"
          />
        </label>

        <label className="minimum-reinforcement-field minimum-reinforcement-field--number">
          <span>
            <MathNotation base="b" subscript="t" ariaLabel="bt" />
            <span className="math-notation__unit">, мм</span>
          </span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="1"
            value={tensileZoneWidthInput}
            onChange={(event) => setTensileZoneWidthInput(event.target.value)}
            aria-label="bt, мм"
          />
        </label>

        <label className="minimum-reinforcement-field minimum-reinforcement-field--number">
          <span>
            <MathNotation base="a" subscript="s" ariaLabel="a_s" />
            <span className="math-notation__unit">, мм</span>
          </span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="1"
            value={reinforcementCentroidDistanceInput}
            onChange={(event) =>
              setReinforcementCentroidDistanceInput(event.target.value)
            }
            aria-label="a_s, мм"
          />
        </label>

        <label className="minimum-reinforcement-field minimum-reinforcement-field--number">
          <span>
            <MathNotation base="Ø" subscript="s" ariaLabel="Øs" />
            <span className="math-notation__unit">, мм</span>
          </span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="1"
            value={rebarDiameterInput}
            onChange={(event) => setRebarDiameterInput(event.target.value)}
            aria-label="Øs, мм"
          />
        </label>
      </div>

      {report.valid && report.values ? (
        <div className="minimum-reinforcement-summary" aria-live="polite">
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
        </div>
      ) : null}

      <section
        className="minimum-reinforcement-diagrams"
        aria-labelledby="minimum-diagrams-title"
      >
        <h3 id="minimum-diagrams-title">Позначення величин</h3>
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
      </section>

      {report.errors.length > 0 ? (
        <div className="minimum-reinforcement-errors" role="alert">
          <ul>
            {report.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {report.warnings.length > 0 ? (
        <div className="minimum-reinforcement-warning" role="status">
          {report.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}

      <section className="minimum-reinforcement-report" aria-labelledby="minimum-report-title">
        <div className="minimum-reinforcement-report__head">
          <h3 id="minimum-report-title">Покроковий звіт</h3>
        </div>

        <ol className="minimum-reinforcement-report__steps">
          {report.steps.map((step) => (
            <li key={step.key} className="minimum-reinforcement-report__step">
              <p className="minimum-reinforcement-report__caption">
                <FormulaText text={step.caption} />
              </p>
              {step.items ? (
                <ul className="minimum-reinforcement-report__items">
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
