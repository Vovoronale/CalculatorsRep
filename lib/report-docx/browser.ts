import { Packer } from "docx";

import { buildReportDocxDocument } from "./document";
import type { DocxReportDocument, DocxReportFigure } from "./types";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Failed to load SVG image for DOCX export."));
    image.src = src;
  });
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
        return;
      }

      reject(new Error("Failed to convert SVG canvas to PNG."));
    }, "image/png");
  });
}

export async function svgToPngArrayBuffer(
  svg: string,
  widthPx: number,
  heightPx: number,
): Promise<ArrayBuffer> {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  try {
    const image = await loadImage(url);
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error("Canvas 2D context is unavailable for DOCX export.");
    }

    canvas.width = widthPx;
    canvas.height = heightPx;
    context.drawImage(image, 0, 0, widthPx, heightPx);

    return await (await canvasToPngBlob(canvas)).arrayBuffer();
  } finally {
    URL.revokeObjectURL(url);
  }
}

export async function prepareReportFigures(
  figures: DocxReportFigure[] = [],
): Promise<DocxReportFigure[]> {
  const preparedFigures: DocxReportFigure[] = [];

  for (const figure of figures) {
    if (figure.pngData || !figure.svg) {
      preparedFigures.push(figure);
      continue;
    }

    try {
      preparedFigures.push({
        ...figure,
        pngData: await svgToPngArrayBuffer(figure.svg, figure.widthPx, figure.heightPx),
      });
    } catch (error) {
      console.warn("Failed to prepare DOCX report figure.", error);
    }
  }

  return preparedFigures;
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  try {
    link.href = url;
    link.download = fileName;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    URL.revokeObjectURL(url);
  }
}

export async function downloadReportDocx(report: DocxReportDocument): Promise<void> {
  const figures = await prepareReportFigures(report.figures);
  const document = buildReportDocxDocument({ ...report, figures });
  const blob = await Packer.toBlob(document);

  triggerDownload(blob, `${report.fileBaseName}.docx`);
}
