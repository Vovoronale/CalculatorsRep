import { Packer } from "docx";
import JSZip from "jszip";
import { describe, expect, it } from "vitest";

import { buildReportDocxDocument, getFormulaRenderPlan } from "./document";
import type { DocxReportDocument } from "./types";

const documentModel: DocxReportDocument = {
  title: "Покроковий звіт",
  fileBaseName: "test-report",
  steps: [
    {
      key: "r",
      caption: "Визначення R (формула Е.1):",
      items: ["b = 1 м"],
      notes: ["Примітка"],
      formula: "R = γc1 * γc2 / k = 162.82 кПа",
    },
  ],
};

describe("buildReportDocxDocument", () => {
  it("builds a docx document from report steps", () => {
    expect(() => buildReportDocxDocument(documentModel)).not.toThrow();
  });

  it("adds a centered current-page number to the footer", async () => {
    const buffer = await Packer.toBuffer(buildReportDocxDocument(documentModel));
    const zip = await JSZip.loadAsync(buffer);
    const footer = await zip.file("word/footer1.xml")?.async("string");

    expect(footer).toContain("Сторінка");
    expect(footer).toContain("PAGE");
  });

  it("plans math paragraphs for supported formulas", () => {
    const plan = getFormulaRenderPlan("R = γc1 * γc2 / k = 162.82 кПа");

    expect(plan.mode).toBe("math");
    if (plan.mode !== "math") throw new Error("Expected math render plan");
    expect(plan.paragraphs).toHaveLength(1);
  });

  it("plans fallback text for unsupported formulas", () => {
    expect(getFormulaRenderPlan("Приймаємо значення з таблиці")).toEqual({
      mode: "text",
      text: "Приймаємо значення з таблиці",
    });
  });
});
