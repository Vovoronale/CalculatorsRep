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
              {formulas.map((formula) => (
                <ReportFormula
                  className="native-report__formula"
                  formula={formula}
                  key={formula}
                />
              ))}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
