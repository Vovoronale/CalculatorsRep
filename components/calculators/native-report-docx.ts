import type { DocxReportDocument, DocxReportFigure } from "@/lib/report-docx/types";

import type { NativeReportStep } from "./native-report";

type BuildNativeDocxReportInput = {
  title: string;
  fileBaseName: string;
  figures?: DocxReportFigure[];
  steps: NativeReportStep[];
  includeStepHeading?: boolean;
};

export function buildNativeDocxReport({
  title,
  fileBaseName,
  figures,
  steps,
  includeStepHeading,
}: BuildNativeDocxReportInput): DocxReportDocument {
  return {
    title,
    fileBaseName,
    ...(figures?.length ? { figures } : {}),
    ...(includeStepHeading === undefined ? {} : { includeStepHeading }),
    steps: steps.map((step) => ({
      key: step.key,
      caption: step.caption,
      ...(step.items ? { items: [...step.items] } : {}),
      ...(step.notes ? { notes: [...step.notes] } : {}),
      ...(step.formula ? { formula: step.formula } : {}),
      ...(step.formulas ? { formulas: [...step.formulas] } : {}),
      ...(step.resultItems ? { resultItems: [...step.resultItems] } : {}),
      ...(step.table
        ? {
            table: {
              columns: [...step.table.columns],
              rows: step.table.rows.map((row) => [...row]),
            },
          }
        : {}),
    })),
  };
}

export function formatDocxFileDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
