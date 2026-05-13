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

function DimensionArrow({
  x1,
  y1,
  x2,
  y2,
  markerId,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  markerId: string;
}) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      markerStart={`url(#${markerId})`}
      markerEnd={`url(#${markerId})`}
    />
  );
}

function NotationDiagram({
  type,
  title,
}: {
  type: MinimumReinforcementStructureType;
  title: string;
}) {
  const isBeam = type === "beam";
  const markerId = `dimension-arrow-${type}`;

  return (
    <figure className="minimum-reinforcement-diagram">
      <svg
        role="img"
        aria-label={title}
        viewBox="0 0 360 220"
        className="minimum-reinforcement-diagram__svg"
      >
        <defs>
          <marker
            id={markerId}
            viewBox="0 0 8 8"
            refX="4"
            refY="4"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L8 4 L0 8 Z" />
          </marker>
        </defs>
        <rect
          x={isBeam ? 118 : 72}
          y={isBeam ? 28 : 72}
          width={isBeam ? 126 : 220}
          height={isBeam ? 156 : 76}
          rx="4"
          className="minimum-reinforcement-diagram__concrete"
        />
        <circle
          cx={isBeam ? 181 : 182}
          cy={isBeam ? 146 : 126}
          r={isBeam ? 10 : 7}
          className="minimum-reinforcement-diagram__bar"
        />
        <g className="minimum-reinforcement-diagram__dimension">
          <DimensionArrow
            markerId={markerId}
            x1={isBeam ? 96 : 48}
            y1={isBeam ? 28 : 72}
            x2={isBeam ? 96 : 48}
            y2={isBeam ? 184 : 148}
          />
          <text x={isBeam ? 78 : 30} y={isBeam ? 110 : 114}>
            h
          </text>
          <DimensionArrow
            markerId={markerId}
            x1={isBeam ? 304 : 318}
            y1={isBeam ? 146 : 126}
            x2={isBeam ? 304 : 318}
            y2={isBeam ? 184 : 148}
          />
          <text x={isBeam ? 314 : 328} y={isBeam ? 170 : 141}>
            a_s
          </text>
          <DimensionArrow
            markerId={markerId}
            x1={isBeam ? 118 : 72}
            y1={isBeam ? 198 : 52}
            x2={isBeam ? 244 : 292}
            y2={isBeam ? 198 : 52}
          />
          <text x={isBeam ? 176 : 174} y={isBeam ? 214 : 44}>
            bt
          </text>
          <DimensionArrow
            markerId={markerId}
            x1={isBeam ? 274 : 318}
            y1={isBeam ? 28 : 72}
            x2={isBeam ? 274 : 318}
            y2={isBeam ? 146 : 126}
          />
          <text x={isBeam ? 284 : 328} y={isBeam ? 90 : 104}>
            d
          </text>
          <DimensionArrow
            markerId={markerId}
            x1={isBeam ? 171 : 175}
            y1={isBeam ? 124 : 108}
            x2={isBeam ? 191 : 189}
            y2={isBeam ? 124 : 108}
          />
          <text x={isBeam ? 166 : 167} y={isBeam ? 118 : 102}>
            Øs
          </text>
        </g>
      </svg>
      <figcaption>{title}</figcaption>
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
          <NotationDiagram type="beam" title="Позначення величин для балки" />
          <NotationDiagram type="slab" title="Позначення величин для плити" />
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
