"use client";

import { useMemo, useState } from "react";

import {
  CASSOON_LOAD_DISTRIBUTION_SOURCE,
  formatCassoonLoadDistributionNumber,
  getCassoonLoadDistributionReport,
  type CassoonLoadDistributionReportStep,
} from "@/lib/cassoon-load-distribution";

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

function parseNumberInput(value: string): number {
  return Number.parseFloat(value.replace(",", "."));
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

function LoadDistributionDiagram() {
  return (
    <figure className="cassoon-load-diagram">
      <svg
        role="img"
        aria-label="Книжкова схема розподілу навантаження q між напрямами lk і ld за рисунком VII.40"
        viewBox="0 0 565 285"
      >
        <defs>
          <marker
            id="cassoon-arrow"
            viewBox="0 0 10 8"
            refX="5"
            refY="4"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L10 4 L0 8 Z" />
          </marker>
          <pattern
            id="cassoon-hatch"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(90)"
          >
            <path d="M0 0 H6" />
          </pattern>
          <pattern
            id="cassoon-diagonal-hatch"
            width="7"
            height="7"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <path d="M0 0 H7" />
          </pattern>
          <pattern
            id="cassoon-horizontal-hatch"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
          >
            <path d="M0 0 H6" />
          </pattern>
        </defs>

        <g className="cassoon-load-diagram__book">
          <g transform="translate(34 34)">
            <rect x="18" y="32" width="126" height="82" className="cassoon-load-diagram__slab" />
            <rect x="18" y="67" width="126" height="15" className="cassoon-load-diagram__load-fill" />
            <rect x="74" y="32" width="15" height="82" className="cassoon-load-diagram__load-fill" />
            <line x1="18" y1="24" x2="144" y2="24" markerStart="url(#cassoon-arrow)" markerEnd="url(#cassoon-arrow)" className="cassoon-load-diagram__dimension" />
            <line x1="10" y1="32" x2="10" y2="114" markerStart="url(#cassoon-arrow)" markerEnd="url(#cassoon-arrow)" className="cassoon-load-diagram__dimension" />
            <rect x="72" y="8" width="18" height="13" className="cassoon-load-diagram__label-bg" />
            <text x="81" y="18" className="cassoon-load-diagram__label cassoon-load-diagram__label--middle">ld</text>
            <rect x="-5" y="68" width="18" height="13" className="cassoon-load-diagram__label-bg" />
            <text x="4" y="78" className="cassoon-load-diagram__label cassoon-load-diagram__label--middle">lk</text>
            <text x="79" y="142" className="cassoon-load-diagram__caption">а</text>
            <text x="52" y="161" className="cassoon-load-diagram__caption">ld/lk ≤ 2</text>
          </g>

          <g transform="translate(203 34)">
            <rect x="18" y="32" width="126" height="82" className="cassoon-load-diagram__slab" />
            <rect x="18" y="10" width="126" height="17" className="cassoon-load-diagram__load-fill" />
            <rect x="18" y="67" width="126" height="15" className="cassoon-load-diagram__load-fill" />
            <line x1="18" y1="2" x2="144" y2="2" markerStart="url(#cassoon-arrow)" markerEnd="url(#cassoon-arrow)" className="cassoon-load-diagram__dimension" />
            <line x1="10" y1="32" x2="10" y2="114" markerStart="url(#cassoon-arrow)" markerEnd="url(#cassoon-arrow)" className="cassoon-load-diagram__dimension" />
            <rect x="72" y="-17" width="18" height="13" className="cassoon-load-diagram__label-bg" />
            <text x="81" y="-7" className="cassoon-load-diagram__label cassoon-load-diagram__label--middle">ld</text>
            <rect x="-5" y="68" width="18" height="13" className="cassoon-load-diagram__label-bg" />
            <text x="4" y="78" className="cassoon-load-diagram__label cassoon-load-diagram__label--middle">lk</text>
            <rect x="146" y="14" width="13" height="13" className="cassoon-load-diagram__label-bg" />
            <text x="152" y="24" className="cassoon-load-diagram__label cassoon-load-diagram__label--middle">q</text>
            <text x="79" y="142" className="cassoon-load-diagram__caption">б</text>
            <text x="52" y="161" className="cassoon-load-diagram__caption">ld/lk &gt; 2</text>
          </g>

          <g transform="translate(392 34)">
            <rect x="18" y="32" width="126" height="82" className="cassoon-load-diagram__slab" />
            <path d="M36 12 H126 L144 32 H18 Z" className="cassoon-load-diagram__load-zone cassoon-load-diagram__load-zone--vertical" />
            <path d="M18 32 L-24 73 L18 114 Z" className="cassoon-load-diagram__load-zone cassoon-load-diagram__load-zone--horizontal" />
            <line x1="18" y1="-5" x2="18" y2="10" markerEnd="url(#cassoon-arrow)" className="cassoon-load-diagram__load-arrow" />
            <line x1="-42" y1="73" x2="-26" y2="73" markerEnd="url(#cassoon-arrow)" className="cassoon-load-diagram__load-arrow" />
            <line x1="18" y1="32" x2="59" y2="73" className="cassoon-load-diagram__guide" />
            <line x1="18" y1="114" x2="59" y2="73" className="cassoon-load-diagram__guide" />
            <line x1="144" y1="32" x2="103" y2="73" className="cassoon-load-diagram__guide" />
            <line x1="144" y1="114" x2="103" y2="73" className="cassoon-load-diagram__guide" />
            <line x1="59" y1="73" x2="103" y2="73" className="cassoon-load-diagram__guide" />
            <line x1="46" y1="56" x2="132" y2="56" markerStart="url(#cassoon-arrow)" markerEnd="url(#cassoon-arrow)" className="cassoon-load-diagram__dimension" />
            <line x1="27" y1="42" x2="27" y2="104" markerStart="url(#cassoon-arrow)" markerEnd="url(#cassoon-arrow)" className="cassoon-load-diagram__dimension" />
            <rect x="80" y="42" width="18" height="13" className="cassoon-load-diagram__label-bg" />
            <text x="89" y="52" className="cassoon-load-diagram__label cassoon-load-diagram__label--middle">ld</text>
            <rect x="31" y="68" width="18" height="13" className="cassoon-load-diagram__label-bg" />
            <text x="40" y="78" className="cassoon-load-diagram__label cassoon-load-diagram__label--middle">lk</text>
            <rect x="73" y="18" width="22" height="13" className="cassoon-load-diagram__label-bg" />
            <text x="84" y="28" className="cassoon-load-diagram__label cassoon-load-diagram__label--middle">qk</text>
            <rect x="-20" y="66" width="22" height="13" className="cassoon-load-diagram__label-bg" />
            <text x="-9" y="76" className="cassoon-load-diagram__label cassoon-load-diagram__label--middle">qd</text>
            <rect x="22" y="-6" width="13" height="13" className="cassoon-load-diagram__label-bg" />
            <text x="28" y="4" className="cassoon-load-diagram__label cassoon-load-diagram__label--middle">q</text>
            <rect x="-39" y="58" width="13" height="13" className="cassoon-load-diagram__label-bg" />
            <text x="-33" y="68" className="cassoon-load-diagram__label cassoon-load-diagram__label--middle">q</text>
            <rect x="149" y="68" width="13" height="13" className="cassoon-load-diagram__label-bg" />
            <text x="155" y="78" className="cassoon-load-diagram__label cassoon-load-diagram__label--middle">q</text>
            <text x="79" y="142" className="cassoon-load-diagram__caption">в</text>
            <text x="52" y="161" className="cassoon-load-diagram__caption">ld/lk &lt; 2</text>
          </g>

          <text x="282" y="264" className="cassoon-load-diagram__figure-title">
            Рис. VII.40. Розподіл навантаження за напрямами lk і ld
          </text>
        </g>
      </svg>
      <figcaption>
        Схема стилізована під книжкове креслення: а - двонапрямний розподіл;
        б - балкова схема при ld/lk &gt; 2; в - розподіл по трапеціях і
        трикутниках.
      </figcaption>
    </figure>
  );
}

export function CassoonLoadDistributionCalculator() {
  const [shortSpanInput, setShortSpanInput] = useState("3");
  const [longSpanInput, setLongSpanInput] = useState("6");
  const [totalLoadInput, setTotalLoadInput] = useState("10");

  const report = useMemo(
    () =>
      getCassoonLoadDistributionReport({
        shortSpanM: parseNumberInput(shortSpanInput),
        longSpanM: parseNumberInput(longSpanInput),
        totalLoadKnM2: parseNumberInput(totalLoadInput),
      }),
    [longSpanInput, shortSpanInput, totalLoadInput],
  );

  return (
    <div
      className="cassoon-load-calculator"
      aria-label="Калькулятор коефіцієнтів c1 і c2 для розподілу навантаження"
    >
      <div className="cassoon-load-layout">
        <div className="cassoon-load-controls">
          <label className="cassoon-load-field">
            <span>
              <MathNotation base="l" subscript="k" ariaLabel="lk" />
              <span className="math-notation__unit">, м</span>
            </span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              value={shortSpanInput}
              onChange={(event) => setShortSpanInput(event.target.value)}
              aria-label="lk, м"
            />
          </label>

          <label className="cassoon-load-field">
            <span>
              <MathNotation base="l" subscript="d" ariaLabel="ld" />
              <span className="math-notation__unit">, м</span>
            </span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              value={longSpanInput}
              onChange={(event) => setLongSpanInput(event.target.value)}
              aria-label="ld, м"
            />
          </label>

          <label className="cassoon-load-field">
            <span>
              <MathNotation base="q" ariaLabel="q" />
              <span className="math-notation__unit">, кН/м²</span>
            </span>
            <input
              type="number"
              inputMode="decimal"
              min="0"
              step="0.1"
              value={totalLoadInput}
              onChange={(event) => setTotalLoadInput(event.target.value)}
              aria-label="q, кН/м²"
            />
          </label>
        </div>

        <LoadDistributionDiagram />
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
              report.values.shortDirectionLoadKnM2,
              2,
            )}{" "}
            кН/м²; <MathNotation base="q" subscript="d" ariaLabel="qd" /> ={" "}
            {formatCassoonLoadDistributionNumber(
              report.values.longDirectionLoadKnM2,
              2,
            )}{" "}
            кН/м².
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
