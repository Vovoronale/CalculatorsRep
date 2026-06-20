import { readFileSync } from "node:fs";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NativeReport } from "./native-report";

describe("NativeReport", () => {
  it("keeps result list markers clear of the accent border", () => {
    const css = readFileSync("app/globals.css", "utf8");
    const resultItemsRule = css.match(
      /\.native-report__result-items\s*{([^}]*)}/,
    )?.[1];

    expect(resultItemsRule).toMatch(/border-left:\s*2px\s+solid\s+var\(--accent\);/);
    expect(resultItemsRule).toMatch(/padding-left:\s*18px;/);
  });

  it("renders a semantic summary table", () => {
    render(
      <NativeReport
        title="Розрахунок"
        titleId="report-title"
        steps={[
          {
            key: "summary",
            caption: "Підсумок",
            table: {
              columns: ["Вид", "База", "Площа", "Розташування"],
              rows: [["Дитячі", "Мешканці", "70 м²", "У межах"]],
            },
          },
        ]}
      />,
    );

    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(4);
    expect(screen.getByRole("cell", { name: "70 м²" })).toBeInTheDocument();
  });

  it("renders result items after formulas", () => {
    render(
      <NativeReport
        title="Покроковий звіт"
        titleId="report-title"
        steps={[
          {
            key: "base-group",
            caption: "Визначення початкового показника",
            items: ["S1 = 0 балів — клас відповідальності СС2"],
            formulas: [
              "Stot,base = S1 + S2 + S3,base + S4 + S5 = 0 + 11 + 1 + 7 + 2 = 21 балів",
            ],
            resultItems: ["Початкова група: 3 (Stot,base = 21 балів)"],
          },
        ]}
      />,
    );

    const formula = screen.getByLabelText(
      "Stot,base = S1 + S2 + S3,base + S4 + S5 = 0 + 11 + 1 + 7 + 2 = 21 балів",
    );
    const result = screen.getByText("Початкова група: 3 (Stot,base = 21 балів)");

    expect(formula.compareDocumentPosition(result)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });
});
