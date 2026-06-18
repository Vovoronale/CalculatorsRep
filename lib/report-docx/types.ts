export type DocxReportStep = {
  key: string;
  caption: string;
  items?: string[];
  notes?: string[];
  formula?: string;
  formulas?: string[];
  resultItems?: string[];
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
  steps: DocxReportStep[];
};
