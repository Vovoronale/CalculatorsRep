export type DocxReportStep = {
  key: string;
  caption: string;
  items?: string[];
  notes?: string[];
  formula?: string;
  formulas?: string[];
  resultItems?: string[];
  table?: { columns: string[]; rows: string[][] };
};

export type DocxReportFigure = {
  key: string;
  caption?: string;
  svg?: string;
  pngData?: ArrayBuffer;
  widthPx: number;
  heightPx: number;
};

export type DocxReportDocument = {
  title: string;
  fileBaseName: string;
  figures?: DocxReportFigure[];
  includeStepHeading?: boolean;
  steps: DocxReportStep[];
};
