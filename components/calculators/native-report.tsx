"use client";

import type { ReactNode } from "react";

import { ReportFormula } from "./report-formula";

export type NativeReportStep = {
  key: string;
  caption: string;
  items?: string[];
  notes?: string[];
  formula?: string;
  formulas?: string[];
  resultItems?: string[];
  table?: { columns: string[]; rows: string[][] };
};

type NativeReportProps = {
  titleId: string;
  title: string;
  steps: NativeReportStep[];
  actions?: ReactNode;
  renderText?: (text: string) => ReactNode;
};

export function NativeReport({
  titleId,
  title,
  steps,
  actions,
  renderText = (text) => text,
}: NativeReportProps) {
  return (
    <section className="native-report" aria-labelledby={titleId}>
      <div className="native-report__head">
        <h3 id={titleId}>{title}</h3>
        {actions}
      </div>
      <ol className="native-report__steps">
        {steps.map((step) => {
          const formulas = [
            ...(step.formula ? [step.formula] : []),
            ...(step.formulas ?? []),
          ];

          return (
            <li key={step.key} className="native-report__step">
              <p className="native-report__caption">{renderText(step.caption)}</p>
              {step.items?.length ? (
                <ul className="native-report__items">
                  {step.items.map((item) => (
                    <li key={item}>{renderText(item)}</li>
                  ))}
                </ul>
              ) : null}
              {step.notes?.length ? (
                <div className="native-report__notes">
                  {step.notes.map((note) => (
                    <p key={note}>{renderText(note)}</p>
                  ))}
                </div>
              ) : null}
              {step.table ? (
                <div className="native-report__table-wrap">
                  <table className="native-report__table">
                    <thead>
                      <tr>
                        {step.table.columns.map((column) => (
                          <th key={column} scope="col">
                            {renderText(column)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {step.table.rows.map((row, rowIndex) => (
                        <tr key={`${step.key}-${rowIndex}`}>
                          {row.map((cell, cellIndex) => (
                            <td key={`${step.key}-${rowIndex}-${cellIndex}`}>
                              {renderText(cell)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
              {formulas.map((formula) => (
                <ReportFormula
                  className="native-report__formula"
                  formula={formula}
                  key={formula}
                  renderFallback={renderText}
                />
              ))}
              {step.resultItems?.length ? (
                <ul className="native-report__result-items">
                  {step.resultItems.map((item) => (
                    <li key={item}>{renderText(item)}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
