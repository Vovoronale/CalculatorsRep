import { describe, expect, it } from "vitest";

import { buildNativeDocxReport } from "./native-report-docx";

describe("buildNativeDocxReport", () => {
  it("maps report steps without mutating formula fields", () => {
    const report = buildNativeDocxReport({
      title: "Покроковий звіт",
      fileBaseName: "test-report",
      steps: [
        {
          key: "r",
          caption: "Caption",
          items: ["item"],
          notes: ["note"],
          formula: "R = 120 кПа",
          formulas: ["R = 12 т/м²"],
          resultItems: ["result"],
        },
      ],
    });

    expect(report).toEqual({
      title: "Покроковий звіт",
      fileBaseName: "test-report",
      steps: [
        {
          key: "r",
          caption: "Caption",
          items: ["item"],
          notes: ["note"],
          formula: "R = 120 кПа",
          formulas: ["R = 12 т/м²"],
          resultItems: ["result"],
        },
      ],
    });
  });

  it("maps table data and document heading options", () => {
    const report = buildNativeDocxReport({
      title: "Розрахунок",
      fileBaseName: "test-report",
      includeStepHeading: false,
      steps: [
        {
          key: "summary",
          caption: "Підсумок",
          table: {
            columns: ["Вид", "Площа"],
            rows: [["Дитячі", "70 м²"]],
          },
        },
      ],
    });

    expect(report.includeStepHeading).toBe(false);
    expect(report.steps[0].table).toEqual({
      columns: ["Вид", "Площа"],
      rows: [["Дитячі", "70 м²"]],
    });
  });
});
