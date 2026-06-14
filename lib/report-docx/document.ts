import {
  Document,
  HeadingLevel,
  ImageRun,
  Paragraph,
  TextRun,
} from "docx";

import { createDocxMathParagraphs } from "./math-docx";
import { parseDocxFormula } from "./math-parser";
import type { DocxReportDocument, DocxReportFigure, DocxReportStep } from "./types";

export type FormulaRenderPlan =
  | { mode: "math"; paragraphs: Paragraph[] }
  | { mode: "text"; text: string };

function textParagraph(text: string, options: { italic?: boolean; bold?: boolean } = {}) {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        italics: options.italic,
        bold: options.bold,
      }),
    ],
  });
}

function figureParagraphs(figure: DocxReportFigure): Paragraph[] {
  if (!figure.pngData) return [];

  const maxWidthPx = 560;
  const scale = Math.min(1, maxWidthPx / figure.widthPx);
  const width = Math.round(figure.widthPx * scale);
  const height = Math.round(figure.heightPx * scale);

  return [
    new Paragraph({
      children: [
        new ImageRun({
          type: "png",
          data: figure.pngData,
          transformation: { width, height },
        }),
      ],
    }),
    ...(figure.caption ? [textParagraph(figure.caption, { italic: true })] : []),
  ];
}

function formulaParagraphs(formula: string): Paragraph[] {
  const plan = getFormulaRenderPlan(formula);

  if (plan.mode === "math") return plan.paragraphs;

  return [textParagraph(plan.text)];
}

function stepParagraphs(step: DocxReportStep, index: number): Paragraph[] {
  const formulas = [
    ...(step.formula ? [step.formula] : []),
    ...(step.formulas ?? []),
  ];

  return [
    textParagraph(`${index + 1}. ${step.caption}`, { bold: true }),
    ...(step.items ?? []).map((item) =>
      new Paragraph({
        bullet: { level: 0 },
        children: [new TextRun(item)],
      }),
    ),
    ...(step.notes ?? []).map((note) => textParagraph(note, { italic: true })),
    ...formulas.flatMap(formulaParagraphs),
  ];
}

export function getFormulaRenderPlan(formula: string): FormulaRenderPlan {
  const parsed = parseDocxFormula(formula);

  if (!parsed.ok) {
    return { mode: "text", text: formula };
  }

  return {
    mode: "math",
    paragraphs: createDocxMathParagraphs(parsed.statements),
  };
}

export function buildReportDocxDocument(report: DocxReportDocument): Document {
  const children: Paragraph[] = [
    new Paragraph({
      heading: HeadingLevel.TITLE,
      children: [new TextRun(report.title)],
    }),
    ...(report.figures ?? []).flatMap(figureParagraphs),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun("Покроковий звіт")],
    }),
    ...report.steps.flatMap(stepParagraphs),
  ];

  return new Document({
    sections: [
      {
        children,
      },
    ],
  });
}
