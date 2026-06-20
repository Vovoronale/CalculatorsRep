"use client";

import katex from "katex";
import { useMemo, type ReactNode } from "react";

import { parseReportFormula } from "@/lib/report-formula-parser";

type ReportFormulaProps = {
  formula: string;
  className?: string;
  renderFallback?: (text: string) => ReactNode;
};

function joinClassNames(...classNames: Array<string | undefined | false>): string {
  return classNames.filter(Boolean).join(" ");
}

export function ReportFormula({ formula, className, renderFallback }: ReportFormulaProps) {
  const parsed = useMemo(() => parseReportFormula(formula), [formula]);

  if (!parsed.ok) {
    return (
      <div
        className={joinClassNames("report-formula", "report-formula--fallback", className)}
        aria-label={formula}
        title={formula}
      >
        {renderFallback ? renderFallback(formula) : formula}
      </div>
    );
  }

  return (
    <div className={joinClassNames("report-formula", className)} aria-label={formula} title={formula}>
      {parsed.lines.map((line) => (
        <div
          key={line.source}
          className="report-formula__line"
          dangerouslySetInnerHTML={{
            __html: katex.renderToString(line.latex, {
              displayMode: true,
              throwOnError: false,
              strict: "ignore",
              trust: false,
            }),
          }}
        />
      ))}
    </div>
  );
}
