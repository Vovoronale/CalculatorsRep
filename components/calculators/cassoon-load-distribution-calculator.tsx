"use client";

import { useMemo, useState } from "react";

import {
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

  return (
    <div
      className="cassoon-load-equation"
      aria-label={step.formula}
      title={step.formula}
    >
      <FormulaText text={step.formula} />
    </div>
  );
}

function LoadDistributionDiagram() {
  return (
    <figure className="cassoon-load-diagram">
      <svg
        role="img"
        aria-label="Схема розподілу навантаження q між напрямами lk і ld"
        viewBox="0 0 420 260"
      >
        <defs>
          <marker
            id="cassoon-arrow"
            viewBox="0 0 8 8"
            refX="4"
            refY="4"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M0 0 L8 4 L0 8 Z" />
          </marker>
          <pattern
            id="cassoon-hatch"
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(90)"
          >
            <path d="M0 0 H8" />
          </pattern>
        </defs>

        <rect x="108" y="54" width="210" height="130" rx="4" className="cassoon-load-diagram__slab" />
        <rect x="108" y="54" width="210" height="130" rx="4" className="cassoon-load-diagram__load-fill" />
        <path d="M108 54 L318 184 M318 54 L108 184" className="cassoon-load-diagram__diagonal" />

        <g className="cassoon-load-diagram__loads">
          <line x1="132" y1="30" x2="132" y2="54" markerEnd="url(#cassoon-arrow)" />
          <line x1="168" y1="30" x2="168" y2="54" markerEnd="url(#cassoon-arrow)" />
          <line x1="204" y1="30" x2="204" y2="54" markerEnd="url(#cassoon-arrow)" />
          <line x1="240" y1="30" x2="240" y2="54" markerEnd="url(#cassoon-arrow)" />
          <line x1="276" y1="30" x2="276" y2="54" markerEnd="url(#cassoon-arrow)" />
          <text x="318" y="38">q</text>
        </g>

        <g className="cassoon-load-diagram__dimension">
          <line x1="108" y1="216" x2="318" y2="216" markerStart="url(#cassoon-arrow)" markerEnd="url(#cassoon-arrow)" />
          <text x="204" y="238">ld</text>
          <line x1="70" y1="54" x2="70" y2="184" markerStart="url(#cassoon-arrow)" markerEnd="url(#cassoon-arrow)" />
          <text x="44" y="123">lk</text>
        </g>

        <g className="cassoon-load-diagram__direction">
          <line x1="150" y1="104" x2="276" y2="104" markerEnd="url(#cassoon-arrow)" />
          <text x="190" y="96">qd</text>
          <line x1="210" y1="166" x2="210" y2="78" markerEnd="url(#cassoon-arrow)" />
          <text x="220" y="126">qk</text>
        </g>
      </svg>
      <figcaption>
        Схема позначень: lk - короткий проліт, ld - довгий проліт, q - повне
        рівномірне навантаження.
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
