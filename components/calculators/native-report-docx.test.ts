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
});
