"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";

import {
  FOUNDATION_BAR_ANCHORAGE_NORMATIVE_REFERENCES,
  formatFoundationAnchorageNumber,
  getFoundationBarAnchorageReport,
  type FoundationAnchorageBarAngle,
  type FoundationAnchorageKScheme,
  type FoundationAnchorageShape,
  type FoundationAnchorageStructureType,
  type FoundationBarAnchorageReportStep,
} from "@/lib/foundation-bar-anchorage";
import { getConcreteClasses, type ConcreteClassName } from "@/lib/materials/concrete";
import { getRebarClasses, type RebarClassName } from "@/lib/materials/rebar";

import { MathNotation } from "./math-notation";

const DEFAULT_CONCRETE_CLASS: ConcreteClassName = "C30/37";
const DEFAULT_REBAR_CLASS: RebarClassName = "A500C";

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
  "alpha235": { base: "α", subscript: "235", ariaLabel: "alpha235" },
  "alpha1": { base: "α", subscript: "1", ariaLabel: "alpha1" },
  "alpha2": { base: "α", subscript: "2", ariaLabel: "alpha2" },
  "alpha3": { base: "α", subscript: "3", ariaLabel: "alpha3" },
  "alpha4": { base: "α", subscript: "4", ariaLabel: "alpha4" },
  "alpha5": { base: "α", subscript: "5", ariaLabel: "alpha5" },
  "eta1": { base: "η", subscript: "1", ariaLabel: "eta1" },
  "eta2": { base: "η", subscript: "2", ariaLabel: "eta2" },
  "fctd": { base: "f", subscript: "ctd", ariaLabel: "fctd" },
  "fbd": { base: "f", subscript: "bd", ariaLabel: "fbd" },
  "qmax": { base: "q", subscript: "max", ariaLabel: "qmax" },
  "qmin": { base: "q", subscript: "min", ariaLabel: "qmin" },
  "Mtot": { base: "M", subscript: "tot", ariaLabel: "Mtot" },
  "hQ": { base: "h", subscript: "Q", ariaLabel: "hQ" },
  "MQ": { base: "M", subscript: "Q", ariaLabel: "MQ" },
  "qx": { base: "q", subscript: "x", ariaLabel: "qx" },
  "qm": { base: "q", subscript: "m", ariaLabel: "qm" },
  "ze": { base: "z", subscript: "e", ariaLabel: "ze" },
  "zi": { base: "z", subscript: "i", ariaLabel: "zi" },
  "Fs": { base: "F", subscript: "s", ariaLabel: "Fs" },
  "lb": { base: "l", subscript: "b", ariaLabel: "lb" },
  "lbd": { base: "l", subscript: "bd", ariaLabel: "lbd" },
  "cd": { base: "c", subscript: "d", ariaLabel: "cd" },
  "Ø": { base: "Ø", ariaLabel: "Ø" },
  "N": { base: "N", ariaLabel: "N" },
  "M": { base: "M", ariaLabel: "M" },
  "Q": { base: "Q", ariaLabel: "Q" },
  "R": { base: "R", ariaLabel: "R" },
  "L": { base: "L", ariaLabel: "L" },
  "B": { base: "B", ariaLabel: "B" },
  "h": { base: "h", ariaLabel: "h" },
  "d": { base: "d", ariaLabel: "d" },
  "b": { base: "b", ariaLabel: "b" },
  "x": { base: "x", ariaLabel: "x" },
  "e": { base: "e", ariaLabel: "e" },
  "K": { base: "K", ariaLabel: "K" },
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

const REPORT_STEP_IDS: Partial<Record<FoundationBarAnchorageReportStep["key"], string>> = {
  "shear-moment": "foundation-step-shear-moment",
  "total-moment": "foundation-step-total-moment",
  "mean-soil-pressure": "foundation-step-mean-soil-pressure",
  "critical-distance": "foundation-step-critical-distance",
  "soil-resultant": "foundation-step-soil-resultant",
  "external-lever-arm": "foundation-step-external-lever-arm",
  "internal-lever-arm": "foundation-step-internal-lever-arm",
  eta1: "foundation-step-eta1",
  "lb-available": "foundation-step-lb-available",
};

function isFormulaBoundary(value: string | undefined): boolean {
  return !value || !/[A-Za-z0-9_,.]/.test(value);
}

function parseNumberInput(value: string): number {
  return Number.parseFloat(value.replace(",", "."));
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
        <span key={`text:${lastIndex}`}>{renderFormulaText(text.slice(lastIndex, match.index))}</span>,
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

function ReportStepFormula({ step }: { step: FoundationBarAnchorageReportStep }) {
  if (!step.formula) return null;

  return (
    <div className="foundation-anchorage-equation" aria-label={step.formula} title={step.formula}>
      {renderFormulaText(step.formula)}
    </div>
  );
}

function FieldNormLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a className="foundation-anchorage-field__link" href={href}>
      {children}
    </a>
  );
}

function FieldLabel({
  symbol,
  description,
  href,
  norm,
}: {
  symbol: ReactNode;
  description: ReactNode;
  href: string;
  norm: string;
}) {
  return (
    <span className="foundation-anchorage-field__label">
      <span>
        <strong>{symbol}</strong> - {description}
      </span>
      <FieldNormLink href={href}>{norm}</FieldNormLink>
    </span>
  );
}

function GroupLegend({
  title,
  description,
  href,
  norm,
}: {
  title: ReactNode;
  description: ReactNode;
  href: string;
  norm: string;
}) {
  return (
    <legend>
      <span className="foundation-anchorage-group__label">
        <span>
          <strong>{title}</strong> - {description}
        </span>
        <FieldNormLink href={href}>{norm}</FieldNormLink>
      </span>
    </legend>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min = "0",
  step = "1",
}: {
  label: ReactNode;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  step?: string;
}) {
  return (
    <label className="foundation-anchorage-field foundation-anchorage-field--number">
      <span>{label}</span>
      <input
        type="number"
        inputMode="decimal"
        min={min}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
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
          <pattern id="foundation-reaction-hatch" width="5" height="5" patternUnits="userSpaceOnUse">
            <line x1="1" y1="0" x2="1" y2="5" className="foundation-anchorage-diagram__hatch" />
          </pattern>
        </defs>

        <path
          d="M58 138 H232 V88 H250 V50 H274 V88 H300 V138 H540 V226 H58 Z"
          className="foundation-anchorage-diagram__outline"
        />
        <line x1="92" y1="205" x2="490" y2="205" className="foundation-anchorage-diagram__bar" />
        <circle cx="250" cy="150" r="4" className="foundation-anchorage-diagram__node" />
        <circle cx="86" cy="205" r="4" className="foundation-anchorage-diagram__node" />

        <path d="M86 205 C126 192 176 168 250 150" className="foundation-anchorage-diagram__crack" />
        <path d="M124 226 C158 206 204 166 250 150" className="foundation-anchorage-diagram__crack" />
        <path d="M178 226 C196 190 226 160 250 150" className="foundation-anchorage-diagram__crack" />
        <path d="M58 230 L58 292" className="foundation-anchorage-diagram__dimension" />
        <path d="M132 230 L132 292" className="foundation-anchorage-diagram__dimension" />
        <path d="M250 56 V226" className="foundation-anchorage-diagram__axis" />
        <path d="M86 206 L250 150" className="foundation-anchorage-diagram__force" markerStart="url(#foundation-arrow-start)" />
        <path d="M250 150 H372" className="foundation-anchorage-diagram__force" markerEnd="url(#foundation-arrow)" />
        <path d="M250 205 H318" className="foundation-anchorage-diagram__force" markerEnd="url(#foundation-arrow)" />
        <path d="M250 38 V150" className="foundation-anchorage-diagram__load" markerEnd="url(#foundation-arrow)" />

        <line x1="88" y1="58" x2="250" y2="58" className="foundation-anchorage-diagram__dimension" markerStart="url(#foundation-arrow-start)" markerEnd="url(#foundation-arrow)" />
        <line x1="88" y1="58" x2="88" y2="128" className="foundation-anchorage-diagram__guide" />
        <line x1="250" y1="58" x2="250" y2="128" className="foundation-anchorage-diagram__guide" />
        <line x1="274" y1="82" x2="300" y2="82" className="foundation-anchorage-diagram__dimension" markerStart="url(#foundation-arrow-start)" markerEnd="url(#foundation-arrow)" />
        <line x1="250" y1="88" x2="300" y2="88" className="foundation-anchorage-diagram__dimension" markerStart="url(#foundation-arrow-start)" markerEnd="url(#foundation-arrow)" />
        <line x1="312" y1="150" x2="312" y2="205" className="foundation-anchorage-diagram__dimension" markerStart="url(#foundation-arrow-start)" markerEnd="url(#foundation-arrow)" />
        <line x1="552" y1="138" x2="552" y2="205" className="foundation-anchorage-diagram__dimension" markerStart="url(#foundation-arrow-start)" markerEnd="url(#foundation-arrow)" />
        <line x1="586" y1="138" x2="586" y2="226" className="foundation-anchorage-diagram__dimension" markerStart="url(#foundation-arrow-start)" markerEnd="url(#foundation-arrow)" />
        <line x1="540" y1="138" x2="602" y2="138" className="foundation-anchorage-diagram__guide" />
        <line x1="540" y1="205" x2="570" y2="205" className="foundation-anchorage-diagram__guide" />
        <line x1="540" y1="226" x2="602" y2="226" className="foundation-anchorage-diagram__guide" />
        <line x1="72" y1="258" x2="132" y2="258" className="foundation-anchorage-diagram__dimension" markerStart="url(#foundation-arrow-start)" markerEnd="url(#foundation-arrow)" />
        <line x1="58" y1="284" x2="132" y2="284" className="foundation-anchorage-diagram__dimension" markerStart="url(#foundation-arrow-start)" markerEnd="url(#foundation-arrow)" />
        <line x1="58" y1="248" x2="58" y2="318" className="foundation-anchorage-diagram__guide" />
        <line x1="132" y1="248" x2="132" y2="318" className="foundation-anchorage-diagram__guide" />

        <path d="M60 306 H540 V346 L132 374 H60 Z" className="foundation-anchorage-diagram__soil" />
        <rect x="60" y="306" width="72" height="72" className="foundation-anchorage-diagram__reaction" />
        <path d="M96 360 V320" className="foundation-anchorage-diagram__load" markerEnd="url(#foundation-arrow)" />
        <line x1="96" y1="226" x2="96" y2="372" className="foundation-anchorage-diagram__guide foundation-anchorage-diagram__guide--dotted" />

        <text x="148" y="48">ze</text>
        <text x="236" y="34">NEd={axialLoad} кН</text>
        <text x="216" y="84">e</text>
        <text x="280" y="76">b={pedestalWidth} мм</text>
        <text x="284" y="144">Fc</text>
        <text x="150" y="194">Fs</text>
        <text x="280" y="196">Fs,max</text>
        <text x="318" y="182">zi</text>
        <text x="558" y="178">d={effectiveDepth} мм</text>
        <text x="592" y="188">h={footingHeight} мм</text>
        <text x="18" y="242">A</text>
        <text x="246" y="242">B</text>
        <text x="82" y="252">lb={availableAnchorageLength} мм</text>
        <text x="86" y="280">x</text>
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

export function FoundationBarAnchorageCalculator() {
  const concreteClasses = useMemo(() => getConcreteClasses(), []);
  const rebarClasses = useMemo(() => getRebarClasses(), []);
  const [structureType, setStructureType] =
    useState<FoundationAnchorageStructureType>("beam");
  const [concreteClass, setConcreteClass] =
    useState<ConcreteClassName>(DEFAULT_CONCRETE_CLASS);
  const [rebarClass, setRebarClass] = useState<RebarClassName>(DEFAULT_REBAR_CLASS);
  const [footingLength, setFootingLength] = useState("3000");
  const [footingWidth, setFootingWidth] = useState("2000");
  const [footingHeight, setFootingHeight] = useState("600");
  const [effectiveDepth, setEffectiveDepth] = useState("550");
  const [pedestalWidth, setPedestalWidth] = useState("400");
  const [availableAnchorageLength, setAvailableAnchorageLength] = useState("700");
  const [axialLoad, setAxialLoad] = useState("1000");
  const [moment, setMoment] = useState("100");
  const [shear, setShear] = useState("50");
  const [shearHeight, setShearHeight] = useState("0.5");
  const [barDiameter, setBarDiameter] = useState("16");
  const [barCount, setBarCount] = useState("4");
  const [barSpacingForArea, setBarSpacingForArea] = useState("150");
  const [hBond, setHBond] = useState("500");
  const [aBottom, setABottom] = useState("200");
  const [barAngle, setBarAngle] = useState<FoundationAnchorageBarAngle>("horizontal");
  const [slipForm, setSlipForm] = useState(false);
  const [anchorageShape, setAnchorageShape] =
    useState<FoundationAnchorageShape>("straight");
  const [coverBottom, setCoverBottom] = useState("50");
  const [coverSide, setCoverSide] = useState("60");
  const [barSpacing, setBarSpacing] = useState("150");
  const [transverseRebarArea, setTransverseRebarArea] = useState("300");
  const [kScheme, setKScheme] = useState<FoundationAnchorageKScheme>("0.05");
  const [weldedTransverseRebar, setWeldedTransverseRebar] = useState(false);
  const [transversePressure, setTransversePressure] = useState("0");

  const report = useMemo(
    () =>
      getFoundationBarAnchorageReport({
        structureType,
        concreteClass,
        rebarClass,
        footingLengthMm: parseNumberInput(footingLength),
        footingWidthMm: parseNumberInput(footingWidth),
        footingHeightMm: parseNumberInput(footingHeight),
        effectiveDepthMm: parseNumberInput(effectiveDepth),
        pedestalWidthMm: parseNumberInput(pedestalWidth),
        availableAnchorageLengthMm: parseNumberInput(availableAnchorageLength),
        axialLoadKn: parseNumberInput(axialLoad),
        momentKnM: parseNumberInput(moment),
        shearKn: parseNumberInput(shear),
        shearHeightM: parseNumberInput(shearHeight),
        barDiameterMm: parseNumberInput(barDiameter),
        barCount: parseNumberInput(barCount),
        barSpacingForAreaMm: parseNumberInput(barSpacingForArea),
        hBondMm: parseNumberInput(hBond),
        aBottomMm: parseNumberInput(aBottom),
        barAngle,
        slipForm,
        anchorageShape,
        coverBottomMm: parseNumberInput(coverBottom),
        coverSideMm: parseNumberInput(coverSide),
        barSpacingMm: parseNumberInput(barSpacing),
        transverseRebarAreaMm2: parseNumberInput(transverseRebarArea),
        kScheme,
        weldedTransverseRebar,
        transversePressureMPa: parseNumberInput(transversePressure),
      }),
    [
      aBottom,
      anchorageShape,
      availableAnchorageLength,
      axialLoad,
      barAngle,
      barCount,
      barDiameter,
      barSpacing,
      barSpacingForArea,
      concreteClass,
      coverBottom,
      coverSide,
      effectiveDepth,
      footingHeight,
      footingLength,
      footingWidth,
      hBond,
      kScheme,
      moment,
      pedestalWidth,
      rebarClass,
      shear,
      shearHeight,
      slipForm,
      structureType,
      transversePressure,
      transverseRebarArea,
      weldedTransverseRebar,
    ],
  );

  return (
    <div
      className="foundation-anchorage-calculator"
      aria-label="Калькулятор анкерування стрижня фундаменту"
    >
      <div className="foundation-anchorage-tabs" role="tablist" aria-label="Розділи калькулятора">
        <a role="tab" aria-selected="true" href="#foundation-anchorage-report">
          Розрахунок
        </a>
        <a role="tab" aria-selected="false" href="#foundation-anchorage-norms">
          Нормативні пункти
        </a>
      </div>

      <div className="foundation-anchorage-controls">
          <fieldset className="foundation-anchorage-group">
          <GroupLegend
            title="Конструкція і матеріали"
            description="базові параметри для вибору нормативних коефіцієнтів і міцностей"
            href="#norm-dstu-7-2-2-2"
            norm="п. 7.2.2.2"
          />
          <label className="foundation-anchorage-field">
            <FieldLabel
              symbol="Тип конструкції"
              description="балка або плита для вибору схеми K"
              href="#norm-dstu-fig-7-4"
              norm="рис. 7.4"
            />
            <select
              value={structureType}
              onChange={(event) =>
                setStructureType(event.target.value as FoundationAnchorageStructureType)
              }
            >
              <option value="beam">Балка</option>
              <option value="slab">Плита</option>
            </select>
          </label>
          <label className="foundation-anchorage-field">
            <FieldLabel
              symbol="Клас бетону"
              description="для визначення fctd"
              href="#norm-dstu-7-2-2-2"
              norm="п. 7.2.2.2"
            />
            <select
              value={concreteClass}
              onChange={(event) => setConcreteClass(event.target.value as ConcreteClassName)}
            >
              {concreteClasses.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </label>
          <label className="foundation-anchorage-field">
            <FieldLabel
              symbol="Клас арматури"
              description="для визначення sigma_sd"
              href="#norm-dstu-7-2-3-2"
              norm="п. 7.2.3.2"
            />
            <select
              value={rebarClass}
              onChange={(event) => setRebarClass(event.target.value as RebarClassName)}
            >
              {rebarClasses.map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </select>
          </label>
          </fieldset>

          <div className="foundation-anchorage-geometry-layout">
            <div className="foundation-anchorage-geometry-controls">
          <fieldset className="foundation-anchorage-group">
          <GroupLegend
            title="Геометрія фундаменту"
            description="розміри для моделі сили розтягу та доступної довжини анкерування"
            href="#norm-dstu-8-8-2-6"
            norm="п. 8.8.2.6"
          />
          <NumberField
            label={
              <FieldLabel
                symbol="L, мм"
                description="розмір фундаменту в напрямку перевірки"
                href="#norm-dstu-8-8-2-7"
                norm="п. 8.8.2.7"
              />
            }
            value={footingLength}
            onChange={setFootingLength}
          />
          <NumberField
            label={
              <FieldLabel
                symbol="B, мм"
                description="ширина фундаменту перпендикулярно напрямку перевірки"
                href="#norm-dstu-8-8-2-5"
                norm="п. 8.8.2.5"
              />
            }
            value={footingWidth}
            onChange={setFootingWidth}
          />
          <NumberField
            label={
              <FieldLabel
                symbol="h, мм"
                description="висота фундаменту для xmin = h / 2"
                href="#norm-dstu-8-8-2-8"
                norm="п. 8.8.2.8"
              />
            }
            value={footingHeight}
            onChange={setFootingHeight}
          />
          <NumberField
            label={
              <FieldLabel
                symbol="d, мм"
                description="робоча висота для zi = 0.9d"
                href="#norm-dstu-8-8-2-6"
                norm="п. 8.8.2.6"
              />
            }
            value={effectiveDepth}
            onChange={setEffectiveDepth}
          />
          <NumberField
            label={
              <FieldLabel
                symbol="b, мм"
                description="ширина уступу для ze = 0.15b"
                href="#norm-dstu-8-8-2-6"
                norm="п. 8.8.2.6"
              />
            }
            value={pedestalWidth}
            onChange={setPedestalWidth}
          />
          <NumberField
            label={
              <FieldLabel
                symbol="lb, мм"
                description="доступна довжина анкерування за геометрією вузла"
                href="#norm-dstu-8-8-2-7"
                norm="п. 8.8.2.7"
              />
            }
            value={availableAnchorageLength}
            onChange={setAvailableAnchorageLength}
          />
          </fieldset>

          <fieldset className="foundation-anchorage-group">
          <GroupLegend
            title="Навантаження на уступі"
            description="зусилля для рівноваги та визначення Fs"
            href="#norm-dstu-8-8-2-5"
            norm="п. 8.8.2.5"
          />
          <NumberField
            label={
              <FieldLabel
                symbol="N, кН"
                description="вертикальне розрахункове навантаження на уступі"
                href="#norm-dstu-8-8-2-5"
                norm="п. 8.8.2.5"
              />
            }
            value={axialLoad}
            onChange={setAxialLoad}
          />
          <NumberField
            label={
              <FieldLabel
                symbol="M, кН*м"
                description="момент на уступі"
                href="#norm-dstu-8-8-2-5"
                norm="п. 8.8.2.5"
              />
            }
            value={moment}
            onChange={setMoment}
          />
          <NumberField
            label={
              <FieldLabel
                symbol="Q, кН"
                description="поперечна сила, що переводиться у додатковий момент"
                href="#norm-dstu-8-8-2-5"
                norm="п. 8.8.2.5"
              />
            }
            value={shear}
            onChange={setShear}
          />
          <NumberField
            label={
              <FieldLabel
                symbol="hQ, м"
                description="висота прикладання Q для MQ = Q * hQ"
                href="#norm-dstu-8-8-2-5"
                norm="п. 8.8.2.5"
              />
            }
            value={shearHeight}
            onChange={setShearHeight}
            step="0.01"
          />
          </fieldset>
            </div>
            <FoundationGeometryDiagram
              footingLength={footingLength}
              footingHeight={footingHeight}
              effectiveDepth={effectiveDepth}
              pedestalWidth={pedestalWidth}
              availableAnchorageLength={availableAnchorageLength}
              axialLoad={axialLoad}
            />
          </div>

          <fieldset className="foundation-anchorage-group">
          <GroupLegend
            title="Анкерована арматура"
            description="дані стрижнів для sigma_sd і lb,rqd"
            href="#norm-dstu-7-2-3-2"
            norm="п. 7.2.3.2"
          />
          <NumberField
            label={
              <FieldLabel
                symbol="Ø, мм"
                description="діаметр анкерованого стрижня"
                href="#norm-dstu-7-2-3-2"
                norm="п. 7.2.3.2"
              />
            }
            value={barDiameter}
            onChange={setBarDiameter}
          />
          {structureType === "beam" ? (
            <NumberField
              label={
                <FieldLabel
                  symbol="n, шт"
                  description="кількість анкерованих стрижнів у перерізі"
                  href="#norm-dstu-7-2-3-2"
                  norm="п. 7.2.3.2"
                />
              }
              value={barCount}
              onChange={setBarCount}
            />
          ) : (
            <NumberField
              label={
                <FieldLabel
                  symbol="s, мм"
                  description="крок стрижнів для площі арматури плити"
                  href="#norm-dstu-7-2-3-2"
                  norm="п. 7.2.3.2"
                />
              }
              value={barSpacingForArea}
              onChange={setBarSpacingForArea}
            />
          )}
          </fieldset>

          <fieldset className="foundation-anchorage-group">
          <GroupLegend
            title="Умови зчеплення eta1"
            description="параметри для вибору eta1"
            href="#norm-dstu-7-2-2-2"
            norm="п. 7.2.2.2"
          />
          <NumberField
            label={
              <FieldLabel
                symbol="h бетонування, мм"
                description="висота бетонування для умов зчеплення"
                href="#norm-dstu-7-2-2-2"
                norm="п. 7.2.2.2"
              />
            }
            value={hBond}
            onChange={setHBond}
          />
          <NumberField
            label={
              <FieldLabel
                symbol="a від низу, мм"
                description="відстань осі стрижня від нижньої грані"
                href="#norm-dstu-7-2-2-2"
                norm="п. 7.2.2.2"
              />
            }
            value={aBottom}
            onChange={setABottom}
          />
          <label className="foundation-anchorage-field">
            <FieldLabel
              symbol="Положення стрижня"
              description="для визначення eta1"
              href="#norm-dstu-7-2-2-2"
              norm="п. 7.2.2.2"
            />
            <select
              value={barAngle}
              onChange={(event) => setBarAngle(event.target.value as FoundationAnchorageBarAngle)}
            >
              <option value="horizontal">Горизонтальний</option>
              <option value="inclined">Похилий/вертикальний 45-90°</option>
            </select>
          </label>
          <label className="foundation-anchorage-toggle">
            <input
              type="checkbox"
              checked={slipForm}
              onChange={(event) => setSlipForm(event.target.checked)}
            />
            <FieldLabel
              symbol="Ковзна опалубка"
              description="зменшує eta1 до 0.7"
              href="#norm-dstu-7-2-2-2"
              norm="п. 7.2.2.2"
            />
          </label>
          </fieldset>

          <fieldset className="foundation-anchorage-group">
          <GroupLegend
            title="Форма анкерування і захисний шар"
            description="параметри для alpha1 і alpha2"
            href="#norm-dstu-table-7-2"
            norm="табл. 7.2"
          />
          <label className="foundation-anchorage-field">
            <FieldLabel
              symbol="Тип анкерування"
              description="форма стрижня для alpha1"
              href="#norm-dstu-table-7-2"
              norm="табл. 7.2"
            />
            <select
              value={anchorageShape}
              onChange={(event) =>
                setAnchorageShape(event.target.value as FoundationAnchorageShape)
              }
            >
              <option value="straight">Прямий стрижень</option>
              <option value="bend">Загин / гак / петля</option>
            </select>
          </label>
          <NumberField
            label={
              <FieldLabel
                symbol="c, мм"
                description="захисний шар для cd за рис. 7.3"
                href="#norm-dstu-fig-7-3"
                norm="рис. 7.3"
              />
            }
            value={coverBottom}
            onChange={setCoverBottom}
          />
          <NumberField
            label={
              <FieldLabel
                symbol="c1, мм"
                description="боковий захисний шар для cd за рис. 7.3"
                href="#norm-dstu-fig-7-3"
                norm="рис. 7.3"
              />
            }
            value={coverSide}
            onChange={setCoverSide}
          />
          <NumberField
            label={
              <FieldLabel
                symbol="a, мм"
                description="відстань між стрижнями для cd за рис. 7.3"
                href="#norm-dstu-fig-7-3"
                norm="рис. 7.3"
              />
            }
            value={barSpacing}
            onChange={setBarSpacing}
          />
          </fieldset>

          <fieldset className="foundation-anchorage-group">
          <GroupLegend
            title="Поперечна арматура і тиск"
            description="параметри для alpha3, alpha4 і alpha5"
            href="#norm-dstu-table-7-2"
            norm="табл. 7.2"
          />
          <NumberField
            label={
              <FieldLabel
                symbol="ΣAst, мм²"
                description="площа поперечної арматури вздовж довжини анкерування"
                href="#norm-dstu-table-7-2"
                norm="табл. 7.2"
              />
            }
            value={transverseRebarArea}
            onChange={setTransverseRebarArea}
          />
          <label className="foundation-anchorage-field">
            <FieldLabel
              symbol="K"
              description="схема поперечної арматури"
              href="#norm-dstu-fig-7-4"
              norm="рис. 7.4"
            />
            <select
              value={kScheme}
              onChange={(event) => setKScheme(event.target.value as FoundationAnchorageKScheme)}
            >
              <option value="0.1">K = 0.1</option>
              <option value="0.05">K = 0.05</option>
              <option value="0">K = 0</option>
            </select>
          </label>
          <NumberField
            label={
              <FieldLabel
                symbol="p, МПа"
                description="поперечний тиск на площину розколювання"
                href="#norm-dstu-table-7-2"
                norm="табл. 7.2"
              />
            }
            value={transversePressure}
            onChange={setTransversePressure}
            step="0.1"
          />
          <label className="foundation-anchorage-toggle">
            <input
              type="checkbox"
              checked={weldedTransverseRebar}
              onChange={(event) => setWeldedTransverseRebar(event.target.checked)}
            />
            <FieldLabel
              symbol="Приварена поперечна арматура"
              description="для alpha4"
              href="#norm-dstu-table-7-2"
              norm="табл. 7.2"
            />
          </label>
          </fieldset>
      </div>

      {report.valid && report.values ? (
        <div className="foundation-anchorage-summary" aria-live="polite">
          <p>
            {report.values.anchorageSufficient
              ? "Анкерування достатнє"
              : "Анкерування недостатнє"}
            : lb = {formatFoundationAnchorageNumber(report.input.availableAnchorageLengthMm)} мм,
            lb,req ={" "}
            {formatFoundationAnchorageNumber(report.values.requiredAnchorageLengthMm)} мм.
          </p>
          <p>
            Fs = {formatFoundationAnchorageNumber(report.values.tensileForceKn)} кН;
            sigma_sd = {formatFoundationAnchorageNumber(report.values.steelStressMPa)} МПа.
          </p>
        </div>
      ) : null}

      {report.errors.length > 0 ? (
        <div className="foundation-anchorage-errors" role="alert">
          <ul>
            {report.errors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {report.warnings.length > 0 ? (
        <div className="foundation-anchorage-warning" role="status">
          {report.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      ) : null}

      <section
        className="foundation-anchorage-report"
        id="foundation-anchorage-report"
        aria-labelledby="foundation-anchorage-report-title"
      >
        <div className="foundation-anchorage-report__head">
          <h3 id="foundation-anchorage-report-title">Покроковий звіт</h3>
        </div>
        <ol className="foundation-anchorage-report__steps">
          {report.steps.map((step) => (
            <li
              key={step.key}
              id={REPORT_STEP_IDS[step.key]}
              className="foundation-anchorage-report__step"
            >
              <p className="foundation-anchorage-report__caption">
                <CaptionText text={step.caption} />
              </p>
              {step.items ? (
                <ul className="foundation-anchorage-report__items">
                  {step.items.map((item) => (
                    <li key={item}>{renderFormulaText(item)}</li>
                  ))}
                </ul>
              ) : null}
              <ReportStepFormula step={step} />
            </li>
          ))}
        </ol>
      </section>

      <section
        className="foundation-anchorage-norms"
        id="foundation-anchorage-norms"
        aria-labelledby="foundation-anchorage-norms-title"
      >
        <div className="foundation-anchorage-report__head">
          <h3 id="foundation-anchorage-norms-title">Нормативні пункти</h3>
        </div>
        <div className="foundation-anchorage-norms__list">
          {FOUNDATION_BAR_ANCHORAGE_NORMATIVE_REFERENCES.map((reference) => (
            <article key={reference.id} id={reference.id} className="foundation-anchorage-norm">
              <h4>{reference.title}</h4>
              <p>{reference.summary}</p>
              <NormativeReferenceFigure title={reference.title} summary={reference.summary} />
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
