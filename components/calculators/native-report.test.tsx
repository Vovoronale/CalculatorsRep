import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { NativeReport } from "./native-report";

describe("NativeReport", () => {
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
